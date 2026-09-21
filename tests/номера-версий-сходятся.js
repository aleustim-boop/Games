#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const process = require('process');

// Если передано --тестовая-папка=PATH, использовать эту папку
// Иначе использовать корень проекта
let projectRoot = path.join(__dirname, '..');
const testFolderArg = process.argv.find(arg => arg.startsWith('--тестовая-папка='));
if (testFolderArg) {
  projectRoot = testFolderArg.substring('--тестовая-папка='.length);
}

// Найти все .html файлы в корне проекта динамически
const htmlFiles = fs.readdirSync(projectRoot)
  .filter(file => file.endsWith('.html'))
  .sort();

// Внешние библиотеки, которые не нужно версионировать
const externalDomains = [
  'https://telegram.org/',
  'http://telegram.org/',
];

// Собрать все подключения файлов со всех страниц
// { "путь/файла": { "страница": { версия: "24" или null, "найден": true } } }
const allConnections = {};

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(projectRoot, htmlFile);
  try {
    const content = fs.readFileSync(htmlPath, 'utf8');

    // Найти ВСЕ подключения файлов: href="..." и src="..."
    // Паттерн: href или src = кавычка, потом всё до кавычки, потом кавычка
    const regex = /(?:href|src)="([^"]+)"/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const fullUrl = match[1]; // "путь/файла" или "путь/файла?v=24"

      // Пропустим внешние библиотеки
      let isExternal = false;
      for (const domain of externalDomains) {
        if (fullUrl.startsWith(domain)) {
          isExternal = true;
          break;
        }
      }
      if (isExternal) continue;

      // Парсим путь и версию
      let filePath = fullUrl;
      let version = null;

      // Проверяем, есть ли ?v=ЧИСЛО
      const versionMatch = fullUrl.match(/\?v=(\d+)$/);
      if (versionMatch) {
        version = versionMatch[1];
        filePath = fullUrl.substring(0, versionMatch.index);
      }

      // Удаляем ведущий слэш для абсолютных путей
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }

      if (!allConnections[filePath]) {
        allConnections[filePath] = {};
      }
      allConnections[filePath][htmlFile] = {
        версия: version,
        найден: true
      };
    }
  } catch (err) {
    console.error(`Ошибка при чтении ${htmlFile}: ${err.message}`);
    process.exit(1);
  }
}


// Найти общие файлы: файлы, подключённые на 2+ страницах
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

  // Проверка: файл существует физически
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    failures++;
    failureDetails.push(`Файл не найден: ${filePath}`);
    continue;
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

// Вывод результатов
if (failureDetails.length > 0) {
  console.log('Обнаружены проблемы:');
  failureDetails.forEach(detail => console.log(`  ${detail}`));
}

console.log(`Итого проверок: ${totalChecks}, провалов: ${failures}`);

if (failures > 0) {
  process.exit(1);
}
