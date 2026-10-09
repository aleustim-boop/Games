'use strict';
/* =====================================================================
   ПРОВЕРКА (браузер, нужен playwright): «Захват», лобби в стекле (этап П11).
   На ширинах 390×844 и 320×640 проверяет:
     1. Касание: все кнопки и карточки лобби (видимые) — высота и ширина ≥ 44 px.
     2. Нижняя полоса nav.нижние-вкладки: не заходит в нижнюю безопасную зону (ей задаётся 34 px
        через --отступ-снизу, как у телефона с «чёлкой») и, когда лобби прокручено до конца,
        не перекрывает последнюю карточку («Есть код?»).
     3. Гнездо .фото-лобби__обложка — 16:10 ± 1 px (по высоте от ширины).
     4. Салатовый акцент (класс стекло-акцент) — только у #лобби-найти-игру, и она на виду.
   Ноль найденных узлов — провал.
   Снимки: tests/снимки/захват-парящий/лобби-390.png, лобби-320.png.

   Запуск (перед ним: node штаб/браузер-занят.js):
       node tests/захват-парящий.js
       node tests/захват-парящий.js --сломать   (КОПИЯ style-захват.css во временной папке: высота
           карточек 40 px; проверка обязана покраснеть. Файл проекта не трогается. Выход 2 — не покраснела.)
       node tests/захват-парящий.js --css ФАЙЛ  (отдать странице другой style-захват.css)
   Выход: 0 — зелёное; 1 — есть провалы; 2 — ломающий запуск не покраснел; 3 — нет места для порчи.
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const КОРЕНЬ = path.join(__dirname, '..');
const { chromium, подготовитьПодделку } = require(path.join(КОРЕНЬ, 'tests', 'браузер-робот.js'));
const аргументы = process.argv.slice(2);
const СЛОМАТЬ = аргументы.includes('--сломать');
const ИНДЕКС_CSS = аргументы.indexOf('--css');
let файлCss = ИНДЕКС_CSS !== -1 ? path.resolve(аргументы[ИНДЕКС_CSS + 1]) : null;
const ПАПКА_СНИМКОВ = path.join(КОРЕНЬ, 'tests', 'снимки', 'захват-парящий');
const РАЗМЕРЫ = [[390, 844], [320, 640]];
const БЕЗОПАСНАЯ_ЗОНА = 34;
const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg'
};

let проверок = 0;
let провалов = 0;
function проверить(условие, слова) {
  проверок++;
  if (!условие) { провалов++; console.log('  ПЛОХО— ' + слова); }
  else if (process.env.ПОДРОБНО) console.log('  ок   — ' + слова);
  return !!условие;
}

function поднятьСервер() {
  const сервер = http.createServer((запрос, ответ) => {
    let путь = '/';
    try { путь = decodeURIComponent(запрос.url.split('?')[0]); } catch (_) { /* как есть */ }
    let файл = path.join(КОРЕНЬ, путь === '/' ? 'index.html' : путь);
    if (файлCss && путь === '/игры/захват/style-захват.css') файл = файлCss;
    const своя = файл === файлCss || !path.relative(КОРЕНЬ, файл).startsWith('..');
    if (своя && fs.existsSync(файл) && fs.statSync(файл).isFile()) {
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
      ответ.end(fs.readFileSync(файл));
      return;
    }
    ответ.writeHead(404); ответ.end('нет такого файла');
  });
  return new Promise(готово => сервер.listen(0, '127.0.0.1', () => готово(сервер)));
}

