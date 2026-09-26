'use strict';
(function(root){
  const П=typeof module!=='undefined'?require('./катан-правила'):root.КатанПравила,Г=П.Г;
  const sum=П.сумма;
  function ценность(v,id){
    const income=[0,0,0,0,0];
    for(const [i,b] of v.buildings.entries())if(b?.owner===v.me)for(const h of Г.vertices[i].hexes){const t=v.hexes[h];if(t.resource<5)income[t.resource]+=(6-Math.abs(7-t.number))*b.level;}
    let score=0;const unique=new Set();
    for(const hid of Г.vertices[id].hexes){const h=v.hexes[hid];if(h.resource<5){score+=(6-Math.abs(7-h.number))*(income[h.resource]===0?1.7:1)*(h.resource===4||h.resource===3?1.15:1);unique.add(h.resource);}}
    return score+unique.size*1.4;
  }
  function путь(v){
    // Поиск перспективного перекрестья. Только публичные дороги и постройки.
    const targets=Г.vertices.filter(x=>!v.buildings[x.id]&&x.neighbors.every(n=>!v.buildings[n]));
    let best=null;
    for(const target of targets){
      const queue=[{at:target.id,path:[]}],seen=new Set();
      while(queue.length){
        const item=queue.shift();if(seen.has(item.at))continue;seen.add(item.at);
        const b=v.buildings[item.at];if(b&&b.owner!==v.me)continue;
        const connects=b?.owner===v.me||Г.vertices[item.at].edges.some(e=>v.roads[e]===v.me);
        if(connects){
          const score=ценность(v,target.id)/(1+item.path.length*1.7);
          if(item.path.length&&(!best||score>best.score))best={score,edge:item.path.at(-1),distance:item.path.length};break;
        }
        for(const eid of Г.vertices[item.at].edges){if(v.roads[eid]>=0)continue;const e=Г.edges[eid];queue.push({at:e.a===item.at?e.b:e.a,path:[...item.path,eid]});}
      }
    }
    return best;
  }
  function цель(v){
    if(v.players[v.me].pieces.city<4&&v.players[v.me].pieces.settlement>0&&(v.hand[4]>=2||v.players[v.me].pieces.settlement>=4))return 'city';
    if(П.поселения(v,v.me).length)return 'settlement';
    if(v.players[v.me].pieces.settlement<5&&путь(v)&&v.players[v.me].pieces.road<15)return 'road';
    if(v.players[v.me].pieces.city<4&&v.players[v.me].pieces.settlement>0)return 'city';
    return 'development';
  }
  function обмен(v){
    const o=v.offer;if(!o||o.from===v.me||o.to>=0&&o.to!==v.me||o.rejected?.includes(v.me)||!o.want.every((n,i)=>n<=v.hand[i]))return null;
    const cost=П.ЦЕНЫ[цель(v)],before=cost.reduce((s,n,i)=>s+Math.max(0,n-v.hand[i]),0),after=cost.reduce((s,n,i)=>s+Math.max(0,n-v.hand[i]-o.give[i]+o.want[i]),0);
    return after<before&&sum(o.want)<=sum(o.give)+1?{type:'accept',offer:o.id}:null;
  }
  function предложение(v){
    if(v.phase!=='main'||v.turn!==v.me||v.offer||v.log.some(e=>e.type==='offer'&&e.player===v.me&&e.id>(v.log.findLast(e=>e.type==='end')?.id||0)))return null;
    const cost=П.ЦЕНЫ[цель(v)],want=cost.map((n,r)=>({r,need:n-v.hand[r]})).filter(x=>x.need>0).sort((a,b)=>b.need-a.need)[0];
    if(!want||!v.players.some((p,i)=>i!==v.me&&p.cards>0))return null;
    const give=v.hand.map((n,r)=>({r,extra:n-cost[r]})).filter(x=>x.r!==want.r&&x.extra>0).sort((a,b)=>b.extra-a.extra)[0];if(!give)return null;
    const a=[0,0,0,0,0],b=a.slice();a[give.r]=1;b[want.r]=1;return {type:'offer',to:-1,give:a,want:b};
  }
  function ответНаОбмен(v){const o=v.offer;if(v.phase!=='main'||!o||o.from===v.me||o.to>=0&&o.to!==v.me||o.rejected?.includes(v.me))return null;return обмен(v)||{type:'reject',offer:o.id};}
  function ход(v,level='обычный'){
    const plain=id=>Г.vertices[id].hexes.reduce((s,h)=>s+(v.hexes[h].number?6-Math.abs(7-v.hexes[h].number):0),0);
    const score=id=>level==='сложный'?ценность(v,id):plain(id);
    const p=v.me,pick=a=>a[0],rank=a=>level==='лёгкий'?a:a.slice().sort((a,b)=>score(b)-score(a));
    if(v.phase==='finished')return null;
    if(v.phase==='discard'&&v.discard[p]){
      const resources=[0,0,0,0,0],left=v.hand.slice(),cost=П.ЦЕНЫ[цель(v)];
      for(let i=0;i<v.discard[p];i++){const r=left.map((n,r)=>({r,w:n-cost[r]})).filter(x=>left[x.r]>0).sort((a,b)=>b.w-a.w)[0].r;left[r]--;resources[r]++;}
      return {type:'discard',resources};
    }
    const trade=ответНаОбмен(v);if(trade)return trade;
    if(v.turn!==p)return null;
    if(v.phase==='setupSettlement')return {type:'settlement',vertex:level==='лёгкий'?pick(v.legal.settlement):rank(v.legal.settlement)[0]};
    if(v.phase==='setupRoad'||v.phase==='freeRoad')return {type:'road',edge:путь(v)?.edge&&v.legal.road.includes(путь(v).edge)?путь(v).edge:v.legal.road[0]};
    if(v.phase==='robber'){
      const score=h=>Г.hexes[h.id].vertices.reduce((s,id)=>{const b=v.buildings[id];return s+(!b?0:b.owner===p?-20:b.level*(2+v.players[b.owner].score));},0)*(h.number?6-Math.abs(7-h.number):.2);
      return {type:'robber',hex:v.hexes.filter(h=>(v.legal.robber||v.hexes.filter(t=>t.id!==v.robber).map(t=>t.id)).includes(h.id)).sort((a,b)=>score(b)-score(a))[0].id};
    }
    if(v.phase==='steal')return {type:'steal',victim:v.victims.slice().sort((a,b)=>v.players[b].score-v.players[a].score)[0]};
    if(v.legal.dev.includes('knight'))return {type:'dev',card:'knight'};
    if(v.phase==='roll')return {type:'roll'};
    if(v.phase!=='main')return null;
    if(v.offer?.from===p)return {type:'cancelOffer',offer:v.offer.id};
    if(v.legal.city.length)return {type:'city',vertex:rank(v.legal.city)[0]};
    if(v.legal.settlement.length)return {type:'settlement',vertex:rank(v.legal.settlement)[0]};
    const target=цель(v),cost=П.ЦЕНЫ[target];
    if(v.legal.dev.includes('plenty')){
      const resources=[0,0,0,0,0];for(let j=0;j<Math.min(2,sum(v.bank));j++){
        const r=v.bank.map((n,r)=>({r,w:cost[r]-v.hand[r]-resources[r]})).filter(x=>v.bank[x.r]>resources[x.r]).sort((a,b)=>b.w-a.w)[0].r;resources[r]++;
      }return {type:'dev',card:'plenty',resources};
    }
    if(v.legal.dev.includes('monopoly')){
      // Оценка по публичному банку и собственной руке, без чтения чужих ресурсов.
      const r=v.bank.map((n,r)=>({r,w:19-n-v.hand[r]+Math.max(0,cost[r]-v.hand[r])*2})).sort((a,b)=>b.w-a.w)[0].r;
      return {type:'dev',card:'monopoly',resource:r};
    }
    if(v.legal.dev.includes('roads'))return {type:'dev',card:'roads'};
    if(v.legal.road.length&&target==='road'){const path=путь(v);return {type:'road',edge:path&&v.legal.road.includes(path.edge)?path.edge:v.legal.road[0]};}
    const proposal=предложение(v);if(proposal)return proposal;
    for(let want=0;want<5;want++)if(v.hand[want]<cost[want]&&v.bank[want]>0){
      const give=v.hand.map((n,r)=>({r,surplus:n-cost[r]})).filter(x=>x.r!==want&&x.surplus>=v.rates[x.r]).sort((a,b)=>b.surplus-a.surplus)[0];if(give)return {type:'bank',give:give.r,want};
    }
    if(v.legal.development)return {type:'development'};
    // Когда расширение закрыто, строим оставшуюся дорогу ради награды.
    if(v.legal.road.length&&v.players[p].pieces.road<15&&sum(v.hand)>7)return {type:'road',edge:v.legal.road[0]};
    return {type:'end'};
  }
  const api={ход,обмен,ответНаОбмен,предложение,ценность};if(typeof module!=='undefined')module.exports=api;else root.КатанБот=api;
})(typeof window!=='undefined'?window:globalThis);
