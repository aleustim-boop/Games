'use strict';
/* Проверка этапа Э4.6: 2048 сдаёт лучший счёт в рейтинг (js/очки-рейтинга.js).
   Запуск: node tests/2048-рейтинг-счёт.js [путь-к-2048-ui.js] [путь-к-2048.html]
   Без доводов проверяет файлы проекта. С доводом --ломать сама делает копии во
   временной папке (без сдачи счёта и без подключений), гоняет себя на них и
   требует провала: проверка, которая не краснеет, ничего не проверяет.

   Браузер не нужен: js/2048-ui.js выполняется в node (vm) на поддельной
   странице — ровно столько узлов и методов, сколько трогает сам файл. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const доводы = process.argv.slice(2);

if (доводы[0] === '--ломать') {
  ломающийЗапуск();
  process.exit(0);
}

const ПУТЬ_UI = доводы[0] || path.join(КОРЕНЬ, 'js', '2048-ui.js');
const ПУТЬ_HTML = доводы[1] || path.join(КОРЕНЬ, '2048.html');

let пройдено = 0;
const провалы = [];
function проверить(условие, что) {
  if (условие) пройдено++;
  else провалы.push(что);
}

/* ---------- поддельная страница ---------- */

function новыйУзел(id) {
  const слушатели = {};
  const узел = {
    id: id || '', textContent: '', hidden: false, open: false, disabled: false, className: '',
    dataset: {}, children: [], style: { setProperty() {} },
    firstChild: { textContent: '' },
    classList: {
      набор: new Set(),
      add(к) { this.набор.add(к); }, remove(к) { this.набор.delete(к); },
      toggle(к, быть) { const нужно = быть === undefined ? !this.набор.has(к) : !!быть; if (нужно) this.набор.add(к); else this.набор.delete(к); return нужно; },
      contains(к) { return this.набор.has(к); }
    },
    setAttribute() {}, getAttribute() { return null; },
    append(...у) { this.children.push(...у); }, prepend(...у) { this.children.unshift(...у); },
    replaceChildren(...у) { this.children = у; },
    querySelector() { return новыйУзел(); },
    querySelectorAll() { return []; },
    focus() {}, remove() {}, replaceWith() {}, closest() { return null; },
    setPointerCapture() {},
    animate() { return { finished: Promise.resolve() }; },
    getBoundingClientRect() { return { x: 0, y: 0, left: 0, top: 0, width: 100, height: 100 }; },
    addEventListener(имя, дело) { (слушатели[имя] = слушатели[имя] || []).push(дело); },
    showModal() { this.open = true; },
    close() { this.open = false; (слушатели.close || []).forEach(д => д()); }
  };
  return узел;
}

