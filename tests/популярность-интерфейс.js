'use strict';
const assert=require('node:assert/strict');
const {chromium,подготовитьПодделку}=require('./браузер-робот');
(async()=>{const browser=await chromium.launch();try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),events=[];
 await подготовитьПодделку(p,{версия:'8.0',подпись:'test-signature'});await p.clock.install();
 await p.route('**/*',async route=>{
  const url=decodeURI(route.request().url());
  if(url.endsWith('/статистика'))return route.fulfill({json:{популярность:[{game:'катан'},{game:'монополия'},{game:'дурак'}]}});
  if(url.endsWith('/пульс')){const data=route.request().postDataJSON();if(data.каталог)events.push(data);return route.fulfill({json:{ок:true}});}
  return route.fallback();
 });
 await p.goto('http://127.0.0.1:8137/index.html');
 await p.waitForFunction(()=>document.querySelector('.витрина__плитки').firstElementChild.dataset.игра==='катан');
 assert.equal(events.length,0,'catalogue is not a Durak launch');
 await p.locator('[data-фильтр="карточные"]').click();assert.equal(await p.locator('.плитка-игры:visible').count(),2);
 await p.goto('http://127.0.0.1:8137/монополия.html');await p.clock.runFor(1100);assert(events.some(e=>e.игра==='монополия'));
 await p.evaluate(()=>{document.querySelector('#экран-лобби').classList.remove('экран--виден');document.querySelector('#экран-игры').classList.add('экран--виден');});
 await p.clock.runFor(32000);assert(events.some(e=>e.каталог.секунд>=29));
 const before=events.reduce((n,e)=>n+e.каталог.секунд,0);
 await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
 await p.clock.runFor(120000);const after=events.reduce((n,e)=>n+e.каталог.секунд,0);assert(after-before<2,'background time must not count');
 console.log('Popularity UI: sorted catalogue, filters, launch and hidden-time exclusion OK');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
