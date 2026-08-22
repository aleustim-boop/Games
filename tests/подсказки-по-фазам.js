'use strict';

/* =====================================================================
   Какие длинные сообщения и в какой момент партии игра показывает.

   ЗАЧЕМ. Длинная подсказка занимает не две строчки, а три, и от этого
   стол на экране на мгновение подъезжает вверх примерно на 9 точек.
   Сам по себе сдвиг безобиден — но только если в этот момент игроку
   некуда целиться пальцем на столе. Если же длинное сообщение может
   всплыть посреди защиты, когда игрок как раз метится в карту на столе,
   цель уедет из-под пальца, и это уже не мелочь.

   Значит, надо знать не только «какое сообщение самое длинное», но и
   «в какой момент оно бывает»: когда игрок ходит, когда отбивается,
   когда ждёт соперника.

   КАК СЧИТАЕТ. Так же, как соседний скрипт «самая-длинная-подсказка.js»:
   поднимает НАСТОЯЩИЙ js/game.js в поддельном браузере (пустые заглушки
   вместо экрана), играет им сотни партий против его же бота и после
   каждого шага записывает три вещи — саму строку подсказки, фазу партии
   (ход или защита) и чей сейчас черёд.

       node tests/подсказки-по-фазам.js
       node tests/подсказки-по-фазам.js 200 66   (партий; с какой длины считать длинной)

   Порог длины по умолчанию — 66 знаков: замер в браузере показал, что
   на телефоне шириной 390 точек жирное свежее сообщение просит третью
   строку примерно с этой длины. Порог здесь только для отбора «на что
   смотреть» — настоящая проверка вёрстки живёт в tests/мерка-подсказки.html,
   где строки меряются браузером, а не знаками.
   ===================================================================== */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ПАРТИЙ = Number(process.argv[2]) || 150;
const ПОРОГ = Number(process.argv[3]) || 66;
const ИСХОДНИК = fs.readFileSync(path.join(__dirname, '..', 'js', 'game.js'), 'utf8');

/* ---------- поддельный браузер: экран игре не нужен ---------- */

function пустойУзел() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: { setProperty() {}, removeProperty() {} },
    children: [], childNodes: [], dataset: {},
    textContent: '', innerHTML: '', value: '',
    clientWidth: 360, clientHeight: 40, scrollHeight: 40, offsetWidth: 360, offsetHeight: 40,
    offsetParent: null,
    appendChild() {}, removeChild() {}, insertBefore() {}, remove() {},
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { width: 360, height: 40, top: 0, left: 0, right: 360, bottom: 40 }; }
  };
}

