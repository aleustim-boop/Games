'use strict';

/* =====================================================================
   СТРАНИЧНЫЙ СЕРВЕР С ПОДДЕЛЬНЫМ TELEGRAM.

   Зачем. Проверить игру «как внутри Telegram» без самого Telegram:
   раскрылось ли окно, показалась ли стрелка «Назад», куда она ведёт,
   доезжают ли рекорды до облака и возвращаются ли из него после
   перезагрузки страницы.

   Почему подделку нельзя просто «дописать в консоли». Страницы подключают
   настоящий скрипт telegram.org с пометкой defer: он выполняется после
   разбора страницы и ПЕРЕЗАПИСЫВАЕТ window.Telegram. Подделка, вписанная
   до него, стирается, а вписанная после — опаздывает: js/telegram.js
   к тому времени уже решил, что Telegram нет. Поэтому подмена делается
   на раздаче страницы: сервер вырезает из html строку с настоящим
   скриптом и вписывает свою — перед </head>, раньше всех скриптов игры.

   Что умеет подделка (ровно то, что просят у Telegram наши страницы):
     ready, expand, close, isVersionAtLeast, onEvent/offEvent, themeParams,
     initDataUnsafe, BackButton (show/hide/onClick), CloudStorage
     (setItem/getItem/getItems/removeItem/removeItems/getKeys),
     MainButton и HapticFeedback — пустышками, чтобы не падало.

   ОБЛАКО ЖИВЁТ НА ЭТОМ СЕРВЕРЕ, а не в памяти браузера. Это нарочно: так
   можно стереть память браузера, перезагрузить страницу и увидеть, что
   рекорды приехали именно из облака, а не из localStorage. Облако
   придирчиво к имени записи так же, как настоящее: только латинские
   буквы, цифры, «_» и «-». Всё, что подделка делает, пишется в журнал —
   его видно из страницы (window.ПоддельныйТелеграм.журнал) и снаружи
   (GET /поддельный-телеграм/журнал).

   Служебные двери (для проверяющего, не для игры):
     GET  /поддельный-телеграм/облако     — всё, что лежит в облаке
     GET  /поддельный-телеграм/журнал     — что просили у облака
     POST /поддельный-телеграм/очистить   — стереть облако и журнал
   Из страницы: window.ПоддельныйТелеграм.нажатьНазад() — нажать стрелку.

   Запуск:
       node tests/поддельный-телеграм.js            порт 8131, Telegram 7.10
       node tests/поддельный-телеграм.js 8131 6.0   другой порт и версия

   ПРО БЕЗОПАСНОСТЬ — те же два правила, что и у tests/локальный-сервер.js:
   слушаем только 127.0.0.1, папку bot и файлы с точкой не отдаём никогда.
   ===================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.resolve(path.join(__dirname, '..'));
const ПОРТ = Number(process.argv[2]) || 8131;
const ВЕРСИЯ_TELEGRAM = process.argv[3] || '7.10';
const АДРЕС = '127.0.0.1';   // только свой компьютер — см. шапку

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

/* Правило настоящего облака Telegram для имени записи. */
const ПРАВИЛО_КЛЮЧА = /^[A-Za-z0-9_-]{1,128}$/;
const ПОТОЛОК_ЗНАЧЕНИЯ = 4096;

/* Облако и журнал — в памяти сервера. */
const облако = Object.create(null);
const журнал = [];

/* ---------------------------------------------------------------------
   Подделка, которая уезжает в страницу
   --------------------------------------------------------------------- */

