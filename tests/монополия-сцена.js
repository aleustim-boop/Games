"use strict";
const assert = require("node:assert/strict"),
  P = require("../js/монополия-правила"),
  B = require("../js/монополия-бот"),
  { chromium, безTelegram } = require("./браузер-робот");
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
    await p.goto((process.env.MONOPOLY_BASE || "http://127.0.0.1:8137") + "/монополия.html");
    const bg = await p.locator("#экран-лобби").evaluate(async (e) => {
      const style = getComputedStyle(e);
      const url = style.backgroundImage.match(/url\("?([^"\)]+)/)[1];
      const im = new Image();
      im.src = url;
      await im.decode();
      return { url, w: im.naturalWidth };
    });
    assert(
      bg.url.includes(encodeURIComponent("сцена-лобби-v2")) && bg.w > 500,
      "Лобби должно показывать реальный фон из концепта",
    );
    const g = P.create(4, 17),
      actions = [];
    while (g.phase !== "finished" && actions.length < 1800) {
      const actor = P.who(g);
      if (
        actor === 0 &&
        g.phase === "buy" &&
        g.properties.some((s) => s.level > 0)
      )
        break;
      const move = B.move(P.view(g, actor));
      P.action(g, actor, move);
      actions.push({ p: actor, move });
    }
    assert.equal(g.phase, "buy");
    assert(g.properties.some((s) => s.level > 0));
    await p.evaluate(
      (actions) =>
        localStorage.setItem(
          "monopoly-match-v1",
          JSON.stringify({
            version: 1,
            n: 4,
            seed: 17,
            actions,
            id: 1717,
            result: false,
          }),
        ),
      actions,
    );
    await p.reload();
    await p.locator("#mono-resume").click();
    if (await p.locator("#mono-modal").isVisible())
      await p.locator("#mono-close").click();
    assert(await p.getByRole("button", { name: /^Купить за/ }).isVisible());
    await p.locator("#mono-board image").evaluateAll(async (es) =>
      Promise.all(
        [...new Set(es.map((e) => e.getAttribute("href")))].map(async (src) => {
          const im = new Image();
          im.src = src;
          await im.decode();
        }),
      ),
    );
    for (const width of [320, 390, 768, 1280]) {
      await p.setViewportSize({ width, height: 900 });
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      const overflow = await p.locator(".mono-cell").evaluateAll((es) =>
        es
          .filter((e) => {
            const b = e.getBBox(),
              r = e.querySelector("rect").getBBox();
            return b.width > r.width + 3 || b.height > r.height + 3;
          })
          .map((e) => e.dataset.cell),
      );
      assert.deepEqual(
        overflow,
        [],
        "Фигурки и надписи не расширяют кликабельные клетки",
      );
      await p.screenshot({
        path: `tests/снимки/монополия-сцена-покупка-${width}.png`,
        fullPage: true,
      });
    }
    await p.getByRole("button", { name: /^Купить за/ }).click();
    assert.equal(await p.locator("#mono-error").innerText(), "");
    assert.deepEqual(errors, []);
    console.log(
      "Сцена: фон лобби загружен, реальная партия с домами, покупка, границы клеток, 320–1280 px — OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
