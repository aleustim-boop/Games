'use strict';

/* =====================================================================
   СНИМОК «НАЙТИ ИГРУ» С ПОРТРЕТАМИ СИДЯЩИХ (этап Э7).

   У каждого стола в списке сверху ряд кружков с фото сидящих. Здесь
   список открытых столов подменяется в браузере (перехват двери
   /открытые-столы) ответом в настоящем формате сервера: три стола —
     1) два годных ключа фото (картинки — настоящие файлы img/личины);
     2) один пустой ключ (null) — должен нарисоваться силуэт;
     3) портретов нет вовсе — ряда кружков нет.
   Дверь /фото/<ключ> тоже перехватывается и отдаёт файл личины.
   Свой сервер комнат живёт в памяти процесса на свободном порту
   (не 8790), страницы отдаёт tests/локальный-сервер.js.

   Классы читаются из js/открытые-столы.js, а не заводятся второй раз.
   Ноль найденных кружков — провал, а не пропуск.

   Запуск:   node tests/снимок-открытые-столы-портреты.js
   Ломающий: node tests/снимок-открытые-столы-портреты.js --сломать
     (подменяет ответ на список без портретов — проверка обязана покраснеть)
   Снимки: tests/снимки/открытые-столы-портреты/390.png и 320.png
   ===================================================================== */

const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
process.env.ДАННЫЕ_ИГРЫ = path.join(os.tmpdir(), 'столы-портреты-' + process.pid);

const сервера = require(path.join(КОРЕНЬ, 'server', 'сервер.js'));
const { chromium, подготовитьПодделку } = require(path.join(КОРЕНЬ, 'tests', 'браузер-робот.js'));

const ЛОМАТЬ = process.argv.indexOf('--сломать') !== -1;
const ПОРТ_ИГРЫ = Number(process.argv[2]) || 8797;
const ПОРТ_СТРАНИЦ = Number(process.argv[3]) || 8192;
const АДРЕС_ИГРЫ = 'http://127.0.0.1:' + ПОРТ_ИГРЫ;
let АДРЕС_СТРАНИЦ = 'http://127.0.0.1:' + ПОРТ_СТРАНИЦ;
const ТОКЕН = '1234567:VYDUMANNYY-TOKEN-portrety';

let проверок = 0, провалов = 0;
function проверить(условие, слова) {
  проверок++;
  console.log((условие ? '  ок    — ' : '  ПЛОХО — ') + слова);
  if (!условие) провалов++;
}
const спать = (мс) => new Promise((г) => setTimeout(г, мс));

function извлечь(текст, регулярка, откуда) {
  const н = текст.match(регулярка);
  if (!н) throw new Error('не нашёл: ' + откуда);
  return н[1];
}
const текстСтолов = fs.readFileSync(path.join(КОРЕНЬ, 'js', 'открытые-столы.js'), 'utf8');
const УЗЕЛ_СПИСОК = извлечь(текстСтолов, /const УЗЕЛ_СПИСОК = '([^']+)';/, 'id списка столов');
const КЛАСС_ЛИЦО = извлечь(текстСтолов, /картинка\.className = '([^']+)'/, 'класс кружка-фото');
const КЛАСС_ПУСТО = извлечь(текстСтолов, /кружок\.className = '[^']+ ([^']+)'/, 'класс силуэта');
const КЛАСС_ЛИЦА = извлечь(текстСтолов, /ряд\.className = '([^']+)'/, 'класс ряда кружков');

/* Настоящие файлы личин: берём два первых svg из img/личины. */
const ПАПКА_ЛИЧИН = path.join(КОРЕНЬ, 'img', 'личины');
const ФАЙЛЫ_ЛИЧИН = fs.readdirSync(ПАПКА_ЛИЧИН).filter((и) => /\.svg$/.test(и)).sort();
if (ФАЙЛЫ_ЛИЧИН.length < 2) throw new Error('в img/личины меньше двух картинок');
const КЛЮЧ_1 = 'a1b2c3d4e5f6a1b2c3d4e5f6';
const КЛЮЧ_2 = '0123456789abcdef01234567';
const КАРТИНКА_ПО_КЛЮЧУ = {};
КАРТИНКА_ПО_КЛЮЧУ[КЛЮЧ_1] = path.join(ПАПКА_ЛИЧИН, ФАЙЛЫ_ЛИЧИН[0]);
КАРТИНКА_ПО_КЛЮЧУ[КЛЮЧ_2] = path.join(ПАПКА_ЛИЧИН, ФАЙЛЫ_ЛИЧИН[1]);

