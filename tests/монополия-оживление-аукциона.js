'use strict';

/* =====================================================================
   ОЖИВЛЕНИЕ АУКЦИОНА, ЗАВИСШЕГО В СОХРАНЁННОЙ ПАРТИИ.

   Партия из памяти браузера, записанная старым кодом, могла застрять
   посреди аукциона за здание: ход (g.auction.actor) у выбывшего игрока,
   живые видят «действует другой». Правила теперь оживляют такую партию
   (reviveAuction) при assert() (его зовут при загрузке) и в начале action().

   Проверяем (только node, чистые правила):
     А) actor выбыл, живые претенденты есть — ход у живого, выбывшего
        нет в участниках, торги идут дальше
     Б) то же, но оживление приходит через action() живого игрока
     В) все претенденты выбыли — аукцион снят, событие auctionEmpty
     Г) аукцион с живым actor и обычная партия без аукциона не меняются
     Д–Ж) выбыл спасовавший / лидер / все участники аукциона за участок
     З–К) торги за здание по решению владельца 30.09 09:32 «снимать
        только ставку сдавшегося»: выбыл лидер — лидер лучшая живая
        ставка; ход был у нового лидера — торги кончаются; выбыл
        спасовавший со ставкой — снимается только его ставка

   Запуск:
       node tests/монополия-оживление-аукциона.js
   Ломающий запуск (обязан покраснеть; работаем с КОПИЕЙ правил, где
   reviveAuction ничего не делает — настоящий файл не трогаем):
       node tests/монополия-оживление-аукциона.js --сломать <путь-к-копии>
   ===================================================================== */

const path = require('node:path');

const КОРЕНЬ = path.join(__dirname, '..');
const индексЛомки = process.argv.indexOf('--сломать');
const ПУТЬ_КОПИИ = индексЛомки >= 0 ? process.argv[индексЛомки + 1] : null;
if (индексЛомки >= 0 && !ПУТЬ_КОПИИ) {
  console.log('ПЛОХО — после --сломать нужен путь к копии правил');
  process.exit(1);
}
const ПУТЬ_ПРАВИЛ = ПУТЬ_КОПИИ || path.join(КОРЕНЬ, 'js', 'монополия-правила.js');
const P = require(ПУТЬ_ПРАВИЛ);

let проверок = 0;
let провалов = 0;
function отметить(условие, текст) {
  проверок++;
  if (условие) console.log('ок — ' + текст);
  else {
    провалов++;
    console.log('ПЛОХО — ' + текст);
  }
  return условие;
}

const own = (g, p, ids, level = 0) =>
  ids.forEach((id) => Object.assign(g.properties[id], { owner: p, level }));

/* Стол как в tests/монополия-сдача-в-аукционе-за-здание.js: у игроков
   0, 1, 2 по целому кварталу, в банке один дом; 3 и 4 — посторонние. */
function стол(seed) {
  const g = P.create(5, seed);
  g.turn = 3;
  g.phase = 'manage';
  g.queue = [];
  own(g, 0, [16, 18, 19]);
  own(g, 1, [6, 8, 9]);
  own(g, 2, [11, 13, 14]);
  [21, 23, 24, 26, 27, 29, 37].forEach((id) => {
    g.properties[id].level = 4;
  });
  g.properties[39].level = 3;
  return g;
}
function аукцион(seed) {
  const g = стол(seed);
  P.action(g, 0, { type: 'build', id: 16 });
  return g;
}

console.log(
  'Проверка: оживление зависшего аукциона (файл правил: ' + ПУТЬ_ПРАВИЛ +
    (ПУТЬ_КОПИИ ? ', это ломающая копия' : ', это файл проекта') + ')\n',
);

console.log('--- А: actor выбыл, живые претенденты есть (через assert) ---');
try {
  const g = аукцион(201);
  отметить(g.phase === 'auction' && g.auction.building && g.auction.actor === 0, 'А: исходный аукцион идёт, ход у 0');
  g.players[0].out = true; // старый код оставил выбывшего у руля
  P.assert(g);
  отметить(g.phase === 'auction' && g.auction, 'А: аукцион не снят — есть кому торговаться');
  отметить(g.auction && !g.players[g.auction.actor].out, 'А: ход у живого игрока');
  отметить(g.auction && g.auction.actor === 1 && P.who(g) === 1, 'А: ход у следующего живого — игрока 1');
  отметить(g.auction && !g.auction.eligible.includes(0), 'А: выбывшего нет среди участников');
  P.action(g, 1, { type: 'bid', amount: 50, id: 6 });
  отметить(g.auction && g.auction.high === 1 && g.auction.actor === 2, 'А: торги идут дальше — ставка принята, ход у 2');
} catch (e) {
  отметить(false, 'А: упало: ' + e.message);
}

