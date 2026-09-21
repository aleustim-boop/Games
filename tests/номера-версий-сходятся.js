#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const process = require('process');
const { execFileSync } = require('child_process');

// Настоящий корень проекта — откуда всегда берётся git и эталон
const НАСТОЯЩИЙ_КОРЕНЬ = path.join(__dirname, '..');

// Если передано --тестовая-папка=PATH, использовать эту папку для проверок
// Иначе использовать корень проекта
let projectRoot = НАСТОЯЩИЙ_КОРЕНЬ;
const testFolderArg = process.argv.find(arg => arg.startsWith('--тестовая-папка='));
if (testFolderArg) {
  projectRoot = testFolderArg.substring('--тестовая-папка='.length);
}

// Функция для получения содержимого файла из git HEAD
function изГитаHEAD(имя) {
  try {
    return execFileSync('git', ['show', 'HEAD:' + имя], {
      cwd: НАСТОЯЩИЙ_КОРЕНЬ,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
  } catch (err) {
    return null;
  }
}

// Собрать список html-файлов из НАСТОЯЩЕГО проекта (диск, не git — для правильной кодировки имён)
let htmlFilesInHead;
try {
  htmlFilesInHead = fs.readdirSync(НАСТОЯЩИЙ_КОРЕНЬ)
    .filter(file => file.endsWith('.html'))
    .sort();
} catch (err) {
  console.error(`Ошибка при получении списка файлов: ${err.message}`);
  process.exit(1);
}

// Внешние библиотеки, которые не нужно версионировать
const externalDomains = [
  'https://telegram.org/',
  'http://telegram.org/',
];

// Функция для сбора подключений из списка файлов и функции получения содержимого
function собратьПодключения(файлы, получитьСодержимое) {
  const connections = {};

  for (const htmlFile of файлы) {
    const content = получитьСодержимое(htmlFile);
    if (!content) continue;

    const regex = /(?:href|src)="([^"]+)"/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const fullUrl = match[1];

      let isExternal = false;
      for (const domain of externalDomains) {
        if (fullUrl.startsWith(domain)) {
          isExternal = true;
          break;
        }
      }
      if (isExternal) continue;

      let filePath = fullUrl;
      let version = null;

      const versionMatch = fullUrl.match(/\?v=(\d+)$/);
      if (versionMatch) {
        version = versionMatch[1];
        filePath = fullUrl.substring(0, versionMatch.index);
      }

      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }

      if (!connections[filePath]) {
        connections[filePath] = {};
      }
      connections[filePath][htmlFile] = {
        версия: version,
        найден: true
      };
    }
  }

  return connections;
}

// Функция для получения содержимого файла с диска
function получитьСДиска(htmlFile) {
  const htmlPath = path.join(projectRoot, htmlFile);
  try {
    return fs.readFileSync(htmlPath, 'utf8');
  } catch (err) {
    return null;
  }
}

// Собрать подключения из git HEAD (для определения ожидаемых общих файлов)
const expectedConnections = собратьПодключения(htmlFilesInHead, изГитаHEAD);
const expectedCommonFiles = Object.entries(expectedConnections)
  .filter(([_, pages]) => Object.keys(pages).length >= 2)
  .map(([filePath, _]) => filePath);

// Собрать подключения из рабочей копии (с диска, которая может быть тестовой папкой)
const allConnections = собратьПодключения(htmlFilesInHead, получитьСДиска);

// Найти общие файлы в текущей папке (может отличаться от ожидаемых, если ломаем копию)
const commonFiles = Object.entries(allConnections)
  .filter(([_, pages]) => Object.keys(pages).length >= 2)
  .map(([filePath, _]) => filePath);

// Проверка
let totalChecks = 0;
let failures = 0;
const failureDetails = [];

// 1. Проверяем общие файлы
for (const filePath of commonFiles) {
  const pages = allConnections[filePath];
  const pageList = Object.entries(pages);

  // Проверка: файл существует физически (пропускаем при --тестовая-папка,
  // там только html, это нормально)
  if (!testFolderArg) {
    const fullPath = path.join(projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      failures++;
      failureDetails.push(`Файл не найден: ${filePath}`);
      continue;
    }
  }

  // Проверка: у каждого подключения есть ?v=
  for (const [page, info] of pageList) {
    totalChecks++;
    if (info.версия === null) {
      failures++;
      failureDetails.push(
        `Отсутствует номер версии: ${filePath} на странице ${page}`
      );
    }
  }

  // Проверка: номера совпадают на всех страницах, где используется файл
  if (pageList.length > 1) {
    const versions = pageList.map(([_, info]) => info.версия);
    const firstVersion = versions[0];

    if (!versions.every(v => v === firstVersion)) {
      failures++;
      const details = pageList
        .map(([page, info]) => `${page}: ?v=${info.версия}`)
        .join(', ');
      failureDetails.push(`${filePath} — версии разъехались: ${details}`);
    }
  }
}

// 2. Проверяем, что все общие файлы из js/ или style.css не потеряны со страниц
// по сравнению с последним коммитом (HEAD)
for (const filePath of expectedCommonFiles) {
  const isJsOrCss = (filePath === 'style.css' || filePath.startsWith('js/'));
  if (!isJsOrCss) continue;

  // Если сам файл удалён с диска — это законно, пропускаем (но не при --тестовая-папка,
  // там мы проверяем только подключения, не сами файлы)
  if (!testFolderArg) {
    const fullPath = path.join(projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
  }

  const expectedPages = Object.keys(expectedConnections[filePath] || {});

  for (const page of expectedPages) {
    totalChecks++;
    if (!allConnections[filePath]?.[page]) {
      failures++;
      failureDetails.push(
        `Подключение общего файла ${filePath} исчезло со страницы ${page} по сравнению с последним коммитом; если так и задумано — скажите штабу, проверку обновят тем же коммитом`
      );
    }
  }
}

// 3. Проверяем, что у ЛЮБОГО локального подключения (js/ и style.css) есть ?v=
// Это ловит потерю версии у файлов-одиночек, подключённых на одной странице
for (const filePath of Object.keys(allConnections)) {
  // Проверяем версии только для js/ и style.css, картинки и data: URI не нужны
  if (filePath !== 'style.css' && !filePath.startsWith('js/')) {
    continue;
  }

  const pages = allConnections[filePath];
  const pageList = Object.entries(pages);

  // Одиночные файлы (не общие) тоже проверяем на версию
  if (pageList.length === 1) {
    const [page, info] = pageList[0];
    totalChecks++;
    if (info.версия === null) {
      failures++;
      failureDetails.push(
        `Отсутствует номер версии: ${filePath} на странице ${page}`
      );
    }
  }
}

// Вывод результатов
if (failureDetails.length > 0) {
  console.log('Обнаружены проблемы:');
  failureDetails.forEach(detail => console.log(`  ${detail}`));
}

console.log(`Итого проверок: ${totalChecks}, провалов: ${failures}`);

if (failures > 0) {
  process.exit(1);
}
