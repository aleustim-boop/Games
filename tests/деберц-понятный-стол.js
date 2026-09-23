'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const И = require('../server/игры/деберц.js');
const П = require('../js/деберц-правила.js');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage(); const ошибки = [];
    p.on('pageerror', e => ошибки.push(e.message)); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8837');
    let версия = 0;
    const п = И.раздать(null, { игроки: ['а', 'б'] });
    const и = п.игра; и.счёт = [68, 142];
    // Обяз локального игрока во втором круге: паса в интерфейсе нет.
    while (!П.обязанВыбрать(и)) П.торг(и, и.ход, null);
    await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, п.игроки[и.сдающий], { код: 'TEST', версия: ++версия }));
    assert.equal(await p.locator('#деберц-обяз').textContent(), 'Обяз: Вы');
    assert.equal(await p.getByRole('button', { name: 'Пас', exact: true }).count(), 0);
    assert.match(await p.locator('#деберц-заказ').textContent(), /круг 2/);
    П.торг(и, и.ход, П.вариантыКозыря(и)[0]);
    for (const count of [1, 2]) {
      П.сыграть(и, и.ход, П.доступные(и, и.ход)[0].id);
      for (const [width, height] of [[320, 640], [390, 844], [515, 610], [768, 844]]) {
        await p.setViewportSize({ width, height });
        await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
        await p.waitForTimeout(1400);
        assert.match(await p.locator('.шапка-игры__подзаголовок').textContent(), /Вы: 68.*Друг: 142/);
        assert(!/фреза/i.test(await p.locator('#экран-игры').innerText()));
        await p.screenshot({ path: `tests/снимки/деберц-понятный-${width}-${count}.png` });
        assert(await p.locator('#деберц-заказ').evaluate(э => {
          const r = э.getBoundingClientRect();
          return [...document.querySelectorAll('#стол .деберц-подпись-карты')].every(к => к.getBoundingClientRect().bottom + 3 < r.top);
        }), 'Карты и имена не пересекают подпись заказчика');
        await p.screenshot({ path: `tests/снимки/деберц-понятный-${width}-${count}.png` });
      }
    }
    assert.deepEqual(ошибки, []);
    console.log('Экран: подписанный счёт, обяз сдающего, запрет паса, без фрезы и наложений на четырёх размерах — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
