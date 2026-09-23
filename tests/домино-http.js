'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), os = require('node:os');
process.env.ДАННЫЕ_ИГРЫ = path.join(os.tmpdir(), 'domino-http-' + process.pid);
const server = require('../server/сервер').создатьСервер(), Б = require('../js/домино-бот');
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const req = async (p, body) => { const r = await fetch(base + '/' + encodeURIComponent(p), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await r.json(); assert.equal(r.status, 200, JSON.stringify(data)); return data; };
  try {
    for (const n of [2, 3, 4]) {
      const a = await req('создать', { игра: 'домино', имя: 'Анна', мест: n, цельДомино: 50 });
      const players = [{ код: a.код, пропуск: a.пропуск }];
      for (let i = 1; i < n; i++) { const p = await req('войти', { код: a.код, имя: `Участник ${i}` }); players.push({ код: a.код, пропуск: p.пропуск }); }
      const turn = (i, move) => req('ход', { ...players[i], ...move });
      assert.equal((await turn(0, { действие: 'начать' })).принято, true);
      let count = 0;
      while (count++ < 3000) {
        const states = await Promise.all(players.map(p => req('состояние', p)));
        const views = states.map(s => s.состояние || s), v = views[0].домино;
        assert(v); assert.equal(v.цель, 50); assert.equal(v.имена[1], 'Участник 1');
        if (v.фаза === 'конец') break;
        if (v.фаза === 'итог') {
          assert.equal((await turn(1, { действие: 'раунд' })).принято, false);
          assert.equal((await turn(0, { действие: 'раунд' })).принято, true); continue;
        }
        for (const view of views) { assert.equal(view.домино.руки, null); assert.equal(typeof view.домино.базар, 'number'); assert.equal(view.домино.рука.length, view.домино.количества[view.домино.я]); }
        const i = v.ход, move = Б.ход(views[i].домино, 'сложный');
        assert.equal((await turn((i + 1) % n, move)).принято, false);
        assert.equal((await turn(i, move)).принято, true);
        assert.equal((await turn(i, move)).принято, false);
      }
      assert(count < 3000, 'Матч завис');
      for (let i = 0; i < n; i++) assert.equal((await turn(i, { действие: 'ещё' })).принято, true);
      const again = await req('состояние', players[0]); assert.equal((again.состояние || again).домино.фаза, 'игра');
      assert.equal((await turn(1, { действие: 'сдаться' })).принято, true);
      const end = await req('состояние', players[0]); assert.equal((end.состояние || end).домино.победители.length, n - 1);
      for (const p of players) await req('выйти', p);
      console.log(`Домино HTTP ${n}: полный матч, секретность, очередь, новый раунд, реванш и сдача — OK`);
    }
  } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
