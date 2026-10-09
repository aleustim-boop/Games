'use strict';
// БРАУЗЕРНАЯ проверка (playwright, настоящий Chromium).
// Запуск:                 node tests/аватар-в-кружке.js
// Другой корень страниц:  node tests/аватар-в-кружке.js --корень=<папка>
// Ломающий запуск (обязан покраснеть):
//   node tests/аватар-в-кружке.js --сломать --копия=<папка для копии>
//   (сам делает КОПИЮ страниц/оформления/js в <папке>, вырезает из копии
//    style-аватар.css строки «mask:none» и идёт с --корень=<копия>;
//    файлы проекта не трогает. Картинки img/ копия берёт из проекта.)
// Перед запуском: node штаб/браузер-занят.js --ждать

/* =====================================================================
   ФОТО ИГРОКА В КРУЖКЕ КАРТОЧКИ ПРОФИЛЯ.
   Раньше значок-человечек рисовался маской и резал фото по силуэту,
   а у захвата ещё мешали отступ и рамка. Проверка берёт настоящие
   страницы лобби, подставляет игроку фото (яркий квадрат из четырёх
   разноцветных четвертей), находит кружок с классом «тг-аватар» в
   карточке профиля и меряет числами:
     (а) маска (mask-image и -webkit-mask-image) = none;
     (б) кружок круглый: радиус скругления не меньше половины, ширина = высота ±1;
     (в) картинка накрывает кружок целиком (допуск 1 точка), отступ кружка 0;
     (г) по пикселям снимка: в центре и в четырёх точках на 70% радиуса
         по диагоналям — цвета соответствующих четвертей.
   Список страниц берётся из js/игры-реестр.js (игры без поля «спрятана»).
   Ноль найденного кружка — ПРОВАЛ, не пропуск. Страницы, где карточки
   профиля с фото по устройству нет, названы явным перечнем ниже и тоже
   проверяются (карточка с кружком там появиться не должна — иначе список устарел).
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const { chromium, подготовитьПодделку, перехватить } = require('./браузер-робот.js');

const КОРЕНЬ_ПРОЕКТА = path.join(__dirname, '..');
const аргумент = (имя) => { const а = process.argv.find((x) => x.indexOf('--' + имя + '=') === 0); return а ? а.slice(имя.length + 3) : ''; };
const СЛОМАТЬ = process.argv.indexOf('--сломать') !== -1;
let КОРЕНЬ = аргумент('корень') ? path.resolve(аргумент('корень')) : КОРЕНЬ_ПРОЕКТА;
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки', 'аватар-в-кружке' + (СЛОМАТЬ || КОРЕНЬ !== КОРЕНЬ_ПРОЕКТА ? '-сломано' : ''));

/* Страницы видимых игр, где фото игрока по устройству не показывается:
   одиночные игры без профиля в лобби. Проверка всё равно открывает их и
   убеждается, что кружка с фото в карточке профиля там и правда нет. */
const ТУТ_ФОТО_НЕТ = ['sudoku.html', 'mines.html', 'fifteen.html', 'wordsearch.html', 'бастион.html'];

let всего = 0, провалов = 0;
function проверить(имя, годно, детали) {
  всего += 1;
  console.log('  ' + (годно ? 'ок    — ' : 'ПЛОХО — ') + имя + (детали ? ' (' + детали + ')' : ''));
  if (!годно) провалов += 1;
}

