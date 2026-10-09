'use strict';
(function(root){
  function ключ(g){return g.phase==='finished'?'finished':g.phase.startsWith('setup')?`setup:${g.setupIndex}`:g.phase==='discard'?`discard:${g.round}:${g.discard.findIndex(n=>n>0)}`:`turn:${g.round}:${g.turn}`;}
  function обновить(clock,g,now=Date.now()){
    const key=ключ(g),seconds=g.options?.turnSeconds||0;
    if(clock.key!==key||clock.seconds!==seconds){clock.key=key;clock.seconds=seconds;clock.deadline=seconds&&g.phase!=='finished'?now+seconds*1000:null;}
    if(g.phase==='finished')clock.deadline=null;
    return clock;
  }
  function остаток(clock,now=Date.now()){return clock?.deadline==null?Infinity:Math.max(0,(clock.deadline-now)/1000);}
  const api={обновить,остаток};if(typeof module!=='undefined')module.exports=api;else root.КатанЧасы=api;
})(typeof window!=='undefined'?window:globalThis);
