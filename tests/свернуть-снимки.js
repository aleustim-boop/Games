'use strict';

/* =====================================================================
   КНОПКА «СВЕРНУТЬ» ВЫКЛЮЧЕНА — ПРОВЕРКА В НАСТОЯЩЕМ БРАУЗЕРЕ (и снимки для смотрителя).
   Проба владельца 03.10 (вариант Б): своей стрелки нет, сворачивает Telegram.
   Код в js/telegram.js цел за переключателем КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА (false).
   Устройство (что создаёт js/telegram.js) проверяет tests/свернуть-кнопка.js;
   здесь — что на настоящих страницах кнопки нет, верхняя полоса не сдвинулась,
   «Во весь экран» работает как прежде.

   Пункты:
     1) Telegram 8.0, полный экран, система сверху 44, полоса Telegram 46:
        витрина, лобби дурака, стол дурака, монополия, катан, домино,
        шахматы — кнопки .свернуть-окно нет, класса свернуть-кнопка-видна на
        <html> нет, ссылки на style-свернуть.css нет, консоль чистая.
        Ширины 320×568 и 390×844. Снимки: tests/снимки/свернуть/.
     2) Telegram вышел из полного экрана сам (сворачивание): лист «⋯»
        (пункт «Настройки» в меню Telegram) — последней строкой «Во весь
        экран»; нажатие вызывает requestFullscreen и кнопки всё равно нет.
     3) Переход на другую страницу с флагом tg_windowed — requestFullscreen
        НЕ вызывается, кнопки нет.
     4) Полоса Telegram = 0 — кнопки и запасного отступа нет.
     5) Без Telegram: кнопки нет, строки «Во весь экран» нет; консоль без
        красных ошибок на всех страницах.
     6) Полный экран отклонён (UNSUPPORTED): кнопки и строки «Во весь экран» нет.

   Запуск:           node tests/свернуть-снимки.js
   Ломающий запуск:  node tests/свернуть-снимки.js --сломать <временная папка>
                     (кладёт в папку КОПИЮ js/telegram.js с переключателем true
                     и подаёт её странице через перехват запроса; проект не
                     трогается; пункт 1 обязан покраснеть: выход 1, иначе 3).
   Итог — строкой «Итого проверок: N, провалов: M».
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { chromium, подготовитьПодделку, безTelegram } = require('./браузер-робот.js');
const { сестьЗаСтол } = require('./сесть-за-стол.js');

const КОРЕНЬ = path.join(__dirname, '..');
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки', 'свернуть');
const ШИРИНЫ = [{ w: 320, h: 568 }, { w: 390, h: 844 }];
const СИСТЕМА = 44;      // safeAreaInset.top
const ПОЛОСА = 46;
const ПРАВАЯ_КАПСУЛА = 90;   // справа в полосе Telegram рисует свою капсулу «⌄ ⋯»       // contentSafeAreaInset.top

const аргументы = process.argv.slice(2);
const номерПорчи = аргументы.indexOf('--сломать');
const РЕЖИМ_ПОРЧИ = номерПорчи >= 0;

let проверок = 0;
let провалов = 0;
function проверить(условие, слова) {
  проверок++;
  if (!условие) провалов++;
  console.log((условие ? '  ок    — ' : '  ПЛОХО — ') + слова);
}

/* ------------------------------------------------ свой сервер страниц */
const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg'
};
function поднятьСтраницы() {
  const сервер = http.createServer((запрос, ответ) => {
    let адрес;
    try { адрес = decodeURIComponent(запрос.url.split('?')[0]); } catch (о) { ответ.writeHead(400); ответ.end(); return; }
    if (адрес === '/') адрес = '/index.html';
    const файл = path.normalize(path.join(КОРЕНЬ, адрес));
    const часть = path.relative(КОРЕНЬ, файл).split(path.sep)[0].toLowerCase();
    if (!файл.startsWith(КОРЕНЬ) || часть === 'bot' || часть.charAt(0) === '.') { ответ.writeHead(403); ответ.end(); return; }
    fs.readFile(файл, (о, данные) => {
      if (о) { ответ.writeHead(404); ответ.end(); return; }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      ответ.end(данные);
    });
  });
  return new Promise((готово) => сервер.listen(0, '127.0.0.1', () => готово({ сервер, адрес: 'http://127.0.0.1:' + сервер.address().port + '/' })));
}
async function поднятьСерверКомнат() {
  process.env.ДАННЫЕ_ИГРЫ = process.env.ДАННЫЕ_ИГРЫ || path.join(os.tmpdir(), 'свернуть-комнаты-' + process.pid);
  const сервер = require(path.join(КОРЕНЬ, 'server', 'сервер.js')).создатьСервер();
  await new Promise((готово, беда) => { сервер.once('error', беда); сервер.listen(0, '127.0.0.1', готово); });
  return { сервер, адрес: 'http://127.0.0.1:' + сервер.address().port };
}

