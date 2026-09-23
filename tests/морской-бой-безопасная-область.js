'use strict';
const assert=require('node:assert/strict');
const {chromium,подготовитьПодделку}=require('./браузер-робот');
(async()=>{const b=await chromium.launch({headless:true});try{
 const p=await b.newPage({reducedMotion:'reduce'});await подготовитьПодделку(p,{версия:'9.0'});
 await p.goto('http://127.0.0.1:8137/морской-бой.html');await p.locator('#море-боты').click();await p.locator('#море-начать').click();await p.locator('#море-случайно').click();await p.locator('#море-готов').click();
 for(const [width,height] of [[320,640],[390,844],[768,1024],[1280,720],[844,390]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>{ПоддельныйТелеграм.поменятьОтступы({системные:{top:24,bottom:16},содержимого:{top:48}});document.querySelector('#экран-игры').scrollTop=0;});
  const errors=await p.evaluate(()=>['.море-шапка','#море-поле-врага','#море-выстрел','#кнопка-эмоции'].flatMap(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top<72||r.bottom>innerHeight-16||r.left<0||r.right>innerWidth?[s+': '+JSON.stringify(r.toJSON())]:[];}));
  assert.deepEqual(errors,[],width+'×'+height);await p.screenshot({path:'tests/снимки/море-telegram-'+width+'.png'});
 }
 console.log('Telegram: поля и действия целиком видны без прокрутки на пяти размерах — OK');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
