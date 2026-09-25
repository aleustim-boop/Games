'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот'),М=require('../js/катан-память');
const {chromium,безTelegram}=require('./браузер-робот');
(async()=>{const browser=await chromium.launch();try{
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto('http://127.0.0.1:8137/катан.html');
  await p.screenshot({path:'tests/снимки/катан-новое-лобби.png'});await p.locator('#кат-боты').click();
  await p.locator('#кат-цель').getByRole('radio',{name:'12 ПО'}).click();
  assert.equal(await p.locator('#кат-настройки .кат-правила-стола').count(),0);
  await p.locator('#кат-настройки').getByRole('button',{name:'Дополнительные настройки'}).click();
  await p.locator('#кат-доп-настройки').getByRole('checkbox',{name:/Дружелюбный/}).check();await p.locator('#кат-доп-настройки').getByRole('checkbox',{name:/Мягкий/}).check();await p.locator('#кат-доп-настройки').getByRole('combobox',{name:'Время на ход'}).selectOption('60');
  await p.locator('#кат-доп-настройки').getByRole('button',{name:'Готово',exact:true}).click();
  await p.screenshot({path:'tests/снимки/катан-правила-стола.png',fullPage:true});await p.locator('#кат-начать').click();
  let record=await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')));assert.deepEqual(record.options,{friendlyRobber:true,easyStart:true,turnSeconds:60,targetPoints:12});
  await p.clock.fastForward(250);assert(await p.locator('.кат-таймер').isVisible());
  await p.locator('#кат-фильтр').click();await p.getByRole('button',{name:'Яркий',exact:true}).click();assert.equal(await p.locator('#экран-игры').getAttribute('data-terrain'),'bright');await p.getByRole('button',{name:'Средний',exact:true}).click();await p.getByRole('checkbox',{name:'Названия ресурсов на поле'}).check();await p.getByRole('checkbox',{name:'Вероятности на жетонах'}).uncheck();await p.getByRole('button',{name:'Готово',exact:true}).click();
  await p.reload();await p.locator('#кат-продолжить').click();assert.equal(await p.locator('#экран-игры').getAttribute('data-terrain'),'balanced');assert.match(await p.locator('#экран-игры').getAttribute('class'),/названия-ресурсов/);
  let fixture;for(let seed=1;seed<30&&!fixture;seed++){const g=П.создать(4,seed,false,2),r={version:1,rules:2,id:'robber-test',seed,n:4,level:'сложный',actions:[]};for(let i=0;i<1000&&g.phase!=='finished';i++){if(g.phase==='robber'&&g.turn===0){fixture=r;break;}const player=П.кто(g),action=Б.ход(П.вид(g,player),'сложный');П.действие(g,player,action);r.actions.push({player,action});}}
  assert(fixture);await p.evaluate(r=>localStorage.setItem('catan-match-v1',JSON.stringify(r)),fixture);await p.reload();await p.locator('#кат-продолжить').click();
  const before=М.восстановить(fixture),target=П.вид(before,0).legal.robber[0];await p.locator(`#кат-поле [data-hex="${target}"][role=button]`).click();let after=М.восстановить(await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1'))));assert.equal(after.robber,before.robber,'Нажатие не должно немедленно перемещать разбойника');
  await p.locator('#кат-фильтр').click();await p.getByRole('button',{name:'Дерево',exact:true}).click();await p.getByRole('button',{name:'Готово',exact:true}).click();assert.equal(await p.locator('.кат-приглушён').count(),0,'Фильтр не должен прятать доступные цели');
  await p.screenshot({path:'tests/снимки/катан-разбойник-выбор.png'});await p.locator('#кат-главное').click();after=М.восстановить(await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1'))));assert.equal(after.robber,target);
  assert(await p.locator('#кат-кубики').isVisible());assert.equal(await p.locator('#кат-кубики .кат-кубик').count(),2);
  assert.deepEqual(errors,[]);console.log('Катан: настройки сохраняются, варианты применены, таймер виден, разбойник с подтверждением, фильтры не мешают ходу — OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
