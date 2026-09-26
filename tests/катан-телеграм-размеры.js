'use strict';
const assert=require('node:assert/strict');
const {chromium,подготовитьПодделку}=require('./браузер-робот');
(async()=>{
 const browser=await chromium.launch();
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await подготовитьПодделку(page,{версия:'8.0',отступы:{системные:{top:24,bottom:24},содержимого:{top:56}}});
  await page.clock.install();
  await page.goto(process.env.CATAN_TEST_URL||'http://127.0.0.1:8137/катан.html');
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+100)));
  await page.evaluate(()=>{
   window.layoutGame=КатанПравила.создать(4,42,false,3);window.layoutVersion=0;
   window.layoutPush=()=>{const view=КатанПравила.вид(layoutGame,0);view.names=['Вы','Бот 1','Бот 2','Бот 3'];ИграПоСети.показатьВид({код:'layout-test',версия:++layoutVersion,катан:view,застолом:[{номер:1},{номер:2},{номер:3},{номер:4}]});};layoutPush();
  });
  await page.locator('#кат-поле image').evaluateAll(async es=>Promise.all([...new Set(es.map(e=>e.getAttribute('href')))].map(async src=>{const im=new Image();im.src=src;await im.decode();})));
  for(const [width,height] of [[320,740],[390,844],[549,1280],[768,853],[820,1180],[1153,1280],[1440,900],[1920,1080],[844,390]]){
   await page.setViewportSize({width,height});await page.clock.runFor(50);
   for(const [phase,roller] of [['setupSettlement',2],['main',0],['main',1],['main',2],['main',3]]){
    await page.evaluate(({phase,roller})=>{
     layoutGame.phase=phase;layoutGame.turn=roller;layoutGame.dice=phase==='main'?[5,5]:null;
     layoutGame.log=phase==='main'?[{type:'roll',player:roller,dice:[5,5]}]:[];
     layoutGame.offer=phase==='main'?{id:1,from:2,to:0,give:[1,0,0,0,0],want:[0,0,0,1,0],rejected:[]}:null;
     layoutPush();document.getElementById('экран-игры').scrollTop=0;
    },{phase,roller});await page.clock.runFor(50);
    const result=await page.evaluate(()=>{
     const rect=e=>e.getBoundingClientRect(),q=s=>document.querySelector(s);
     const overlaps=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
     const board=rect(q('#кат-окно-карты')),scene=rect(q('.кат-сцена')),status=rect(q('#кат-ход'));
     const dice=q('#кат-кубики'),offer=q('#кат-предложение');
     const mapPoint=q('#кат-поле').createSVGPoint();mapPoint.x=450;mapPoint.y=420;
     const matrix=q('#кат-поле').getScreenCTM();
     return {boardLeft:board.left,boardRight:board.right,boardWidth:board.width,boardHeight:board.height,sceneWidth:scene.width,scale:matrix.a,
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      statusFit:[...q('#кат-ход').children].filter(e=>!e.hidden&&!e.classList.contains('кат-таймер')).every(e=>{const r=rect(e);return r.top>=status.top&&r.bottom<=status.bottom;}),
      diceOverlap:!dice.hidden&&[...document.querySelectorAll('.кат-игрок,#кат-масштаб,#кат-фильтр,#кат-журнал-кнопка,#кат-общение')].some(e=>overlaps(rect(dice),rect(e))),
      offerOverlap:!offer.classList.contains('скрыт')&&[...document.querySelectorAll('.кат-игрок,#кат-ресурсы,.кат-действия')].some(e=>overlaps(rect(offer),rect(e))),
      back:getComputedStyle(q('#экран-игры [data-back]')).visibility};
    });
    const label=width+'×'+height+' '+phase+' player '+roller;
    assert(!result.overflow,label+' horizontal overflow');
    if(width<=699&&height>width){assert(Math.abs(result.boardLeft)<1,label+' left edge');assert(Math.abs(result.boardRight-width)<1,label+' right edge');}
    if(width>=700&&height>width)assert(result.boardWidth<width-20,label+' tablet should retain margins');
    assert(result.boardHeight>=result.sceneWidth*.90,label+' collapsed board '+JSON.stringify(result));
    assert(result.scale>=result.sceneWidth/900*.95,label+' tiny SVG');
    assert(result.statusFit,label+' status text outside card');
    assert(!result.diceOverlap,label+' dice cover controls/cards');
    assert(!result.offerOverlap,label+' trade covers cards');
    assert.equal(result.back,'hidden');
    await page.screenshot({path:'tests/снимки/катан-tg-'+width+'-'+phase+'.png'});
    await page.locator('#кат-главное').scrollIntoViewIfNeeded();
    await page.screenshot({path:'tests/снимки/катан-tg-'+width+'-'+phase+'-панель.png'});
    assert(await page.locator('#кат-главное').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),label+' actions inaccessible');
   }
  }
  assert.deepEqual(errors,[]);console.log('Telegram CATAN: 9 размеров, поворот, безопасные отступы, размер карты, кубики, обмен, текст и доступность действий — OK');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
