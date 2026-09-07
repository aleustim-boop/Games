'use strict';

/* =====================================================================
   ПОДДЕЛЬНЫЙ БРАУЗЕР — ОДИН НА ВСЕ ПРОВЕРКИ БЕЗ БРАУЗЕРА.

   Зачем. js/telegram.js и js/game.js написаны для браузера: им нужны
   window, document, localStorage, Date. Проверки на Node поднимают их
   в песочнице (vm) с подделками этих вещей. До сегодняшнего дня у каждого
   исполнителя была своя копия подделки — и два ложных срабатывания за день
   случились ровно из-за неточной подделки (узел без честного classList,
   textContent, который не собирался из детей). Теперь подделка одна.

   Что здесь есть:
     сделатьПамять(запрещена)   — localStorage: ящик с записями; «запрещена» —
                                  ругается на каждый вызов (инкогнито);
     сделатьОблако(настройки)   — CloudStorage Telegram: придирчив к имени
                                  записи (латиница), умеет «молчать» и
                                  «отказывать», считает записи и отказы;
     поддельныеЧасы(начало)     — Date, который переставляют рукой: неделя
                                  за секунду, перерыв после осечки — за миг;
     сделатьДокумент()          — document с ЧЕСТНЫМИ узлами: classList
                                  (add/remove/toggle/contains поверх className),
                                  textContent, собираемый из детей,
                                  createTextNode, appendChild/remove,
                                  getElementById и простой querySelector;
     поднять(исходник, настройки) — запустить скрипт в песочнице и вернуть
                                  окно (с saveScore/loadScore/Рейтинг и т. п.);
     поднятьTelegramJS(настройки) — то же для js/telegram.js из проекта
                                  (или из переданного исходника);
     исходникИзКоммита(коммит, файл) — старый файл прямо из истории git,
                                  чтобы сравнивать «до» и «после» без копий.

   Правило этого файла: подделка ведёт себя как браузер, а не «удобно для
   проверки». Обнаружилась разница с живым браузером — чинить здесь, один раз.
   ===================================================================== */

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.resolve(__dirname, '..');
const ПРАВИЛО_КЛЮЧА_ОБЛАКА = /^[A-Za-z0-9_-]{1,128}$/;

/* ---------------------------------------------------------------------
   Память браузера (localStorage)
   --------------------------------------------------------------------- */

function сделатьПамять(запрещена) {
  const ящик = Object.create(null);
  const ругаться = function () { throw new Error('память браузера запрещена'); };
  return {
    ящик: ящик,
    getItem: function (ключ) {
      if (запрещена) ругаться();
      return Object.prototype.hasOwnProperty.call(ящик, ключ) ? ящик[ключ] : null;
    },
    setItem: function (ключ, значение) {
      if (запрещена) ругаться();
      ящик[ключ] = String(значение);
    },
    removeItem: function (ключ) {
      if (запрещена) ругаться();
      delete ящик[ключ];
    },
    clear: function () { for (const к of Object.keys(ящик)) delete ящик[к]; },
    key: function (н) { return Object.keys(ящик)[н] || null; },
    get length() { return Object.keys(ящик).length; },
    ключи: function () { return Object.keys(ящик).sort(); }
  };
}

/* ---------------------------------------------------------------------
   Облако Telegram (CloudStorage)

   Настройки: { латиница: true, молчит: false, отказывает: false, ящик: {} }.
   Флаги можно переключать на ходу: облако.молчит = true.
   «выключено» — то же, что «отказывает» (так его звали в одной из проверок).
   --------------------------------------------------------------------- */

