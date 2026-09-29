'use strict';
/* Проверка этапа Э4.8 (штаб/план-рейтинг-бот-и-счёт.md): судоку сдаёт
   лучшее время в рейтинг через js/очки-рейтинга.js.

   Экран судоку (js/sudoku-ui.js) запускается в песочнице vm на поддельной
   странице — без браузера. Проверяем:
     • старт новой головоломки берёт билет с ключом игры и уровнем ровно
       так, как их называет js/игры-реестр.js;
     • «Продолжить» ту же партию второй билет не берёт;
     • честное решение сдаёт { секунд } ровно один раз, секунды — целое;
     • решение с подсказкой не сдаётся;
     • без Telegram и без двери ОчкиРейтинга экран не падает, запросов нет;
     • sudoku.html подключает сеть → реестр → очки раньше sudoku-ui.js.

   Ломающий запуск — на КОПИЯХ во временной папке, путь доводом:
     node tests/судоку-рейтинг-время.js --ui <копия sudoku-ui.js> --html <копия sudoku.html>
   Файлы проекта проверка не портит никогда. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const КОРЕНЬ = path.join(__dirname, '..');
function довод(имя) {
  const i = process.argv.indexOf(имя);
  return i !== -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : '';
}
const ПУТЬ_UI = довод('--ui') || path.join(КОРЕНЬ, 'js', 'sudoku-ui.js');
const ПУТЬ_HTML = довод('--html') || path.join(КОРЕНЬ, 'sudoku.html');

const КОД_UI = fs.readFileSync(ПУТЬ_UI, 'utf8');
const КОД_ПРАВИЛ = fs.readFileSync(path.join(КОРЕНЬ, 'js', 'sudoku-rules.js'), 'utf8');
const КОД_ЗАДАЧ = fs.readFileSync(path.join(КОРЕНЬ, 'js', 'sudoku-puzzles.js'), 'utf8');
const КОД_ОЧКОВ = fs.readFileSync(path.join(КОРЕНЬ, 'js', 'очки-рейтинга.js'), 'utf8');
const РАЗМЕТКА = fs.readFileSync(ПУТЬ_HTML, 'utf8');
const РЕЕСТР = require(path.join(КОРЕНЬ, 'js', 'игры-реестр.js'));

let проверок = 0;
let провалов = 0;
function проверить(условие, что) {
  проверок += 1;
  if (!условие) {
    провалов += 1;
    console.log('ПРОВАЛ: ' + что);
  }
}

/* ---------- Что говорит реестр: ключ игры и режимы ---------- */
const записьСудоку = РЕЕСТР.все().filter(function (и) { return и.страница === 'sudoku.html'; })[0];
проверить(!!записьСудоку, 'в js/игры-реестр.js есть запись со страницей sudoku.html');
const КЛЮЧ_ИГРЫ = записьСудоку ? записьСудоку.ключ : '';
const РЕЖИМЫ = записьСудоку && записьСудоку.счёт && Array.isArray(записьСудоку.счёт.режимы)
  ? записьСудоку.счёт.режимы.map(function (р) { return р.ключ; }) : [];
проверить(РЕЖИМЫ.length > 0, 'у судоку в реестре есть счёт.режимы');
проверить(записьСудоку && записьСудоку.счёт && записьСудоку.счёт.мера === 'время', 'мера судоку в реестре — «время»');

/* ---------- Поддельная страница ---------- */
function поддельныйУзел(id) {
  const узел = {
    id: id || '', children: [], hidden: false, textContent: '', innerHTML: '', inert: false,
    className: '', tabIndex: 0, dataset: {}, style: {}, open: false, onclick: null,
    атрибуты: {}, мелкий: null,
    classList: {
      набор: new Set(),
      add: function (к) { this.набор.add(к); }, remove: function (к) { this.набор.delete(к); },
      toggle: function (к, да) { if (да === undefined ? !this.набор.has(к) : да) this.набор.add(к); else this.набор.delete(к); },
      contains: function (к) { return this.набор.has(к); }
    },
    setAttribute: function (к, з) { this.атрибуты[к] = String(з); },
    getAttribute: function (к) { return this.атрибуты[к]; },
    append: function () { for (const р of arguments) this.children.push(р); },
    replaceChildren: function () { this.children = []; },
    querySelector: function () { if (!this.мелкий) this.мелкий = поддельныйУзел(); return this.мелкий; },
    focus: function () {}, click: function () { if (this.onclick) this.onclick({ preventDefault: function () {} }); },
    showModal: function () { this.open = true; }, close: function () { this.open = false; }
  };
  return узел;
}

const УРОВНИ_РАЗМЕТКИ = (РАЗМЕТКА.match(/data-level="([^"]+)"/g) || []).map(function (с) { return с.slice(12, -1); });
проверить(УРОВНИ_РАЗМЕТКИ.length > 0, 'в sudoku.html найдены кнопки уровней data-level');

