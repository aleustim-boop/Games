'use strict';
const assert=require('node:assert/strict'),F=require('../js/2048-falling');
function fixture(board={},active={x:2,y:0,value:2}){const s=F.create(15);s.board.fill(0);for(const [i,n]of Object.entries(board))s.board[i]=n;s.active=active;const {turnStart,previous,...start}=s;s.turnStart=JSON.parse(JSON.stringify(start));return s;}
const original=F.create(123),down=F.action(original,'down');assert.equal(down.state.active.y,1);assert.equal(original.active.y,0);assert.equal(down.state.moves,0);
const left=F.action(fixture({}, {x:0,y:0,value:2}),'left');assert(!left.changed);
const landed=F.action(fixture(),'drop');assert.equal(landed.state.board[32],2);assert.equal(landed.state.moves,1);assert.equal(landed.state.active.y,0);
const vertical=F.action(fixture({32:4,27:2}),'drop');assert.equal(vertical.state.board[32],8);assert.equal(vertical.chains,2);assert.equal(vertical.gain,12);
const horizontal=F.action(fixture({30:2},{x:1,y:0,value:2}),'drop');assert.equal(horizontal.state.board[31],4);assert.equal(horizontal.gain,4);
const diagonal=F.action(fixture({30:2,31:8},{x:1,y:0,value:2}),'drop');assert.equal(diagonal.gain,0);assert.equal(diagonal.state.board[26],2);
const pair8=F.action(fixture({32:8},{x:2,y:0,value:8}),'drop');assert.equal(pair8.state.board[32],16);assert.equal(pair8.gain,16);assert.deepEqual(pair8.bonuses,[]);
const three8=fixture({31:8,33:8},{x:2,y:0,value:8}),bonus32=F.action(three8,'drop');
assert.equal(bonus32.state.board[32],32);assert.equal(bonus32.gain,32);assert.equal(bonus32.chains,1);assert.deepEqual(bonus32.bonuses,[{input:8,blocks:3,value:32}]);
const bonus64=F.action(fixture({26:8,28:8,31:2,32:8,33:4},{x:2,y:0,value:8}),'drop');
assert.equal(bonus64.state.board[32],64);assert.equal(bonus64.gain,64);assert.deepEqual(bonus64.bonuses,[{input:8,blocks:4,value:64}]);
const bonusChain=F.action(fixture({26:8,31:32,32:8},{x:2,y:0,value:8}),'drop');assert.equal(bonusChain.state.board[32],64);assert.equal(bonusChain.gain,96);assert.equal(bonusChain.chains,2);
const repeat=F.action(F.undo(bonus32.state),'drop');assert.deepEqual(repeat.state.board,bonus32.state.board);assert.equal(repeat.gain,32);assert.equal(repeat.state.score,32);
for(const value of [2,4,8]){const combo=F.action(fixture({31:value,33:value},{x:2,y:0,value}),'drop');assert.equal(combo.state.board[32],value*4);}
const blocked={};for(let row=0;row<7;row++)blocked[row*5+2]=row%2?4:2;
const loss=F.action(fixture(blocked,{x:0,y:0,value:8}),'drop');assert(loss.state.over);assert.equal(loss.state.active,null);assert(!F.action(loss.state,'drop').changed);
const winning=F.action(fixture({30:1024,31:1024},{x:4,y:0,value:2}),'drop');assert(winning.state.won);assert(!F.action(winning.state,'drop').changed);assert(F.action(F.continueGame(winning.state),'drop').changed);
const sum=b=>b.reduce((a,n)=>a+n,0);
for(let seed=1;seed<=100;seed++){
 let s=F.create(seed);
 for(let turn=0;turn<400&&!s.over;turn++){
  if(s.won&&!s.continued)s=F.continueGame(s);
  const col=(seed+turn*3)%5;
  for(let i=0;i<5&&s.active.x!==col;i++){const next=F.action(s,s.active.x<col?'right':'left');if(!next.changed)break;s=next.state;}
  const result=F.action(s,'drop');assert(result.changed);assert.equal(sum(result.state.board),sum(s.board)+s.active.value+result.bonuses.reduce((n,b)=>n+b.value-b.input*b.blocks,0));assert.equal(result.state.score,s.score+result.gain);
  for(let x=0;x<5;x++){let filled=false;for(let y=0;y<7;y++){const n=result.state.board[y*5+x];if(n)filled=true;else assert(!filled,'gravity left a hole');}}
  const restored=F.restore(JSON.parse(JSON.stringify(result.state)));assert(restored);assert.deepEqual(restored.board,result.state.board);
  const u=F.undo(result.state);assert.equal(u.score,s.turnStart.score);assert.equal(u.active.y,0);assert.equal(F.undo(u),u);
  s=result.state;
 }
}
assert.equal(F.restore({}),null);assert.equal(F.restore({...original,board:[2]}),null);assert.equal(F.restore({...original,active:{x:5,y:0,value:2}}),null);
console.log('Falling 2048: gravity, collisions, horizontal/vertical chains, score, spawn loss, win/continue, undo, save validation, 100 games — OK');