function столы() {
  const общее = { ждётСекунд: 20, открытый: true, игра: 'дурак' };
  return [
    Object.assign({ ключ: 'стол-один', занято: 2, мест: 4, игроки: ['Аня', 'Боря'],
      портреты: ЛОМАТЬ ? [] : [КЛЮЧ_1, КЛЮЧ_2], правилаСтола: 'Переводной, парами' }, общее),
    Object.assign({ ключ: 'стол-два', занято: 1, мест: 2, игроки: ['Витя'],
      портреты: ЛОМАТЬ ? [] : [null], правилаСтола: 'Подкидной' }, общее),
    Object.assign({ ключ: 'стол-три', занято: 1, мест: 2, игроки: ['Гоша'],
      портреты: [], правилаСтола: 'Подкидной' }, общее)
  ];
}

function поддельныйTelegram(метод) {
  if (метод === 'getMe') return { ok: true, result: { id: 777, is_bot: true, username: 'BoardingGames_bot' } };
  return { ok: true, result: {} };
}
function подписать(кто) {
  const поля = new URLSearchParams();
  поля.set('user', JSON.stringify(кто));
  поля.set('auth_date', String(Math.floor(Date.now() / 1000)));
  const строки = [];
  for (const п of поля) строки.push(п[0] + '=' + п[1]);
  строки.sort();
  const ключ = crypto.createHmac('sha256', 'WebAppData').update(ТОКЕН).digest();
  поля.set('hash', crypto.createHmac('sha256', ключ).update(строки.join('\n')).digest('hex'));
  return поля.toString();
}

let сервер = null, процессСтраниц = null, браузер = null;
let кодВыхода = null;

