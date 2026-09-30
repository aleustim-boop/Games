'use strict';
const assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
process.env.ДАННЫЕ_ИГРЫ=path.join(os.tmpdir(),'deb-seating-'+process.pid);
const server=require('../server/сервер').создатьСервер();
const {chromium,безTelegram}=require('./браузер-робот');
// Единственный довод этого стенда — режим комнаты ('2'/'3'/'4'/'2x2'),
// НЕ порт: страница берётся с фиксированного адреса ниже (общий сервер
// раздачи страниц на 8137). Чужое число в доводе (например, порт из
// --страницы другого прогона) раньше молча превращалось в несуществующий
// режим и вешало locator('[data-друзья-режим="…"]') на минуту — теперь
// честный отказ сразу.
const РЕЖИМЫ=['2','3','4','2x2'];
if(process.argv[2]&&!РЕЖИМЫ.includes(process.argv[2])){console.error('Неверный режим «'+process.argv[2]+'» — этот довод означает режим комнаты, а не порт. Ждёт один из: '+РЕЖИМЫ.join(', '));process.exit(1);}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true});try{
 for(const mode of (process.argv[2]?[process.argv[2]]:['2','3','4','2x2'])){
  const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];await безTelegram(p);p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8137/деберц.html?server=http://127.0.0.1:'+server.address().port);
  await p.locator('#лобби-найти-игру').click();await p.locator('#открытые-столы-создать').click();await p.locator('[data-друзья-режим="'+mode+'"]').click();const creating=p.waitForResponse(r=>decodeURIComponent(new URL(r.url()).pathname)==='/создать');await p.locator('#кнопка-создать-игру').click();const ticket=await (await creating).json();await p.locator('#комната').waitFor();
  const n=mode==='2x2'?4:+mode;assert.equal(await p.locator('#комната-стол button').count(),n);assert.match(await p.locator('#комната-правила').innerText(),/Деберц/);assert(await p.locator('#комната-начать').isDisabled());assert(await p.locator('#комната-начать').evaluate(e=>e.classList.contains('комната__ожидает')));
  for(const width of [320,390,768]){await p.setViewportSize({width,height:844});assert.deepEqual(await p.locator('#комната-стол button').evaluateAll(es=>es.flatMap(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1?[r.toJSON()]:[]})),[]);}
  await p.setViewportSize({width:390,height:844});
  if(mode==='2x2'){await fetch('http://127.0.0.1:'+server.address().port+'/войти',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({код:ticket.код,имя:'Анна'})});await p.locator('#комната-стол').getByRole('button',{name:'Анна',exact:true}).waitFor();}
  for(let i=mode==='2x2'?2:1;i<n;i++){await p.locator('#комната-стол button').nth(i).click();await p.locator('#лист-места').getByRole('button',{name:/Посадить бота/}).click();await p.waitForFunction(n=>document.querySelectorAll('#комната-стол .рассадка__место--бот').length===n,mode==='2x2'?i-1:i);}
  if(mode==='2x2'){
   const partner=await p.locator('#комната-стол button').nth(1).innerText();await p.locator('#комната-стол button').nth(1).click();await p.getByRole('button',{name:/Взять в напарники/}).click();await p.waitForFunction(name=>document.querySelector('#комната-команда-наша').textContent.includes(name),partner,{timeout:5000}).catch(async e=>{console.log('Wanted',JSON.stringify(partner),'Actual',await p.locator('#комната').innerText());throw e;});
   await p.screenshot({path:'tests/снимки/деберц-рассадка-команды.png'});
  }
  assert(await p.locator('#комната-начать').isEnabled());assert.equal(await p.locator('#комната-начать').evaluate(e=>e.classList.contains('комната__ожидает')),false);
  await p.locator('#комната-начать').click();await p.locator('#экран-игры').waitFor();assert.deepEqual(errors,[]);await fetch('http://127.0.0.1:'+server.address().port+'/выйти',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({код:ticket.код,пропуск:ticket.пропуск})});await p.close();console.log(mode+': места, боты, команды и начало — OK');
 }
}finally{await b.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
