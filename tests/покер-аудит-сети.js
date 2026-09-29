'use strict';
const A=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
process.env.ДАННЫЕ_ИГРЫ=path.join(os.tmpdir(),'poker-audit-'+process.pid);
const serverModule=require('../server/сервер');serverModule.оснасткаДляПроверки('poker-local-test-only',()=>({ok:true}));
const S=serverModule.создатьСервер(),G=require('../server/игры/покер'),P=require('../js/покер-правила');
(async()=>{await new Promise(r=>S.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+S.address().port;
const req=async(route,body,expected=200)=>{const r=await fetch(base+'/'+encodeURIComponent(route),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await r.json();A.equal(r.status,expected,JSON.stringify(data));return data;};
const view=async key=>{const r=await req('состояние',key);return r.состояние||r;};
const move=(key,a)=>req('ход',{...key,действие:'покер',move:a});
const signed=id=>{const crypto=require('node:crypto'),fields={auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Тест '+id})},key=crypto.createHmac('sha256','WebAppData').update('poker-local-test-only').digest(),hash=crypto.createHmac('sha256',key).update(Object.keys(fields).sort().map(k=>k+'='+fields[k]).join('\n')).digest('hex');return new URLSearchParams({...fields,hash}).toString();};
try{
 // Подбор соединяет именно покеристов, а при пустой очереди даёт явно обозначенного бота.
 const first=await req('подбор',{игра:'покер',initData:signed(8701)});A.equal(first.статус,'ждёт');const second=await req('подбор',{игра:'покер',initData:signed(8702)});A.equal(second.статус,'свели');const matched=await req('подбор-новости',{ключОжидания:first.ключОжидания});A.equal(matched.код,second.код);A.equal((await view(matched)).игра,'покер');A.equal((await view(matched)).покер.bots.filter(Boolean).length,0);await req('выйти',matched);await req('выйти',second);
 const queue=require('../server/подбор');queue.подменитьПорогОжиданияДляПроверки(80);try{const waiting=await req('подбор',{игра:'покер',initData:signed(8703)});const solo=await req('подбор-новости',{ключОжидания:waiting.ключОжидания});A.equal(solo.статус,'свели');const botView=await view(solo);A.equal(botView.игра,'покер');A(botView.покер.bots.includes(true));await req('выйти',solo);}finally{queue.подменитьПорогОжиданияДляПроверки();}
 const pub=await req('создать',{игра:'покер',мест:3,открытый:true,имя:'Тест 8704',initData:signed(8704)}),priv=await req('создать',{игра:'покер',мест:3,открытый:false,имя:'Тест 8705',initData:signed(8705)}),list=await req('открытые-столы',{игра:'покер',initData:signed(8706)});A(list.столы.some(t=>t.игроки.includes('Тест 8704')));A(!list.столы.some(t=>t.игроки.includes('Тест 8705')));await req('выйти',pub);await req('выйти',priv);console.log('Подбор людей, пустая очередь с ботом, публичный/приватный список — OK');
 for(let n=2;n<=6;n++){
  const room=await req('создать',{игра:'покер',мест:n,имя:'Хозяин',открытый:false}),keys=[{код:room.код,пропуск:room.пропуск}];
  for(let i=1;i<n;i++){const guest=await req('войти',{код:room.код,имя:'Друг '+i});keys.push({код:room.код,пропуск:guest.пропуск});}
  A.equal((await req('ход',{...keys[1],действие:'начать'})).принято,false,'Только хозяин начинает');A((await req('ход',{...keys[0],действие:'начать'})).принято);
  let steps=0;
  while(steps++<1500){const v=(await view(keys[0])).покер;if(v.phase==='finished')break;const actor=v.turn,own=(await view(keys[actor])).покер,l=own.legal;
   const a={type:l.next?'next':l.allIn?'allin':l.check?'check':'call',version:own.version};A((await move(keys[actor],a)).принято);
   const after=(await view(keys[0])).покер;A.equal((await move(keys[actor],a)).принято,false,'Повтор старого запроса отклонён');A.equal((await view(keys[0])).покер.version,after.version);
   A.equal(after.players.reduce((s,p)=>s+p.stack+p.total,0),1500*n);
   for(let i=0;i<n;i++){const x=(await view(keys[i])).покер;A.equal(x.me,i);A.equal(x.version,after.version);if(!x.result?.showdown)x.players.forEach((p,j)=>{if(i!==j)A(p.hole.every(c=>c===null));});A(!('seed' in x||'deck' in x));}
  }
  A(steps<1500,'Турнир завершился');A.equal((await view(keys[0])).покер.phase,'finished');
  for(let i=0;i<n-1;i++){A((await req('ход',{...keys[i],действие:'ещё'})).принято);A.equal((await view(keys[0])).покер.phase,'finished');}
  A((await view(keys[0])).яХочуЕщё);A((await req('ход',{...keys[n-1],действие:'ещё'})).принято);
  const rematch=await view(keys[0]);A.equal(rematch.покер.hand,1);A.equal(rematch.покер.phase,'preflop');A.equal(rematch.яХочуЕщё,false);A.equal(rematch.покер.players.reduce((s,p)=>s+p.stack+p.total,0),1500*n);
  if(n>=3){const before=(await view(keys[0])).покер;await req('выйти',keys[n-1]);const after=(await view(keys[0])).покер;A.equal(after.bots[n-1],true,'Ушедшего заменяет явно обозначенный бот');A.equal(after.players[n-1].stack,before.players[n-1].stack);A.equal(after.phase,before.phase);A(after.players[n-1].hole.every(c=>c===null),'Карты ушедшего не раскрываются');}
  for(const key of (n>=3?keys.slice(0,-1):keys))await req('выйти',key);console.log(n+' игроков: турнир, секретность, защита от повторов, реванш после всех согласий — OK');
 }
 // Реальный онлайн-бот: заполнение свободного места и его ход с таймером.
 const room=await req('создать',{игра:'покер',мест:3,имя:'Человек',открытый:false}),host={код:room.код,пропуск:room.пропуск};
 A((await req('ход',{...host,действие:'бот'})).принято);A((await req('ход',{...host,действие:'бот'})).принято);A((await req('ход',{...host,действие:'начать'})).принято);
 let v=(await view(host)).покер;A.equal(v.bots.filter(Boolean).length,2);const initial=v.version;A((await move(host,{type:'call',version:v.version})).принято);
 const deadline=Date.now()+10000;while(Date.now()<deadline){v=(await view(host)).покер;if(v.version>initial+1)break;await new Promise(r=>setTimeout(r,100));}A(v.version>initial+1,'Серверный бот реально походил');await req('выйти',host);
 // Таймер при доступном чеке делает чек, между раздачами раздаёт, при долге — пас.
 const game=G.раздать(null,{игроки:['a','b']});P.action(game.игра,game.игра.turn,{type:'call'});game.deadline=0;const who=game.игра.turn;A(G.ходПоПросрочке(game));A(!game.игра.players[who].folded);A.equal(game.игра.phase,'flop');
 P.action(game.игра,game.игра.turn,{type:'fold'});A.equal(game.игра.phase,'between');game.deadline=0;A(G.ходПоПросрочке(game));A.equal(game.игра.hand,2);
 console.log('Серверные боты, таймер чека, автоматическая следующая раздача — OK');
}finally{S.closeAllConnections();await new Promise(r=>S.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
