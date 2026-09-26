'use strict';
(function(root){
 const COLS=5,ROWS=7;
 function random(s){let x=s.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x>>>0;return s.seed/4294967296;}
 function number(s){const n=random(s);return n<.7?2:n<.95?4:8;}
 function copy(s){const {previous,turnStart,...rest}=s;return {...rest,board:s.board.slice(),active:s.active?{...s.active}:null};}
 function free(s,x,y){return x>=0&&x<COLS&&y>=0&&y<ROWS&&!s.board[y*COLS+x];}
 function spawn(s){
  const value=s.next;s.next=number(s);s.active={x:2,y:0,value};
  if(!free(s,2,0)){s.active=null;s.over=true;}
  s.turnStart=copy(s);
 }
 function create(seed){const s={version:1,mode:'falling',seed:(seed>>>0)||1,board:Array(COLS*ROWS).fill(0),score:0,moves:0,next:2,active:null,over:false,won:false,continued:false,previous:null};s.next=number(s);spawn(s);return s;}
 function landing(s){if(!s.active)return null;let y=s.active.y;while(free(s,s.active.x,y+1))y++;return {x:s.active.x,y,value:s.active.value};}
 function gravity(board){
  const positions=new Map();
  for(let x=0;x<COLS;x++){const values=[];for(let y=ROWS-1;y>=0;y--)if(board[y*COLS+x])values.push({value:board[y*COLS+x],from:y*COLS+x});for(let y=ROWS-1;y>=0;y--){const entry=values[ROWS-1-y];board[y*COLS+x]=entry?.value||0;if(entry)positions.set(entry.from,y*COLS+x);}}
  return positions;
 }
 function neighbors(board,i){
  if(i===undefined||!board[i])return [];
  const x=i%COLS,y=Math.floor(i/COLS);
  return [y<ROWS-1?i+COLS:-1,x>0?i-1:-1,x<COLS-1?i+1:-1,y>0?i-COLS:-1].filter(j=>j>=0&&board[j]===board[i]);
 }
 function settle(board,focus){
  let gain=0,chains=0,merged=[];const bonuses=[];
  // Сначала приземлившийся блок забирает ВСЕХ касающихся его равных соседей.
  // Каждый сосед удваивает результат: 8 + две соседние 8 -> 32.
  // Только после одновременного слияния применяется гравитация и новая цепочка.
  focus=gravity(board).get(focus);
  while(true){
   let touching=neighbors(board,focus);
   if(!touching.length){
    // Другие пары, возникшие после падения, тоже продолжают цепочку.
    // Узел с большим числом соседей имеет приоритет над отдельной парой.
    for(let y=ROWS-1;y>=0;y--)for(let x=0;x<COLS;x++){
     const i=y*COLS+x,candidates=neighbors(board,i);
     if(candidates.length>touching.length){focus=i;touching=candidates;}
    }
   }
   if(!touching.length)break;
   const input=board[focus],value=input*2**touching.length;
   if(touching.length>1)bonuses.push({input,blocks:touching.length+1,value});
   board[focus]=value;for(const i of touching)board[i]=0;
   gain+=value;chains++;merged.push(focus);
   const positions=gravity(board);focus=positions.get(focus);
   merged=merged.flatMap(i=>positions.has(i)?[positions.get(i)]:[]);
  }
  return {gain,chains,merged:[...new Set(merged)],bonuses};
 }
 function action(state,direction){
  if(!state.active||state.over||(state.won&&!state.continued))return {state,changed:false};
  const s={...state,board:state.board.slice(),active:{...state.active}};
  if(direction==='left'||direction==='right'){
   const x=s.active.x+(direction==='left'?-1:1);if(!free(s,x,s.active.y))return {state,changed:false};s.active.x=x;return {state:s,changed:true,locked:false};
  }
  if(!['down','drop'].includes(direction))return {state,changed:false};
  if(direction==='down'&&free(s,s.active.x,s.active.y+1)){s.active.y++;return {state:s,changed:true,locked:false};}
  const landed=landing(s);s.board[landed.y*COLS+landed.x]=landed.value;
  const result=settle(s.board,landed.y*COLS+landed.x);s.score+=result.gain;s.moves++;s.won=s.won||s.board.some(n=>n>=2048);
  s.previous=state.turnStart?copy(state.turnStart):copy(state);spawn(s);
  return {state:s,changed:true,locked:true,landed,...result};
 }
 function undo(s){if(!s.previous)return s;const previous=copy(s.previous);return {...previous,previous:null,turnStart:copy(previous)};}
 function continueGame(s){return {...s,continued:true};}
 function valid(s){return !!s&&s.version===1&&s.mode==='falling'&&Array.isArray(s.board)&&s.board.length===COLS*ROWS&&s.board.every(n=>n===0||Number.isSafeInteger(n)&&n>=2&&Math.log2(n)%1===0)&&Number.isSafeInteger(s.score)&&s.score>=0&&Number.isSafeInteger(s.moves)&&s.moves>=0&&Number.isInteger(s.seed)&&s.seed>0&&s.seed<=4294967295&&[2,4,8].includes(s.next)&&(s.active===null||!!s.active&&Number.isInteger(s.active.x)&&Number.isInteger(s.active.y)&&[2,4,8].includes(s.active.value)&&free(s,s.active.x,s.active.y));}
 function restore(value){
  if(!valid(value))return null;const s=copy(value);s.over=!s.active;s.won=s.board.some(n=>n>=2048);s.continued=s.continued===true;
  s.previous=valid(value.previous)?copy(value.previous):null;s.turnStart=valid(value.turnStart)?copy(value.turnStart):copy(s);return s;
 }
 const api={COLS,ROWS,create,action,landing,undo,continueGame,restore};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Falling2048=api;
})(typeof window==='undefined'?globalThis:window);