/* Копия style-захват.css во временной папке: высота карточек входов 40 px. */
function сделатьИспорченныйCss() {
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'захват-парящий-сломан-'));
  const css = fs.readFileSync(path.join(КОРЕНЬ, 'игры/захват/style-захват.css'), 'utf8');
  if (css.indexOf('.карточка-входа') === -1) { console.log('нет места для порчи: в style-захват.css не нашлось .карточка-входа'); process.exit(3); }
  const порча = '\nbody.захват #экран-лобби .карточка-входа, body.захват #экран-лобби .фото-лобби__входы .карточка-входа,'
    + ' body.захват #экран-лобби .фото-лобби .карточка-входа { min-height: 0 !important; height: 40px !important; padding-top: 0 !important; padding-bottom: 0 !important; }\n';
  const файл = path.join(папка, 'style-захват.css');
  fs.writeFileSync(файл, css + порча);
  return файл;
}

/* Выполняется в браузере: все замеры лобби. Безопасная зона задаётся числом из аргумента. */
function замерЛобби(зона) {
  document.documentElement.style.setProperty('--отступ-снизу', зона + 'px');
  const лобби = document.getElementById('экран-лобби');
  const видно = у => { const р = у.getBoundingClientRect(); const с = getComputedStyle(у); return р.width > 0 && р.height > 0 && с.visibility !== 'hidden' && с.display !== 'none'; };
  const рамка = у => { const р = у.getBoundingClientRect(); return { l: р.left, t: р.top, r: р.right, b: р.bottom, w: р.width, h: р.height }; };
  // 1. касания
  const касаемые = Array.from(лобби.querySelectorAll('button, .карточка-входа, .карточка-профиля, .нижняя-вкладка'))
    .filter(видно).filter(у => !у.matches('.верх-игры__кнопка'));
  const мелкие = касаемые.map(у => ({ имя: (у.id || у.className || у.tagName) + ' «' + (у.textContent || '').trim().slice(0, 20) + '»', w: Math.round(у.getBoundingClientRect().width), h: Math.round(у.getBoundingClientRect().height) }))
    .filter(х => х.w < 44 || х.h < 44);
  const карточек = Array.from(лобби.querySelectorAll('.карточка-входа')).filter(видно).length;
  // 3. гнездо
  const обл = лобби.querySelector('.фото-лобби__обложка');
  const о = обл && видно(обл) ? рамка(обл) : null;
  // 4. акцент
  const акценты = Array.from(лобби.querySelectorAll('.стекло-акцент')).filter(видно).map(у => у.id || у.className);
  const онлайн = document.getElementById('лобби-найти-игру');
  const онлайнВидна = !!онлайн && видно(онлайн);
  // 2. полоса и последняя карточка: прокручиваем всё до конца
  let у = лобби;
  while (у) { у.scrollTop = у.scrollHeight; у = у.parentElement; }
  window.scrollTo(0, document.documentElement.scrollHeight);
  const полоса = лобби.querySelector('.нижние-вкладки');
  const последняя = лобби.querySelector('.деберц-пригласили');
  const п = полоса && видно(полоса) ? рамка(полоса) : null;
  const посл = последняя && видно(последняя) ? рамка(последняя) : null;
  return {
    высотаОкна: window.innerHeight, касаемых: касаемые.length, карточек, мелкие, о, акценты, онлайнВидна,
    п, посл, вкладок: полоса ? Array.from(полоса.querySelectorAll('.нижняя-вкладка')).filter(видно).length : 0
  };
}

