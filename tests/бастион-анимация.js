'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,безTelegram}=require('./браузер-робот.js');
(async()=>{const server=await require('./бастион-стенд.js')(),browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:'tests/снимки/бастион-видео',size:{width:1280,height:900}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await безTelegram(page);
 await page.goto(server.url+'/'+encodeURIComponent('бастион')+'.html');await page.waitForFunction(()=>БастионИгра.готов());
 await page.evaluate(()=>{const draw=BastionField.prototype.draw;BastionField.prototype.draw=function(...args){window.qaField=this;return draw.apply(this,args);};window.qaShots=[];const event=BastionField.prototype.event;BastionField.prototype.event=function(e){event.call(this,e);if(e.type==='shot'&&['mortar','ballista'].includes(e.tower)){const shot=this.effects.filter(f=>f.type==='shot').at(-1);qaShots.push({tower:e.tower,from:e.from,muzzle:shot?.from,to:e.to});}};});
 await page.click('#start');for(const [pad,type] of [[1,'mortar'],[3,'ballista'],[4,'tide']]){await page.click('[data-pad="'+pad+'"]');await page.click('#tower-panel [data-build="'+type+'"]');}
 await page.click('#deselect');await page.click('#launch');await page.waitForFunction(()=>qaShots.length>=2,{timeout:25000});
 const angles=[];for(let i=0;i<4;i++){await page.waitForTimeout(1500);angles.push(await page.evaluate(()=>qaField.weapons.units.get(1).angle));await page.screenshot({path:'tests/снимки/бастион-движение-'+i+'.png'});}
 assert(new Set(angles.map(a=>a.toFixed(2))).size>1,'Ствол должен сопровождать движущуюся цель');
 const shots=await page.evaluate(()=>qaShots);assert(shots.every(s=>s.muzzle&&Math.hypot(s.muzzle.x-s.from.x,s.muzzle.y-s.from.y)>15),'Снаряд вылетает из ствола, не из основания');
 await page.click('#pause');
 const checks=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=c.height=1000;c.style.width='500px';document.body.append(c);
  const f=new BastionField(c);f.images=qaField.images;f.weapons.images=f.images;f.loaded=true;const s=Bastion.create(),pad=Bastion.pads(0)[1];Bastion.build(s,1,'mortar');
  const victim={id:501,type:'raider',hp:10,maxHp:40,d:350,wet:0,burn:0};s.enemies=[victim];f.draw(s,0);const q=Bastion.position(0,victim.d);s.enemies=[];
  f.event({type:'kill',...q,gold:8});f.event({type:'shot',tower:'mortar',from:pad,to:q,targets:[q],splash:80});
  f.draw(s,.35);const before=f.ghosts.length===1&&f.effects.find(e=>e.type==='impact').age<0;f.draw(s,.08);const after=f.ghosts.length===0&&f.effects.find(e=>e.type==='impact').age>0;
  const muzzle=f.effects.find(e=>e.type==='shot')?.from;f.motion=false;f.effects=[];f.event({type:'shot',tower:'mortar',from:pad,to:{x:pad.x-200,y:pad.y},targets:[]});const reduced=f.effects.length===0&&Math.abs(Math.abs(f.weapons.unit(s.towers[0]).angle)-Math.PI)<.001;
  f.delayedHp.set(1,{until:999,hp:5});f.map=-1;f.draw(s,0);const reset=f.delayedHp.size===0;
  f.resize.disconnect();c.remove();return {before,after,reduced,reset,muzzle,assets:['mortar-overhead','ballista-overhead','weapon-plinth'].every(k=>qaField.images[k]?.naturalWidth>0)};
 });
 for(const key of ['before','after','reduced','reset','assets'])assert(checks[key],key);
 assert.deepEqual(errors,[]);await context.close();const video=await page.video().path();fs.copyFileSync(video,'tests/снимки/бастион-стрельба.webm');
 // Экран победы не должен замораживать последний снаряд на полпути.
 const end=await browser.newPage({viewport:{width:1280,height:900}});await безTelegram(end);await end.clock.install();end.on('pageerror',e=>errors.push(e.message));
 await end.goto(server.url+'/'+encodeURIComponent('бастион')+'.html');await end.waitForFunction(()=>window.БастионИгра?.готов());
 await end.evaluate(()=>{const R=Bastion,s=R.create(),p=R.pads(0)[1];R.build(s,1,'mortar');R.startWave(s);s.wave=8;s.queue=[];let best=0,min=Infinity;for(let d=0;d<R.geometry(0).length;d+=5){const q=R.position(0,d),dist=Math.hypot(p.x-q.x,p.y-q.y);if(dist<min){min=dist;best=d;}}s.nextId=2;s.enemies=[{id:1,type:'raider',hp:1,maxHp:40,d:best,slow:0,slowPower:0,wet:0,burn:0,burnDamage:0,broken:0,heal:2}];localStorage.setItem('bastion_save_v1',R.snapshot(s));});
 await end.reload();await end.waitForFunction(()=>window.БастионИгра?.готов());await end.click('#continue');await end.click('#resume');await end.clock.runFor(100);assert.equal((await end.evaluate(()=>БастионИгра.состояние())).phase,'won');assert.equal(await end.locator('#dialog').isVisible(),false);await end.clock.runFor(800);assert.equal(await end.locator('#dialog-title').textContent(),'Маяк защищён');assert.deepEqual(errors,[]);await end.close();
 console.log('Анимация: живое сопровождение цели, вылет из ствола, смерть после попадания, уменьшение эффектов, сброс новой партии, загрузка слоёв и победа после последнего попадания — пройдены. Видео сохранено.');
}finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
