'use strict';
const A=require('node:assert/strict'),P=require('../игры/покер/покер-правила'),{chromium,безTelegram}=require('./браузер-робот');
const URL=process.env.POKER_TEST_URL||'http://127.0.0.1:8137/покер.html';
(async()=>{const browser=await chromium.launch();try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await безTelegram(p);await p.goto(URL);
 await p.locator('#pk-bots').click();await p.locator('#pk-count').selectOption('2');await p.locator('#pk-start').click();
 const cards=await p.locator('#pk-hand [data-card]').evaluateAll(es=>es.map(e=>e.dataset.card));
 await p.locator('#pk-help').click();const before=await p.evaluate(()=>localStorage.getItem('poker-match-v1'));await p.waitForTimeout(2700);A.equal(await p.evaluate(()=>localStorage.getItem('poker-match-v1')),before,'Открытое меню приостанавливает локальных ботов');await p.locator('#pk-close').click();
 await p.reload();await p.locator('#pk-resume').click();A.deepEqual(await p.locator('#pk-hand [data-card]').evaluateAll(es=>es.map(e=>e.dataset.card)),cards);
 await p.locator('#pk-actions').getByRole('button',{name:'Повысить',exact:true}).click();await p.locator('#pk-range').fill('125');A.match(await p.locator('#pk-raise-confirm').innerText(),/125/);await p.locator('#pk-raise-confirm').click();A.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('poker-match-v1')).actions.at(-1).move.to),125);
 // Сетевое состояние приходит во время просмотра лобби: экран не перехватывается.
 const g=P.create(2,19);const state={код:'audit-room',версия:1,сыграноПартий:1,покер:{...P.view(g,0),names:['Вы','Друг']}};
 await p.evaluate(state=>{window.auditState=state;ИграПоСети.начать();ИграПоСети.показатьВид(state);},state);
 await p.locator('.pk-game [data-back]').click();await p.locator('#pk-dialog').getByRole('button',{name:'В лобби',exact:true}).click();
 await p.evaluate(()=>ИграПоСети.показатьВид({...auditState,версия:2}));A(await p.locator('#экран-лобби').isVisible());await p.locator('#pk-online-resume').click();A(await p.locator('#экран-игры').isVisible());
 // Запоздалый запрос блокирует повторное нажатие; ошибка возвращает рабочие кнопки.
 await p.evaluate(()=>{window.sent=0;Сеть.отправитьХод=()=>{sent++;return new Promise(resolve=>window.releaseMove=resolve);};});await p.locator('#pk-actions').getByRole('button',{name:'Уравнять 10',exact:true}).click();A(await p.locator('#pk-actions button').first().isDisabled());A.equal(await p.evaluate(()=>sent),1);
 await p.evaluate(()=>releaseMove({принято:false,причина:'Проверка обрыва связи'}));await p.waitForFunction(()=>document.getElementById('pk-error').textContent.includes('обрыва'));A(!(await p.locator('#pk-actions button').first().isDisabled()));await p.locator('#pk-actions').getByRole('button',{name:'Повысить',exact:true}).click();A(!(await p.locator('#pk-raise-confirm').isDisabled()),'Подтверждение ставки снова работает после ошибки');await p.locator('#pk-actions').getByRole('button',{name:'Повысить',exact:true}).click();
 // Все шесть делят банк: результат не перекрывает общие/свои карты.
 const tie=P.create(6,7);tie.phase='river';tie.board=[8,9,10,11,12];tie.currentBet=0;tie.turn=0;tie.players.forEach((x,i)=>{x.hole=[13+i*2,14+i*2];x.stack=1499;x.bet=0;x.total=1;x.acted=null;});for(let i=0;i<6;i++)P.action(tie,tie.turn,{type:'check'});
 const tieState={код:'tie',версия:1,покер:{...P.view(tie,0),names:['Вы','Александр с длинным именем','Друг 2','Друг 3','Друг 4','Друг 5']}};
 await p.evaluate(s=>ИграПоСети.показатьВид(s),tieState);
 for(const [width,height]of [[320,740],[390,844],[600,360],[740,360],[820,1180],[844,390],[1024,768],[1440,900]]){
  await p.setViewportSize({width,height});A(await p.locator('#экран-игры').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'overflow '+width);
  const overlap=await p.evaluate(()=>{const a=document.getElementById('pk-result').getBoundingClientRect(),b=document.getElementById('pk-hand').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});A(!overlap,'Итог не перекрывает свои карты '+width);
  await p.locator('#pk-showdown').click();A.equal(await p.locator('.pk-showdown-row').count(),6);A(await p.locator('#pk-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await p.screenshot({path:'tests/снимки/покер-аудит-вскрытие-'+width+'.png'});await p.locator('#pk-close').click();
 }
 // Выбывший игрок видит явный результат и выход, а не обещание будущего хода.
 const out=P.view(P.create(3,91),0);out.players[0].out=true;out.players[0].stack=0;out.players[0].hole=[];out.turn=1;out.legal={};out.board=[3,10,26];await p.evaluate(v=>ИграПоСети.показатьВид({код:'out',версия:1,покер:v}),out);A.match(await p.locator('#pk-status').innerText(),/Вы выбыли/);A(await p.locator('#pk-actions').getByRole('button',{name:'В лобби',exact:true}).isVisible());
 // Нажатый реванш меняет подпись и исключает повторную отправку.
 const finished={...P.view(P.create(2,9),0),phase:'finished',winner:1,legal:{},turn:-1};await p.evaluate(v=>{window.finalState={код:'done',версия:1,покер:v};ИграПоСети.показатьВид(finalState);Сеть.отправитьХод=async()=>{ИграПоСети.показатьВид({...finalState,версия:2,яХочуЕщё:true});return{принято:true};};},finished);await p.getByRole('button',{name:'Реванш',exact:true}).click();A(await p.getByRole('button',{name:'Вы готовы к реваншу',exact:true}).isDisabled());A.match(await p.locator('#pk-status').innerText(),/Ждём согласия/);
 A.deepEqual(errors,[]);console.log('Браузер: сохранение, пауза меню, точная ставка, лобби без перехвата, обрыв/повтор запроса, ничья шести игроков на 8 экранах, выбывание и ожидание реванша — OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
