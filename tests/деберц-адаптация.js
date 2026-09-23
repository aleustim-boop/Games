'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const И = require('../server/игры/деберц.js'), П = require('../js/деберц-правила.js');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ reducedMotion: 'reduce' }); const ошибки = [];
    p.on('pageerror', e => ошибки.push(e.message)); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8838');
    for (const [width, height] of [[320, 640], [390, 844], [1280, 720]]) {
      await p.setViewportSize({ width, height });
      await p.locator('#деберц-боты').scrollIntoViewIfNeeded();
      assert(await p.locator('#деберц-боты').evaluate(э => { const r = э.getBoundingClientRect(); const низ = document.querySelector('#экран-лобби .нижние-вкладки')?.getBoundingClientRect().top ?? innerHeight; return r.bottom <= низ + 1; }), 'Кнопка ботов не закрыта навигацией');
      await p.screenshot({ path: `tests/снимки/деберц-адаптация-лобби-${width}.png` });
    }
    let версия = 0;
    for (const режим of ['2', '3', '4', '2x2']) {
      const n = режим === '2x2' ? 4 : +режим;
      const п = И.раздать(null, { игроки: ['а', 'б', 'в', 'г'].slice(0, n), парами: режим === '2x2' });
      П.торг(п.игра, п.игра.ход, п.игра.открытая.масть);
      for (let i = 0; i < n; i++) П.сыграть(п.игра, п.игра.ход, П.доступные(п.игра, п.игра.ход)[0].id);
      for (const [width, height] of [[320, 640], [390, 844], [768, 844], [1280, 720], [1920, 1080], [844, 390]]) {
        await p.setViewportSize({ width, height });
        await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
        const ошибкиГраниц = await p.evaluate(() => {
          const ошибки = [];
          for (const э of document.querySelectorAll('#карты-человека > .карта, #панель-кнопок > button')) {
            const r = э.getBoundingClientRect(); if (r.left < -1 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1) ошибки.push([э.id || э.getAttribute('aria-label'), r.toJSON()]);
          }
          const карты = [...document.querySelectorAll('#стол .карта')].map(э => э.getBoundingClientRect());
          const козырь = document.querySelector('#метка-козыря').getBoundingClientRect();
          const сукно = document.querySelector('#зона-стола').getBoundingClientRect();
          if (козырь.top < сукно.top || козырь.bottom > сукно.bottom) ошибки.push(['Козырь вне стола']);
          for (const э of document.querySelectorAll('#стол .деберц-подпись-карты > span')) {
            const r = э.getBoundingClientRect(); if (карты.some(к => r.left < к.right && r.right > к.left && r.top < к.bottom && r.bottom > к.top)) ошибки.push(['Имя перекрывает карту', r.toJSON()]);
            if (r.top < козырь.bottom && r.right > козырь.left && r.left < козырь.right) ошибки.push(['Имя перекрывает козырь', r.toJSON()]);
          }
          return ошибки;
        });
        await p.screenshot({ path: `tests/снимки/деберц-адаптация-${режим}-${width}.png` });
        assert.deepEqual(ошибкиГраниц, [], `${режим} ${width}×${height}: рука, кнопки и подписи`);
      }
    }
    await p.locator('#кнопка-эмоции').click();
    assert(await p.getByRole('dialog', { name: 'Сказать за столом' }).isVisible());
    await p.locator('#экран-эмоций').getByRole('button', { name: 'Фразы', exact: true }).click();
    assert.equal(await p.locator('#экран-эмоций .ряд-знаков button').count(), 11);
    await p.locator('#экран-эмоций').getByRole('button', { name: 'Кинуть', exact: true }).click();
    assert.equal(await p.locator('#экран-эмоций .ряд-знаков img').count(), 15);
    await p.close();
    const л = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await безTelegram(л); await л.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8838');
    await л.locator('#деберц-боты').click(); await л.locator('#деберц-начать').click();
    await л.locator('#кнопка-эмоции').click();
    assert.equal(await л.locator('#ряд-эмоций button').count(), 12);
    const сетка = await л.locator('#ряд-эмоций').evaluate(э => getComputedStyle(э).gridTemplateColumns.split(' ').length);
    assert.equal(сетка, 6, 'Смайлики в шесть колонок, как в Дураке');
    await л.screenshot({ path: 'tests/снимки/деберц-сказать-эталон.png' });
    await л.locator('#экран-эмоций').getByRole('button', { name: 'Фразы', exact: true }).click();
    await л.locator('#экран-эмоций').getByRole('button', { name: 'Привет!', exact: true }).click();
    assert.equal(await л.locator('#знаки-внимания').innerText(), 'Вы\nПривет!');
    assert(await л.locator('#знаки-внимания').evaluate(э => { const r = э.getBoundingClientRect(); return Math.abs(r.y + r.height / 2 - innerHeight / 2) < 2 && r.right > innerWidth - 30; }), 'Реплика справа по центру, как в Дураке');
    await л.screenshot({ path: 'tests/снимки/деберц-реплика-эталон.png' });
    assert(!(await л.locator('#экран-эмоций').isVisible()));
    assert.deepEqual(ошибки, []);
    console.log('Адаптация: 4 режима × 6 экранов, вся рука и кнопки видны, имена не перекрывают карты, лобби и меню Сказать — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
