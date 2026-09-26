'use strict';
const assert=require('node:assert/strict'),G=require('../js/game-fifteen');
for(const mode of G.modes)for(let seed=1;seed<=200;seed++){const s=G.create(mode.id,seed);assert(G.validate(s));assert(!s.won&&!G.solved(s));const empty=s.tiles.indexOf(0);assert(!G.act(s,{type:'slide',i:empty}));for(const i of [...s.witness].reverse()){if(s.won)break;assert(G.act(s,{type:'slide',i}));assert(G.validate(s));}assert(s.won&&G.solved(s));const bad=structuredClone(s);[bad.tiles[0],bad.tiles[1]]=[bad.tiles[1],bad.tiles[0]];assert(!G.validate(bad));}
console.log('Fifteen: 600 solvable deals, full reverse solutions, valid neighbors, victory and unreachable save rejection — OK');
