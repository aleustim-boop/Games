'use strict';
const assert=require('node:assert/strict'),P=require('../js/катан-правила');
for(const targetPoints of [10,12,15]){
 const g=P.создать(3,123,false,2,{targetPoints});g.phase='roll';g.turn=0;
 g.players[0].dev=Array.from({length:targetPoints-1},()=>({type:'vp',bought:-1}));
 P.действие(g,0,{type:'roll'});assert.notEqual(g.phase,'finished');
 g.players[0].dev.push({type:'vp',bought:-1});g.phase='roll';
 P.действие(g,0,{type:'roll'});assert.equal(g.phase,'finished');assert.equal(g.winner,0);
 assert.equal(P.вид(g,0).options.targetPoints,targetPoints);
}
assert.equal(P.настройки({targetPoints:999}).targetPoints,10);
console.log('Catan: 10/12/15 victory thresholds OK');
