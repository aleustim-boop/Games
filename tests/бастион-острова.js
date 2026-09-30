'use strict';
const assert=require('node:assert/strict'),{chromium,безTelegram}=require('./браузер-робот.js');
(async()=>{const server=await require('./бастион-стенд.js')(),browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[],requests=[];
 await безTelegram(page);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/island-\d+-v6.webp/.test(r.url()))requests.push(r.url());});
 const url=server.url+'/'+encodeURIComponent('бастион')+'.html';await page.goto(url);await page.waitForFunction(()=>БастионИгра.готов());
 assert.equal(new Set(requests).size,1,'Первое открытие не скачивает все 12 полей');
 await page.evaluate(()=>{const draw=BastionField.prototype.draw;BastionField.prototype.draw=function(...args){window.qaField=this;return draw.apply(this,args);};});await page.click('#start');await page.waitForFunction(()=>window.qaField);
 const maps=await page.evaluate(async()=>{const result=[];for(let map=0;map<12;map++){const ok=await qaField.ensureMap(map);result.push({map,ok,url:BastionField.scene(map),cache:qaField.scenes.size});}return result;});
 assert(maps.every(m=>m.ok&&m.cache<=3),'Каждая сцена загружена, в памяти не больше трёх');assert.equal(new Set(maps.map(m=>m.url)).size,12);
 await page.click('#pause');await page.click('#to-lobby');
 // Недоступна именно выбранная новая сцена: восстановление не теряет расстановку.
 await page.evaluate(()=>{const s=Bastion.create(8);Bastion.build(s,1,'ballista');localStorage.setItem('bastion_save_v1',Bastion.snapshot(s));});
 await page.route('**/island-09-v6.webp',r=>r.abort());await page.reload();await page.click('#continue');await page.locator('#retry-scene').waitFor();
 assert.equal(await page.evaluate(()=>БастионИгра.состояние().time),0);assert(await page.locator('#launch').isDisabled());
 await page.unroute('**/island-09-v6.webp');await page.click('#retry-scene');await page.waitForFunction(()=>БастионИгра.готов());await page.click('#resume');
 assert.equal((await page.evaluate(()=>БастионИгра.состояние())).towers.length,1);assert(await page.locator('#launch').isEnabled());
 await page.click('#launch');await page.waitForFunction(()=>БастионИгра.состояние().time>.1);assert.deepEqual(errors,[]);
 // Медленная первая загрузка не разрешает бой на другом ещё не загруженном острове.
 const race=await browser.newPage();await безTelegram(race);race.on('pageerror',e=>errors.push(e.message));
 await race.addInitScript(()=>localStorage.setItem('bastion_profile_v1',JSON.stringify({version:1,records:{'0:normal':{stars:3,time:200}}})));
 let releaseFirst,releaseChosen,seenFirst,seenChosen;
 const firstReady=new Promise(r=>seenFirst=r),chosenReady=new Promise(r=>seenChosen=r),firstGate=new Promise(r=>releaseFirst=r),chosenGate=new Promise(r=>releaseChosen=r);
 await race.route('**/island-02-v6.webp',async r=>{seenFirst();await firstGate;await r.continue();});
 await race.route('**/island-01-v6.webp',async r=>{seenChosen();await chosenGate;await r.continue();});
 await race.goto(url,{waitUntil:'domcontentloaded'});await firstReady;
 await race.click('#choose-map');await race.click('[data-map="0"]');await race.click('#start');await chosenReady;
 releaseFirst();await race.waitForTimeout(250);assert.equal(await race.evaluate(()=>БастионИгра.готов()),false,'Загрузка прежнего острова не разблокировала выбранный');assert(await race.locator('#launch').isDisabled());
 releaseChosen();await race.waitForFunction(()=>БастионИгра.готов());await race.click('[data-pad="1"]');await race.click('#tower-panel [data-build="mortar"]');assert(await race.locator('#launch').isEnabled());assert.deepEqual(errors,[]);await race.close();
 console.log('12 отдельных сцен, отложенная загрузка, ограниченный кэш, ошибка и повтор без потери партии, гонка двух загрузок — пройдены.');
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
