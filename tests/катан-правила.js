'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот'),М=require('../js/катан-память');
const copy=x=>JSON.parse(JSON.stringify(x));
let checks=0;function test(name,run){run();checks++;console.log('OK '+name);}
function game(){const g=П.создать(4,73);g.phase='main';g.turn=0;return g;}
function hand(g,p,a){g.players[p].resources=a.slice();g.bank=g.bank.map((_,r)=>19-g.players.reduce((s,p)=>s+p.resources[r],0));}
function reject(g,p,a){const before=copy(g);assert.throws(()=>П.действие(g,p,a));assert.deepEqual(g,before,'Отказ изменил состояние');}
function path(count,forbidden=new Set()){
  function walk(v,es,vs){if(es.length===count)return es;for(const eid of П.Г.vertices[v].edges){const e=П.Г.edges[eid],next=e.a===v?e.b:e.a;if(forbidden.has(eid)||vs.has(next))continue;const found=walk(next,[...es,eid],new Set([...vs,next]));if(found)return found;}return null;}
  for(const v of П.Г.vertices){const found=walk(v.id,[],new Set([v.id]));if(found)return found;}throw Error('Нет пути');
}
test('Геометрия, колода, порты и отсутствие соседних 6/8',()=>{
  assert.equal(П.Г.hexes.length,19);assert.equal(П.Г.vertices.length,54);assert.equal(П.Г.edges.length,72);
  for(let seed=1;seed<=100;seed++){
    const g=П.создать(3,seed);assert.deepEqual([0,1,2,3,4,5].map(r=>g.hexes.filter(h=>h.resource===r).length),[4,3,4,4,3,1]);
    assert.equal(g.deck.length,25);assert.equal(g.deck.filter(x=>x==='knight').length,14);
    assert.equal(g.ports.length,9);const ends=g.ports.flatMap(p=>[П.Г.edges[p.edge].a,П.Г.edges[p.edge].b]);assert.equal(new Set(ends).size,18);
    assert(П.Г.edges.every(e=>e.hexes.length!==2||!e.hexes.every(i=>[6,8].includes(g.hexes[i].number))));
  }
});
test('Начальная змейка, расстояние и ресурсы только второго поселения',()=>{
  const g=П.создать(4,19),order=[];
  while(g.phase.startsWith('setup')){
    const p=g.turn,a=Б.ход(П.вид(g,p));if(g.phase==='setupSettlement'){
      order.push(p);const before=g.players[p].resources.slice(),second=g.setupIndex>=g.n,vertex=a.vertex;П.действие(g,p,a);
      const delta=[0,0,0,0,0];if(second)for(const h of П.Г.vertices[vertex].hexes)if(g.hexes[h].resource<5)delta[g.hexes[h].resource]++;
      assert.deepEqual(g.players[p].resources,before.map((n,r)=>n+delta[r]));
      for(const neighbor of П.Г.vertices[vertex].neighbors)assert(!П.поселения(g,(p+1)%4,true).includes(neighbor));
    }else П.действие(g,p,a);
  }
  assert.deepEqual(order.slice(4),order.slice(0,4).reverse());assert.equal(g.turn,order[0]);assert.equal(g.phase,'roll');
});
test('Недостаток в банке: один получает остаток, несколько — ничего',()=>{
  const g=game(),h=g.hexes.find(h=>h.resource<5),r=h.resource;g.hexes.forEach(x=>x.number=0);h.number=6;g.robber=(h.id+1)%19;
  const [a,,b]=П.Г.hexes[h.id].vertices;g.buildings[a]={owner:0,level:2};g.bank[r]=1;
  assert.equal(П.произвести(g,6)[0][r],1);assert.equal(g.bank[r],0);
  g.players[0].resources[r]=0;g.bank[r]=2;g.buildings[b]={owner:1,level:1};assert.deepEqual(П.произвести(g,6),Array.from({length:4},()=>[0,0,0,0,0]));
  g.bank[r]=19;g.robber=h.id;assert.equal(П.сумма(П.произвести(g,6).flat()),0);
});
test('Семёрка: больше семи, округление вниз, независимый сброс',()=>{
  const g=game();hand(g,0,[9,0,0,0,0]);hand(g,1,[0,8,0,0,0]);hand(g,2,[0,0,7,0,0]);g.phase='roll';
  let found;for(let seed=1;seed<1000;seed++){const trial=copy(g);trial.seed=seed;П.действие(trial,0,{type:'roll'});if(П.сумма(trial.dice)===7){found=trial;break;}}
  assert(found);assert.deepEqual(found.discard,[4,4,0,0]);reject(found,0,{type:'robber',hex:0});reject(found,1,{type:'discard',resources:[0,3,0,0,0]});
  П.действие(found,1,{type:'discard',resources:[0,4,0,0,0]});assert.equal(found.phase,'discard');П.действие(found,0,{type:'discard',resources:[4,0,0,0,0]});assert.equal(found.phase,'robber');
  reject(found,0,{type:'robber',hex:found.robber});
});
test('Разбойник: только сосед, один случайный ресурс, не карта развития',()=>{
  const g=game(),h=(g.robber+1)%19,verts=П.Г.hexes[h].vertices;g.phase='robber';g.buildings[verts[0]]={owner:1,level:1};g.buildings[verts[2]]={owner:2,level:1};hand(g,1,[2,0,0,0,0]);hand(g,2,[0,1,0,0,0]);
  g.players[1].dev=[{type:'vp',bought:0}];П.действие(g,0,{type:'robber',hex:h});assert.equal(g.phase,'steal');reject(g,0,{type:'steal',victim:3});П.действие(g,0,{type:'steal',victim:1});assert.equal(g.players[0].resources[0],1);assert.equal(g.players[1].dev.length,1);assert.equal(g.phase,'main');
});
test('Порты и обмен: точный курс, нет подарков, принятие вне очереди',()=>{
  const g=game(),p=g.ports.find(p=>p.resource===0);g.buildings[П.Г.edges[p.edge].a]={owner:0,level:1};hand(g,0,[4,0,0,0,0]);assert.equal(П.курс(g,0,0),2);П.действие(g,0,{type:'bank',give:0,want:3});assert.deepEqual(g.players[0].resources,[2,0,0,1,0]);
  reject(g,0,{type:'bank',give:0,want:0});reject(g,0,{type:'offer',to:1,give:[1,0,0,0,0],want:[0,0,0,0,0]});
  hand(g,1,[0,1,0,0,0]);П.действие(g,0,{type:'offer',to:1,give:[1,0,0,0,0],want:[0,1,0,0,0]});const id=g.offer.id;
  reject(g,2,{type:'accept',offer:id});reject(g,1,{type:'accept',offer:id+1});П.действие(g,1,{type:'accept',offer:id});assert.equal(g.players[1].resources[0],1);assert.equal(g.players[0].resources[1],1);reject(g,1,{type:'accept',offer:id});
  reject(g,1,{type:'offer',to:2,give:[1,0,0,0,0],want:[0,1,0,0,0]});
});
test('Новые карты развития, одна за ход, рыцарь до кубиков',()=>{
  const g=game();g.players[0].dev=[{type:'knight',bought:g.round},{type:'plenty',bought:0}];reject(g,0,{type:'dev',card:'knight'});
  П.действие(g,0,{type:'dev',card:'plenty',resources:[1,0,1,0,0]});assert.deepEqual(g.players[0].resources,[1,0,1,0,0]);reject(g,0,{type:'dev',card:'plenty',resources:[1,0,1,0,0]});
  const h=game();h.phase='roll';h.players[0].dev=[{type:'knight',bought:0}];П.действие(h,0,{type:'dev',card:'knight'});assert.equal(h.phase,'robber');assert.equal(h.players[0].knights,1);П.действие(h,0,{type:'robber',hex:(h.robber+1)%19});assert.equal(h.phase,'roll');
});
test('Монополия переносит ресурсы; победное очко работает сразу',()=>{
  const g=game();hand(g,1,[3,0,0,0,0]);hand(g,2,[5,0,0,0,0]);g.players[0].dev=[{type:'monopoly',bought:0}];П.действие(g,0,{type:'dev',card:'monopoly',resource:0});assert.equal(g.players[0].resources[0],8);assert.equal(g.players[1].resources[0],0);
  const h=game();[0,1,2,3].forEach(v=>h.buildings[v]={owner:0,level:2});h.buildings[4]={owner:0,level:1};hand(h,0,[0,0,1,1,1]);h.deck=['vp'];П.действие(h,0,{type:'development'});assert.equal(h.phase,'finished');assert.equal(h.winner,0);
});
test('Дороги: развилка, цикл, чужое поселение и сохранение награды при равенстве',()=>{
  const g=game(),junction=П.Г.vertices.find(v=>v.edges.length===3);junction.edges.forEach(e=>g.roads[e]=0);assert.equal(П.длина(g,0),2);
  g.roads.fill(-1);П.Г.hexes[9].edges.forEach(e=>g.roads[e]=0);assert.equal(П.длина(g,0),6);
  g.roads.fill(-1);const route=path(6);route.forEach(e=>g.roads[e]=0);assert.equal(П.длина(g,0),6);
  const middle=[П.Г.edges[route[2]].a,П.Г.edges[route[2]].b].find(v=>[П.Г.edges[route[3]].a,П.Г.edges[route[3]].b].includes(v));g.buildings[middle]={owner:1,level:1};assert.equal(П.длина(g,0),3);
  g.buildings.fill(null);const other=path(6,new Set(route));other.forEach(e=>g.roads[e]=1);g.roadOwner=0;П.итог(g);assert.equal(g.roadOwner,0);
  g.roadOwner=-1;П.итог(g);assert.equal(g.roadOwner,-1);
});
test('Город возвращает поселение; нельзя продолжить сквозь соперника',()=>{
  const g=game();g.buildings[0]={owner:0,level:1};hand(g,0,[0,0,0,2,3]);П.действие(g,0,{type:'city',vertex:0});assert.equal(П.фигуры(g,0).settlement,0);assert.equal(П.фигуры(g,0).city,1);
  const route=path(2),a=П.Г.edges[route[0]],b=П.Г.edges[route[1]],joint=[a.a,a.b].find(v=>v===b.a||v===b.b);g.buildings.fill(null);g.roads[route[0]]=0;g.buildings[joint]={owner:1,level:1};assert(!П.дороги(g,0).includes(route[1]));
});
test('Бесплатные дороги ограничены запасом фигур, затем возвращается фаза',()=>{
  const g=game();g.phase='roll';const route=path(14);route.forEach(e=>g.roads[e]=0);g.players[0].dev=[{type:'roads',bought:0}];
  assert(П.дороги(g,0).length);П.действие(g,0,{type:'dev',card:'roads'});assert.equal(g.freeRoads,1);
  const bank=g.bank.slice();П.действие(g,0,{type:'road',edge:П.дороги(g,0)[0]});assert.equal(g.phase,'roll');assert.equal(П.фигуры(g,0).road,15);assert.deepEqual(g.bank,bank);
  g.phase='main';g.playedDev=false;g.players[0].dev=[{type:'roads',bought:0}];reject(g,0,{type:'dev',card:'roads'});
});
test('Большая армия: порог, равенство и смена владельца; победа только в свой ход',()=>{
  const g=game();g.players[0].knights=2;П.итог(g);assert.equal(g.armyOwner,-1);g.players[0].knights=3;П.итог(g);assert.equal(g.armyOwner,0);
  g.players[1].knights=3;П.итог(g);assert.equal(g.armyOwner,0);g.players[1].knights=4;П.итог(g);assert.equal(g.armyOwner,1);
  for(let i=0;i<4;i++)g.buildings[i]={owner:1,level:2};П.итог(g);assert.equal(П.очки(g,1),10);assert.equal(g.phase,'main');П.действие(g,0,{type:'end'});assert.equal(g.phase,'finished');assert.equal(g.winner,1);
});
test('Сдача записывается и восстанавливается без фиктивных десяти очков',()=>{
  const data={version:1,seed:91,n:3,level:'обычный',actions:[{player:0,action:{type:'surrender'}}]},g=М.восстановить(data);assert.equal(g.phase,'finished');assert.equal(g.winner,-1);assert.equal(П.вид(g,0).surrendered,0);
});
test('Секретность видов, законная сериализация и отклонение повреждённого сохранения',()=>{
  const data={version:1,seed:81,n:3,level:'сложный',actions:[]},g=П.создать(3,81);
  for(let i=0;i<80;i++){const player=П.кто(g),action=Б.ход(П.вид(g,player));П.действие(g,player,action);data.actions.push({player,action});}
  assert.deepEqual(М.восстановить(copy(data)),g);const bad=copy(data);bad.actions[0].action.vertex=999;assert.throws(()=>М.восстановить(bad));
  g.players[1].dev.push({type:'vp',bought:0});const v=П.вид(g,0);assert(!('seed'in v));assert(!('deck'in v));assert(!('resources'in v.players[1]));assert(!('dev'in v.players[1]));assert.equal(v.players[1].score,П.очки(g,1,false));
  v.hand[0]=999;assert.notEqual(g.players[0].resources[0],999);
});
console.log(`Катан: ${checks} групп правил — OK`);
