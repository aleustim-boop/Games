'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const И = require('../server/игры/деберц.js');
const П = require('../js/деберц-правила.js');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ reducedMotion: 'reduce' }); const ошибки = [];
    p.on('pageerror', e => ошибки.push(e.message)); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8838');
    let версия = 0;
    const п = И.раздать(null, { игроки: ['а', 'б', 'в', 'г'], парами: true });
    const и = п.игра; П.торг(и, и.ход, и.открытая.масть);
    Object.assign(и, { очки: [17, 4, 21, 5], бонусы: [20, 0, 0, 0], взятки: [1, 1, 1, 0], счёт: [68, 142] });
    for (let i = 0; i < 4; i++) П.сыграть(и, и.ход, П.доступные(и, и.ход)[0].id);
    // Для макета счёта исключаем случайное объявление белы на этой взятке.
    и.белаСтатус.fill(null); и.белаОбъявлена.fill(false);
    и.объявления = [[{ название: 'Терц', очки: 20, масть: '♠', верх: 7 }], [], [], []];
    const текущиеВзятки = и.взятки.slice(); и.взятки.fill(0);
    assert(П.показКомбинаций(и), 'Терц показывается до сбора первой взятки');
    assert.equal(И.задержкаБота(п), 6000, 'Бот даёт время рассмотреть комбинацию');
    const показать = () => p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
    await показать();
    assert(await p.locator('#деберц-показ-комбинаций').isVisible());
    assert.deepEqual(await p.locator('.деберц-карты-комбинации > span').allTextContents(), ['Д♠', 'К♠', 'Т♠']);
    и.взятки = текущиеВзятки;
    for (const [width, height] of [[320, 640], [390, 844], [1440, 1000]]) {
      await p.setViewportSize({ width, height }); await показать();
      assert.deepEqual(await p.locator('.деберц-счёт-сторона > strong').allTextContents(), ['58/68', '9/142']);
      assert.match(await p.locator('.деберц-счёт-сторона').first().innerText(), /Ваша команда/);
      assert(await p.locator('#метка-козыря').evaluate(э => {
        const r = э.getBoundingClientRect();
        return [...document.querySelectorAll('#стол .деберц-подпись-карты > span')].every(с => с.getBoundingClientRect().top > r.bottom);
      }), 'Подписи карт ниже отдельной полосы козыря');
      await p.screenshot({ path: `tests/снимки/деберц-счёт-${width}.png` });
    }
    П.забрать(и); await показать();
    assert(!(await p.locator('#деберц-показ-комбинаций').isVisible()), 'После сбора взятки показ закрыт');
    const суммы = П.суммы(и, и.очки).map((n, i) => n + (i ? 0 : 20));
    assert.deepEqual(await p.locator('.деберц-счёт-сторона > strong').allTextContents(), суммы.map((n, i) => n + '/' + и.счёт[i]), 'Счёт обновился после взятки');
    Object.assign(и, { фаза: 'итог', ход: 0, белла: [false, false, false, false], руки: [[], [], [], []], очки: [17, 4, 21, 5], счёт: [135, 142], итог: { сырые: [58, 9], запись: [67, 0], описание: 'Байт' } });
    и.номер = 3;
    и.историяРаздач = [
      { номер: 1, запись: [40, 80], счёт: [40, 80] },
      { номер: 2, запись: [28, 62], счёт: [68, 142] },
      { номер: 3, запись: [67, 0], счёт: [135, 142] }
    ];
    const чужой = И.видДляИгрока(п, 'б', { код: 'TEST' }).деберц;
    assert.deepEqual(чужой.историяРаздач[0].запись, [80, 40], 'История поворачивается к команде зрителя');
    for (const [width, height] of [[320, 640], [390, 844], [1440, 1000]]) {
      await p.setViewportSize({ width, height }); await показать();
      assert.deepEqual(await p.locator('.деберц-итог-прибавка').allTextContents(), ['+67', '+0']);
      assert.deepEqual(await p.locator('.деберц-итог-счёт td strong').allTextContents(), ['135', '142']);
      assert(await p.locator('#экран-результата').evaluate(э => э.scrollWidth <= э.clientWidth), 'Таблица не выходит за экран');
      assert(await p.locator('#экран-результата').evaluate(э => { const r = э.getBoundingClientRect(); return Math.abs(r.x + r.width / 2 - innerWidth / 2) < 2 && Math.abs(r.y + r.height / 2 - innerHeight / 2) < 2; }), 'Итог точно по центру');
      assert.equal(await p.locator('#текст-результата').innerText(), 'Раздача №3');
      assert.equal(await p.locator('.деберц-результат-команды').count(), 2);
      await p.screenshot({ path: `tests/снимки/деберц-итог-${width}.png` });
      assert(!(await p.locator('.деберц-история-раздач').isVisible()), 'История скрыта до раскрытия');
      await p.locator('.деберц-расчёт summary').click();
      assert.deepEqual(await p.locator('.деберц-история-раздач tbody th').allTextContents(), ['Раздача 1', 'Раздача 2', 'Раздача 3']);
      assert.deepEqual(await p.locator('.деберц-история-раздач tbody td').allTextContents(), ['+40', '+80', '+28', '+62', '+67', '+0']);
      assert(await p.locator('#экран-результата').evaluate(э => э.scrollWidth <= э.clientWidth), 'Раскрытая история помещается по ширине');
      await p.screenshot({ path: `tests/снимки/деберц-история-${width}.png` });
    }
    assert.deepEqual(ошибки, []);
    console.log('Счёт команды в сдаче, обновление после взятки, итог байта и отсутствие пересечения подписей с козырем — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
