'use strict';

/* =====================================================================
   ЗВУК НА ВИТРИНЕ ВИДИТ СТАРЫЙ КЛЮЧ ШАШЕК + ЧЕСТНАЯ «ВИБРАЦИЯ ДОСТУПНА»
   (штаб/списки.json, очередь[14] и очередь[16]).

   Задача 1. Строка «Звук» на витрине сборника (js/game.js,
   «звукГдеНибудьВключён») читает ключ шашек «shashki_sound» напрямую.
   Перенос со старого русского имени «шашки:звук» умел только
   js/шашки-звук.js — а он подключён лишь на странице шашек. Человеку,
   выключившему звук в шашках ДО переезда ключей и с тех пор их не
   открывавшему, витрина показывала бы «вкл», хотя все игры молчат.
   Починили в js/telegram.js: перенос происходит сам, при загрузке
   ЛЮБОЙ страницы сборника (телеграм.js подключён везде, в отличие от
   шашечного звука) — витрина получает мигрированное значение раньше,
   чем успевает его прочитать.

   Задача 2. Строка «Вибрация» в листе «Ещё» была видна и там, где
   вибрировать нечем (обычный компьютерный браузер): дверь «вибрация»
   у дурака (js/game.js) сама не смотрит на устройство — только на то,
   определены ли нужные функции у window.Телеграм, а они определены
   всегда. Починили в двух местах: js/telegram.js даёт честный признак
   «вибрацияДоступна()» (в Telegram — HapticFeedback нужной версии, вне
   Telegram — navigator.vibrate), а js/лист-ещё.js спрашивает его В
   ДОПОЛНЕНИЕ к door.доступна() — так лист сам подстраховывает игру,
   даже если её дверь этого не сделала.

   Как проверяет. Поднимает НАСТОЯЩИЕ js/telegram.js и js/лист-ещё.js в
   песочнице vm — как два тега <script> на одной странице (telegram.js
   первым, ровно как в index.html): «window.Телеграм» из первого виден
   второму. DOM не нужен — обе проверяемые двери чистые функции без
   разметки (строкиЛиста, вибрацияДоступна, перенос ключа памяти).

   Запуск:
       node tests/лист-звук-вибрация.js                 — обычный прогон
       node tests/лист-звук-вибрация.js --папка=<путь>   — js/telegram.js
         и js/лист-ещё.js берутся не с диска проекта, а из «<путь>/js/»
         (для ломающего запуска: путь ведёт на испорченную КОПИЮ во
         временной папке, настоящие файлы проекта эта проверка не трогает).
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const КОРЕНЬ = path.join(__dirname, '..');

function аргумент(имя) {
  const найден = process.argv.find(function (a) { return a.indexOf(имя + '=') === 0; });
  return найден ? найден.slice(имя.length + 1) : null;
}
const ПАПКА = аргумент('--папка');
const ПАПКА_JS = path.join(ПАПКА || КОРЕНЬ, 'js');

let провалов = 0;
let проверок = 0;
function проверить(условие, что) {
  проверок++;
  if (условие) {
    console.log('  ок   ' + что);
  } else {
    провалов++;
    console.log('  ПРОВАЛ: ' + что);
  }
}

/** Поддельная память браузера: помнит, что в неё клали, как настоящий localStorage. */
function память(начальное) {
  const ящик = Object.assign({}, начальное || {});
  return {
    getItem: function (к) { return (к in ящик ? ящик[к] : null); },
    setItem: function (к, з) { ящик[к] = String(з); },
    removeItem: function (к) { delete ящик[к]; }
  };
}

/** Честная пустышка узла разметки — довольно telegram.js и лист-ещё.js, DOM не рисуем взаправду. */
function узел() {
  return {
    classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
    addEventListener: function () {}, setAttribute: function () {}, appendChild: function () {},
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    style: { setProperty: function () {}, removeProperty: function () {}, getPropertyValue: function () { return ''; } },
    focus: function () {}, blur: function () {}, click: function () {},
    textContent: '', className: '', id: '', dataset: {}
  };
}

