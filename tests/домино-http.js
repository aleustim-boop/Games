'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), os = require('node:os');
process.env.ДАННЫЕ_ИГРЫ = path.join(os.tmpdir(), 'domino-http-' + process.pid);
/* Корень проекта. Ломающий запуск даёт путь к КОПИИ: --корень=путь (там папки server и js). */
const аргКорня = process.argv.find(a => a.startsWith('--корень=')), корень = аргКорня ? аргКорня.slice(9) : path.join(__dirname, '..');
const server = require(path.join(корень, 'server', 'сервер')).создатьСервер(), Б = require(path.join(корень, 'js', 'домино-бот'));
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
      const end = await req('состояние', players[0]), вид = end.состояние || end;
      if (n === 2) assert.equal(вид.домино.победители.length, n - 1, 'Вдвоём сдача должна кончать партию');
      else {
        /* От трёх мест «сдаться» заводит голосование: партия не кончена, в виде есть поле «досрочно». */
        assert(вид.досрочно, 'За столом из ' + n + ' после «сдаться» в виде нет поля голосования «досрочно»');
        assert.equal(вид.досрочно.идёт, true, 'Голосование должно идти');
        assert.equal(вид.домино.фаза, 'игра', 'Пока идёт голосование, партия не кончена');
        assert.equal(вид.домино.победители.length, 0, 'Пока идёт голосование, победителей нет');
        // Остальные отвечают «за», пока согласие не наберётся (действие «закончить-голос»).
        let кончена = false;
        for (let i = 0; i < n && !кончена; i++) {
          if (i === 1) continue;
          const ответ = await turn(i, { действие: 'закончить-голос', за: true });
          assert.equal(ответ.принято, true, JSON.stringify(ответ));
          const ст = await req('состояние', players[0]);
          кончена = (ст.состояние || ст).домино.фаза === 'конец';
        }
        assert(кончена, 'Согласие остальных должно кончить партию');
        const после = await req('состояние', players[0]), в2 = после.состояние || после;
        assert.equal(в2.домино.фаза, 'конец', 'После согласия партия должна кончиться');
        assert.equal(в2.досрочно && в2.досрочно.идёт, false, 'После конца голосование не идёт');
      }
      for (const p of players) await req('выйти', p);
      console.log(`Домино HTTP ${n}: полный матч, секретность, очередь, новый раунд, реванш и ${n === 2 ? 'сдача' : 'конец по согласию'} — OK`);
    }
  } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