(async () => {
  console.log('=== Снимок «Найти игру» с портретами сидящих' + (ЛОМАТЬ ? ' (ЛОМАЮЩИЙ ЗАПУСК: портретов нет)' : '') + ' ===');
  try {
    сервера.оснасткаДляПроверки(ТОКЕН, поддельныйTelegram);
    сервер = сервера.создатьСервер();
    await new Promise((г, б) => { сервер.once('error', б); сервер.listen(ПОРТ_ИГРЫ, '127.0.0.1', г); });

    процессСтраниц = spawn(process.execPath,
      [path.join(КОРЕНЬ, 'tests', 'локальный-сервер.js'), String(ПОРТ_СТРАНИЦ)],
      { stdio: ['ignore', 'pipe', 'ignore'] });
    АДРЕС_СТРАНИЦ = await new Promise((г) => {
      let буфер = '';
      const т = setTimeout(() => г(АДРЕС_СТРАНИЦ), 5000);
      процессСтраниц.stdout.on('data', (к) => {
        буфер += к.toString();
        const н = буфер.match(/сервер запущен: (http:\/\/127\.0\.0\.1:\d+)\//);
        if (н) { clearTimeout(т); г(н[1]); }
      });
    });

    браузер = await chromium.launch();
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
    const страница = await окно.newPage();
    const красные = [];
    страница.on('pageerror', (о) => красные.push('падение: ' + о.message));
    страница.on('console', (м) => {
      if (м.type() !== 'error') return;
      const т = м.text();
      if (/telegram-web-app\.js|telegram\.org/.test(т)) return;
      const откуда = (м.location && м.location() && м.location().url) || '';
      if (/telegram-web-app\.js|telegram\.org/.test(откуда)) return;
      красные.push(т + (откуда ? ' (' + откуда + ')' : ''));
    });

    await подготовитьПодделку(страница, { версия: '8.0', подпись: подписать({ id: 940101, first_name: 'Аня' }) });
    // Наш перехват — после подделки, чтобы он был первым в очереди.
    await страница.route('**/*', (маршрут) => {
      let адрес = маршрут.request().url();
      try { адрес = decodeURIComponent(адрес); } catch (с) { /* как есть */ }
      if (/\/открытые-столы(?:\?|$)/.test(адрес)) {
        маршрут.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ ок: true, узналиВас: true, столы: столы() }) });
        return;
      }
      const ф = адрес.match(/\/фото\/([0-9a-f]{24})(?:\?|$)/);
      if (ф && КАРТИНКА_ПО_КЛЮЧУ[ф[1]]) {
        маршрут.fulfill({ status: 200, contentType: 'image/svg+xml', body: fs.readFileSync(КАРТИНКА_ПО_КЛЮЧУ[ф[1]]) });
        return;
      }
      if (/\/фото\/[0-9a-f]{24}(?:\?|$)/.test(адрес)) {   // чужие фото (свой аватар) — прозрачная точка
        маршрут.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
        return;
      }
      маршрут.fallback();
    });

    await страница.goto(АДРЕС_СТРАНИЦ + '/index.html?сервер=' + АДРЕС_ИГРЫ, { waitUntil: 'domcontentloaded' });
    await страница.waitForSelector('#кнопка-игра-дурак', { state: 'visible', timeout: 8000 });
    await страница.locator('#кнопка-игра-дурак').first().click();
    await страница.waitForSelector('#лобби-играть-онлайн', { state: 'visible', timeout: 8000 });
    await страница.locator('#лобби-играть-онлайн').first().click();
    await страница.waitForSelector('#' + УЗЕЛ_СПИСОК + ' .таблица__строка', { timeout: 8000 }).catch(() => {});
    await спать(1200);   // даём картинкам догрузиться

    const строк = await страница.locator('#' + УЗЕЛ_СПИСОК + ' .таблица__строка').count();
    проверить(строк === 3, 'в списке три стола (строк ' + строк + ')');

    // Ноль найденных кружков — провал.
    const всегоЛиц = await страница.locator('.' + КЛАСС_ЛИЦО).count();
    проверить(всегоЛиц > 0, 'на странице есть кружки .' + КЛАСС_ЛИЦО + ' (найдено ' + всегоЛиц + ')');

    const первый = страница.locator('#' + УЗЕЛ_СПИСОК + ' .таблица__строка').nth(0);
    const вторая = страница.locator('#' + УЗЕЛ_СПИСОК + ' .таблица__строка').nth(1);
    const третья = страница.locator('#' + УЗЕЛ_СПИСОК + ' .таблица__строка').nth(2);

    const картинки1 = первый.locator('img.' + КЛАСС_ЛИЦО);
    const н1 = await картинки1.count();
    проверить(н1 === 2, 'у первого стола 2 фото-кружка (найдено ' + н1 + ')');
    const ширины = await картинки1.evaluateAll((э) => э.map((и) => и.naturalWidth));
    проверить(ширины.length === 2 && ширины.every((в) => в > 0),
      'у обоих фото первого стола naturalWidth > 0 (' + JSON.stringify(ширины) + ')');

    const силуэтов2 = await вторая.locator('.' + КЛАСС_ПУСТО).count();
    проверить(силуэтов2 === 1, 'у второго стола один силуэт (найдено ' + силуэтов2 + ')');
    const фото2 = await вторая.locator('img.' + КЛАСС_ЛИЦО).count();
    проверить(фото2 === 0, 'у второго стола нет настоящих фото (найдено ' + фото2 + ')');

    const рядов3 = await третья.locator('.' + КЛАСС_ЛИЦА).count();
    проверить(рядов3 === 0, 'у третьего стола ряда кружков нет (найдено ' + рядов3 + ')');

    проверить(красные.length === 0, 'консоль чистая' + (красные.length ? ': ' + красные.join(' | ') : ''));

    const папка = path.join(__dirname, 'снимки', 'открытые-столы-портреты');
    fs.mkdirSync(папка, { recursive: true });
    const файл390 = path.join(папка, ЛОМАТЬ ? '390-сломано.png' : '390.png');
    await страница.screenshot({ path: файл390 });
    console.log('  снимок 390×844: ' + файл390);

    await страница.setViewportSize({ width: 320, height: 640 });
    await спать(500);
    const файл320 = path.join(папка, ЛОМАТЬ ? '320-сломано.png' : '320.png');
    await страница.screenshot({ path: файл320 });
    console.log('  снимок 320×640: ' + файл320);
  } finally {
    if (браузер) await браузер.close().catch(() => {});
    if (сервер) сервер.close();
    сервера.оснасткаДляПроверки();
    if (процессСтраниц) процессСтраниц.kill();
    try { fs.rmSync(process.env.ДАННЫЕ_ИГРЫ, { recursive: true, force: true }); } catch (с) { /* не страшно */ }
  }
  console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
  process.exit(кодВыхода !== null ? кодВыхода : (провалов ? 1 : 0));
})().catch((о) => {
  console.error('Проверка упала: ' + (о && о.stack || о));
  process.exit(2);
});
