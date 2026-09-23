'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const И = require('../server/игры/деберц.js');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await безTelegram(p); await p.goto('http://127.0.0.1:8137/деберц.html');
    const партия = И.раздать(null, { игроки: ['а','б'] });
    const и = партия.игра;
    const к = имя => ({ имя, масть: '♣', id: '♣' + имя });
    Object.assign(и, { фаза: 'взятка', ход: 0, козырь: '♥', заказчик: 1, стол: [{ игрок: 0, карта: к('7') }, { игрок: 1, карта: к('Т') }], объявления: [[],[]] });
    await p.evaluate(() => { window.проверкаХодов = []; window.Сеть.отправитьХод = async ход => { window.проверкаХодов.push(ход); return { принято: true }; }; });
    const показать = async версия => p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(партия, 'а', { код: 'TURN', версия }));
    await показать(1);
    assert.equal(await p.locator('#деберц-чей-ход').innerText(), 'Взятка: Друг');
    assert.equal(await p.getByRole('button', { name: 'Забрать взятку', exact: true }).count(), 0);
    assert.equal(await p.locator('#подсказка.деберц-подсказка--ваша').count(), 0);
    await p.waitForFunction(() => window.проверкаХодов.length === 1);
    assert.deepEqual(await p.evaluate(() => window.проверкаХодов), [{ действие: 'взятка' }]);
    и.фаза = 'игра'; и.стол = []; и.ход = 0; await показать(2);
    assert.equal(await p.locator('#деберц-чей-ход').innerText(), 'Ваш ход');
    assert.equal(await p.locator('#подсказка.деберц-подсказка--ваша').count(), 1);
    assert(await p.locator('#деберц-чей-ход').evaluate(э => parseFloat(getComputedStyle(э).fontSize) >= 18));
    await p.screenshot({ path: 'tests/снимки/деберц-ваш-ход.png' });
    и.ход = 1; await показать(3);
    assert.equal(await p.locator('#деберц-чей-ход').innerText(), 'Ходит Друг');
    assert.equal(await p.locator('#подсказка.деберц-подсказка--ваша').count(), 0);
    console.log('Указатель хода: выделение своего хода, победитель чужой взятки и автоматический сбор — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
