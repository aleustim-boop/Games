'use strict';

/* Проверка: «Похвастаться» у десяти одиночных игр (этап О2 плана
   штаб/план-похвастаться-ярлык.md). Браузерные файлы запускаем в песочнице vm:

     1. js/похвастаться.js — ссылка на игру содержит ?startapp=<метка из
        server/названия.js>, а запасные слова (то, что уйдёт в список чатов,
        если сервер отказал) совпадают с серверными буква в букву: время
        «0:59», «3:40», «1:02:03» и очки «12 340 очков»;
     2. js/сеть.js — знает все десять меток: разбор ссылки «метка_-адрес»
        называет именно эту игру (а не пусто и не дурака), а голая метка
        («saper» без адреса, как кладёт «Похвастаться») — тоже;
     3. js/похвастаться.js, ГЛАВНЫЙ путь: у поддельного Telegram есть
        shareMessage, поддельный сервер отвечает «ок» — сверяем ТЕЛО запроса
        к серверу: {игра, исход, мера, значение} и «режим» только если он
        непустая строка.

   Запуск:  node tests/похвастаться-одиночные-браузер.js
            [--похвастаться=<путь к файлу>] [--сеть=<путь к файлу>]
   Ломающий запуск: передать путь к КОПИИ файла с испорченным словом или
   без метки saper — проверка обязана покраснеть. Настоящие файлы не портим.
   Код выхода: 0 — всё зелено, 1 — есть провалы. */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const КОРЕНЬ = path.resolve(__dirname, '..');
const названия = require(path.join(КОРЕНЬ, 'server', 'названия.js'));
const сервер = require(path.join(КОРЕНЬ, 'server', 'сервер.js'));

function довод(имя) {
  const найдено = process.argv.find(function (а) { return а.indexOf('--' + имя + '=') === 0; });
  return найдено ? найдено.slice(имя.length + 3) : '';
}
const ИСХОДНИК_ПОХВАСТАТЬСЯ = fs.readFileSync(довод('похвастаться') || path.join(КОРЕНЬ, 'js', 'похвастаться.js'), 'utf8');
const ИСХОДНИК_СЕТИ = fs.readFileSync(довод('сеть') || path.join(КОРЕНЬ, 'js', 'сеть.js'), 'utf8');

let всего = 0;
let провалов = 0;
function проверить(что, правда) {
  всего++;
  if (!правда) провалов++;
  console.log((правда ? '  ок   ' : '  БЕДА ') + что);
}

/** Меры и значения для проверки слов: подходящие игре по её мере. */
function значенияДляМеры(мера) {
  return мера === 'очки' ? [1, 22, 12340] : [59, 220, 3723];
}

/**
 * Что браузер уложил бы в список чатов, если сервер молчит: { ссылка, слова }.
 * Телефон в Telegram: запасной путь открывает t.me/share/url?url=…&text=….
 */
async function чтоУшлоВЧат(игра, описание) {
  const увиденное = { адрес: '' };
  const окно = {
    location: { search: '', hash: '', protocol: 'https:', href: 'https://пример/Games/',
                origin: 'https://пример', pathname: '/Games/', host: 'пример' },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    navigator: {},
    Telegram: { WebApp: {
      initData: 'проверка', platform: 'android',
      openTelegramLink: function (адрес) { увиденное.адрес = адрес; }
    } }
  };
  const окружение = {
    window: окно, document: { getElementById: function () { return null; } },
    console: console, fetch: function () { return Promise.reject(new Error('сети нет')); },
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    URLSearchParams: URLSearchParams, AbortController: AbortController,
    Promise: Promise, JSON: JSON, Number: Number, Math: Math
  };
  окружение.globalThis = окружение;
  vm.runInNewContext(ИСХОДНИК_ПОХВАСТАТЬСЯ, окружение, { filename: 'похвастаться.js' });
  await окно.Сеть.похвастаться(описание);
  if (!увиденное.адрес) return { ссылка: '', слова: '' };
  const разбор = new URL(увиденное.адрес);
  return { ссылка: разбор.searchParams.get('url') || '', слова: разбор.searchParams.get('text') || '' };
}

/**
 * Главный путь «Похвастаться»: Telegram умеет shareMessage, сервер отвечает «ок».
 * Возвращает { тела: [тела запросов к серверу], адреса: [куда стучались],
 * поверх: [номера сообщений, показанные в shareMessage], итог: что вернулось }.
 */
