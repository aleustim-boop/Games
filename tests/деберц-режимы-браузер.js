'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const нажатьКарту = require('./деберц-нажать-карту.js');
const И = require('../server/игры/деберц.js');
const П = require('../js/деберц-правила.js');
const base = 'http://127.0.0.1:' + (process.argv[2] || 8137);
const server = 'http://127.0.0.1:' + (process.argv[3] || 8837);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ошибки = [];
  async function страница() {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await безTelegram(p); p.on('pageerror', e => ошибки.push(e.message));
    await p.goto(base + '/деберц.html?server=' + encodeURIComponent(server)); return p;
  }
  try {
    const p = await страница();
    let версия = 0;
    for (const режим of ['3', '4', '2x2']) {
      const n = режим === '2x2' ? 4 : +режим;
      const п = И.раздать(null, { игроки: ['а', 'б', 'в', 'г'].slice(0, n), парами: режим === '2x2' });
      И.сделатьХод(п, И.чейХод(п), { действие: 'торг', масть: п.игра.открытая.масть });
      assert.equal(п.игра.фаза, 'игра');
      for (let i = 0; i < n; i++) И.ходЗаБота(п, И.чейХод(п), 'обычный');
      for (const width of [320, 390, 768, 1920]) {
        await p.setViewportSize({ width, height: width === 320 ? 640 : 844 });
        await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
        await p.waitForTimeout(1400);
        assert.equal(await p.locator('.деберц-участник').count(), n - 1);
        assert.equal(await p.locator('#стол .карта').count(), n);
        assert.match(await p.locator('#деберц-обяз').textContent(), /^Обяз: /);
        assert.equal(await p.locator('.деберц-участник--напарник').count(), режим === '2x2' ? 1 : 0);
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Нет горизонтальной прокрутки');
        assert(await p.locator('#стол').evaluate(э => [...э.querySelectorAll('.карта')].every(к => {
          const r = к.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.height >= 100;
        })), 'Все карты взятки помещаются');
        await p.screenshot({ path: 'tests/снимки/деберц-' + режим + '-' + width + '.png' });
      }
    }
    await p.close();
    if (!process.argv.includes('--макет')) for (const режим of ['3', '4', '2x2']) {
      const p = await страница();
      await p.locator('#деберц-боты').click(); await p.locator('[data-режим="' + режим + '"]').click();
      await p.locator('#деберц-начать').click();
      await p.locator('#деберц-назад').click(); await p.reload();
      await p.locator('#деберц-продолжить').click();
      assert.equal(await p.evaluate(() => window.ДеберцПамять.открыть(localStorage).игра.режим), режим);
      await p.evaluate(() => { const timer = window.setTimeout.bind(window); window.setTimeout = (fn, ms, ...args) => timer(fn, ms === 1500 || ms === 2400 || ms === 6000 ? 10 : ms, ...args); });
      let завершена = false;
      for (let шаг = 0; шаг < 3000; шаг++) {
        if (await p.getByRole('button', { name: 'Сыграть ещё', exact: true }).isVisible()) { завершена = true; break; }
        const действие = p.locator('#панель-кнопок button:enabled:not(.кнопка--инфо):not(#кнопка-эмоции), #деберц-итог-действия button:enabled').filter({ hasNotText: /Сыграть ещё|В лобби/ }).first();
        if (await действие.isVisible()) await действие.click();
        else {
          const карта = p.locator('#карты-человека button:enabled').first();
          if (await карта.count()) await нажатьКарту(p, карта); else await p.waitForTimeout(20);
        }
      }
      assert(завершена, режим + ': полная партия через нажатия');
      const результат = await p.evaluate(() => window.ДеберцПамять.открыть(localStorage).результаты());
      assert.equal(результат.length, 1); assert.equal(результат[0].режим, режим);
      await p.getByRole('button', { name: 'Сыграть ещё', exact: true }).click();
      assert.equal(await p.locator('#счёт-я').textContent(), '0');
      await p.getByRole('button', { name: 'За столом', exact: true }).click();
      await p.locator('#деберц-сдаться').click(); await p.locator('#деберц-сдаться-да').click();
      assert.equal(await p.evaluate(() => window.ДеберцПамять.открыть(localStorage).результаты().length), 2);
      console.log('Браузер: ' + режим + ' — выбор, восстановление, полная партия, повтор и сдача — OK');
      await p.close();
    }
    assert.deepEqual(ошибки, []);
    console.log('Обяз, игроки, напарник и 3/4 карты взятки на трёх ширинах — OK');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
