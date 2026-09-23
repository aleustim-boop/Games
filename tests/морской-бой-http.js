'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), os = require('node:os');
process.env.ДАННЫЕ_ИГРЫ = path.join(os.tmpdir(), 'sea-http-' + process.pid);
const server = require('../server/сервер').создатьСервер(), П = require('../js/морской-бой-правила'), Б = require('../js/морской-бой-бот');
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const req = async (p, body) => { const r = await fetch(base + '/' + encodeURIComponent(p), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await r.json(); assert.equal(r.status, 200, JSON.stringify(data)); return data; };
  try {
    const a = await req('создать', { игра: 'морской-бой', имя: 'Анна' });
    const b = await req('войти', { код: a.код, имя: 'Борис' });
    const players = [a, b].map(p => ({ код: a.код, пропуск: p.пропуск }));
    const turn = (i, move) => req('ход', { ...players[i], ...move });
    assert.equal((await turn(1, { действие: 'готов', флот: П.случайныйФлот() })).принято, true);
    assert.equal((await turn(0, { действие: 'выстрел', клетка: 0 })).принято, false);
    assert.equal((await turn(0, { действие: 'готов', флот: П.случайныйФлот() })).принято, true);
    const opening = await req('состояние', players[0]); const первый = (opening.состояние || opening).море.вашХод;
    for (let n = 0; n < 200; n++) {
      const states = await Promise.all(players.map(p => req('состояние', p)));
      const views = states.map(s => s.состояние || s);
      assert(views.every(v => v.море), JSON.stringify(views));
      if (views[0].море.фаза === 'конец') break;
      for (const v of views) { assert.equal(v.море.флотСоперника, null); assert(!JSON.stringify(v).includes('"флоты"')); }
      const i = views.findIndex(v => v.море.вашХод); assert(i >= 0);
      const клетка = Б.выстрел(views[i].море.вашиВыстрелы, 'сложный');
      assert.equal((await turn(i, { действие: 'выстрел', клетка })).принято, true);
      assert.equal((await turn(i, { действие: 'выстрел', клетка })).принято, false);
    }
    const last = await req('состояние', players[0]); const v = last.состояние || last;
    assert.equal(v.море.фаза, 'конец'); assert.equal(v.море.флотСоперника.length, 10);
    assert.equal((await turn(0, { действие: 'ещё' })).принято, true);
    assert.equal((await turn(1, { действие: 'ещё' })).принято, true);
    const again = await req('состояние', players[0]); assert.equal((again.состояние || again).море.фаза, 'расстановка');
    for (const i of [0, 1]) assert.equal((await turn(i, { действие: 'готов', флот: П.случайныйФлот() })).принято, true);
    const next = await req('состояние', players[0]); assert.equal((next.состояние || next).море.вашХод, !первый, 'В реванше первый игрок меняется');
    console.log('HTTP: независимая готовность, полный бой, защита от повторных выстрелов, скрытые флоты, реванш — OK');
  } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
