'use strict';
const assert = require('node:assert/strict');
const { chromium, подготовитьПодделку } = require('./браузер-робот');
const И = require('../server/игры/деберц');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ reducedMotion: 'reduce' });
    await подготовитьПодделку(p, { версия: '9.0' });
    await p.goto('http://127.0.0.1:8137/деберц.html');
    let версия = 0;
    for (const режим of ['2', '3', '4', '2x2']) {
      const g = И.раздать(null, { игроки: ['а', 'б', 'в', 'г'].slice(0, режим === '2x2' ? 4 : +режим), парами: режим === '2x2' });
      for (const [width, height] of [[390, 844], [320, 640], [844, 390]]) {
        await p.setViewportSize({ width, height });
        await p.evaluate(v => {
          ПоддельныйТелеграм.поменятьОтступы({ системные: { top: 24, bottom: 16 }, содержимого: { top: 48 } });
          ИграПоСети.показатьВид(v);
          document.querySelectorAll('.деберц-счёт-сторона > strong').forEach(e => e.textContent = '162/1001');
        }, И.видДляИгрока(g, 'а', { код: 'TEST', версия: ++версия }));
        const проверить = () => p.evaluate(() => {
          const errors = [];
          const score = document.querySelector('#деберц-текущий-счёт');
          if (!score || score.getBoundingClientRect().top < 72) errors.push('Счёт под панелью Telegram');
          const nodes = document.querySelectorAll('.деберц-счёт-сторона > strong, #карты-человека > .карта, #панель-кнопок > button');
          if (!nodes.length) errors.push('Нет проверяемых элементов');
          nodes.forEach(e => {
            const r = e.getBoundingClientRect();
            if (r.left < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight - 15) errors.push(`${e.tagName}: за границей окна ${r.bottom}`);
            if (e.tagName === 'STRONG') {
              const parent = e.parentElement.getBoundingClientRect();
              if (r.right > parent.right || e.scrollWidth > e.clientWidth + 1) errors.push('Цифры не помещаются');
              const min = document.querySelectorAll('.деберц-счёт-сторона').length <= 2 ? 28 : 15;
              if (parseFloat(getComputedStyle(e).fontSize) < min) errors.push('Мелкий счёт');
            }
          });
          return errors;
        });
        assert.deepEqual(await проверить(), [], `${режим}: ${width}×${height}`);
        if (режим === '2x2' && width === 390) {
          await p.screenshot({ path: 'tests/снимки/деберц-безопасный-счёт.png' });
          const broken = await p.addStyleTag({ content: '.деберц #приложение #экран-игры { padding-top: 6px !important; }' });
          assert((await проверить()).includes('Счёт под панелью Telegram'), 'Проверка ловит прежнее перекрытие');
          await broken.evaluate(e => e.remove());
        }
      }
    }
    console.log('Безопасная область Telegram и крупный счёт: 4 режима × 3 экрана; прежняя поломка обнаружена — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
