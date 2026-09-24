'use strict';
// Отдельные сценарии из правил: фиксированные кубики, явные ожидаемые ресурсы.
// Решения бота и публичный legal не используются как эталон результата.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
let dice=[];const moduleMock={exports:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../js/катан-правила'),'utf8'),{module:moduleMock,require:id=>{assert.equal(id,'node:crypto');return{randomInt:()=>{assert(dice.length,'Неожиданный случайный выбор');return dice.shift();}};}});
const П=moduleMock.exports,copy=x=>JSON.parse(JSON.stringify(x));
const game=()=>{const g=П.создать(4,37);g.phase='roll';g.turn=0;g.secure=true;g.buildings.fill(null);g.roads.fill(-1);return g;};
const roll=(g,a,b)=>{dice=[Math.floor((a-.5)/6*4294967296),Math.floor((b-.5)/6*4294967296)];П.действие(g,g.turn,{type:'roll'});assert.equal(dice.length,0);};
const hand=(g,p,a)=>{g.players[p].resources=a;g.bank=[0,1,2,3,4].map(r=>19-g.players.reduce((s,p)=>s+p.resources[r],0));};
const rejected=(g,p,a)=>{const before=JSON.stringify(g);assert.throws(()=>П.действие(g,p,a));assert.equal(JSON.stringify(g),before);};

// 8: лес с городом игрока 0, поселением игрока 1; ещё один лес закрыт разбойником.
{
  const g=game();g.hexes.forEach(h=>{h.number=3;h.resource=1;});g.hexes[0]={id:0,resource:0,number:8};g.hexes[18]={id:18,resource:0,number:8};g.robber=18;
  g.buildings[П.Г.hexes[0].vertices[0]]={owner:0,level:2};g.buildings[П.Г.hexes[0].vertices[3]]={owner:1,level:1};g.buildings[П.Г.hexes[18].vertices[2]]={owner:2,level:1};
  roll(g,3,5);assert.deepEqual(copy(g.players.map(p=>p.resources)),[[2,0,0,0,0],[1,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]);assert.equal(g.bank[0],16);
  rejected(g,0,{type:'roll'});rejected(g,1,{type:'end'});
}
// 7: карты развития не считаются ресурсами. Сначала все сбросы, затем разбойник.
{
  const g=game();hand(g,0,[4,3,0,0,0]);hand(g,1,[0,0,9,0,0]);hand(g,2,[0,0,0,8,0]);g.players[0].dev=[{type:'vp',bought:0},{type:'knight',bought:0}];
  roll(g,3,4);assert.deepEqual(copy(g.discard),[0,4,4,0]);
  rejected(g,0,{type:'dev',card:'knight'});rejected(g,0,{type:'bank',give:0,want:4});
  П.действие(g,2,{type:'discard',resources:[0,0,0,4,0]});assert.equal(g.phase,'discard');
  П.действие(g,1,{type:'discard',resources:[0,0,4,0,0]});assert.equal(g.phase,'robber');assert.equal(g.players[0].dev.length,2);
  rejected(g,0,{type:'end'});const old=g.robber;П.действие(g,0,{type:'robber',hex:(old+1)%19});assert.equal(g.phase,'main');
}
// Разбойник не блокирует морской обмен. Город можно построить, не имея пяти поселений.
{
  const g=game();g.phase='main';const port=g.ports.find(p=>p.resource===0),edge=П.Г.edges[port.edge];g.buildings[edge.a]={owner:0,level:1};g.robber=edge.hexes[0];hand(g,0,[2,0,0,1,3]);
  П.действие(g,0,{type:'bank',give:0,want:3});assert.deepEqual(copy(g.players[0].resources),[0,0,0,2,3]);
  П.действие(g,0,{type:'city',vertex:edge.a});assert.equal(g.buildings[edge.a].level,2);assert.equal(П.очки(g,0),2);assert.equal(П.фигуры(g,0).settlement,0);
  rejected(g,0,{type:'city',vertex:edge.a});
}
// Покупка не ограничена одной картой, но разыгрывается одна СТАРАЯ карта за ход.
{
  const g=game();g.phase='main';hand(g,0,[0,0,2,2,2]);g.deck=['knight','knight'];g.players[0].dev=[{type:'plenty',bought:0}];
  П.действие(g,0,{type:'development'});П.действие(g,0,{type:'development'});assert.equal(g.players[0].dev.length,3);rejected(g,0,{type:'dev',card:'knight'});
  П.действие(g,0,{type:'dev',card:'plenty',resources:[2,0,0,0,0]});assert.equal(g.players[0].resources[0],2);rejected(g,0,{type:'dev',card:'knight'});
  П.действие(g,0,{type:'end'});assert.equal(g.turn,1);rejected(g,0,{type:'dev',card:'knight'});
}
// Неактивный игрок предлагает обмен только активному, третий не может принять.
{
  const g=game();g.phase='main';hand(g,1,[1,0,0,0,0]);hand(g,0,[0,1,0,0,0]);hand(g,2,[0,1,0,0,0]);
  П.действие(g,1,{type:'offer',to:0,give:[1,0,0,0,0],want:[0,1,0,0,0]});rejected(g,2,{type:'accept',offer:g.offer.id});
  П.действие(g,0,{type:'accept',offer:g.offer.id});assert.deepEqual(copy(g.players[0].resources),[1,0,0,0,0]);assert.deepEqual(copy(g.players[1].resources),[0,1,0,0,0]);
  rejected(g,1,{type:'bank',give:1,want:0});
}
console.log('Катан: независимые сценарии производства, семёрки, портов, развития и обмена — OK');
