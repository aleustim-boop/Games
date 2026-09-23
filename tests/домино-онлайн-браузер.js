'use strict';
const assert = require('node:assert/strict'), os = require('node:os'), path = require('node:path');
process.env.ДАННЫЕ_ИГРЫ = path.join(os.tmpdir(), 'domino-browser-' + process.pid);
const server = require('../server/сервер').создатьСервер();
const { chromium, безTelegram } = require('./браузер-робот');
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ headless: true }), errors = [];
  try {
    const base = 'http://127.0.0.1:' + server.address().port;
    const pages = await Promise.all([0, 1].map(() => b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })));
    for (const p of pages) { await безTelegram(p); p.on('pageerror', e => errors.push(e.message)); await p.goto('http://127.0.0.1:8137/домино.html?server=' + base); }
    const [a, c] = pages;
    await a.locator('#лобби-найти-игру').click(); await a.locator('#открытые-столы-создать').click();
    await a.locator('#домино-мест-друга').selectOption('3'); await a.locator('#домино-цель-друга').selectOption('50');
    const creating = a.waitForResponse(r => decodeURIComponent(new URL(r.url()).pathname) === '/создать');
    await a.locator('#кнопка-создать-игру').click(); const ticket = await (await creating).json();
    await a.locator('#комната').waitFor({ timeout: 5000 }).catch(async e => { console.log(JSON.stringify(ticket), errors, await a.locator('#экран-комнаты').innerText()); throw e; }); assert.equal(await a.locator('#комната-стол button').count(), 3); assert.match(await a.locator('#комната-правила').innerText(), /Домино/);
    await c.locator('#лобби-найти-игру').click(); await c.locator('#открытые-столы-создать').click(); await c.locator('#кнопка-войти-по-коду').click();
    await c.locator('#поле-кода').fill(ticket.код); await c.locator('#кнопка-войти').click(); await c.locator('#комната').waitFor();
    await a.waitForFunction(() => document.querySelectorAll('#комната-стол .рассадка__место--свободно').length === 1);
    await a.locator('#комната-стол button').nth(2).click(); await a.locator('#лист-места').getByRole('button', { name: /Посадить бота/ }).click();
    await a.locator('#комната-начать').click();
    for (const p of pages) await p.locator('#экран-игры').waitFor();
    assert.match(await a.locator('#дом-раунд').innerText(), /до 50/);
    await c.reload(); await c.locator('#кнопка-вернуться-в-игру').click(); await c.locator('#экран-игры').waitFor();
    let count = 0;
    while (count++ < 250) {
      if (await a.locator('#дом-результат').isVisible()) break;
      for (const p of pages) {
        if (await p.locator('#дом-результат').isVisible()) continue;
        const legal = p.locator('#дом-рука button:not([disabled])');
        if (await legal.count()) { await legal.first().click(); if (await p.locator('#дом-лево').isEnabled()) await p.locator('#дом-лево').click(); else await p.locator('#дом-право').click(); }
        else if (await p.locator('#дом-действие').isEnabled() && /Взять из базара|^Пас$/.test(await p.locator('#дом-действие').innerText())) await p.locator('#дом-действие').click();
      }
      await a.waitForTimeout(100);
    }
    assert(count < 250); await c.locator('#дом-результат').waitFor();
    await a.screenshot({ path: 'tests/снимки/домино-онлайн-итог.png' });
    assert.deepEqual(errors, []); console.log('Домино онлайн: два браузера, стол на троих с ботом, вход по коду, восстановление и полный раунд — OK');
    await fetch(base + '/выйти', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ код: ticket.код, пропуск: ticket.пропуск }) });
  } finally { await b.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
