'use strict';

/* =====================================================================
   ПОДДЕЛЬНЫЙ TELEGRAM — ОДИН НА ВСЕ ПРОВЕРКИ.

   Зачем. Проверить игру «как внутри Telegram» без самого Telegram:
   раскрылось ли окно, показалась ли стрелка «Назад», куда она ведёт,
   доезжают ли рекорды до облака и возвращаются ли из него после
   перезагрузки страницы, как ведёт себя страница в старом Telegram
   без стрелки.

   Этот файл — две вещи сразу:

   1) МОДУЛЬ: «текстПодделки(настройки)» отдаёт исходник подделки одной
      строкой. Его кладут в страницу ДО её скриптов — либо сервер ниже
      (для браузера-инструмента), либо стенд на playwright через
      addInitScript (см. tests/браузер-робот.js). Подделка одна, чтобы
      два разных Telegram не разошлись однажды в поведении.

   2) СЕРВЕР (когда файл запущен напрямую): раздаёт страницы проекта,
      вырезает из html настоящий скрипт telegram.org (он подключён с defer
      и ПЕРЕЗАПИСАЛ бы window.Telegram) и вписывает подделку перед </head>.
      Облако в этом режиме живёт в памяти сервера: можно стереть память
      браузера, перезагрузить страницу и увидеть, что рекорды приехали
      именно из облака.

   ЧТО УМЕЕТ ПОДДЕЛКА (ровно то, что просят у Telegram наши страницы):
     ready, expand, close, isVersionAtLeast, onEvent/offEvent, themeParams,
     initDataUnsafe, BackButton (show/hide/onClick — если «стрелка» не
     выключена настройкой), CloudStorage (setItem/getItem/getItems/
     removeItem/removeItems/getKeys), MainButton и HapticFeedback пустышками.
   Облако придирчиво к имени записи так же, как настоящее: только латинские
   буквы, цифры, «_» и «-».

   ГДЕ ЖИВЁТ ОБЛАКО — настройка «облако»:
     'сервер' — запросами к этому серверу (/поддельное-облако/…);
     'мост'   — через функции, которые стенд пробросил в страницу
                (exposeFunction): одно облако на несколько страниц;
     'память' — в самой странице, window.__облако (по умолчанию).

   ЧТО ВИДНО ИЗ СТРАНИЦЫ:
     window.ПоддельныйТелеграм.журнал      — всё, что просили, по порядку;
     window.ПоддельныйТелеграм.нажатьНазад() — нажать стрелку «Назад»;
     window.__дневник — счётчики { ready, expand, стрелкаПоказана, стрелка,
                        события: { имя: [слушатели] } };
     window.__облако  — записи облака (в режиме 'память');
     window.__звук    — сторож звука: когда создали AudioContext и было ли
                        до этого касание (браузер даёт звук только после).

   Служебные двери сервера (для проверяющего, не для игры):
     GET  /поддельный-телеграм/облако     — всё, что лежит в облаке
     GET  /поддельный-телеграм/журнал     — что просили у облака
     POST /поддельный-телеграм/очистить   — стереть облако и журнал

   Запуск сервера:
       node tests/поддельный-телеграм.js            порт 8131, Telegram 7.10
       node tests/поддельный-телеграм.js 8131 6.0   другой порт и версия

   ПРО БЕЗОПАСНОСТЬ — те же два правила, что и у tests/локальный-сервер.js:
   слушаем только 127.0.0.1, папку bot и файлы с точкой не отдаём никогда.
   ===================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ТЕМА_ПО_УМОЛЧАНИЮ = {
  bg_color: '#17212b', text_color: '#f5f5f5', hint_color: '#708499',
  button_color: '#5288c1', button_text_color: '#ffffff', secondary_bg_color: '#232e3c'
};

/* ---------------------------------------------------------------------
   Подделка — исходник, который уезжает в страницу
   --------------------------------------------------------------------- */

