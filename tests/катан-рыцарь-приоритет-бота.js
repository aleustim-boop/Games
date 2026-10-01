'use strict';
const assert=require('node:assert/strict'),P=require('../js/катан-правила'),B=require('../js/катан-бот'),S=require('../server/игры/катан');
let checked=0;
for(let seed=1;seed<=30;seed++)for(const botTarget of [0,2])for(const level of ['лёгкий','обычный','сложный']){
  const g=P.создать(3,seed,false,3);while(g.phase.startsWith('setup'))P.действие(g,P.кто(g),B.ход(P.вид(g,P.кто(g))));
  const human=botTarget===0?2:0;g.turn=1;g.phase='robber';g.players.forEach(p=>p.resources=[1,0,0,0,0]);g.players[human].dev=Array.from({length:4},()=>({type:'vp',bought:0}));
  const bots=[false,true,false];bots[botTarget]=true;
  const view=()=>Object.assign(P.вид(g,1),{bots});
  const touches=(hex,owner)=>P.Г.hexes[hex].vertices.some(id=>g.buildings[id]?.owner===owner);
  assert.equal(view().players[human].score,view().players[botTarget].score);
  assert(touches(B.ход(view(),level).hex,botTarget),'При равных открытых ПО блокируем бота, даже если у человека скрытые ПО');
  const stolen=B.ход({...view(),phase:'steal',victims:[human,botTarget]},level);assert.equal(stolen.victim,botTarget);
  const party={игроки:['a','b','c'],игра:structuredClone(g),завершена:false},keys=party.игроки.filter((_,i)=>bots[i]);
  assert(S.ходЗаБота(party,'b',level,{боты:keys}));assert(touches(party.игра.robber,botTarget),'Онлайн-модуль получает настоящие роли мест');
  // Более сильный человек всё равно приоритетнее бота; даже при пустой руке блокируем его доход.
  g.buildings.forEach(b=>{if(b?.owner===human)b.level=2;});g.players[human].resources=[0,0,0,0,0];
  assert(touches(B.ход(view(),level).hex,human),'ПО важнее типа игрока и наличия карт');
  g.players[human].resources=[1,0,0,0,0];assert.equal(B.ход({...view(),phase:'steal',victims:[botTarget,human]},level).victim,human);
  checked++;
}
console.log(`Разбойник: ${checked} сценариев, равенство → бот, лидер → независимо от типа, скрытые ПО исключены, онлайн-контекст — PASS`);
