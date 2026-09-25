'use strict';
const assert=require('node:assert/strict'),P=require('../js/катан-правила'),B=require('../js/катан-бот');
const {chromium,безTelegram}=require('./браузер-робот');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 await безTelegram(page);page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 await page.goto((process.env.CATAN_BASE||'http://127.0.0.1:8137')+'/катан.html');
 let seed=1;while(P.создать(4,seed,false,3).turn!==0)seed++;
 const record={version:1,rules:3,id:'undo-ui',seed,n:4,level:'обычный',actions:[]};
 await page.evaluate(r=>localStorage.setItem('catan-match-v1',JSON.stringify(r)),record);
 await page.reload();await page.waitForFunction(()=>typeof window.КатанНастройкиСтола==='function');await page.locator('#кат-продолжить').click();
 assert(await page.locator('#кат-вернуть').isDisabled());
 const initial=P.создать(4,seed,false,3),vertex=P.поселения(initial,0,true)[0];
 await page.locator(`#кат-поле [data-vertex="${vertex}"][role=button]`).click();
 assert(await page.locator('#кат-отмена').isVisible());assert(!(await page.locator('#кат-вернуть').isVisible()));
 await page.locator('#кат-главное').click();assert(await page.locator('#кат-вернуть').isEnabled());
 await page.locator('#кат-вернуть').click();assert(await page.locator('#кат-вернуть').isDisabled());
 assert.equal(await page.locator('#кат-поле .кат-фигура').count(),0);assert.match(await page.locator('#кат-событие').innerText(),/отменено/);
 await page.reload();await page.locator('#кат-продолжить').click();assert.equal(await page.locator('#кат-поле .кат-фигура').count(),0);
 const g=P.создать(4,seed,false,3);record.actions=[];
 while(g.phase.startsWith('setup')){const player=P.кто(g),action=B.ход(P.вид(g,player),'сложный');P.действие(g,player,action);record.actions.push({player,action});}
 await page.evaluate(r=>localStorage.setItem('catan-match-v1',JSON.stringify(r)),record);await page.reload();await page.locator('#кат-продолжить').click();
 await page.locator('#кат-поле image').evaluateAll(async es=>Promise.all([...new Set(es.map(e=>e.getAttribute('href')))].map(async src=>{const im=new Image();im.src=src;await im.decode()})));
 await page.evaluate(()=>document.fonts.ready);
 const token=await page.locator('#кат-поле .кат-номер').first().evaluate(e=>({size:parseFloat(getComputedStyle(e).fontSize),weight:getComputedStyle(e).fontWeight}));assert.equal(token.size,29);assert(Number(token.weight)>=700);
 assert.equal(await page.locator('#кат-поле .кат-номер-фон').first().getAttribute('r'),'25');
 const palette=await page.locator('.кат-игрок.цвет-0,.кат-игрок.цвет-1').evaluateAll(es=>es.map(e=>getComputedStyle(e).getPropertyValue('--цвет')));assert.equal(new Set(palette).size,2);assert(palette.includes('#e35fae'));
 assert.match(await page.locator('#кат-поле .кат-постройка.цвет-0 .кат-фигура').first().evaluate(e=>getComputedStyle(e).filter),/hue-rotate/);
 for(const [width,height]of [[320,740],[390,844],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080]]){
  await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const boxes=await page.locator('#кат-главное,#кат-вернуть').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
  assert(boxes[0].right<=boxes[1].left+1,'Кнопки перекрываются');assert(boxes.every(r=>r.left>=0&&r.right<=width&&r.bottom<=height+1),'Кнопки не помещаются');
  const layout=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('.кат-игрок')].map(e=>e.getBoundingClientRect());
    return ['кат-фильтр','кат-журнал-кнопка'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {clear:cards.every(c=>r.right<=c.left||r.left>=c.right||r.bottom<=c.top||r.top>=c.bottom),hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
  });assert(layout.every(x=>x.clear&&x.hit),'Кнопки закрыты карточкой игрока');
  for(let player=0;player<4;player++){
    const counts=await page.locator('.кат-игрок.цвет-'+player+' .кат-показатель').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.dataset.stat,Number(e.textContent)])));
    const info=P.вид(g,0).players[player];assert.deepEqual(counts,{resources:info.cards,development:info.devCount,knights:info.knights,...info.pieces});
  }
  await page.screenshot({path:`tests/снимки/катан-номера-цвета-${width}.png`});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#кат-фильтр').click();assert(await page.locator('#кат-диалог').isVisible());await page.getByRole('button',{name:'Готово',exact:true}).click();
 await page.locator('#кат-журнал-кнопка').click();assert(await page.locator('#кат-диалог').isVisible());await page.locator('#кат-диалог').getByRole('button',{name:'Закрыть',exact:true}).click();
 let fixture;
 for(let seed=1;seed<=40&&!fixture;seed++){
  const game=P.создать(4,seed,false,3),r={version:1,rules:3,id:'direct-build',seed,n:4,level:'обычный',actions:[]};
  for(let step=0;step<600&&game.phase!=='finished';step++){
   const who=P.кто(game),view=P.вид(game,who);
   if(who===0&&game.phase==='main'&&view.legal.city.length&&view.legal.road.length){fixture={record:r,game};break;}
   const action=who===0&&game.phase==='main'?{type:'end'}:B.ход(view,'обычный');P.действие(game,who,action);r.actions.push({player:who,action});
  }
 }
 assert(fixture,'Нет сценария доступного строительства');
 await page.evaluate(r=>localStorage.setItem('catan-match-v1',JSON.stringify(r)),fixture.record);await page.reload();await page.locator('#кат-продолжить').click();
 for(const type of ['road','city']){
  const view=P.вид(fixture.game,0),id=view.legal[type][0],selector=type==='road'?'data-edge':'data-vertex';
  await page.locator('#кат-поле ['+selector+'="'+id+'"][role=button]').click();assert(await page.locator('#кат-диалог').isVisible());
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.length);
  await page.locator('#кат-диалог').getByRole('button',{name:'Отмена',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.length),before);
  await page.locator('#кат-поле ['+selector+'="'+id+'"][role=button]').click();await page.locator('#кат-диалог').getByRole('button',{name:type==='city'?'Построить город':'Построить дорогу',exact:true}).click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.at(-1).action.type),type);
  await page.locator('#кат-вернуть').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.at(-1).action.type),'undo');
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#кат-обмен').click();await page.getByRole('button',{name:'С игроками',exact:true}).click();
 const hand=fixture.game.players[0].resources;
 assert.deepEqual(await page.locator('.кат-торговля-ресурсы strong').allTextContents(),hand.map(String));
 const res=hand.findIndex(n=>n>0),names=['Дерево','Глина','Шерсть','Зерно','Руда'];
 await page.getByRole('spinbutton',{name:'Отдаю: '+names[res],exact:true}).fill('1');
 assert.match(await page.locator('.кат-торговля-остаток').nth(res).innerText(),new RegExp('Останется '+(hand[res]-1)));
 await page.screenshot({path:'tests/снимки/катан-торговля-запас.png'});
 await page.locator('#кат-закрыть').click();
 let opponentSeed=1;while(P.создать(4,opponentSeed,false,3).turn===0)opponentSeed++;
 await page.evaluate(seed=>localStorage.setItem('catan-match-v1',JSON.stringify({version:1,rules:3,id:'thinking',seed,n:4,level:'обычный',actions:[]})),opponentSeed);
 await page.reload();await page.locator('#кат-продолжить').click();await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#кат-фильтр').click();await page.getByRole('button',{name:'Готово',exact:true}).click();
 assert.equal(await page.locator('.кат-думает-часы').count(),1);
 assert.notEqual(await page.locator('.кат-думает-часы').evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
 await page.screenshot({path:'tests/снимки/катан-соперник-думает.png'});
 await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+100)));
 // Автобросок: не раньше 3 секунд, только один раз, ручной бросок отменяет ожидание.
 await page.evaluate(r=>localStorage.setItem('catan-match-v1',JSON.stringify(r)),record);await page.reload();await page.locator('#кат-продолжить').click();
 await page.clock.runFor(2999);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.at(-1).action.type),'road');
 await page.clock.runFor(1);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.at(-1).action.type),'roll');
 const rolled=await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.length);await page.clock.runFor(3100);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.length),rolled);
 await page.evaluate(r=>localStorage.setItem('catan-match-v1',JSON.stringify(r)),record);await page.reload();await page.locator('#кат-продолжить').click();await page.clock.runFor(1000);await page.locator('#кат-главное').click();
 const manual=await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.length);await page.clock.runFor(3100);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.length),manual);
 let withDev;
 for(let seed=1;seed<=30&&!withDev;seed++){
  const game=P.создать(4,seed,false,3),r={version:1,rules:3,id:'dev-no-auto',seed,n:4,level:'обычный',actions:[]};
  for(let step=0;step<1500&&game.phase!=='finished';step++){
   const who=P.кто(game),view=P.вид(game,who);
   if(who===0&&game.phase==='roll'&&view.dev.length){withDev=r;break;}
   const action=B.ход(view,'сложный');P.действие(game,who,action);r.actions.push({player:who,action});
  }
 }
 assert(withDev);await page.evaluate(r=>localStorage.setItem('catan-match-v1',JSON.stringify(r)),withDev);await page.reload();await page.locator('#кат-продолжить').click();await page.clock.runFor(5000);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')).actions.length),withDev.actions.length);
 assert.equal(await page.locator('#кат-главное').innerText(),'Бросить кубики');
 assert.deepEqual(errors,[]);console.log('Катан UI: отмена и сохранение, контрастные числа, разные цвета, карточки/кнопки 320–1920 px, строительство с поля, торговля, автобросок — OK');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