function новаяСтраница(настройки) {
  const узлы = {};
  const кнопкиРежима = ['classic', 'falling'].map(р => { const у = новыйУзел(); у.dataset.mode = р; return у; });
  const слушателиДокумента = {};
  const хранилище = new Map(Object.entries(настройки.память || {}));
  const вызовы = { билеты: [], сдачи: [], запросы: 0 };
  const окно = {
    console, JSON, Math, Number, String, Object, Array, Set, Map, Promise, Uint32Array, Error,
    crypto: require('crypto').webcrypto,
    performance: { now: () => Date.now() },
    setTimeout: (д) => { д(); return 0; },   // эффекты выключены, таймеры не нужны
    clearTimeout() {}, setInterval() { return 0; },
    AbortController,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: {
      getItem: к => (хранилище.has(к) ? хранилище.get(к) : null),
      setItem: (к, з) => хранилище.set(к, String(з))
    },
    location: { href: '2048.html', pathname: '/2048.html', search: '', hash: '' },
    scrollTo() {},
    addEventListener() {},
    fetch() { вызовы.запросы++; return Promise.reject(new Error('сети нет')); },
    document: {
      hidden: false, readyState: 'complete',
      body: новыйУзел('body'),
      getElementById: id => (узлы[id] = узлы[id] || новыйУзел(id)),
      querySelector: () => новыйУзел(),
      querySelectorAll: с => (с === 'button[data-mode]' ? кнопкиРежима : []),
      createElement: () => новыйУзел(),
      addEventListener(имя, дело) { (слушателиДокумента[имя] = слушателиДокумента[имя] || []).push(дело); }
    }
  };
  окно.window = окно;
  окно.globalThis = окно;
  if (настройки.поддельныеОчки) {
    окно.ОчкиРейтинга = {
      взятьБилетСчёта(игра, режим) { const ручка = { игра, режим, номер: вызовы.билеты.length + 1 }; вызовы.билеты.push(ручка); return ручка; },
      сдатьСчёт(ручка, значение) { вызовы.сдачи.push({ ручка, значение }); return Promise.resolve({ ок: false }); }
    };
  }
  vm.createContext(окно);
  const загрузить = файл => vm.runInContext(fs.readFileSync(файл, 'utf8'), окно, { filename: файл });
  загрузить(path.join(КОРЕНЬ, 'js', '2048-rules.js'));
  загрузить(path.join(КОРЕНЬ, 'js', '2048-falling.js'));
  if (настройки.настоящиеОчки) загрузить(path.join(КОРЕНЬ, 'js', 'очки-рейтинга.js'));
  загрузить(ПУТЬ_UI);

  const клавиша = (key, code) => (слушателиДокумента.keydown || []).forEach(д => д({
    key, code: code || key, preventDefault() {}, target: { closest: () => null }
  }));
  const режимИгры = () => (кнопкиРежима[1].onclick ? кнопкиРежима : null);
  return {
    окно, узлы, вызовы, хранилище, клавиша,
    нажать: id => окно.document.getElementById(id).onclick({ preventDefault() {} }),
    выбратьРежим: р => { const к = режимИгры(); if (к) к.find(у => у.dataset.mode === р).onclick(); },
    сохранённыйСчёт: ключ => { const с = JSON.parse(хранилище.get(ключ) || 'null'); return с ? с.score : null; },
    диалогОткрыт: () => окно.document.getElementById('dialog').open
  };
}

/* Доиграть до конца: жмём стрелки по кругу, пока партия не кончится.
   Победу (2048) закрываем — игра сама продолжает партию. */
function доигратьДоКонца(с, стрелки, ключ) {
  for (let шаг = 0; шаг < 200000; шаг++) {
    const сохр = JSON.parse(с.хранилище.get(ключ) || 'null');
    if (сохр && сохр.over) return true;
    if (с.диалогОткрыт()) с.нажать('close-dialog');
    с.клавиша(стрелки[шаг % стрелки.length]);
  }
  return false;
}

const ЭФФЕКТЫ_ВЫКЛ = { 'game-2048-prefs': JSON.stringify({ effects: false, sound: false, haptic: false }) };