/* ---------- ломающий запуск: копия без «mask:none» ---------- */
if (СЛОМАТЬ) {
  const папка = аргумент('копия');
  if (!папка) { console.error('Для --сломать нужен --копия=<папка>'); process.exit(2); }
  fs.mkdirSync(папка, { recursive: true });
  for (const имя of fs.readdirSync(КОРЕНЬ_ПРОЕКТА)) {
    if (/\.(html|css)$/.test(имя)) fs.copyFileSync(path.join(КОРЕНЬ_ПРОЕКТА, имя), path.join(папка, имя));
  }
  fs.cpSync(path.join(КОРЕНЬ_ПРОЕКТА, 'js'), path.join(папка, 'js'), { recursive: true });
  const css = path.join(папка, 'style-аватар.css');
  const было = fs.readFileSync(css, 'utf8');
  const стало = было.replace(/-webkit-mask:none!important;\s*/g, '').replace(/(^|[;{\s])mask:none!important;\s*/g, '$1');
  if (стало === было) { console.error('В копии нечего ломать — «mask:none» не нашлось, устройство файла изменилось'); process.exit(2); }
  fs.writeFileSync(css, стало);
  КОРЕНЬ = path.resolve(папка);
  console.log('*** ЛОМАЮЩИЙ ЗАПУСК: корень — копия без «mask:none» в style-аватар.css: ' + КОРЕНЬ + ' ***\n');
}

/* ---------- картинка: четыре цветные четверти ---------- */
const ЦВЕТА = { лв: [230, 30, 30], пв: [30, 200, 40], лн: [30, 70, 240], пн: [240, 220, 20] };
const ТАБЛИЦА_CRC = (function () { const т = []; for (let n = 0; n < 256; n++) { let с = n; for (let k = 0; k < 8; k++) с = (с & 1) ? (0xEDB88320 ^ (с >>> 1)) : (с >>> 1); т.push(с >>> 0); } return т; })();
function crc32(б) { let c = 0xFFFFFFFF; for (let i = 0; i < б.length; i++) c = ТАБЛИЦА_CRC[(c ^ б[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function чанк(тип, д) { const т = Buffer.from(тип, 'ascii'), дл = Buffer.alloc(4), кс = Buffer.alloc(4); дл.writeUInt32BE(д.length); кс.writeUInt32BE(crc32(Buffer.concat([т, д]))); return Buffer.concat([дл, т, д, кс]); }
function собратьЧетверти(n) {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(n, 0); ih.writeUInt32BE(n, 4); ih[8] = 8; ih[9] = 2;
  const строка = n * 3 + 1, сырые = Buffer.alloc(строка * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const ц = y < n / 2 ? (x < n / 2 ? ЦВЕТА.лв : ЦВЕТА.пв) : (x < n / 2 ? ЦВЕТА.лн : ЦВЕТА.пн);
    const о = y * строка + 1 + x * 3; сырые[о] = ц[0]; сырые[о + 1] = ц[1]; сырые[о + 2] = ц[2];
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), чанк('IHDR', ih), чанк('IDAT', zlib.deflateSync(сырые)), чанк('IEND', Buffer.alloc(0))]);
}
const КАРТИНКА = собратьЧетверти(64);
const АДРЕС_ФОТО = 'https://avatar.test/four.png'; // телеграм-дверь пускает только латиницу/знаки адреса

/* ---------- разбор PNG снимка (8 бит, RGB/RGBA) ---------- */
function разобратьPNG(буфер) {
  let поз = 8, ш = 0, в = 0, тип = 0; const куски = [];
  while (поз < буфер.length) {
    const дл = буфер.readUInt32BE(поз), имя = буфер.toString('ascii', поз + 4, поз + 8), д = буфер.subarray(поз + 8, поз + 8 + дл);
    if (имя === 'IHDR') { ш = д.readUInt32BE(0); в = д.readUInt32BE(4); тип = д[9]; }
    if (имя === 'IDAT') куски.push(д);
    поз += 12 + дл;
  }
  const байт = тип === 6 ? 4 : 3, сырые = zlib.inflateSync(Buffer.concat(куски)), стр = ш * байт, пикс = Buffer.alloc(стр * в);
  for (let y = 0; y < в; y++) {
    const ф = сырые[y * (стр + 1)];
    for (let i = 0; i < стр; i++) {
      const x = сырые[y * (стр + 1) + 1 + i];
      const a = i >= байт ? пикс[y * стр + i - байт] : 0, b = y ? пикс[(y - 1) * стр + i] : 0, c = (y && i >= байт) ? пикс[(y - 1) * стр + i - байт] : 0;
      let р;
      if (ф === 0) р = x; else if (ф === 1) р = x + a; else if (ф === 2) р = x + b; else if (ф === 3) р = x + ((a + b) >> 1);
      else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); р = x + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c)); }
      пикс[y * стр + i] = р & 255;
    }
  }
  return { ш: ш, в: в, цвет: (x, y) => { const о = y * стр + x * байт; return [пикс[о], пикс[о + 1], пикс[о + 2]]; } };
}
const расстояние = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
const ДОПУСК_ЦВЕТА = 60;
/* Центр лежит на стыке четвертей: пиксель там может быть смесью соседних цветов. Годится любой из четырёх, смесь двух или смесь всех четырёх; тёмный фон страницы не годится. */
const ВОЗМОЖНЫЕ_В_ЦЕНТРЕ = (function () { const в = Object.values(ЦВЕТА), р = в.slice(); for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) р.push([0, 1, 2].map((k) => (в[i][k] + в[j][k]) / 2)); р.push([0, 1, 2].map((k) => (в[0][k] + в[1][k] + в[2][k] + в[3][k]) / 4)); return р; })();

