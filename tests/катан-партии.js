'use strict';
const assert=require('node:assert/strict'),П=require('../js/катан-правила'),Б=require('../js/катан-бот');
assert.equal(П.Г.vertices.length,54);assert.equal(П.Г.edges.length,72);
for(let seed=1;seed<=24;seed++){
  const g=П.создать(seed%2?3:4,seed,false,2);let steps=0;
  while(g.phase!=='finished'&&steps++<12000){
    const who=П.кто(g),v=П.вид(g,who),a=Б.ход(v,seed%3===0?'лёгкий':'сложный');
    assert(a,`Нет действия ${g.phase}`);
    try{П.действие(g,who,a);}catch(e){console.error({seed,steps,phase:g.phase,who,a});throw e;}
    for(let r=0;r<5;r++)assert.equal(g.bank[r]+g.players.reduce((s,p)=>s+p.resources[r],0),19,'Сохранение ресурсов');
    assert(g.bank.every(n=>Number.isInteger(n)&&n>=0));
    for(let p=0;p<g.n;p++){const f=П.фигуры(g,p);assert(f.road<=15&&f.city<=4&&f.settlement<=5);assert(g.players[p].resources.every(n=>Number.isInteger(n)&&n>=0));}
  }
  assert.equal(g.phase,'finished',`Не завершилась партия seed=${seed}, шагов=${steps}, очки=${g.players.map((_,i)=>П.очки(g,i))}`);
  assert(П.очки(g,g.winner)>=10);console.log(`seed ${seed}, ${g.n} игрока: ${g.round} ходов, ${steps} действий`);
}
console.log('Катан: 24 полные партии, сохранение ресурсов и лимиты фигур — OK');
