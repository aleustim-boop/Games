"use strict";
const assert = require("node:assert/strict"),
  path = require("node:path"),
  os = require("node:os");
process.env.ДАННЫЕ_ИГРЫ = path.join(
  os.tmpdir(),
  "monopoly-browser-" + process.pid,
);
const adapter = require("../server/игры/монополия");
adapter.темпБота.обычный = 80;
const server = require("../server/сервер").создатьСервер(),
  B = require("../js/монополия-бот"),
  { chromium, безTelegram } = require("./браузер-робот"),
  { move } = require("./монополия-действия-браузера");
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch();
  try {
    const base = "http://127.0.0.1:" + server.address().port,
      pages = [],
      errors = [];
    for (let i = 0; i < 2; i++) {
      const p = await browser.newPage({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      await безTelegram(p);
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto("http://127.0.0.1:8137/монополия.html?server=" + base);
      await p.evaluate(() => {
        const f = ИграПоСети.показатьВид;
        ИграПоСети.показатьВид = function (v) {
          window.__mono = v.монополия;
          return f(v);
        };
      });
      pages.push(p);
    }
    const [a, c] = pages;
    await a.locator("#лобби-найти-игру").click();
    await a.locator("#открытые-столы-создать").click();
    await a
      .locator("#mono-count-online")
      .getByRole("button", { name: "3", exact: true })
      .click();
    const creating = a.waitForResponse(
      (r) => decodeURIComponent(new URL(r.url()).pathname) === "/создать",
    );
    await a.locator("#кнопка-создать-игру").click();
    const ticket = await (await creating).json();
    await a.locator("#комната").waitFor();
    assert.equal(await a.locator("#комната-стол button").count(), 3);
    assert.match(await a.locator("#комната-правила").innerText(), /Монополия/);
    await a.screenshot({
      path: "tests/снимки/монополия-комната.png",
      fullPage: true,
    });
    await c.locator("#лобби-найти-игру").click();
    await c.locator("#открытые-столы-создать").click();
    await c.locator("#кнопка-войти-по-коду").click();
    await c.locator("#поле-кода").fill(ticket.код);
    await c.locator("#кнопка-войти").click();
    await c.locator("#комната").waitFor();
    await a.waitForFunction(
      () =>
        document.querySelectorAll("#комната-стол .рассадка__место--свободно")
          .length === 1,
    );
    await a.locator("#комната-стол button").nth(2).click();
    await a
      .locator("#лист-места")
      .getByRole("button", { name: /Посадить бота/ })
      .click();
    await a.locator("#комната-начать").click();
    for (const p of pages) await p.locator("#экран-игры").waitFor();
    await c.reload();
    await c.evaluate(() => {
      const f = ИграПоСети.показатьВид;
      ИграПоСети.показатьВид = function (v) {
        window.__mono = v.монополия;
        return f(v);
      };
    });
    await c.locator("#кнопка-вернуться-в-игру").click();
    await c.locator("#экран-игры").waitFor();
    let steps = 0;
    while (steps++ < 4000) {
      if (await a.evaluate(() => window.__mono?.phase === "finished")) break;
      for (const p of pages) {
        const v = await p.evaluate(() => window.__mono);
        if (!v || v.phase === "finished" || v.actor !== v.me) continue;
        await move(p, v, B.move(v));
        await p.waitForFunction(
          (serial) => window.__mono.serial !== serial,
          v.serial,
        );
        assert.equal(await p.locator("#mono-error").innerText(), "");
      }
      await a.waitForTimeout(30);
      if (steps % 100 === 0) console.log("Онлайн: шаг", steps);
    }
    assert(steps < 4000);
    await a.screenshot({
      path: "tests/снимки/монополия-онлайн-победа.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "Монополия онлайн: два браузера, рассадка, бот, возврат и полная партия — OK",
    );
    await fetch(base + "/выйти", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ код: ticket.код, пропуск: ticket.пропуск }),
    });
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