/* ---------- свой статический сервер (корень, запасной — проект) ---------- */
const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2' };
function поднятьСервер() {
  return new Promise((готово) => {
    const с = http.createServer((з, о) => {
      let п; try { п = decodeURIComponent(з.url.split('?')[0]); } catch (e) { п = '/'; }
      if (п === '/') п = '/index.html';
      for (const корень of [КОРЕНЬ, КОРЕНЬ_ПРОЕКТА]) {
        const файл = path.join(корень, п);
        if (файл.indexOf(корень) !== 0) continue;
        if (fs.existsSync(файл) && fs.statSync(файл).isFile()) {
          о.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
          о.end(fs.readFileSync(файл)); return;
        }
      }
      о.writeHead(404); о.end('нет');
    });
    с.listen(0, '127.0.0.1', () => готово(с));
  });
}

/* ---------- страницы из реестра ---------- */
const реестр = require(path.join(КОРЕНЬ, 'js', 'игры-реестр.js'));
/* Блоки, три в ряд и змейка спрятаны с витрины владельцем 29.09 (в реестре у них
   поля «спрятана» нет): их страницы в проверку не входят. */
const СПРЯТАНЫ_С_ВИТРИНЫ = ['blocks.html', 'match3.html', 'snake.html'];
const ВИДИМЫЕ = Array.from(new Set(реестр.все().filter((и) => !и.спрятана && и.страница && СПРЯТАНЫ_С_ВИТРИНЫ.indexOf(и.страница) === -1).map((и) => и.страница)));

const АДРЕС_СЕРВЕРА_ВЫДУМАННЫЙ = 'http://127.0.0.1:9';

/* Измерения кружка внутри страницы. Возвращает числа и ссылку на узел для снимка. */
function измерить() {
  const карточки = Array.from(document.querySelectorAll('.карточка-профиля'));
  const кружки = [];
  карточки.forEach((к) => { if (к.classList.contains('тг-аватар')) кружки.push(к); к.querySelectorAll('.тг-аватар').forEach((э) => кружки.push(э)); });
  return кружки.length;
}

