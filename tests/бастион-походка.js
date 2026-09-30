'use strict';
const assert=require('node:assert/strict'),M=require('../js/бастион-движение.js'),R=require('../js/бастион-правила.js');
for(const type of Object.keys(R.ENEMIES)){
 const e={type,id:7,d:0},from={x:0,y:0},to={x:1,y:1};
 assert.deepEqual([0,.25,.5,.75].map(k=>M.pose({...e,d:k*M.STRIDE[type]},from,to).frame),[4,5,6,7]);
 assert.equal(M.pose({...e,d:M.STRIDE[type]},from,to).frame,4,'Цикл замыкается');
 assert.equal(M.pose(e,from,{x:1,y:-1}).frame,0,'Вид со спины при движении вверх');
 assert.equal(M.pose(e,from,{x:-1,y:1}).flip,-1,'Отражение при движении влево');
 assert.deepEqual(M.pose({...e,d:13},from,to),M.pose({...e,d:13},from,to),'Без изменения пути поза сохраняется');
 assert.equal(M.pose({...e,d:19},from,to,false).lift,0,'Уменьшение движения');
 assert.equal(M.pose({...e,d:19},from,to,false).frame,4);
}
// Проверяем замедление через настоящие правила, а не только формулу кадров.
function state(slow){const s=R.create();R.startWave(s);s.queue=[];s.nextId=2;s.enemies=[{id:1,type:'raider',d:0,hp:100,maxHp:100,slow:slow?10:0,slowPower:slow?.7:0,wet:0,burn:0,burnDamage:0,broken:0,heal:2}];return s;}
const normal=state(false),slow=state(true);for(let i=0;i<20;i++){R.tick(normal);R.tick(slow);}assert(Math.abs(slow.enemies[0].d/normal.enemies[0].d-.3)<1e-8);
assert(M.pose(slow.enemies[0],{x:0,y:0},{x:1,y:1}).phase!==M.pose(normal.enemies[0],{x:0,y:0},{x:1,y:1}).phase);
console.log('Походка: шесть типов, четыре ракурса, полный цикл, остановка, уменьшение движения и настоящее замедление — пройдены.');
const boss=state(false);boss.map=3;boss.enemies[0]={...boss.enemies[0],type:'boss',stormClock:1.2,charge:0,shield:0};
R.tick(boss);assert.equal(boss.enemies[0].d,0,'Поднимающий молот босс стоит на месте');assert(boss.enemies[0].charge>0);
const restored=R.restore(R.snapshot(boss));assert(restored);
for(let i=0;i<50;i++){R.tick(boss);R.tick(restored);}assert.equal(R.snapshot(boss),R.snapshot(restored),'Загрузка посреди ритуала сохраняет движение и таймер');
assert(boss.enemies[0].shield>2.45);assert.equal(boss.enemies[0].d,0,'Во время удара нет скольжения');
for(let i=0;i<10;i++)R.tick(boss);assert(boss.enemies[0].d>0,'После удара босс вновь идёт');
console.log('Ритуал босса: остановка, удар, щит, продолжение пути и сохранение — пройдены.');