function текстПодделки() {
  return '<script>\n' +
    '/* Поддельный Telegram — подставлен сервером tests/поддельный-телеграм.js */\n' +
    '(function () {\n' +
    '  var ВЕРСИЯ = ' + JSON.stringify(ВЕРСИЯ_TELEGRAM) + ';\n' +
    '  var журнал = [];\n' +
    '  var слушатели = {};\n' +
    '  function записать(что) { журнал.push(что); }\n' +
    '  function сравнитьВерсии(а, б) {\n' +
    '    var x = String(а).split(".").map(Number), y = String(б).split(".").map(Number);\n' +
    '    for (var i = 0; i < Math.max(x.length, y.length); i++) {\n' +
    '      var p = x[i] || 0, q = y[i] || 0;\n' +
    '      if (p !== q) return p > q ? 1 : -1;\n' +
    '    }\n' +
    '    return 0;\n' +
    '  }\n' +
    '  function вОблако(дверь, тело, ответить) {\n' +
    '    ответить = typeof ответить === "function" ? ответить : function () {};\n' +
    '    fetch("/поддельное-облако/" + дверь, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(тело || {}) })\n' +
    '      .then(function (о) { return о.json(); })\n' +
    '      .then(function (о) { if (о.ошибка) ответить(о.ошибка); else ответить(null, о.результат); })\n' +
    '      .catch(function (е) { ответить(String(е)); });\n' +
    '  }\n' +
    '  var WebApp = {\n' +
    '    version: ВЕРСИЯ, platform: "android", colorScheme: "dark",\n' +
    '    themeParams: { bg_color: "#17212b", text_color: "#f5f5f5", hint_color: "#708499", button_color: "#5288c1", button_text_color: "#ffffff", secondary_bg_color: "#232e3c" },\n' +
    '    isExpanded: false, viewportHeight: 560, viewportStableHeight: 560,\n' +
    '    initData: "", initDataUnsafe: { user: { id: 424242, first_name: "Проверяющий", username: "tester" } },\n' +
    '    ready: function () { записать("ready"); },\n' +
    '    expand: function () { this.isExpanded = true; this.viewportHeight = 844; this.viewportStableHeight = 844; записать("expand"); },\n' +
    '    close: function () { записать("close"); },\n' +
    '    isVersionAtLeast: function (в) { return сравнитьВерсии(ВЕРСИЯ, в) >= 0; },\n' +
    '    onEvent: function (имя, cb) { (слушатели[имя] = слушатели[имя] || []).push(cb); записать("onEvent:" + имя); },\n' +
    '    offEvent: function (имя, cb) { слушатели[имя] = (слушатели[имя] || []).filter(function (х) { return х !== cb; }); },\n' +
    '    BackButton: {\n' +
    '      isVisible: false,\n' +
    '      show: function () { this.isVisible = true; записать("BackButton.show"); return this; },\n' +
    '      hide: function () { this.isVisible = false; записать("BackButton.hide"); return this; },\n' +
    '      onClick: function (cb) { WebApp.onEvent("backButtonClicked", cb); return this; },\n' +
    '      offClick: function (cb) { WebApp.offEvent("backButtonClicked", cb); return this; }\n' +
    '    },\n' +
    '    MainButton: { isVisible: false, show: function () { return this; }, hide: function () { return this; }, setText: function () { return this; }, setParams: function () { return this; }, onClick: function () { return this; }, offClick: function () { return this; } },\n' +
    '    HapticFeedback: { impactOccurred: function () {}, notificationOccurred: function () {}, selectionChanged: function () {} },\n' +
    '    CloudStorage: {\n' +
    '      setItem: function (ключ, значение, cb) { записать("CloudStorage.setItem " + ключ); вОблако("записать", { ключ: String(ключ), значение: String(значение) }, cb); return this; },\n' +
    '      getItem: function (ключ, cb) { записать("CloudStorage.getItem " + ключ); вОблако("прочитать", { ключ: String(ключ) }, cb); return this; },\n' +
    '      getItems: function (ключи, cb) { записать("CloudStorage.getItems"); вОблако("прочитать-несколько", { ключи: ключи }, cb); return this; },\n' +
    '      removeItem: function (ключ, cb) { записать("CloudStorage.removeItem " + ключ); вОблако("удалить", { ключи: [String(ключ)] }, cb); return this; },\n' +
    '      removeItems: function (ключи, cb) { записать("CloudStorage.removeItems"); вОблако("удалить", { ключи: ключи }, cb); return this; },\n' +
    '      getKeys: function (cb) { записать("CloudStorage.getKeys"); вОблако("ключи", {}, cb); return this; }\n' +
    '    },\n' +
    '    openLink: function () { записать("openLink"); }, openTelegramLink: function () { записать("openTelegramLink"); },\n' +
    '    showAlert: function (т, cb) { записать("showAlert: " + т); if (cb) cb(); },\n' +
    '    showPopup: function (п, cb) { записать("showPopup"); if (cb) cb(); },\n' +
    '    setHeaderColor: function () {}, setBackgroundColor: function () {},\n' +
    '    enableClosingConfirmation: function () {}, disableClosingConfirmation: function () {},\n' +
    '    disableVerticalSwipes: function () {}, enableVerticalSwipes: function () {}\n' +
    '  };\n' +
    '  window.Telegram = { WebApp: WebApp };\n' +
    '  window.ПоддельныйТелеграм = {\n' +
    '    версия: ВЕРСИЯ,\n' +
    '    журнал: журнал,\n' +
    '    нажатьНазад: function () {\n' +
    '      записать("нажата стрелка Назад (слушателей: " + (слушатели.backButtonClicked || []).length + ")");\n' +
    '      (слушатели.backButtonClicked || []).slice().forEach(function (cb) { cb(); });\n' +
    '    }\n' +
    '  };\n' +
    '})();\n' +
    '</script>\n';
}