async function проверитьКружок(страница, имяСнимка, селектор, ожидаетсяКартинка) {
  const кружок = await страница.waitForSelector(селектор, { state: 'visible', timeout: 8000 }).catch(() => null);
  проверить(имяСнимка + ': кружок с фото найден (' + селектор + ')', Boolean(кружок));
  if (!кружок) return;
  await страница.waitForFunction((с) => {
    const к = document.querySelector(с); if (!к) return false;
    const и = к.tagName === 'IMG' ? к : к.querySelector('img');
    if (и) return и.complete && и.naturalWidth > 0;
    return true;
  }, селектор, { timeout: 5000 }).catch(() => {});
  await страница.waitForTimeout(300);
  const м = await кружок.evaluate((к, ждём) => {
    const с = getComputedStyle(к), р = к.getBoundingClientRect();
    const и = к.tagName === 'IMG' ? к : к.querySelector('img');
    const ри = и ? и.getBoundingClientRect() : null;
    const рамкаЛ = parseFloat(с.borderLeftWidth) || 0, рамкаП = parseFloat(с.borderRightWidth) || 0, рамкаВ = parseFloat(с.borderTopWidth) || 0, рамкаН = parseFloat(с.borderBottomWidth) || 0;
    return {
      маска: с.maskImage, масWebkit: с.webkitMaskImage, радиус: с.borderTopLeftRadius,
      ш: р.width, в: р.height, л: р.left, п: р.right, в0: р.top, н: р.bottom,
      отступ: [с.paddingTop, с.paddingRight, с.paddingBottom, с.paddingLeft],
      рамка: [рамкаВ, рамкаП, рамкаН, рамкаЛ],
      есть: Boolean(и), иш: ри && ри.width, ив: ри && ри.height,
      ил: ри && ри.left, ип: ри && ри.right, ив0: ри && ри.top, ин: ри && ри.bottom,
      иЗагружена: и ? (и.complete && и.naturalWidth > 0) : null
    };
  });
  const чисто = (v) => v === 'none' || v === '' || v === undefined;
  проверить(имяСнимка + ' (а): mask-image = none', чисто(м.маска) && чисто(м.масWebkit), 'mask-image=' + м.маска + ', -webkit-mask-image=' + м.масWebkit);
  const радиусПикс = /%/.test(м.радиус) ? parseFloat(м.радиус) / 100 * Math.min(м.ш, м.в) : parseFloat(м.радиус);
  проверить(имяСнимка + ' (б): кружок круглый', м.ш > 10 && Math.abs(м.ш - м.в) <= 1 && радиусПикс >= Math.min(м.ш, м.в) / 2 - 0.5,
    'ширина=' + м.ш.toFixed(1) + ', высота=' + м.в.toFixed(1) + ', скругление=' + м.радиус);
  проверить(имяСнимка + ' (в): отступ кружка 0 и рамки нет', м.отступ.every((x) => parseFloat(x) === 0) && м.рамка.every((x) => x === 0),
    'отступ=' + м.отступ.join('/') + ', рамка=' + м.рамка.join('/'));
  if (ожидаетсяКартинка) {
    проверить(имяСнимка + ' (в): картинка есть и загружена', m_ок(м.есть && м.иЗагружена));
    if (м.есть) {
      const внутри = { л: м.л + м.рамка[3], п: м.п - м.рамка[1], в: м.в0 + м.рамка[0], н: м.н - м.рамка[2] };
      проверить(имяСнимка + ' (в): картинка накрывает кружок целиком',
        м.ил <= внутри.л + 1 && м.ип >= внутри.п - 1 && м.ив0 <= внутри.в + 1 && м.ин >= внутри.н - 1,
        'картинка ' + [м.ил, м.ив0, м.ип, м.ин].map((x) => x.toFixed(1)).join(',') + ' / кружок внутри ' + [внутри.л, внутри.в, внутри.п, внутри.н].map((x) => x.toFixed(1)).join(','));
    }
  }
  /* (г) пиксели */
  await кружок.scrollIntoViewIfNeeded().catch(() => {});
  const буфер = await кружок.screenshot();
  const png = разобратьPNG(буфер);
  const R = Math.min(png.ш, png.в) / 2, cx = png.ш / 2, cy = png.в / 2, d = 0.7 * R * Math.SQRT1_2;
  const точки = [['левый верх', -d, -d, ЦВЕТА.лв], ['правый верх', d, -d, ЦВЕТА.пв], ['левый низ', -d, d, ЦВЕТА.лн], ['правый низ', d, d, ЦВЕТА.пн]];
  for (const [название, dx, dy, цвет] of точки) {
    const c = png.цвет(Math.round(cx + dx), Math.round(cy + dy));
    проверить(имяСнимка + ' (г): точка «' + название + '» цвета своей четверти', расстояние(c, цвет) <= ДОПУСК_ЦВЕТА, 'видно rgb(' + c.join(',') + '), ждали rgb(' + цвет.join(',') + ')');
  }
  let лучший = 1e9, цвЦентр = null;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const c = png.цвет(Math.round(cx) + dx, Math.round(cy) + dy);
    for (const ц of ВОЗМОЖНЫЕ_В_ЦЕНТРЕ) { const р = расстояние(c, ц); if (р < лучший) { лучший = р; цвЦентр = c; } }
  }
  проверить(имяСнимка + ' (г): центр — цвет фото, а не фон', лучший <= ДОПУСК_ЦВЕТА, 'ближайший цвет rgb(' + (цвЦентр || []).join(',') + '), расстояние=' + Math.round(лучший));
}
function m_ок(x) { return Boolean(x); }

async function снимокКарточки(страница, селекторКарточки, имяФайла) {
  const к = await страница.$(селекторКарточки);
  if (!к) { проверить('снимок ' + имяФайла + ': карточка найдена', false, селекторКарточки); return; }
  await к.scrollIntoViewIfNeeded().catch(() => {});
  const путь = path.join(ПАПКА_СНИМКОВ, имяФайла + '.png');
  await к.screenshot({ path: путь });
  проверить('снимок записан: ' + путь, fs.existsSync(путь) && fs.statSync(путь).size > 0);
}

