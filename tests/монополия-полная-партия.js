"use strict";
const assert = require("node:assert/strict"),
  P = require("../js/монополия-правила"),
  B = require("../js/монополия-бот"),
  { chromium, безTelegram } = require("./браузер-робот"),
  { move } = require("./монополия-действия-браузера");
(async () => {
  const browser = await chromium.launch();
  try {
    const p = await browser.newPage({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      }),
      errors = [];
    await безTelegram(p);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.clock.install();
    await p.addInitScript(() =>
      localStorage.setItem(
        "monopoly-match-v1",
        JSON.stringify({
          version: 1,
          n: 4,
          seed: 17,
          actions: [],
          id: 171717,
          result: false,
        }),
      ),
    );
    await p.goto("http://127.0.0.1:8137/монополия.html");
    await p.locator("#mono-resume").click();
    const g = P.create(4, 17);
    let applied = 0,
      steps = 0,
      types = new Set();
    while (g.phase !== "finished" && steps++ < 3000) {
      const record = await p.evaluate(() =>
        JSON.parse(localStorage.getItem("monopoly-match-v1")),
      );
      for (const a of record.actions.slice(applied)) {
        P.action(g, a.p, a.move);
        types.add(a.move.type);
      }
      applied = record.actions.length;
      if (g.phase === "finished") break;
      if (await p.locator("#mono-modal").isVisible())
        await p.locator("#mono-close").click();
      const actor = P.who(g);
      if (actor === 0) {
        const a = B.move(P.view(g, 0));
        await move(p, P.view(g, 0), a);
        assert.equal(await p.locator("#mono-error").innerText(), "");
      } else await p.clock.fastForward(4700);
      if (steps % 100 === 0)
        console.log("Локальная партия: шаг", steps, "ход", g.round);
    }
    assert.equal(g.phase, "finished");
    await p.screenshot({
      path: "tests/снимки/монополия-победа.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    assert(types.has("build") && types.has("bankrupt") && types.has("auction"));
    console.log(
      "Полная партия через интерфейс:",
      applied,
      "действий;",
      Array.from(types).join(", "),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
