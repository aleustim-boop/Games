'use strict';
const assert = require('node:assert/strict');
const нажатьКарту = require('./деберц-нажать-карту.js');
const { chromium, безTelegram } = require('./браузер-робот.js');
const адрес = 'http://127.0.0.1:' + (process.argv[2] || '8137') + '/деберц.html?server=' + encodeURIComponent('http://127.0.0.1:' + (process.argv[3] || '8837'));
(async () => {
  const браузер = await chromium.launch({ headless: true });
  try {
    const страницы = [];
    const ошибки = [];
    for (let i = 0; i < 2; i++) {
      const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 } });
      const с = await контекст.newPage(); await безTelegram(с);
      с.on('pageerror', e => { ошибки.push(e.message); console.error('Ошибка страницы:', e.stack); });
      с.on('console', m => { if (m.type() === 'warning') { ошибки.push(m.text()); console.error(m.text()); } });
      await с.goto(адрес); страницы.push(с);
      await с.locator('#кнопка-с-другом').click();
    }
    const [а, б] = страницы;
    await а.locator('[data-друзья-цель="501"]').click();
    await а.locator('#кнопка-создать-игру').click();
    await а.waitForFunction(() => /^[A-Z0-9]{4,6}$/.test(document.getElementById('код-комнаты').textContent));
    const код = await а.locator('#код-комнаты').textContent();
    await б.locator('#кнопка-войти-по-коду').click();
    await б.locator('#поле-кода').fill(код);
    await б.locator('#кнопка-войти').click();
    await Promise.all(страницы.map(с => с.locator('#экран-игры').waitFor({ state: 'visible' })));
    for (const с of страницы) assert.equal(await с.locator('#деберц-цель-стола').textContent(), '501');
    for (const с of страницы) assert.equal(await с.locator('#деберц-имя-соперника').textContent(), 'Друг');
    let конец = false;
    let перезагружено = false;
    let сведенияПроверены = false;
    for (let шаг = 0; шаг < 1500; шаг++) {
      if (шаг === 6) {
        await а.reload();
        if (!(await а.locator('#экран-игры').isVisible())) {
          await а.locator('#кнопка-с-другом').click();
        }
        await а.locator('#экран-игры').waitFor({ state: 'visible' });
        перезагружено = true;
      }
      if (await а.getByRole('button', { name: 'Реванш', exact: true }).isVisible()) { конец = true; break; }
      if (!сведенияПроверены && await а.locator('#деберц-последняя-карты .карта').count() === 2
          && await а.getByRole('button', { name: 'За столом', exact: true }).isVisible()) {
        await а.getByRole('button', { name: 'За столом', exact: true }).click();
        assert.match(await а.locator('#деберц-очки-я').textContent(), /^\d+$/);
        assert.match(await а.locator('#деберц-очки-друг').textContent(), /^\d+$/);
        await а.locator('#деберц-сведения form button').click();
        сведенияПроверены = true;
      }
      let нажали = false;
      for (const с of страницы) {
        const кнопка = с.locator('#панель-кнопок button:enabled:not(.кнопка--инфо), #деберц-итог-действия button:enabled').first();
        const карта = с.locator('#карты-человека button:enabled').first();
        if (await кнопка.isVisible() && !['Реванш', 'В лобби'].includes(await кнопка.textContent())) { await кнопка.click(); нажали = true; break; }
        if (await карта.isVisible()) { await нажатьКарту(с, карта); нажали = true; break; }
      }
      if (!нажали) await а.waitForTimeout(30);
    }
    if (!конец) for (let i = 0; i < страницы.length; i++) await страницы[i].screenshot({ path: 'tests/снимки/деберц-сеть-ошибка-' + i + '.png' });
    assert(конец, 'В двух браузерах сыграна полная партия');
    assert(перезагружено, 'Комната восстановлена после перезагрузки');
    assert(сведенияПроверены, 'Сетевые очки и последняя взятка доступны');
    for (const с of страницы) await с.getByRole('button', { name: 'Реванш', exact: true }).click();
    await а.waitForFunction(() => document.getElementById('счёт-я').textContent === '0');
    for (const с of страницы) assert.equal(await с.locator('#деберц-цель-стола').textContent(), '501');
    await а.getByRole('button', { name: 'За столом', exact: true }).click();
    await а.locator('#деберц-сдаться').click();
    await а.locator('#деберц-сдаться-да').click();
    await б.waitForFunction(() => document.getElementById('деберц-статус').textContent.includes('Вы победили'));
    await а.getByRole('button', { name: 'В лобби', exact: true }).click();
    assert(await а.locator('#деберц-боты').isVisible());
    await б.getByRole('button', { name: 'В лобби', exact: true }).click();
    assert.deepEqual(ошибки, []);
    console.log('Деберц: два браузера — выбор 501, создание, код, полная партия, реванш, сдача и выход — OK');
  } finally { await браузер.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
