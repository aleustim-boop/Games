#!/usr/bin/env node

/**
 * Проверка: головоломки (2048, маджонг, судоку и т.п.) не должны подключать сетевые компоненты.
 *
 * Риск. Если головоломка объявлена window.ИграСтраницы='...' словом, не внесённым в
 * МЕТКИ_ИГР словаря js/сеть.js, сеть.js молча считает её дураком. Страница работает,
 * но если когда-нибудь понадобится ей сетевой компонент, он молча подключится не в ту
 * игру. Проверка охраняет границу: если страница — не из МЕТКИ_ИГР (головоломка),
 * в ней не должно быть подключений js/онлайн-лобби.js и js/открытые-столы.js.
 *
 * Запуск:
 *   node tests/головоломки-без-сети.js
 *       Проверить корень проекта (по умолчанию)
 *   node tests/головоломки-без-сети.js --папка <путь>
 *       Проверить копию из другой папки (с прежней структурой js/)
 *   node tests/головоломки-без-сети.js --сломать
 *       Ломающий режим: скопировать структуру, добавить запрещённое подключение,
 *       проверка должна покраснеть ровно на подделанной странице.
 *
 * Красное (провал):
 *   — не найден МЕТКИ_ИГР в js/сеть.js (ноль найденного)
 *   — ноль страниц-головоломок (значит, проверка ослепла на новую приём)
 *   — головоломка подключает js/онлайн-лобби.js или js/открытые-столы.js
 *   — режим --сломать не спровоцировал ровно одной ошибки
 *
 * Зелёное (проход):
 *   — головоломки найдены и не имеют сетевых подключений
 *   — сетевые страницы (из МЕТКИ_ИГР или дурак) ок'ed с пометкой
 *   — режим --сломать привёл ровно к одной ошибке на подделанной странице
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Разберу аргументы: --папка <путь> или --сломать
let targetFolder = path.join(__dirname, '..');
let shouldBreak = false;

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--папка' && process.argv[i + 1]) {
    targetFolder = process.argv[++i];
  } else if (process.argv[i] === '--сломать') {
    shouldBreak = true;
  }
}

// === УТИЛИТЫ ===

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function listFilesInDir(dir, pattern) {
  try {
    return fs.readdirSync(dir)
      .filter(f => new RegExp(pattern).test(f))
      .map(f => path.join(dir, f));
  } catch {
    return [];
  }
}

// === ОСНОВНАЯ ЛОГИКА ===

let errors = [];
let passed = [];

// 1. Прочитать МЕТКИ_ИГР из js/сеть.js
const networkFile = path.join(targetFolder, 'js', 'сеть.js');
const networkContent = readFile(networkFile);

if (!networkContent) {
  console.error(`ПЛОХО — js/сеть.js не найден: ${networkFile}`);
  process.exit(1);
}

// Найти МЕТКИ_ИГР регулярным выражением
const metkiMatch = networkContent.match(/const\s+МЕТКИ_ИГР\s*=\s*\{\s*([^}]+)\s*\}/);
if (!metkiMatch || !metkiMatch[1]) {
  console.error('ПЛОХО — МЕТКИ_ИГР не найден в js/сеть.js');
  errors.push('МЕТКИ_ИГР пуст или не найден');
  console.log(`Итого проверок: 1, провалов: 1`);
  process.exit(1);
}

// Парсить МЕТКИ_ИГР: { shashki: 'шашки', durak: 'дурак', … }
const metkiContent = metkiMatch[1];
const ruNamesSet = new Set(); // Русские названия из словаря
const latinKeysMap = {}; // latin -> русский для обратного поиска

// Простой парсинг: найдём все пары 'latin': 'русский'
const pairRegex = /['"]?(\w+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
let pair;
while ((pair = pairRegex.exec(metkiContent)) !== null) {
  const latin = pair[1];
  const russian = pair[2];
  ruNamesSet.add(russian);
  latinKeysMap[russian] = latin;
}

if (ruNamesSet.size === 0) {
  console.error('ПЛОХО — не удалось распарсить МЕТКИ_ИГР');
  errors.push('МЕТКИ_ИГР не распарсен');
  console.log(`Итого проверок: 1, провалов: 1`);
  process.exit(1);
}

console.log(`ок — МЕТКИ_ИГР найден, игры: ${Array.from(ruNamesSet).join(', ')}`);

// === ПОДГОТОВКА К ЛОМАЮЩЕМУ РЕЖИМУ ===

let testFolder = targetFolder;
let brokenHtmlFile = null;

if (shouldBreak) {
  // Копировать весь корень проекта во временную папку
  testFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'головоломки-'));
  console.log(`Ломающий режим: временная папка ${testFolder}`);

  // Скопировать все *.html и папку js/
  const htmlFiles = listFilesInDir(targetFolder, '\\.html$');
  for (const htmlFile of htmlFiles) {
    const name = path.basename(htmlFile);
    fs.copyFileSync(htmlFile, path.join(testFolder, name));
  }

  // Скопировать папку js/ (рекурсивно)
  const jsDir = path.join(targetFolder, 'js');
  const jsTestDir = path.join(testFolder, 'js');
  if (fs.existsSync(jsDir)) {
    if (fs.existsSync(jsTestDir)) fs.rmSync(jsTestDir, { recursive: true });
    fs.cpSync(jsDir, jsTestDir, { recursive: true });
  }

  // Найти первую головоломку (не-из-МЕТКИ_ИГР), модифицировать её
  const htmlFiles2 = listFilesInDir(testFolder, '\\.html$');
  for (const htmlFile of htmlFiles2) {
    const content = readFile(htmlFile);
    if (!content) continue;

    const gameMatch = content.match(/window\.ИграСтраницы\s*=\s*['"]([^'"]+)['"]/);
    if (!gameMatch) continue; // Нет явного объявления

    const gameName = gameMatch[1];
    if (!ruNamesSet.has(gameName)) {
      // Это головоломка! Добавить запрещённое подключение
      brokenHtmlFile = htmlFile;
      const modifiedContent = content.replace(
        '</body>',
        '<script src="js/онлайн-лобби.js"></script>\n</body>'
      );
      fs.writeFileSync(htmlFile, modifiedContent, 'utf-8');
      console.log(`Добавлено запрещённое подключение в ${path.basename(htmlFile)}`);
      break;
    }
  }
}

// === 2. ПРОЙТИ ПО HTML ФАЙЛАМ ===

const htmlFiles = listFilesInDir(testFolder, '\\.html$');
if (htmlFiles.length === 0) {
  console.error(`ПЛОХО — .html файлы не найдены в ${testFolder}`);
  process.exit(1);
}

const puzzlePages = []; // Головоломки (не-из-МЕТКИ_ИГР)
let puzzleChecksPassed = 0;
let puzzleChecksFailed = 0;

for (const htmlFile of htmlFiles) {
  const fileName = path.basename(htmlFile);
  const content = readFile(htmlFile);

  if (!content) {
    continue; // Не смогли прочитать
  }

  // 2.1. Найти window.ИграСтраницы
  const gameMatch = content.match(/window\.ИграСтраницы\s*=\s*['"]([^'"]+)['"]/);
  const gameName = gameMatch ? gameMatch[1] : null;

  // 2.2. Проверить, в ли это МЕТКИ_ИГР или дурак
  const isKnown = gameName && ruNamesSet.has(gameName);
  const isDurak = !gameName; // Явно не сказано → дурак по умолчанию

  if (!isKnown && !isDurak) {
    // Это головоломка!
    puzzlePages.push({ file: htmlFile, name: fileName, gameName });

    // 2.3. Проверить, нет ли запрещённых подключений
    const forbiddenFiles = [
      'js/онлайн-лобби.js',
      'js/открытые-столы.js'
    ];

    let hasForbidden = false;
    for (const forbidden of forbiddenFiles) {
      if (content.includes(`src="${forbidden}`) || content.includes(`src='${forbidden}`)) {
        console.log(`ПЛОХО — ${fileName}: подключено ${forbidden}`);
        errors.push(`${fileName}: ${forbidden}`);
        puzzleChecksFailed++;
        hasForbidden = true;
      }
    }

    if (!hasForbidden) {
      console.log(`ок — ${fileName}: головоломка '${gameName}' без сетевых подключений`);
      puzzleChecksPassed++;
    }
  } else if (isKnown) {
    // Сетевая игра
    console.log(`ок — ${fileName}: сетевая игра '${gameName}'`);
    passed.push(fileName);
  } else if (isDurak) {
    // Дурак (явно не сказано)
    console.log(`ок — ${fileName}: дурак (нет window.ИграСтраницы)`);
    passed.push(fileName);
  }
}

// === 3. ПРОВЕРИТЬ ЛОМАЮЩИЙ РЕЖИМ ===

if (shouldBreak) {
  if (!brokenHtmlFile) {
    console.error('ПЛОХО — ломающий режим: не найдена головоломка для модификации');
    process.exit(1);
  }

  if (puzzleChecksFailed !== 1) {
    console.error(
      `ПЛОХО — ломающий режим: ожидалось ровно 1 ошибка, получено ${puzzleChecksFailed}`
    );
    process.exit(1);
  }

  const brokenFileName = path.basename(brokenHtmlFile);
  if (!errors.some(e => e.startsWith(brokenFileName))) {
    console.error(
      `ПЛОХО — ломающий режим: ошибка не в подделанном файле ${brokenFileName}`
    );
    process.exit(1);
  }

  console.log(`ок — ломающий режим покраснел на ${brokenFileName} как ожидалось`);
}

// === 4. ИТОГОВЫЕ ПРОВЕРКИ ===

let totalChecks = 0;
let totalFails = 0;

// Проверка: головоломки найдены
if (puzzlePages.length === 0 && !shouldBreak) {
  console.error('ПЛОХО — ноль страниц-головоломок найдено (проверка ослепла)');
  errors.push('Ноль головоломок');
  totalFails++;
  totalChecks++;
} else {
  totalChecks++;
}

// Подсчитать ошибки
totalChecks += puzzleChecksPassed + puzzleChecksFailed;
totalFails += puzzleChecksFailed;
totalChecks += passed.length;

// === ВЫВОД ===

console.log('');
console.log(`Найденные страницы-головоломки и их слова:`);
for (const puzzle of puzzlePages) {
  console.log(`  ${puzzle.name}: '${puzzle.gameName}'`);
}

console.log('');
console.log('Сетевые подключения, охраняемые этой проверкой:');
console.log('  js/онлайн-лобби.js (строка подключается на сетевых страницах)');
console.log('  js/открытые-столы.js (строка подключается на сетевых страницах)');

console.log('');
console.log(`Итого проверок: ${totalChecks}, провалов: ${totalFails}`);

// Очистить временную папку ломающего режима
if (shouldBreak && testFolder !== targetFolder) {
  try {
    fs.rmSync(testFolder, { recursive: true, force: true });
  } catch (e) {
    // Игнорируем ошибки удаления
  }
}

if (totalFails > 0) {
  process.exit(1);
}
