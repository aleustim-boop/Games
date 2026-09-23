'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage(); const ошибки = [];
    p.on('pageerror', e => ошибки.push(e.message)); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8838');
    await p.locator('#деберц-боты').click();
    for (const режим of ['2', '3', '4', '2x2']) {
      await p.locator('[data-режим="' + режим + '"]').click();
      assert.equal(await p.locator('[data-режим][aria-checked="true"]').getAttribute('data-режим'), режим);
    }
    for (const цель of ['301', '501', '1001']) {
      await p.locator('[data-цель="' + цель + '"]').click();
      assert.equal(await p.locator('[data-цель][aria-checked="true"]').getAttribute('data-цель'), цель);
    }
    for (const уровень of ['лёгкий', 'обычный', 'сложный']) {
      await p.locator('[data-уровень="' + уровень + '"]').click();
      assert.equal(await p.locator('[data-уровень][aria-checked="true"]').getAttribute('data-уровень'), уровень);
    }
    for (const [width, height] of [[320, 640], [390, 844], [1440, 1000]]) {
      await p.setViewportSize({ width, height });
      await p.locator('#деберц-настройки').evaluate(э => э.scrollTop = 0);
      assert(await p.locator('#деберц-настройки').evaluate(э => э.scrollWidth <= э.clientWidth));
      await p.screenshot({ path: 'tests/снимки/деберц-настройки-бота-' + width + '.png' });
      await p.locator('#деберц-начать').scrollIntoViewIfNeeded();
      assert(await p.locator('#деберц-начать').isVisible());
    }
    await p.locator('#деберц-начать').click();
    assert.equal(await p.locator('#деберц-цель-стола').textContent(), '1001');
    assert.equal(await p.locator('.деберц-участник').count(), 3);
    await p.reload();
    await p.locator('#кнопка-с-другом').click();
    for (const режим of ['2', '3', '4', '2x2']) {
      await p.locator('[data-друзья-режим="' + режим + '"]').click();
      assert.equal(await p.locator('#деберц-режим-друга').inputValue(), режим);
      assert.equal(await p.locator('[data-друзья-режим][aria-checked="true"]').count(), 1);
    }
    for (const цель of ['301', '501', '1001']) {
      await p.locator('[data-друзья-цель="' + цель + '"]').click();
      assert.equal(await p.locator('#деберц-цель-друга').inputValue(), цель);
      assert.equal(await p.locator('[data-друзья-цель][aria-checked="true"]').count(), 1);
    }
    for (const [width, height] of [[320, 640], [390, 844], [1440, 1000]]) {
      await p.setViewportSize({ width, height });
      await p.locator('#экран-друга').evaluate(э => э.scrollTop = 0);
      assert(await p.locator('#экран-друга').evaluate(э => э.scrollWidth <= э.clientWidth));
      assert(await p.locator('#экран-друга .деберц-формат').evaluateAll(к => к.length === 4 && к.every(э => э.getBoundingClientRect().height >= 85)));
      await p.screenshot({ path: 'tests/снимки/деберц-друзья-' + width + '.png', fullPage: true });
    }
    await p.locator('#кнопка-войти-по-коду').click();
    assert(await p.locator('#поле-кода').isVisible());
    assert.deepEqual(ошибки, []);
    console.log('Экран друзей: режимы, цели, выбранные состояния, вход по коду, три ширины — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
