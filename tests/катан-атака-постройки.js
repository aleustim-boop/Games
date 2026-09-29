'use strict';
const A=require('node:assert/strict'),P=require('../js/катан-правила'),B=require('../js/катан-бот'),{chromium,безTelegram}=require('./браузер-робот');
(async()=>{const browser=await chromium.launch();try{for(const [level,width,reduced,choice]of [[1,390,false],[2,1440,false],[2,390,true],[1,820,false,true]]){
 const g=P.создать(3,42,false,3);while(g.phase.startsWith('setup'))P.действие(g,g.turn,B.ход(P.вид(g,g.turn)));
 const dest=P.Г.hexes.find(h=>h.id!==g.robber&&h.vertices.some(id=>g.buildings[id]?.owner===0)&&!h.vertices.some(id=>g.buildings[id]?.owner===2));A(dest);
 if(choice){const free=dest.vertices.find(id=>!g.buildings[id]);A.notEqual(free,undefined);g.buildings[free]={owner:2,level:1};g.players[2].resources=[1,0,0,0,0];}
 const target=dest.vertices.find(id=>g.buildings[id]?.owner===0);g.buildings[target].level=level;g.phase='robber';g.turn=1;g.returnPhase='main';g.players[0].resources=[2,0,0,0,0];
 const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:reduced?'reduce':'no-preference'});await безTelegram(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CATAN_TEST_URL||'http://127.0.0.1:8137/катан.html');
 await page.evaluate(({g,choice})=>{window.attackViewer=choice?1:2;window.attackGame=g;window.attackVersion=0;window.pushAttack=()=>{const v=КатанПравила.вид(attackGame,attackViewer);v.names=['Алексей','Мария','Наблюдатель'];ИграПоСети.показатьВид({код:'attack-test',версия:++attackVersion,катан:v,застолом:[{номер:1},{номер:2},{номер:3}]});};window.Сеть.отправитьХод=async a=>{КатанПравила.действие(attackGame,1,a.move);pushAttack();return {принято:true};};pushAttack();},{g,choice});
 await page.waitForFunction(()=>document.querySelector('.кат-разбойник[data-robber-hex]'));
 await page.evaluate(id=>{КатанПравила.действие(attackGame,1,{type:'robber',hex:id});pushAttack();},dest.id);
 if(choice){await page.getByRole('button',{name:'Забрать ресурс у Алексей',exact:true}).click();}
 const attack=page.locator('.кат-атака');await attack.waitFor();A.equal(await attack.getAttribute('data-victim'),'0');A.equal(await attack.getAttribute('data-level'),String(level));A.equal(await attack.getAttribute('data-vertex-target'),String(target));
 A.match(await attack.textContent(),level===2?/Город/:/Поселение/);A.equal(await page.locator('#кат-диалог[open]').count(),0,'Итог не перекрывает атаку');A(await page.locator('.кат-цель-атаки').count()>0);
 if(!reduced){await page.waitForTimeout(950);await page.screenshot({path:`tests/снимки/катан-атака-${level}-${width}.png`});await page.evaluate(()=>pushAttack());A.equal(await attack.count(),1,'Повторный опрос не удаляет анимацию');}
 await page.locator(choice?'#кат-диалог[open][data-kind=loot]':'#кат-диалог[open][data-kind=robber-result]').waitFor();A.equal(await attack.count(),0);A.match(await page.locator('#кат-диалог').innerText(),choice?/Вы получили ресурс/:/Мария забрал 1 карту ресурса у Алексей/);
 A.equal(await page.evaluate(id=>attackGame.buildings[id].level,target),level,'Постройка не разрушена');A.equal(await page.evaluate(()=>attackGame.players[0].resources[0]),1);A.equal(await page.locator('.кат-добыча[data-resource]').count(),choice?1:0,'Вид ресурса раскрывается только участнику кражи');
 await page.getByRole('button',{name:choice?'В мою руку':'Понятно',exact:true}).click();await page.evaluate(()=>pushAttack());A.equal(await attack.count(),0,'Повторный опрос не повторяет атаку');A.deepEqual(errors,[]);await page.close();console.log(`Атака: уровень ${level}, ${width}px, уменьшение движения ${reduced} — OK`);
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
