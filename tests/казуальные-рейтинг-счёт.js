'use strict';
/*
  Проверка Э4.7: казуальные игры со счётом (блоки, три в ряд, змейка) сдают
  лучший счёт в рейтинг через общее/js/очки-рейтинга.js.

  Что проверяем (node, vm, поддельные document/window — браузер не нужен):
    1. Игра со счётом, записанная в общее/js/игры-реестр.js: старт партии берёт
       билет «взятьБилетСчёта(ключ из реестра, режим)», конец партии сдаёт
       «сдатьСчёт(та же ручка, {счёт})» РОВНО один раз — даже когда конец
       партии зовётся дважды (у игр с анимацией end() идёт два раза).
    2. Выход из партии в лобби с ненулевым счётом — сдача; «Продолжить» —
       новый билет.
    3. Игра с record:'time', игра без записи в реестре, режим не из реестра
       (сюжетный уровень трёх в ряд) — ни билета, ни сдачи.
    4. Нет window.ОчкиРейтинга — партия идёт, ничего не падает.
    5. blocks.html, match3.html, snake.html подключают telegram → сеть →
       игры-реестр → очки-рейтинга и всё это раньше casual-ui.js.

  Запуск:  node tests/казуальные-рейтинг-счёт.js
  Ломающий запуск — на КОПИЯХ во временной папке, пути доводами:
    node tests/казуальные-рейтинг-счёт.js --ui=<копия casual-ui.js> --страницы=<папка с копиями html>
  Итог — строка «Итого проверок: N, провалов: M»; код выхода 0 — всё зелено, 1 — есть провал.
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const КОРЕНЬ = path.join(__dirname, '..');
const доводы = {};
for (const д of process.argv.slice(2)) {
  const м = /^--([^=]+)=(.*)$/.exec(д);
  if (м) доводы[м[1]] = м[2];
}
const ПУТЬ_UI = доводы.ui || path.join(КОРЕНЬ, 'общее', 'casual', 'casual-ui.js');
const ПАПКА_СТРАНИЦ = доводы['страницы'] || КОРЕНЬ;
const КОД_UI = fs.readFileSync(ПУТЬ_UI, 'utf8');
const КОД_РЕЕСТРА = fs.readFileSync(path.join(КОРЕНЬ, 'общее', 'js', 'игры-реестр.js'), 'utf8');

let зелёных = 0;
let красных = 0;
function проверить(условие, что) {
  if (условие) { зелёных++; console.log('  зелено: ' + что); }
  else { красных++; console.log('  КРАСНО: ' + что); }
}

/** Поддельный узел: ровно то, что трогает casual-ui.js. */
function узел(id) {
  const н = {
    id, textContent: '', innerHTML: '', hidden: false, disabled: false, inert: false, open: false,
    dataset: {}, onclick: null, атрибуты: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(к, з) { this.атрибуты[к] = з; }, removeAttribute(к) { delete this.атрибуты[к]; },
    replaceChildren() {}, append() {}, animate() { return { finished: Promise.resolve() }; },
    querySelectorAll() { return []; }, getBoundingClientRect() { return { x: 0, y: 0, width: 0, height: 0 }; },
    showModal() { this.open = true; }, close() { this.open = false; }, click() { if (this.onclick) this.onclick({ preventDefault() {} }); }
  };
  return н;
}

/**
 * Поднять casual-ui.js с поддельной игрой. Возвращает журнал вызовов
 * двери рейтинга и ручки управления: нажать кнопку по id, нажать клавишу.
 */
