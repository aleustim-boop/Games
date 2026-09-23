'use strict';
const assert = require('node:assert/strict'), { chromium, безTelegram } = require('./браузер-робот');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ reducedMotion: 'reduce' }); const errors = []; p.on('pageerror', e => errors.push(e.message)); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/домино.html');
    await p.locator('#дом-боты').click(); await p.locator('#дом-выбор-число').getByRole('radio', { name:'Четверо' }).click(); await p.locator('#дом-выбор-цель').getByRole('radio', { name:'50', exact:true }).click(); await p.locator('#дом-начать').click();
    for (const [width, height] of [[320,640],[390,844],[768,1024],[1280,720],[844,390]]) {
      await p.setViewportSize({ width, height });
      const boxes = await p.locator('.дом-стол,.дом-рука,.дом-действия').evaluateAll(es => es.map(e => e.getBoundingClientRect().toJSON()));
      for (const r of boxes) assert(r.left >= 0 && r.right <= width + 1 && r.top >= 0 && r.bottom <= height + 1, `${width}x${height}: ${JSON.stringify(r)}`);
      if (width < 500) assert(boxes[0].width > width * .85, 'Стол не должен сужаться до ширины содержимого');
      await p.screenshot({ path: `tests/снимки/домино-${width}.png` });
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.reload(); await p.locator('#дом-продолжить').click();
    // Ускоряем только ожидание ботов, играем реальными кнопками до конца матча.
    await p.evaluate(() => { const original = window.setTimeout; window.setTimeout = (fn, delay, ...args) => original(fn, delay === 1100 ? 1 : delay, ...args); });
    let actions = 0;
    while (actions++ < 1500) {
      if (await p.locator('#дом-результат').isVisible()) {
        const state = await p.evaluate(() => window.ДоминоПамять.восстановить(JSON.parse(localStorage.getItem('домино-партия-v1'))));
        if (state.фаза === 'конец') break;
        await p.locator('#дом-дальше').click(); continue;
      }
      const legal = p.locator('#дом-рука button:not([disabled])');
      if (await legal.count()) {
        await legal.first().click();
        const left = p.locator('#дом-лево');
        if (await left.isEnabled()) await left.click(); else await p.locator('#дом-право').click();
      } else if (await p.locator('#дом-действие').isEnabled() && /Взять из базара|^Пас$/.test(await p.locator('#дом-действие').innerText())) await p.locator('#дом-действие').click();
      else await p.waitForTimeout(20);
    }
    assert(actions < 1500, 'Матч не завершён'); assert(await p.locator('#дом-результат').isVisible());
    await p.screenshot({ path: 'tests/снимки/домино-результат.png' });
    await p.locator('#дом-посмотреть').click();
    await p.locator('#кнопка-эмоции').click(); assert(await p.getByRole('dialog', { name: 'Сказать за столом' }).isVisible());
    await p.screenshot({ path: 'tests/снимки/домино-сказать.png' });
    await p.locator('#кнопка-эмоции-назад').click();
    await p.locator('#дом-действие').click(); await p.locator('#дом-дальше').click();
    await p.locator('#экран-игры [data-меню]').click();
    await p.getByRole('button', { name: /Завершить партию/ }).click();
    await p.getByRole('button', { name: 'Завершить', exact: true }).click();
    await p.locator('#дом-результат').waitFor();
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('домино-история')).length), 2);
    assert.deepEqual(errors, []); console.log(`Домино: пять экранов, восстановление и полный матч через интерфейс (${actions} действий) — OK`);
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
