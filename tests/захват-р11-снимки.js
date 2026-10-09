'use strict';
/* =====================================================================
   БРАУЗЕРНАЯ ПРОВЕРКА И СНИМКИ (Р25в, «Захват», правки Р23: капсулы игроков). Нужен playwright/chromium.
   Ширины: 320×640 и 390×844. Снимки — tests/снимки/р25/<имя>-<ширина>.png.
     (а) шесть игроков, лидер с меткой «ведёт»: у каждой капсулы счёт словом «N очков» (по узлу счёта),
         ни один узел капсулы не обрезан (нет «…», scrollWidth ≤ clientWidth), слово «ведёт» влезает по ширине,
         капсулы не налезают на карту (ниже верха окна карты) и друг на друга;
     (б) раскрытие раунда (Р23в): в #захват-как-ходить пусто; на пластине виден ведущий «+N — новые войска соперников»
         целиком; строки «пришли войска» нет; высота пульта в раскрытии ≤ высоты пульта в расстановке.
   Партии — на заданном зерне; владельцев областей раздаём сами (приём как у tests/захват-р17-снимки.js).
   Запуск (перед ним: node штаб/браузер-занят.js):
       node tests/захват-р11-снимки.js
       node tests/захват-р11-снимки.js --сломать          — КОПИЯ style-захват.css: капсула шириной 40 px; обязан покраснеть
       node tests/захват-р11-снимки.js --сломать-шрифт    — КОПИЯ style-захват.css: «ведёт» 30 px; обязан покраснеть
   Порча делается подменой ответа на запрос css в странице; файлы проекта не трогаются.
   Выход: 0 — зелёное; 1 — есть провалы. Свой сервер статики — на порту от системы (не 8790 и не 8765), гасится в конце.
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const КОРЕНЬ = path.join(__dirname, '..');
const ломаемШирину = process.argv.includes('--сломать');
const ломаемШрифт = process.argv.includes('--сломать-шрифт');
const ломаемВедущего = process.argv.includes('--сломать-ведущего');
const ломаем = ломаемШирину || ломаемШрифт || ломаемВедущего;
const ПАПКА = ломаем ? fs.mkdtempSync(path.join(os.tmpdir(), 'захват-р25-')) : path.join(КОРЕНЬ, 'tests', 'снимки', 'р25');
const РАЗМЕРЫ = [{ ш: 320, в: 640 }, { ш: 390, в: 844 }];

let всего = 0, провалов = 0;
function проверить(имя, условие, подробности) {
  всего++;
  if (!условие) { провалов++; console.log('ПРОВАЛ: ' + имя + (подробности ? ' — ' + подробности : '')); }
  return !!условие;
}

/* ---------- в странице ---------- */

function заводПартии(арг) {
  const ген = (с) => { let з = с >>> 0; return () => { з = (з + 0x6D2B79F5) | 0; let т = Math.imul(з ^ (з >>> 15), 1 | з); т = (т + Math.imul(т ^ (т >>> 7), 61 | т)) ^ т; return ((т ^ (т >>> 14)) >>> 0) / 4294967296; }; };
  Math.random = ген(арг.зерно);
  const Р = window.ЗахватПравила;
  const ключи = ['человек'];
  for (let н = 1; н < арг.игроков; н++) ключи.push('бот-' + н);
  const партия = Р.новаяПартия({ игроки: ключи, люди: ['человек'], сейчас: Date.now(), раундовЗахвата: 15 }, Math.random);
  const столицы = new Set(партия.столицы.map((с) => с.область));
  if (арг.раздача) {
    const простые = [];
    партия.хозяева.forEach((х, н) => { if (н > 0 && !столицы.has(н)) { простые.push(н); партия.хозяева[н] = null; } });
    let взято = 0;
    ключи.forEach((к) => { for (let и = 0; и < (арг.раздача[к] || 0); и++) партия.хозяева[простые[взято++]] = к; });
  }
  window.__партия = партия;
  window.ЗахватЭкран.начатьПартиюСБотами(партия, { мест: арг.игроков, уровень: 'обычный', раундовЗахвата: 15, новичок: false });
}