let БАЗА = '';
let КОМНАТЫ = '';
const ссылка = (имя) => БАЗА + encodeURIComponent(имя) + '?сервер=' + encodeURIComponent(КОМНАТЫ);

function ловецОшибок(страница) {
  const красные = [];
  страница.on('console', (м) => {
    if (м.type() !== 'error') return;
    const откуда = (м.location && м.location() && м.location().url) || '';
    if (/telegram-web-app\.js/.test(м.text() + ' ' + откуда)) return;   // его мы сами не пускаем
    красные.push(м.text() + (откуда ? ' [' + откуда + ']' : ''));
  });
  страница.on('pageerror', (о) => красные.push('падение: ' + о.message));
  return красные;
}

const ПЕРЕКЛЮЧАТЕЛЬ = 'var КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА = false;';   // порча: во включённой копии кнопка возвращается
async function подмешатьПорчу(страница, текстTelegram) {
  if (!текстTelegram) return;
  await страница.route('**/*', (путь) => {
    let адрес = путь.request().url();
    try { адрес = decodeURIComponent(адрес); } catch (о) { /* как есть */ }
    if (/js\/telegram\.js/.test(адрес)) путь.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: текстTelegram });
    else if (адрес.indexOf('telegram-web-app.js') !== -1) путь.abort();
    else путь.continue();
  });
}

/** Замер в странице: есть ли кнопка и её следы, и сколько на странице видимого для сверки. */
function замерВСтранице() {
  const кнопок = document.querySelectorAll('.свернуть-окно').length;
  const классНаHtml = document.documentElement.classList.contains('свернуть-кнопка-видна');
  const ссылкаОформления = !!document.getElementById('оформление-свернуть') ||
    Array.from(document.querySelectorAll('link')).some((л) => /style-свернуть/.test(л.getAttribute('href') || ''));
  let узлов = 0;
  document.querySelectorAll('body *').forEach((у) => {
    if (у.children.length && у.tagName !== 'BUTTON' && !/^H[1-6]$/.test(у.tagName)) return;   // листья, кнопки, заголовки
    const м = у.getBoundingClientRect();
    if (м.width < 2 || м.height < 2) return;
    if (м.bottom < 0 || м.top > innerHeight || м.right < 0 || м.left > innerWidth) return;
    let предок = у;
    while (предок && предок !== document.body) {
      const пс = getComputedStyle(предок);
      if (пс.display === 'none' || пс.visibility === 'hidden' || Number(пс.opacity) === 0) return;
      предок = предок.parentElement;
    }
    if (!(у.textContent || '').trim() && у.tagName !== 'BUTTON' && !у.querySelector('svg') && у.tagName.toLowerCase() !== 'svg') return;   // пустые подложки
    узлов++;
  });
  return { кнопок, классНаHtml, ссылкаОформления, узлов };
}

async function новаяСтраница(браузер, размер, настройкиПодделки, текстTelegram) {
  const окно = await браузер.newContext({ viewport: { width: размер.w, height: размер.h } });
  const страница = await окно.newPage();
  const красные = ловецОшибок(страница);
  if (настройкиПодделки) await подготовитьПодделку(страница, настройкиПодделки);
  else await безTelegram(страница);
  await подмешатьПорчу(страница, текстTelegram);
  return { окно, страница, красные };
}

const ПОЛНЫЙ = {
  версия: '8.0', полныйЭкран: 'дают',
  отступы: { системные: { top: СИСТЕМА, bottom: 20, left: 0, right: 0 }, содержимого: { top: ПОЛОСА, bottom: 0, left: 0, right: 0 } }
};

const имяФайла = (с) => с.replace(/[^\wа-яё]+/gi, '-').replace(/^-|-$/g, '');