console.log('\n--- Б: оживление через action() живого игрока ---');
try {
  const g = аукцион(202);
  g.players[0].out = true;
  P.action(g, 1, { type: 'bid', amount: 50, id: 6 });
  отметить(g.auction && g.auction.high === 1, 'Б: ставка живого принята без «действует другой»');
} catch (e) {
  отметить(false, 'Б: упало: ' + e.message);
}

console.log('\n--- В: все претенденты выбыли ---');
try {
  const g = аукцион(203);
  for (const i of [0, 1, 2]) g.players[i].out = true;
  P.assert(g);
  отметить(g.auction === null, 'В: аукцион снят');
  отметить(g.phase !== 'auction', 'В: партия вышла из фазы аукциона (' + g.phase + ')');
  отметить(g.events.some((e) => e.kind === 'auctionEmpty'), 'В: событие auctionEmpty есть');
  отметить(g.queue.every((q) => !(q.kind === 'auction' && q.building)), 'В: задания аукциона за здание в очереди нет');
} catch (e) {
  отметить(false, 'В: упало: ' + e.message);
}

console.log('\n--- Г: здоровое не меняется ---');
try {
  const g = аукцион(204);
  const до = JSON.stringify(g);
  P.assert(g);
  отметить(JSON.stringify(g) === до, 'Г: аукцион с живым actor после assert не изменился');
  const h = стол(205);
  const доН = JSON.stringify(h);
  P.assert(h);
  отметить(JSON.stringify(h) === доН, 'Г: обычная партия без аукциона не изменилась');
  const n = P.create(4, 206);
  const доС = JSON.stringify(n);
  P.assert(n);
  отметить(JSON.stringify(n) === доС, 'Г: свежая партия не изменилась');
} catch (e) {
  отметить(false, 'Г: упало: ' + e.message);
}

console.log('\n--- Д: actor жив, в участниках выбывший ---');
try {
  const g = аукцион(207);
  P.action(g, 0, { type: 'pass' });
  P.action(g, 1, { type: 'bid', amount: 50, id: 6 });
  отметить(g.auction.actor === 2 && g.auction.high === 1, 'Д: исходно ход у 2, лидер 1');
  const ставки = JSON.stringify(g.auction.bids);
  g.players[0].out = true; // выбыл тот, кто уже спасовал
  P.assert(g);
  отметить(g.auction && !g.auction.eligible.includes(0), 'Д: выбывший убран из участников');
  отметить(g.auction && g.auction.actor === 2, 'Д: ход не передан — остался у живого 2');
  отметить(g.auction && g.auction.high === 1 && JSON.stringify(g.auction.bids) === ставки, 'Д: лидер и ставки живых не тронуты');
} catch (e) {
  отметить(false, 'Д: упало: ' + e.message);
}

console.log('\n--- Е: лидер ставки выбыл ---');
try {
  // Аукцион за участок, собранный руками: лидер 2 ставит 100, ход у 3
  const g = P.create(5, 208);
  g.phase = 'auction';
  g.queue = [{ kind: 'auction', id: 1, from: 4 }];
  g.auction = { id: 1, building: false, eligible: [0, 1, 2, 3], passed: [], high: 2, bid: 100, actor: 3 };
  g.players[2].out = true;
  P.assert(g);
  отметить(g.auction && g.auction.high === -1 && g.auction.bid === 0, 'Е: у участка выбывший лидер сброшен');
  отметить(g.auction && !g.auction.eligible.includes(2), 'Е: выбывший убран из участников');
  for (const p of [3, 0, 1]) P.action(g, P.who(g), { type: 'pass' });
  отметить(g.properties[1].owner === -1, 'Е: участок не ушёл выбывшему — остался в банке');
  отметить(g.phase !== 'auction', 'Е: торги закончились');

  // Аукцион за здание: лидер 1 выбыл, здание не должно ему достаться
  const h = аукцион(209);
  P.action(h, 0, { type: 'pass' });
  P.action(h, 1, { type: 'bid', amount: 50, id: 6 });
  const деньги = h.players[1].money;
  h.players[1].out = true;
  P.assert(h);
  P.action(h, 2, { type: 'pass' });
  отметить(h.auction === null && h.properties[6].level === 0, 'Е: здание выбывшему лидеру не выдано');
  отметить(h.players[1].money === деньги, 'Е: ставка выбывшего не списана');
  отметить(h.events.some((e) => e.kind === 'auctionEmpty'), 'Е: торги кончились событием auctionEmpty');
} catch (e) {
  отметить(false, 'Е: упало: ' + e.message);
}

console.log('\n--- Ж: текст при аукционе за участок без претендентов ---');
try {
  const g = P.create(5, 210);
  g.phase = 'auction';
  g.queue = [{ kind: 'auction', id: 1, from: 3 }];
  g.auction = { id: 1, building: false, eligible: [0, 1], passed: [], high: -1, bid: 0, actor: 0 };
  g.players[0].out = true;
  g.players[1].out = true;
  P.assert(g);
  const событие = g.events.filter((e) => e.kind === 'auctionEmpty').pop();
  отметить(g.auction === null, 'Ж: аукцион снят');
  отметить(событие && событие.text === 'Участок остался в банке', 'Ж: текст события — «Участок остался в банке»');
  отметить(!g.events.some((e) => e.text === 'Здание осталось в банке'), 'Ж: слова «Здание» для участка нет');
} catch (e) {
  отметить(false, 'Ж: упало: ' + e.message);
}

