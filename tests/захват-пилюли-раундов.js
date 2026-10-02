'use strict';
/* =====================================================================
   ПРОВЕРКА (браузер, нужен playwright): «Захват» — ряд пилюль «Раундов»
   (10 · 15 · 20 · «До победы») в обоих лобби на ширинах 320 и 390.
   Этап Р9б: на 320 слово «До победы» переполняло пилюлю.

   Что требуется в каждом лобби (с ботами: #захват-выбор-раунды, онлайн: #захват-онлайн-раунды):
     - пилюль ровно 4 (ноль найденного — провал);
     - у каждой scrollWidth <= clientWidth (слово не вылезает);
     - текст в одну строку (одна линия текста), высота у всех пилюль одна и не меньше 48;
     - шрифт не меньше 13 px;
     - у страницы нет горизонтальной прокрутки, пилюли целиком в окне.

   Запуск (перед ним: node штаб/браузер-занят.js --ждать):
       node tests/захват-пилюли-раундов.js                    — проверка и снимки
       node tests/захват-пилюли-раундов.js --css ФАЙЛ         — отдать странице другой style-захват.css (копию)
       node tests/захват-пилюли-раундов.js --сломать ПАПКА    — ломающий запуск: в ПАПКЕ (временной, вне проекта)
           делается копия style-захват.css с раздутыми отступами пилюль, проверка гоняется по ней
           и обязана покраснеть. Настоящий файл не трогается.
   Снимки: tests/снимки/захват-р9б/лобби-{с-ботами,онлайн}-{320,390}.png (в ломающем запуске не пишутся).
   Выход: 0 — зелёное; 1 — есть провалы; 2 — ломающий запуск не покраснел; 3 — в копии нет места для порчи.
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const аргументы = process.argv.slice(2);
function значениеДовода(имя) {
  const где = аргументы.indexOf(имя);
  return где !== -1 && аргументы[где + 1] && !аргументы[где + 1].startsWith('--') ? аргументы[где + 1] : null;
}
const ПАПКА_ПОРЧИ = значениеДовода('--сломать');
const ФАЙЛ_CSS = значениеДовода('--css') ? path.resolve(значениеДовода('--css')) : null;

const ЛОББИ = [
  { имя: 'с-ботами', id: 'захват-выбор-раунды' },
  { имя: 'онлайн', id: 'захват-онлайн-раунды' }
];

let всего = 0, провалов = 0;
function проверка(имя, условие, подробности) {
  всего++;
  if (!условие) {
    провалов++;
    console.log('ПРОВАЛ: ' + имя + (подробности ? ' — ' + подробности : ''));
  } else if (process.env.ПОДРОБНО) {
    console.log('ок: ' + имя);
  }
  return !!условие;
}

/* ---------- свой статический сервер (не 8790) ---------- */

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};
const внутри = (папка, путь) => !path.relative(папка, путь).startsWith('..') && !path.isAbsolute(path.relative(папка, путь));

function поднятьСервер() {
  const сервер = http.createServer((запрос, ответ) => {
    let путь = '/';
    try { путь = decodeURIComponent(запрос.url.split('?')[0]); } catch (_) { /* как есть */ }
    let файл = path.join(КОРЕНЬ, путь === '/' ? 'index.html' : путь);
    // Подмена оформления «Захвата» копией — для ломающего запуска.
    if (ФАЙЛ_CSS && путь === '/style-захват.css') файл = ФАЙЛ_CSS;
    if ((файл === ФАЙЛ_CSS || внутри(КОРЕНЬ, файл)) && fs.existsSync(файл) && fs.statSync(файл).isFile()) {
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
      ответ.end(fs.readFileSync(файл));
      return;
    }
    ответ.writeHead(404); ответ.end('нет такого файла');
  });
  return new Promise(готово => сервер.listen(0, '127.0.0.1', () => готово(сервер)));
}

/* ---------- замер в странице ---------- */

/** Выполняется в браузере: всё про ряд пилюль с данным id. */
function замерРяда(id) {
  const ряд = document.getElementById(id);
  const кнопки = ряд ? Array.from(ряд.querySelectorAll('button')) : [];
  const ш = window.innerWidth;
  return {
    кнопок: кнопки.length,
    подписи: кнопки.map(к => к.textContent),
    тесные: кнопки.filter(к => к.scrollWidth > к.clientWidth + 0.5).map(к => к.textContent + ' (' + к.scrollWidth + '>' + к.clientWidth + ')'),
    // Одна линия текста: у внутреннего узла текста ровно один прямоугольник строки.
    многострочные: кнопки.filter(к => {
      const диапазон = document.createRange();
      диапазон.selectNodeContents(к);
      const строки = new Set(Array.from(диапазон.getClientRects()).map(р => Math.round(р.top)));
      return строки.size > 1;
    }).map(к => к.textContent),
    высоты: кнопки.map(к => Math.round(к.getBoundingClientRect().height * 10) / 10),
    ширины: кнопки.map(к => Math.round(к.getBoundingClientRect().width * 10) / 10),
    шрифты: кнопки.map(к => parseFloat(getComputedStyle(к).fontSize)),
    вОкне: кнопки.every(к => { const р = к.getBoundingClientRect(); return р.width > 0 && р.left >= -0.5 && р.right <= ш + 0.5; }),
    прокрутка: document.documentElement.scrollWidth > ш + 1
  };
}

/* ---------- обход ---------- */