/**
 * Поднять js/telegram.js (и, если попросили, следом js/лист-ещё.js) в ОДНОЙ
 * песочнице vm — window.Телеграм из первого файла виден второму, ровно как
 * в index.html (telegram.js подключён раньше лист-ещё.js).
 *
 * настройки.память          — с чем стартует localStorage
 * настройки.телеграм        — что положить в window.Telegram.WebApp
 *                              (настоящий SDK Telegram); null — вне Telegram вовсе
 * настройки.вибрацияБраузера — есть ли у обычного браузера navigator.vibrate
 * настройки.сЛистом          — поднять следом ещё и js/лист-ещё.js
 */
function поднять(настройки) {
  настройки = настройки || {};
  const хранилище = память(настройки.память);
  const окно = {
    Telegram: настройки.телеграм === null ? undefined : {
      WebApp: Object.assign({
        ready: function () {}, expand: function () {}, onEvent: function () {}, offEvent: function () {},
        initDataUnsafe: {}, themeParams: {}, isVersionAtLeast: function () { return false; },
        CloudStorage: null, HapticFeedback: null, version: '6.0', platform: 'unknown'
      }, настройки.телеграм || {})
    },
    localStorage: хранилище,
    addEventListener: function () {}, removeEventListener: function () {},
    matchMedia: function () { return { matches: false, addEventListener: function () {}, addListener: function () {} }; },
    setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval
  };
  const навигатор = настройки.вибрацияБраузера ? { vibrate: function () { return true; } } : {};
  const документ = {
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: узел, addEventListener: function () {},
    documentElement: узел(), head: узел(), body: узел()
  };
  const песочница = {
    window: окно, document: документ, localStorage: хранилище, navigator: навигатор,
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval,
    Math: Math, JSON: JSON, Date: Date, Number: Number, String: String, Array: Array,
    Object: Object, Boolean: Boolean, RegExp: RegExp, Error: Error
  };
  песочница.globalThis = песочница;
  vm.createContext(песочница);
  const телеграмJs = fs.readFileSync(path.join(ПАПКА_JS, 'telegram.js'), 'utf8');
  vm.runInContext(телеграмJs, песочница, { filename: 'js/telegram.js (лист-звук-вибрация)' });
  if (настройки.сЛистом) {
    const листJs = fs.readFileSync(path.join(ПАПКА_JS, 'лист-ещё.js'), 'utf8');
    vm.runInContext(листJs, песочница, { filename: 'js/лист-ещё.js (лист-звук-вибрация)' });
  }
  return { окно: окно, хранилище: хранилище };
}

console.log('=== Звук на витрине видит старый ключ шашек + честная «Вибрация» ===\n');
if (ПАПКА) console.log('(js/ берём из: ' + ПАПКА_JS + ')\n');

/* ---------------------------------------------------------------------
   ЧАСТЬ 1. Витрина видит старый ключ звука шашек

   Витрина грузит только js/telegram.js и js/game.js — js/шашки-звук.js
   там нет вовсе. Если бы перенос ключа не случился сам здесь, «звукГде-
   НибудьВключён()» в js/game.js прочитал бы пустое место под именем
   «shashki_sound» и решил, что шашки звучат — хотя выбор человека давно
   лежит под старым именем «шашки:звук».
   ------------------------------------------------------------------- */
console.log('1. Витрина видит старый ключ звука шашек');

const выключенСтарым = поднять({ память: { 'шашки:звук': 'выключен' } });
проверить(выключенСтарым.хранилище.getItem('shashki_sound') === 'выключен',
  'старый выбор «выключен» перенёсся под новое имя ключа — витрина увидит его сама');
проверить(выключенСтарым.хранилище.getItem('шашки:звук') === 'выключен',
  'старое имя не стёрто — шашки на другом устройстве со старой страницей всё ещё работают');

const свежийСильнееСтарого = поднять({ память: { 'шашки:звук': 'выключен', 'shashki_sound': 'включен' } });
проверить(свежийСильнееСтарого.хранилище.getItem('shashki_sound') === 'включен',
  'свежий выбор под новым именем не затёрт вчерашним старым');

/* ---------------------------------------------------------------------
   ЧАСТЬ 2. js/telegram.js честно решает, вибрирует ли этот телефон
   ------------------------------------------------------------------- */
