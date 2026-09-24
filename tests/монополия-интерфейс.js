"use strict";
const assert = require("node:assert/strict"),
  { chromium, безTelegram } = require("./браузер-робот");
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      }),
      errors = [];
    await безTelegram(p);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:8137/монополия.html");
    await p.locator("#mono-bots").waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await p.setViewportSize({ width, height: 900 });
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await p.screenshot({
        path: `tests/снимки/монополия-лобби-${width}.png`,
        fullPage: true,
      });
    }
    await p.locator("#mono-bots").click();
    await p
      .locator("#mono-count")
      .getByRole("button", { name: "6", exact: true })
      .click();
    assert.equal(await p.locator("#mono-seats .mono-seat").count(), 6);
    await p.screenshot({
      path: "tests/снимки/монополия-настройки.png",
      fullPage: true,
    });
    await p
      .locator("#mono-count")
      .getByRole("button", { name: "4", exact: true })
      .click();
    await p.locator("#mono-start").click();
    await p.locator("#экран-игры").waitFor();
    assert.equal(await p.locator("#mono-board .mono-cell").count(), 40);
    if (await p.locator("#mono-modal").isVisible())
      await p.locator("#mono-close").click();
    await p.locator('#mono-board [data-cell="1"]').click();
    assert.match(
      await p.locator("#mono-modal-body").innerText(),
      /Старый|Аренда/,
    );
    await p.locator("#mono-close").click();
    for (const [width, height] of [
      [320, 640],
      [390, 844],
      [844, 390],
      [1280, 900],
    ]) {
      await p.setViewportSize({ width, height });
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await p.screenshot({
        path: `tests/снимки/монополия-партия-${width}.png`,
        fullPage: true,
      });
    }
    await p.locator("#mono-zoom").click();
    assert(
      await p
        .locator("#mono-board-wrap")
        .evaluate((e) => e.classList.contains("mono-zoom")),
    );
    await p.locator("#mono-zoom").click();
    await p.locator("#mono-properties").click();
    assert.match(await p.locator("#mono-modal-body").innerText(), /Наличные/);
    await p.locator("#mono-close").click();
    const record = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("monopoly-match-v1")),
    );
    await p.reload();
    await p.locator("#mono-resume").click();
    assert.equal(
      (
        await p.evaluate(() =>
          JSON.parse(localStorage.getItem("monopoly-match-v1")),
        )
      ).id,
      record.id,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Монополия: лобби, 40 клеток, настройки, адаптивность, карточки, масштаб, сохранение — OK",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