// Замер капсул: узлы, обрезка, счёт, «ведёт», пересечения с картой и друг с другом.
function замерКапсул() {
  const капсулы = Array.from(document.querySelectorAll('#захват-игроки .захват-игрок')).filter((у) => !у.classList.contains('скрыт') && у.getBoundingClientRect().height > 0);
  const окно = window.ЗахватСтол.замеритьОкно(document);
  const карта = document.getElementById('захват-карта').getBoundingClientRect();
  const верхКарты = окно ? карта.top + окно.верх : null;
  const прямоугольники = капсулы.map((у) => у.getBoundingClientRect());
  let пересечений = 0;
  for (let а = 0; а < прямоугольники.length; а++) for (let б = а + 1; б < прямоугольники.length; б++) {
    const x = прямоугольники[а], y = прямоугольники[б];
    if (x.left < y.right - 0.5 && y.left < x.right - 0.5 && x.top < y.bottom - 0.5 && y.top < x.bottom - 0.5) пересечений++;
  }
  const узлы = [];
  let многоточий = 0;
  const счета = [];
  let ведущих = 0, ведётВлезает = true, ведётСлово = null, ведётШрифт = null;
  капсулы.forEach((у, н) => {
    ['захват-игрок__имя', 'захват-игрок__метка', 'захват-игрок__счёт', 'захват-игрок__готов'].forEach((к) => {
      const в = у.querySelector('.' + к);
      if (!в) return;
      узлы.push({ н: н, класс: к, текст: (в.textContent || '').trim(), обрезан: в.scrollWidth > в.clientWidth + 0.5 });
      if ((в.textContent || '').indexOf('…') !== -1) многоточий++;
    });
    const сч = у.querySelector('.захват-игрок__счёт');
    счета.push(сч ? (сч.textContent || '').trim() : null);
    узлы.push({ н: н, класс: 'капсула', текст: '', обрезан: у.scrollWidth > у.clientWidth + 0.5 });
    if (у.classList.contains('захват-игрок--ведёт')) {
      ведущих++;
      const ст = getComputedStyle(у, '::after');
      ведётСлово = ст.content;
      ведётШрифт = ст.fontSize;
      // Ширина слова «ведёт» (у псевдоэлемента scrollWidth не измерить): тот же шрифт во временном узле.
      const пробник = document.createElement('span');
      пробник.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + ст.font + ';letter-spacing:' + ст.letterSpacing;
      пробник.textContent = 'ведёт';
      document.body.appendChild(пробник);
      const ширинаСлова = пробник.getBoundingClientRect().width;
      пробник.remove();
      const кс = getComputedStyle(у);
      const внутри = у.clientWidth - parseFloat(кс.paddingLeft) - parseFloat(кс.paddingRight);
      ведётВлезает = ширинаСлова <= внутри + 0.5;
    }
  });
  return {
    видимых: капсулы.length, узлов: узлы.length, узлы: узлы, многоточий: многоточий, счета: счета, ведущих: ведущих,
    ведётСлово: ведётСлово, ведётШрифт: ведётШрифт, ведётВлезает: ведётВлезает, пересечений: пересечений,
    нижняяГраница: Math.max.apply(null, прямоугольники.map((р) => р.bottom)), верхКарты: верхКарты,
    вОкне: прямоугольники.every((р) => р.left >= -0.5 && р.right <= window.innerWidth + 0.5),
    высоты: прямоугольники.map((р) => Math.round(р.height * 10) / 10)
  };
}

function замерСтроки() {
  const с = document.getElementById('захват-как-ходить');
  if (!с) return { есть: false };
  const р = с.getBoundingClientRect();
  const пульт = document.getElementById('захват-пульт').getBoundingClientRect();
  return {
    есть: true, текст: (с.textContent || '').trim(), виден: !с.classList.contains('скрыт') && р.height > 0 && getComputedStyle(с).visibility !== 'hidden',
    вОкне: р.left >= -0.5 && р.right <= window.innerWidth + 0.5, вПульте: р.left >= пульт.left - 0.5 && р.right <= пульт.right + 0.5,
    обрезана: с.scrollWidth > с.clientWidth + 0.5, ширина: р.width, высота: р.height, строк: Math.round(р.height / (parseFloat(getComputedStyle(с).lineHeight) || р.height))
  };
}

