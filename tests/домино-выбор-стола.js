'use strict';
const assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
process.env.ДАННЫЕ_ИГРЫ=path.join(os.tmpdir(),'domino-seating-'+process.pid);
const server=require('../server/сервер').создатьСервер();
const {chromium,безTelegram}=require('./браузер-робот');
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const b=await chromium.launch({headless:true});
  try {
    const p=await b.newPage({viewport:{width:390,height:844}});await безTelegram(p);
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto('http://127.0.0.1:8137/домино.html?server=http://127.0.0.1:'+server.address().port);
    await p.locator('#дом-боты').click();
    assert.equal(await p.locator('#дом-настройки select:visible').count(),0);
    await p.getByRole('button',{name:'Посадить бота',exact:true}).first().click();
    assert.equal(await p.locator('#дом-мест').inputValue(),'3');
    await p.getByRole('button',{name:'Посадить бота',exact:true}).click();
    assert.equal(await p.locator('#дом-мест').inputValue(),'4');
    await p.getByRole('button',{name:'Убрать бота 2',exact:true}).click();
    assert.equal(await p.locator('#дом-мест').inputValue(),'3');
    for(const [width,height] of [[320,640],[390,844],[768,1024],[1280,720],[844,390]]) {
      await p.setViewportSize({width,height});await p.locator('#дом-настройки').evaluate(e=>e.scrollTop=0);
      const check=()=>p.locator('#дом-выбор-стол button').evaluateAll(es=>es.length===4&&es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.left>=0&&r.right<=innerWidth;}));
      assert(await check(),'Места вышли за экран '+width);
      if(width===390){const bad=await p.addStyleTag({content:'#дом-выбор-стол { transform:translateX(800px)!important; }'});assert.equal(await check(),false);await bad.evaluate(e=>e.remove());}
      await p.screenshot({path:`tests/снимки/домино-выбор-стола-${width}.png`});
    }
    await p.locator('#дом-начать').click();assert.equal(await p.locator('.дом-игрок').count(),3);
    await p.goto('http://127.0.0.1:8137/домино.html?server=http://127.0.0.1:'+server.address().port);
    await p.setViewportSize({width:390,height:844});
    await p.locator('#лобби-найти-игру').click();await p.locator('#открытые-столы-создать').click();
    await p.locator('#дом-онлайн-число').getByRole('radio',{name:'Трое'}).click();
    const creating=p.waitForResponse(r=>decodeURIComponent(new URL(r.url()).pathname)==='/создать');
    await p.getByRole('button',{name:'Выбрать игрока на место 2',exact:true}).click();
    const ticket=await(await creating).json();
    await p.locator('#лист-места').getByRole('button',{name:/Посадить бота/}).click();
    await p.waitForFunction(()=>document.querySelectorAll('#комната-стол .рассадка__место--бот').length===1);
    assert.equal(await p.locator('#комната-стол button').count(),3);
    await p.screenshot({path:'tests/снимки/домино-онлайн-рассадка.png'});
    await fetch('http://127.0.0.1:'+server.address().port+'/выйти',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({код:ticket.код,пропуск:ticket.пропуск})});
    assert.deepEqual(errors,[]);console.log('Стол Домино: добавить/убрать бота, запуск втроём, пять размеров, обнаружение сломанной раскладки, реальная онлайн-рассадка — OK');
  }finally{await b.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
