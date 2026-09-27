'use strict';
const assert=require('node:assert/strict'),R=require('../js/sudoku-rules'),F=require('./sudoku-photo-fixture');
assert.deepEqual(F.puzzle,F.mapped,'Original clues must match the shipped puzzle bank');
const s=F.state();assert(s);assert.equal(R.solve(s.puzzle).count,1);assert.equal(s.solution[10],5);assert.deepEqual(R.conflicts(s.board),[]);assert.deepEqual(R.mistakes(s),[60,65]);
assert.equal(s.solution[60],3);assert.equal(s.solution[65],5);
assert.deepEqual(R.mistakes(R.restore(s)),[60,65]);
R.enter(s,60,3);R.enter(s,65,5);assert.deepEqual(R.mistakes(s),[]);assert.equal(R.solve(s.board).count,1);R.enter(s,10,5);assert.deepEqual(R.mistakes(s),[]);
const noteState=F.state();noteState.board=noteState.puzzle.slice();R.enter(noteState,56,4,true);R.enter(noteState,65,4);assert.equal(noteState.notes[56],8,'Wrong 4 must not erase a valid 4 candidate');assert.deepEqual(R.mistakes(noteState),[65]);R.undo(noteState);assert.equal(noteState.notes[56],8);assert.deepEqual(R.mistakes(noteState),[]);
// Every non-given cell on the reported puzzle detects all eight wrong values,
// even when no direct row/column/box repetition has occurred.
for(let i=0;i<81;i++)if(!s.puzzle[i])for(let value=1;value<=9;value++){const x=F.state();x.board=x.puzzle.slice();R.enter(x,i,value);assert.deepEqual(R.mistakes(x),value===x.solution[i]?[]:[i]);R.undo(x);assert.deepEqual(R.mistakes(x),[]);}
console.log('Sudoku photo regression: exact bank match, unique solution, two non-conflicting mistakes, 504 entries, restore, undo and note preservation — OK');
