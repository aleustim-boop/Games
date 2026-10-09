/* Бот видит ровно ту же информацию, что человек на своём месте. */
(function(root){'use strict';const P=typeof module==='object'?require('./покер-правила'):root.ПокерПравила;
  function strength(v,rng,samples){
    const own=v.players[v.me].hole;if(own.some(c=>c===null))throw Error('Нет собственных карт');
    const unknown=Array.from({length:52},(_,i)=>i).filter(c=>!own.includes(c)&&!v.board.includes(c));let points=0;
    const rivals=v.players.filter((p,i)=>i!==v.me&&!p.folded&&!p.out).length;
    for(let k=0;k<samples;k++){
      const pool=unknown.slice();const draw=()=>pool.splice(Math.floor(rng()*pool.length),1)[0];
      const board=v.board.slice();while(board.length<5)board.push(draw());const mine=P.evaluate([...own,...board]);let best=0,ties=1;
      for(let j=0;j<rivals;j++){const other=P.evaluate([draw(),draw(),...board]),cmp=P.compare(other.score,mine.score);if(cmp>0)best=1;else if(cmp===0)ties++;}
      if(!best)points+=1/ties;
    }return points/samples;
  }
  function move(v,level='обычный',rng=Math.random){
    const l=v.legal;if(l.next)return {type:'next'};if(!l.fold)return null;
    const equity=strength(v,rng,level==='сложный'?90:level==='лёгкий'?12:40),p=v.players[v.me],odds=l.call/(v.pot+l.call||1),noise=level==='лёгкий'?.2:.07;
    if(l.raise&&(equity>.68||rng()<.04)&&rng()<.65){const target=Math.min(l.max,Math.max(l.min,v.currentBet+Math.round((v.pot+l.call)*.65)));return {type:'raise',to:target};}
    if(l.check)return {type:'check'};
    if(equity+noise>=odds&&(l.call<p.stack*.3||equity>.47)||rng()<.07)return {type:'call'};
    return {type:'fold'};
  }
  const api={move,strength};if(typeof module==='object'&&module.exports)module.exports=api;else root.ПокерБот=api;
})(typeof window==='object'?window:globalThis);