/* ---------- сервер и страница ---------- */

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};
function поднятьСервер() {
  const с = http.createServer((запрос, ответ) => {
    let п = '/';
    try { п = decodeURIComponent(запрос.url.split('?')[0]); } catch (_) { /* как есть */ }
    const файл = path.join(КОРЕНЬ, п === '/' ? 'index.html' : п);
    if (!path.relative(КОРЕНЬ, файл).startsWith('..') && fs.existsSync(файл) && fs.statSync(файл).isFile()) {
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
      ответ.end(fs.readFileSync(файл));
    } else { ответ.writeHead(404); ответ.end('нет такого файла'); }
  });
  return new Promise((г) => с.listen(0, '127.0.0.1', () => г(с)));
}

async function страницаШириной(браузер, порт, ш, в, ошибки) {
  const { подготовитьПодделку, перехватить } = require('./браузер-робот.js');
  const контекст = await браузер.newContext({ viewport: { width: ш, height: в } });
  const страница = await контекст.newPage();
  await подготовитьПодделку(страница, {});
  if (ломаемВедущего) {
    // Порча: КОПИЯ игры/захват/захват-раскрытие.js, где ведущий заменён на прежнюю строку «пришли войска»; страница получает копию.
    const исходник = fs.readFileSync(path.join(КОРЕНЬ, 'игры', 'захват', 'захват-раскрытие.js'), 'utf8');
    if (исходник.indexOf("'+N — новые войска соперников'") === -1) throw new Error('порча не применилась: ведущего в игры/захват/захват-раскрытие.js нет');
    fs.mkdirSync(ПАПКА, { recursive: true });
    const копияЖ = path.join(ПАПКА, 'захват-раскрытие-испорчен.js');
    fs.writeFileSync(копияЖ, исходник.replace("'+N — новые войска соперников'", "'+N — пришли войска, −N — погибли'"));
    const телоЖ = fs.readFileSync(копияЖ);
    const { перехватить: перехватитьЖ } = require('./браузер-робот.js');
    await перехватитьЖ(страница, /\/игры\/захват\/захват-раскрытие\.js(\?|$)/, (путь) => путь.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: телоЖ }));
  } else if (ломаем) {
    // Порча: КОПИЯ оформления во временной папке с лишним правилом в конце; страница получает её вместо настоящего файла.
    const css = fs.readFileSync(path.join(КОРЕНЬ, 'игры/захват/style-захват.css'), 'utf8');
    const порча = ломаемШирину
      ? '\n.захват-игрок { width: 40px !important; flex: 0 0 40px !important; flex-basis: 40px !important; }\n'
      : '\n.захват-игрок--ведёт::after { font-size: 30px !important; line-height: 36px !important; }\n';
    const копия = path.join(ПАПКА, 'style-захват-испорчен.css');
    fs.writeFileSync(копия, css + порча);
    const тело = fs.readFileSync(копия);
    await перехватить(страница, /\/style-захват\.css(\?|$)/, (путь) => путь.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: тело }));
  }
  await страница.addInitScript(() => { try { localStorage.setItem('zahvat-learned', '1'); } catch (_) { /* пусто */ } });
  страница.on('console', (с) => { if (с.type() === 'error' && (с.location().url || '').indexOf('telegram-web-app.js') === -1) ошибки.push(ш + ': ' + с.text()); });
  страница.on('pageerror', (е) => ошибки.push(ш + ': необработанная ошибка: ' + е.message));
  await страница.goto('http://127.0.0.1:' + порт + '/захват.html', { waitUntil: 'load' });
  await страница.waitForTimeout(700);
  return { контекст, страница };
}

async function снять(страница, имя, ш) {
  fs.mkdirSync(ПАПКА, { recursive: true });
  const файл = path.join(ПАПКА, имя + '-' + ш + '.png');
  await страница.screenshot({ path: файл });
  if (!ломаем) console.log('    снимок: ' + path.relative(КОРЕНЬ, файл).replace(/\\/g, '/'));
}

