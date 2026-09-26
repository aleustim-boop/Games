'use strict';
const assert=require('node:assert/strict'),F=require('../js/2048-falling'),{chromium,подготовитьПодделку}=require('./браузер-робот');
const base=process.env.GAME2048_BASE||'http://127.0.0.1:8137';
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await подготовитьПодделку(page,{версия:'8.0',отступы:{системные:{top:24,bottom:20},содержимого:{top:56}}});
 await page.clock.install();await page.goto(base+'/2048.html');await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
 await page.locator('.cover img').evaluate(e=>e.decode());await page.screenshot({path:'tests/снимки/2048-выбор-режима.png',fullPage:true,animations:'disabled'});
 await page.locator('button[data-mode=falling]').click();assert.equal(await page.locator('button[data-mode=falling]').getAttribute('aria-pressed'),'true');await page.locator('#play').click();assert.equal(await page.locator('.cell').count(),35);assert.equal(await page.locator('.falling-active').count(),1);
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('game-2048-falling-v1')));
 assert.equal((await saved()).active.y,0);await page.clock.runFor(900);assert.equal((await saved()).active.y,1);
 await page.keyboard.press('ArrowLeft');assert.equal((await saved()).active.x,1);
 await page.locator('#pause').click();const stopped=await saved();await page.clock.runFor(3000);assert.deepEqual(await saved(),stopped);assert(await page.locator('#resume').isVisible());await page.locator('#resume').click();
 await page.keyboard.press('Space');await page.clock.runFor(160);assert.equal((await saved()).moves,1);assert.equal((await saved()).board.filter(Boolean).length,1);
 await page.locator('#undo').click();assert.equal((await saved()).moves,0);assert.equal((await saved()).board.filter(Boolean).length,0);
 await page.locator('#game-help').click();const beforeHelp=await saved();await page.clock.runFor(3000);assert.deepEqual(await saved(),beforeHelp);assert.match(await page.locator('#dialog').innerText(),/Линии не удаляются/);await page.getByRole('button',{name:'Понятно'}).click();
 await page.locator('#drop').click();await page.clock.runFor(160);const beforeReload=await saved();await page.reload();await page.locator('#play').click();assert(await page.locator('#resume').isVisible());assert.deepEqual((await saved()).board,beforeReload.board);
 await page.evaluate(()=>ПоддельныйТелеграм.нажатьНазад());await page.locator('button[data-mode=classic]').click();await page.locator('#play').click();assert.equal(await page.locator('.cell').count(),16);assert.equal(await page.locator('.tile').count(),2);assert(await page.locator('#drop').isHidden());
 await page.evaluate(()=>ПоддельныйТелеграм.нажатьНазад());await page.locator('button[data-mode=falling]').click();await page.locator('#play').click();assert.equal((await saved()).moves,1);
 await page.addInitScript(s=>{const fixture=sessionStorage.getItem('falling-test');if(fixture){localStorage.setItem('game-2048-falling-v1',fixture);sessionStorage.removeItem('falling-test');}},null);
 const fixture=F.create(15);fixture.board[32]=4;fixture.board[27]=2;fixture.active={x:2,y:0,value:2};
 await page.evaluate(s=>sessionStorage.setItem('falling-test',JSON.stringify(s)),fixture);await page.reload();await page.locator('#play').click();await page.locator('#resume').click();await page.locator('#drop').click();await page.clock.runFor(180);assert.equal((await saved()).score,12);assert.match(await page.locator('#falling-status').innerText(),/Цепочка × 2/);assert(await page.locator('.spark').count()>0);
 for(const [neighbors,expected,blocks]of [[{31:8,33:8},32,3],[{26:8,28:8,31:2,32:8,33:4},64,4]]){
  const bonus=F.create(15);bonus.board.fill(0);for(const [i,n]of Object.entries(neighbors))bonus.board[i]=n;bonus.active={x:2,y:0,value:8};
  await page.evaluate(s=>sessionStorage.setItem('falling-test',JSON.stringify(s)),bonus);await page.reload();await page.locator('#play').click();await page.locator('#resume').click();await page.locator('#drop').click();await page.clock.runFor(180);
  assert.equal((await saved()).board[32],expected);assert.equal((await saved()).score,expected);assert.equal(await page.locator('#merge-bonus').innerText(),`БОНУС! ${blocks} × 8 → ${expected}`);assert(await page.locator('#merge-bonus').isVisible());
  await page.screenshot({path:`tests/снимки/2048-бонус-${expected}.png`,fullPage:true,animations:'disabled'});
  await page.locator('#undo').click();assert.equal((await saved()).score,0);assert(await page.locator('#merge-bonus').isHidden());
 }
 await page.locator('#pause').click();await page.locator('#resume').click();
 for(const [width,height]of [[320,740],[390,844],[430,932],[768,1024],[1024,768],[1440,900]]){
  await page.setViewportSize({width,height});await page.clock.runFor(50);await page.screenshot({path:`tests/снимки/2048-падение-${width}.png`,fullPage:true,animations:'disabled'});
  const layout=await page.locator('#board').evaluate(e=>{const r=e.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,width:r.width,height:r.height,fit:[...document.querySelectorAll('.tile')].every(t=>{const b=t.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1;})};});assert(!layout.overflow);assert(layout.width>=250);assert(Math.abs(layout.width/layout.height-5/7)<.01);assert(layout.fit);
 }
 // On phone, a tap chooses a column; a downward swipe drops, not just a single tick.
 await page.setViewportSize({width:390,height:844});await page.locator('#board').scrollIntoViewIfNeeded();const b=await page.locator('#falling-layer').boundingBox();await page.mouse.click(b.x+b.width*.1,b.y+b.height*.3);assert.equal((await saved()).active.x,0);
 const count=(await saved()).moves;await page.mouse.move(b.x+b.width*.1,b.y+30);await page.mouse.down();await page.mouse.move(b.x+b.width*.1,b.y+120);await page.mouse.up();await page.clock.runFor(170);assert.equal((await saved()).moves,count+1);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await saved();await page.clock.runFor(5000);assert.deepEqual(await saved(),hidden);assert(await page.locator('#resume').isVisible());
 assert.deepEqual(errors,[]);console.log('Falling UI: mode separation, auto fall, keyboard/tap/swipe/drop, chain effects, pause/help/background, resume, six sizes — OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
