'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
process.env.ДАННЫЕ_ИГРЫ=path.join(os.tmpdir(),'catan-clock-'+process.pid);
const server=require('../server/сервер').создатьСервер(),rooms=require('../server/комнаты'),Б=require('../js/катан-бот');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let players=[];
const req=async(p,body)=>{const r=await fetch(base+'/'+encodeURIComponent(p),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};
try{
  const a=await req('создать',{игра:'катан',имя:'Таймер',мест:3,катанНастройки:{friendlyRobber:true,easyStart:true,turnSeconds:60}});players=[{код:a.код,пропуск:a.пропуск}];for(let i=1;i<3;i++){const b=await req('войти',{код:a.код,имя:'Участник '+i});players.push({код:a.код,пропуск:b.пропуск});}
  await req('ход',{...players[0],действие:'начать'});
  const state=await req('состояние',players[0]),v=(state.состояние||state).катан,actor=v.actor;
  const room=rooms.найтиИгрока(a.код,players[actor].пропуск).комната;room.партия.часы.deadline=Date.now()+100;
  const own=await req('состояние',players[actor]),move=Б.ход((own.состояние||own).катан);assert.equal((await req('ход',{...players[actor],действие:'катан',move})).принято,true);
  const serial=room.партия.игра.serial;await new Promise(r=>setTimeout(r,250));assert(room.партия.игра.serial>serial,'Сервер сам не выполнил обязательную дорогу');assert.equal(room.партия.игра.phase,'setupSettlement');assert.notEqual(room.партия.игра.turn,actor);
  console.log('Катан: настоящий таймер комнаты выполняет обязательный ход и передаёт очередь — OK');
}finally{for(const p of players)await req('выйти',p);server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
