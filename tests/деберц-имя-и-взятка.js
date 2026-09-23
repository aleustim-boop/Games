'use strict';
const assert = require('node:assert/strict'), { chromium, безTelegram } = require('./браузер-робот');
const И = require('../server/игры/деберц'), П = require('../js/деберц-правила');
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/деберц.html');
    const game = И.раздать(null, { игроки: ['а', 'б'] }), g = game.игра;
    П.торг(g, g.ход, g.открытая.масть);
    for (let i = 0; i < 2; i++) П.сыграть(g, g.ход, П.доступные(g, g.ход)[0].id);
    g.объявления = [[{ название: 'Терц', очки: 20, масть: '♠', верх: 7 }], []]; g.бонусы = [20, 0];
    const viewer = game.игроки[1 - g.ход]; let version = 0;
    const render = async () => {
      const v = И.видДляИгрока(game, viewer, { код: 'TEST', версия: ++version, имяСоперника: 'Алексей' });
      assert.equal(v.деберц.имена[1], 'Алексей');
      // Старый сервер тоже может прислать заглушку: клиент берёт известное имя.
      v.деберц.имена[1] = 'Друг';
      await p.evaluate(v => ИграПоСети.показатьВид(v), v);
    };
    await render(); assert.equal(await p.locator('#деберц-имя-соперника').innerText(), 'Алексей');
    assert(await p.locator('#деберц-посмотреть-взятку').isDisabled());
    await p.locator('#деберц-показ-комбинаций').getByRole('button', { name: 'ОК', exact: true }).click();
    assert(!(await p.locator('#деберц-показ-комбинаций').isVisible()));
    await render(); assert(!(await p.locator('#деберц-показ-комбинаций').isVisible()));
    П.забрать(g); await render();
    await p.getByRole('button', { name: 'Последняя взятка', exact: true }).click();
    assert(await p.locator('#деберц-просмотр-взятки').isVisible());
    assert.equal(await p.locator('#деберц-просмотр-карты .карта').count(), 2);
    await p.getByRole('button', { name: 'Вернуться к игре', exact: true }).click();
    await p.locator('#деберц-назад').click(); await p.waitForURL('**/index.html');
    console.log('Деберц: настоящее имя, кнопка ОК, последняя взятка и возврат на витрину — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
