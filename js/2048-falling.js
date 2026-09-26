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
  for(let x=0;x<COLS;x++){const values=[];for(let y=ROWS-1;y>=0;y--)if(board[y*COLS+x])values.push(board[y*COLS+x]);for(let y=ROWS-1;y>=0;y--)board[y*COLS+x]=values[ROWS-1-y]||0;}
 }
 function settle(board){
  let gain=0,chains=0;const merged=[];
  // Равные соседи объединяются снизу вверх; сначала вертикальная пара,
  // затем горизонтальная. После каждой пары незакреплённые блоки падают.
  gravity(board);
  while(true){
   let pair=null;
   for(let y=ROWS-1;y>=0&&!pair;y--)for(let x=0;x<COLS&&!pair;x++){
    const i=y*COLS+x;if(!board[i])continue;
    if(y>0&&board[i]===board[i-COLS])pair=[i,i-COLS];
    else if(x<COLS-1&&board[i]===board[i+1])pair=[i,i+1];
   }
   if(!pair)break;
   board[pair[0]]*=2;gain+=board[pair[0]];board[pair[1]]=0;chains++;merged.push(pair[0]);gravity(board);
  }
  return {gain,chains,merged:[...new Set(merged)]};
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
  const result=settle(s.board);s.score+=result.gain;s.moves++;s.won=s.won||s.board.some(n=>n>=2048);
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
