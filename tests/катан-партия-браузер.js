'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот'),М=require('../js/катан-память');
const {chromium,безTelegram}=require('./браузер-робот'),{ход}=require('./катан-действия-браузера');
(async()=>{
  const b=await chromium.launch({headless:true});
  try{
    const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));
    await p.clock.install();await p.goto(process.env.CATAN_URL||'http://127.0.0.1:8137/катан.html');await p.locator('#кат-боты').click();await p.locator('#кат-начать').click();
    let steps=0,game;const seen=new Set();
    while(steps++<1800){
      const data=await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')));game=М.восстановить(data);
      if(game.phase==='finished')break;
      const view=П.вид(game,0),a=Б.ход(view,'сложный');
      if(a){seen.add(a.type+(a.card?':'+a.card:''));await ход(p,view,a);assert.equal(await p.locator('#кат-ошибка').innerText(),'');}
      else await p.clock.fastForward(1000);
      if(steps%80===0)console.log('Шаг',steps,'очки',game.players.map((_,i)=>П.очки(game,i)).join(':'));
    }
    assert.equal(game.phase,'finished');await p.locator('#кат-диалог').waitFor();assert.match(await p.locator('#кат-диалог-заголовок').innerText(),/победил|Победитель/);
    await p.screenshot({path:'tests/снимки/катан-полная-партия.png'});
    assert.deepEqual(errors,[]);console.log('Катан: полная партия через кнопки и карту — OK, действий '+steps+', покрыто '+[...seen].join(', '));
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
