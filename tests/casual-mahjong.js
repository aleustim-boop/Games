'use strict';
const assert=require('node:assert/strict'),G=require('../js/game-mahjong');
for(const mode of G.modes)for(let seed=1;seed<=100;seed++){
 const s=G.create(mode.id,seed);assert(G.validate(s));assert(G.pairs(s).length);const blocked=s.tiles.findIndex((_,i)=>!G.free(s,i));if(blocked>=0)assert(!G.act(s,{type:'pair',a:blocked,b:0}));
 for(const [a,b]of s.witness){assert(G.free(s,a)&&G.free(s,b));assert(G.act(s,{type:'pair',a,b}));assert(G.validate(s));}
 assert(s.won);assert.equal(s.score,s.tiles.length*10);
}
console.log('Mahjong: 300 complete solvable layouts, blocking, pairs, victory and conservation — OK');
