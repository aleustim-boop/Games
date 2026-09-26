'use strict';
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./casual-core'));else r.SolitaireCore=f(r.CasualCore);})(globalThis,U=>{
 const rank=c=>c.id%13+1,suit=c=>c.suit,red=c=>c.suit===1||c.suit===3;
 function create(kind,mode,seed){const count=kind==='spider'?104:52,suits=kind==='spider'?Number(mode):4;let deck=U.shuffle(Array.from({length:count},(_,id)=>({id,suit:kind==='spider'?Math.floor(id/13)%suits:Math.floor(id/13),up:kind==='freecell'})),U.random(seed));const piles=Array.from({length:kind==='spider'?10:kind==='freecell'?8:7},()=>[]),s={...U.base(mode,seed),kind,piles,stock:[],waste:[],foundations:Array.from({length:4},()=>[]),cells:[[],[],[],[]],finished:[]};
  if(kind==='klondike'){for(let i=0;i<7;i++){for(let j=0;j<=i;j++)piles[i].push(deck.pop());piles[i].at(-1).up=true;}}
  else if(kind==='spider'){for(let i=0;i<54;i++)piles[i%10].push(deck.pop());piles.forEach(p=>p.at(-1).up=true);}
  else{for(let i=0;deck.length;i++)piles[i%8].push(deck.pop());}s.stock=deck;return s;
 }
 function source(s,from){if(!from||!['piles','waste','foundations','cells'].includes(from.area))return null;if(from.area==='waste')return s.waste;if(!Number.isInteger(from.pile)||!s[from.area]?.[from.pile])return null;return s[from.area][from.pile];}
 function sequence(s,cards){return cards.length>0&&cards.every((c,i)=>c.up&&(!i||rank(cards[i-1])===rank(c)+1&&(s.kind==='spider'?suit(cards[i-1])===suit(c):red(cards[i-1])!==red(c))));}
 function legal(s,a){if(a.type!=='move'||s.won)return false;const src=source(s,a.from),dst=source(s,a.to);if(!src||!dst||src===dst||!Number.isInteger(a.from.index)||a.from.index<0||a.from.index>=src.length)return false;const cards=src.slice(a.from.index),c=cards[0];if(a.from.area!=='piles'&&cards.length!==1||!sequence(s,cards))return false;
  if(a.to.area==='foundations')return s.kind!=='spider'&&cards.length===1&&suit(c)===a.to.pile&&rank(c)===dst.length+1;
  if(a.to.area==='cells')return s.kind==='freecell'&&cards.length===1&&dst.length===0;
  if(a.to.area!=='piles')return false;const top=dst.at(-1);if(top?(!top.up||rank(top)!==rank(c)+1||(s.kind!=='spider'&&red(top)===red(c))):(s.kind==='klondike'&&rank(c)!==13))return false;
  if(s.kind==='freecell'){const empty=s.piles.filter(p=>!p.length).length-(dst.length?0:1),capacity=(s.cells.filter(p=>!p.length).length+1)*2**empty;if(cards.length>capacity)return false;}return true;
 }
 function settle(s){for(const p of s.piles){if(p.length)p.at(-1).up=true;if(s.kind==='spider'&&p.length>=13){const tail=p.slice(-13);if(rank(tail[0])===13&&sequence(s,tail)){s.finished.push(p.splice(-13));if(p.length)p.at(-1).up=true;}}}s.score=s.kind==='spider'?s.finished.length*100:s.foundations.reduce((sum,p)=>sum+p.length,0)*10;s.won=s.kind==='spider'?s.finished.length===8:s.foundations.every(p=>p.length===13);}
 function act(s,a){if(s.won||s.lost)return false;if(a.type==='draw'){
   if(s.kind==='freecell')return false;if(s.kind==='spider'){if(!s.stock.length||s.piles.some(p=>!p.length))return false;for(const p of s.piles){const c=s.stock.pop();c.up=true;p.push(c);}}
   else if(s.stock.length){for(let i=0;i<Number(s.mode)&&s.stock.length;i++){const c=s.stock.pop();c.up=true;s.waste.push(c);}}else if(s.waste.length){s.stock=s.waste.reverse();s.stock.forEach(c=>c.up=false);s.waste=[];}else return false;
  }else if(legal(s,a)){const from=source(s,a.from),to=source(s,a.to);to.push(...from.splice(a.from.index));}else return false;settle(s);return true;
 }
 function moves(s){const result=[];for(const area of ['piles','waste','cells']){const piles=area==='waste'?[s.waste]:s[area];piles.forEach((p,pile)=>p.forEach((_,index)=>{if(area!=='piles'&&index!==p.length-1)return;const from={area,pile,index};for(const toArea of ['foundations','piles','cells'])s[toArea].forEach((__,dest)=>{const a={type:'move',from,to:{area:toArea,pile:dest}};if(legal(s,a))result.push(a);});}));}if(s.kind==='klondike'&&(s.stock.length||s.waste.length)||s.kind==='spider'&&s.stock.length&&s.piles.every(p=>p.length))result.push({type:'draw'});return result;}
 function validate(s){if(!s||!['klondike','spider','freecell'].includes(s.kind)||!Array.isArray(s.piles)||s.piles.length!==(s.kind==='spider'?10:s.kind==='freecell'?8:7)||!Array.isArray(s.stock)||!Array.isArray(s.waste)||!Array.isArray(s.foundations)||s.foundations.length!==4||!Array.isArray(s.cells)||s.cells.length!==4||!Array.isArray(s.finished))return false;
  const piles=[...s.piles,s.stock,s.waste,...s.foundations,...s.cells,...s.finished];if(piles.some(p=>!Array.isArray(p)))return false;const cards=piles.flat(),count=s.kind==='spider'?104:52;if(cards.length!==count||new Set(cards.map(c=>c?.id)).size!==count)return false;return cards.every(c=>Number.isInteger(c.id)&&c.id>=0&&c.id<count&&typeof c.up==='boolean'&&c.suit===(s.kind==='spider'?Math.floor(c.id/13)%Number(s.mode):Math.floor(c.id/13)))&&s.cells.every(p=>p.length<=1);
 }
 return {rank,suit,red,create,source,sequence,legal,act,moves,validate};
});
