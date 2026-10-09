'use strict';
(function(root){
  const directions=['left','right','up','down'];
  function random(state){
    let x=state.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;
    state.seed=x>>>0;return state.seed/4294967296;
  }
  function spawn(state){
    const free=state.board.flatMap((n,i)=>n?[]:[i]);
    if(!free.length)return null;
    const index=free[Math.floor(random(state)*free.length)];
    state.board[index]=random(state)<.9?2:4;return index;
  }
  function canMove(board){
    return board.some((n,i)=>!n||(i%4<3&&n===board[i+1])||(i<12&&n===board[i+4]));
  }
  function create(seed){
    const state={version:1,board:Array(16).fill(0),score:0,moves:0,seed:(seed>>>0)||1,won:false,continued:false,over:false,previous:null};
    spawn(state);spawn(state);return state;
  }
  function snapshot(state){const {previous,...copy}=state;return {...copy,board:state.board.slice()};}
  function move(state,direction){
    if(!directions.includes(direction)||state.over||(state.won&&!state.continued))return {state,changed:false};
    const next={...snapshot(state),board:Array(16).fill(0)},motions=[],merged=[];
    let gain=0;
    for(let line=0;line<4;line++){
      const indices=Array.from({length:4},(_,i)=>direction==='left'?line*4+i:direction==='right'?line*4+3-i:direction==='up'?i*4+line:(3-i)*4+line);
      const values=indices.filter(i=>state.board[i]);
      let target=0;
      for(let i=0;i<values.length;i++){
        const from=values[i],value=state.board[from],to=indices[target++];
        motions.push({from,to,value});
        if(i+1<values.length&&value===state.board[values[i+1]]){
          motions.push({from:values[++i],to,value});next.board[to]=value*2;gain+=value*2;merged.push(to);
        }else next.board[to]=value;
      }
    }
    if(next.board.every((n,i)=>n===state.board[i]))return {state,changed:false};
    next.score+=gain;next.moves++;next.previous=snapshot(state);
    const spawned=spawn(next);next.over=!canMove(next.board);next.won=state.won||next.board.some(n=>n>=2048);
    return {state:next,changed:true,gain,motions,merged,spawned};
  }
  function undo(state){return state.previous?{...snapshot(state.previous),previous:null}:state;}
  function continueGame(state){return {...state,continued:true};}
  function valid(s){
    return !!s&&s.version===1&&Array.isArray(s.board)&&s.board.length===16&&s.board.some(Boolean)&&
      s.board.every(n=>n===0||Number.isSafeInteger(n)&&n>=2&&Math.log2(n)%1===0)&&
      Number.isSafeInteger(s.score)&&s.score>=0&&Number.isSafeInteger(s.moves)&&s.moves>=0&&
      Number.isInteger(s.seed)&&s.seed>0&&s.seed<=4294967295;
  }
  function restore(value){
    if(!valid(value))return null;
    const normalize=s=>({...snapshot(s),won:s.board.some(n=>n>=2048),continued:s.continued===true,over:!canMove(s.board)});
    const state=normalize(value);state.previous=valid(value.previous)?normalize(value.previous):null;return state;
  }
  const api={create,move,undo,continueGame,restore,canMove};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Game2048=api;
})(typeof window==='undefined'?globalThis:window);
