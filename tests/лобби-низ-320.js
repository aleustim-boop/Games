/* =====================================================================
   ЛОББИ ШАХМАТ, ШАШЕК, НАРД И ДОМИНО: ПОСЛЕДНЯЯ КАРТОЧКА НАД НИЖНЕЙ ПОЛОСОЙ

   Что проверяем (браузер, playwright): на 320x640 и 390x844 после
   прокрутки #экран-лобби до конца низ самой нижней видимой карточки входа
   не ниже верха полосы «Игры · Рейтинг · Профиль» (.нижние-вкладки).
   Ноль карточек или полосы не найдено — провал, а не пропуск.

   Запуск:   node tests/лобби-низ-320.js
   Подмена css (довод):  node tests/лобби-низ-320.js --css-папка <папка>
             страницы берут style-<игра>.css из этой папки, если файл там есть.
   Ломающий запуск (портит КОПИИ css во временной папке, не проект):
             node tests/лобби-низ-320.js --сломать [папка]
             копии без нижнего отступа лобби обязаны покраснеть у КАЖДОЙ игры;
             игра, у которой в css нет что портить, — тоже провал порчи.
   Снимки 320 после прокрутки: tests/снимки/лобби-низ/<игра>-320.png
             (только в обычном запуске).
   Выход 0 — всё зелёное (в --сломать: всё покраснело как надо), иначе 1.
   Итог строкой «Итого проверок: N, провалов: M».
   Перед запуском: node штаб/браузер-занят.js --ждать
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const КОРЕНЬ = path.join(__dirname, '..');
const { chromium, подготовитьПодделку } = require(path.join(КОРЕНЬ, 'tests', 'браузер-робот.js'));

const ИГРЫ = ['шахматы', 'шашки', 'нарды', 'домино'];
// У домино лобби из трёх карточек помещается в 320x640 без прокрутки: порча отступа его не краснит.
const БЕЗ_ПРОКРУТКИ = ['домино'];
const РАЗМЕРЫ = [{ ш: 320, в: 640 }, { ш: 390, в: 844 }];
const ПАПКА_СНИМКОВ = path.join(КОРЕНЬ, 'tests', 'снимки', 'лобби-низ');
const ДОПУСК = 0.5; // доли пикселя от округления

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2'
};

/** Файловый сервер проекта на свободном порту; подмена css — из папки подмены. */
function поднятьСервер(папкаПодмены) {
  const сервер = http.createServer(function (запрос, ответ) {
    let путь;
    try { путь = decodeURIComponent(запрос.url.split('?')[0]); } catch (e) { путь = '/'; }
    const имя = path.basename(путь);
    let файл = path.join(КОРЕНЬ, путь);
    // Выход за корень проверяем по настоящему пути, до подмены: копия лежит вне проекта.
    const внутри = файл.startsWith(КОРЕНЬ);
    if (внутри && папкаПодмены && /^style(-.+)?\.css$/.test(имя) && path.dirname(путь) === '/') {
      const подмена = path.join(папкаПодмены, имя);
      if (fs.existsSync(подмена)) файл = подмена;
    }
    if (!внутри || !fs.existsSync(файл) || fs.statSync(файл).isDirectory()) {
      ответ.statusCode = 404; ответ.end(); return;
    }
    ответ.setHeader('Content-Type', ТИПЫ[path.extname(файл)] || 'application/octet-stream');
    ответ.end(fs.readFileSync(файл));
  });
  return new Promise(function (готово) {
    сервер.listen(0, '127.0.0.1', function () { готово(сервер); });
  });
}

/** Замер в странице: низ самой нижней видимой карточки и верх полосы вкладок. */
function замерВСтранице() {
  const лобби = document.getElementById('экран-лобби');
  if (!лобби) return { ошибка: 'нет #экран-лобби' };
  const карточки = Array.from(лобби.querySelectorAll('.карточка-входа')).filter(function (к) {
    const р = к.getBoundingClientRect();
    return р.width > 0 && р.height > 0;
  });
  const полоса = лобби.querySelector('.нижние-вкладки') || document.querySelector('.нижние-вкладки');
  const рп = полоса ? полоса.getBoundingClientRect() : null;
  let низ = null;
  карточки.forEach(function (к) {
    const б = к.getBoundingClientRect().bottom;
    if (низ === null || б > низ) низ = б;
  });
  return {
    карточек: карточки.length,
    низ: низ,
    верхПолосы: рп && рп.height > 0 ? рп.top : null
  };
}