function текстПодделки(настройки) {
  const н = настройки || {};
  const версия = String(н.версия || '7.10');
  const стрелка = н.стрелка !== false;
  const облако = н.облако === 'сервер' || н.облако === 'мост' ? н.облако : 'память';
  const тема = Object.assign({}, ТЕМА_ПО_УМОЛЧАНИЮ, н.тема || {});

  return '/* Поддельный Telegram — из tests/поддельный-телеграм.js */\n' +
    '(function () {\n' +
    '  var ВЕРСИЯ = ' + JSON.stringify(версия) + ';\n' +
    '  var ЕСТЬ_СТРЕЛКА = ' + JSON.stringify(стрелка) + ';\n' +
    '  var ОБЛАКО = ' + JSON.stringify(облако) + ';\n' +
    '  var ПРАВИЛО_КЛЮЧА = /^[A-Za-z0-9_-]{1,128}$/;\n' +
    '  var журнал = [];\n' +
    '  var слушатели = {};\n' +
    '  var дневник = { ready: 0, expand: 0, стрелкаПоказана: 0, стрелка: 0, события: слушатели };\n' +
    '  var память = {};\n' +
    '  window.__дневник = дневник;\n' +
    '  window.__облако = память;\n' +
    '  function записать(что) { журнал.push(что); }\n' +
    '  function сравнитьВерсии(а, б) {\n' +
    '    var x = String(а).split(".").map(Number), y = String(б).split(".").map(Number);\n' +
    '    for (var i = 0; i < Math.max(x.length, y.length); i++) {\n' +
    '      var p = x[i] || 0, q = y[i] || 0;\n' +
    '      if (p !== q) return p > q ? 1 : -1;\n' +
    '    }\n' +
    '    return 0;\n' +
    '  }\n' +
    '  function потом(дело) { setTimeout(дело, 0); }\n' +
    '  /* Три дороги в облако — ответ всегда приходит позже, как у настоящего. */\n' +
    '  function вОблако(дверь, тело, ответить) {\n' +
    '    ответить = typeof ответить === "function" ? ответить : function () {};\n' +
    '    var ключи = тело.ключи || (тело.ключ !== undefined ? [тело.ключ] : []);\n' +
    '    for (var i = 0; i < ключи.length; i++) {\n' +
    '      if (!ПРАВИЛО_КЛЮЧА.test(String(ключи[i]))) { записать("ОТКАЗ облака: негодное имя " + ключи[i]); потом(function () { ответить("WebAppCloudStorageKeyInvalid"); }); return; }\n' +
    '    }\n' +
    '    if (ОБЛАКО === "сервер") {\n' +
    '      fetch("/поддельное-облако/" + дверь, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(тело || {}) })\n' +
    '        .then(function (о) { return о.json(); })\n' +
    '        .then(function (о) { if (о.ошибка) ответить(о.ошибка); else ответить(null, о.результат); })\n' +
    '        .catch(function (е) { ответить(String(е)); });\n' +
    '      return;\n' +
    '    }\n' +
    '    if (ОБЛАКО === "мост") {\n' +
    '      var мост = {\n' +
    '        "записать": function () { return window.__облакоЗаписать(тело.ключ, String(тело.значение)).then(function () { return true; }); },\n' +
    '        "прочитать": function () { return window.__облакоПрочитать(тело.ключ); },\n' +
    '        "прочитать-несколько": function () { return Promise.all(ключи.map(function (к) { return window.__облакоПрочитать(к); })).then(function (з) { var р = {}; ключи.forEach(function (к, i) { р[к] = з[i]; }); return р; }); },\n' +
    '        "удалить": function () { return Promise.all(ключи.map(function (к) { return window.__облакоУдалить(к); })).then(function () { return true; }); },\n' +
    '        "ключи": function () { return window.__облакоКлючи(); }\n' +
    '      };\n' +
    '      мост[дверь]().then(function (р) { ответить(null, р); }, function (е) { ответить(String(е)); });\n' +
    '      return;\n' +
    '    }\n' +
    '    var результат;\n' +
    '    if (дверь === "записать") { память[тело.ключ] = String(тело.значение); результат = true; }\n' +
    '    else if (дверь === "прочитать") { результат = Object.prototype.hasOwnProperty.call(память, тело.ключ) ? память[тело.ключ] : ""; }\n' +
    '    else if (дверь === "прочитать-несколько") { результат = {}; ключи.forEach(function (к) { результат[к] = Object.prototype.hasOwnProperty.call(память, к) ? память[к] : ""; }); }\n' +
    '    else if (дверь === "удалить") { ключи.forEach(function (к) { delete память[к]; }); результат = true; }\n' +
    '    else if (дверь === "ключи") { результат = Object.keys(память); }\n' +
    '    потом(function () { ответить(null, результат); });\n' +
    '  }\n' +
    '  var WebApp = {\n' +
    '    version: ВЕРСИЯ, platform: "android", colorScheme: "dark",\n' +
    '    themeParams: ' + JSON.stringify(тема) + ',\n' +
    '    isExpanded: false, viewportHeight: 560, viewportStableHeight: 560,\n' +
    '    initData: "", initDataUnsafe: { user: { id: 424242, first_name: "Проверяющий", username: "tester" } },\n' +
    '    ready: function () { дневник.ready++; записать("ready"); },\n' +
    '    expand: function () { this.isExpanded = true; this.viewportHeight = 844; this.viewportStableHeight = 844; дневник.expand++; записать("expand"); },\n' +
    '    close: function () { записать("close"); },\n' +
    '    isVersionAtLeast: function (в) { return сравнитьВерсии(ВЕРСИЯ, в) >= 0; },\n' +
    '    onEvent: function (имя, cb) { (слушатели[имя] = слушатели[имя] || []).push(cb); записать("onEvent:" + имя); },\n' +
    '    offEvent: function (имя, cb) { слушатели[имя] = (слушатели[имя] || []).filter(function (х) { return х !== cb; }); },\n' +
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
    '  /* Стрелка «Назад» появилась в Telegram 6.1; старому Telegram её не даём вовсе. */\n' +
    '  if (ЕСТЬ_СТРЕЛКА) {\n' +
    '    WebApp.BackButton = {\n' +
    '      isVisible: false,\n' +
    '      show: function () { this.isVisible = true; дневник.стрелкаПоказана++; дневник.стрелка++; записать("BackButton.show"); return this; },\n' +
    '      hide: function () { this.isVisible = false; записать("BackButton.hide"); return this; },\n' +
    '      onClick: function (cb) { WebApp.onEvent("backButtonClicked", cb); return this; },\n' +
    '      offClick: function (cb) { WebApp.offEvent("backButtonClicked", cb); return this; }\n' +
    '    };\n' +
    '  }\n' +
    '  window.Telegram = { WebApp: WebApp };\n' +
    '  /* Сторож звука: браузеры разрешают звук только после касания, поэтому\n' +
    '     настоящий AudioContext страница обязана создавать не раньше первого\n' +
    '     нажатия. Считаем, сколько раз его создали и было ли до этого касание. */\n' +
    '  window.__звук = { создано: 0, касанийДоПервого: null, касаний: 0, запусков: 0, журнал: [] };\n' +
    '  var НастоящийКонтекст = window.AudioContext || window.webkitAudioContext;\n' +
    '  if (НастоящийКонтекст) {\n' +
    '    var Сторож = function () {\n' +
    '      window.__звук.создано++;\n' +
    '      if (window.__звук.касанийДоПервого === null) window.__звук.касанийДоПервого = window.__звук.касаний;\n' +
    '      window.__звук.журнал.push("создан AudioContext, касаний было " + window.__звук.касаний + ", страница " + document.readyState);\n' +
    '      var к = new НастоящийКонтекст();\n' +
    '      var создатьОсциллятор = к.createOscillator.bind(к);\n' +
    '      к.createOscillator = function () { var о = создатьОсциллятор(); var старт = о.start.bind(о); о.start = function () { window.__звук.запусков++; return старт.apply(о, arguments); }; return о; };\n' +
    '      return к;\n' +
    '    };\n' +
    '    Сторож.prototype = НастоящийКонтекст.prototype;\n' +
    '    window.AudioContext = Сторож;\n' +
    '    window.webkitAudioContext = Сторож;\n' +
    '  }\n' +
    '  window.addEventListener("pointerdown", function () { window.__звук.касаний++; }, true);\n' +
    '  window.addEventListener("click", function () { window.__звук.касаний++; }, true);\n' +
    '  window.ПоддельныйТелеграм = {\n' +
    '    версия: ВЕРСИЯ,\n' +
    '    журнал: журнал,\n' +
    '    нажатьНазад: function () {\n' +
    '      записать("нажата стрелка Назад (слушателей: " + (слушатели.backButtonClicked || []).length + ")");\n' +
    '      (слушатели.backButtonClicked || []).slice().forEach(function (cb) { cb(); });\n' +
    '    }\n' +
    '  };\n' +
    '})();\n';
}