function сделатьОблако(настройки) {
  const н = настройки || {};
  const ящик = Object.create(null);
  if (н.ящик) for (const к of Object.keys(н.ящик)) ящик[к] = String(н.ящик[к]);
  const о = {
    ящик: ящик,
    отказы: [],           // имена записей, которые облако отвергло
    записей: 0,           // сколько раз записывали
    обращений: 0,         // сколько раз вообще спрашивали
    молчит: н.молчит === true,
    отказывает: н.отказывает === true,
    выключено: false,
    латиница: н.латиница !== false
  };
  const потом = function (дело) { setTimeout(дело, 0); };
  const сорвалось = function (ответить) {
    if (о.молчит) return true;                                  // ответа не будет никогда
    if (о.отказывает || о.выключено) { потом(function () { ответить('NETWORK'); }); return true; }
    return false;
  };
  const имяНеГодится = function (ключ, ответить) {
    if (о.латиница && !ПРАВИЛО_КЛЮЧА_ОБЛАКА.test(String(ключ))) {
      о.отказы.push(ключ);
      потом(function () { ответить('KEY_INVALID'); });
      return true;
    }
    return false;
  };
  о.getItem = function (ключ, ответить) {
    о.обращений++;
    if (сорвалось(ответить) || имяНеГодится(ключ, ответить)) return;
    потом(function () { ответить(null, Object.prototype.hasOwnProperty.call(ящик, ключ) ? ящик[ключ] : ''); });
  };
  о.setItem = function (ключ, значение, ответить) {
    о.обращений++;
    ответить = ответить || function () {};
    if (сорвалось(ответить) || имяНеГодится(ключ, ответить)) return;
    о.записей++;
    ящик[ключ] = String(значение);
    потом(function () { ответить(null, true); });
  };
  о.removeItem = function (ключ, ответить) {
    о.обращений++;
    ответить = ответить || function () {};
    if (сорвалось(ответить) || имяНеГодится(ключ, ответить)) return;
    delete ящик[ключ];
    потом(function () { ответить(null, true); });
  };
  о.getItems = function (ключи, ответить) {
    о.обращений++;
    if (сорвалось(ответить)) return;
    const результат = {};
    for (const к of ключи) результат[к] = Object.prototype.hasOwnProperty.call(ящик, к) ? ящик[к] : '';
    потом(function () { ответить(null, результат); });
  };
  о.getKeys = function (ответить) {
    о.обращений++;
    if (сорвалось(ответить)) return;
    потом(function () { ответить(null, Object.keys(ящик)); });
  };
  return о;
}

/* ---------------------------------------------------------------------
   Часы, которые переставляют рукой
   --------------------------------------------------------------------- */

function поддельныеЧасы(начало) {
  let сейчас = typeof начало === 'number' ? начало : new Date(2026, 8, 7, 12, 0).getTime();
  class Дата extends Date {
    constructor() {
      if (arguments.length === 0) super(сейчас);
      else super(...arguments);
    }
    static now() { return сейчас; }
  }
  return {
    Дата: Дата,
    сейчас: function () { return сейчас; },
    установить: function (мс) { сейчас = мс; },
    /** Поставить календарный день (и час — по умолчанию полдень по местному). */
    поставить: function (год, месяц, день, час, минута) {
      сейчас = new Date(год, месяц - 1, день, час === undefined ? 12 : час, минута || 0).getTime();
    },
    прошло: function (мс) { сейчас += мс; }
  };
}

/* ---------------------------------------------------------------------
   Документ с честными узлами
   --------------------------------------------------------------------- */