function поднять(игра, { сДверью = true } = {}) {
  const узлы = {};
  const слушатели = {};
  const журнал = { взять: [], сдать: [], ручек: 0 };
  const document = {
    hidden: false,
    getElementById(id) { return узлы[id] || (узлы[id] = узел(id)); },
    querySelectorAll() { return []; },
    querySelector() { return узел('?'); },
    createElement(тег) { return узел(тег); },
    addEventListener(имя, fn) { (слушатели[имя] = слушатели[имя] || []).push(fn); }
  };
  const память = {};
  const window = {
    document,
    scrollTo() {},
    addEventListener() {},
    location: { href: '' },
    CasualGame: игра,
    CasualCore: { clone: x => JSON.parse(JSON.stringify(x)) }
  };
  if (сДверью) {
    window.ОчкиРейтинга = {
      взятьБилетСчёта(ключ, режим) {
        журнал.ручек++;
        const ручка = { номер: журнал.ручек };
        журнал.взять.push({ ключ, режим, ручка });
        return ручка;
      },
      сдатьСчёт(ручка, значение) {
        журнал.сдать.push({ ручка, значение });
        return Promise.resolve({ ок: false });
      }
    };
  }
  const контекст = vm.createContext({
    window, document, console,
    localStorage: {
      getItem: к => (к in память ? память[к] : null),
      setItem: (к, з) => { память[к] = String(з); }
    },
    performance: { now: () => Date.now() },
    matchMedia: () => ({ matches: !игра.animate }),
    crypto: { getRandomValues: м => { м[0] = 7; return м; } },
    setInterval: () => 0,
    setTimeout: () => 0,
    Promise, JSON, Math, Number, String, Array, Object, Map, Uint32Array
  });
  // Реестр грузится тем же файлом, что и на странице: ключи и режимы — оттуда.
  vm.runInContext(КОД_РЕЕСТРА, контекст, { filename: 'игры-реестр.js' });
  vm.runInContext(КОД_UI, контекст, { filename: 'casual-ui.js' });
  return {
    журнал,
    нажать(id) { document.getElementById(id).click(); },
    клавиша(key) { for (const fn of слушатели.keydown || []) fn({ key, preventDefault() {} }); },
    окноОткрыто() { return document.getElementById('dialog').open; },
    закрытьОкно() { document.getElementById('dialog').open = false; }
  };
}

/** Поддельная игра: «e» — +10 очков, «d» — проигрыш. */
function играСоСчётом(id, record, режимы, лишнее = {}) {
  return Object.assign({
    id, record, title: 'Проверка',
    modes: режимы.map(м => ({ id: м, label: м })),
    help: [],
    create(mode) { return { mode, score: 0, moves: 0, seconds: 0, aids: 0, won: false, lost: false }; },
    validate: () => true,
    draw() {},
    handleKey(state, key) { return key === 'e' ? { type: 'eat' } : key === 'd' ? { type: 'die' } : null; },
    act(state, a) { if (a.type === 'eat') state.score += 10; if (a.type === 'die') state.lost = true; return true; }
  }, лишнее);
}

function дождаться() { return new Promise(r => setImmediate(r)); }