/* Решение владельца 30.09 09:32 «снимать только ставку сдавшегося»: у
   выбывшего снимаются ставка и место, ставки и очередь живых остаются,
   лидером становится лучшая живая ставка. Здесь — путь «флаг out»
   (партия из памяти), настоящая сдача — tests/монополия-сдача-в-торгах.js. */
console.log('\n--- З: выбыл лидер, лидером становится лучшая живая ставка ---');
try {
  const g = аукцион(211);
  P.action(g, 0, { type: 'bid', amount: 30, id: 16 });
  P.action(g, 1, { type: 'bid', amount: 50, id: 6 });
  P.action(g, 2, { type: 'bid', amount: 100, id: 11 });
  отметить(g.auction.high === 2 && g.auction.actor === 0, 'З: исходно лидер 2 (100), ход у 0');
  g.players[2].out = true;
  P.assert(g);
  const a = g.auction;
  отметить(a && a.building && g.phase === 'auction', 'З: торги за здание идут дальше');
  отметить(a && a.high === 1 && a.bid === 50, 'З: лидер — 1 со своей ставкой 50 (' + (a && a.high) + ', ' + (a && a.bid) + ')');
  отметить(a && JSON.stringify(a.bids) === JSON.stringify({ 0: 30, 1: 50 }), 'З: ставка выбывшего снята, ставки живых целы (' + JSON.stringify(a && a.bids) + ')');
  отметить(a && a.targets[2] === undefined && a.targets[0] === 16 && a.targets[1] === 6, 'З: место выбывшего снято, места живых целы');
  отметить(a && a.actor === 0 && a.passed.length === 0, 'З: ход остался у 0, пасов не прибавилось');
  let отказ = null;
  try {
    P.action(g, 0, { type: 'bid', amount: 50, id: 16 });
  } catch (e) {
    отказ = e;
  }
  отметить(Boolean(отказ), 'З: ставка 50 не выше цены лидера — отказ');
  P.action(g, 0, { type: 'bid', amount: 51, id: 16 });
  отметить(g.auction && g.auction.high === 0 && g.auction.actor === 1, 'З: ставка 51 принята, ход у 1');
} catch (e) {
  отметить(false, 'З: упало: ' + e.message);
}

console.log('\n--- И: выбыл лидер, ход был у нового лидера — торги кончаются ---');
try {
  const g = аукцион(212);
  P.action(g, 0, { type: 'bid', amount: 30, id: 16 });
  P.action(g, 1, { type: 'bid', amount: 50, id: 6 });
  P.action(g, 2, { type: 'bid', amount: 100, id: 11 });
  P.action(g, 0, { type: 'pass' });
  отметить(g.auction.actor === 1 && g.auction.high === 2, 'И: исходно ход у 1, лидер 2');
  g.players[2].out = true;
  P.assert(g);
  отметить(g.auction === null && g.phase !== 'auction', 'И: торговаться больше некому — торги закрыты (' + g.phase + ')');
  отметить(g.events.some((e) => e.kind === 'auctionWin' && e.player === 1 && e.amount === 50 && e.id === 6), 'И: здание у 1 за его ставку 50');
  отметить(g.players[1].money === 1450 && g.players[0].money === 1500, 'И: списано только у победителя (' + g.players[1].money + ', ' + g.players[0].money + ')');
} catch (e) {
  отметить(false, 'И: упало: ' + e.message);
}

console.log('\n--- К: выбыл спасовавший со ставкой — торги не трогаются ---');
try {
  const g = аукцион(213);
  P.action(g, 0, { type: 'bid', amount: 30, id: 16 });
  P.action(g, 1, { type: 'bid', amount: 50, id: 6 });
  P.action(g, 2, { type: 'bid', amount: 60, id: 11 });
  P.action(g, 0, { type: 'pass' });
  отметить(g.auction.actor === 1 && g.auction.high === 2, 'К: исходно ход у 1, лидер 2, 0 спасовал со ставкой 30');
  g.players[0].out = true;
  P.assert(g);
  const a = g.auction;
  отметить(a && a.high === 2 && a.bid === 60 && a.actor === 1, 'К: лидер, цена и ход не изменились');
  отметить(a && JSON.stringify(a.bids) === JSON.stringify({ 1: 50, 2: 60 }), 'К: снята только ставка выбывшего (' + JSON.stringify(a && a.bids) + ')');
} catch (e) {
  отметить(false, 'К: упало: ' + e.message);
}

console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
if (проверок < 43) {
  console.log('ПЛОХО — проверок меньше ожидаемого, часть не дошла до конца');
  process.exit(1);
}
process.exit(провалов ? 1 : 0);
