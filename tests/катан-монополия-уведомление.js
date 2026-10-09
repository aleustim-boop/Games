'use strict';
const assert=require('node:assert/strict'),P=require('../игры/катан/катан-правила'),B=require('../игры/катан/катан-бот');
const {chromium,безTelegram}=require('./браузер-робот');
(async()=>{const server=await require('./бастион-стенд')(),browser=await chromium.launch();try{
  const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}),errors=[];
  await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.CATAN_TEST_URL||server.url+'/катан.html');
  const g=P.создать(3,42,false,3);while(g.phase.startsWith('setup'))P.действие(g,g.turn,B.ход(P.вид(g,g.turn)));g.phase='main';g.turn=0;g.players[0].resources=[12,0,0,0,0];
  await p.evaluate(g=>{window.noticeGame=g;window.noticeVersion=0;window.pushNotice=()=>{const v=КатанПравила.вид(noticeGame,0);v.names=['Вы','Бот 1','Бот 2'];ИграПоСети.показатьВид({код:'notice-test',версия:++noticeVersion,катан:v,застолом:[{номер:0},{номер:1,этоБот:true},{номер:2,этоБот:true}]});};Сеть.отправитьХод=async a=>{КатанПравила.действие(noticeGame,0,a.move);pushNotice();return {принято:true};};pushNotice();},g);
  for(const width of [390,1440]){
    await p.setViewportSize({width,height:844});await p.locator('#кат-обмен').click();
    await p.locator('.кат-обмен-карты').nth(1).locator('button').nth(1).click();await p.getByRole('button',{name:'Обменять',exact:true}).click();
    const notice=p.locator('#кат-обмен-выполнен');await notice.waitFor();
    assert.match(await notice.innerText(),/Обмен выполнен[\s\S]*Глина/);
    const bounds=await notice.boundingBox();assert(Math.abs(bounds.x+bounds.width/2-width/2)<2);assert(Math.abs(bounds.y+bounds.height/2-422)<2);
    assert.equal(await notice.evaluate(e=>e.parentNode.id),'кат-диалог');
    await p.screenshot({path:`tests/снимки/катан-банк-уведомление-${width}.png`});
    await notice.getByRole('button',{name:'Понятно',exact:true}).tap();assert.equal(await notice.isVisible(),false);assert(await p.locator('#кат-диалог').isVisible());
    await p.locator('#кат-закрыть').click();
  }
  await p.setViewportSize({width:390,height:844});
  const labels=['Дерево','Глина','Шерсть','Зерно','Руда'];
  for(let resource=0;resource<5;resource++){
    await p.evaluate(resource=>{noticeGame.phase='main';noticeGame.turn=1;noticeGame.playedDev=false;noticeGame.round=20;noticeGame.players[1].dev=[{type:'monopoly',bought:0}];noticeGame.players[0].resources[resource]=2;noticeGame.players[2].resources[resource]=3;const before=noticeGame.players[1].resources[resource];КатанПравила.действие(noticeGame,1,{type:'dev',card:'monopoly',resource});if(noticeGame.players[1].resources[resource]!==before+5)throw Error('Неверная передача ресурсов');for(let i=0;i<3;i++)if(КатанПравила.вид(noticeGame,i).log.at(-1).resource!==resource)throw Error('Ресурс должен быть виден каждому игроку');pushNotice();},resource);
    await p.locator('#кат-диалог[open][data-kind=played-development]').waitFor();assert.equal(await p.locator('.кат-монополия-ресурс').getAttribute('data-resource'),String(resource));assert.match(await p.locator('#кат-диалог').innerText(),new RegExp('Выбран ресурс: '+labels[resource]));
    if(resource===4)await p.screenshot({path:'tests/снимки/катан-монополия-ресурс.png'});
    await p.getByRole('button',{name:'Понятно',exact:true}).click();await p.evaluate(()=>pushNotice());assert.equal(await p.locator('#кат-диалог').isVisible(),false);
    await p.locator('#кат-журнал-кнопка').click();assert.match(await p.locator('#кат-диалог').innerText(),new RegExp('Монополия — выбран ресурс: '+labels[resource]));await p.locator('#кат-закрыть').click();
  }
  assert.deepEqual(errors,[]);console.log('Катан: обмен с банком, уведомление по центру, Понятно работает в модальном окне; все 5 ресурсов Монополии публичны и видны в уведомлении и журнале — PASS');
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
