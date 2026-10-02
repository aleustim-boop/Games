'use strict';

/* =====================================================================
   «ЗАХВАТ»: КОРОТКОЕ РАСКРЫТИЕ У БОТОВ И ИТОГ РАУНДА (этап Д-5т) —
   БРАУЗЕРНАЯ ПРОВЕРКА (playwright/chromium). Сводный node-прогон её не гоняет.

   Что делает: партия с ботами на «Острове» (3 игрока), экран 390×844. Один приказ, «Готово».
     1) Раскрытие у ботов кончается не позже 8000 мс (по расписанию 2000 + волн × 600 + 1000).
        Начало — нажатие «Готово», конец — кнопка перестала быть «Пропустить ›».
     2) В итоге раунда есть «Журнал ›» (подвал «Раунд N · Журнал ›») и нет слова «ничья»/«ничей».
     3) Во второй партии касание пластины во время раскрытия сразу даёт итог (быстрее 1,5 с).
   Ноль найденных узлов = провал. Снимок итога: tests/снимки/захват-д5т/итог.png

   Запуск:
       node tests/захват-пропуск-раскрытия.js
       node tests/захват-пропуск-раскрытия.js --сломать <путь к временной папке вне проекта>
           (в папку кладётся КОПИЯ js/захват-раскрытие.js, где итог держится 9000 мс; страница
            подменяет файл маршрутом playwright; файл проекта не трогается; проверка обязана покраснеть)
       node tests/захват-пропуск-раскрытия.js --сломать-метку <путь к временной папке вне проекта>
           (Д-5е: копия js/захват-экран.js без проверки метки пропуска; обязана покраснеть «окна "Поставьте войска" нет»)
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ПРОЕКТ = path.join(__dirname, '..');
const { chromium, подготовитьПодделку } = require(path.join(ПРОЕКТ, 'tests', 'браузер-робот.js'));

const ПОРОГ_МС = 8000;
const ПОРОГ_ПРОПУСКА_МС = 1500;
const ЖДАТЬ_КОНЦА_МС = 30000;
const ПАПКА_СНИМКОВ = path.join(ПРОЕКТ, 'tests', 'снимки', 'захват-д5т');

let провалов = 0;
let проверок = 0;
function проверить(условие, слова) {
  проверок++;
  console.log((условие ? '  ок   — ' : '  ПЛОХО— ') + слова);
  if (!условие) провалов++;
  return условие;
}

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};

function поднятьСервер() {
  const сервер = http.createServer((запрос, ответ) => {
    let путь = '/';
    try { путь = decodeURIComponent(запрос.url.split('?')[0]); } catch (_) { /* как есть */ }
    if (путь === '/') путь = '/index.html';
    const файл = path.join(ПРОЕКТ, путь);
    try {
      if (fs.statSync(файл).isFile()) {
        ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
        ответ.end(fs.readFileSync(файл));
        return;
      }
    } catch (_) { /* нет файла */ }
    ответ.writeHead(404); ответ.end('нет такого файла');
  });
  return new Promise(готово => сервер.listen(0, '127.0.0.1', () => готово(сервер)));
}

/* Порча: КОПИЯ js/захват-раскрытие.js в чужой папке, где итог держится 9000 мс вместо 1000. */
function испортитьКопию(папка) {
  const исходник = fs.readFileSync(path.join(ПРОЕКТ, 'js', 'захват-раскрытие.js'), 'utf8');
  const было = 'const ИТОГ_ПЛОТНО_МС = 1000;';
  if (исходник.split(было).length !== 2) throw new Error('--сломать: в js/захват-раскрытие.js не нашлась «' + было + '» (якорь не найден — провал)');
  fs.mkdirSync(path.join(папка, 'js'), { recursive: true });
  const файл = path.join(папка, 'js', 'захват-раскрытие.js');
  fs.writeFileSync(файл, исходник.replace(было, () => 'const ИТОГ_ПЛОТНО_МС = 9000;'));
  return файл;
}

const аргументы = process.argv.slice(2);
const индексПорчи = аргументы.indexOf('--сломать');
const ЛОМАЮ = индексПорчи !== -1;
let порченыйФайл = null;
if (ЛОМАЮ) {
  const папка = аргументы[индексПорчи + 1];
  if (!папка || /^--/.test(папка)) { console.error('Укажите путь к временной папке копии: --сломать <путь>'); process.exit(2); }
  порченыйФайл = испортитьКопию(path.resolve(папка));
}

