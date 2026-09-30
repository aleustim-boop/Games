'use strict';
const assert=require('node:assert/strict');
const {chromium,безTelegram}=require('./браузер-робот.js');
(async()=>{const server=await require('./бастион-стенд.js')(),browser=await chromium.launch({headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await безTelegram(page);page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 const url=server.url+'/'+encodeURIComponent('бастион')+'.html';await page.goto(url);await page.waitForFunction(()=>БастионИгра.готов());
 await page.click('#start');assert(await page.locator('#coach').isVisible());assert.equal(await page.locator('.pad.guide').count(),1);
 await page.click('[data-pad="1"]');await page.click('#tower-panel-mobile [data-build="mortar"]');await page.click('[data-pad="1"]');await page.click('#tower-panel-mobile [data-priority="strong"]');assert.equal((await page.evaluate(()=>БастионИгра.состояние())).towers[0].priority,'strong');
 await page.click('#tower-panel-mobile [data-upgrade="-1"]');await page.click('[data-pad="1"]');assert((await page.locator('.shortfall').first().textContent()).includes('95'),'Показана точная нехватка средств');await page.click('#close-build');
 await page.evaluate(()=>{const original=BastionField.prototype.draw;BastionField.prototype.draw=function(...args){window.qaField=this;return original.apply(this,args);};});await page.clock.runFor(30);
 for(const [width,height] of [[320,740],[390,844],[820,1180],[844,390],[1440,1000]]){
  await page.setViewportSize({width,height});await page.clock.runFor(200);
  const geometry=await page.evaluate(()=>{const f=qaField,s=БастионИгра.состояние(),box=document.querySelector('#field').getBoundingClientRect();return Bastion.pads(s.map).map((p,i)=>{const a=f.screenPoint(p),b=f.worldPoint(a.x,a.y),button=document.querySelector('[data-pad="'+i+'"]').getBoundingClientRect();return {round:Math.hypot(p.x-b.x,p.y-b.y),x:Math.abs(button.x+button.width/2-box.x-a.x*box.width),y:Math.abs(button.y+button.height/2-box.y-a.y*box.height)};});});
  assert(geometry.every(g=>g.round<.001&&g.x<1&&g.y<1),'Касание соответствует центру площадки '+width);
 }
 await page.click('#pause');await page.click('#to-lobby');await page.evaluate(()=>{const R=Bastion,s=R.create(7);s.gold=3000;for(const [pad,type,branch] of [[0,'ballista',0],[1,'mortar',1],[2,'tide',0],[3,'storm',1],[6,'fire',0]]){R.build(s,pad,type);R.upgrade(s,pad);R.upgrade(s,pad,branch);}s.wave=4;s.phase='wave';s.time=20;s.queue=[];s.nextId=7;s.enemies=Object.keys(R.ENEMIES).map((type,i)=>({id:i+1,type,route:'tide',d:150+i*140,hp:1500,maxHp:1500,slow:0,slowPower:0,wet:i===2?2:0,burn:i===3?2:0,burnDamage:0,broken:i===1?2:0,heal:2,stormClock:8,shield:type==='boss'?2:0,charge:0}));localStorage.setItem('bastion_save_v1',R.snapshot(s));});
 await page.reload();await page.waitForFunction(()=>БастионИгра.готов());await page.click('#continue');
 await page.evaluate(()=>{const original=BastionField.prototype.draw;BastionField.prototype.draw=function(...args){window.qaField=this;return original.apply(this,args);};});await page.click('#resume');await page.clock.runFor(80);
 for(const [width,height] of [[390,844],[844,390],[1440,1000]]){await page.setViewportSize({width,height});await page.clock.runFor(80);await page.screenshot({path:'tests/снимки/бастион-новый-бой-'+width+'.png',fullPage:true});}
 assert(await page.evaluate(()=>Object.keys(Bastion.ENEMIES).every(k=>qaField.spriteFrames[k+'-walk']?.length===8)));
 // Проигрыш с причиной и повтор с оплаченной начальной расстановкой.
 await page.click('#pause');await page.click('#to-lobby');await page.evaluate(()=>{const R=Bastion,s=R.create();s.phase='wave';s.wave=2;s.hp=1;s.draft=[{pad:1,type:'mortar'},{pad:4,type:'tide'}];s.nextId=2;s.enemies=[{id:1,type:'runner',d:R.geometry(0).length-.1,hp:100,maxHp:100,slow:0,slowPower:0,wet:0,burn:0,burnDamage:0,broken:0,heal:2}];localStorage.setItem('bastion_save_v1',R.snapshot(s));});await page.reload();await page.waitForFunction(()=>БастионИгра.готов());await page.click('#continue');await page.click('#resume');await page.clock.runFor(100);
 assert((await page.locator('#dialog-content').textContent()).includes('Разведчик ×1'));await page.click('#retry-draft');const draft=await page.evaluate(()=>БастионИгра.состояние());assert.deepEqual(draft.towers.map(t=>[t.pad,t.type,t.level]),[[1,'mortar',1],[4,'tide',1]]);assert.equal(draft.gold,125);assert.equal(draft.wave,0);
 // Награда объясняет реально открывшуюся башню; иллюстрации всех ветвей загружаются.
 await page.click('#pause');await page.click('#to-lobby');await page.evaluate(()=>{const s=Bastion.create(1);s.phase='wave';s.wave=8;localStorage.setItem('bastion_save_v1',Bastion.snapshot(s));});await page.reload();await page.waitForFunction(()=>БастионИгра.готов());await page.click('#continue');await page.click('#resume');await page.clock.runFor(900);assert((await page.locator('.unlock-card').textContent()).includes('Грозовая катушка'));await page.click('#result-lobby');await page.click('#arsenal');
 for(const type of ['ballista','mortar','tide','storm','fire','signal']){await page.click('[data-tower="'+type+'"]');await page.locator('.branches img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode())));const urls=await page.locator('.branches img').evaluateAll(imgs=>imgs.map(i=>i.src));assert.notEqual(urls[0],urls[1]);}
 await page.screenshot({path:'tests/снимки/бастион-специализации-v5.png',fullPage:true});
 assert((await page.evaluate(()=>БастионИгра.события())).some(e=>e.event==='td_retry_draft'));assert.deepEqual(errors,[]);
 console.log('Доводка: обучение, приоритет в UI, нехватка золота, точность касания после поворота, шесть анимаций, причина поражения, расстановка, награда и все иллюстрации — пройдены.');
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