async function снимок(страница, имя, р) {
  fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
  const файл = path.join(ПАПКА_СНИМКОВ, имяФайла(имя) + '-' + р.w + '.png');
  await страница.screenshot({ path: файл });
  return файл;
}

/** Проверить, что на уже открытом экране кнопки «Свернуть» и её следов нет. */
async function проверитьЭкран(страница, подпись, р) {
  await страница.waitForTimeout(500);
  const м = await страница.evaluate(замерВСтранице);
  // Страница должна быть живой, иначе «нет кнопки» ничего не доказывает
  проверить(м.узлов >= 3, подпись + ': найдено видимых узлов страницы для сверки: ' + м.узлов + ' (меньше 3 — провал)');
  проверить(м.кнопок === 0, подпись + ': кнопки «Свернуть» (.свернуть-окно) на странице нет (найдено ' + м.кнопок + ')');
  проверить(!м.классНаHtml, подпись + ': на <html> нет класса свернуть-кнопка-видна');
  проверить(!м.ссылкаОформления, подпись + ': ссылки на style-свернуть.css нет');
  if (!РЕЖИМ_ПОРЧИ) console.log('    снимок: ' + await снимок(страница, подпись, р));
}
(async () => {
  const страницы = await поднятьСтраницы();
  const комнаты = await поднятьСерверКомнат();
  БАЗА = страницы.адрес; КОМНАТЫ = комнаты.адрес;
  const браузер = await chromium.launch();
  let текстПорчи = '';
  if (РЕЖИМ_ПОРЧИ) {
    const папка = аргументы[номерПорчи + 1];
    if (!папка) { console.log('Укажи временную папку: --сломать <папка>'); process.exit(2); }
    fs.mkdirSync(папка, { recursive: true });
    // Копия telegram.js с включённым переключателем: страница получает её вместо настоящей
    const настоящий = fs.readFileSync(path.join(КОРЕНЬ, 'js', 'telegram.js'), 'utf8');
    if (настоящий.split(ПЕРЕКЛЮЧАТЕЛЬ).length !== 2) { console.log('Переключатель не найден ровно один раз — порча невозможна'); process.exit(2); }
    текстПорчи = настоящий.split(ПЕРЕКЛЮЧАТЕЛЬ).join('var КНОПКА_СВЕРНУТЬ_ВКЛЮЧЕНА = true;');
    fs.writeFileSync(path.join(папка, 'telegram.js'), текстПорчи);
    console.log('РЕЖИМ ПОРЧИ: подана копия telegram.js с переключателем true (' + path.join(папка, 'telegram.js') + ')');
  }

  /* ---------- 1. Полный экран: кнопки нет на всех экранах ---------- */
  console.log('\n=== 1. Telegram 8.0, полный экран (система ' + СИСТЕМА + ', полоса ' + ПОЛОСА + ') ===');
  const ЭКРАНЫ = [
    { имя: 'витрина', файл: 'index.html', шаги: async () => {} },
    { имя: 'лобби дурака', файл: 'index.html', шаги: async (с) => { await с.click('#кнопка-игра-дурак'); await с.waitForTimeout(400); } },
    { имя: 'стол дурака', файл: 'index.html', шаги: async (с) => { await сестьЗаСтол(с); await с.waitForTimeout(800); } },
    { имя: 'монополия', файл: 'монополия.html', шаги: async () => {} },
    { имя: 'катан', файл: 'катан.html', шаги: async () => {} },
    { имя: 'катан партия', файл: 'катан.html', шаги: async (с) => {
      await с.click('#кат-боты'); await с.waitForTimeout(500);
      const начать = await с.$('#кат-начать');
      if (начать && await начать.isVisible()) { await начать.click(); await с.waitForTimeout(800); }
    } },
    { имя: 'домино', файл: 'домино.html', шаги: async () => {} },
    { имя: 'шахматы', файл: 'шахматы.html', шаги: async () => {} }
  ];
  for (const р of ШИРИНЫ) {
    for (const э of ЭКРАНЫ) {
      if (РЕЖИМ_ПОРЧИ && !(р.w === 390 && ['витрина', 'монополия', 'шахматы'].indexOf(э.имя) >= 0)) continue;
      const { окно, страница, красные } = await новаяСтраница(браузер, р, ПОЛНЫЙ, текстПорчи);
      try {
        await страница.goto(ссылка(э.файл));
        await э.шаги(страница);
        await проверитьЭкран(страница, э.имя + ' ' + р.w, р);
        if (!РЕЖИМ_ПОРЧИ) проверить(красные.length === 0, э.имя + ' ' + р.w + ': консоль чистая' + (красные.length ? ': ' + красные.join(' | ') : ''));
      } catch (о) {
        проверить(false, э.имя + ' ' + р.w + ': сценарий упал: ' + String(о && о.message || о).split('\n')[0]);
      }
      await окно.close();
    }
  }

  if (РЕЖИМ_ПОРЧИ) {
    await браузер.close();
    комнаты.сервер.closeAllConnections(); страницы.сервер.closeAllConnections();
    console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
    console.log(провалов ? 'Порча покраснела как надо.' : 'ПОРЧА НЕ ПОКРАСНЕЛА — проверка украшение.');
    process.exit(провалов ? 1 : 3);
  }

  const р390 = ШИРИНЫ[1];

  /* ---------- 2. Telegram свернул полный экран сам ---------- */
  console.log('\n=== 2. Telegram вышел из полного экрана сам: в листе «Во весь экран» ===');
  {
    const { окно, страница, красные } = await новаяСтраница(браузер, р390, ПОЛНЫЙ);
    await страница.goto(ссылка('index.html'));
    await страница.waitForTimeout(600);
    const до = await страница.evaluate(() => ({ просили: window.__дневник.полныйЭкран, кнопок: document.querySelectorAll('.свернуть-окно').length }));
    проверить(до.просили === 1 && до.кнопок === 0, 'старт: полный экран просили раз ' + до.просили + ', кнопок «Свернуть» ' + до.кнопок);
    // Системное сворачивание Telegram: вызываем выход из полного экрана снаружи, как это сделал бы Telegram
    await страница.evaluate(() => window.Telegram.WebApp.exitFullscreen());
    await страница.waitForTimeout(400);
    const после = await страница.evaluate(() => ({
      полный: window.Telegram.WebApp.isFullscreen,
      кнопок: document.querySelectorAll('.свернуть-окно').length,
      классНаHtml: document.documentElement.classList.contains('свернуть-кнопка-видна')
    }));
    проверить(после.полный === false && после.кнопок === 0 && !после.классНаHtml, 'после выхода из полного экрана: экран обычный, кнопки и класса нет');
    await страница.evaluate(() => window.ПоддельныйТелеграм.нажатьНастройки());
    await страница.waitForTimeout(500);
    const наВитрине = await страница.evaluate(() => Array.from(document.querySelectorAll('#лист-ещё .лист-ещё__строка')).filter((у) => { const м = у.getBoundingClientRect(); return м.width > 1 && getComputedStyle(у).display !== 'none'; }).map((у) => (у.textContent || '').trim()));
    console.log('  лист витрины: ' + JSON.stringify(наВитрине));
    проверить(наВитрине.length > 0 && /Во весь экран/.test(наВитрине[наВитрине.length - 1]), 'лист «⋯» ВИТРИНЫ: последняя строка «Во весь экран» (строки: ' + JSON.stringify(наВитрине) + ')');
    await страница.evaluate(() => { const ф = document.getElementById('лист-ещё-фон'); if (ф) ф.click(); });
    await страница.waitForTimeout(300);
    await страница.click('#кнопка-игра-дурак');
    await страница.waitForTimeout(500);
    await страница.evaluate(() => window.ПоддельныйТелеграм.нажатьНастройки());
    await страница.waitForTimeout(500);
    const лист = await страница.evaluate(() => {
      const л = document.getElementById('лист-игры');
      const видим = !!л && !л.classList.contains('скрыт');
      const строки = л ? Array.from(л.querySelectorAll('.лист-ещё__строка')).filter((у) => { const м = у.getBoundingClientRect(); return м.width > 1 && getComputedStyle(у).display !== 'none'; }) : [];
      return { видим, тексты: строки.map((у) => (у.textContent || '').trim().replace(/\s+/g, ' ')) };
    });
    console.log('  строки листа: ' + JSON.stringify(лист.тексты));
    проверить(лист.видим && лист.тексты.length >= 4, 'лист «⋯» лобби дурака открылся, видимых строк: ' + лист.тексты.length);
    проверить(лист.тексты.length > 0 && /Во весь экран/.test(лист.тексты[лист.тексты.length - 1]), 'последняя строка — «Во весь экран»: «' + (лист.тексты[лист.тексты.length - 1] || '') + '»');
    console.log('    снимок: ' + await снимок(страница, 'лист-во-весь-экран', р390));
    await страница.evaluate(() => {
      const л = document.getElementById('лист-игры');
      const с = Array.from(л.querySelectorAll('.лист-ещё__строка')).filter((у) => /Во весь экран/.test(у.textContent));
      if (с.length) с[с.length - 1].click();
    });
    await страница.waitForTimeout(400);
    const вернули = await страница.evaluate(() => ({
      просили: window.__дневник.полныйЭкран, полный: window.Telegram.WebApp.isFullscreen,
      кнопок: document.querySelectorAll('.свернуть-окно').length
    }));
    проверить(вернули.просили === 2, 'нажатие «Во весь экран» вызвало requestFullscreen (всего просьб ' + вернули.просили + ')');
    проверить(вернули.полный === true && вернули.кнопок === 0, 'экран снова полный, кнопки «Свернуть» по-прежнему нет (' + вернули.кнопок + ')');
    проверить(красные.length === 0, 'консоль чистая' + (красные.length ? ': ' + красные.join(' | ') : ''));
    await окно.close();
  }

  /* ---------- 3. Переход на другую страницу с флагом «окно обычное» ---------- */
  console.log('\n=== 3. Флаг tg_windowed: переход на другую страницу не просит полный экран ===');
  {
    const { окно, страница, красные } = await новаяСтраница(браузер, р390, ПОЛНЫЙ);
    await страница.goto(ссылка('index.html'));
    await страница.waitForTimeout(500);
    // Флаг теперь ставят только «Во весь экран»-запасные пути; ставим его сами и выходим из полного экрана
    await страница.evaluate(() => { sessionStorage.setItem('tg_windowed', '1'); window.Telegram.WebApp.exitFullscreen(); });
    await страница.waitForTimeout(300);
    for (const имя of ['монополия.html', 'катан.html']) {
      await страница.goto(ссылка(имя));
      await страница.waitForTimeout(600);
      const с = await страница.evaluate(() => ({
        просили: window.__дневник.полныйЭкран, полный: window.Telegram.WebApp.isFullscreen,
        кнопок: document.querySelectorAll('.свернуть-окно').length
      }));
      проверить(с.просили === 0, имя + ': requestFullscreen НЕ вызван (просьб ' + с.просили + ')');
      проверить(с.полный === false && с.кнопок === 0, имя + ': окно обычное, кнопки нет (' + с.кнопок + ')');
    }
    проверить(красные.length === 0, 'консоль чистая' + (красные.length ? ': ' + красные.join(' | ') : ''));
    await окно.close();
  }

  /* ---------- 4. Запасной случай: полоса Telegram = 0 ---------- */
  console.log('\n=== 4. Telegram не прислал полосу (contentSafeAreaInset.top = 0): запасного отступа нет ===');
  for (const р of ШИРИНЫ) {
    const без = Object.assign({}, ПОЛНЫЙ, { отступы: { системные: { top: СИСТЕМА, bottom: 20, left: 0, right: 0 }, содержимого: { top: 0, bottom: 0, left: 0, right: 0 } } });
    for (const э of [ЭКРАНЫ[0], ЭКРАНЫ[3], ЭКРАНЫ[6]]) {
      const { окно, страница, красные } = await новаяСтраница(браузер, р, без);
      try {
        await страница.goto(ссылка(э.файл));
        await э.шаги(страница);
        await проверитьЭкран(страница, 'без полосы: ' + э.имя + ' ' + р.w, р);
        проверить(красные.length === 0, 'без полосы: ' + э.имя + ' ' + р.w + ': консоль чистая' + (красные.length ? ': ' + красные.join(' | ') : ''));
      } catch (о) { проверить(false, 'без полосы ' + э.имя + ': сценарий упал: ' + String(о && о.message || о).split('\n')[0]); }
      await окно.close();
    }
  }

  /* ---------- 5. Без Telegram ---------- */
  console.log('\n=== 5. Обычный браузер, Telegram нет ===');
  for (const имя of ['index.html', 'монополия.html', 'катан.html', 'домино.html', 'шахматы.html', 'шашки.html', '2048.html']) {
    const { окно, страница, красные } = await новаяСтраница(браузер, р390, null);
    await страница.goto(ссылка(имя));
    await страница.waitForTimeout(600);
    if (имя === 'index.html') { await страница.click('#кнопка-игра-дурак'); await страница.waitForTimeout(400); }
    const с = await страница.evaluate(() => {
      const ok = (у) => { const м = у.getBoundingClientRect(); return !у.hidden && getComputedStyle(у).display !== 'none' && м.width > 1; };
      const к = document.querySelector('.свернуть-окно');
      return { кнопкаВидна: !!к && ok(к), кнопокВсего: document.querySelectorAll('button').length };
    });
    проверить(с.кнопокВсего > 0, имя + ': страница живая, кнопок на ней ' + с.кнопокВсего + ' (ноль — провал)');
    проверить(!с.кнопкаВидна, имя + ': кнопки «Свернуть» не видно');
    const открыли = await страница.evaluate(() => {
      const о = Array.from(document.querySelectorAll('[aria-controls^="лист-"]')).find((у) => { const м = у.getBoundingClientRect(); return м.width > 1 && getComputedStyle(у).display !== 'none'; });
      if (о) { о.click(); return true; }
      return false;
    });
    if (открыли) {
      await страница.waitForTimeout(400);
      const р = await страница.evaluate(() => {
        const вид = Array.from(document.querySelectorAll('.лист-ещё__строка')).filter((у) => { const м = у.getBoundingClientRect(); return м.width > 1 && getComputedStyle(у).display !== 'none'; });
        return { всего: вид.length, своих: вид.filter((у) => /Во весь экран/.test(у.textContent)).length };
      });
      проверить(р.всего >= 3 && р.своих === 0, имя + ': лист открыт (видимых строк ' + р.всего + '), строки «Во весь экран» нет');
    } else {
      console.log('  (' + имя + ': листа «⋯» с кнопкой-открывашкой не нашлось — строку искать негде)');
    }
    проверить(красные.length === 0, имя + ': консоль чистая' + (красные.length ? ': ' + красные.join(' | ') : ''));
    await окно.close();
  }

  /* ---------- 6. Telegram 8.0+, но полный экран не дали (UNSUPPORTED) ---------- */
  console.log('\n=== 6. Telegram 8.0, полный экран отклонён (UNSUPPORTED) ===');
  {
    const { окно, страница, красные } = await новаяСтраница(браузер, р390, Object.assign({}, ПОЛНЫЙ, { полныйЭкран: 'отказ' }));
    await страница.goto(ссылка('index.html'));
    await страница.waitForTimeout(700);
    const с = await страница.evaluate(() => {
      const ok = (у) => { const м = у.getBoundingClientRect(); return !у.hidden && getComputedStyle(у).display !== 'none' && м.width > 1; };
      const к = document.querySelector('.свернуть-окно');
      return { просили: window.__дневник.полныйЭкран, полный: window.Telegram.WebApp.isFullscreen, кнопкаВидна: !!к && ok(к) };
    });
    проверить(с.просили === 1 && с.полный === false, 'просьбу отправили (' + с.просили + '), Telegram отказал, экран обычный');
    проверить(!с.кнопкаВидна, 'кнопки «Свернуть» нет');
    await страница.click('#кнопка-игра-дурак');
    await страница.waitForTimeout(500);
    await страница.evaluate(() => window.ПоддельныйТелеграм.нажатьНастройки());
    await страница.waitForTimeout(500);
    const л = await страница.evaluate(() => {
      const вид = Array.from(document.querySelectorAll('#лист-игры .лист-ещё__строка')).filter((у) => { const м = у.getBoundingClientRect(); return м.width > 1 && getComputedStyle(у).display !== 'none'; });
      return { всего: вид.length, своих: вид.filter((у) => /Во весь экран/.test(у.textContent)).length, тексты: вид.map((у) => (у.textContent || '').trim()) };
    });
    проверить(л.всего >= 4, 'лист «⋯» открыт, видимых строк ' + л.всего);
    проверить(л.своих === 0, 'строки «Во весь экран» при отказе нет (строки: ' + JSON.stringify(л.тексты) + ')');
    проверить(красные.length === 0, 'консоль чистая' + (красные.length ? ': ' + красные.join(' | ') : ''));
    await окно.close();
  }

  await браузер.close();
  комнаты.сервер.closeAllConnections(); страницы.сервер.closeAllConnections();
  console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
})().catch((о) => { console.error('Стенд упал: ' + (о && о.stack || о)); process.exit(2); });