module.exports = { текстПодделки: текстПодделки, ТЕМА_ПО_УМОЛЧАНИЮ: ТЕМА_ПО_УМОЛЧАНИЮ };

/* =====================================================================
   СЕРВЕР — только при прямом запуске файла
   ===================================================================== */

if (require.main === module) {
  const КОРЕНЬ = path.resolve(path.join(__dirname, '..'));
  const ПОРТ = Number(process.argv[2]) || 8131;
  const ВЕРСИЯ_TELEGRAM = process.argv[3] || '7.10';
  const АДРЕС = '127.0.0.1';   // только свой компьютер — см. шапку

  const ТИПЫ = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
  };
  const ПРАВИЛО_КЛЮЧА = /^[A-Za-z0-9_-]{1,128}$/;
  const ПОТОЛОК_ЗНАЧЕНИЯ = 4096;

  const облако = Object.create(null);
  const журнал = [];

  /* Вырезать настоящий скрипт Telegram и вписать подделку (облако — на сервере). */
  function подменитьTelegram(html) {
    const скрипт = '<script>\n' + текстПодделки({ версия: ВЕРСИЯ_TELEGRAM, облако: 'сервер' }) + '</script>\n';
    const безНастоящего = html.replace(/<script[^>]*telegram-web-app\.js[^>]*>\s*<\/script>/gi,
      '<!-- настоящий скрипт Telegram вырезан сервером tests/поддельный-телеграм.js -->');
    if (безНастоящего.indexOf('</head>') === -1) return скрипт + безНастоящего;
    return безНастоящего.replace('</head>', скрипт + '</head>');
  }

  function ответитьJSON(ответ, код, тело) {
    ответ.writeHead(код, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    ответ.end(JSON.stringify(тело));
  }

  function дверьОблака(дверь, тело) {
    const ключОК = function (к) { return ПРАВИЛО_КЛЮЧА.test(String(к)); };
    switch (дверь) {
      case 'записать':
        if (!ключОК(тело.ключ)) { журнал.push('ОТКАЗ setItem: негодное имя «' + тело.ключ + '»'); return { ошибка: 'WebAppCloudStorageKeyInvalid' }; }
        if (String(тело.значение).length > ПОТОЛОК_ЗНАЧЕНИЯ) { журнал.push('ОТКАЗ setItem: слишком длинно «' + тело.ключ + '»'); return { ошибка: 'WebAppCloudStorageValueInvalid' }; }
        облако[тело.ключ] = String(тело.значение);
        журнал.push('setItem ' + тело.ключ + ' (' + String(тело.значение).length + ' знаков)');
        return { результат: true };
      case 'прочитать':
        if (!ключОК(тело.ключ)) { журнал.push('ОТКАЗ getItem: негодное имя «' + тело.ключ + '»'); return { ошибка: 'WebAppCloudStorageKeyInvalid' }; }
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
      запрос.on('end', function () { try { готово(JSON.parse(текст || '{}')); } catch (е) { готово({}); } });
    });
  }

  /* Раздача файлов — по правилам tests/локальный-сервер.js. */
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
}
