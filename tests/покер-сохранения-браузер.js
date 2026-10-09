'use strict';
const A=require('node:assert/strict'),P=require('../игры/покер/покер-правила'),{chromium,безTelegram}=require('./браузер-робот');
(async()=>{const browser=await chromium.launch();try{
 for(const rules of [1,2]){
  const g=P.create(4,8,false,rules),record={version:1,n:4,seed:8,actions:[],...(rules===2?{rules}: {})};
  while(g.hand<2){const i=g.turn,l=P.legal(g,i),move={type:l.next?'next':l.check?'check':'fold'};P.action(g,i,move);record.actions.push({player:i,move});}
  const p=await browser.newPage({viewport:{width:390,height:844}});await безTelegram(p);await p.addInitScript(record=>localStorage.setItem('poker-match-v1',JSON.stringify(record)),record);await p.goto('http://127.0.0.1:8137/покер.html');await p.locator('#pk-resume').click();A.deepEqual(await p.locator('#pk-hand [data-card]').evaluateAll(es=>es.map(e=>Number(e.dataset.card))),g.players[0].hole);A.match(await p.locator('#pk-round').innerText(),/Раздача 2/);await p.close();
 }
 const corrupt=await browser.newPage();await безTelegram(corrupt);await corrupt.addInitScript(()=>localStorage.setItem('poker-match-v1','{"version":1,"n":9,"actions":[]}'));await corrupt.goto('http://127.0.0.1:8137/покер.html');A(await corrupt.locator('#pk-lobby-error').isVisible());await corrupt.locator('#pk-bots').click();await corrupt.locator('#pk-start').click();A(await corrupt.locator('#экран-игры').isVisible());await corrupt.close();
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));
 // Ускоряем только паузы ботов; правила и кнопки остаются настоящими.
 await p.addInitScript(()=>{const timeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>timeout(fn,ms>=1700&&ms<=4000?60:ms,...args);});
 await p.goto('http://127.0.0.1:8137/покер.html');await p.locator('#pk-bots').click();await p.locator('#pk-count').selectOption('2');await p.locator('#pk-start').click();
 let steps=0;
 while(steps++<300){
  const record=await p.evaluate(()=>JSON.parse(localStorage.getItem('poker-match-v1'))),g=P.create(record.n,record.seed,false,record.rules);for(const a of record.actions)P.action(g,a.player,a.move);if(g.phase==='finished')break;
  if(g.turn!==0){await p.waitForTimeout(100);continue;}const l=P.legal(g,0);
  if(l.next)await p.getByRole('button',{name:'Раздать карты',exact:true}).click();
  else if(l.raise){await p.locator('#pk-actions').getByRole('button',{name:l.max<l.min?'Ва-банк':'Повысить',exact:true}).click();if(l.max>=l.min){await p.locator('#pk-presets').getByRole('button',{name:'Ва-банк',exact:true}).click();await p.locator('#pk-raise-confirm').click();}}
  else await p.locator('#pk-actions').getByRole('button',{name:l.check?'Чек':/^Уравнять /}).click();
 }
 A(steps<300,'Локальная партия заканчивается');A.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('poker-results-v1')).length),1);await p.getByRole('button',{name:'Ещё партия',exact:true}).click();A.match(await p.locator('#pk-round').innerText(),/Раздача 1/);A.deepEqual(errors,[]);
 console.log('Сохранения обеих версий, повреждённое сохранение, полная партия с ботом через кнопки, один результат и новая партия — OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
