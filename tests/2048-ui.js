'use strict';
const assert=require('node:assert/strict'),R=require('../js/2048-rules'),{chromium,подготовитьПодделку,безTelegram}=require('./браузер-робот');
const base=process.env.GAME2048_BASE||'http://127.0.0.1:8137';
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()===404)missing.push(r.url());});
 await подготовитьПодделку(page,{версия:'8.0',отступы:{системные:{top:24,bottom:20},содержимого:{top:56}}});
 await page.addInitScript(()=>{const seed=sessionStorage.getItem('test2048');if(seed!==null){localStorage.setItem('game-2048-v1',seed);sessionStorage.removeItem('test2048');}});
 await page.goto(base+'/2048.html');await page.locator('.cover img').evaluate(e=>e.decode());
 await page.screenshot({path:'tests/снимки/2048-лобби-390.png',fullPage:true,animations:'disabled'});await page.locator('#play').click();
 assert.equal(await page.locator('.tile').count(),2);assert(await page.locator('#undo').isDisabled());
 await page.locator('[data-dir="right"]').click();await page.waitForTimeout(170);await page.locator('[data-dir="down"]').click();await page.waitForTimeout(170);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('game-2048-v1')));assert(saved.moves>0);
 await page.reload();await page.locator('#play').click();assert.equal(await page.locator('#moves').innerText(),String(saved.moves));
 await page.locator('#undo').click();assert.equal(await page.locator('#moves').innerText(),String(saved.moves-1));
 await page.locator('#settings').click();await page.getByLabel('Анимации и искры').uncheck();await page.getByRole('button',{name:'Готово',exact:true}).click();assert(await page.locator('body').evaluate(e=>e.classList.contains('no-effects')));
 // Load a reproducible midgame through the same persisted state path used on restart.
 const sample={...R.create(15),board:[2,2,8,16,4,8,32,64,0,16,128,256,0,0,512,1024],score:8240,moves:210};
 await page.evaluate(s=>sessionStorage.setItem('test2048',JSON.stringify(s)),sample);await page.reload();await page.locator('#play').click();
 await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#score').innerText(),'8 244');assert.equal(await page.locator('#moves').innerText(),'211');
 for(const [width,height]of [[320,740],[390,844],[430,932],[768,1024],[1024,768],[1440,900]]){
  await page.setViewportSize({width,height});await page.screenshot({path:`tests/снимки/2048-поле-${width}.png`,fullPage:true,animations:'disabled'});
  const layout=await page.locator('#board').evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,overflow:document.documentElement.scrollWidth>innerWidth+1,tiles:[...document.querySelectorAll('.tile')].every(t=>{const b=t.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom;})};});
  assert(!layout.overflow);assert(Math.abs(layout.width-layout.height)<1);assert(layout.width>=280);assert(layout.tiles);
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#board').scrollIntoViewIfNeeded();
 const board=await page.locator('#board').boundingBox(),moves=Number(await page.locator('#moves').innerText());
 await page.mouse.move(board.x+board.width*.7,board.y+board.height*.5);await page.mouse.down();await page.mouse.move(board.x+board.width*.2,board.y+board.height*.5,{steps:5});await page.mouse.up();assert(Number(await page.locator('#moves').innerText())>=moves);
 await page.locator('#new').click();await page.getByRole('button',{name:'Продолжить текущую'}).click();assert.equal(await page.locator('#dialog').isVisible(),false);
 await page.evaluate(s=>sessionStorage.setItem('test2048',JSON.stringify(s)),{...R.create(15),board:[1024,1024,...Array(14).fill(0)]});await page.reload();await page.locator('#play').click();await page.keyboard.press('ArrowLeft');assert.match(await page.locator('#dialog-title').innerText(),/2048/);await page.getByRole('button',{name:'Продолжить к 4096'}).click();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#moves').innerText(),'2');
 await page.evaluate(s=>sessionStorage.setItem('test2048',JSON.stringify(s)),{...R.create(15),board:[2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]});await page.reload();await page.locator('#play').click();assert.match(await page.locator('#dialog').innerText(),/Ходов больше нет/);await page.getByRole('button',{name:'Новая игра',exact:true}).last().click();assert.equal(await page.locator('#moves').innerText(),'0');
 await page.evaluate(()=>sessionStorage.setItem('test2048','broken'));await page.reload();await page.locator('#play').click();assert.equal(await page.locator('.tile').count(),2);
 await page.goto(base+'/index.html');await page.locator('[data-фильтр="головоломки"]').click();await page.locator('[data-игра="2048"]').click();await page.waitForURL('**/2048.html');
 const desktop=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await безTelegram(desktop);await desktop.goto(base+'/2048.html');await desktop.locator('.cover img').evaluate(e=>e.decode());await desktop.screenshot({path:'tests/снимки/2048-лобби-1440.png',animations:'disabled'});await desktop.locator('#play').click();assert(await desktop.locator('body').evaluate(e=>e.classList.contains('no-effects')));assert(await desktop.locator('#back').isVisible());
 const animated=await browser.newPage({viewport:{width:390,height:844}});await безTelegram(animated);await animated.addInitScript(s=>localStorage.setItem('game-2048-v1',JSON.stringify(s)),{...R.create(15),board:[2,2,...Array(14).fill(0)]});await animated.goto(base+'/2048.html');await animated.locator('#play').click();
 const area=await animated.locator('#board').boundingBox();await animated.mouse.move(area.x+area.width*.8,area.y+area.height*.5);await animated.mouse.down();await animated.mouse.move(area.x+area.width*.2,area.y+area.height*.5,{steps:5});await animated.mouse.up();await animated.locator('.tile.merged').waitFor();assert.equal(await animated.locator('#score').innerText(),'4');assert(await animated.locator('.spark').count()>0);
 await animated.locator('#undo').click();assert.equal(await animated.locator('#score').innerText(),'0');assert.equal(await animated.locator('.tile').count(),2);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('2048 UI: catalog, Telegram safe areas, 6 sizes, keyboard/swipe, saving, undo, settings, win/continue, loss/restart, corrupt save — OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