/* Вырезать настоящий скрипт Telegram и вписать подделку. */
function подменитьTelegram(html) {
  const безНастоящего = html.replace(/<script[^>]*telegram-web-app\.js[^>]*>\s*<\/script>/gi,
    '<!-- настоящий скрипт Telegram вырезан сервером tests/поддельный-телеграм.js -->');
  if (безНастоящего.indexOf('</head>') === -1) return текстПодделки() + безНастоящего;
  return безНастоящего.replace('</head>', текстПодделки() + '</head>');
}

/* ---------------------------------------------------------------------
   Облако: те же ответы и те же отказы, что у настоящего
   --------------------------------------------------------------------- */

function ответитьJSON(ответ, код, тело) {
  ответ.writeHead(код, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  ответ.end(JSON.stringify(тело));
}

function дверьОблака(дверь, тело) {
  const ключОК = function (к) { return ПРАВИЛО_КЛЮЧА.test(String(к)); };
  switch (дверь) {
    case 'записать':
      if (!ключОК(тело.ключ)) {
        журнал.push('ОТКАЗ setItem: негодное имя «' + тело.ключ + '»');
        return { ошибка: 'WebAppCloudStorageKeyInvalid' };
      }
      if (String(тело.значение).length > ПОТОЛОК_ЗНАЧЕНИЯ) {
        журнал.push('ОТКАЗ setItem: слишком длинно «' + тело.ключ + '»');
        return { ошибка: 'WebAppCloudStorageValueInvalid' };
      }
      облако[тело.ключ] = String(тело.значение);
      журнал.push('setItem ' + тело.ключ + ' (' + String(тело.значение).length + ' знаков)');
      return { результат: true };
    case 'прочитать':
      if (!ключОК(тело.ключ)) {
        журнал.push('ОТКАЗ getItem: негодное имя «' + тело.ключ + '»');
        return { ошибка: 'WebAppCloudStorageKeyInvalid' };
      }
      журнал.push('getItem ' + тело.ключ + (тело.ключ in облако ? ' — есть' : ' — пусто'));
      return { результат: тело.ключ in облако ? облако[тело.ключ] : '' };
    case 'прочитать-несколько': {
      const ключи = Array.isArray(тело.ключи) ? тело.ключи : [];
      if (!ключи.every(ключОК)) return { ошибка: 'WebAppCloudStorageKeyInvalid' };
      const результат = {};
      for (const к of ключи) результат[к] = к in облако ? облако[к] : '';
      журнал.push('getItems ' + ключи.join(','));
      return { результат: результат };
    }
    case 'удалить': {
      const ключи = Array.isArray(тело.ключи) ? тело.ключи : [];
      if (!ключи.every(ключОК)) return { ошибка: 'WebAppCloudStorageKeyInvalid' };
      for (const к of ключи) delete облако[к];
      журнал.push('removeItems ' + ключи.join(','));
      return { результат: true };
    }
    case 'ключи':
      журнал.push('getKeys');
      return { результат: Object.keys(облако) };
    default:
      return { ошибка: 'нет такой двери облака: ' + дверь };
  }
}

function прочитатьТело(запрос) {
  return new Promise(function (готово) {
    let текст = '';
    запрос.on('data', function (ч) { текст += ч; if (текст.length > 1e6) запрос.destroy(); });
    запрос.on('end', function () {
      try { готово(JSON.parse(текст || '{}')); } catch (е) { готово({}); }
    });
  });
}

/* ---------------------------------------------------------------------
   Раздача файлов — по правилам tests/локальный-сервер.js
   --------------------------------------------------------------------- */

function безопасныйПуть(адрес) {
  return path.normalize(адрес).replace(/^(\.\.[\\/])+/, '').replace(/^[\\/]+/, '');
}

function причинаОтказа(адресДоРазбора, относительныйПуть) {
  const где = (адресДоРазбора + ' ' + относительныйПуть).toLowerCase();
  if (где.indexOf('.env') !== -1) return 'в этом файле лежит токен бота, наружу он не отдаётся';
  const части = относительныйПуть.split(/[\\/]/).filter(Boolean);
  if (части.length && части[0].toLowerCase() === 'bot') return 'папка bot закрыта: в ней настройки бота';
  for (const часть of части) {
    if (часть.charAt(0) === '.') return 'служебные файлы и папки, начинающиеся с точки, наружу не отдаются';
  }
  return null;
}

function внутриПроекта(файл) {
  const полный = path.resolve(файл);
  return полный === КОРЕНЬ || полный.startsWith(КОРЕНЬ + path.sep);
}

function отказать(ответ, код, текст) {
  ответ.writeHead(код, { 'Content-Type': 'text/plain; charset=utf-8' });
  ответ.end(текст);
}

http.createServer(async function (запрос, ответ) {
  const сырой = запрос.url.split('?')[0];
  let адрес;
  try { адрес = decodeURIComponent(сырой); } catch (ошибка) { отказать(ответ, 400, 'непонятный адрес'); return; }

  // Двери облака и служебные двери проверяющего.
  if (адрес.indexOf('/поддельное-облако/') === 0) {
    if (запрос.method !== 'POST') { отказать(ответ, 405, 'облако слушает только POST'); return; }
    const тело = await прочитатьТело(запрос);
    ответитьJSON(ответ, 200, дверьОблака(адрес.slice('/поддельное-облако/'.length), тело));
    return;
  }
  if (адрес === '/поддельный-телеграм/облако') { ответитьJSON(ответ, 200, облако); return; }
  if (адрес === '/поддельный-телеграм/журнал') { ответитьJSON(ответ, 200, журнал); return; }
  if (адрес === '/поддельный-телеграм/очистить') {
    for (const к of Object.keys(облако)) delete облако[к];
    журнал.length = 0;
    ответитьJSON(ответ, 200, { очищено: true });
    return;
  }

  if (адрес === '/') адрес = '/index.html';
  const относительный = безопасныйПуть(адрес);
  const отказ = причинаОтказа(сырой + ' ' + адрес, относительный);
  if (отказ) { отказать(ответ, 403, 'доступ закрыт: ' + отказ); return; }
  const файл = path.join(КОРЕНЬ, относительный);
  if (!внутриПроекта(файл)) { отказать(ответ, 403, 'доступ закрыт: файл вне папки проекта'); return; }

  fs.readFile(файл, function (ошибка, данные) {
    if (ошибка) { отказать(ответ, 404, 'не найдено: ' + адрес); return; }
    const расширение = path.extname(файл).toLowerCase();
    ответ.writeHead(200, {
      'Content-Type': ТИПЫ[расширение] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    ответ.end(расширение === '.html' ? подменитьTelegram(данные.toString('utf8')) : данные);
  });
}).listen(ПОРТ, АДРЕС, function () {
  console.log('поддельный Telegram ' + ВЕРСИЯ_TELEGRAM + ' поднят: http://' + АДРЕС + ':' + ПОРТ + '/шашки.html');
  console.log('облако живёт в памяти этого сервера; слушаем только этот компьютер');
});
