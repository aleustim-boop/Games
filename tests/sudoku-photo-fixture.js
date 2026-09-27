'use strict';
const R=require('../js/sudoku-rules'),bank=require('../js/sudoku-puzzles');
// Recovered from the supplied 27 September screenshot. The clue pattern and
// digit mapping match expert[0] exactly; teal entries are not original clues.
const puzzle='040006000000000042800007650460000000000001000508700004710805000000003010920070500'.split('').map(Number);
const board='040006000000000042800007650461000000000001000508700104710805400084003010920174500'.split('').map(Number);
const rows=[8,7,6,5,3,4,2,1,0],cols=[2,1,0,7,6,8,4,5,3],digits=[0,5,1,4,9,7,3,8,2,6];
const mapped=rows.flatMap(r=>cols.map(c=>digits[Number(bank.expert[0][r*9+c])]));
const state=()=>R.restore({version:1,level:'expert',puzzle,board,notes:Array(81).fill(0),history:[],seconds:475,hints:0});
module.exports={puzzle,board,mapped,state};