async function главная() {
  console.log('Проверяю ' + ПУТЬ_UI);

  console.log('1. Змейка: билет на старте, одна сдача на конце партии');
  {
    const с = поднять(играСоСчётом('snake', 'score', ['classic', 'calm']));
    с.нажать('play');
    проверить(с.журнал.взять.length === 1, 'старт взял ровно один билет (взято: ' + с.журнал.взять.length + ')');
    const билет = с.журнал.взять[0] || {};
    проверить(билет.ключ === 'змейка' && билет.режим === 'classic',
      'ключ и режим из реестра: ' + JSON.stringify([билет.ключ, билет.режим]));
    с.клавиша('e'); с.клавиша('e'); с.клавиша('e');
    проверить(с.журнал.сдать.length === 0, 'до конца партии сдачи нет');
    с.клавиша('d');
    проверить(с.журнал.сдать.length === 1, 'конец партии сдал счёт ровно один раз (сдач: ' + с.журнал.сдать.length + ')');
    const сдача = с.журнал.сдать[0] || {};
    проверить(сдача.значение && сдача.значение.счёт === 30, 'сдан итоговый счёт 30: ' + JSON.stringify(сдача.значение));
    проверить(сдача.ручка === билет.ручка, 'сдана та же ручка, что взята на старте');
  }

  console.log('2. Игра с анимацией: end() зовётся дважды, сдача всё равно одна');
  {
    const с = поднять(играСоСчётом('blocks', 'score', ['classic', 'relax'], { animate: () => Promise.resolve() }));
    с.нажать('play');
    с.клавиша('e');
    await дождаться(); await дождаться();
    с.клавиша('d');
    await дождаться(); await дождаться(); await дождаться();
    проверить(с.журнал.взять.length === 1 && с.журнал.взять[0].ключ === 'блоки', 'блоки: билет по ключу «блоки»');
    проверить(с.журнал.сдать.length === 1, 'двойной конец партии — одна сдача (сдач: ' + с.журнал.сдать.length + ')');
    проверить(с.окноОткрыто(), 'окно итога всё равно показано');
  }

  console.log('3. Выход в лобби с ненулевым счётом — сдача; «Продолжить» — новый билет');
  {
    const с = поднять(играСоСчётом('snake', 'score', ['classic']));
    с.нажать('play');
    с.клавиша('e'); с.клавиша('e');
    с.нажать('collection');
    проверить(с.журнал.сдать.length === 1 && с.журнал.сдать[0].значение && с.журнал.сдать[0].значение.счёт === 20, 'выход в лобби сдал 20 очков');
    с.нажать('continue');
    проверить(с.журнал.взять.length === 2, 'продолжение партии взяло новый билет');
    с.нажать('collection');
    с.нажать('continue');
    с.клавиша('d');
    проверить(с.журнал.сдать.length === 3 && с.журнал.взять.length === 3 && с.журнал.сдать[2].ручка === с.журнал.взять[2].ручка,
      'каждая ручка сдана один раз, последняя — на конце партии');
  }

  console.log('4. Выход в лобби с нулём — сдачи нет');
  {
    const с = поднять(играСоСчётом('snake', 'score', ['classic']));
    с.нажать('play');
    с.нажать('collection');
    проверить(с.журнал.взять.length === 1 && с.журнал.сдать.length === 0, 'пустая партия не сдаётся');
  }

  console.log('5. record:\'time\', игра без записи, режим не из реестра — ничего');
  {
    const время = поднять(играСоСчётом('klondike', 'time', ['classic']));
    время.нажать('play'); время.клавиша('e'); время.клавиша('d');
    проверить(время.журнал.взять.length === 0 && время.журнал.сдать.length === 0, 'игра со временем не трогает рейтинг');
    const чужая = поднять(играСоСчётом('unknown', 'score', ['classic']));
    чужая.нажать('play'); чужая.клавиша('e'); чужая.клавиша('d');
    проверить(чужая.журнал.взять.length === 0 && чужая.журнал.сдать.length === 0, 'игры нет в реестре — тихо ничего');
    const сюжет = поднять(играСоСчётом('match3', 'score', ['level-1', 'classic']));
    сюжет.нажать('play'); сюжет.клавиша('e'); сюжет.клавиша('d');
    проверить(сюжет.журнал.взять.length === 0 && сюжет.журнал.сдать.length === 0, 'сюжетный уровень трёх в ряд не рейтинговый');
  }

  console.log('6. Нет двери рейтинга на странице — партия идёт без ошибок');
  {
    let сбой = null;
    try {
      const с = поднять(играСоСчётом('snake', 'score', ['classic']), { сДверью: false });
      с.нажать('play'); с.клавиша('e'); с.клавиша('d');
      проверить(с.окноОткрыто(), 'партия дошла до окна итога');
    } catch (е) { сбой = е; }
    проверить(!сбой, 'без window.ОчкиРейтинга ничего не упало' + (сбой ? ': ' + сбой.message : ''));
  }

  console.log('7. Страницы подключают сеть, реестр и дверь очков до casual-ui.js');
  const НУЖНО = ['общее/js/telegram.js', 'общее/js/сеть.js', 'общее/js/игры-реестр.js', 'общее/js/очки-рейтинга.js', 'общее/casual/casual-ui.js'];
  for (const файл of ['blocks.html', 'match3.html', 'snake.html']) {
    const путь = path.join(ПАПКА_СТРАНИЦ, файл);
    const текст = fs.existsSync(путь) ? fs.readFileSync(путь, 'utf8') : '';
    проверить(текст.length > 0, файл + ' найден и не пуст');
    const скрипты = [...текст.matchAll(/<script[^>]*\bsrc="([^"?]+)/g)].map(м => м[1]);
    проверить(скрипты.length > 0, файл + ': найдено подключений ' + скрипты.length);
    const места = НУЖНО.map(н => скрипты.indexOf(н));
    проверить(места.every(м => м !== -1), файл + ': есть все пять подключений ' + JSON.stringify(места));
    проверить(места.every((м, i) => i === 0 || м > места[i - 1]), файл + ': порядок telegram → сеть → реестр → очки → casual-ui');
  }

  console.log('\nИтого проверок: ' + (зелёных + красных) + ', провалов: ' + красных);
  process.exit(красных === 0 && зелёных > 0 ? 0 : 1);
}

главная().catch(е => { console.log('КРАСНО: проверка упала: ' + (е && е.stack || е)); process.exit(1); });