async function чтоУшлоСерверу(описание) {
  const увиденное = { тела: [], адреса: [], поверх: [] };
  const окно = {
    location: { search: '', hash: '', protocol: 'https:', href: 'https://пример.example/Games/',
                origin: 'https://пример.example', pathname: '/Games/', host: 'пример.example' },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    navigator: {},
    Telegram: { WebApp: {
      initData: 'подпись-проверки', platform: 'android',
      isVersionAtLeast: function () { return true; },
      shareMessage: function (номер, обратно) { увиденное.поверх.push(номер); обратно(true); },
      openTelegramLink: function () {}
    } }
  };
  const окружение = {
    window: окно, document: { getElementById: function () { return null; } },
    console: console,
    fetch: function (адрес, настройки) {
      увиденное.адреса.push(String(адрес));
      увиденное.тела.push(JSON.parse(настройки.body));
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ ок: true, номерСообщения: 'сообщение-1' }); } });
    },
    // Таймеры-пустышки: сторожа на 2,5 секунды не нужны и не держат процесс.
    setTimeout: function () { return 0; }, clearTimeout: function () {},
    URLSearchParams: URLSearchParams, AbortController: AbortController,
    Promise: Promise, JSON: JSON, Number: Number, Math: Math
  };
  окружение.globalThis = окружение;
  vm.runInNewContext(ИСХОДНИК_ПОХВАСТАТЬСЯ, окружение, { filename: 'похвастаться.js' });
  увиденное.итог = await окно.Сеть.похвастаться(описание);
  return увиденное;
}

/** Окно с js/сеть.js, как в tests/маршрут-приглашения-8-игр.js (минимум нужного). */
function поднятьСеть(хеш) {
  const память = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
  const окно = {
    name: '', location: { search: '', hash: хеш || '', protocol: 'https:', host: 'example.github.io',
      origin: 'https://example.github.io', pathname: '/Games/index.html',
      href: 'https://example.github.io/Games/index.html', replace: function () {} },
    localStorage: память, sessionStorage: память, addEventListener: function () {},
    btoa: function (с) { return Buffer.from(с, 'binary').toString('base64'); },
    atob: function (с) { return Buffer.from(с, 'base64').toString('binary'); }
  };
  const страница = {
    getElementById: function () { return null; }, addEventListener: function () {},
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    readyState: 'complete'
  };
  const окружение = {
    window: окно, document: страница,
    console: { log: function () {}, warn: function () {}, error: function () {} },
    fetch: function () { return new Promise(function () {}); },
    setTimeout: function () { return 0; }, clearTimeout: function () {},
    setInterval: function () { return 0; }, clearInterval: function () {},
    URLSearchParams: URLSearchParams, URL: URL, AbortController: AbortController,
    Promise: Promise, JSON: JSON, Date: Date, Math: Math
  };
  окружение.globalThis = окружение;
  vm.runInNewContext(ИСХОДНИК_СЕТИ, окружение, { filename: 'js/сеть.js' });
  return окно.Сеть;
}

