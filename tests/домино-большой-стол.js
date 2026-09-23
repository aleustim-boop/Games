'use strict';
const assert = require('node:assert/strict');
const { chromium, подготовитьПодделку } = require('./браузер-робот');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const p = await browser.newPage({reducedMotion:'reduce'});
    await подготовитьПодделку(p,{версия:'9.0'});
    await p.goto('http://127.0.0.1:8137/домино.html');
    await p.evaluate(() => {
      ПоддельныйТелеграм.поменятьОтступы({системные:{top:24,bottom:16},содержимого:{top:48}});
      const rules=ДоминоПравила, v=rules.вид(rules.создать(4,150),0);
      // Стресс представления: все 28 костей, включая семь вертикальных дублей.
      v.цепь=rules.КОСТИ.map(([a,b],id)=>({a,b,id,кто:id%4}));
      window.testView=v;
      ИграПоСети.показатьВид({код:'layout',версия:1,домино:v});
    });
    const visible = selector => p.locator(selector).evaluate(root => {
      const box=root.getBoundingClientRect();
      return [...root.querySelectorAll('.дом-на-столе')].every(e=>{
        const r=e.getBoundingClientRect();
        return r.left>=box.left && r.right<=box.right+1 && r.top>=box.top && r.bottom<=box.bottom+1;
      });
    });
    for(const [width,height] of [[390,844],[320,640],[768,1024],[1280,720],[844,390]]) {
      await p.setViewportSize({width,height});
      await p.locator('#дом-увеличить').click();
      const modal=await p.locator('#дом-обзор').boundingBox();
      assert(modal.y>=72 && modal.y+modal.height<=height-16+1,'Диалог выходит под Telegram');
      assert.equal(await p.locator('#дом-цепь-большая .дом-на-столе').count(),28);
      if(width!==320 && height>520) assert(await visible('#дом-цепь-большая'),`28 костей не видны ${width}×${height}`);
      const overlaps=await p.locator('#дом-цепь-большая .дом-на-столе').evaluateAll(es=>{
        const rs=es.map(e=>e.getBoundingClientRect());
        return rs.some((a,i)=>rs.slice(i+1).some(b=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+1 && Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1));
      });
      assert(!overlaps,'Кости перекрываются');
      if(width===390) {
        await p.screenshot({path:'tests/снимки/домино-увеличенный-стол-390.png'});
        const bad=await p.addStyleTag({content:'#дом-цепь-большая {max-height:100px!important}'});
        assert.equal(await visible('#дом-цепь-большая'),false,'Проверка должна обнаруживать обрезку');
        await bad.evaluate(e=>e.remove());
        // Открытый обзор обновляется при приходе следующего состояния.
        await p.evaluate(()=>ИграПоСети.показатьВид({код:'layout',версия:2,домино:{...testView,цепь:testView.цепь.slice(0,27)}}));
        assert.equal(await p.locator('#дом-цепь-большая .дом-на-столе').count(),27);
        await p.evaluate(()=>ИграПоСети.показатьВид({код:'layout',версия:3,домино:testView}));
      }
      await p.getByRole('button',{name:'Вернуться к игре',exact:true}).click();
      if(width===1280) {
        const table=await p.locator('.дом-стол').boundingBox();
        assert(table.width>=800 && table.height>=450,'Стол остался маленьким');
        assert(await visible('#дом-цепь'),'28 костей не помещаются на основном столе компьютера');
        await p.screenshot({path:'tests/снимки/домино-большой-стол-1280.png'});
      }
    }
    // Перестройка цепи при повороте устройства с уже открытым обзором.
    await p.locator('#дом-увеличить').click();
    await p.setViewportSize({width:390,height:844});
    await p.waitForTimeout(100);
    assert(await visible('#дом-цепь-большая'));
    console.log('Большой стол: 4 игрока / 150, 28 костей, пять экранов, обновление и поворот обзора, отрицательный контроль — OK');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