/**
 * Поднять экран судоку в новой песочнице.
 * настройки.дверь: 'шпион' — подменная ОчкиРейтинга, записывает вызовы;
 *                  'настоящая' — js/очки-рейтинга.js без Telegram;
 *                  'нет' — двери на странице нет вовсе.
 * настройки.память — заранее сохранённая партия (для «Продолжить»).
 */
function поднять(настройки) {
  const узлы = new Map();
  const взять = function (id) { if (!узлы.has(id)) узлы.set(id, поддельныйУзел(id)); return узлы.get(id); };
  const кнопкиУровней = УРОВНИ_РАЗМЕТКИ.map(function (у) { const к = поддельныйУзел(); к.dataset.level = у; return к; });
  const память = new Map();
  if (настройки.память) память.set('sudoku-game-v1', JSON.stringify(настройки.память));
  let часы = 1000;
  let тикер = null;
  const вызовы = { взять: [], сдать: [], fetch: 0 };
  const ошибки = [];
  const окно = {
    console: { log: function () {}, warn: function () {}, error: function () { ошибки.push([].join.call(arguments, ' ')); } },
    document: {
      hidden: false,
      body: поддельныйУзел('body'),
      getElementById: взять,
      querySelectorAll: function (с) { return с === '[data-level]' ? кнопкиУровней : []; },
      createElement: function () { return поддельныйУзел(); },
      addEventListener: function () {}
    },
    localStorage: {
      getItem: function (к) { return память.has(к) ? память.get(к) : null; },
      setItem: function (к, з) { память.set(к, String(з)); }
    },
    performance: { now: function () { return часы; } },
    crypto: { getRandomValues: function (м) { м[0] = 12345; return м; } },
    setInterval: function (дело) { тикер = дело; return 1; },
    setTimeout: setTimeout, clearTimeout: clearTimeout, Promise: Promise,
    scrollTo: function () {}, addEventListener: function () {},
    location: { href: 'sudoku.html', origin: 'http://127.0.0.1' },
    fetch: function () { вызовы.fetch += 1; return Promise.reject(new Error('сети нет')); }
  };
  окно.window = окно;
  окно.globalThis = окно;
  if (настройки.дверь === 'шпион') {
    окно.ОчкиРейтинга = {
      взятьБилетСчёта: function (игра, режим) { вызовы.взять.push([игра, режим]); return { номер: вызовы.взять.length }; },
      сдатьСчёт: function (ручка, значение) { вызовы.сдать.push([ручка, значение]); return Promise.resolve({ ок: false }); }
    };
  }
  const песочница = vm.createContext(окно);
  vm.runInContext(КОД_ПРАВИЛ, песочница, { filename: 'sudoku-rules.js' });
  vm.runInContext(КОД_ЗАДАЧ, песочница, { filename: 'sudoku-puzzles.js' });
  if (настройки.дверь === 'настоящая') vm.runInContext(КОД_ОЧКОВ, песочница, { filename: 'очки-рейтинга.js' });
  vm.runInContext(КОД_UI, песочница, { filename: path.basename(ПУТЬ_UI) });

  return {
    вызовы: вызовы, ошибки: ошибки, взять: взять, кнопкиУровней: кнопкиУровней,
    партия: function () { return JSON.parse(память.get('sudoku-game-v1') || 'null'); },
    /** Сдвинуть часы страницы и дать тикнуть таймеру судоку. */
    идти: function (секунд) { часы += секунд * 1000; if (тикер) тикер(); },
    /** Заполнить все пустые клетки правильными цифрами — честное решение. */
    решить: function () {
      const п = JSON.parse(память.get('sudoku-game-v1'));
      п.board.forEach(function (цифра, i) {
        if (цифра) return;
        взять('board').children[i].onclick();
        взять('keypad').children[п.solution[i] - 1].onclick();
      });
    }
  };
}

function безПадения(дело, что) {
  try { дело(); проверить(true, что); } catch (сбой) { проверить(false, что + ' — упало: ' + сбой.message); }
}

/* ---------- 1. Старт новой головоломки берёт билет ---------- */
const режимДляПроверки = УРОВНИ_РАЗМЕТКИ.filter(function (у) { return у !== 'easy'; })[0] || УРОВНИ_РАЗМЕТКИ[0];
const стр = поднять({ дверь: 'шпион' });
проверить(стр.вызовы.взять.length === 0, 'в лобби (до старта) билет не берётся');
const кнопкаУровня = стр.кнопкиУровней.filter(function (к) { return к.dataset.level === режимДляПроверки; })[0];
проверить(!!кнопкаУровня && typeof кнопкаУровня.onclick === 'function', 'у кнопки уровня есть обработчик');
if (кнопкаУровня && кнопкаУровня.onclick) кнопкаУровня.onclick();
безПадения(function () { стр.взять('play').onclick(); }, 'кнопка «Начать игру» срабатывает');
проверить(стр.вызовы.взять.length === 1, 'старт зовёт взятьБилетСчёта ровно один раз (было ' + стр.вызовы.взять.length + ')');
const [игра, режим] = стр.вызовы.взять[0] || [];
проверить(игра === КЛЮЧ_ИГРЫ && игра !== '', 'ключ игры в билете — как в реестре («' + игра + '» / «' + КЛЮЧ_ИГРЫ + '»)');
проверить(режим === режимДляПроверки, 'режим в билете — выбранный уровень («' + режим + '»)');
проверить(РЕЖИМЫ.indexOf(режим) !== -1, 'режим «' + режим + '» есть в счёт.режимы реестра');

