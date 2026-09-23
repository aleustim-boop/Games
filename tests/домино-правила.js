'use strict';
const assert = require('node:assert/strict');
const П = require('../js/домино-правила');
const Б = require('../js/домино-бот');
const М = require('../js/домино-память');
const id = (a, b) => П.КОСТИ.findIndex(k => k[0] === Math.min(a, b) && k[1] === Math.max(a, b));
function invariant(g) {
  const all = [...g.руки.flat(), ...g.базар, ...g.цепь.map(t => t.id)];
  assert.equal(all.length, 28); assert.equal(new Set(all).size, 28);
  for (let n = 1; n < g.цепь.length; n++) assert.equal(g.цепь[n - 1].b, g.цепь[n].a);
  for (const t of g.цепь) assert.deepEqual([t.a, t.b].sort(), [...П.КОСТИ[t.id]].sort());
}
function rejected(g, fn) { const before = JSON.stringify(g); assert.throws(fn); assert.equal(JSON.stringify(g), before); }
assert.equal(П.КОСТИ.length, 28);
for (const places of [2, 3, 4]) {
  const g = П.создать(places); invariant(g);
  assert.ok(g.руки.every(h => h.length === (places === 2 ? 7 : 5)));
  const doubles = g.руки.flat().filter(n => П.КОСТИ[n][0] === П.КОСТИ[n][1]);
  assert.equal(g.открывающая, Math.max(...doubles));
  rejected(g, () => П.пас(g, g.ход));
  rejected(g, () => П.взять(g, g.ход));
  rejected(g, () => П.положить(g, (g.ход + 1) % places, g.открывающая, 'начало'));
  rejected(g, () => П.положить(g, g.ход, 100, 'начало'));
  const v = П.вид(g, (g.ход + 1) % places);
  assert.equal(v.руки, null); assert.equal(typeof v.базар, 'number');
  assert.equal(v.рука.length, places === 2 ? 7 : 5);
  П.положить(g, g.ход, g.открывающая, 'начало'); invariant(g);
  rejected(g, () => П.положить(g, g.ход, g.руки[g.ход][0], 'мимо'));
}
// Без дублей обязательна тяжелейшая кость среди розданных.
{
  const noDoubles = П.КОСТИ.map((_, i) => i).filter(i => П.КОСТИ[i][0] !== П.КОСТИ[i][1]);
  const deck = [...noDoubles, ...П.КОСТИ.map((_, i) => i).filter(i => !noDoubles.includes(i))];
  const g = П.создать(2, 50, deck);
  const expected = g.руки.flat().sort((x, y) => П.сумма([y]) - П.сумма([x]) || П.КОСТИ[y][1] - П.КОСТИ[x][1])[0];
  assert.equal(g.открывающая, expected);
}
// Два конца, поворот, двойной ноль. Фикстура проверяет геометрию отдельно от раздачи.
{
  const g = П.создать(); g.цепь = [{ id: id(0, 2), a: 0, b: 2, кто: 1 }]; g.ход = 0;
  g.руки = [[id(0, 0), id(2, 5)], [id(0, 6), id(5, 6)]];
  П.положить(g, 0, id(0, 0), 'лево'); assert.equal(g.цепь[0].a, 0);
  П.положить(g, 1, id(0, 6), 'лево'); assert.deepEqual([g.цепь[0].a, g.цепь[0].b], [6, 0]);
  П.положить(g, 0, id(2, 5), 'право'); assert.equal(g.фаза, 'итог'); assert.equal(g.итог.прибавка[0], 11);
}
// Добор до первой подходящей без автопостановки; значения не попадают в событие.
{
  const g = П.создать(); g.ход = 0; g.цепь = [{ id: id(6, 6), a: 6, b: 6, кто: 1 }];
  g.руки = [[id(1, 1)], [id(2, 2)]]; g.базар = [id(0, 0), id(0, 6), id(3, 3)];
  П.взять(g, 0); assert.equal(g.руки[0].length, 3); assert.equal(g.базар.length, 1);
  assert.equal(g.ход, 0); assert.equal(g.цепь.length, 1);
  assert.deepEqual(П.вид(g, 1).последнее, { тип: 'базар', кто: 0, сколько: 2 });
  rejected(g, () => П.взять(g, 0));
}
for (const tie of [false, true]) {
  const g = П.создать(); g.ход = 0; g.цепь = [{ id: id(6, 6), a: 6, b: 6, кто: 0 }];
  g.руки = [[id(0, 2)], [tie ? id(1, 1) : id(3, 3)]]; g.базар = [];
  П.пас(g, 0); assert.equal(g.фаза, 'игра'); П.пас(g, 1);
  assert.equal(g.итог.причина, 'рыба'); assert.equal(g.итог.победитель, tie ? -1 : 0);
  assert.deepEqual(g.итог.прибавка, tie ? [0, 0] : [4, 0]);
  rejected(g, () => П.следующий(g, [1, 1]));
  П.следующий(g); assert.equal(g.раунд, 2); invariant(g);
}
let games = 0, rounds = 0, moves = 0;
for (const places of [2, 3, 4]) for (const level of ['лёгкий', 'обычный', 'сложный']) for (let n = 0; n < 20; n++) {
  const deck = П.колода(), g = П.создать(places, 50, deck);
  const save = { версия: 1, мест: places, цель: 50, уровень: level, колода: deck, журнал: [] };
  let guard = 0;
  while (g.фаза !== 'конец') {
    assert.ok(guard++ < 15000, 'Партия зависла'); invariant(g);
    if (g.фаза === 'итог') {
      rounds++; const d = П.колода(); П.следующий(g, d); save.журнал.push({ действие: 'раунд', колода: d }); continue;
    }
    const who = g.ход, v = П.вид(g, who), move = Б.ход(v, level);
    assert.ok(move); П.действие(g, who, move); moves++;
    save.журнал.push({ ...move, кто: who });
    if (guard % 25 === 0) assert.deepEqual(М.восстановить(save), g);
  }
  invariant(g); assert.deepEqual(М.восстановить(save), g);
  assert.equal(g.победители.length, 1); assert.ok(g.счёт[g.победители[0]] >= 50); games++;
  rejected(g, () => П.действие(g, 0, { действие: 'пас' }));
}
assert.throws(() => М.восстановить({ версия: 1, уровень: 'обычный', журнал: [], мест: 2, цель: 100, колода: [1] }));
console.log(`Домино: ${games} полных матчей, ${rounds} промежуточных раундов, ${moves} ходов; сохранность, стыки, добор, рыба, приватность и восстановление проверены.`);
