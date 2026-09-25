"use strict";
const assert = require("node:assert/strict"),
  { chromium, подготовитьПодделку } = require("./браузер-робот");
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 852, height: 1027 } });
    await подготовитьПодделку(p, { версия: "8.0" });
    let count = 3;
    await p.route("**/*", async (route) => {
      if (/\/рейтинг(?:\?|$)/.test(decodeURI(route.request().url()))) {
        const rows = Array.from({ length: count }, (_, i) => ({
          место: i + 1,
          имя: ["Alexey", "Zaharchenko", "Червинский"][i] || "Игрок " + (i + 1),
          очки: 196 - i * 3,
          побед: 5,
          партий: 10,
          этоЯ: i === 0,
          движение: "безИзменений",
          сдвиг: 0,
        }));
        await route.fulfill({
          json: {
            ок: true,
            узналиВас: true,
            игра: "все",
            всего: count,
            яВТаблице: true,
            я: rows[0],
            верхушка: rows,
            вокругМеня: rows.slice(0, 3),
            продолжение: null,
            сила: null,
            друзья: {
              естьДрузья: false,
              верхушка: [],
              вокругМеня: [],
              всего: 0,
            },
          },
        });
      } else await route.fallback();
    });
    await p.goto("http://127.0.0.1:8137/index.html");
    await p.evaluate(() => window.ЭкранРейтинга.открыть("все"));
    await p.locator(".рейтинг-список-конец").waitFor();
    for (const [width, height] of [
      [852, 1027],
      [390, 844],
      [320, 640],
    ]) {
      await p.setViewportSize({ width, height });
      await p.locator("#экран-рейтинга-игроков").evaluate((e) => {
        e.scrollTop = e.scrollHeight;
      });
      const r = await p.evaluate(() => {
        const end = document.querySelector(".рейтинг-список-конец"),
          card = document.querySelector("#рейтинг-моё-место"),
          nav = document.querySelector(
            "#экран-рейтинга-игроков .нижние-вкладки",
          );
        return {
          end: end.getBoundingClientRect().bottom,
          card: card.getBoundingClientRect().top,
          bottom: card.getBoundingClientRect().bottom,
          nav: nav.getBoundingClientRect().top,
          before: getComputedStyle(card, "::before").content,
        };
      });
      assert(r.card - r.end >= 12, "Конец списка отделён от карточки");
      assert(r.bottom <= r.nav, "Место не закрыто навигацией");
      assert.equal(r.before, "none", "Нет градиента поверх итоговой строки");
      await p.screenshot({
        path: `tests/снимки/рейтинг-конец-${width}.png`,
        fullPage: true,
      });
    }
    count = 35;
    await p.reload();
    await p.evaluate(() => window.ЭкранРейтинга.открыть("все"));
    await p.locator(".рейтинг-список-конец").waitFor();
    await p.locator("#экран-рейтинга-игроков").evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    });
    const visible = await p.locator(".рейтинг-список-конец").evaluate((e) => {
      const r = e.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight;
    });
    assert(visible, "Конец длинного списка доступен");
    console.log(
      "Рейтинг: конец короткого и длинного списка виден, Моё место ниже, без перекрытия навигацией — OK",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
