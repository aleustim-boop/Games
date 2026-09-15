#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const process = require('process');

const projectRoot = path.join(__dirname, '..');
const htmlFiles = ['index.html', 'шашки.html', 'шахматы.html', 'нарды.html'];

// Собрать все ссылки с версиями
const fileVersions = {}; // { "путь/файла": { "страница": версия } }

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(projectRoot, htmlFile);
  try {
    const content = fs.readFileSync(htmlPath, 'utf8');

    // Поиск href="…?v=N" и src="…?v=N"
    const regex = /(?:href|src)="([^"]+\?v=(\d+))"/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const fullUrl = match[1]; // "путь/файла?v=N"
      const version = match[2]; // "N"

      // Парсим путь и версию
      const parts = fullUrl.split('?v=');
      let filePath = parts[0];

      // Удаляем ведущий слэш для абсолютных путей
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }

      if (!fileVersions[filePath]) {
        fileVersions[filePath] = {};
      }
      fileVersions[filePath][htmlFile] = parseInt(version);
    }
  } catch (err) {
    console.error(`Ошибка при чтении ${htmlFile}: ${err.message}`);
    process.exit(1);
  }
}

// Режим --сломать: подменить номер у одной страницы
if (process.argv.includes('--сломать')) {
  const files = Object.keys(fileVersions);
  // Берём первый файл, который используется более чем на одной странице
  for (const file of files) {
    if (Object.keys(fileVersions[file]).length > 1) {
      const pages = Object.keys(fileVersions[file]);
      fileVersions[file][pages[0]]++; // Меняем версию у первой страницы
      break;
    }
  }
}

// Проверка
let totalChecks = 0;
let failures = 0;
const failureDetails = [];

for (const filePath in fileVersions) {
  const pages = fileVersions[filePath];
  const pageList = Object.entries(pages);

  // Проверка: файл существует
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    failures++;
    failureDetails.push(`Файл не найден: ${filePath}`);
    continue; // Не проверяем номера для несуществующего файла
  }

  // Проверка: номера совпадают на всех страницах, которые используют этот файл
  if (pageList.length > 1) {
    totalChecks++;
    const versions = pageList.map(([_, v]) => v);
    const firstVersion = versions[0];

    if (!versions.every(v => v === firstVersion)) {
      failures++;
      const details = pageList
        .map(([page, v]) => `${page}: ?v=${v}`)
        .join(', ');
      failureDetails.push(`${filePath} — ${details}`);
    }
  }
}

// Вывод результатов
if (failureDetails.length > 0) {
  console.log('Расхождения версий:');
  failureDetails.forEach(detail => console.log(`  ${detail}`));
}

console.log(`Итого проверок: ${totalChecks}, провалов: ${failures}`);

if (failures > 0) {
  process.exit(1);
}
