'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот'),М=require('../js/катан-память'),Ч=require('../js/катан-часы'),А=require('../server/игры/катан');
for(const n of [3,4])for(const friendlyRobber of [false,true])for(const easyStart of [false,true]){
  const options={friendlyRobber,easyStart,turnSeconds:60},seed=n*100+Number(friendlyRobber)*10+Number(easyStart)+1,g=П.создать(n,seed,false,2,options),record={version:1,rules:2,n,seed,options,level:'сложный',actions:[]};
  let steps=0;
  while(g.phase!=='finished'&&steps++<2000){
    const actor=П.кто(g),v=П.вид(g,actor),action=Б.ход(v,'сложный'),round=g.round;
    if(g.phase==='robber'&&friendlyRobber){
      const blocked=g.hexes.find(h=>h.id!==g.robber&&!v.legal.robber.includes(h.id));
      if(blocked){const before=JSON.stringify(g);assert.throws(()=>П.действие(g,actor,{type:'robber',hex:blocked.id}));assert.equal(JSON.stringify(g),before);}
    }
    П.действие(g,actor,action);record.actions.push({player:actor,action});
    if(action.type==='roll'&&easyStart&&round<=n*2)assert.notEqual(П.сумма(g.dice),7);
    for(let r=0;r<5;r++)assert.equal(g.bank[r]+g.players.reduce((s,p)=>s+p.resources[r],0),19);
  }
  assert.equal(g.phase,'finished');assert.deepEqual(М.восстановить(record),g);
}
const fallback=П.создать(4,71,false,2,{friendlyRobber:true});fallback.buildings.fill(null);fallback.buildings[0]={owner:1,level:1};fallback.phase='robber';fallback.turn=0;
const protectedHex=П.Г.vertices[0].hexes.find(i=>i!==fallback.robber);assert(!П.местаРазбойника(fallback).includes(protectedHex));
const game=П.создать(3,4,false,2,{turnSeconds:60}),clock=Ч.обновить({},game,1000);assert.equal(Ч.остаток(clock,11000),50);Ч.обновить(clock,game,20000);assert.equal(clock.deadline,61000);
const party=А.раздать(null,{игроки:['a','b','c'],катанНастройки:{friendlyRobber:true,easyStart:true,turnSeconds:60}});
assert(А.остатокВремениНаХод(party)>58);assert.equal(А.ходПоПросрочке(party),null);
party.часы.deadline=Date.now()-100;const serial=party.игра.serial;assert(А.ходПоПросрочке(party));assert(party.игра.serial>serial);assert(А.остатокВремениНаХод(party)>0);
while(party.игра.phase.startsWith('setup')){const i=П.кто(party.игра);assert(А.ходЗаБота(party,party.игроки[i]));}
party.игра.phase='main';party.часы.deadline=Date.now()-1;const round=party.игра.round;assert(А.ходПоПросрочке(party));assert.equal(party.игра.round,round+1);
console.log('Катан: 8 партий с вариантами, запрет разбойника, мягкий старт, сохранения и обязательные ходы по таймеру — OK');
