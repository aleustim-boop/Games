'use strict';
const assert=require('node:assert/strict'),S=require('../js/solitaire-core'),F=require('./casual-card-fixtures');
for(const mode of ['1','2','4']){
 const s=F.spider(mode);assert(S.validate(s));
 for(let group=0;group<8;group++){const a={type:'move',from:{area:'piles',pile:8,index:s.piles[8].length-1},to:{area:'piles',pile:group}};assert(S.act(s,a));assert.equal(s.finished.length,group+1);assert.equal(s.piles[group].length,0);assert(S.validate(s));assert.equal(s.won,group===7);}
 // Two already completed runs in the same saved column must both be cleared.
 const restored=F.spider(mode);for(let group=0;group<8;group++)restored.piles[group].push(restored.piles[8].pop());restored.piles[0].push(...restored.piles[1]);restored.piles[1]=[];require('../js/game-spider').resume(restored);assert.equal(restored.finished.length,8);assert(restored.won);assert(S.validate(restored));S.settle(restored);assert.equal(restored.finished.length,8);
 if(mode!=='1'){const colors=F.spider(mode);colors.piles[0].push(colors.piles[8].pop());[colors.piles[0][5],colors.piles[1][5]]=[colors.piles[1][5],colors.piles[0][5]];assert(S.validate(colors));S.settle(colors);assert.equal(colors.finished.length,0,'Mixed suits cannot complete a run');}
 const mixed=F.spider(mode);mixed.piles[0].push(mixed.piles[8].pop());mixed.piles[0][4].up=false;S.settle(mixed);assert.equal(mixed.finished.length,0,'Hidden card cannot complete a run');
}
for(const kind of ['klondike','freecell']){
 const s=F.collectable(kind);assert(S.validate(s));const plan=S.finishPlan(s);assert.equal(plan.length,52);const manual=structuredClone(s);for(const move of plan){assert(S.legal(manual,move));assert(S.act(manual,move));assert(S.validate(manual));}assert(manual.won);assert(S.act(s,{type:'autofinish'}));assert(s.won);assert.deepEqual(s,manual);assert(!S.act(s,{type:'autofinish'}));
 const hidden=F.collectable(kind);hidden.piles[0][0].up=false;assert.equal(S.finishPlan(hidden).length,0);assert(!S.act(hidden,{type:'autofinish'}));
 const blocked=F.collectable(kind);[blocked.piles[0][0],blocked.piles[0][12]]=[blocked.piles[0][12],blocked.piles[0][0]];assert.equal(S.finishPlan(blocked).length,0);assert(!S.act(blocked,{type:'autofinish'}));
 const selected=F.collectable(kind),from={area:'piles',pile:2,index:12};assert.equal(S.foundationMove(selected,from).to.pile,2);assert.equal(S.foundationMove(selected,{area:'piles',pile:2,index:0}),null);
 const partial=F.collectable(kind);S.act(partial,S.foundationMove(partial));assert(S.moves(partial).some(m=>m.from?.area==='foundations'),'Hints include playable foundation returns');
}
console.log('Cards completion: all 8 Spider runs in 1/2/4 suits, restored stacked runs, 52 legal foundation moves, safe auto-finish, blocked/hidden rejection and selected-card priority — OK');