async function проверитьШирину(браузер, порт, ш, в) {
  const метка = ш + '×' + в;
  console.log('=== ' + метка + ' ===');
  const контекст = await браузер.newContext({ viewport: { width: ш, height: в } });
  const страница = await контекст.newPage();
  await подготовитьПодделку(страница, {});
  const ошибки = [];
  страница.on('console', с => { if (с.type() === 'error' && (с.location().url || '').indexOf('telegram-web-app.js') === -1) ошибки.push(с.text()); });
  страница.on('pageerror', е => ошибки.push('необработанная ошибка: ' + е.message));
  await страница.addInitScript(() => { try { localStorage.setItem('zahvat-learned', '1'); } catch (_) { /* пусто */ } });
  await страница.goto('http://127.0.0.1:' + порт + '/захват.html', { waitUntil: 'load' });
  await страница.waitForTimeout(900);

  // Снимок — до прокрутки и до безопасной зоны, как игрок видит первый экран.
  const файл = path.join(ПАПКА_СНИМКОВ, 'лобби-' + ш + '.png');
  if (!СЛОМАТЬ) { fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true }); await страница.screenshot({ path: файл }); console.log('    снимок: ' + файл); }

  const з = await страница.evaluate(замерЛобби, БЕЗОПАСНАЯ_ЗОНА);
  await страница.waitForTimeout(200);

  проверить(з.касаемых >= 5 && з.карточек >= 2, метка + ': найдено касаемых узлов ' + з.касаемых + ', карточек входов ' + з.карточек + ' (нужно ≥ 5 и ≥ 2; ноль — провал)');
  проверить(з.мелкие.length === 0, метка + ': все касаемые ≥ 44 px' + (з.мелкие.length ? ' — меньше: ' + з.мелкие.map(х => х.имя + ' ' + х.w + '×' + х.h).join('; ') : ''));

  проверить(!!з.о, метка + ': гнездо .фото-лобби__обложка найдено и видно (нет — провал)');
  if (з.о) {
    const нужно = з.о.w * 10 / 16;
    проверить(Math.abs(з.о.h - нужно) <= 1, метка + ': гнездо 16:10 ± 1 px: ' + з.о.w.toFixed(1) + '×' + з.о.h.toFixed(1) + ' (должно быть высота ' + нужно.toFixed(1) + ')');
  }

  проверить(з.онлайнВидна, метка + ': карточка «Играть онлайн» на виду (нет — провал)');
  проверить(з.акценты.length === 1 && з.акценты[0] === 'лобби-найти-игру', метка + ': салатовый акцент только у #лобби-найти-игру (видимых акцентов: ' + з.акценты.length + (з.акценты.length ? ': ' + з.акценты.join(', ') : '') + ')');

  проверить(!!з.п && з.вкладок >= 1, метка + ': нижняя полоса найдена, вкладок ' + з.вкладок + ' (ноль — провал)');
  проверить(!!з.посл, метка + ': последняя карточка «Есть код?» найдена и видна (нет — провал)');
  if (з.п) {
    const граница = з.высотаОкна - БЕЗОПАСНАЯ_ЗОНА;
    проверить(з.п.b <= граница + 0.5, метка + ': полоса не заходит в нижнюю зону ' + БЕЗОПАСНАЯ_ЗОНА + ' px: низ полосы ' + з.п.b.toFixed(1) + ', граница ' + граница);
    if (з.посл) проверить(з.п.t >= з.посл.b - 0.5, метка + ': полоса не перекрывает «Есть код?»: верх полосы ' + з.п.t.toFixed(1) + ', низ карточки ' + з.посл.b.toFixed(1));
  }
  проверить(ошибки.length === 0, метка + ': консоль без ошибок' + (ошибки.length ? ': ' + ошибки.join(' | ') : ''));
  await контекст.close();
}

(async () => {
  if (СЛОМАТЬ) файлCss = сделатьИспорченныйCss();
  const сервер = await поднятьСервер();
  const порт = сервер.address().port;
  const браузер = await chromium.launch();
  try {
    for (const [ш, в] of РАЗМЕРЫ) await проверитьШирину(браузер, порт, ш, в);
  } finally {
    await браузер.close();
    сервер.close();
  }
  console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
  if (СЛОМАТЬ) {
    if (провалов === 0) { console.log('ЛОМАЮЩИЙ ЗАПУСК НЕ ПОКРАСНЕЛ — проверка бесполезна'); process.exit(2); }
    console.log('Ломающий запуск покраснел, как и должен (провалов ' + провалов + ').');
    process.exit(0);
  }
  process.exit(провалов ? 1 : 0);
})().catch(е => { console.error(е); process.exit(1); });
