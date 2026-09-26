'use strict';
const assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
process.env.ДАННЫЕ_ИГРЫ=path.join(os.tmpdir(),'catan-browser-'+process.pid);
const adapter=require('../server/игры/катан');adapter.темпБота.обычный=80;adapter.темпБота.внеОчереди=80;
const server=require('../server/сервер').создатьСервер(),Б=require('../js/катан-бот');
const {chromium,безTelegram}=require('./браузер-робот'),{ход}=require('./катан-действия-браузера');
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true}),errors=[];
  try{
    const base='http://127.0.0.1:'+server.address().port,pages=[];
    for(let i=0;i<2;i++){
      const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));
      await p.goto('http://127.0.0.1:8137/катан.html?server='+base);
      await p.evaluate(()=>{const original=window.ИграПоСети.показатьВид;window.ИграПоСети.показатьВид=function(v){window.__publicView=v.катан;return original(v);};});pages.push(p);
    }
    const [a,c]=pages;await a.locator('#лобби-найти-игру').click();await a.locator('#открытые-столы-создать').click();
    await a.locator('#кат-число-онлайн').getByRole('radio',{name:'Трое'}).click();
    // С 26.09 «Дружелюбный разбойник», «Мягкий старт» и «Время на ход» спрятаны за
    // кнопку «Дополнительные настройки» — она уводит на отдельный экран #кат-доп-настройки,
    // «Готово» возвращает на #экран-друга (см. js/катан-экран.js, back() и optionsReturn).
    await a.locator('#экран-друга .кат-доп-настройки-кнопка').click();await a.locator('#кат-доп-настройки').waitFor();
    await a.locator('#кат-доп-настройки').getByRole('checkbox',{name:/Дружелюбный/}).check();await a.locator('#кат-доп-настройки').getByRole('checkbox',{name:/Мягкий/}).check();await a.locator('#кат-доп-настройки').getByRole('combobox',{name:'Время на ход'}).selectOption('120');
    await a.locator('#кат-доп-настройки').getByRole('button',{name:'Готово'}).click();await a.locator('#экран-друга').waitFor();
    const creating=a.waitForResponse(r=>decodeURIComponent(new URL(r.url()).pathname)==='/создать');await a.locator('#кнопка-создать-игру').click();const ticket=await(await creating).json();
    await a.locator('#комната').waitFor();assert.equal(await a.locator('#комната-стол button').count(),3);assert.match(await a.locator('#комната-правила').innerText(),/Катан/);
    assert.match(await a.locator('#комната-правила').innerText(),/Дружелюбный разбойник/);assert.match(await a.locator('#комната-правила').innerText(),/120 с/);
    const header=await a.locator('#экран-комнаты > .верх-игры').boundingBox();assert(header.width>330,'Навигация комнаты сжалась в центре');
    await a.locator('#кнопка-комната-ещё').click();await a.locator('#лист-игры').waitFor();await a.locator('#кнопка-лист-игры-закрыть').click();
    await a.screenshot({path:'tests/снимки/катан-онлайн-комната.png'});
    await c.locator('#лобби-найти-игру').click();await c.locator('#открытые-столы-создать').click();await c.locator('#кнопка-войти-по-коду').click();await c.locator('#поле-кода').fill(ticket.код);await c.locator('#кнопка-войти').click();await c.locator('#комната').waitFor();
    await a.waitForFunction(()=>document.querySelectorAll('#комната-стол .рассадка__место--свободно').length===1);
    await a.locator('#комната-стол button').nth(2).click();await a.locator('#лист-места').getByRole('button',{name:/Посадить бота/}).click();await a.locator('#комната-начать').click();
    for(const p of pages)await p.locator('#экран-игры').waitFor();
    await c.reload();await c.evaluate(()=>{const original=window.ИграПоСети.показатьВид;window.ИграПоСети.показатьВид=function(v){window.__publicView=v.катан;return original(v);};});await c.locator('#кнопка-вернуться-в-игру').click();await c.locator('#экран-игры').waitFor();
    let steps=0;
    // Реальная торговля между игроками (предложения/отказы) требует заметно больше
    // шагов, чем простая застройка — прогоны с рабочим обменом доигрывали партию
    // за 4-5.5 тысяч шагов (кости случайны, разброс есть), поэтому бюджет поднят
    // с 2000 до 8000 с запасом (проверено диагностикой).
    while(steps++<8000){
      if(await a.evaluate(()=>window.__publicView?.phase==='finished'))break;
      for(const p of pages){
        const view=await p.evaluate(()=>window.__publicView);if(!view||view.phase==='finished')continue;
        const action=Б.ход(view,'сложный');if(action){
          // ход() возвращает true, если действие пропущено как устаревшее (кто-то другой
          // уже разрешил то же предложение обмена, пока мы решали) — тогда serial не
          // меняется и ждать его смены не нужно, иначе это пустой таймаут на 30 секунд.
          const пропущено=await ход(p,view,action);
          if(!пропущено){await p.waitForFunction(serial=>window.__publicView.serial!==serial,view.serial);assert.equal(await p.locator('#кат-ошибка').innerText(),'');}
        }
      }
      await a.waitForTimeout(60);if(steps%50===0)console.log('Онлайн: шаг',steps);
    }
    assert(steps<8000);for(const p of pages)await p.locator('#кат-диалог').waitFor();await a.screenshot({path:'tests/снимки/катан-онлайн-победа.png'});assert.deepEqual(errors,[]);
    console.log('Катан онлайн: два независимых браузера, стол, бот, возврат и полная партия — OK');
    await fetch(base+'/выйти',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({код:ticket.код,пропуск:ticket.пропуск})});
  }finally{await b.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
