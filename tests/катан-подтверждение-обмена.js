'use strict';
const assert=require('node:assert/strict'),P=require('../js/катан-правила'),B=require('../js/катан-бот');
const fresh=()=>{const g=P.создать(4,1,false,3);g.phase='main';g.turn=0;g.players.forEach(p=>p.resources=[4,4,4,4,4]);return g;};
const proposal={type:'offer',to:-1,give:[1,0,0,0,0],want:[0,1,0,0,0],confirmation:true};
const g=fresh();P.действие(g,0,proposal);const id=g.offer.id,before=g.players.map(p=>p.resources.slice());
P.действие(g,1,{type:'agree',offer:id});P.действие(g,2,{type:'accept',offer:id}); // Older clients cannot bypass confirmation.
assert.deepEqual(g.offer.accepted,[1,2]);assert.deepEqual(g.players.map(p=>p.resources),before);
for(const [p,a]of [[1,{type:'agree',offer:id}],[0,{type:'agree',offer:id}],[1,{type:'confirmTrade',offer:id,partner:2}],[0,{type:'confirmTrade',offer:id,partner:3}]]){const snapshot=JSON.stringify(g);assert.throws(()=>P.действие(g,p,a));assert.equal(JSON.stringify(g),snapshot);}
P.действие(g,0,{type:'confirmTrade',offer:id,partner:2});assert.deepEqual(g.players[1].resources,before[1]);assert.deepEqual(g.players[0].resources,[3,5,4,4,4]);assert.deepEqual(g.players[2].resources,[5,3,4,4,4]);assert.equal(g.offer,null);assert.throws(()=>P.действие(g,0,{type:'confirmTrade',offer:id,partner:1}));
for(const ending of ['withdrawTrade','reject','cancelOffer','end']){const h=fresh();P.действие(h,0,proposal);const oid=h.offer.id;P.действие(h,1,{type:'agree',offer:oid});P.действие(h,['withdrawTrade','reject'].includes(ending)?1:0,{type:ending,offer:oid});assert.throws(()=>P.действие(h,0,{type:'confirmTrade',offer:oid,partner:1}));assert.deepEqual(h.players.map(p=>p.resources),before);}
for(const seat of [0,1]){const h=fresh();P.действие(h,0,proposal);P.действие(h,1,{type:'agree',offer:h.offer.id});h.players[seat].resources.fill(0);const snapshot=JSON.stringify(h);assert.throws(()=>P.действие(h,0,{type:'confirmTrade',offer:h.offer.id,partner:1}));assert.equal(JSON.stringify(h),snapshot);}
const privateGame=fresh();P.действие(privateGame,0,{...proposal,to:1});assert.throws(()=>P.действие(privateGame,2,{type:'agree',offer:privateGame.offer.id}));
const bot=fresh();P.действие(bot,0,proposal);P.действие(bot,1,{type:'agree',offer:bot.offer.id});assert.equal(B.ответНаОбмен(P.вид(bot,1)),null);assert.equal(B.ответНаОбмен(P.вид(bot,0)).type,'confirmTrade');
// Old saved action histories still replay their one-step exchange.
const legacy=fresh();P.действие(legacy,0,{...proposal,confirmation:false});P.действие(legacy,1,{type:'accept',offer:legacy.offer.id});assert.equal(legacy.offer,null);
console.log('Trade confirmation: two volunteers, choose second, no early transfer, ownership, stale/repeated actions, withdrawal, stock recheck, private offer, bots and legacy replay — OK');

const search=fresh();P.действие(search,0,{...proposal,give:[0,0,0,0,0],want:[0,0,0,0,1]});const sid=search.offer.id;
assert(search.offer.request);assert.throws(()=>P.действие(search,1,{type:'agree',offer:sid}));
const quote=(r)=>({type:'quote',offer:sid,give:[0,0,0,0,1],want:[0,0,0,0,0].map((_,i)=>i===r?1:0)});
assert.throws(()=>P.действие(search,0,quote(0)));assert.throws(()=>P.действие(search,1,{...quote(0),give:[1,0,0,0,0]}));
P.действие(search,1,quote(0));P.действие(search,2,quote(1));assert.equal(search.offer.quotes.length,2);assert.deepEqual(search.players.map(p=>p.resources),before);
const stale=search.offer.quotes[1].id;P.действие(search,2,{...quote(2)});assert.throws(()=>P.действие(search,0,{type:'confirmTrade',offer:sid,partner:2,quote:stale}));
P.действие(search,0,{type:'confirmTrade',offer:sid,partner:2,quote:search.offer.quotes.find(q=>q.player===2).id});assert.deepEqual(search.players[1].resources,before[1]);assert.deepEqual(search.players[0].resources,[4,4,3,4,5]);assert.deepEqual(search.players[2].resources,[4,4,5,4,3]);
console.log('Resource search: no payment selected, two independent quotes, price changes invalidate confirmation, chosen quote transfers exactly — OK');
