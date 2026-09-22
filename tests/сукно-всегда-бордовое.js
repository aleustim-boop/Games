/**
 * Сторож: сукно стола дурака всегда бордовое и не зависит от выбранного фона.
 *
 * Решение владельца от 22.09: сукно одного цвета (бордовый #4f0d10),
 * тема «Отсвет» его не красит (жалоба 21.09: «сукно фиолетовое без бархата»).
 * Если кто-то вернёт зависимость от темы, эта проверка покраснеет.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let проверокВсего = 0;
let проваловВсего = 0;

// Если запрошен ломающий прогон, подготовим копию
const isBreak = process.argv.includes('--сломать');
const isBreakVar = process.argv.includes('--сломать-var');

// Аргумент пути к style.css (если не дан, берём из проекта)
// Ищем первый аргумент, который не флаг
let pathArg = null;
for (let i = 2; i < process.argv.length; i++) {
  if (!process.argv[i].startsWith('--')) {
    pathArg = process.argv[i];
    break;
  }
}
const originalPath = pathArg || path.join(__dirname, '..', 'style.css');

let styleCss = fs.readFileSync(originalPath, 'utf8');

if (isBreak || isBreakVar) {
  const tempPath = path.join(os.tmpdir(), `style-${process.pid}.css`);
  styleCss = fs.readFileSync(originalPath, 'utf8');

  if (isBreak) {
    styleCss += '\n[data-фон="отсвет"] #зона-стола { --сукно: #3c1a5a; --сукно-свет: #3c1a5a; --сукно-тень: #3c1a5a; }';
  }

  if (isBreakVar) {
    styleCss = styleCss.replace(
      /(#зона-стола,\s*\.стол-игры\s*\{[^}]*?)--сукно:\s*#4f0d10/,
      '$1--сукно: var(--цвет-темы)'
    );
  }

  fs.writeFileSync(tempPath, styleCss);
}

/**
 * Найти блок правила по селектору
 * Ищет все вхождения селектора и возвращает тот, который содержит переменные сукна
 */
function findRuleBlock(selector) {
  const escapedSelector = selector.replace(/[.#\[\]()]/g, '\\$&');

  // Ищем селектор на границе правила
  const regex = new RegExp(`(}\\s*)?${escapedSelector}[\\s,{]`, 'gm');
  let match;

  while ((match = regex.exec(styleCss)) !== null) {
    const startPos = match.index;

    // Найдём открывающую скобку после селектора
    const braceStart = styleCss.indexOf('{', startPos);
    if (braceStart === -1) continue;

    // Найдём соответствующую закрывающую скобку
    let depth = 0;
    let braceEnd = -1;
    for (let i = braceStart; i < styleCss.length; i++) {
      if (styleCss[i] === '{') depth++;
      if (styleCss[i] === '}') {
        depth--;
        if (depth === 0) {
          braceEnd = i;
          break;
        }
      }
    }

    if (braceEnd === -1) continue;

    const ruleBlock = styleCss.substring(braceStart, braceEnd + 1);

    // Проверяем, содержит ли это правило переменные сукна
    if (/--сукно/.test(ruleBlock)) {
      return ruleBlock;
    }
  }

  return null;
}

/**
 * Пункт 1: Найдены все три правила по селекторам
 */
function check1() {
  проверокВсего++;
  const selectors = ['#зона-стола', '.пример-перевода', '#рейтинг-главное'];
  const found = [];

  for (const sel of selectors) {
    if (styleCss.includes(sel)) {
      found.push(sel);
    }
  }

  if (found.length === 3) {
    console.log('✓ Пункт 1: все три селектора найдены');
  } else {
    console.log(`✗ Пункт 1: найдено только ${found.length}/3 селекторов (${found.join(', ')})`);
    проваловВсего++;
  }
}

/**
 * Пункт 2: В каждом из трёх правил переменные заданы литералами
 */
function check2() {
  проверокВсего++;

  const selectors = ['#зона-стола', '.пример-перевода', '#рейтинг-главное'];
  let passed = true;

  for (const sel of selectors) {
    const ruleBlock = findRuleBlock(sel);

    if (!ruleBlock) {
      console.log(`✗ Пункт 2: селектор ${sel} не найден в правилах с переменными сукна`);
      passed = false;
      continue;
    }

    // Проверим, что там заданы все три переменные литералами
    const hasLight = /--сукно-свет:\s*#6e181c/.test(ruleBlock);
    const hasMain = /--сукно:\s*#4f0d10/.test(ruleBlock);
    const hasShadow = /--сукно-тень:\s*#2a0507/.test(ruleBlock);

    if (!hasLight || !hasMain || !hasShadow) {
      console.log(`✗ Пункт 2: ${sel} задан неправильно (свет=${hasLight}, основной=${hasMain}, тень=${hasShadow})`);
      passed = false;
    }
  }

  if (passed) {
    console.log('✓ Пункт 2: все переменные заданы верными литералами');
  } else {
    проваловВсего++;
  }
}

/**
 * Пункт 3: Ни одно правило с [data-фон не задаёт --сукно
 */
function check3() {
  проверокВсего++;

  // Ищем селекторы, которые содержат [data-фон
  const dataFonSelector = /[^}]*\[data-фон[^\]]*\][^{]*\{[^}]*\}/g;
  let match;
  let hasSukno = false;

  const savedRegexLastIndex = dataFonSelector.lastIndex;
  while ((match = dataFonSelector.exec(styleCss)) !== null) {
    if (/--сукно/.test(match[0])) {
      console.log(`✗ Пункт 3: найдено правило с [data-фон, которое задаёт --сукно`);
      hasSukno = true;
      break;
    }
  }
  dataFonSelector.lastIndex = savedRegexLastIndex;

  if (!hasSukno) {
    console.log('✓ Пункт 3: ни одно правило с [data-фон не задаёт сукно');
  } else {
    проваловВсего++;
  }
}

/**
 * Пункт 4: В файле нет #3c1a5a
 */
function check4() {
  проверокВсего++;

  if (styleCss.includes('#3c1a5a')) {
    console.log('✗ Пункт 4: найден цвет #3c1a5a (фиолетовый)');
    проваловВсего++;
  } else {
    console.log('✓ Пункт 4: #3c1a5a не найден');
  }
}

/**
 * Пункт 5: Есть комментарий со словами "ВСЕГДА БОРДОВЫЙ"
 */
function check5() {
  проверокВсего++;

  if (/ВСЕГДА\s+БОРДОВЫЙ/.test(styleCss)) {
    console.log('✓ Пункт 5: комментарий "ВСЕГДА БОРДОВЫЙ" найден');
  } else {
    console.log('✗ Пункт 5: комментарий "ВСЕГДА БОРДОВЫЙ" не найден');
    проваловВсего++;
  }
}

// Запустим все проверки
check1();
check2();
check3();
check4();
check5();

// Вывод итога
console.log(`Итого проверок: ${проверокВсего}, провалов: ${проваловВсего}`);

if (проваловВсего > 0) {
  process.exit(1);
}