function разобратьСелектор(простой) {
  // «tag#id.класс.другой[data-имя="значение"]» → части
  const части = { тег: null, id: null, классы: [], атрибуты: [] };
  const текст = простой.replace(/\[([^\]=]+)(?:="?([^"\]]*)"?)?\]/g, function (всё, имя, значение) {
    части.атрибуты.push({ имя: имя, значение: значение === undefined ? null : значение });
    return '';
  });
  const куски = текст.split(/(?=[#.])/);
  for (const кусок of куски) {
    if (!кусок) continue;
    if (кусок[0] === '#') части.id = кусок.slice(1);
    else if (кусок[0] === '.') части.классы.push(кусок.slice(1));
    else части.тег = кусок.toUpperCase();
  }
  return части;
}

function подходит(узел, части) {
  if (!узел || узел.nodeType !== 1) return false;
  if (части.тег && части.тег !== '*' && узел.tagName !== части.тег) return false;
  if (части.id && узел.id !== части.id) return false;
  for (const к of части.классы) if (!узел.classList.contains(к)) return false;
  for (const а of части.атрибуты) {
    if (!узел.hasAttribute(а.имя)) return false;
    if (а.значение !== null && узел.getAttribute(а.имя) !== а.значение) return false;
  }
  return true;
}

function всеПотомки(узел, список) {
  for (const д of узел.children) { список.push(д); всеПотомки(д, список); }
  return список;
}

/** Поиск по селектору: простые селекторы через пробел (потомки) и через запятую. */
function найтиВсе(корень, селектор) {
  const итог = [];
  for (const ветка of String(селектор).split(',')) {
    const цепочка = ветка.trim().split(/\s+/).filter(Boolean).map(разобратьСелектор);
    if (!цепочка.length) continue;
    let кандидаты = всеПотомки(корень, []);
    кандидаты = кандидаты.filter(function (у) { return подходит(у, цепочка[0]); });
    for (let i = 1; i < цепочка.length; i++) {
      const следующие = [];
      for (const к of кандидаты) for (const п of всеПотомки(к, [])) if (подходит(п, цепочка[i]) && следующие.indexOf(п) === -1) следующие.push(п);
      кандидаты = следующие;
    }
    for (const к of кандидаты) if (итог.indexOf(к) === -1) итог.push(к);
  }
  return итог;
}

/** Стиль узла: свойства как поля плюс setProperty/removeProperty, как в браузере. */
function сделатьСтиль() {
  const стиль = {};
  Object.defineProperty(стиль, 'setProperty', { value: function (имя, значение) { стиль[имя] = String(значение); }, enumerable: false });
  Object.defineProperty(стиль, 'removeProperty', { value: function (имя) { const было = стиль[имя]; delete стиль[имя]; return было || ''; }, enumerable: false });
  Object.defineProperty(стиль, 'getPropertyValue', { value: function (имя) { return стиль[имя] || ''; }, enumerable: false });
  return стиль;
}

function сделатьТекстовыйУзел(текст) {
  return { nodeType: 3, nodeName: '#text', textContent: String(текст), parentElement: null, parentNode: null,
    get data() { return this.textContent; }, set data(т) { this.textContent = String(т); },
    remove: function () { if (this.parentNode) this.parentNode.removeChild(this); } };
}

function сделатьУзел(тег, документ) {
  const у = {
    nodeType: 1,
    tagName: String(тег || 'div').toUpperCase(),
    id: '',
    className: '',
    childNodes: [],
    parentElement: null,
    parentNode: null,
    style: сделатьСтиль(),
    dataset: {},
    атрибуты: Object.create(null),
    слушатели: Object.create(null),
    ownerDocument: документ,
    hidden: false,
    disabled: false,
    value: '',
    clientHeight: 0, clientWidth: 0, scrollHeight: 0, scrollWidth: 0, offsetHeight: 0, offsetWidth: 0,
    offsetParent: null, scrollTop: 0, scrollLeft: 0
  };
  у.nodeName = у.tagName;
  у.classList = {
    список: function () { return у.className.split(/\s+/).filter(Boolean); },
    add: function () { const с = у.classList.список(); for (const к of arguments) if (с.indexOf(к) === -1) с.push(к); у.className = с.join(' '); },
    remove: function () { let с = у.classList.список(); for (const к of arguments) с = с.filter(function (х) { return х !== к; }); у.className = с.join(' '); },
    contains: function (к) { return у.classList.список().indexOf(к) !== -1; },
    toggle: function (к, сила) {
      const есть = у.classList.contains(к);
      const надо = сила === undefined ? !есть : Boolean(сила);
      if (надо && !есть) у.classList.add(к);
      if (!надо && есть) у.classList.remove(к);
      return надо;
    },
    get length() { return у.classList.список().length; },
    item: function (н) { return у.classList.список()[н] || null; }
  };
  Object.defineProperty(у, 'children', { get: function () { return у.childNodes.filter(function (д) { return д.nodeType === 1; }); } });
  Object.defineProperty(у, 'firstChild', { get: function () { return у.childNodes[0] || null; } });
  Object.defineProperty(у, 'lastChild', { get: function () { return у.childNodes[у.childNodes.length - 1] || null; } });
  Object.defineProperty(у, 'firstElementChild', { get: function () { return у.children[0] || null; } });
  Object.defineProperty(у, 'lastElementChild', { get: function () { const д = у.children; return д[д.length - 1] || null; } });
  Object.defineProperty(у, 'textContent', {
    get: function () { return у.childNodes.map(function (д) { return д.textContent; }).join(''); },
    set: function (т) { у.childNodes.length = 0; if (т !== '' && т !== null && т !== undefined) у.appendChild(сделатьТекстовыйУзел(т)); }
  });
  Object.defineProperty(у, 'innerText', { get: function () { return у.textContent; }, set: function (т) { у.textContent = т; } });
  Object.defineProperty(у, 'innerHTML', {
    get: function () { return у.childNodes.map(function (д) { return д.nodeType === 3 ? д.textContent : '<' + д.tagName.toLowerCase() + '>' + д.innerHTML + '</' + д.tagName.toLowerCase() + '>'; }).join(''); },
    // Разметку не разбираем: текст без тегов кладём как текст, с тегами — тоже текстом, чтобы не потерять.
    set: function (т) { у.childNodes.length = 0; if (т) у.appendChild(сделатьТекстовыйУзел(String(т).replace(/<[^>]*>/g, ''))); }
  });
  у.appendChild = function (д) {
    if (!д) return д;
    if (д.parentNode) д.parentNode.removeChild(д);
    у.childNodes.push(д);
    д.parentNode = у;
    д.parentElement = у;
    return д;
  };
  у.append = function () { for (const д of arguments) у.appendChild(typeof д === 'string' ? сделатьТекстовыйУзел(д) : д); };
  у.prepend = function (д) { if (д.parentNode) д.parentNode.removeChild(д); у.childNodes.unshift(д); д.parentNode = у; д.parentElement = у; };
  у.insertBefore = function (д, перед) {
    if (д.parentNode) д.parentNode.removeChild(д);
    const где = перед ? у.childNodes.indexOf(перед) : -1;
    if (где === -1) у.childNodes.push(д); else у.childNodes.splice(где, 0, д);
    д.parentNode = у; д.parentElement = у;
    return д;
  };
  у.removeChild = function (д) {
    const где = у.childNodes.indexOf(д);
    if (где !== -1) { у.childNodes.splice(где, 1); д.parentNode = null; д.parentElement = null; }
    return д;
  };
  у.replaceChildren = function () { у.childNodes.length = 0; for (const д of arguments) у.appendChild(д); };
  у.remove = function () { if (у.parentNode) у.parentNode.removeChild(у); };
  у.contains = function (д) { let т = д; while (т) { if (т === у) return true; т = т.parentNode; } return false; };
  у.closest = function (селектор) {
    const части = разобратьСелектор(селектор.trim());
    let т = у;
    while (т && т.nodeType === 1) { if (подходит(т, части)) return т; т = т.parentNode; }
    return null;
  };
  у.matches = function (селектор) { return подходит(у, разобратьСелектор(селектор.trim())); };
  у.querySelector = function (с) { return найтиВсе(у, с)[0] || null; };
  у.querySelectorAll = function (с) { return найтиВсе(у, с); };
  у.getElementsByClassName = function (к) { return всеПотомки(у, []).filter(function (д) { return д.classList.contains(к); }); };
  у.setAttribute = function (имя, значение) {
    у.атрибуты[имя] = String(значение);
    if (имя === 'id') у.id = String(значение);
    if (имя === 'class') у.className = String(значение);
    if (имя.indexOf('data-') === 0) у.dataset[имя.slice(5)] = String(значение);
  };
  у.getAttribute = function (имя) {
    if (имя === 'id') return у.id || null;
    if (имя === 'class') return у.className || null;
    return Object.prototype.hasOwnProperty.call(у.атрибуты, имя) ? у.атрибуты[имя] : null;
  };
  у.hasAttribute = function (имя) { return у.getAttribute(имя) !== null; };
  у.removeAttribute = function (имя) { delete у.атрибуты[имя]; if (имя === 'id') у.id = ''; if (имя === 'class') у.className = ''; };
  у.addEventListener = function (имя, дело) { (у.слушатели[имя] = у.слушатели[имя] || []).push(дело); };
  у.removeEventListener = function (имя, дело) { у.слушатели[имя] = (у.слушатели[имя] || []).filter(function (д) { return д !== дело; }); };
  у.dispatchEvent = function (событие) {
    const имя = typeof событие === 'string' ? событие : событие.type;
    const с = typeof событие === 'string' ? { type: имя, target: у, currentTarget: у, preventDefault: function () {}, stopPropagation: function () {} } : событие;
    if (!с.target) с.target = у;
    let т = у;
    while (т) {   // всплытие, как в браузере
      s: for (const дело of (т.слушатели[имя] || []).slice()) { с.currentTarget = т; дело.call(т, с); }
      т = т.parentNode;
    }
    return true;
  };
  у.click = function () { у.dispatchEvent('click'); };
  у.focus = function () {}; у.blur = function () {}; у.scrollIntoView = function () {};
  у.getBoundingClientRect = function () { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }; };
  у.getClientRects = function () { return []; };
  у.cloneNode = function (глубоко) {
    const к = сделатьУзел(у.tagName, документ);
    к.id = у.id; к.className = у.className; Object.assign(к.атрибуты, у.атрибуты); Object.assign(к.dataset, у.dataset); Object.assign(к.style, у.style);
    if (глубоко) for (const д of у.childNodes) к.appendChild(д.nodeType === 3 ? сделатьТекстовыйУзел(д.textContent) : д.cloneNode(true));
    return к;
  };
  return у;
}

function сделатьДокумент() {
  const документ = { nodeType: 9, readyState: 'complete', hidden: false, visibilityState: 'visible', слушатели: Object.create(null) };
  документ.createElement = function (тег) { return сделатьУзел(тег, документ); };
  документ.createTextNode = function (т) { return сделатьТекстовыйУзел(т); };
  документ.createDocumentFragment = function () { return сделатьУзел('#fragment', документ); };
  документ.documentElement = сделатьУзел('html', документ);
  документ.head = документ.documentElement.appendChild(сделатьУзел('head', документ));
  документ.body = документ.documentElement.appendChild(сделатьУзел('body', документ));
  документ.getElementById = function (id) {
    return всеПотомки(документ.documentElement, []).filter(function (у) { return у.id === id; })[0] || null;
  };
  документ.querySelector = function (с) { return найтиВсе(документ.documentElement, с)[0] || null; };
  документ.querySelectorAll = function (с) { return найтиВсе(документ.documentElement, с); };
  документ.getElementsByClassName = function (к) { return документ.documentElement.getElementsByClassName(к); };
  документ.addEventListener = function (имя, дело) { (документ.слушатели[имя] = документ.слушатели[имя] || []).push(дело); };
  документ.removeEventListener = function () {};
  документ.dispatchEvent = function (имя) { for (const д of (документ.слушатели[имя] || []).slice()) д({ type: имя, target: документ }); };
  /** Быстро собрать разметку: узел(тег, { id, класс, текст }, дети...). */
  документ.узел = function (тег, свойства) {
    const у = документ.createElement(тег);
    const с = свойства || {};
    if (с.id) у.id = с.id;
    if (с.класс) у.className = с.класс;
    if (с.текст !== undefined) у.textContent = с.текст;
    for (let i = 2; i < arguments.length; i++) у.appendChild(arguments[i]);
    return у;
  };
  return документ;
}

/* ---------------------------------------------------------------------
   Песочница
   --------------------------------------------------------------------- */

/**
 * Запустить исходник в поддельном браузере.
 * настройки: { память, облако, часы, документ, telegram (добавки к WebApp),
 *              консоль (свой объект) или собиратьПредупреждения: true,
 *              имяФайла, размер: {ширина, высота} }
 * Возвращает { окно, документ, песочница, спросить(выражение), предупреждения,
 *              ошибкиКонсоли, память, облако } плюс всё, что скрипт положил
 * в window (saveScore, loadScore, isReady, Рейтинг, Сеть …) — через «окно».
 */
function поднять(исходник, настройки) {
  const н = настройки || {};
  const память = н.память || сделатьПамять(false);
  const документ = н.документ || сделатьДокумент();
  const часы = н.часы || null;
  const предупреждения = [];
  const ошибкиКонсоли = [];
  const консоль = н.консоль || {
    log: function () {},
    info: function () {},
    warn: function () { предупреждения.push(Array.prototype.map.call(arguments, String).join(' ')); },
    error: function () { ошибкиКонсоли.push(Array.prototype.map.call(arguments, String).join(' ')); }
  };
  const окно = {
    localStorage: память,
    sessionStorage: сделатьПамять(false),
    document: документ,
    innerWidth: (н.размер && н.размер.ширина) || 390,
    innerHeight: (н.размер && н.размер.высота) || 844,
    devicePixelRatio: 2,
    location: { href: 'http://127.0.0.1/index.html', search: н.поиск || '', hash: '', pathname: '/index.html', origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1' },
    navigator: { userAgent: 'поддельный браузер', clipboard: { writeText: function () { return Promise.resolve(); } } },
    addEventListener: function () {},
    removeEventListener: function () {},
    matchMedia: function () { return { matches: false, addEventListener: function () {}, addListener: function () {} }; },
    getComputedStyle: function () { return { fontSize: '16px', lineHeight: '19.2px', getPropertyValue: function () { return ''; } }; },
    requestAnimationFrame: function (дело) { return setTimeout(дело, 0); },
    cancelAnimationFrame: function (н) { clearTimeout(н); },
    scrollTo: function () {},
    alert: function () {},
    fetch: н.fetch || undefined
  };
  if (н.облако || н.telegram) {
    окно.Telegram = { WebApp: Object.assign({
      version: '7.10',
      isVersionAtLeast: function () { return true; },
      themeParams: {},
      ready: function () {}, expand: function () {}, close: function () {},
      onEvent: function () {}, offEvent: function () {},
      BackButton: { show: function () {}, hide: function () {}, onClick: function () {}, offClick: function () {} },
      initDataUnsafe: {}
    }, н.облако ? { CloudStorage: н.облако } : {}, н.telegram || {}) };
  }
  const песочница = {
    window: окно,
    document: документ,
    localStorage: память,
    navigator: окно.navigator,
    location: окно.location,
    Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout,
    setInterval: setInterval, clearInterval: clearInterval,
    JSON: JSON, Math: Math, Number: Number, String: String, Array: Array, Object: Object,
    Error: Error, TypeError: TypeError, RangeError: RangeError, isFinite: isFinite, isNaN: isNaN,
    parseInt: parseInt, parseFloat: parseFloat, encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent, encodeURI: encodeURI, decodeURI: decodeURI,
    Map: Map, Set: Set, RegExp: RegExp, Symbol: Symbol, Boolean: Boolean, Function: Function,
    Date: часы ? часы.Дата : Date,
    console: консоль,
    requestAnimationFrame: окно.requestAnimationFrame,
    getComputedStyle: окно.getComputedStyle,
    fetch: окно.fetch,
    URLSearchParams: URLSearchParams, URL: URL
  };
  песочница.globalThis = песочница;
  песочница.self = песочница;
  vm.createContext(песочница);
  vm.runInContext(исходник, песочница, { filename: н.имяФайла || 'скрипт.js' });
  return {
    окно: окно,
    документ: документ,
    песочница: песочница,
    память: память,
    облако: н.облако || null,
    часы: часы,
    предупреждения: предупреждения,
    ошибкиКонсоли: ошибкиКонсоли,
    спросить: function (выражение) { return vm.runInContext(выражение, песочница); },
    saveScore: окно.saveScore, loadScore: окно.loadScore, isReady: окно.isReady, Рейтинг: окно.Рейтинг
  };
}

/** js/telegram.js из проекта (или переданный исходник) в поддельном браузере. */
function поднятьTelegramJS(настройки) {
  const н = настройки || {};
  const исходник = н.исходник || fs.readFileSync(path.join(КОРЕНЬ, 'js', 'telegram.js'), 'utf8');
  return поднять(исходник, Object.assign({ имяФайла: 'js/telegram.js' }, н));
}

/** Старый файл из истории git — чтобы сравнивать «до» и «после» без копий. */
function исходникИзКоммита(коммит, файл) {
  return execFileSync('git', ['show', коммит + ':' + файл], { cwd: КОРЕНЬ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

module.exports = {
  КОРЕНЬ: КОРЕНЬ,
  сделатьПамять: сделатьПамять,
  сделатьОблако: сделатьОблако,
  поддельныеЧасы: поддельныеЧасы,
  сделатьДокумент: сделатьДокумент,
  поднять: поднять,
  поднятьTelegramJS: поднятьTelegramJS,
  исходникИзКоммита: исходникИзКоммита
};

/* Самопроверка честности узлов: node tests/поддельный-браузер.js */
if (require.main === module) {
  const д = сделатьДокумент();
  const плашка = д.узел('div', { id: 'плашка', класс: 'экран скрыт' }, д.узел('span', { класс: 'подпись', текст: 'Привет' }), д.createTextNode(' мир'));
  д.body.appendChild(плашка);
  const беды = [];
  const надо = function (условие, что) { if (!условие) беды.push(что); };
  надо(плашка.textContent === 'Привет мир', 'textContent собирается из детей');
  плашка.classList.remove('скрыт');
  надо(плашка.className === 'экран', 'classList.remove правит className');
  надо(плашка.classList.toggle('виден') === true && плашка.classList.contains('виден'), 'toggle добавляет');
  надо(д.getElementById('плашка') === плашка, 'getElementById находит по дереву');
  надо(д.querySelector('#плашка .подпись').textContent === 'Привет', 'querySelector с потомком');
  надо(д.querySelectorAll('.экран').length === 1, 'querySelectorAll по классу');
  плашка.querySelector('.подпись').textContent = 'Пока';
  надо(плашка.textContent === 'Пока мир', 'textContent ребёнка меняет текст родителя');
  let нажато = 0;
  плашка.addEventListener('click', function () { нажато++; });
  плашка.querySelector('.подпись').click();
  надо(нажато === 1, 'клик по ребёнку всплывает к родителю');
  const ч = поддельныеЧасы(); ч.поставить(2026, 9, 7); const было = ч.сейчас(); ч.прошло(86400000);
  надо(new ч.Дата().getDate() === 8 && ч.сейчас() - было === 86400000, 'часы переставляются');
  console.log(беды.length ? 'ПЛОХО: ' + беды.join('; ') : 'поддельный браузер: узлы честные, часы ходят');
  process.exit(беды.length ? 1 : 0);
}
