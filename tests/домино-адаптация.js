'use strict';
const assert = require('node:assert/strict');
const { chromium, подготовитьПодделку } = require('./браузер-робот');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ reducedMotion: 'reduce' }); await подготовитьПодделку(p, { версия: '9.0' });
    await p.goto('http://127.0.0.1:8137/домино.html'); await p.locator('#дом-боты').click(); await p.locator('#дом-выбор-число').getByRole('radio', { name:'Четверо' }).click(); await p.locator('#дом-начать').click();
    for (const [width, height] of [[320,640],[390,844],[768,1024],[1280,720],[844,390]]) {
      await p.setViewportSize({ width, height });
      await p.evaluate(() => { ПоддельныйТелеграм.поменятьОтступы({ системные: { top: 24, bottom: 16 }, содержимого: { top: 48 } }); document.querySelector('#экран-игры').scrollTop = 0; });
      const errors = await p.evaluate(() => ['.дом-верх','.дом-счёт','.дом-стол','.дом-рука','.дом-действия'].flatMap(s => { const r = document.querySelector('#экран-игры ' + s).getBoundingClientRect(); return r.top < 72 || r.bottom > innerHeight - 16 || r.left < 0 || r.right > innerWidth ? [s + ': ' + JSON.stringify(r.toJSON())] : []; }));
      assert.deepEqual(errors, [], width + '×' + height);
      await p.screenshot({ path: 'tests/снимки/домино-telegram-' + width + '.png' });
    }
    await p.setViewportSize({ width: 390, height: 844 });
    // Нагрузка слоя представления: все 28 плашек в руке и длинная цепь,
    // геометрия не должна сдвинуть действия/табло или уменьшить кости.
    const geometry = () => p.locator('.дом-стол,.дом-действия').evaluateAll(es => es.map(e => e.getBoundingClientRect().toJSON()));
    const before = await geometry();
    await p.evaluate(() => {
      window.ИграПоСети.вМеню(); // Остановить таймер локального бота.
      window.ИграПоСети.экран('экран-игры');
      const tiles = window.ДоминоПравила.КОСТИ;
      document.querySelector('#дом-рука').replaceChildren(...tiles.map(t => window.ДоминоКости.кость(...t, true)));
      window.ДоминоКости.цепь(document.querySelector('#дом-цепь'), tiles.map(([a,b],id) => ({ a,b,id,кто:0 })), null);
    });
    assert.deepEqual(await geometry(), before);
    assert.equal(await p.locator('#дом-рука button').count(), 28);
    const widths = await p.locator('.дом-на-столе').evaluateAll(es => es.map(e => e.offsetWidth)); assert(widths.every(n => n >= 78));
    await p.screenshot({ path: 'tests/снимки/домино-длинная-цепь.png' });
    console.log('Домино: Telegram safe areas на пяти размерах, 28 костей в руке/цепи, стабильные размеры — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