console.log('\n2. Признак «вибрация доступна» в js/telegram.js');

const вТелеграмеСОтдачей = поднять({
  телеграм: {
    HapticFeedback: { impactOccurred: function () {}, selectionChanged: function () {}, notificationOccurred: function () {} },
    isVersionAtLeast: function (в) { return в === '6.1'; }
  }
});
проверить(typeof вТелеграмеСОтдачей.окно.Телеграм.вибрацияДоступна === 'function',
  'дверь window.Телеграм.вибрацияДоступна есть');
проверить(вТелеграмеСОтдачей.окно.Телеграм.вибрацияДоступна() === true,
  'в Telegram с HapticFeedback нужной версии — доступна');

const вТелеграмеБезОтдачи = поднять({ телеграм: { HapticFeedback: null, isVersionAtLeast: function () { return true; } } });
проверить(вТелеграмеБезОтдачи.окно.Телеграм.вибрацияДоступна() === false,
  'в Telegram без HapticFeedback и без navigator.vibrate — недоступна');

const внеTelegramСВибрацией = поднять({ телеграм: null, вибрацияБраузера: true });
проверить(внеTelegramСВибрацией.окно.Телеграм.вибрацияДоступна() === true,
  'обычный мобильный браузер с navigator.vibrate — доступна');

const внеTelegramБезВибрации = поднять({ телеграм: null, вибрацияБраузера: false });
проверить(внеTelegramБезВибрации.окно.Телеграм.вибрацияДоступна() === false,
  'обычный компьютерный браузер без navigator.vibrate — недоступна (строку прятать)');

/* ---------------------------------------------------------------------
   ЧАСТЬ 3. Лист «Ещё» прячет строку «Вибрация», подстраховывая игру

   Дверь игры может отвечать «доступна» не глядя на устройство (так и было
   у дурака) — лист сверяется ещё и с честным признаком telegram.js, и
   только их пересечение решает, быть строке в списке.
   ------------------------------------------------------------------- */
console.log('\n3. js/лист-ещё.js прячет строку «Вибрация» там, где вибрировать нечем');

function естьСтрокаВибрации(окно, доступнаПоМнениюИгры) {
  const двери = { вибрация: { действие: function () {}, доступна: function () { return доступнаПоМнениюИгры; } } };
  return окно.ЛистЕщё.строкиЛиста(двери).some(function (с) { return с.ключ === 'вибрация'; });
}

const компьютер = поднять({ телеграм: null, вибрацияБраузера: false, сЛистом: true });
проверить(естьСтрокаВибрации(компьютер.окно, true) === false,
  'дверь игры говорит «доступна», но на компьютере вибрировать нечем — строки нет');

const телефонБезTelegram = поднять({ телеграм: null, вибрацияБраузера: true, сЛистом: true });
проверить(естьСтрокаВибрации(телефонБезTelegram.окно, true) === true,
  'обычный мобильный браузер с navigator.vibrate — строка есть');

const телефонВTelegram = поднять({
  телеграм: { HapticFeedback: { impactOccurred: function () {} }, isVersionAtLeast: function (в) { return в === '6.1'; } },
  сЛистом: true
});
проверить(естьСтрокаВибрации(телефонВTelegram.окно, true) === true,
  'внутри Telegram с HapticFeedback нужной версии — строка есть');

/* Обратная совместимость: window.Телеграм вовсе нет (страница без этого
   файла или он ещё не догрузился) — лист верит одной только двери игры,
   как было до этой правки. */
const безТелеграмаВовсе = поднять({ телеграм: null, вибрацияБраузера: false, сЛистом: true });
delete безТелеграмаВовсе.окно.Телеграм;
проверить(естьСтрокаВибрации(безТелеграмаВовсе.окно, true) === true,
  'нет window.Телеграм (старая страница) — лист верит двери игры: доступна');
проверить(естьСтрокаВибрации(безТелеграмаВовсе.окно, false) === false,
  'нет window.Телеграм — дверь игры сказала «нет», строки нет');

console.log('\n----------------------------------------');
console.log('Итого проверок: ' + проверок + ', провалов: ' + провалов);
process.exitCode = провалов ? 1 : 0;
