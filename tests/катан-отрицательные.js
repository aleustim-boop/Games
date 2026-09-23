'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const real=require('../js/катан-правила'),source=fs.readFileSync(require.resolve('../js/катан-правила'),'utf8');
function mutant(from,to){assert(source.includes(from));const ctx={module:{exports:{}},require};vm.runInNewContext(source.replace(from,to),ctx);return ctx.module.exports;}
function turn(П){const g=П.создать(3,1);g.phase='main';g.turn=0;assert.throws(()=>П.действие(g,1,{type:'end'}));}
function bank(П){const g=П.создать(3,1);g.phase='main';g.turn=0;g.players[0].resources=[4,0,0,0,0];g.bank[0]=15;П.действие(g,0,{type:'bank',give:0,want:1});for(let r=0;r<5;r++)assert.equal(g.bank[r]+g.players.reduce((s,p)=>s+p.resources[r],0),19);}
function privacy(П){const v=П.вид(П.создать(3,1),0);assert(!('seed'in v));}
turn(real);bank(real);privacy(real);
assert.throws(()=>turn(mutant("нужно(p===g.turn,'Сейчас ход другого игрока');",'')));
assert.throws(()=>bank(mutant('g.bank[i]+=n;','g.bank[i]+=n+1;')));
assert.throws(()=>privacy(mutant('return копия({version:1,n:g.n','return копия({seed:g.seed,version:1,n:g.n')));
console.log('Катан: проверки обнаружили три намеренные поломки — чужой ход, создание ресурсов и утечку зерна случайности.');
