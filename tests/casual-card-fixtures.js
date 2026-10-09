'use strict';
const S=require('../общее/casual/solitaire-core');
function collectable(kind){
 const s=S.create(kind,kind==='freecell'?'classic':'1',27);s.stock=[];s.waste=[];s.piles=s.piles.map(()=>[]);
 for(let pile=0;pile<4;pile++)for(let rank=13;rank>=1;rank--){const suit=rank%2?pile:pile^1;s.piles[pile].push({id:suit*13+rank-1,suit,up:true});}
 return s;
}
function spider(mode='1'){
 const s=S.create('spider',mode,27);s.stock=[];s.piles=s.piles.map(()=>[]);
 for(let group=0;group<8;group++){const suit=group%Number(mode);for(let rank=13;rank>=2;rank--)s.piles[group].push({id:group*13+rank-1,suit,up:true});s.piles[8].unshift({id:group*13,suit,up:true});}
 return s;
}
module.exports={collectable,spider};
