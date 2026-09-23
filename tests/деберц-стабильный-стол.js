'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот.js');
const И = require('../server/игры/деберц.js'), П = require('../js/деберц-правила.js');
(async () => {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ reducedMotion: 'reduce' }); await безTelegram(p);
    await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:8838');
    let версия = 0;
    for (const [width, height] of [[320,640],[390,844],[1280,720],[844,390]]) {
      await p.setViewportSize({ width, height });
      for (const режим of ['2','3','4','2x2']) {
        const n = режим === '2x2' ? 4 : +режим;
        const партия = И.раздать(null, { игроки: ['а','б','в','г'].slice(0,n), парами: режим === '2x2' });
        const и = партия.игра; П.торг(и, и.ход, и.открытая.масть);
        и.объявления = и.руки.map(() => []); и.белла.fill(false);
        let основа, карта;
        for (let ход = 0; ход <= n + 1; ход++) {
          // Бела появляется во время хода и не должна сдвигать сукно.
          if (ход === 2) { и.белаОбъявлена[0] = true; и.белаСтатус[0] = 'ждёт'; }
          await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(партия,'а',{ код:'STABLE', версия:++версия }));
          const замер = await p.evaluate(() => {
            const rect = э => { const r = э.getBoundingClientRect(); return [r.x,r.y,r.width,r.height].map(n => Math.round(n*10)/10); };
            return { поле: ['экран-игры','зона-стола','метка-козыря','рука-человека','панель-кнопок'].map(id => rect(document.getElementById(id))), карты: [...document.querySelectorAll('#стол .карта')].map(rect) };
          });
          основа ||= замер.поле;
          assert.deepEqual(замер.поле, основа, `${режим} ${width}×${height}, ход ${ход}: поле не меняет размер и положение`);
          if (ход && ход <= n) {
            карта ||= замер.карты[0];
            assert.deepEqual(замер.карты[0], карта, `${режим} ${width}×${height}, ход ${ход}: карта остаётся в своём месте и размере`);
            assert(замер.карты.every(к => к[2] === карта[2] && к[3] === карта[3]), 'Размер всех карт одинаков');
          }
          if (ход < n) П.сыграть(и, и.ход, П.доступные(и,и.ход)[0].id);
          else if (ход === n) П.забрать(и);
        }
      }
    }
    console.log('Стабильный стол: 4 режима × 4 экрана × все карты взятки — OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