/* Порча Д-5е: КОПИЯ js/захват-экран.js, где щелчок «Пропустить ›» снова считается «Готово» следующего раунда. */
function испортитьКопиюЭкрана(папка) {
  const исходник = fs.readFileSync(path.join(ПРОЕКТ, 'js', 'захват-экран.js'), 'utf8');
  const было = '    if (событие && событие.захватПропуск) return;\n';
  const нормальный = исходник.replace(/\r\n/g, '\n');
  if (нормальный.split(было).length !== 2) throw new Error('--сломать-метку: в js/захват-экран.js не нашлась проверка метки пропуска (якорь не найден — провал)');
  fs.mkdirSync(path.join(папка, 'js'), { recursive: true });
  const файл = path.join(папка, 'js', 'захват-экран.js');
  fs.writeFileSync(файл, нормальный.replace(было, () => ''));
  return файл;
}

const индексМетки = аргументы.indexOf('--сломать-метку');
let порченыйЭкран = null;
if (индексМетки !== -1) {
  const папка = аргументы[индексМетки + 1];
  if (!папка || /^--/.test(папка)) { console.error('Укажите путь к временной папке копии: --сломать-метку <путь>'); process.exit(2); }
  порченыйЭкран = испортитьКопиюЭкрана(path.resolve(папка));
}

async function открыть(браузер, порт) {
  const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 } });
  const страница = await контекст.newPage();
  if (порченыйЭкран) {
    await страница.route(у => decodeURIComponent(у.pathname).endsWith('/js/захват-экран.js'), маршрут => маршрут.fulfill({
      status: 200, contentType: 'application/javascript; charset=utf-8', body: fs.readFileSync(порченыйЭкран, 'utf8')
    }));
  }
  if (порченыйФайл) {
    await страница.route(у => decodeURIComponent(у.pathname).endsWith('/js/захват-раскрытие.js'), маршрут => маршрут.fulfill({
      status: 200, contentType: 'application/javascript; charset=utf-8', body: fs.readFileSync(порченыйФайл, 'utf8')
    }));
  }
  await подготовитьПодделку(страница, {});
  const ошибки = [];
  страница.on('console', с => {
    const адрес = с.location().url || '';
    if (с.type() === 'error' && адрес.indexOf('telegram-web-app.js') === -1) ошибки.push(с.text() + ' ' + адрес);
  });
  страница.on('pageerror', е => ошибки.push('необработанная ошибка: ' + е.message));
  await страница.addInitScript(() => { try { localStorage.setItem('zahvat-learned', '1'); } catch (_) { /* пусто */ } });
  await страница.goto('http://127.0.0.1:' + порт + '/захват.html', { waitUntil: 'load' });
  await страница.waitForTimeout(800);
  return { контекст, страница, ошибки };
}

/* Партия с ботами, 3 игрока, один приказ (протяжка от своей области к соседней, лист, «Ударить»/«Перевести»). */
async function началоПартииИПриказ(страница) {
  await страница.click('#захват-боты');
  await страница.waitForTimeout(300);
  await страница.click('#захват-выбор-число [data-значение="3"]');
  await страница.click('#захват-начать');
  await страница.waitForTimeout(1500);
  const пара = await страница.evaluate(() => {
    const К = window.ЗахватКарты;
    const значок = document.querySelector('.захват-игрок--я .захват-игрок__значок');
    const я = значок ? (/захват-игрок__значок--([^ ]+)/.exec(значок.getAttribute('class') || '') || [])[1] : null;
    if (!я) return null;
    const соседи = К.соседство(К.КАРТЫ['остров']);
    const центр = у => { const п = у.getBoundingClientRect(); return { x: п.left + п.width / 2, y: п.top + п.height / 2 }; };
    const узлы = {};
    document.querySelectorAll('.захват-шайба').forEach(у => { узлы[у.getAttribute('data-область')] = у; });
    let лучшая = null;
    for (const н of Object.keys(узлы).filter(н => узлы[н].classList.contains('захват-шайба--' + я))) {
      for (const с of (соседи[н] || [])) {
        if (!узлы[с]) continue;
        const чужая = !узлы[с].classList.contains('захват-шайба--' + я);
        if (!лучшая || (чужая && !лучшая.чужая)) лучшая = { из: центр(узлы[н]), куда: центр(узлы[с]), чужая };
      }
    }
    return лучшая;
  });
  проверить(!!пара, 'нашлась своя область с соседом для приказа (ноль — провал)');
  if (!пара) return false;
  await страница.mouse.move(пара.из.x, пара.из.y);
  await страница.mouse.down();
  await страница.mouse.move(пара.куда.x, пара.куда.y, { steps: 10 });
  await страница.mouse.up();
  await страница.waitForTimeout(500);
  const лист = await страница.evaluate(() => { const л = document.getElementById('захват-приказ'); return !!л && !л.classList.contains('скрыт'); });
  проверить(лист, 'после протяжки открылся лист приказа');
  if (!лист) return false;
  await страница.click('#захват-приказ-отдать');
  await страница.waitForTimeout(400);
  return true;
}

