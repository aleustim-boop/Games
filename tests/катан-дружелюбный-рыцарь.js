'use strict';
const A=require('node:assert/strict'),P=require('../js/катан-правила'),B=require('../js/катан-бот'),S=require('../server/игры/катан');
for(let seed=1;seed<=40;seed++){
 const g=P.создать(3,seed,false,3,{friendlyRobber:true});while(g.phase.startsWith('setup'))P.действие(g,P.кто(g),B.ход(P.вид(g,P.кто(g))));
 g.phase='main';g.round=10;g.turn=1;g.players[1].dev=[{type:'knight',bought:0}];g.players[0].dev=[{type:'vp',bought:0},{type:'vp',bought:0}];g.players.forEach(p=>p.resources=[1,1,1,1,1]);g.bank=[16,16,16,16,16];
 A.equal(P.очки(g,0,false),2);A.equal(P.очки(g,0,true),4);
 const knight=B.ход(P.вид(g,1));A.notEqual(knight.card,'knight','Не тратим рыцаря с пустыни на пустое поле');P.действие(g,1,{type:'dev',card:'knight'});A.equal(g.phase,'robber');
 const view=P.вид(g,1),blocked=g.hexes.filter(h=>h.id!==g.robber&&P.Г.hexes[h.id].vertices.some(id=>g.buildings[id]&&P.очки(g,g.buildings[id].owner,false)<=2));
 for(const h of blocked){if(h.resource===5&&view.legal.robber.includes(h.id))continue;A(!view.legal.robber.includes(h.id));const before=JSON.stringify(g);A.throws(()=>P.действие(g,1,{type:'robber',hex:h.id}));A.equal(JSON.stringify(g),before);}
 const handBefore=g.players.map(p=>p.resources.slice()),move=B.ход(view);A(view.legal.robber.includes(move.hex));P.действие(g,1,move);A.deepEqual(g.players.map(p=>p.resources),handBefore);A.equal(g.phase,'main');A.equal(g.players[1].knights,1);
 const server={игроки:['a','b','c'],игра:g,завершена:false};A.equal(S.видДляИгрока(server,'a').катан.options.friendlyRobber,true);
 // Игрок с тремя открытыми очками уже не защищён.
 const vertex=P.поселения(g,0,true)[0];if(vertex!==undefined){g.buildings[vertex]={owner:0,level:1};A.equal(P.очки(g,0,false),3);g.phase='robber';const allowed=P.местаРазбойника(g);A(allowed.every(id=>P.Г.hexes[id].vertices.every(x=>!g.buildings[x]||P.очки(g,g.buildings[x].owner,false)>2)||g.hexes[id].resource===5));}
}
// Освобождение собственного дохода и получение армии остаются разумными причинами.
const g=P.создать(3,51,false,3);while(g.phase.startsWith('setup'))P.действие(g,P.кто(g),B.ход(P.вид(g,P.кто(g))));
g.phase='roll';g.round=10;g.turn=1;g.players[1].dev=[{type:'knight',bought:0}];
g.robber=g.hexes.find(h=>h.resource<5&&P.Г.hexes[h.id].vertices.some(id=>g.buildings[id]?.owner===1)).id;
A.equal(B.ход(P.вид(g,1)).card,'knight','Освобождаем своё поле');
g.options.friendlyRobber=true;g.robber=g.hexes.find(h=>h.resource===5).id;g.players[1].knights=2;
A.equal(B.ход(P.вид(g,1)).card,'knight','Получаем большую армию');
g.armyOwner=1;A.notEqual(B.ход(P.вид(g,1)).card,'knight','Не тратим карту просто для увеличения уже своей армии');
g.options.friendlyRobber=false;g.armyOwner=-1;g.players[1].knights=0;
A.equal(B.ход(P.вид(g,1)).card,'knight','Мешаем незащищённому сопернику');
console.log('Рыцарь: 40 полей, защита 2 открытых ПО, сохранение бесполезной карты, освобождение дохода, блокировка соперника и большая армия — OK');

// Цель выбирается по открытым ПО, а не по скрытым картам и сумме слабых соседей.
for(const friendlyRobber of [false,true])for(let seed=1;seed<=30;seed++){
 const t=P.создать(3,seed,false,3,{friendlyRobber});while(t.phase.startsWith('setup'))P.действие(t,P.кто(t),B.ход(P.вид(t,P.кто(t))));
 t.turn=1;t.phase='robber';t.buildings.forEach(b=>{if(b&&b.owner===0)b.level=2;});t.players[2].dev=Array.from({length:5},()=>({type:'vp',bought:0}));t.players.forEach(p=>p.resources=[1,0,0,0,0]);
 const view=P.вид(t,1);A.equal(view.players[0].score,4);A.equal(view.players[2].score,2);
 const eligible=id=>[...new Set(P.Г.hexes[id].vertices.map(x=>t.buildings[x]?.owner).filter(i=>i!==undefined&&i!==1&&view.players[i].cards>0&&(!friendlyRobber||view.players[i].score>2)))];
 const scores=view.legal.robber.map(id=>Math.max(-1,...eligible(id).map(i=>view.players[i].score))),best=Math.max(...scores),move=B.ход(view);A.equal(Math.max(-1,...eligible(move.hex).map(i=>view.players[i].score)),best);
 P.действие(t,1,move);if(t.phase==='steal'){const steal=B.ход(P.вид(t,1));A.equal(view.players[steal.victim].score,best);}
}
console.log('Разбойник: 60 полей, сильнейшая доступная цель по открытым ПО, скрытые карты не учитываются — OK');
