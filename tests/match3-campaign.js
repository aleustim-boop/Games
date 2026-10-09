'use strict';
const assert=require('node:assert/strict'),G=require('../игры/match3/game-match3'),U=require('../общее/casual/casual-core');
function board(){return Array.from({length:64},(_,i)=>(i%8+(i>>3)*2)%6);}
function fixture(cells,a,b){for(let seed=1;seed<1000;seed++){const s=G.create('calm',seed);cells.forEach(i=>s.grid[i]=2);s.grid[a]=2;s.grid[b]=1;if(G.matches(s.grid).length)continue;assert(G.act(s,{type:'swap',a,b}));return s;}throw Error('Fixture generation failed');}
for(const [cells,a,b,type] of [[[24,25,26,27],18,26,1],[[3,11,19,27],18,19,2],[[24,25,26,27,28],18,26,4],[[25,26,27,18,10],34,26,3]]){const s=fixture(cells,a,b);const clear=s.frames.find(f=>f.kind==='clear');assert(clear.born.some(v=>v.type===type&&v.at===b));assert(!clear.removed.includes(b));assert(s.created>=1);assert(G.validate(s));}
{
 const s=G.create('level-4',11);s.grid=board();s.special[27]=1;s.special[30]=2;const wave=G.expand(s,[27]);assert.deepEqual(wave.activated,[27,30]);assert.equal(wave.hit.length,15);assert(wave.hit.includes(6)&&wave.hit.includes(62));
}
for(const pair of [[1,2],[3,3],[4,0],[4,1],[4,3],[4,4]]){
 const s=G.create('level-7',123);s.grid=board();s.special[27]=pair[0];s.special[28]=pair[1];const before=structuredClone(s),otherColor=s.grid[28];assert(G.act(s,{type:'swap',a:27,b:28}));const wave=s.frames.find(f=>f.kind==='clear');assert.equal(s.left,before.left-1);assert(G.validate(s));assert.equal(s.collected.reduce((a,b)=>a+b,0),s.frames.filter(f=>f.kind==='clear').reduce((n,f)=>n+f.removed.length,0));
 if(pair[0]===4&&pair[1]===0){assert(wave.hit.every(i=>i===28||wave.grid[i]===otherColor));assert(wave.hit.includes(28));}
 if(pair[0]===4&&pair[1]===4){assert.equal(wave.removed.length,64);assert(s.ice.every(v=>v<=1));}
 if(pair[0]===3&&pair[1]===3)assert(wave.hit.length>=30);
}
// Last allowed move wins when every objective is met; undo snapshot remains valid.
{
 const s=G.create('level-1',65);s.collected[2]=11;s.left=1;s.grid=board();s.special[27]=4;s.grid[28]=2;const prev=structuredClone(s);assert(G.act(s,{type:'swap',a:27,b:28}));assert(s.won&&!s.lost);assert.equal(s.left,0);assert(G.validate(prev));assert(!G.act(s,{type:'swap',a:0,b:1}));
 const mixed=G.create('level-5',3);mixed.collected[3]=99;assert(!G.complete(mixed));mixed.iceBroken=mixed.ice.reduce((a,b)=>a+b,0);mixed.ice.fill(0);assert(G.complete(mixed));
}
// Old score-mode saves upgrade without discarding the board or the score.
{
 const old=G.create('classic',1);for(const k of ['special','ice','iceBroken','collected','created','activated'])delete old[k];assert(G.validate(old));const copy=old.grid.slice();G.resume(old);assert.deepEqual(old.grid,copy);assert(G.validate(old));
 const bad=G.create('level-4',1);bad.ice[0]=2;assert(!G.validate(bad));bad.ice[0]=0;bad.collected[0]=-1;assert(!G.validate(bad));
}
// Preserve bonus inventory and fixed ice when no moves remain.
{
 const s=G.create('level-4',27);s.special[4]=1;s.special[6]=3;s.special[8]=4;const ice=s.ice.slice();G.reshuffle(s);assert.deepEqual(s.special.filter(Boolean).sort(),[1,3,4]);assert.deepEqual(s.ice,ice);assert(G.validate(s));assert(G.swaps(s).length);
}
let wins=0;
for(const m of G.modes)for(let seed=1;seed<=30;seed++){
 const s=G.create(m.id,seed),rng=U.random(seed);assert(G.validate(s));assert.deepEqual(s,G.create(m.id,seed));
 while(!s.won&&!s.lost){const legal=G.swaps(s),a=legal[Math.floor(rng()*legal.length)],previous=structuredClone(s);assert(legal.length);assert(G.act(s,a));assert.equal(s.left,previous.left-1);assert(G.validate(s),m.id+' seed '+seed);assert.equal(s.won,G.complete(s));assert.equal(s.lost,!s.won&&s.left===0);assert(s.score>=previous.score);assert(!G.matches(s.grid).length);const copy=structuredClone(previous);G.act(copy,a);assert.deepEqual(copy,s);}
 wins+=s.won?1:0;
}
console.log('Match3 campaign: four/five/T, bonus chains and combinations, ice, targets, last turn, migration, shuffle, 450 deterministic complete games — OK; random wins:',wins);