/* 1. Классика: билет на новой партии, одна сдача при конце, выход без повтора. */
(function () {
  const с = новаяСтраница({ поддельныеОчки: true, память: ЭФФЕКТЫ_ВЫКЛ });
  с.нажать('play');
  проверить(с.вызовы.билеты.length === 1, 'новая партия классики не взяла билет');
  проверить(с.вызовы.билеты[0] && с.вызовы.билеты[0].игра === '2048', 'билет взят не на игру «2048»');
  проверить(с.вызовы.билеты[0] && с.вызовы.билеты[0].режим === 'classic', 'билет классики взят не с режимом classic');
  проверить(с.вызовы.сдачи.length === 0, 'счёт сдан раньше конца партии');
  const дошли = доигратьДоКонца(с, ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'], 'game-2048-v1');
  проверить(дошли, 'классика не дошла до конца партии');
  const итог = с.сохранённыйСчёт('game-2048-v1');
  проверить(с.вызовы.сдачи.length === 1, 'конец классики: сдач ' + с.вызовы.сдачи.length + ', нужна ровно одна');
  const сдача = с.вызовы.сдачи[0];
  проверить(сдача && сдача.значение && сдача.значение.счёт === итог && итог > 0,
    'сдан не итоговый счёт: ' + JSON.stringify(сдача && сдача.значение) + ' при итоге ' + итог);
  проверить(сдача && сдача.ручка === с.вызовы.билеты[0], 'сдача ушла не по билету этой партии');
  с.нажать('back');   // закрыть окно итога
  с.нажать('back');   // выйти из партии в лобби
  проверить(с.вызовы.сдачи.length === 1, 'выход после конца партии сдал счёт второй раз');
  с.нажать('play');   // возврат к законченной партии — не новая партия
  проверить(с.вызовы.билеты.length === 1, 'возврат к той же партии взял лишний билет');
})();

/* 2. Выход из партии с ненулевым счётом — одна сдача, повторный выход — ничего. */
(function () {
  const с = новаяСтраница({ поддельныеОчки: true, память: ЭФФЕКТЫ_ВЫКЛ });
  с.нажать('play');
  for (let i = 0; i < 400 && !(с.сохранённыйСчёт('game-2048-v1') > 0); i++) с.клавиша(['ArrowLeft', 'ArrowDown'][i % 2]);
  const счёт = с.сохранённыйСчёт('game-2048-v1');
  проверить(счёт > 0, 'не удалось набрать счёт для проверки выхода');
  с.нажать('back');
  проверить(с.вызовы.сдачи.length === 1, 'выход с ненулевым счётом: сдач ' + с.вызовы.сдачи.length + ', нужна одна');
  проверить(с.вызовы.сдачи[0] && с.вызовы.сдачи[0].значение.счёт === счёт, 'при выходе сдан не текущий счёт');
  с.нажать('play');
  с.клавиша('ArrowRight');
  с.нажать('back');
  проверить(с.вызовы.сдачи.length === 1, 'повторный выход из той же партии сдал счёт второй раз');
})();

/* 3. Выход с нулевым счётом — сдачи нет. */
(function () {
  const с = новаяСтраница({ поддельныеОчки: true, память: ЭФФЕКТЫ_ВЫКЛ });
  с.нажать('play');
  с.нажать('back');
  проверить(с.вызовы.билеты.length === 1, 'партия с нулём не взяла билет');
  проверить(с.вызовы.сдачи.length === 0, 'выход с нулевым счётом сдал счёт');
})();

/* 4. Падающие числа: билет с режимом falling, одна сдача при конце. */
(function () {
  const с = новаяСтраница({ поддельныеОчки: true, память: ЭФФЕКТЫ_ВЫКЛ });
  с.выбратьРежим('falling');
  с.нажать('play');
  проверить(с.вызовы.билеты.length === 1 && с.вызовы.билеты[0].режим === 'falling', 'падающие числа: билет не с режимом falling');
  const дошли = доигратьДоКонца(с, ['ArrowUp'], 'game-2048-falling-v1');
  проверить(дошли, 'падающие числа не дошли до конца партии');
  const итог = с.сохранённыйСчёт('game-2048-falling-v1');
  проверить(с.вызовы.сдачи.length === 1 && с.вызовы.сдачи[0].значение.счёт === итог,
    'падающие числа: сдач ' + с.вызовы.сдачи.length + ', итог ' + итог);
})();

/* 5. Без Telegram и без сети: настоящая дверь очков, ничего не падает, запросов нет. */
(function () {
  let упало = null;
  let с = null;
  try {
    с = новаяСтраница({ настоящиеОчки: true, память: ЭФФЕКТЫ_ВЫКЛ });
    проверить(typeof с.окно.ОчкиРейтинга.взятьБилетСчёта === 'function', 'настоящая дверь очков не загрузилась');
    с.нажать('play');
    доигратьДоКонца(с, ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'], 'game-2048-v1');
    с.нажать('back');
    с.нажать('back');
  } catch (сбой) { упало = сбой; }
  проверить(!упало, 'без Telegram игра упала: ' + (упало && упало.message));
  проверить(с && с.вызовы.запросы === 0, 'без Telegram ушёл запрос в сеть');
})();

/* 6. Без двери очков вовсе (файл не загрузился) — игра идёт как раньше. */
(function () {
  let упало = null;
  try {
    const с = новаяСтраница({ память: ЭФФЕКТЫ_ВЫКЛ });
    с.нажать('play');
    с.клавиша('ArrowLeft');
    с.клавиша('ArrowDown');
    с.нажать('back');
  } catch (сбой) { упало = сбой; }
  проверить(!упало, 'без js/очки-рейтинга.js игра упала: ' + (упало && упало.message));
})();

/* 7. 2048.html: подключения есть и стоят в нужном порядке. Не нашли узел — провал. */
(function () {
  const html = fs.readFileSync(ПУТЬ_HTML, 'utf8');
  const нужные = ['js/telegram.js', 'js/сеть.js', 'js/игры-реестр.js', 'js/очки-рейтинга.js', 'js/2048-ui.js'];
  const места = нужные.map(ф => html.indexOf('<script src="' + ф + '?v='));
  нужные.forEach((ф, i) => проверить(места[i] !== -1, '2048.html не подключает ' + ф));
  for (let i = 1; i < места.length; i++) {
    проверить(места[i - 1] !== -1 && места[i] > места[i - 1], '2048.html: ' + нужные[i] + ' должен стоять после ' + нужные[i - 1]);
  }
})();

console.log('2048-рейтинг-счёт: пройдено ' + пройдено + ', провалов ' + провалы.length);
провалы.forEach(п => console.log('  ПРОВАЛ: ' + п));
process.exit(провалы.length ? 1 : 0);

/* ---------- ломающий запуск ---------- */

function заменить(текст, что, на, где) {
  if (!текст.includes(что)) throw new Error('ломающий запуск: не нашёл «' + что + '» в ' + где + ' — узел переименован, проверку надо обновить');
  return текст.split(что).join(на);
}

function прогнатьНаКопии(имя, ui, html) {
  try {
    execFileSync(process.execPath, [__filename, ui, html], { encoding: 'utf8', stdio: 'pipe' });
    console.log('ПОРЧА «' + имя + '»: проверка осталась зелёной — это провал');
    return false;
  } catch (сбой) {
    const строки = String(сбой.stdout || '').split('\n').filter(Boolean);
    console.log('ПОРЧА «' + имя + '»: покраснела как надо — ' + строки[0]);
    return true;
  }
}

function ломающийЗапуск() {
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), '2048-рейтинг-'));
  const родной = fs.readFileSync(path.join(КОРЕНЬ, 'js', '2048-ui.js'), 'utf8');
  const роднаяСтраница = fs.readFileSync(path.join(КОРЕНЬ, '2048.html'), 'utf8');
  const целыйUi = path.join(папка, 'целый-ui.js');
  const целаяСтраница = path.join(папка, 'целая.html');
  fs.writeFileSync(целыйUi, родной);
  fs.writeFileSync(целаяСтраница, роднаяСтраница);

  const порчи = [
    ['без сдачи при конце партии', заменить(родной, 'if(state.over)сдатьСчётПартии();', '', '2048-ui.js'), роднаяСтраница],
    ['без сдачи при выходе', заменить(родной, 'if(busy)finishMove();сдатьСчётПартии();', 'if(busy)finishMove();', '2048-ui.js'), роднаяСтраница],
    ['без билета на новой партии', заменить(родной, 'state=R.create(seed());взятьБилетСчёта();', 'state=R.create(seed());', '2048-ui.js'), роднаяСтраница],
    ['сдача без забора ручки (повторы)', заменить(родной, '  ручкиСчёта[mode]=null;', '  ', '2048-ui.js'), роднаяСтраница],
    ['без подключения сети', родной, заменить(роднаяСтраница, '<script src="js/сеть.js?v=', '<script src="js/нет.js?v=', '2048.html')],
    ['без подключения очков', родной, заменить(роднаяСтраница, '<script src="js/очки-рейтинга.js?v=', '<script src="js/нет.js?v=', '2048.html')]
  ];
  let всеКраснеют = true;
  порчи.forEach(([имя, ui, html], i) => {
    const путьUi = path.join(папка, 'порча-' + i + '-ui.js');
    const путьHtml = path.join(папка, 'порча-' + i + '.html');
    fs.writeFileSync(путьUi, ui);
    fs.writeFileSync(путьHtml, html);
    if (!прогнатьНаКопии(имя, путьUi, путьHtml)) всеКраснеют = false;
  });
  // Контроль: неиспорченные копии из той же папки проходят — краснеет именно порча.
  let целыеЗелёные = true;
  try { execFileSync(process.execPath, [__filename, целыйUi, целаяСтраница], { stdio: 'pipe' }); } catch { целыеЗелёные = false; }
  console.log('Целые копии: ' + (целыеЗелёные ? 'зелёные' : 'КРАСНЫЕ — порча ничего не доказывает'));
  console.log('Копии лежат в ' + папка);
  if (!всеКраснеют || !целыеЗелёные) process.exit(1);
}