/* ---------- обход ---------- */

async function обходШирины(браузер, порт, { ш, в }, ошибки) {
  const п = ' [' + ш + '×' + в + ']';
  const { контекст, страница } = await страницаШириной(браузер, порт, ш, в, ошибки);
  try {
    // (а) шесть игроков, человек ведёт.
    await страница.evaluate(заводПартии, { зерно: 33, игроков: 6, раздача: { 'человек': 4, 'бот-1': 2, 'бот-2': 2, 'бот-3': 2, 'бот-4': 2, 'бот-5': 2 } });
    await страница.waitForTimeout(1200);
    const к = await страница.evaluate(замерКапсул);
    проверить('(а) видны 6 капсул (ноль — провал)' + п, к.видимых === 6, 'видимых ' + к.видимых);
    проверить('(а) найдены узлы капсул: не меньше 6×5 (ноль — провал)' + п, к.узлов >= 30, 'узлов ' + к.узлов);
    const счётКривой = к.счета.filter((с) => !/^\d+ очк(о|а|ов)$/.test(с || ''));
    проверить('(а) у всех шести узел счёта — «N очко/очка/очков» (ровно 6 узлов)' + п, к.счета.length === 6 && счётКривой.length === 0, JSON.stringify(к.счета));
    const обрезанные = к.узлы.filter((у) => у.обрезан);
    проверить('(а) ни один узел капсулы не обрезан (scrollWidth ≤ clientWidth)' + п, обрезанные.length === 0, JSON.stringify(обрезанные));
    проверить('(а) в капсулах нет «…»' + п, к.многоточий === 0, 'многоточий ' + к.многоточий);
    проверить('(а) метка «ведёт» ровно у одного, слово нарисовано (ноль — провал)' + п, к.ведущих === 1 && к.ведётСлово === '"ведёт"', 'ведущих ' + к.ведущих + ', слово ' + к.ведётСлово);
    проверить('(а) слово «ведёт» по ширине влезает в капсулу' + п, к.ведущих === 1 && к.ведётВлезает, 'шрифт ' + к.ведётШрифт);
    проверить('(а) «ведёт» — 12 px' + п, к.ведётШрифт === '12px', String(к.ведётШрифт));
    проверить('(а) капсулы друг на друга не налезают' + п, к.пересечений === 0, 'пересечений ' + к.пересечений);
    проверить('(а) капсулы целиком в ширине окна' + п, к.вОкне);
    проверить('(а) капсулы не налезают на карту (низ капсул ≤ верх видимой карты; окно карты найдено)' + п,
      к.верхКарты !== null && к.нижняяГраница <= к.верхКарты + 0.5, 'низ капсул ' + Math.round(к.нижняяГраница) + ', верх карты ' + (к.верхКарты === null ? 'не найден' : Math.round(к.верхКарты)));
    console.log('    капсулы' + п + ': высоты ' + к.высоты.join('/') + ', счета ' + к.счета.join(' | '));
    await снять(страница, 'а-капсулы-ведёт-очки', ш);

    // (б) раскрытие раунда: «Готово» → строка под пластиной.
    await страница.evaluate(заводПартии, { зерно: 31, игроков: 3 });
    await страница.waitForTimeout(1000);
    const высотаРасстановки = await страница.evaluate(() => document.getElementById('захват-пульт').getBoundingClientRect().height);
    await страница.click('#захват-готово');
    if (await страница.evaluate(() => { const у = document.getElementById('захват-остаток'); return !!у && !у.classList.contains('скрыт'); })) {
      await страница.click('#захват-остаток-да', { timeout: 4000 }).catch(() => {});
    }
    const идёт = await страница.waitForFunction(() => document.getElementById('захват-готово').classList.contains('захват-готово--пропуск'),
      null, { timeout: 8000, polling: 50 }).then(() => true, () => false);
    проверить('(б) раскрытие раунда началось после «Готово» (ноль — провал)' + п, идёт);
    const сразу = await страница.evaluate(замерСтроки);
    await страница.waitForTimeout(500);
    const с = await страница.evaluate(замерСтроки);
    console.log('    строка в первый миг показа' + п + ': видна=' + сразу.виден + ', пульт: ' + (await страница.evaluate(() => document.getElementById('захват-пульт').className)));
    проверить('(б) узел строки раскрытия найден (ноль — провал)' + п, с.есть);
    // Р23в: общей строки «пришли войска» нет; в раскрытии виден только ведущий пластины (игры/захват/захват-раскрытие.js).
    проверить('(б) в раскрытии #захват-как-ходить пуста или скрыта' + п, с.есть && (!с.виден || с.текст === ''), JSON.stringify(с));
    const вед = await страница.evaluate(() => {
      const пл = document.getElementById('захват-пластина');
      const р = пл ? пл.getBoundingClientRect() : null;
      const узлы = пл ? Array.from(pl_all(пл)) : [];
      function pl_all(к) { return к.querySelectorAll('*'); }
      const целый = узлы.filter((у) => (у.textContent || '').trim() === '+N — новые войска соперников' && у.children.length === 0);
      const у = целый[0];
      const р2 = у ? у.getBoundingClientRect() : null;
      return {
        найдено: целый.length, пластинаВидна: !!пл && !пл.classList.contains('скрыт') && !!р && р.height > 0,
        виден: !!р2 && р2.height > 0 && getComputedStyle(у).visibility !== 'hidden',
        вОкне: !!р2 && р2.left >= -0.5 && р2.right <= window.innerWidth + 0.5,
        обрезан: !!у && у.scrollWidth > у.clientWidth + 0.5,
        всеНаПластине: пл ? (пл.textContent || '') : '',
        пришлиВойска: ((document.getElementById('захват-пульт') || {}).textContent || '').indexOf('пришли войска') !== -1 || (пл ? пл.textContent : '').indexOf('пришли войска') !== -1
      };
    });
    проверить('(б) ведущий «+N — новые войска соперников» найден целиком (ноль — провал)' + п, вед.найдено >= 1, JSON.stringify(вед));
    проверить('(б) ведущий виден, в окне и не обрезан' + п, вед.найдено >= 1 && вед.пластинаВидна && вед.виден && вед.вОкне && !вед.обрезан, JSON.stringify(вед));
    проверить('(б) строки «пришли войска» нет ни в пульте, ни на пластине' + п, !вед.пришлиВойска, вед.всеНаПластине);
    const высотаРаскрытия = await страница.evaluate(() => document.getElementById('захват-пульт').getBoundingClientRect().height);
    проверить('(б) высота пульта в раскрытии ≤ высоты пульта в расстановке' + п, высотаРаскрытия <= высотаРасстановки + 0.5, 'раскрытие ' + высотаРаскрытия + ' px, расстановка ' + высотаРасстановки + ' px');
    console.log('    пульт' + п + ': в расстановке ' + высотаРасстановки + ' px, в раскрытии ' + высотаРаскрытия + ' px; строка как-ходить: видна=' + с.виден + ', текст «' + с.текст + '»');
    await снять(страница, 'б-раскрытие-строка', ш);
  } catch (е) {
    проверить('обход не упал' + п, false, String(е && е.stack || е).split('\n').slice(0, 3).join(' / '));
  }
  await контекст.close();
}

(async function () {
  const { chromium } = require('./браузер-робот.js');
  const сервер = await поднятьСервер();
  const порт = сервер.address().port;
  console.log('Сервер проверки: порт ' + порт + ', PID ' + process.pid + (ломаемШирину ? ' (порча: капсула 40 px)' : '') + (ломаемШрифт ? ' (порча: «ведёт» 30 px)' : ''));
  const ошибки = [];
  const браузер = await chromium.launch();
  try {
    for (const р of РАЗМЕРЫ) { console.log('\n=== ' + р.ш + '×' + р.в + ' ==='); await обходШирины(браузер, порт, р, ошибки); }
    проверить('консоль чистая', ошибки.length === 0, ошибки.slice(0, 3).join(' | '));
  } catch (е) {
    проверить('проверка не упала', false, String(е && е.stack || е).split('\n').slice(0, 3).join(' / '));
  } finally {
    await браузер.close();
    сервер.close();
  }
  console.log('Итого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
})();
