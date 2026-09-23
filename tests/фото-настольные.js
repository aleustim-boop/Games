'use strict';
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот');
(async () => {
  const browser = await chromium.launch({ headless:true });
  try {
    const p = await browser.newPage({ reducedMotion:'reduce' }); await безTelegram(p);
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    for (const [game, prefix] of [['домино','дом'],['морской-бой','море']]) {
      await p.setViewportSize({ width:390, height:844 });
      await p.goto('http://127.0.0.1:8137/' + game + '.html');
      await p.locator('.фото-лобби__обложка img').evaluate(img => img.decode());
      assert.equal(await p.locator('#экран-лобби .нижняя-вкладка').count(), 3);
      await p.locator('#лобби-правила').click();
      await p.locator(`#${prefix}-справка`).waitFor();
      await p.keyboard.press('Escape');
      await p.locator('#лобби-профиль').click();
      await p.locator('#экран-профиля-игрока.экран--виден').waitFor();
      await p.goto('http://127.0.0.1:8137/' + game + '.html');
      await p.locator(`#${prefix}-боты`).click(); await p.locator(`#${prefix}-начать`).click();
      if (prefix === 'море') { await p.locator('#море-случайно').click(); await p.locator('#море-готов').click(); }
      for (const [width,height] of [[320,640],[390,844],[768,1024],[1280,720],[844,390]]) {
        await p.setViewportSize({ width,height });
        if (prefix === 'дом') {
          // Стабильная рука из 7 костей, отключаем таймер соперника переходом в меню.
          await p.evaluate(() => {
            ИграПоСети.вМеню(); ИграПоСети.экран('экран-игры');
            const root = document.querySelector('#дом-рука'); root.style.setProperty('--костей',7);
            root.replaceChildren(...ДоминоПравила.КОСТИ.slice(0,7).map(t => ДоминоКости.кость(...t,true)));
            ДоминоКости.цепь(document.querySelector('#дом-цепь'), ДоминоПравила.КОСТИ.map(([a,b],id) => ({a,b,id})), null);
          });
          const check = () => p.evaluate(() => {
            const hand = document.querySelector('#дом-рука').getBoundingClientRect();
            const tiles = [...document.querySelectorAll('#дом-рука .дом-кость')].map(e => e.getBoundingClientRect());
            return tiles.length === 7 && tiles.every(r => r.top >= hand.top && r.bottom <= hand.bottom + 1 && r.left >= hand.left && r.right <= hand.right + 1);
          });
          // На горизонтальном телефоне малая рука может прокручиваться; портретная семёрка видна целиком.
          if (height > width) assert(await check(), `Семь костей обрезаны ${width}×${height}`);
          const overlap = await p.locator('#дом-цепь .дом-на-столе').evaluateAll(es => {
            const rs = es.map(e => e.getBoundingClientRect());
            return rs.some((a,i) => rs.slice(i+1).some(b => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
          });
          assert.equal(overlap,false,'Кости в цепи перекрываются');
          if (width === 390) {
            const bad = await p.addStyleTag({content:'#дом-рука .дом-кость { height:1000px!important; }'});
            assert.equal(await check(),false,'Проверка должна находить обрезанную руку'); await bad.evaluate(e=>e.remove());
          }
        }
        await p.screenshot({path:`tests/снимки/фото-проверка-${prefix}-${width}.png`});
      }
    }
    assert.deepEqual(errors,[]); console.log('Фото: профиль/правила, 5 экранов, семёрка целиком, цепь без наложений; намеренная обрезка обнаружена — OK');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
