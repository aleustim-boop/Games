'use strict';
const assert = require('node:assert/strict'), П = require('../js/морской-бой-правила'), Б = require('../js/морской-бой-бот'), М = require('../js/морской-бой-память'), И = require('../server/игры/морской-бой');
for (const уровень of ['лёгкий', 'обычный', 'сложный']) for (let k = 0; k < 50; k++) {
  const s = { версия: 1, первый: k % 2, уровень, черновик: [], журнал: [] }, g = П.создать(s.первый);
  for (const кто of [1, 0]) { const флот = П.случайныйФлот(); П.готов(g, кто, флот); s.журнал.push({ тип: 'готов', кто, флот }); }
  for (let n = 0; g.фаза !== 'конец'; n++) {
    assert(n < 200); const кто = g.ход, publicMap = П.вид(g, кто).вашиВыстрелы, snapshot = [...publicMap];
    const cell = Б.выстрел(publicMap, уровень); assert.equal(publicMap[cell], 'неизвестно'); assert.deepEqual(publicMap, snapshot);
    П.стрелять(g, кто, cell); s.журнал.push({ тип: 'выстрел', кто, клетка: cell });
  }
  assert.deepEqual(М.восстановить(s), g); assert.equal(g.попадания[g.победитель], 20);
  const broken = structuredClone(s); broken.журнал.push(broken.журнал.at(-1)); assert.throws(() => М.восстановить(broken));
}
const p = И.раздать('а', { игроки: ['а', 'б'] });
assert.equal(И.сделатьХод(p, 'б', { действие: 'готов', флот: П.случайныйФлот() }).принято, true, 'Второй не ждёт первого при расстановке');
assert.equal(И.сделатьХод(p, 'а', { действие: 'выстрел', клетка: 1 }).принято, false);
const view = И.видДляИгрока(p, 'а').море; assert.deepEqual(view.своиКорабли, []); assert.equal(view.флотСоперника, null);
assert.equal(И.сделатьХод(p, 'а', { действие: 'готов', флот: П.случайныйФлот() }).принято, true);
const before = JSON.stringify(p); assert.equal(И.сделатьХод(p, 'б', { действие: 'выстрел', клетка: 1 }).принято, false); assert.equal(JSON.stringify(p), before);
while (!p.завершена) assert(И.ходЗаБота(p, И.чейХод(p), 'сложный'));
assert.equal(И.видДляИгрока(p, 'а').море.флотСоперника.length, 10);
const readyBot = И.раздать('а', { игроки: ['а', 'б'] });
assert.deepEqual(И.ходВнеОчереди.ктоСходит(readyBot, k => k === 'б' ? 'обычный' : null), { кто: 'б' });
assert(И.ходВнеОчереди.сходить(readyBot, 'б')); assert.equal(readyBot.игра.готовы[1], true);
console.log('150 полных партий, три бота, воспроизведение сохранений, неверные ходы, независимая готовность и приватность — OK');