async function новаяСтраница(контекст, ошибки) {
  const страница = await контекст.newPage();
  страница.on('pageerror', (о) => ошибки.push('падение: ' + о.message));
  await подготовитьПодделку(страница, { версия: '8.0' });
  await страница.addInitScript('window.Telegram.WebApp.initDataUnsafe.user.photo_url = ' + JSON.stringify(АДРЕС_ФОТО) + ';');
  await перехватить(страница, /avatar\.test\/four\.png|127\.0\.0\.1:9\//, (путь, запрос, адрес) => {
    if (/avatar\.test\/four\.png/.test(адрес)) путь.fulfill({ status: 200, contentType: 'image/png', body: КАРТИНКА });
    else путь.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ ок: false }) });
  });
  return страница;
}

(async () => {
  fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
  console.log('=== Фото игрока в кружке карточки профиля. Корень страниц: ' + КОРЕНЬ + ' ===');
  console.log('Видимые страницы из реестра: ' + ВИДИМЫЕ.join(', '));
  console.log('Фото по устройству нет (явный перечень): ' + ТУТ_ФОТО_НЕТ.join(', '));
  const сервер = await поднятьСервер();
  const порт = сервер.address().port;
  const база = 'http://127.0.0.1:' + порт + '/';
  const браузер = await chromium.launch();
  const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });
  const ошибки = [];

  const странички = ВИДИМЫЕ.filter((с) => ТУТ_ФОТО_НЕТ.indexOf(с) === -1);
  for (const имя of странички) {
    console.log('\n--- ' + имя + ' ---');
    const страница = await новаяСтраница(контекст, ошибки);
    await страница.goto(база + encodeURI(имя) + '?сервер=' + encodeURIComponent(АДРЕС_СЕРВЕРА_ВЫДУМАННЫЙ), { waitUntil: 'domcontentloaded' }).catch((о) => ошибки.push('не открылась ' + имя + ': ' + о.message));
    if (имя === 'index.html') { await страница.click('#кнопка-игра-дурак'); await страница.waitForSelector('#экран-лобби.экран--виден', { timeout: 8000 }).catch(() => {}); }
    const селектор = '.карточка-профиля .тг-аватар, .карточка-профиля.тг-аватар';
    await проверитьКружок(страница, имя, селектор, true);
    await снимокКарточки(страница, '.карточка-профиля', имя.replace(/\.html$/, ''));
    if (имя === 'index.html') {
      // Экран профиля игрока открывается без сервера (очки берёт из памяти/подделки).
      const открылся = await страница.evaluate(() => { try { window.ЭкранПрофиля.открыть('дурак'); return true; } catch (e) { return false; } });
      проверить('index.html: экран профиля открывается', открылся);
      const сел = '#экран-профиля-игрока .профиль-карточка__аватар--фото';
      await проверитьКружок(страница, 'экран профиля', сел, false);
      await снимокКарточки(страница, '#экран-профиля-игрока .профиль-карточка', 'экран-профиля');
    }
    await страница.close();
  }

  for (const имя of ТУТ_ФОТО_НЕТ) {
    console.log('\n--- ' + имя + ' (фото по устройству нет) ---');
    if (ВИДИМЫЕ.indexOf(имя) === -1) { проверить(имя + ': страница есть в списке видимых игр реестра (перечень не устарел)', false); continue; }
    const страница = await новаяСтраница(контекст, ошибки);
    await страница.goto(база + encodeURI(имя) + '?сервер=' + encodeURIComponent(АДРЕС_СЕРВЕРА_ВЫДУМАННЫЙ), { waitUntil: 'domcontentloaded' }).catch((о) => ошибки.push('не открылась ' + имя + ': ' + о.message));
    await страница.waitForTimeout(1200);
    const число = await страница.evaluate(измерить);
    проверить(имя + ': кружков с фото в карточке профиля нет (как и записано в перечне)', число === 0, 'найдено ' + число);
    await страница.close();
  }

  console.log('\n--- Итог по ошибкам страниц ---');
  проверить('падений скриптов на страницах нет', ошибки.length === 0, ошибки.join(' | '));
  await контекст.close();
  await браузер.close();
  сервер.close();
  console.log('\nИтого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
})().catch((о) => { console.error('Проверка упала: ' + (о && о.stack || о)); process.exit(2); });
