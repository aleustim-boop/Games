'use strict';
const assert=require('node:assert/strict'),P=require('../js/катан-правила'),B=require('../js/катан-бот');
const path=require('node:path'),os=require('node:os');process.env.GAMES_DATA=path.join(os.tmpdir(),'catan-social-'+process.pid);
function ready(){const g=P.создать(3,7,false,3);while(g.phase.startsWith('setup'))P.действие(g,g.turn,B.ход(P.вид(g,g.turn)));g.phase='main';g.turn=0;return g;}
const g=ready();g.players[0].resources=[3,0,0,0,0];g.players[1].resources=[0,3,0,0,0];g.players[2].resources=[0,2,0,0,0];
P.действие(g,0,{type:'offer',to:-1,give:[1,0,0,0,0],want:[0,1,0,0,0]});const old=g.offer.id;
P.действие(g,2,{type:'reject',offer:old});assert.deepEqual(g.offer.rejected,[2]);assert.throws(()=>P.действие(g,2,{type:'accept',offer:old}));
P.действие(g,1,{type:'counter',offer:old,to:0,give:[0,1,0,0,0],want:[2,0,0,0,0]});
assert.throws(()=>P.действие(g,2,{type:'accept',offer:old}));assert.throws(()=>P.действие(g,2,{type:'accept',offer:g.offer.id}));
P.действие(g,0,{type:'accept',offer:g.offer.id});assert.deepEqual(g.players[0].resources,[1,1,0,0,0]);assert.deepEqual(g.players[1].resources,[2,2,0,0,0]);assert.equal(g.tradeStatus.type,'accepted');assert.equal(g.offer,null);
P.действие(g,0,{type:'offer',to:1,give:[1,0,0,0,0],want:[0,1,0,0,0]});const cancel=g.offer.id;P.действие(g,0,{type:'cancelOffer',offer:cancel});assert.throws(()=>P.действие(g,1,{type:'accept',offer:cancel}));
assert.throws(()=>P.действие(g,0,{type:'offer',to:1,give:[1,0,0,0,0],want:[1,0,0,0,0]}));
const steal=ready();steal.phase='steal';steal.turn=0;const victimVertex=steal.buildings.findIndex(b=>b?.owner===1);steal.robber=P.Г.vertices[victimVertex].hexes[0];steal.players[1].resources=[1,0,0,0,0];P.действие(steal,0,{type:'steal',victim:1});assert.equal(P.вид(steal,0).log.at(-1).resource,0);assert(!('resource' in P.вид(steal,2).log.at(-1)));
let proposed=false;for(let wood=0;wood<5&&!proposed;wood++)for(let ore=0;ore<5&&!proposed;ore++){const b=ready();b.players[0].resources=[wood,0,0,1,ore];const v=P.вид(b,0),offer=B.предложение(v);if(offer){proposed=true;assert(offer.give.every((n,r)=>n<=v.hand[r]));assert(offer.give.every((n,r)=>!n||!offer.want[r]));P.действие(b,0,offer);P.действие(b,0,{type:'cancelOffer'});assert.equal(B.предложение(P.вид(b,0)),null);}}
assert(proposed);console.log('Торговля: встречное предложение, отказ, отмена, устаревшие запросы; бот предлагает один раз за ход; добыча разбойника скрыта от постороннего — OK');
(async()=>{const S=require('../server/сервер'),server=S.создатьСервер();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,req=async(route,body)=>{const r=await fetch(base+'/'+encodeURIComponent(route),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};try{
 const a=await req('создать',{игра:'катан',имя:'Тест А',мест:3}),players=[{код:a.код,пропуск:a.пропуск}];for(let i=1;i<3;i++){const p=await req('войти',{код:a.код,имя:'Тест '+i});players.push({код:a.код,пропуск:p.пропуск});}
 assert((await req('ход',{...players[0],действие:'начать'})).принято);
 assert((await req('ход',{...players[0],действие:'эмоция',номер:0})).принято);
 for(let i=0;i<3;i++){const s=await req('состояние',players[i]),v=s.состояние||s;assert(v.знакиВниманияЕсть);assert.equal(v.знакВнимания.номер,0);assert.equal(v.знакВнимания.от,0);assert.equal(v.знакВнимания.этоЯ,i===0);}
 const Z=require('../js/деберц-знаки');assert((await req('ход',{...players[1],действие:'эмоция',номер:Z.ЭМОЦИИ.length+Z.ФРАЗЫ.length,цель:3})).принято);
 const s=await req('состояние',players[2]),v=s.состояние||s;assert.equal(v.знакВнимания.от,1);assert.equal(v.знакВнимания.кому,2);assert(v.знакВнимания.вМеня);
 for(const p of players)await req('выйти',p);console.log('Общение HTTP: три участника получают смайлик и адресный бросок с правильными отправителем и целью — OK');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
