'use strict';
const A=require('node:assert/strict'),P=require('../js/катан-правила'),B=require('../js/катан-бот'),{chromium,безTelegram}=require('./браузер-робот');
function state(){const g=P.создать(3,72,false,3);while(g.phase.startsWith('setup'))P.действие(g,P.кто(g),B.ход(P.вид(g,P.кто(g))));g.phase='main';g.turn=0;g.players.forEach(p=>p.resources=[3,3,3,3,3]);g.bank=[10,10,10,10,10];return g;}
function offer(g,to=-1){P.действие(g,0,{type:'offer',to,give:[1,0,0,0,0],want:[0,1,0,0,0],confirmation:true});}
for(const reason of ['cancelled','rejected','turnEnded','changed','replaced','finished']){const g=state();offer(g);const id=g.offer.id;
 if(reason==='cancelled')P.действие(g,0,{type:'cancelOffer',offer:id});
 if(reason==='rejected'){P.действие(g,1,{type:'reject',offer:id});A(g.offer);P.действие(g,2,{type:'reject',offer:id});}
 if(reason==='turnEnded')P.действие(g,0,{type:'end'});
 if(reason==='changed')P.действие(g,0,{type:'development'});
 if(reason==='replaced')P.действие(g,1,{type:'counter',offer:id,to:0,give:[0,2,0,0,0],want:[1,0,0,0,0],confirmation:true});
 if(reason==='finished')P.действие(g,0,{type:'surrender'});
 A.equal(g.log.at(-1).type,'tradeClosed');A.equal(g.log.at(-1).reason,reason);A.equal(g.log.at(-1).offer,id);for(let me=0;me<3;me++)A.equal(P.вид(g,me).log.at(-1).reason,reason);
}
(async()=>{const browser=await chromium.launch();try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await безTelegram(page);await page.goto(process.env.CATAN_TEST_URL||'http://127.0.0.1:8137/катан.html');await page.evaluate(g=>{window.g=g;window.revision=0;window.pushView=()=>{const view=КатанПравила.вид(g,0);view.names=['Вы','Друг','Бот 2'];ИграПоСети.показатьВид({код:'trade-result-test',версия:++revision,катан:view});};pushView();},state());
 await page.evaluate(()=>{КатанПравила.действие(g,0,{type:'offer',to:-1,give:[1,0,0,0,0],want:[0,1,0,0,0],confirmation:true});pushView();});await page.locator('#кат-предложение button').click();await page.evaluate(()=>{КатанПравила.действие(g,0,{type:'cancelOffer',offer:g.offer.id});pushView();});A.equal(await page.locator('#кат-диалог[open]').count(),0);A.match(await page.locator('#кат-обмен-выполнен').innerText(),/Обмен не состоялся.*отменяет/s);await page.locator('#кат-обмен-выполнен button').click();A(await page.locator('#кат-обмен-выполнен').isHidden());
 await page.evaluate(()=>{КатанПравила.действие(g,0,{type:'offer',to:-1,give:[1,0,0,0,0],want:[0,1,0,0,0],confirmation:true});pushView();КатанПравила.действие(g,1,{type:'agree',offer:g.offer.id});КатанПравила.действие(g,2,{type:'agree',offer:g.offer.id});pushView();});
 await page.evaluate(()=>{КатанПравила.действие(g,0,{type:'confirmTrade',offer:g.offer.id,partner:2});pushView();});A.match(await page.locator('#кат-обмен-выполнен').innerText(),/Обмен выполнен.*С Бот 2.*Отдали: Дерево × 1.*Получили: Глина × 1/s);A.equal(await page.locator('#кат-диалог[open]').count(),0);
 for(const width of [320,390,820,1440]){await page.setViewportSize({width,height:900});A(await page.locator('#кат-обмен-выполнен').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth+1;}));await page.screenshot({path:'tests/снимки/катан-итог-торгов-'+width+'.png'});}
 await page.evaluate(()=>{КатанПравила.действие(g,0,{type:'offer',to:-1,give:[1,0,0,0,0],want:[0,1,0,0,0],confirmation:true});pushView();КатанПравила.действие(g,1,{type:'reject',offer:g.offer.id});КатанПравила.действие(g,2,{type:'reject',offer:g.offer.id});pushView();});A.match(await page.locator('#кат-обмен-выполнен').innerText(),/Все приглашённые игроки отказались/);A.deepEqual(errors,[]);console.log('Торговля: 6 причин закрытия, событие всем игрокам, отмена, два согласия и выбранный партнёр, сообщение после закрытия, кнопка и 4 ширины — OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
