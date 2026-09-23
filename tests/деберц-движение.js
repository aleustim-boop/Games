'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const И = require('../server/игры/деберц.js');
const П = require('../js/деберц-правила.js');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    await безTelegram(p); await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8838');
    const п = И.раздать(null, { игроки: ['а', 'б', 'в', 'г'], парами: true });
    const и = п.игра; и.сдающий = 0; и.ход = 1;
    П.торг(и, 1, и.открытая.масть);
    let версия = 0;
    const показать = () => p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
    await показать(); await p.waitForTimeout(1600);
    assert.match(await p.locator('#статус-хода').innerText(), /Ходит: Игрок 2/);
    for (let k = 0; k < 4; k++) {
      const кто = и.ход, карта = П.доступные(и, кто)[0];
      П.сыграть(и, кто, карта.id); await показать();
      if (кто) {
        const полёт = await p.locator('#стол .карта').last().evaluate((э, кто) => {
          const а = э.getAnimations()[0]; if (!а) return null;
          а.pause(); а.currentTime = 0;
          const r = э.getBoundingClientRect(), от = document.querySelector('[data-игрок="' + кто + '"]').getBoundingClientRect();
          return { ms: а.effect.getTiming().duration, dx: Math.abs(r.x + r.width / 2 - от.x - от.width / 2), dy: Math.abs(r.y + r.height / 2 - от.y - от.height / 2) };
        }, кто);
        assert(полёт && полёт.ms >= 1000, 'Ход соперника виден не менее секунды');
        assert(полёт.dx < 12 && полёт.dy < 12, 'Карта стартует от конкретного игрока: ' + JSON.stringify(полёт));
      }
      await p.locator('#стол .карта').evaluateAll(карты => карты.forEach(к => к.getAnimations().forEach(а => а.finish())));
      await p.waitForTimeout(100);
    }
    const победитель = П.старшаяКарта(и).игрок;
    assert.match(await p.locator('#деберц-статус').innerText(), /Взятку забирает:/);
    const цель = победитель ? '[data-игрок="' + победитель + '"]' : '#карты-человека';
    assert(await p.locator(цель).evaluate(э => э.classList.contains('деберц-забирает')));
    П.забрать(и); await показать();
    const уход = await p.locator('#слой-улетающих-карт .карта').evaluateAll(карты => карты.map(к => к.getAnimations()[0]?.effect.getTiming().duration));
    assert.equal(уход.length, 4); assert(уход.every(ms => ms === 750));
    assert(await p.locator('#слой-улетающих-карт .карта').evaluateAll((карты, цель) => {
      const r = document.querySelector(цель).getBoundingClientRect();
      return карты.every(к => {
        const а = к.getAnimations()[0]; а.pause(); а.currentTime = 0;
        const начало = к.getBoundingClientRect();
        const m = а.effect.getKeyframes().at(-1).transform.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/);
        return m && Math.abs(начало.x + начало.width / 2 + +m[1] - r.x - r.width / 2) < 5
          && Math.abs(начало.y + начало.height / 2 + +m[2] - r.y - r.height / 2) < 5;
      });
    }, цель), 'Все карты улетают в центр панели победителя');
    for (const [width, height] of [[320, 640], [1920, 1080]]) {
      await p.setViewportSize({ width, height });
      await показать(); await p.waitForTimeout(1600);
      assert(await p.locator('#деберц-участники').evaluate(э => { const r = э.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
    }
    console.log('Движение: вылет от каждого бота, 1050 мс, сбор 750 мс, выделение хода/победителя и ширина панелей — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
