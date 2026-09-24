'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот'),М=require('../js/катан-память');
const {chromium,безTelegram}=require('./браузер-робот');
function exchangeFixture(){
  for(let seed=1;seed<100;seed++){
    const data={version:1,rules:2,id:'trade-regression',n:3,seed,level:'обычный',actions:[]},g=П.создать(3,seed,false,2);
    for(let step=0;step<500&&g.phase!=='finished';step++){
      if(g.phase==='main'&&g.turn!==0&&П.сумма(g.players[0].resources)>0)return data;
      const player=П.кто(g),action=Б.ход(П.вид(g,player));П.действие(g,player,action);data.actions.push({player,action});
    }
  }throw Error('Нет позиции для обмена');
}
(async()=>{
  for(let seed=1;seed<=120;seed++){
    const g=П.создать(4,seed,false,2),last=g.startRolls.at(-1),max=Math.max(...last.map(r=>П.сумма(r.dice)));
    assert.equal(last.filter(r=>П.сумма(r.dice)===max).length,1);assert.equal(last.find(r=>П.сумма(r.dice)===max).player,g.start);
    assert.deepEqual(g.setup.slice(4),g.setup.slice(0,4).reverse());
    assert.deepEqual(М.восстановить({version:1,rules:2,seed,n:4,level:'обычный',actions:[]}),g);
  }
  const data=exchangeFixture(),browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
    await безTelegram(page);page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
    if(process.env.CATAN_OLD_UI){const old=require('node:child_process').execFileSync('git',['show','a7f0ff5:js/катан-экран.js'],{encoding:'utf8'});await page.route(url=>decodeURIComponent(url.pathname)==='/js/катан-экран.js',r=>r.fulfill({contentType:'text/javascript',body:old}));}
    await page.goto('http://127.0.0.1:8137/катан.html');await page.evaluate(d=>localStorage.setItem('catan-match-v1',JSON.stringify(d)),data);await page.reload();
    await page.locator('#кат-продолжить').click();await page.locator('#кат-обмен').click();
    const before=await page.evaluate(()=>localStorage.getItem('catan-match-v1'));await page.clock.fastForward(60000);
    assert.equal(await page.evaluate(()=>localStorage.getItem('catan-match-v1')),before,'Бот изменил позицию во время ввода обмена');
    assert(await page.locator('#кат-диалог').getByRole('spinbutton',{name:'Отдаю: Дерево',exact:true}).isVisible());
    await page.screenshot({path:'tests/снимки/катан-обмен-v2.png'});
    await page.keyboard.press('Escape');await page.clock.fastForward(1200);
    assert.notEqual(await page.evaluate(()=>localStorage.getItem('catan-match-v1')),before,'Бот не продолжил после закрытия окна');
    await page.locator('#экран-игры [data-back]').click();await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
    await page.screenshot({path:'tests/снимки/катан-лобби-v2.png'});
    await page.setViewportSize({width:1440,height:960});await page.locator('#кат-продолжить').click();
    await page.waitForFunction(()=>!document.querySelector('.кат-карта').classList.contains('загрузка'));
    const vertical=await page.locator('#кат-поле .кат-дорога:not(.доступно)').evaluateAll(lines=>lines.filter(e=>e.getAttribute('x1')===e.getAttribute('x2')).map(e=>getComputedStyle(e).filter));
    assert(vertical.length>0,'Сценарий должен содержать вертикальную дорогу');assert(vertical.every(f=>f==='none'),'Фильтр с нулевой шириной скрывает вертикальные дороги');
    await page.screenshot({path:'tests/снимки/катан-игра-v2-1440.png'});
    const dice=await page.locator('#кат-кубики .кат-кубик').evaluateAll(es=>es.map(e=>({value:Number(e.getAttribute('aria-label').split(': ')[1]),dots:e.children.length})));assert(dice.length===2);assert(dice.every(d=>d.value===d.dots));
    await page.locator('#кат-игроки button').first().click();assert.match(await page.locator('#кат-диалог-тело').innerText(),/Поселения/);assert.match(await page.locator('#кат-диалог-тело').innerText(),/Разыграно рыцарей/);await page.locator('#кат-закрыть').click();
    await page.locator('#кат-ресурсы button').first().click();assert.match(await page.locator('#кат-диалог-тело').innerText(),/Это работает на бросках всех игроков/);await page.locator('#кат-закрыть').click();
    assert.deepEqual(errors,[]);console.log('Катан: первый игрок по броскам, воспроизводимое сохранение, пауза бота при обмене и продолжение после Escape — OK');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