async function прогнать() {
  const игры = названия.одиночныеИгры();
  // Ноль найденных игр — провал, а не пропуск.
  проверить('у сервера найдены одиночные игры (' + игры.length + ')', игры.length > 0);

  console.log('\n1. js/похвастаться.js: ссылка и запасные слова');
  for (const игра of игры) {
    const строка = названия.одиночнаяИгра(игра);
    for (const значение of значенияДляМеры(строка.мера)) {
      const описание = { игра: игра, исход: 'победа', мера: строка.мера, значение: значение };
      const ушло = await чтоУшлоВЧат(игра, описание);
      const ждём = сервер.словаОдиночнойПобеды(описание);
      проверить(игра + ' ' + значение + ': ссылка с ?startapp=' + строка.метка + ' (' + (ушло.ссылка || 'ссылки нет') + ')',
        ушло.ссылка !== '' && /\?startapp=[a-z]+$/.test(ушло.ссылка) &&
        ушло.ссылка.slice(ушло.ссылка.indexOf('?startapp=') + 10) === строка.метка);
      проверить(игра + ' ' + значение + ': слова как у сервера «' + ждём + '»' +
        (ушло.слова === ждём ? '' : ' (браузер: «' + ушло.слова + '»)'),
        ждём.length > 0 && ушло.слова === ждём);
    }
  }

  console.log('\n2. js/сеть.js: десять меток известны');
  const сеть = поднятьСеть();
  проверить('у сети есть разобратьПриглашение', Boolean(сеть) && typeof сеть.разобратьПриглашение === 'function');
  const БУКВЫ = Buffer.from('https://stol.example.org', 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  for (const игра of игры) {
    const метка = названия.одиночнаяИгра(игра).метка;
    const разбор = сеть && сеть.разобратьПриглашение ? сеть.разобратьПриглашение(метка + '_-' + БУКВЫ) : null;
    проверить(метка + ' → «' + игра + '» (сеть назвала: «' + (разбор ? разбор.игра : 'ничего') + '»)',
      Boolean(разбор) && разбор.игра === игра);
  }

  // Голая метка — как её кладёт «Похвастаться»: ?startapp=saper, без кода и адреса.
  // Разбор «КОД-адрес» тут пуст (стола нет), игру называет какуюИгруПроситСсылка:
  // именно её спрашивает переброска на главной (js/game.js).
  for (const игра of игры) {
    const метка = названия.одиночнаяИгра(игра).метка;
    const сетьС = поднятьСеть('#tgWebAppStartParam=' + метка);
    const назвала = сетьС && typeof сетьС.какуюИгруПроситСсылка === 'function' ? сетьС.какуюИгруПроситСсылка() : null;
    проверить('голая метка «' + метка + '» → «' + игра + '» (сеть назвала: «' + назвала + '»)', назвала === игра);
  }

  console.log('\n3. js/похвастаться.js: главный путь, тело запроса к серверу');
  const ИМЕНА_ПОЛЕЙ = ['initData', 'ссылка', 'вид', 'игра', 'исход', 'мера', 'значение', 'режим'];
  const образцы = [
    { имя: 'сапёр 220 с', описание: { игра: 'сапёр', исход: 'победа', мера: 'секунд', значение: 220 }, режим: false },
    { имя: '2048 с режимом classic', описание: { игра: '2048', исход: 'победа', мера: 'очки', значение: 12340, режим: 'classic' }, режим: 'classic' },
    { имя: 'судоку 3723 с, режим пустая строка', описание: { игра: 'судоку', исход: 'победа', мера: 'секунд', значение: 3723, режим: '' }, режим: false },
    { имя: 'паук 59 с, режим null', описание: { игра: 'паук', исход: 'победа', мера: 'секунд', значение: 59, режим: null }, режим: false },
    { имя: 'пятнашки 90 с, режим числом 5 (не строка)', описание: { игра: 'пятнашки', исход: 'победа', мера: 'секунд', значение: 90, режим: 5 }, режим: false }
  ];
  for (const образец of образцы) {
    const ушло = await чтоУшлоСерверу(образец.описание);
    const тело = ушло.тела[0] || {};
    const d = образец.описание;
    проверить(образец.имя + ': на сервер ушёл ровно один запрос в /приглашение (' + ушло.адреса.join(', ') + ')',
      ушло.тела.length === 1 && /\/приглашение$/.test(ушло.адреса[0] || ''));
    проверить(образец.имя + ': в теле игра, исход, мера, значение — как у игры',
      тело.игра === d.игра && тело.исход === 'победа' && тело.мера === d.мера && тело.значение === d.значение && тело.вид === 'победа');
    проверить(образец.имя + ': подпись Telegram и ссылка на месте (' + (тело.ссылка || 'ссылки нет') + ')',
      тело.initData === 'подпись-проверки' && typeof тело.ссылка === 'string' && /^https:\/\/t\.me\/.+\?startapp=[a-z0-9]+$/.test(тело.ссылка));
    проверить(образец.имя + ': ' + (образец.режим ? 'режим «' + образец.режим + '» передан' : 'поля «режим» в теле нет'),
      образец.режим ? тело.режим === образец.режим : !Object.prototype.hasOwnProperty.call(тело, 'режим'));
    проверить(образец.имя + ': лишних полей нет (в теле: ' + Object.keys(тело).join(', ') + ')',
      Object.keys(тело).every(function (к) { return ИМЕНА_ПОЛЕЙ.indexOf(к) !== -1; }));
    проверить(образец.имя + ': выбор чата показан поверх игры (shareMessage: ' + ушло.поверх.join(', ') + '; итог ' + JSON.stringify(ушло.итог) + ')',
      ушло.поверх.length === 1 && ушло.итог.способ === 'поверх' && ушло.итог.отправлено === true);
  }

  /* Значение 0 и дробь. Зафиксированное поведение браузера: он НЕ проверяет
     число, а отдаёт серверу как есть (запрос уходит, shareMessage зовётся);
     отвергает такое значение только сервер. Станет браузер отсекать сам —
     эта проверка покраснеет, и штаб решит, какое поведение правильное. */
  for (const странное of [0, 2.5]) {
    const ушло = await чтоУшлоСерверу({ игра: 'сапёр', исход: 'победа', мера: 'секунд', значение: странное });
    const тело = ушло.тела[0] || {};
    проверить('значение ' + странное + ': браузер отдал серверу как есть (в теле: ' + JSON.stringify(тело.значение) + '), запросов: ' + ушло.тела.length,
      ушло.тела.length === 1 && тело.значение === странное);
  }
  // Что на то же самое скажет сервер — его настоящий разбор описания, не угадывание.
  проверить('контроль: сервер принимает честное значение 220 (иначе проверки отказов ничего не стоят)',
    Boolean(сервер.описаниеОдиночнойПобеды({ игра: 'сапёр', исход: 'победа', мера: 'секунд', значение: 220 })));
  for (const странное of [0, 2.5]) {
    const принято = сервер.описаниеОдиночнойПобеды({ игра: 'сапёр', исход: 'победа', мера: 'секунд', значение: странное });
    проверить('значение ' + странное + ': сервер отвергает описание (ответ: ' + JSON.stringify(принято) + ')', принято === null);
  }

  console.log('Итого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}

прогнать();