/* Нажать «Готово» (и «Поставить и готово», если стол спросит). */
async function нажатьГотово(страница) {
  await страница.click('#захват-готово');
  await страница.waitForTimeout(300);
  if (await страница.evaluate(() => { const у = document.getElementById('захват-остаток'); return !!у && !у.classList.contains('скрыт'); })) {
    await страница.click('#захват-остаток-да', { timeout: 4000 }).catch(() => {});
  }
}

const пл = страница => страница.evaluate(() => { const п = document.getElementById('захват-пластина'); return п ? { есть: true, виден: !п.classList.contains('скрыт'), текст: (п.textContent || '').trim() } : { есть: false }; });

async function партияЗамера(браузер, порт) {
  const { контекст, страница, ошибки } = await открыть(браузер, порт);
  try {
    if (!(await началоПартииИПриказ(страница))) return { ошибки, сорвалось: true };
    // Наблюдатель за кнопкой: начало — «Пропустить ›», конец — кнопка снова не «Пропустить ›».
    await страница.evaluate(() => {
      const г = document.getElementById('захват-готово');
      window.__т0 = null; window.__нач = null; window.__кон = null; window.__итогТекст = null;
      const наблюдать = () => {
        if (window.__кон !== null) return;
        const пропуск = /Пропустить/.test(г.textContent || '');
        if (пропуск && window.__нач === null) window.__нач = performance.now();
        else if (!пропуск && window.__нач !== null) {
          window.__кон = performance.now();
          const п = document.getElementById('захват-пластина');
          window.__итогТекст = п ? (п.textContent || '').trim() : null;
        }
      };
      new MutationObserver(наблюдать).observe(г, { childList: true, characterData: true, subtree: true, attributes: true });
      document.addEventListener('click', е => { if (е.target.closest && е.target.closest('#захват-готово') && window.__т0 === null) window.__т0 = performance.now(); }, true);
    });
    await нажатьГотово(страница);
    const дошло = await страница.waitForFunction(() => window.__кон !== null, null, { timeout: ЖДАТЬ_КОНЦА_МС, polling: 100 }).then(() => true, () => false);
    const р = await страница.evaluate(() => ({ т0: window.__т0, нач: window.__нач, кон: window.__кон, текст: window.__итогТекст }));
    return { ошибки, дошло, мс: р.кон !== null && р.т0 !== null ? Math.round(р.кон - р.т0) : null, началось: р.нач !== null, текст: р.текст };
  } finally { await контекст.close(); }
}

async function партияПропуска(браузер, порт) {
  const { контекст, страница, ошибки } = await открыть(браузер, порт);
  try {
    if (!(await началоПартииИПриказ(страница))) return { ошибки, сорвалось: true };
    await нажатьГотово(страница);
    const пока = await страница.waitForFunction(() => { const п = document.getElementById('захват-пластина'); return !!п && !п.classList.contains('скрыт') && (п.textContent || '').trim().length > 0; }, null, { timeout: 8000 }).then(() => true, () => false);
    if (!пока) return { ошибки, пластинаНет: true };
    const текстДо = (await пл(страница)).текст;
    const коробка = await страница.evaluate(() => { const п = document.getElementById('захват-пластина').getBoundingClientRect(); return { x: п.left + п.width / 2, y: п.top + п.height / 2 }; });
    const т0 = Date.now();
    await страница.mouse.click(коробка.x, коробка.y);
    const итог = await страница.waitForFunction(() => { const п = document.getElementById('захват-пластина'); return !!п && !п.classList.contains('скрыт') && /Журнал/.test(п.textContent || ''); }, null, { timeout: 4000, polling: 50 }).then(() => true, () => false);
    const мс = Date.now() - т0;
    const после = await пл(страница);
    fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
    if (!ЛОМАЮ) await страница.screenshot({ path: path.join(ПАПКА_СНИМКОВ, 'итог.png') });
    const журналОткрыт = await страница.evaluate(() => { const ж = document.getElementById('захват-журнал'); return !!ж && !ж.classList.contains('скрыт'); });
    return { ошибки, итог, мс, текстДо, после, журналОткрыт };
  } finally { await контекст.close(); }
}

/* Д-5е: настоящий щелчок мышью по «Пропустить ›» (pointerdown + click одного касания): итог есть, окна «Поставьте войска»
   нет, ход следующего раунда не ушёл (кнопка осталась «✓ Готово», а не «Изменить»), замка на «Пропустить ›» нет. */
