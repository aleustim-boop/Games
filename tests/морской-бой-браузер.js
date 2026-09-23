'use strict';
const assert = require('node:assert/strict'), { chromium, безTelegram, подготовитьПодделку } = require('./браузер-робот');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ reducedMotion: 'reduce' }); const errors = [];
    p.on('pageerror', e => errors.push(e.message)); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/морской-бой.html');
    await p.locator('#море-боты').click(); await p.locator('#море-начать').click();
    for (const [width, height] of [[320,640],[390,844],[768,1024],[1280,720],[844,390]]) {
      await p.setViewportSize({ width, height });
      const bounds = await p.locator('#море-поле-расстановки').evaluate(e => ({ left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right, width: innerWidth }));
      assert(bounds.left >= 0 && bounds.right <= bounds.width + 1, JSON.stringify(bounds));
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.locator('#море-поле-расстановки [data-клетка="0"]').click();
    assert.equal(await p.locator('#море-поле-расстановки [data-состояние="корабль"]').count(), 4);
    await p.locator('#море-поле-расстановки [data-клетка="10"]').click();
    assert.match(await p.locator('#море-подсказка-расстановки').innerText(), /касаться/);
    await p.locator('#море-поле-расстановки [data-клетка="0"]').click();
    assert.equal(await p.locator('#море-поле-расстановки [data-состояние="корабль"]').count(), 0);
    await p.locator('#море-случайно').click();
    await p.screenshot({ path: 'tests/снимки/море-расстановка.png' });
    await p.reload(); await p.locator('#море-продолжить').click();
    assert.equal(await p.locator('#море-поле-расстановки [data-состояние="корабль"]').count(), 20);
    await p.locator('#море-готов').click();
    for (const [width, height] of [[320,640],[390,844],[768,1024],[1280,720],[844,390]]) {
      await p.setViewportSize({ width, height });
      const r = await p.locator('#море-поле-врага').evaluate(e => e.getBoundingClientRect().toJSON());
      assert(r.left >= 0 && r.right <= width + 1, `${width}: ${JSON.stringify(r)}`);
      await p.locator('#море-выстрел').scrollIntoViewIfNeeded();
      assert(await p.locator('#море-выстрел').isVisible());
      await p.screenshot({ path: `tests/снимки/море-бой-${width}.png` });
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForFunction(() => document.querySelector('#море-очередь').textContent === 'Ваш ход');
    const fleet = await p.evaluate(() => JSON.parse(localStorage.getItem('морской-бой-партия-v1')).журнал.find(e => e.тип === 'готов' && e.кто === 1).флот.flat());
    const before = await p.locator('#море-поле-врага').boundingBox();
    for (const cell of fleet) { await p.locator(`#море-поле-врага [data-клетка="${cell}"]`).click(); await p.locator('#море-выстрел').click(); }
    assert(await p.locator('#море-результат').isVisible()); assert.equal(await p.locator('#море-итог-заголовок').innerText(), 'Победа!');
    await p.screenshot({ path: 'tests/снимки/море-результат.png' });
    await p.locator('#море-посмотреть').click();
    const after = await p.locator('#море-поле-врага').boundingBox(); assert.equal(after.width, before.width); assert.equal(after.height, before.height);
    await p.locator('#кнопка-эмоции').click(); assert(await p.getByRole('dialog', { name: 'Сказать за столом' }).isVisible());
    await p.locator('#кнопка-эмоции-назад').click();
    await p.locator('#море-сдаться').click(); await p.locator('#море-реванш').click();
    assert(await p.locator('#море-расстановка').isVisible());
    assert.deepEqual(errors, []); console.log('Браузер: ручная расстановка, ошибки касаний, сохранение, 5 размеров, полный бой, результат, реванш и Сказать — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