/** Один прогон: игра на одной ширине. Возвращает замер и (по желанию) снимок. */
async function замерить(браузер, адрес, игра, размер, снимок) {
  const контекст = await браузер.newContext({ viewport: { width: размер.ш, height: размер.в } });
  const страница = await контекст.newPage();
  try {
    await подготовитьПодделку(страница, {});
    await страница.goto(адрес + '/' + encodeURIComponent(игра) + '.html', { waitUntil: 'load' });
    await страница.waitForFunction(function () {
      const л = document.getElementById('экран-лобби');
      const п = л && (л.querySelector('.нижние-вкладки') || document.querySelector('.нижние-вкладки'));
      return !!п && п.getBoundingClientRect().height > 0;
    }, null, { timeout: 8000 }).catch(function () { /* ноль полосы засчитает проверка ниже */ });
    await страница.evaluate(function () {
      const л = document.getElementById('экран-лобби');
      if (л) л.scrollTop = л.scrollHeight;
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await страница.waitForTimeout(400);
    const м = await страница.evaluate(замерВСтранице);
    if (снимок) {
      fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
      await страница.screenshot({ path: path.join(ПАПКА_СНИМКОВ, игра + '-' + размер.ш + '.png') });
    }
    return м;
  } finally {
    await контекст.close();
  }
}

/** Прогон всех игр и ширин; возвращает строки-результаты. */
async function прогнать(папкаПодмены, снимки) {
  const сервер = await поднятьСервер(папкаПодмены);
  const адрес = 'http://127.0.0.1:' + сервер.address().port;
  const браузер = await chromium.launch();
  const итог = [];
  try {
    for (const игра of ИГРЫ) {
      for (const размер of РАЗМЕРЫ) {
        const м = await замерить(браузер, адрес, игра, размер, снимки && размер.ш === 320);
        let ок = false;
        let причина = '';
        if (м.ошибка) причина = м.ошибка;
        else if (!м.карточек) причина = 'карточек входа не найдено';
        else if (м.верхПолосы === null) причина = 'нижняя полоса не найдена';
        else if (м.низ > м.верхПолосы + ДОПУСК) причина = 'низ карточки ' + м.низ.toFixed(1) + ' > верх полосы ' + м.верхПолосы.toFixed(1);
        else ок = true;
        итог.push({ игра: игра, ширина: размер.ш, ок: ок, причина: причина, замер: м });
      }
    }
  } finally {
    await браузер.close();
    сервер.close();
  }
  return итог;
}

function печать(итог) {
  итог.forEach(function (р) {
    const м = р.замер;
    const числа = m_числа(м);
    console.log((р.ок ? 'ок     ' : 'ПРОВАЛ ') + р.игра + ' ' + р.ширина + ' ' + числа + (р.ок ? '' : ' — ' + р.причина));
  });
}

function m_числа(м) {
  if (!м || м.ошибка) return '';
  const н = function (x) { return x === null ? '—' : x.toFixed(1); };
  return '(низ карточки ' + н(м.низ) + ', верх полосы ' + н(м.верхПолосы) + ', карточек ' + м.карточек + ')';
}

/** Копии css без нижнего отступа лобби: общее правило style.css и padding-bottom с «--вт-панель-низ» в css игр. */
function сделатьИспорченные(папка) {
  const общее = /#экран-лобби:has\(> \.нижние-вкладки\)\s*\{[^}]*\}/g;
  // Второй общий резерв: простое правило «#экран-лобби { … padding-bottom … }» — из него убираем только отступ.
  const общееПросто = /(#экран-лобби\s*\{[^}]*?)padding-bottom\s*:[^;}]*вт-панель-низ[^;}]*;?/g;
  const своё =/padding-bottom\s*:[^;}]*вт-панель-низ[^;}]*;?/g;
  const счёт = {};
  const общийТекст = fs.readFileSync(path.join(КОРЕНЬ, 'общее/css/style.css'), 'utf8');
  const общихПорч = (общийТекст.match(общее) || []).length + (общийТекст.match(общееПросто) || []).length;
  fs.writeFileSync(path.join(папка, 'style.css'), общийТекст.replace(общее, '').replace(общееПросто, '$1'));
  ИГРЫ.forEach(function (игра) {
    const имя = 'style-' + игра + '.css';
    const текст = fs.readFileSync(path.join(КОРЕНЬ, имя), 'utf8');
    счёт[игра] = общихПорч + (текст.match(своё) || []).length;
    fs.writeFileSync(path.join(папка, имя), текст.replace(своё, ''));
  });
  return счёт;
}

function аргумент(имя) {
  const и = process.argv.indexOf(имя);
  return и === -1 ? null : (process.argv[и + 1] && !process.argv[и + 1].startsWith('--') ? process.argv[и + 1] : '');
}

async function главная() {
  if (process.argv.includes('--сломать')) {
    const папка = аргумент('--сломать') || fs.mkdtempSync(path.join(os.tmpdir(), 'лобби-низ-'));
    fs.mkdirSync(папка, { recursive: true });
    const счёт = сделатьИспорченные(папка);
    console.log('Порча в копиях (' + папка + '): убрано отступов ' + JSON.stringify(счёт));
    const итог = await прогнать(папка, false);
    печать(итог);
    let непокраснело = 0;
    ИГРЫ.forEach(function (игра) {
      const красных = итог.filter(function (р) { return р.игра === игра && !р.ок; }).length;
      if (БЕЗ_ПРОКРУТКИ.includes(игра) && счёт[игра]) {
        console.log('без прокрутки (честно не краснеет): ' + игра + ' — лобби помещается в окно, отступу нечего прятать');
      } else if (!счёт[игра] || !красных) {
        непокраснело++;
        console.log('НЕ ПОКРАСНЕЛО: ' + игра + (счёт[игра] ? '' : ' (в css нечего портить)'));
      }
    });
    console.log('Порча: игр, у которых проверка не покраснела: ' + непокраснело + ' из ' + ИГРЫ.length);
    process.exit(непокраснело ? 3 : 0);
  }
  const папкаПодмены = аргумент('--css-папка') || null;
  const итог = await прогнать(папкаПодмены, !папкаПодмены);
  печать(итог);
  const провалов = итог.filter(function (р) { return !р.ок; }).length;
  console.log('Итого проверок: ' + итог.length + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}

главная().catch(function (e) { console.error(e); process.exit(1); });
