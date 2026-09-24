'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот'),М=require('../js/катан-память');
const {chromium,безTelegram}=require('./браузер-робот');
function fixtures(){
  const out={};
  for(let seed=1;seed<100&&Object.keys(out).length<5;seed++){
    const record={version:1,rules:2,id:'presentation-'+seed,n:4,seed,level:'сложный',actions:[]},g=П.создать(4,seed,false,2);
    for(let step=0;step<1500&&g.phase!=='finished';step++){
      const v=П.вид(g,0),remember=k=>{if(!out[k])out[k]=JSON.parse(JSON.stringify(record));};
      if(v.phase==='setupSettlement'&&v.turn===0)remember('setup');
      if(v.phase==='roll'&&v.turn===0)remember('roll');
      if(v.phase==='main'&&v.turn===0){
        if(v.legal.development)remember('buy');
        if(v.hand.some((n,r)=>n>=v.rates[r])&&v.bank.some(Boolean))remember('bank');
        if(!out.offer)outer:for(let give=0;give<5;give++)for(let want=0;want<5;want++)if(give!==want&&v.hand[give]){
          for(let to=1;to<4;to++){
            const giveCards=[0,0,0,0,0],wantCards=[0,0,0,0,0];giveCards[give]=1;wantCards[want]=1;
            const view=П.вид(g,to);view.offer={id:123,from:0,to,give:giveCards,want:wantCards};
            if(Б.обмен(view)){out.offer={record:JSON.parse(JSON.stringify(record)),give,want,to};break outer;}
          }
        }
      }
      const player=П.кто(g),action=Б.ход(П.вид(g,player),'сложный');П.действие(g,player,action);record.actions.push({player,action});
    }
  }
  assert.equal(Object.keys(out).length,5);return out;
}
(async()=>{
  const cases=fixtures(),browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));await p.clock.install();
    await p.goto('http://127.0.0.1:8137/катан.html');
    async function load(record){await p.evaluate(d=>localStorage.setItem('catan-match-v1',JSON.stringify(d)),record);await p.reload();await p.locator('#кат-продолжить').click();}
    async function state(){return М.восстановить(await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1'))));}
    await load(cases.setup);let before=await state();
    await p.locator('#кат-поле [data-vertex][role=button]').first().click();assert.equal((await state()).serial,before.serial,'Выбор ещё не должен строить');
    assert.equal(await p.locator('#кат-главное').innerText(),'Поставить поселение');await p.locator('#кат-главное').click();assert.equal((await state()).phase,'setupRoad');
    await p.screenshot({path:'tests/снимки/катан-v3-расстановка.png'});
    await load(cases.roll);before=await state();await p.locator('#кат-главное').click();
    await p.locator('#кат-бросок').waitFor();let current=await state();assert.equal(current.serial,before.serial+1);
    const values=await p.locator('#кат-бросок .кат-кубик').evaluateAll(es=>es.map(e=>e.children.length));assert.deepEqual(values,current.dice);
    assert.match(await p.locator('#кат-бросок').innerText(),/Вы бросаете/);assert(await p.locator('#кат-главное').isDisabled());
    await p.clock.fastForward(1800);assert(await p.locator('#кат-бросок').isVisible(),'Результат броска исчез слишком рано');assert.equal((await state()).serial,current.serial);
    await p.screenshot({path:'tests/снимки/катан-v3-бросок.png'});
    await p.clock.fastForward(1300);assert(!(await p.locator('#кат-бросок').isVisible()));
    await load(cases.buy);before=await state();await p.locator('#кат-карты').click();await p.getByRole('button',{name:'Купить карту развития',exact:true}).click();
    current=await state();assert.equal(current.deck.length,before.deck.length-1);assert.equal(current.players[0].dev.length,before.players[0].dev.length+1);
    assert.deepEqual(current.players[0].resources,before.players[0].resources.map((n,i)=>n-П.ЦЕНЫ.development[i]));
    assert(current.players[0].dev.at(-1).bought===current.round);await p.screenshot({path:'tests/снимки/катан-v3-развитие.png'});await p.locator('#кат-закрыть').click();
    await load(cases.bank);before=await state();let v=П.вид(before,0);const give=v.hand.findIndex((n,r)=>n>=v.rates[r]),want=v.bank.findIndex((n,r)=>n&&r!==give);
    await p.locator('#кат-обмен').click();await p.getByRole('combobox',{name:'Отдать банку'}).selectOption(String(give));await p.getByRole('combobox',{name:'Получить из банка'}).selectOption(String(want));await p.getByRole('button',{name:'Обменять',exact:true}).click();
    current=await state();assert.equal(current.players[0].resources[give],before.players[0].resources[give]-v.rates[give]);assert.equal(current.players[0].resources[want],before.players[0].resources[want]+1);await p.locator('#кат-закрыть').click();
    await load(cases.offer.record);before=await state();const o=cases.offer,names=['Дерево','Глина','Шерсть','Зерно','Руда'];
    await p.locator('#кат-обмен').click();await p.getByRole('button',{name:'С игроками',exact:true}).click();await p.getByRole('combobox',{name:'Кому предложить обмен'}).selectOption(String(o.to));await p.getByRole('spinbutton',{name:'Отдаю: '+names[o.give],exact:true}).fill('1');await p.getByRole('spinbutton',{name:'Получаю: '+names[o.want],exact:true}).fill('1');await p.screenshot({path:'tests/снимки/катан-v3-торговля.png'});await p.getByRole('button',{name:'Предложить обмен',exact:true}).click();
    current=await state();assert(current.offer);const serial=current.serial;
    await p.clock.fastForward(1500);assert.equal((await state()).serial,serial,'Бот ответил раньше паузы');
    await p.clock.fastForward(1600);current=await state();assert.equal(current.offer,null);assert.equal(current.players[0].resources[o.give],before.players[0].resources[o.give]-1);assert.equal(current.players[0].resources[o.want],before.players[0].resources[o.want]+1);
    assert.deepEqual(errors,[]);console.log('Катан: подтверждение постройки, видимые реальные кубики, пауза 2,8 с, покупка развития, банк и обмен с ботом — OK');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