function поддельныйЗвук() {
  return {
    state: 'running', currentTime: 0, resume() {},
    createOscillator() {
      return { connect() {}, start() {}, stop() {}, type: '', frequency: { setValueAtTime() {} } };
    },
    createGain() {
      return { connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    },
    destination: {}
  };
}

/* Паузы в игре сделаны для человеческих глаз, на слова они не влияют:
   ужимаем их, иначе сотня партий заняла бы почти час. */
const ПОТОЛОК_ПАУЗЫ = 5;

function поднятьИгру() {
  const поторопить = function (дело, сколько) {
    return setTimeout(дело, Math.min(Number(сколько) || 0, ПОТОЛОК_ПАУЗЫ));
  };
  const песочница = {
    setTimeout: поторопить, clearTimeout: clearTimeout,
    setInterval: setInterval, clearInterval: clearInterval,
    Math: Math, Date: Date, JSON: JSON, Number: Number, String: String,
    Array: Array, Object: Object, Error: Error, isFinite: isFinite, console: console,
    requestAnimationFrame: function (дело) { return setTimeout(дело, 0); },
    getComputedStyle: function () { return { fontSize: '16px', lineHeight: '19.2px', getPropertyValue: function () { return ''; } }; },
    AudioContext: поддельныйЗвук
  };
  песочница.window = {
    addEventListener() {}, removeEventListener() {},
    matchMedia: function () { return { matches: false, addEventListener() {}, addListener() {} }; },
    localStorage: { getItem: function () { return null; }, setItem() {}, removeItem() {} },
    innerWidth: 390, innerHeight: 844,
    requestAnimationFrame: песочница.requestAnimationFrame,
    getComputedStyle: песочница.getComputedStyle,
    AudioContext: поддельныйЗвук
  };
  песочница.document = {
    getElementById: function () { return пустойУзел(); },
    querySelector: function () { return пустойУзел(); },
    querySelectorAll: function () { return []; },
    createElement: function () { return пустойУзел(); },
    createTextNode: function () { return пустойУзел(); },
    addEventListener() {}, removeEventListener() {},
    documentElement: пустойУзел(), body: пустойУзел(), head: пустойУзел()
  };
  песочница.window.document = песочница.document;
  песочница.globalThis = песочница;

  vm.createContext(песочница);
  vm.runInContext(ИСХОДНИК, песочница, { filename: 'js/game.js' });
  return { спросить: function (выражение) { return vm.runInContext(выражение, песочница); } };
}

/* ---------- прогон ---------- */

const пауза = (мс) => new Promise((r) => setTimeout(r, мс));

/** Строка подсказки и обстановка вокруг неё — одним запросом к игре. */
function снимок(игра) {
  return игра.спросить(
    '(function () {' +
    '  var действие = текстДействия();' +
    '  var строка = событие ? (действие ? событие + " · " + действие : событие) : (действие || "");' +
    '  if (!партия || партия.завершена) return { строка: строка, фаза: "партии нет", мой: false, наСтоле: 0 };' +
    '  return {' +
    '    строка: строка,' +
    '    фаза: фаза(партия),' +
    '    мой: ктоХодит(партия) === "человек",' +
    '    наСтоле: партия.стол.length' +
    '  };' +
    '})()');
}

function сходитьЗаЧеловека(игра) {
  return игра.спросить(
    '(function () {' +
    '  if (!партия || партия.завершена) return "партии нет";' +
    '  if (ктоХодит(партия) !== "человек") return "не наш ход";' +
    '  var рука = партия.руки.человек;' +
    '  if (фаза(партия) === "защита") {' +
    '    var пара = -1;' +
    '    for (var п = 0; п < партия.стол.length; п++) { if (!партия.стол[п].защита) { пара = п; break; } }' +
    '    if (пара >= 0) {' +
    '      for (var i = 0; i < рука.length; i++) {' +
    '        if (бьёт(рука[i], партия.стол[пара].атака, партия.козырь)) { отбитьсяКартой(пара, i); return "отбился"; }' +
    '      }' +
    '    }' +
    '    нажатьБеру(); return "беру";' +
    '  }' +
    '  for (var к = 0; к < рука.length; к++) {' +
    '    if (можноПоложить(партия, рука[к])) { сходитьКартой(к); return "положил"; }' +
    '  }' +
    '  нажатьБито(); return "бито";' +
    '})()');
}

async function главная() {
  console.log('Смотрю, какие длинные подсказки бывают и в какой момент партии.');
  console.log('Партий: ' + ПАРТИЙ + '. Длинной считаю строку от ' + ПОРОГ + ' знаков.');
  console.log('');

  const игра = поднятьИгру();
  const длинные = new Map();   // строка → { сколько, обстановки: Map }
  let всегоСнимков = 0;

  const запомнить = () => {
    const с = снимок(игра);
    всегоСнимков++;
    if (!с.строка || с.строка.length < ПОРОГ) return;
    if (!длинные.has(с.строка)) длинные.set(с.строка, { сколько: 0, обстановки: new Map() });
    const запись = длинные.get(с.строка);
    запись.сколько++;
    const где = с.фаза === 'партии нет' ? 'партия окончена'
      : (с.фаза === 'защита'
          ? (с.мой ? 'ОТБИВАЮСЬ (палец целится в стол)' : 'соперник отбивается')
          : (с.мой ? 'мой ход (палец целится в руку)' : 'ходит соперник'));
    const ключ = где + ', карт на столе: ' + с.наСтоле;
    запись.обстановки.set(ключ, (запись.обстановки.get(ключ) || 0) + 1);
  };

  for (let номер = 1; номер <= ПАРТИЙ; номер++) {
    игра.спросить('начатьПартию()');
    запомнить();
    const крайний = Date.now() + 90000;
    while (игра.спросить('!!партия && !партия.завершена') && Date.now() < крайний) {
      if (игра.спросить('ктоХодит(партия) === "человек"')) {
        сходитьЗаЧеловека(игра);
        запомнить();
      }
      await пауза(20);
      запомнить();
    }
    запомнить();
    await пауза(30);
  }

  const список = Array.from(длинные.entries()).sort((а, б) => б[0].length - а[0].length);
  console.log('Снимков сделано: ' + всегоСнимков + '. Длинных строк набралось: ' + список.length + '.');
  console.log('');

  let опасных = 0;
  список.slice(0, 25).forEach(function (пара, номер) {
    const [строка, запись] = пара;
    console.log((номер + 1) + ') ' + строка.length + ' знаков, встретилась ' + запись.сколько + ' раз');
    console.log('   «' + строка + '»');
    Array.from(запись.обстановки.entries()).forEach(function ([где, сколько]) {
      console.log('      — ' + где + ' (' + сколько + ')');
      if (где.indexOf('ОТБИВАЮСЬ') === 0 && !/карт на столе: 0$/.test(где)) опасных++;
    });
  });

  console.log('');
  if (опасных === 0) {
    console.log('ВЫВОД: ни одно длинное сообщение не всплывает в тот момент, когда игрок');
    console.log('целится пальцем в карту на столе. Значит, короткий подъём стола на 9 точек');
    console.log('промахнуться не даёт: целиться в этот момент попросту не во что.');
  } else {
    console.log('ВНИМАНИЕ: длинное сообщение может всплыть во время защиты, когда на столе');
    console.log('есть карты (' + опасных + ' случаев). Стол в этот момент подъезжает вверх,');
    console.log('и палец может промахнуться мимо цели — это стоит проверить руками.');
  }
}

главная().catch(function (сбой) {
  console.error('Сорвалось: ' + сбой.message);
  process.exitCode = 1;
});
