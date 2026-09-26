'use strict';
const assert=require('node:assert/strict'),R=require('../js/2048-rules');
function game(board){return {...R.create(15),board:[...board,...Array(16-board.length).fill(0)],score:0,moves:0};}
const merge=R.move(game([2,2,2,2]),'left');
assert.equal(merge.gain,8);assert.deepEqual(merge.merged,[0,1]);assert.equal(merge.state.board[0],4);assert.equal(merge.state.board[1],4);
const once=R.move(game([2,2,4,0]),'left');assert.equal(once.gain,4);assert.equal(once.state.board[0],4);assert.equal(once.state.board[1],4);
const separated=R.move(game([2,0,2,4]),'right');assert.equal(separated.gain,4);assert.equal(separated.state.board[3],4);assert.equal(separated.state.board[2],4);
for(const direction of ['up','down']){const s=game([2,0,0,0,2,0,0,0,2,0,0,0,2]);const r=R.move(s,direction);assert.equal(r.gain,8);assert.equal(r.merged.length,2);}
const initial=R.create(99);assert.equal(initial.board.filter(Boolean).length,2);assert.deepEqual(initial,R.create(99));
const no=game([2]);assert.equal(R.move(no,'left').state,no);assert.equal(R.move(no,'left').changed,false);assert.equal(R.move(no,'bad').state,no);
const sum=a=>a.reduce((s,n)=>s+n,0);
for(let seed=1;seed<=100;seed++){
 let s=R.create(seed);
 for(let turn=0;turn<1000&&!s.over;turn++){
  const result=R.move(s,['left','up','right','down'][turn%4]);
  if(result.changed){assert([2,4].includes(sum(result.state.board)-sum(s.board)));assert.equal(result.state.moves,s.moves+1);assert.equal(result.state.score,s.score+result.gain);const u=R.undo(result.state);assert.deepEqual(u.board,s.board);assert.equal(u.seed,s.seed);assert.equal(u.score,s.score);assert.deepEqual(R.move(u,['left','up','right','down'][turn%4]).state.board,result.state.board,'Undo must not reroll');}
  s=result.state;if(s.won)s=R.continueGame(s);
 }
}
const blocked=game([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]);assert(!R.canMove(blocked.board));assert(R.restore(blocked).over);
const win=R.move(game([1024,1024]),'left');assert(win.state.won);assert.equal(win.gain,2048);assert(!R.move(win.state,'right').changed);assert(R.move(R.continueGame(win.state),'right').changed);
assert.equal(R.restore({board:[2]}),null);assert.equal(R.restore({...initial,board:Array(16).fill(3)}),null);assert.equal(R.restore({...initial,score:Infinity}),null);
const saved=R.restore(JSON.parse(JSON.stringify(merge.state)));assert.deepEqual(saved,merge.state);assert.equal(R.undo(R.undo(merge.state)).previous,null);
console.log('2048: four directions, single merge, invalid move, deterministic undo, 100 seeded games, win/continue, loss and save validation — OK');