async function снять() {
  const { chromium, подготовитьПодделку } = require(path.join(КОРЕНЬ, 'tests', 'браузер-робот.js'));
  const ПАПКА = path.join(КОРЕНЬ, 'tests', 'снимки', 'захват-р9б');
  fs.mkdirSync(ПАПКА, { recursive: true });
  const сервер = await поднятьСервер();
  const порт = сервер.address().port;
  const браузер = await chromium.launch();
  const снимки = [];
  try {
    for (const ш of [320, 390]) {
      for (const лобби of ЛОББИ) {
        const контекст = await браузер.newContext({ viewport: { width: ш, height: 844 } });
        const страница = await контекст.newPage();
        await подготовитьПодделку(страница, {});
        // Игрок не новичок: иначе «Играть с ботами» сразу начинает партию, минуя настройки.
        await страница.addInitScript(() => { try { localStorage.setItem('zahvat-learned', '1'); } catch (_) { /* пусто */ } });
        const ошибки = [];
        страница.on('console', с => { if (с.type() === 'error' && (с.location().url || '').indexOf('telegram-web-app.js') === -1) ошибки.push(с.text()); });
        страница.on('pageerror', е => ошибки.push('необработанная ошибка: ' + е.message));
        await страница.goto('http://127.0.0.1:' + порт + '/захват.html', { waitUntil: 'load' });
        await страница.waitForTimeout(600);
        if (лобби.имя === 'онлайн') {
          await страница.evaluate(() => window.ЗахватЭкран.показатьЭкран('экран-друга'));
        } else {
          await страница.click('#захват-боты');
        }
        await страница.waitForTimeout(400);
        // Ряд раундов может лежать ниже окна — подвести к нему, чтобы он был на снимке.
        await страница.evaluate(id => { const у = document.getElementById(id); if (у) у.scrollIntoView({ block: 'center' }); }, лобби.id);
        await страница.waitForTimeout(150);
        const з = await страница.evaluate(замерРяда, лобби.id);
        const п = 'лобби ' + лобби.имя + ' ' + ш + ': ';
        console.log(п + 'подписи ' + з.подписи.join(' | ') + '; ширины ' + з.ширины.join('/') + '; высоты ' + з.высоты.join('/') + '; шрифт ' + з.шрифты.join('/'));
        проверка(п + 'пилюль ровно 4 (ноль — провал)', з.кнопок === 4, 'нашлось ' + з.кнопок);
        проверка(п + 'слова не вылезают из пилюль', з.кнопок > 0 && з.тесные.length === 0, 'тесно: ' + з.тесные.join(', '));
        проверка(п + 'текст в одну строку', з.кнопок > 0 && з.многострочные.length === 0, 'в несколько строк: ' + з.многострочные.join(', '));
        проверка(п + 'высота у всех пилюль одна и не меньше 48', з.кнопок > 0 && Math.max(...з.высоты) - Math.min(...з.высоты) <= 1 && Math.min(...з.высоты) >= 48, з.высоты.join('/'));
        проверка(п + 'шрифт не меньше 13', з.кнопок > 0 && Math.min(...з.шрифты) >= 13, з.шрифты.join('/'));
        проверка(п + 'пилюли целиком в окне', з.кнопок > 0 && з.вОкне);
        проверка(п + 'нет горизонтальной прокрутки', !з.прокрутка);
        проверка(п + 'консоль чистая', ошибки.length === 0, ошибки.join(' | '));
        if (!ФАЙЛ_CSS) {
          const файл = path.join(ПАПКА, 'лобби-' + лобби.имя + '-' + ш + '.png');
          await страница.screenshot({ path: файл });
          снимки.push(файл);
        }
        await контекст.close();
      }
    }
  } finally {
    await браузер.close();
    сервер.close();
  }
  снимки.forEach(ф => console.log('Снимок: ' + path.relative(КОРЕНЬ, ф)));
}

/* ---------- ломающий запуск на копии css ---------- */

function ломающийЗапуск(папка) {
  fs.mkdirSync(папка, { recursive: true });
  const исходник = fs.readFileSync(path.join(КОРЕНЬ, 'style-захват.css'), 'utf8');
  // Порча: к концу файла дописываются раздутые отступы и жёсткая ширина текста пилюль —
  // слово «До победы» обязано перестать влезать.
  const порча = '\n.захват-выбор-числа > button { padding-inline: 20px !important; flex: 1 1 0 !important; }\n';
  if (!/\.захват-выбор-числа\s*>\s*button/.test(исходник)) {
    console.log('ПОРЧА НЕ СДЕЛАНА: в style-захват.css нет правила пилюль .захват-выбор-числа > button');
    process.exit(3);
  }
  const копия = path.join(папка, 'style-захват-сломан.css');
  fs.writeFileSync(копия, исходник + порча);
  const итог = spawnSync(process.execPath, [__filename, '--css', копия], { encoding: 'utf8' });
  const красное = итог.status === 1;
  console.log((красное ? 'покраснело: ' : 'НЕ ПОКРАСНЕЛО: ') + 'раздутые отступы пилюль (код ' + итог.status + ')');
  if (process.env.ПОДРОБНО || !красное) console.log(итог.stdout);
  process.exit(красное ? 0 : 2);
}

(async function () {
  if (ПАПКА_ПОРЧИ) ломающийЗапуск(path.resolve(ПАПКА_ПОРЧИ));
  try { await снять(); } catch (ошибка) {
    всего++; провалов++;
    console.log('ПРОВАЛ: обход упал — ' + (ошибка && ошибка.stack ? ошибка.stack.split('\n').slice(0, 3).join(' / ') : ошибка));
  }
  console.log('Итого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов > 0 ? 1 : 0);
})();
