"use strict";
const assert = require("node:assert/strict"),
  path = require("node:path"),
  os = require("node:os");
process.env.ДАННЫЕ_ИГРЫ = path.join(
  os.tmpdir(),
  "monopoly-http-" + process.pid,
);
const server = require("../server/сервер").создатьСервер(),
  B = require("../js/монополия-бот");
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const req = async (p, b) => {
    const r = await fetch(base + "/" + encodeURIComponent(p), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });
    const d = await r.json();
    assert.equal(r.status, 200, JSON.stringify(d));
    return d;
  };
  try {
    for (const n of [2, 6]) {
      const a = await req("создать", {
          игра: "монополия",
          имя: "Анна",
          мест: n,
        }),
        players = [{ код: a.код, пропуск: a.пропуск }];
      for (let i = 1; i < n; i++) {
        const p = await req("войти", { код: a.код, имя: "Участник " + i });
        players.push({ код: a.код, пропуск: p.пропуск });
      }
      const act = (i, m) => req("ход", { ...players[i], ...m });
      assert.equal((await act(0, { действие: "начать" })).принято, true);
      let steps = 0;
      while (steps++ < 5000) {
        const state = await req("состояние", players[0]),
          v = (state.состояние || state).монополия;
        assert(v);
        assert.equal(v.names[1], "Участник 1");
        assert(!("seed" in v) && !("decks" in v));
        if (v.phase === "finished") break;
        const p = v.actor,
          m = B.move(v);
        if (
          ![
            "offer",
            "build",
            "sell",
            "mortgage",
            "unmortgage",
            "sellGroup",
          ].includes(m.type)
        )
          assert.equal(
            (await act((p + 1) % n, { действие: "монополия", move: m }))
              .принято,
            false,
          );
        const answer = await act(p, { действие: "монополия", move: m });
        assert.equal(
          answer.принято,
          true,
          JSON.stringify({ answer, m, phase: v.phase }),
        );
      }
      assert(steps < 5000);
      for (let i = 0; i < n; i++)
        assert.equal((await act(i, { действие: "ещё" })).принято, true);
      const r = await req("состояние", players[0]);
      assert.equal((r.состояние || r).монополия.phase, "roll");
      for (const p of players) await req("выйти", p);
      console.log(
        `Монополия HTTP: ${n} игроков, ${steps} действий, приватность, очередь, имена и реванш — OK`,
      );
    }
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
