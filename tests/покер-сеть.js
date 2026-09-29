'use strict';
const A=require('node:assert/strict'),S=require('../server/сервер').создатьСервер(),P=require('../js/покер-правила'),G=require('../server/игры/покер');
(async()=>{await new Promise(r=>S.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+S.address().port;
const req=async(path,body)=>{const r=await fetch(base+'/'+encodeURIComponent(path),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const x=await r.json();A.equal(r.status,200,JSON.stringify(x));return x;};
try{
const room=await req('создать',{игра:'покер',мест:3,имя:'Проверка 1',открытый:true});A(room.код);const keys=[{код:room.код,пропуск:room.пропуск}];for(let i=1;i<3;i++){const r=await req('войти',{код:room.код,имя:'Проверка '+(i+1)});keys.push({код:room.код,пропуск:r.пропуск});}
A((await req('ход',{...keys[0],действие:'начать'})).принято);
let steps=0,completed=0;while(steps++<1600){const states=[];for(const key of keys){const r=await req('состояние',key);states.push(r.состояние||r);}const v=states[0].покер;A(v);for(const [i,s]of states.entries()){A.equal(s.покер.me,i);A.equal(s.покер.version,v.version);if(!s.покер.result?.showdown)for(let j=0;j<3;j++)if(j!==i)A(s.покер.players[j].hole.every(c=>c===null));for(const bad of ['deck','seed','secure'])A.equal(s.покер[bad],undefined);}
if(v.phase==='finished'){completed++;break;}
const turn=v.turn,l=states[turn].покер.legal;const other=(turn+1)%3,denied=await req('ход',{...keys[other],действие:'покер',move:{type:'raise',to:999999}});A.equal(denied.принято,false);
const move=l.next?{type:'next'}:l.allIn?{type:'allin'}:l.check?{type:'check'}:{type:'call'};A((await req('ход',{...keys[turn],действие:'покер',move})).принято);
}A.equal(completed,1);for(const key of keys)await req('выйти',key);
// Серверный таймер не доверяет клиенту: сначала чек, при долге — пас.
const p=G.раздать(null,{игроки:['a','b','c']});p.deadline=0;const i=p.игра.turn;A(G.ходПоПросрочке(p));A(p.игра.players[i].folded);A(p.deadline>Date.now());
console.log('Покер онлайн: 3 HTTP-клиента, закрытые карты, запрет чужого хода, полная партия и таймер — OK');
}finally{S.closeAllConnections();await new Promise(r=>S.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
