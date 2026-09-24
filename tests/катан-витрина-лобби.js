'use strict';
const assert=require('node:assert/strict');
const {chromium,безTelegram,подготовитьПодделку}=require('./браузер-робот');
const base=process.env.CATAN_SITE||'http://127.0.0.1:8137/';
(async()=>{
  const b=await chromium.launch();
  try{
    const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));
    await p.goto(base+'index.html');
    const tile=p.locator('[data-игра="катан"]');
    await p.getByRole('button',{name:'Карточные',exact:true}).click();assert.equal(await tile.isVisible(),false);
    await p.getByRole('button',{name:'Настольные',exact:true}).click();assert.equal(await tile.isVisible(),true);
    await p.getByRole('button',{name:'Все',exact:true}).click();
    for(const width of [320,390,430,1280]){
      await p.setViewportSize({width,height:width===1280?900:844});await tile.scrollIntoViewIfNeeded();
      const r=await tile.evaluate(e=>{const n=e.querySelector('.плитка-игры__название'),s=getComputedStyle(n),b=e.getBoundingClientRect();return {titleWidth:n.getBoundingClientRect().width,titleHeight:n.getBoundingClientRect().height,clip:s.clipPath,ratio:b.width/b.height,scroll:document.documentElement.scrollWidth,viewport:innerWidth};});
      assert(r.titleWidth>50&&r.titleHeight>20&&r.clip==='none','Название Катана скрыто');assert(r.ratio>2,'Карточка занимает слишком много места');assert(r.scroll<=r.viewport+1);
      await p.screenshot({path:`tests/снимки/катан-витрина-${width}.png`});
    }
    await p.setViewportSize({width:390,height:844});await tile.click();await p.locator('#кат-боты').waitFor();
    await p.locator('#кат-правила').click();assert.match(await p.locator('#кат-диалог-тело').innerText(),/Цель — 10 очков/);await p.locator('#кат-закрыть').click();
    await p.locator('#кат-боты').click();
    for(const [label,n]of [['Трое',3],['Четверо',4]]){
      await p.locator('#кат-число').getByRole('radio',{name:label,exact:true}).click();assert.equal(await p.locator('#кат-стол-ботов button').count(),n);
      assert.equal(await p.locator('#кат-стол-ботов button svg').count(),n,'За столом пустые аватары');
    }
    await p.locator('#кат-стол-ботов button').nth(1).click();await p.getByRole('button',{name:'Сложный · опытные соперники',exact:true}).click();
    assert.equal(await p.locator('#кат-уровень').getByRole('radio',{name:'Сложный',exact:true}).getAttribute('aria-checked'),'true');
    await p.locator('#кат-настройки [data-back]').click();await p.reload();await p.locator('#кат-боты').click();
    assert.equal(await p.locator('#кат-уровень').getByRole('radio',{name:'Сложный',exact:true}).getAttribute('aria-checked'),'true');
    await p.screenshot({path:'tests/снимки/катан-выбор-стола.png'});
    await p.locator('#кат-начать').click();await p.locator('#экран-игры').waitFor();
    const initial=await p.evaluate(()=>localStorage.getItem('catan-match-v1'));assert(initial);await p.locator('#экран-игры [data-back]').click();
    for(const [width,height]of [[320,640],[390,844],[844,390],[1280,900]]){
      await p.setViewportSize({width,height});
      for(const selector of ['#кат-продолжить','#кат-боты','#лобби-найти-игру']){
        await p.locator(selector).evaluate(e=>e.scrollIntoView({block:'center'}));
        const visible=await p.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e.contains(hit);});assert(visible,selector+' перекрыт навигацией');
      }
      const nav=await p.locator('#экран-лобби nav').boundingBox();assert(nav.width>=width-1,'Нижние вкладки сжаты');
      await p.screenshot({path:`tests/снимки/катан-лобби-${width}.png`});
    }
    await p.locator('#катан-вкладка-игры').click();await p.locator('[data-игра="катан"]').waitFor();await p.locator('[data-игра="катан"]').click();await p.locator('#кат-продолжить').click();await p.locator('#экран-игры').waitFor();
    const record=await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')));assert.equal(record.id,JSON.parse(initial).id,'Переход к списку игр потерял партию');
    const ids=await p.locator('svg defs [id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(new Set(ids).size,ids.length,'Предпросмотры ломают определения основного острова');
    const tg=await b.newPage({viewport:{width:390,height:844}});await подготовитьПодделку(tg,{версия:'8.0',отступы:{системные:{top:24,bottom:20},содержимого:{top:40}}});
    await tg.goto(base+'катан.html');assert.equal(await tg.locator('#кат-имя').innerText(),'Проверяющий');
    assert.equal(await tg.locator('#экран-лобби .кат-верх').isVisible(),false,'Дублируется шапка Telegram');
    const top=await tg.locator('#экран-лобби .кат-заголовок').boundingBox();assert(top.y>=64);
    await tg.screenshot({path:'tests/снимки/катан-лобби-telegram.png'});await tg.close();
    assert.deepEqual(errors,[]);console.log('Катан: витрина, фильтры, видимое название, рассадка, сложность, переходы, сохранение и Telegram — OK');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