/* Выход в лобби и «Продолжить» — та же партия, второго билета нет. */
безПадения(function () { стр.взять('back').onclick({ preventDefault: function () {} }); }, 'выход в лобби не падает');
безПадения(function () { стр.взять('continue').onclick(); }, '«Продолжить» не падает');
проверить(стр.вызовы.взять.length === 1, '«Продолжить» ту же партию второй билет не берёт');

/* ---------- 2. Честное решение сдаёт время один раз ---------- */
стр.идти(2.5);
стр.идти(2.5);
стр.идти(1.7);
const секундВИгре = стр.партия().seconds;
проверить(секундВИгре > 6 && !Number.isInteger(секундВИгре), 'таймер набежал дробное время (' + секундВИгре + ')');
проверить(стр.вызовы.сдать.length === 0, 'до решения сдачи нет');
безПадения(function () { стр.решить(); }, 'решение головоломки не падает');
проверить(стр.партия().completed === true, 'партия решена');
проверить(стр.вызовы.сдать.length === 1, 'решение зовёт сдатьСчёт ровно один раз (было ' + стр.вызовы.сдать.length + ')');
const [ручка, значение] = стр.вызовы.сдать[0] || [];
проверить(ручка && ручка.номер === 1, 'сдаётся ручка того самого билета');
проверить(значение && Object.keys(значение).join() === 'секунд', 'сдаётся ровно { секунд }');
проверить(значение && Number.isInteger(значение.секунд), 'секунды — целое число');
проверить(значение && значение.секунд === Math.floor(секундВИгре), 'секунды — время решения, округлённое вниз (' + (значение && значение.секунд) + ')');

/* Лишние нажатия после решения второй сдачи не дают. */
безПадения(function () { стр.взять('keypad').children[0].onclick(); стр.идти(1); }, 'нажатия после решения не падают');
проверить(стр.вызовы.сдать.length === 1, 'после решения повторной сдачи нет');

/* ---------- 3. Решение с подсказкой в рейтинг не идёт ---------- */
const Правила = (function () { const п = {}; vm.runInContext(КОД_ПРАВИЛ, vm.createContext(п)); return п.Sudoku; })();
const Задачи = (function () { const п = {}; vm.runInContext(КОД_ЗАДАЧ, vm.createContext(п)); return п.SudokuPuzzles; })();
const сПодсказкой = Правила.create('easy', Задачи, 27);
сПодсказкой.hints = 1;
const стр2 = поднять({ дверь: 'шпион', память: сПодсказкой });
безПадения(function () { стр2.взять('continue').onclick(); }, '«Продолжить» сохранённую партию не падает');
безПадения(function () { стр2.решить(); }, 'решение партии с подсказкой не падает');
проверить(стр2.партия().completed === true, 'партия с подсказкой решена');
проверить(стр2.вызовы.сдать.length === 0, 'решение с подсказкой не сдаётся в рейтинг');

/* ---------- 4. Без Telegram и без двери — как раньше ---------- */
const стр3 = поднять({ дверь: 'настоящая' });
безПадения(function () { стр3.взять('play').onclick(); стр3.идти(2); стр3.решить(); }, 'с настоящей дверью без Telegram партия проходит');
проверить(стр3.партия().completed === true, 'без Telegram партия решается');
проверить(стр3.вызовы.fetch === 0, 'без Telegram ни одного запроса в сеть');
проверить(стр3.ошибки.length === 0, 'без Telegram в консоли нет ошибок');
const стр4 = поднять({ дверь: 'нет' });
безПадения(function () { стр4.взять('play').onclick(); стр4.идти(2); стр4.решить(); }, 'без двери ОчкиРейтинга партия проходит');
проверить(стр4.партия().completed === true, 'без двери партия решается');

/* ---------- 5. Подключения в sudoku.html ---------- */
function место(файл) {
  const найдено = РАЗМЕТКА.indexOf('src="js/' + файл);
  проверить(найдено !== -1, 'sudoku.html подключает js/' + файл);
  return найдено;
}
const порядок = ['telegram.js', 'сеть.js', 'игры-реестр.js', 'очки-рейтинга.js', 'sudoku-ui.js'].map(место);
проверить(порядок.every(function (м, i) { return м !== -1 && (i === 0 || порядок[i - 1] < м); }),
  'порядок подключений: telegram → сеть → реестр → очки → sudoku-ui');

console.log('Итого проверок: ' + проверок + ', провалов: ' + провалов);
if (провалов) process.exitCode = 1;