async function партияКнопкиПропуска(браузер, порт) {
  const { контекст, страница, ошибки } = await открыть(браузер, порт);
  try {
    if (!(await началоПартииИПриказ(страница))) return { ошибки, сорвалось: true };
    await нажатьГотово(страница);
    const вРаскрытии = await страница.waitForFunction(() => /Пропустить/.test(document.getElementById('захват-готово').textContent || ''), null, { timeout: 8000 }).then(() => true, () => false);
    if (!вРаскрытии) return { ошибки, нетРаскрытия: true };
    const замок = await страница.evaluate(() => getComputedStyle(document.getElementById('захват-готово'), '::before').content);
    await страница.click('#захват-готово');
    await страница.waitForTimeout(600);
    const р = await страница.evaluate(() => {
      const о = document.getElementById('захват-остаток');
      const п = document.getElementById('захват-пластина');
      return { окноОстатка: !!о && !о.classList.contains('скрыт'), итог: !!п && /Журнал/.test(п.textContent || ''),
        кнопка: (document.getElementById('захват-готово').textContent || '').trim() };
    });
    return { ошибки, замок, окноОстатка: р.окноОстатка, итог: р.итог, кнопка: р.кнопка };
  } finally { await контекст.close(); }
}

async function главная() {
  const сервер = await поднятьСервер();
  const порт = сервер.address().port;
  console.log('Сервер проверки: порт ' + порт + ', PID ' + process.pid + (порченыйФайл ? ', КОПИЯ с итогом 9000 мс: ' + порченыйФайл : ''));
  const браузер = await chromium.launch();
  const вся = [];
  try {
    console.log('\n=== Длина раскрытия у ботов и текст итога ===');
    const з = await партияЗамера(браузер, порт);
    вся.push(...з.ошибки);
    проверить(!з.сорвалось, 'партия началась и приказ отдан');
    if (!з.сорвалось) {
      проверить(з.началось === true, 'раскрытие началось — «Готово» стала «Пропустить ›» (ноль — провал)');
      проверить(з.дошло === true && з.мс !== null, 'конец раскрытия наступил за ' + ЖДАТЬ_КОНЦА_МС / 1000 + ' с (ноль — провал)');
      if (з.мс !== null) {
        console.log('    замер: ' + з.мс + ' мс');
        проверить(з.мс <= ПОРОГ_МС, 'раскрытие у ботов не длиннее ' + ПОРОГ_МС + ' мс: ' + з.мс + ' мс');
        проверить(з.текст !== null && /Журнал ›/.test(з.текст), 'в итоге раунда есть «Журнал ›»: «' + з.текст + '»');
        проверить(з.текст !== null && /Раунд \d+ · Журнал ›/.test(з.текст), 'подвал вида «Раунд N · Журнал ›»');
        проверить(з.текст !== null && !/ничья|ничей|ничьи/i.test(з.текст), 'в итоге раунда нет слова «ничья»');
      }
    }
    console.log('\n=== Касание пластины во время раскрытия ===');
    const п = await партияПропуска(браузер, порт);
    вся.push(...п.ошибки);
    проверить(!п.сорвалось && !п.пластинаНет, 'во второй партии появилась пластина раскрытия (ноль — провал)');
    if (!п.сорвалось && !п.пластинаНет) {
      console.log('    пластина до касания: «' + п.текстДо + '»; итог за ' + п.мс + ' мс');
      проверить(п.итог === true, 'касание пластины сразу дало итог («Журнал ›» появился)');
      проверить(п.мс <= ПОРОГ_ПРОПУСКА_МС, 'итог после касания быстрее ' + ПОРОГ_ПРОПУСКА_МС + ' мс: ' + п.мс + ' мс');
      проверить(п.после.текст !== п.текстДо, 'текст пластины сменился');
      проверить(!/ничья|ничей|ничьи/i.test(п.после.текст || ''), 'в пропущенном итоге нет слова «ничья»');
      проверить(п.журналОткрыт === false, 'касание во время раскрытия не открыло журнал');
    }
    console.log('\n=== Д-5е: щелчок по «Пропустить ›» ===');
    const к = await партияКнопкиПропуска(браузер, порт);
    вся.push(...к.ошибки);
    проверить(!к.сорвалось && !к.нетРаскрытия, 'в третьей партии раскрытие началось, кнопка — «Пропустить ›» (ноль — провал)');
    if (!к.сорвалось && !к.нетРаскрытия) {
      проверить(к.итог === true, 'после щелчка по «Пропустить ›» виден итог раунда');
      проверить(к.окноОстатка === false, 'после щелчка по «Пропустить ›» окна «Поставьте войска» нет');
      проверить(/Готово/.test(к.кнопка) && !/Изменить/.test(к.кнопка), 'ход следующего раунда не ушёл: кнопка «' + к.кнопка + '», не «Изменить»');
      проверить(к.замок === 'none' || к.замок === 'normal', 'на «Пропустить ›» нет замка: ' + к.замок);
    }
    проверить(!вся.length, 'консоль без ошибок' + (вся.length ? ': ' + вся.slice(0, 3).join(' | ') : ''));
  } finally {
    await браузер.close();
    сервер.close();
  }
  console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}

главная().catch(е => { console.error('Проверка упала: ' + (е && е.stack || е)); process.exit(2); });
