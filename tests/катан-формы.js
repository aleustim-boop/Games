'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот'),М=require('../js/катан-память');
const {chromium,подготовитьПодделку}=require('./браузер-робот'),{ход}=require('./катан-действия-браузера');
function fixtures(){
  const found={};
  for(let seed=1;seed<80&&Object.keys(found).length<3;seed++){
    const data={version:1,id:'fixture-'+seed,seed,n:4,level:'сложный',actions:[]},g=П.создать(4,seed);
    for(let step=0;step<1000&&g.phase!=='finished';step++){
      const v=П.вид(g,0);
      const type=v.phase==='discard'&&v.discard[0]>0?'discard':v.legal.dev.includes('plenty')?'plenty':v.phase==='main'&&v.turn===0&&v.hand.some(Boolean)?'trade':null;
      if(type&&!found[type])found[type]=JSON.parse(JSON.stringify(data));
      const who=П.кто(g),action=Б.ход(П.вид(g,who),'сложный');П.действие(g,who,action);data.actions.push({player:who,action});
    }
  }
  assert.deepEqual(Object.keys(found).sort(),['discard','plenty','trade']);return found;
}
(async()=>{
  const cases=fixtures(),b=await chromium.launch();
  try{
    const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
    await подготовитьПодделку(p,{версия:'8.0',отступы:{системные:{top:28,bottom:24},содержимого:{top:40}}});
    await p.goto('http://127.0.0.1:8137/катан.html');
    for(const type of ['discard','plenty','trade']){
      await p.evaluate(data=>localStorage.setItem('catan-match-v1',JSON.stringify(data)),cases[type]);await p.reload();await p.locator('#кат-продолжить').click();
      const before=М.восстановить(cases[type]),v=П.вид(before,0);
      const rects=await p.evaluate(()=>({top:document.querySelector('#экран-игры .кат-верх').getBoundingClientRect().top,bottom:document.getElementById('кат-главное').getBoundingClientRect().bottom}));assert(rects.top>=68);assert(rects.bottom<=820);
      if(type==='trade'){
        const r=v.hand.findIndex(Boolean),want=(r+1)%5;await p.locator('#кат-обмен').click();await p.getByRole('button',{name:'С игроками',exact:true}).click();
        const names=['Дерево','Глина','Шерсть','Зерно','Руда'];await p.getByRole('spinbutton',{name:'Отдаю: '+names[r],exact:true}).fill('1');await p.getByRole('spinbutton',{name:'Получаю: '+names[want],exact:true}).fill('1');await p.getByRole('button',{name:'Предложить обмен',exact:true}).click();
        await p.locator('#кат-предложение button').waitFor();await p.locator('#кат-предложение button').click();await p.locator('#кат-диалог').getByRole('button',{name:'Отменить предложение'}).click();
        const data=await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')));assert.equal(М.восстановить(data).offer,null);
      }else{
        let action;if(type==='discard')action=Б.ход(v,'сложный');else{const resources=[0,0,0,0,0];for(let i=0;i<Math.min(2,П.сумма(v.bank));i++){const r=v.bank.findIndex((n,r)=>n>resources[r]);resources[r]++;}action={type:'dev',card:'plenty',resources};}
        await ход(p,v,action);const data=await p.evaluate(()=>JSON.parse(localStorage.getItem('catan-match-v1')));assert(data.actions.some((x,i)=>i>=cases[type].actions.length&&x.player===0&&x.action.type===action.type));
        assert.equal(await p.locator('#кат-ошибка').innerText(),'');
      }
      await p.screenshot({path:`tests/снимки/катан-${type}-telegram.png`});
    }
    await p.locator('#экран-игры [data-back]').click();await p.locator('#кат-профиль').click();await p.locator('#экран-профиля-игрока').waitFor();
    await p.setViewportSize({width:844,height:390});await p.goto('http://127.0.0.1:8137/катан.html');await p.locator('#кат-продолжить').click();
    await p.evaluate(()=>{document.documentElement.style.setProperty('--отступ-слева','47px');document.documentElement.style.setProperty('--отступ-справа','20px');});
    const landscape=await p.locator('#экран-игры').evaluate(e=>({left:parseFloat(getComputedStyle(e).paddingLeft),right:parseFloat(getComputedStyle(e).paddingRight)}));
    assert(landscape.left>=47,'Вырез экрана слева перекрывает поле');assert(landscape.right>=20,'Справа не учтён безопасный отступ');
    assert.deepEqual(errors,[]);console.log('Катан: сброс, изобилие, предложение/отмена обмена, профиль и безопасные отступы Telegram — OK');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
