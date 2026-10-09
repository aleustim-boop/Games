'use strict';
const A=require('node:assert/strict'),P=require('../игры/покер/покер-правила');
const c=s=>'23456789TJQKA'.indexOf(s[0])+13*'cdhs'.indexOf(s[1]);
const cards=s=>s.split(' ').map(c);
// Независимый оценщик: анализирует все ранги и масти сразу, без перебора пятёрок.
function reference(cs){
  const counts=Array(15).fill(0),suits=Array.from({length:4},()=>[]);
  for(const c of cs){counts[c%13+2]++;suits[Math.floor(c/13)].push(c%13+2);}
  const ranks=Array.from({length:13},(_,i)=>14-i).filter(r=>counts[r]);
  const straight=rs=>{const set=new Set(rs);if(set.has(14))set.add(1);for(let high=14;high>=5;high--)if([0,1,2,3,4].every(d=>set.has(high-d)))return high;return 0;};
  const flush=suits.find(s=>s.length>=5)?.sort((a,b)=>b-a),sf=flush&&straight(flush);
  if(sf)return [8,sf];const quads=ranks.find(r=>counts[r]===4);if(quads)return [7,quads,ranks.find(r=>r!==quads)];
  const trips=ranks.filter(r=>counts[r]>=3),pairs=ranks.filter(r=>counts[r]>=2);
  if(trips.length&&pairs.some(r=>r!==trips[0]))return [6,trips[0],pairs.find(r=>r!==trips[0])];
  if(flush)return [5,...flush.slice(0,5)];const run=straight(ranks);if(run)return [4,run];
  if(trips.length)return [3,trips[0],...ranks.filter(r=>r!==trips[0]).slice(0,2)];
  if(pairs.length>=2)return [2,...pairs.slice(0,2),ranks.find(r=>!pairs.slice(0,2).includes(r))];
  if(pairs.length)return [1,pairs[0],...ranks.filter(r=>r!==pairs[0]).slice(0,3)];return [0,...ranks.slice(0,5)];
}
let seed=47291;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let i=0;i<30000;i++){const pool=Array.from({length:52},(_,i)=>i),hand=[];for(let j=0;j<5+i%3;j++)hand.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);A.deepEqual(P.evaluate(hand).score,reference(hand));}
console.log('30 000 рук из 5–7 карт совпали с независимым оценщиком');
if(process.argv.includes('--полный')){
 const categories=Array(9).fill(0);
 for(let a=0;a<48;a++)for(let b=a+1;b<49;b++)for(let c=b+1;c<50;c++)for(let d=c+1;d<51;d++)for(let e=d+1;e<52;e++)categories[P.evaluate([a,b,c,d,e]).score[0]]++;
 A.deepEqual(categories,[1302540,1098240,123552,54912,10200,5108,3744,624,40]);
 console.log('Все 2 598 960 пятикарточных наборов: точное распределение девяти комбинаций — OK');
}
function nextHand(n,stacks,rules=2){const g=P.create(n,9,false,rules);g.phase='between';g.turn=0;g.players.forEach((p,i)=>{p.stack=stacks[i];p.bet=p.total=0;p.out=!stacks[i];});P.action(g,0,{type:'next'});return g;}
let g=nextHand(2,[5,2995]);A(['between','finished'].includes(g.phase));A.equal(g.board.length,5);P.assert(g);
// Малый блайнд выбыл: следующий большой — место 3, баттон остаётся на пустом месте 1.
g=nextHand(4,[3000,0,1500,1500]);A.equal(g.button,1);A.equal(g.sbSeat,2);A.equal(g.bbSeat,3);
// Большой блайнд выбыл: малый блайнд мёртвый, большой платит место 3.
g=nextHand(4,[3000,1500,0,1500]);A.equal(g.button,1);A.equal(g.sbSeat,2);A.equal(g.players[2].bet,0);A.equal(g.bbSeat,3);
// Номер большого блайнда идёт по живым местам независимо от нескольких выбываний.
for(let n=3;n<=6;n++)for(let mask=0;mask<(1<<n);mask++){
 const remaining=Array.from({length:n},(_,i)=>i).filter(i=>!(mask&(1<<i)));if(remaining.length<2)continue;
 const stacks=Array(n).fill(0);remaining.forEach(i=>stacks[i]=Math.floor(n*1500/remaining.length));stacks[remaining[0]]+=n*1500-stacks.reduce((a,b)=>a+b,0);
 g=nextHand(n,stacks);const expected=Array.from({length:n},(_,k)=>(2+k+1)%n).find(i=>remaining.includes(i));A.equal(g.bbSeat,expected);P.assert(g);
}
// Старые сохранения воспроизводятся по прежней версии.
g=nextHand(2,[5,2995],1);A.equal(g.phase,'preflop');A.equal(P.legal(g,g.turn).call,10);
// Несколько коротких ва-банков совместно открывают повышение.
g=P.create(5,6);g.players[4].stack=25;g.players[0].stack=40;g.players[1].stack+=2935;
P.action(g,3,{type:'call'});P.action(g,4,{type:'allin'});P.action(g,0,{type:'allin'});P.action(g,1,{type:'call'});P.action(g,2,{type:'call'});A.equal(g.turn,3);A(P.legal(g,3).raise);A.equal(P.legal(g,3).min,60);
// Пас не открывает карты даже в итогах; любые повреждённые запросы атомарны.
for(const action of [{type:'raise',to:NaN},{type:'raise',to:Infinity},{type:'raise',to:21},{type:'raise',to:-1},{type:'raise',to:'100'},{type:'check'},{type:'next'},{type:'dance'},null]){
 const t=P.create(4,1),before=JSON.stringify(t);A.throws(()=>P.action(t,t.turn,action));A.equal(JSON.stringify(t),before);
}
// Разнообразные размеры ставок, короткие стеки, все размеры столов и окончания.
let actions=0;
for(let run=0;run<500;run++){
 g=P.create(2+run%5,run);let steps=0;
 while(g.phase!=='finished'&&steps++<20000){const l=P.legal(g,g.turn);let a;
  if(l.next)a={type:'next'};else if(l.raise&&rng()<.32)a={type:'raise',to:Math.min(l.max,l.min+Math.floor(rng()*Math.max(1,l.max-l.min)))};
  else if(l.check)a={type:rng()<.03?'fold':'check'};else a={type:rng()<.8?'call':'fold'};
  P.action(g,g.turn,a);P.assert(g);actions++;
 }
 A.equal(g.phase,'finished');A.equal(g.players[g.winner].stack,g.players.length*1500);
}
console.log('Блайнды и выбывание, короткие/накопленные ва-банки, атомарные отказы, 500 турниров ('+actions+' действий) — OK');
