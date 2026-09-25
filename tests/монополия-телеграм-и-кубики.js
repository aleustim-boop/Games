"use strict";
const assert = require("node:assert/strict"),
  P = require("../js/монополия-правила"),
  { chromium, подготовитьПодделку } = require("./браузер-робот");
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1908, height: 1057 } }),
      errors = [];
    await подготовитьПодделку(p, {
      версия: "8.0",
      отступы: { системные: { top: 24, bottom: 20 }, содержимого: { top: 40 } },
    });
    p.on("pageerror", (e) => errors.push(e.message));
    let seed = 1;
    while (P.create(4, seed).turn !== 0) seed++;
    await p.addInitScript(
      (seed) =>
        localStorage.setItem(
          "monopoly-match-v1",
          JSON.stringify({ version: 1, n: 4, seed, actions: [], id: 17 }),
        ),
      seed,
    );
    await p.goto("http://127.0.0.1:8137/монополия.html");
    for (const [width, height] of [
      [1908, 1057],
      [1280, 800],
      [800, 600],
      [390, 844],
      [320, 640],
    ]) {
      await p.setViewportSize({ width, height });
      const boxes = await p.evaluate(() =>
        Object.fromEntries(
          [
            "#экран-лобби",
            "#mono-resume",
            "#mono-profile",
            ".mono-footer",
            "#mono-bots",
          ].map((s) => {
            const r = document.querySelector(s).getBoundingClientRect();
            return [s, { x: r.x, y: r.y, w: r.width, bottom: r.bottom }];
          }),
        ),
      );
      const lobby = boxes["#экран-лобби"];
      assert(
        Math.abs(lobby.x + lobby.w / 2 - width / 2) < 2,
        "Центрирование лобби",
      );
      assert(
        boxes["#mono-profile"].y - boxes["#mono-resume"].bottom >= 12,
        "Отступ от продолжения до профиля",
      );
      if (height >= 640)
        assert(
          boxes[".mono-footer"].bottom <= height - 19,
          `Лобби ${width}×${height}: низ ${boxes[".mono-footer"].bottom}`,
        );
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await p.screenshot({
        path: `tests/снимки/монополия-телеграм-${width}.png`,
        fullPage: true,
      });
    }
    await p.setViewportSize({ width: 780, height: 1000 });
    await p.locator("#mono-resume").click();
    await p
      .locator("#mono-actions")
      .getByRole("button", { name: "Бросить кубики" })
      .click();
    const cubes = p.locator(".mono-die");
    assert.equal(await cubes.count(), 2);
    assert(
      await cubes.evaluateAll((es) =>
        es.every(
          (e) =>
            getComputedStyle(e).filter === "none" &&
            getComputedStyle(e).transformStyle === "preserve-3d" &&
            e.children.length === 6,
        ),
      ),
      "Шесть граней сохраняют объём",
    );
    const frame = await p.locator("#mono-dice").evaluate((e) => {
      const as = e.getAnimations({ subtree: true });
      as.forEach((a) => {
        a.pause();
        a.currentTime = 700;
      });
      return as.length;
    });
    assert(frame >= 4, "Кубики и тени анимируются отдельно");
    await p.screenshot({
      path: "tests/снимки/монополия-кубики-отскок.png",
      fullPage: true,
    });
    await p.locator("#mono-dice").evaluate((e) =>
      e.getAnimations({ subtree: true }).forEach((a) => {
        a.currentTime = 1900;
        a.finish();
      }),
    );
    await p.screenshot({
      path: "tests/снимки/монополия-кубики-объём.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "Telegram: центр, отступ, доступные кнопки 320–1908; кубики:6граней, падение и отдельная тень — OK",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
