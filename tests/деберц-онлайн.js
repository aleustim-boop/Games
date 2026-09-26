'use strict';
const assert = require('node:assert/strict');
const { chromium, подготовитьПодделку } = require('./браузер-робот');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await подготовитьПодделку(p, { версия: '9.0' });
    await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8839');
    await p.evaluate(() => {
      window.вызовы = [];
      Сеть.открытыеСтолы = async () => ({ ок: true, узналиВас: true, столы: [{ ключ: 'test-seat', мест: 4, занято: 2, игроки: ['Анна', 'Иван'], ждётСекунд: 30 }] });
      Сеть.сестьЗаСтол = async key => { вызовы.push(key); ИграПоСети.экран('экран-комнаты'); return { ок: true }; };
    });
    await p.getByRole('button', { name: /Играть онлайн/ }).click();
    assert.equal(await p.locator('#экран-открытые-столы > h2').innerText(), 'Играть онлайн');
    await p.getByRole('button', { name: 'Сесть', exact: true }).click();
    assert.deepEqual(await p.evaluate(() => вызовы), ['test-seat']);
    await p.evaluate(() => ИграПоСети.экран('экран-лобби'));
    await p.locator('#лобби-найти-игру').click();
    await p.locator('#открытые-столы-код').click();
    assert(await p.locator('#поле-кода').isVisible());
    await p.evaluate(() => ИграПоСети.экран('экран-лобби'));
    await p.locator('#лобби-найти-игру').click();
    await p.locator('#открытые-столы-создать').click();
    await p.locator('[data-друзья-режим="2x2"]').click();
    await p.locator('[data-друзья-цель="1001"]').click();
    let body;
    await p.route('**/*', async route => {
      if (decodeURI(new URL(route.request().url()).pathname) === '/создать') {
        body = route.request().postDataJSON();
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ ошибка: 'Проверка тела запроса' }) });
      }
      return route.continue();
    });
    await p.locator('#кнопка-создать-игру').click();
    await p.waitForFunction(() => !document.getElementById('кнопка-создать-игру').disabled);
    assert(body, 'Запрос создания отправлен');
    assert.equal(body.открытый, true); assert.equal(body.игра, 'деберц');
    assert.equal(body.мест, 4); assert.equal(body.парами, true); assert.equal(body.цельДеберца, 1001);
    await p.evaluate(() => ИграПоСети.экран('экран-лобби'));
    await p.locator('#лобби-найти-игру').click();
    await p.getByRole('button', { name: 'Сесть', exact: true }).waitFor();
    await p.screenshot({ path: 'tests/снимки/деберц-онлайн.png' });
    /* Подделка Telegram (версия 9.0 выше) даёт системную стрелку «Назад» —
       по правилу сборника (style.css) нижняя кнопка #открытые-столы-назад
       в этом режиме скрыта намеренно (display:none), уходят стрелкой
       Telegram, а не кликом по ней. Тот же приём, что в
       tests/кнопки-назад-везде.js и tests/найти-игру-в-браузере.js. */
    await p.evaluate(() => window.ПоддельныйТелеграм.нажатьНазад());
    await p.getByRole('button', { name: /Играть с ботами/ }).click();
    assert(await p.locator('#деберц-настройки').isVisible());
    console.log('Онлайн: список, посадка, код, открытая комната 2×2 до 1001 и отдельный вход к ботам — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
