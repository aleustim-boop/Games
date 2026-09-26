'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const нажатьКарту = require('./деберц-нажать-карту.js');
const адрес = 'http://127.0.0.1:' + (process.argv[2] || 8137) + '/деберц.html?server=' + encodeURIComponent('http://127.0.0.1:' + (process.argv[3] || 8837));
(async () => {
  const browser = await chromium.launch({ headless: true }); const ошибки = [];
  try {
    for (const режим of ['3', '4', '2x2']) {
      const n = режим === '2x2' ? 4 : +режим;
      const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await безTelegram(p); p.on('pageerror', e => ошибки.push(e.message));
      await p.goto(адрес); await p.locator('#лобби-найти-игру').click(); await p.locator('#открытые-столы-создать').click();
      await p.locator('[data-друзья-режим="' + режим + '"]').click();
      await p.locator('[data-друзья-цель="501"]').click();
      await p.locator('#кнопка-создать-игру').click();
      await p.locator('#комната').waitFor({ state: 'visible' });
      assert(await p.locator('#комната-начать').isDisabled());
      for (let i = 1; i < n; i++) {
        await p.locator('#комната-стол button').nth(i).click(); await p.locator('#лист-места').getByRole('button', { name: /Посадить бота/ }).click();
        await p.waitForFunction(n => document.querySelectorAll('#комната-стол .рассадка__место--бот').length >= n - 1, i + 1);
      }
      await p.locator('#комната-начать').click();
      await p.locator('#экран-игры').waitFor({ state: 'visible' });
      assert.equal(await p.locator('.деберц-участник').count(), n - 1);
      assert.equal(await p.locator('#деберц-цель-стола').textContent(), '501');
      let взятка = false;
      for (let i = 0; i < 150; i++) {
        if (await p.locator('#деберц-последняя-карты .карта').count() === n) { взятка = true; break; }
        // #кнопка-эмоции («Сказать») исключаем отдельно: это не ход, а открытие
        // диалога «Сказать за столом» (js/деберц-сказать.js) — общий класс
        // «кнопка--инфо» на неё не навешан (она не служебная, ей можно
        // пользоваться в игре), поэтому раньше цикл иногда кликал по ней
        // вместо хода, диалог-модалка оставался открытым и перехватывал
        // клики — взятка зависала до таймаута.
        const b = p.locator('#панель-кнопок button:enabled:not(.кнопка--инфо):not(#кнопка-эмоции)').first();
        if (await b.isVisible()) await b.click();
        else {
          const card = p.locator('#карты-человека button:enabled').first();
          if (await card.isVisible()) await нажатьКарту(p, card); else await p.waitForTimeout(100);
        }
      }
      assert(взятка, 'В комнате разыграна взятка всеми участниками');
      assert.match(await p.locator('#деберц-обяз').textContent(), /^Обяз: /);
      await p.reload();
      if (!(await p.locator('#экран-игры').isVisible())) await p.locator('#кнопка-вернуться-в-игру').click();
      await p.locator('#экран-игры').waitFor({ state: 'visible' });
      assert.equal(await p.locator('.деберц-участник').count(), n - 1);
      await p.getByRole('button', { name: 'За столом', exact: true }).click();
      await p.locator('#деберц-сдаться').click(); await p.locator('#деберц-сдаться-да').click();
      await p.getByRole('button', { name: 'В лобби', exact: true }).click();
      assert(await p.locator('#деберц-боты').isVisible());
      console.log('Комната ' + режим + ': создание, боты, начало, взятка, возврат и сдача — OK');
      await p.close();
    }
    assert.deepEqual(ошибки, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
