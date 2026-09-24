"use strict";
const assert = require("node:assert/strict"),
  P = require("../js/монополия-правила"),
  { chromium, безTelegram, подготовитьПодделку } = require("./браузер-робот");
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }),
      errors = [];
    await безTelegram(p);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:8137/index.html");
    const tile = p.locator('[data-игра="монополия"]');
    await p.getByRole("button", { name: "Карточные", exact: true }).click();
    assert(!(await tile.isVisible()));
    await p.getByRole("button", { name: "Настольные", exact: true }).click();
    await tile.click();
    await p.locator("#mono-bots").waitFor();
    let seed = 1;
    while (P.create(3, seed).turn !== 0) seed++;
    await p.evaluate(
      (seed) =>
        localStorage.setItem(
          "monopoly-match-v1",
          JSON.stringify({
            version: 1,
            n: 3,
            seed,
            id: 123,
            actions: [],
            result: false,
          }),
        ),
      seed,
    );
    await p.reload();
    await p.locator("#mono-resume").click();
    await p
      .locator("#mono-actions")
      .getByRole("button", { name: "Бросить кубики" })
      .click();
    assert(
      await p
        .locator("#mono-dice")
        .evaluate((e) => e.getAnimations({ subtree: true }).length >= 2),
    );
    assert.equal(
      await p.locator("#mono-modal").isVisible(),
      false,
      "Карта не должна перекрывать бросок",
    );
    await p.waitForTimeout(3800);
    if (await p.locator("#mono-modal").isVisible())
      await p.locator("#mono-close").click();
    assert.equal(await p.locator("#mono-dice .mono-die").count(), 2);
    await p.screenshot({
      path: "tests/снимки/монополия-бросок.png",
      fullPage: true,
    });
    const boxes = await p.locator("#mono-board .mono-cell").evaluateAll((es) =>
      es.map((e) => {
        const b = e.getBBox(),
          r = e.querySelector("rect").getBBox();
        return {
          id: e.dataset.cell,
          bw: b.width,
          rw: r.width,
          bh: b.height,
          rh: r.height,
        };
      }),
    );
    for (const x of boxes)
      assert(
        x.bw <= x.rw + 3 && x.bh <= x.rh + 3,
        "Изображение расширило область клетки " + x.id,
      );
    const tg = await b.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await подготовитьПодделку(tg, {
      версия: "8.0",
      отступы: { системные: { top: 24, bottom: 20 }, содержимого: { top: 40 } },
    });
    await tg.goto("http://127.0.0.1:8137/монополия.html");
    assert.equal(await tg.locator("#mono-name").innerText(), "Проверяющий");
    assert(!(await tg.locator("#экран-лобби .mono-top").isVisible()));
    assert((await tg.locator("#экран-лобби h1").boundingBox()).y >= 64);
    await tg.screenshot({
      path: "tests/снимки/монополия-telegram.png",
      fullPage: true,
    });
    await tg.close();
    assert.deepEqual(errors, []);
    console.log(
      "Монополия: витрина, фильтры каталога, настоящая анимация, стабильные кубики, границы клеток и Telegram — OK",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
