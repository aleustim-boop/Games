const fs = require('fs');
const path = require('path');

// Разрешённые файлы в корне проекта
const разрешённыеФайлы = new Set([
  'CLAUDE.md',
  'README.md',
  'ЗАДАЧИ.md',
  'эталон-вида.md',
  'ЗАПУСК-БЕЗ-ВОПРОСОВ.cmd',
  'index.html',
  'шашки.html',
  'шахматы.html',
  'нарды.html',
  'деберц.html',
  'домино.html',
  'морской-бой.html',
  'style.css',
  'style-шашки.css',
  'style-шахматы.css',
  'style-нарды.css',
  'style-деберц.css',
  'style-домино.css',
  'style-коллекция.css',
  'style-морской-бой.css',
  '.gitignore',
  '.gitattributes',
]);

// Разрешённые папки в корне проекта
const разрешённыеПапки = new Set([
  'js',
  'server',
  'bot',
  'tests',
  'img',
  'эталон',
  'штаб',
  'шрифты',
  'снимки',
  '.git',
  '.claude',
  'node_modules',
  '.playwright-mcp',
]);

function проверитьКорень(кореньПроекта = null) {
  if (!кореньПроекта) {
    кореньПроекта = path.join(__dirname, '..');
  }

  const элементы = fs.readdirSync(кореньПроекта);

  const провалы = [];
  let проверок = 0;

  for (const элемент of элементы) {
    проверок++;

    // Пропускаем файлы, начинающиеся с точки (служебные файлы)
    if (элемент.startsWith('.')) {
      continue;
    }

    const полнойПуть = path.join(кореньПроекта, элемент);
    const этоПапка = fs.statSync(полнойПуть).isDirectory();

    if (этоПапка) {
      // Проверяем папку
      if (!разрешённыеПапки.has(элемент)) {
        провалы.push(`  папка: ${элемент}`);
      }
    } else {
      // Проверяем файл
      if (!разрешённыеФайлы.has(элемент)) {
        провалы.push(`  файл: ${элемент}`);
      }
    }
  }

  // Вывод результатов
  console.log(`Итого проверок: ${проверок}, провалов: ${провалы.length}`);

  if (провалы.length > 0) {
    console.log('\nЛишнее в корне проекта:');
    console.log(провалы.join('\n'));
    console.log('\nПодсказка: снимки — в tests/снимки/, черновики — в scratchpad');
    process.exit(1);
  }
}

// Проверяем доводы: --папка=/путь для проверки копии
let папкаДляПроверки = null;
for (const довод of process.argv.slice(2)) {
  if (довод.startsWith('--папка=')) {
    папкаДляПроверки = довод.substring('--папка='.length);
  }
}

проверитьКорень(папкаДляПроверки);
