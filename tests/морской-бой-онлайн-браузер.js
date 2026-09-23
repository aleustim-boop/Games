'use strict';
const assert = require('node:assert/strict'), os = require('node:os'), path = require('node:path');
process.env.ДАННЫЕ_ИГРЫ = path.join(os.tmpdir(), 'sea-browser-' + process.pid);
const server = require('../server/сервер').создатьСервер();
const { chromium, безTelegram } = require('./браузер-робот'), Б = require('../js/морской-бой-бот');
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ headless: true });
  try {
    const pages = await Promise.all([b.newPage({ viewport: { width: 390, height: 844 } }), b.newPage({ viewport: { width: 390, height: 844 } })]);
    const errors = []; for (const p of pages) { p.on('pageerror', e => errors.push(e.message)); await безTelegram(p); await p.goto(`http://127.0.0.1:8137/морской-бой.html?server=http://127.0.0.1:${server.address().port}`); }
    const [a, c] = pages;
    await a.locator('#лобби-найти-игру').click(); await a.locator('#открытые-столы-создать').click(); await a.locator('#кнопка-создать-игру').click();
    await a.waitForFunction(() => /^[A-Z0-9]{4,6}$/.test(document.getElementById('код-комнаты').textContent.trim()));
    const код = (await a.locator('#код-комнаты').textContent()).trim();
    await c.locator('#лобби-найти-игру').click(); await c.locator('#открытые-столы-код').click(); await c.locator('#поле-кода').fill(код); await c.locator('#кнопка-войти').click();
    for (const p of [c, a]) { await p.locator('#море-случайно').click(); await p.locator('#море-готов').click(); }
    await a.locator('#море-бой').waitFor(); await c.locator('#море-бой').waitFor();
    await c.reload(); await c.locator('#кнопка-вернуться-в-игру').click(); await c.locator('#море-бой').waitFor();
    for (let n = 0; n < 200; n++) {
      if (await a.locator('#море-результат').isVisible()) break;
      let p;
      for (const candidate of pages) if (await candidate.locator('#море-очередь').textContent() === 'Ваш ход') p = candidate;
      if (!p) { await a.waitForTimeout(50); n--; continue; }
      const map = await p.locator('#море-поле-врага > button').evaluateAll(es => es.map(e => e.dataset.состояние));
      const cell = Б.выстрел(map, 'сложный');
      await p.locator(`#море-поле-врага [data-клетка="${cell}"]`).click(); await p.locator('#море-выстрел').click();
      await p.waitForFunction(n => document.querySelector(`#море-поле-врага [data-клетка="${n}"]`).dataset.состояние !== 'неизвестно', cell);
    }
    assert(await a.locator('#море-результат').isVisible()); await c.locator('#море-результат').waitFor();
    await a.locator('#море-реванш').click(); await c.locator('#море-реванш').click();
    for (const p of pages) { await p.locator('#море-расстановка').waitFor(); assert.equal(await p.locator('#море-поле-расстановки [data-состояние="корабль"]').count(), 0); }
    assert.deepEqual(errors, []); console.log('Два браузера: создание, вход по коду, готовность второго первым, перезагрузка, полный бой и взаимный реванш — OK');
  } finally { await b.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
