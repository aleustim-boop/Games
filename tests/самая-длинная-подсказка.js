'use strict';

/* =====================================================================
   Самая длинная строка подсказки, которую игра может показать по-настоящему.

   ЗАЧЕМ. Внизу экрана у игры одна строка на всё: слева рассказ о том, что
   случилось, справа — что делать дальше. Места там мало и оно жёсткое:
   на обычном телефоне строке отдано две строчки текста, и лишнее не
   переносится, а СРЕЗАЕТСЯ — причём, поскольку текст стоит по центру,
   срезается сверху и снизу, а не с хвоста. Значит, надо знать точно,
   какой длины бывает самое длинное сообщение.

   Раньше это число вписывали в стенд вёрстки руками. За две правки подряд
   рекорд успел смениться (81 → 97 → 78 знаков), а записанное в стенде
   число осталось прежним — и стенд показывал благополучие, которого
   не было. Поэтому число теперь считается, а не выдумывается.

   КАК СЧИТАЕТ. Никаких списков фраз здесь нет — это и была бы та же ручная
   работа, только в другом файле. Скрипт поднимает НАСТОЯЩИЙ js/game.js
   в поддельном браузере (пустые заглушки вместо экрана), играет им сотни
   партий против его же бота и после каждого хода складывает строку ровно
   так, как это делает сама игра:

       строка = событие + ' · ' + текстДействия()

   Из всех получившихся строк берётся самая длинная. Тексты поменяют —
   пересчёт делается одной командой, без правки этого файла:

       node tests/самая-длинная-подсказка.js
       node tests/самая-длинная-подсказка.js 500     (сколько партий)

   Что делать с ответом: строку-рекордсменку вписать в tests/стенд-вёрстки.html
   (там она стоит под пометкой «самое длинное сообщение»), чтобы стенд
   показывал вёрстку в самом тесном её случае.
   ===================================================================== */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ПАРТИЙ = Number(process.argv[2]) || 300;
const ИСХОДНИК = fs.readFileSync(path.join(__dirname, '..', 'js', 'game.js'), 'utf8');

/* ---------------------------------------------------------------------
   Поддельный браузер: игре нужен экран, но нам он не нужен вовсе.
   Все узлы — пустышки, которые молча принимают любые вызовы.
   --------------------------------------------------------------------- */

function пустойУзел() {
  const узел = {
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
  return узел;
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

/* Насколько торопим игру. Все паузы в игре — только для глаз человека
   (чтобы ход было видно), а на слова они не влияют вовсе. Поэтому здесь
   ждать их по-настоящему незачем: партия против бота идёт полминуты,
   и сотня партий заняла бы почти час. Ужимаем ожидания до пяти
   миллисекунд — тексты от этого не меняются, а прогон укладывается
   в минуту. */
const ПОТОЛОК_ПАУЗЫ = 5;

function поднятьИгру() {
  const поторопить = function (дело, сколько) {
    const реально = Math.min(Number(сколько) || 0, ПОТОЛОК_ПАУЗЫ);
    return setTimeout(дело, реально);
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
    innerWidth: 360, innerHeight: 800,
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

  /* Внутренности игры (партия, событие и прочее) объявлены через let,
     а такие имена в песочницу «наружу» не попадают: они живут в её
     собственной области видимости. Поэтому спрашиваем игру выражением —
     как будто набираем его в консоли браузера. */
  return {
    спросить: function (выражение) { return vm.runInContext(выражение, песочница); }
  };
}

/* ---------------------------------------------------------------------
   Прогон
   --------------------------------------------------------------------- */

const пауза = (мс) => new Promise((r) => setTimeout(r, мс));

/** Строка подсказки ровно так, как её собирает сама игра. */
function строкаПодсказки(игра) {
  return игра.спросить(
    '(function () {' +
    '  var действие = текстДействия();' +
    '  if (событие) return действие ? событие + " · " + действие : событие;' +
    '  return действие || "";' +
    '})()');
}

/**
 * Ход человека: играем просто и законно, лишь бы партия шла. Зовём ровно
 * те же функции, что и кнопки на экране, — тогда и сообщения получаются
 * настоящие, а не собранные нами вручную.
 */
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
  console.log('Считаю самую длинную строку подсказки. Партий: ' + ПАРТИЙ + '.');
  console.log('Игра берётся настоящая — js/game.js, со своим ботом и своими текстами.');
  console.log('');

  const игра = поднятьИгру();
  const собранные = new Map();     // строка → сколько раз встретилась
  let ходов = 0;
  const запомнить = () => {
    const строка = строкаПодсказки(игра);
    if (строка) собранные.set(строка, (собранные.get(строка) || 0) + 1);
  };

  for (let партияНомер = 1; партияНомер <= ПАРТИЙ; партияНомер++) {
    игра.спросить('начатьПартию()');
    запомнить();

    /* Ход бота игра назначает таймером, поэтому просто ждём: таймеры
       в песочнице настоящие. Партия против бота идёт около полуминуты
       машинного времени, поэтому срок берём с запасом. */
    const крайний = Date.now() + 90000;
    while (игра.спросить('!!партия && !партия.завершена') && Date.now() < крайний) {
      if (игра.спросить('ктоХодит(партия) === "человек"')) {
        сходитьЗаЧеловека(игра);
        ходов++;
        запомнить();
      }
      await пауза(20);
      запомнить();
    }
    запомнить();
    // не даём накопиться отложенным делам между партиями
    await пауза(30);
  }

  const все = Array.from(собранные.keys());
  все.sort(function (а, б) { return б.length - а.length; });

  console.log('Разных строк собрано: ' + все.length + ' (ходов сыграно: ' + ходов + ')');
  console.log('');
  console.log('Самые длинные:');
  все.slice(0, 8).forEach(function (строка, номер) {
    console.log('  ' + (номер + 1) + ') ' + строка.length + ' знаков  «' + строка + '»');
  });

  const рекорд = все[0] || '';
  const длиннее90 = все.filter(function (с) { return с.length > 90; }).length;
  console.log('');
  console.log('РЕКОРД: ' + рекорд.length + ' знаков.');
  console.log('Строк длиннее 90 знаков: ' + длиннее90 + '.');
  console.log('');
  console.log('Эту строку и надо держать в tests/стенд-вёрстки.html:');
  console.log(рекорд);
}

главная().catch(function (сбой) {
  console.error('Сорвалось: ' + сбой.message);
  process.exitCode = 1;
});
