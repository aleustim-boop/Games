'use strict';
const assert=require('node:assert/strict'),P=require('../игры/катан/катан-правила'),B=require('../игры/катан/катан-бот');
const {chromium,безTelegram}=require('./браузер-робот');
(async()=>{
  const server=await require('./бастион-стенд')(),browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
    await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.CATAN_TEST_URL||server.url+'/катан.html');
    await p.locator('#кат-боты').click();
    for(const width of [320,390,820,1440]){
      await p.setViewportSize({width,height:1000});
      for(const [id,labels]of [['кат-число',['Трое','Четверо']],['кат-уровень',['Лёгкий','Обычный','Сложный']],['кат-цель',['10 ПО','12 ПО','15 ПО']]]){
        for(const label of labels){
          await p.locator('#'+id).getByRole('radio',{name:label,exact:true}).click();
          assert.equal(await p.locator('#'+id+' [aria-checked=true]').count(),1);
          const chosen=await p.locator('#'+id+' [aria-checked=true]').evaluate(e=>({background:getComputedStyle(e).backgroundImage,mark:getComputedStyle(e,'::after').content,overflow:e.scrollWidth>e.clientWidth}));
          assert.match(chosen.background,/linear-gradient/);assert.match(chosen.mark,/✓/);assert.equal(chosen.overflow,false);
          assert.equal(await p.locator('#'+id+' [aria-checked=false]').first().evaluate(e=>getComputedStyle(e).backgroundImage),'none');
        }
      }
    }
    await p.setViewportSize({width:390,height:844});await p.screenshot({path:'tests/снимки/катан-выбраны-настройки.png',fullPage:true});
    await p.reload();await p.locator('#кат-боты').click();
    for(const [id,label]of [['кат-число','Четверо'],['кат-уровень','Сложный'],['кат-цель','15 ПО']])assert.equal(await p.locator('#'+id).getByRole('radio',{name:label,exact:true}).getAttribute('aria-checked'),'true');
    const g=P.создать(3,1,false,3);while(g.phase.startsWith('setup'))P.действие(g,g.turn,B.ход(P.вид(g,g.turn)));g.phase='main';g.turn=1;g.players.forEach(p=>p.resources=[6,6,6,6,6]);
    await p.evaluate(g=>{
      window.testGame=g;window.testVersion=0;window.sentActions=[];
      window.pushTrade=()=>{const v=КатанПравила.вид(testGame,0);v.names=['Вы','Анна','Игорь'];ИграПоСети.показатьВид({код:'return-test',версия:++testVersion,сыграноПартий:0,катан:v,застолом:[{номер:0},{номер:1},{номер:2}]});};
      Сеть.отправитьХод=async a=>{sentActions.push(a.move);КатанПравила.действие(testGame,0,a.move);pushTrade();return {принято:true};};
      КатанПравила.действие(testGame,1,{type:'offer',to:0,give:[0,1,0,0,0],want:[1,0,0,0,0],confirmation:true});pushTrade();
    },g);
    await p.locator('#кат-диалог[data-kind=offer][open]').waitFor();
    const original=await p.evaluate(()=>JSON.stringify(testGame));
    for(const dismiss of ['button','cross','escape','back']){
      await p.getByRole('button',{name:'Предложить свой вариант',exact:true}).click();
      await p.locator('[data-trade-side=give][data-resource="0"]').click();
      if(dismiss==='button')await p.getByRole('button',{name:'← Назад к предложению',exact:true}).click();
      if(dismiss==='cross')await p.locator('#кат-закрыть').click();
      if(dismiss==='escape')await p.keyboard.press('Escape');
      if(dismiss==='back')await p.evaluate(()=>document.querySelector('#экран-игры [data-back]').click());
      await p.locator('#кат-диалог[data-kind=offer][open]').waitFor();
      assert.equal(await p.evaluate(()=>JSON.stringify(testGame)),original,'Возврат не должен отправлять или менять предложение');
      assert.equal(await p.evaluate(()=>sentActions.length),0);
    }
    await p.getByRole('button',{name:'Предложить свой вариант',exact:true}).click();
    await p.evaluate(()=>{КатанПравила.действие(testGame,1,{type:'cancelOffer',offer:testGame.offer.id});pushTrade();});
    await p.getByRole('button',{name:'← Назад к предложению',exact:true}).click();assert.equal(await p.locator('#кат-диалог').isVisible(),false);
    // Ответ на поиск ресурса после отправки закрывается, а не возвращает к старому предложению.
    await p.evaluate(()=>{КатанПравила.действие(testGame,1,{type:'offer',to:0,give:[0,0,0,0,0],want:[1,0,0,0,0],confirmation:true});pushTrade();});
    await p.getByRole('button',{name:'Предложить свой вариант',exact:true}).click();
    await p.locator('[data-trade-side=want][data-resource="1"]').click();
    await p.getByRole('button',{name:'Отправить свой вариант',exact:true}).click();
    await p.locator('#кат-диалог').waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>sentActions.length),1);
    await p.evaluate(()=>{КатанПравила.действие(testGame,1,{type:'cancelOffer',offer:testGame.offer.id});КатанПравила.действие(testGame,1,{type:'offer',to:0,give:[0,1,0,0,0],want:[1,0,0,0,0],confirmation:true});pushTrade();});
    await p.getByRole('button',{name:'Предложить свой вариант',exact:true}).click();await p.locator('[data-trade-side=give][data-resource="0"]').click();
    await p.getByRole('button',{name:'Отправить встречное предложение',exact:true}).click();
    await p.locator('#кат-диалог[data-kind=offer][open]').waitFor();assert.equal(await p.evaluate(()=>testGame.offer.from),0);assert.equal(await p.evaluate(()=>sentActions.length),2);
    await p.locator('#кат-закрыть').click();assert.equal(await p.locator('#кат-диалог').isVisible(),false);
    assert.deepEqual(errors,[]);console.log('Катан: выбранные настройки на 4 размерах, сохранение, 4 способа возврата без отправки, закрытый оффер и отправка ответа — PASS');
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
