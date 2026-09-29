'use strict';
const A=require('node:assert/strict'),P=require('../js/покер-правила'),B=require('../js/покер-бот');
const card=s=>'23456789TJQKA'.indexOf(s[0])+13*'cdhs'.indexOf(s[1]);
const hand=s=>s.split(' ').map(card),score=s=>P.evaluate(hand(s));
const fixtures=[['Ac Kd 9h 7s 3c',0],['Ac Ad 9h 7s 3c',1],['Ac Ad 9h 9s 3c',2],['Ac Ad Ah 7s 3c',3],['Ac 2d 3h 4s 5c',4],['Ac Jc 9c 7c 3c',5],['Ac Ad Ah 7s 7c',6],['Ac Ad Ah As 3c',7],['Ac Kc Qc Jc Tc',8]];
for(const [s,type]of fixtures)A.equal(score(s).score[0],type,s);
A.equal(score('Ac 2d 3h 4s 5c').score[1],5);
A(P.compare(score('Ac Ad Ah Kc Kd Qc Qd').score,score('Ac Ad Ah Qc Qd Jc Jd').score)>0);
A.equal(score('Ac Kc Qc Jc Tc 2d 3h').label,'Роял-флеш');
A(P.compare(score('Ac Ad Kh Qs Jc').score,score('As Ah Kd Qc Tc').score)>0);
let g=P.create(2,5);A.equal(g.sbSeat,g.button);A.equal(g.turn,g.button);P.action(g,g.turn,{type:'call'});A.equal(g.turn,g.bbSeat);P.action(g,g.turn,{type:'check'});A.equal(g.phase,'flop');A.equal(g.turn,g.bbSeat);
// Полностью уравненный банк: обе руки раскрыты, все 3 000 фишек остаются у игроков.
g=P.create(2,11);P.action(g,g.turn,{type:'allin'});P.action(g,g.turn,{type:'call'});A.equal(g.board.length,5);A(g.result.showdown);A.equal(g.players.reduce((s,p)=>s+p.stack,0),3000);
// Половинный ва-банк не открывает повторное повышение уже ответившим игрокам.
g=P.create(4,9);g.players[0].stack=25;g.players[1].stack+=1475;P.action(g,3,{type:'call'});P.action(g,0,{type:'allin'});P.action(g,1,{type:'call'});P.action(g,2,{type:'call'});A.equal(g.turn,3);A.equal(P.legal(g,3).raise,false);const before=JSON.stringify(g);A.throws(()=>P.action(g,3,{type:'raise',to:100}));A.equal(JSON.stringify(g),before);P.action(g,3,{type:'call'});
// Побочные банки 100/300/600: основную тройную часть забирают тузы, вторую — короли, излишек возвращён.
g=P.create(3,22);g.players.forEach((p,i)=>{p.stack=[100,300,600][i];p.total=0;p.bet=0;p.acted=null;p.folded=false;});g.players[2].stack+=3500;
g.players[0].hole=hand('Ac Ad');g.players[1].hole=hand('Kc Kd');g.players[2].hole=hand('Qc Qd');g.board=hand('2h 4s 7c 9d Jh');g.phase='river';g.currentBet=0;g.minRaise=20;g.turn=0;
P.action(g,0,{type:'allin'});P.action(g,1,{type:'allin'});P.action(g,2,{type:'call'});A.deepEqual(g.result.wins,[300,400,0]);A.equal(g.players[2].stack,3800);P.assert(g);
// Ничья по общим картам, нечётная фишка — следующему от дилера; пасующая рука скрыта.
g=P.create(3,8);g.phase='river';g.board=hand('Ac Kc Qc Jc Tc');g.players[0].hole=hand('2h 3h');g.players[1].hole=hand('4h 5h');g.players[2].hole=hand('6h 7h');g.players.forEach(p=>{p.stack=1499;p.total=1;p.bet=0;p.acted=null;});g.players[2].folded=true;g.currentBet=0;g.turn=0;
P.action(g,0,{type:'check'});P.action(g,1,{type:'check'});A.deepEqual(g.result.wins,[1,2,0]);A.deepEqual(P.view(g,0).players[2].hole,[null,null]);
// До вскрытия чужие карты, колода и зерно случайности не покидают движок.
g=P.create(6,777);const v=P.view(g,0);A.equal(v.players.filter(p=>p.hole[0]!==null).length,1);for(const key of ['deck','seed','secure'])A.equal(v[key],undefined);
// Случайные полные партии выявляют зависания, повторные карты и потерянные фишки.
let state=55;const rng=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
for(let run=0;run<120;run++){
 g=P.create(2+run%5,run);let steps=0;
 while(g.phase!=='finished'&&steps++<16000){const l=P.legal(g,g.turn);let a;if(l.next)a={type:'next'};else if(l.raise&&rng()<.18)a={type:'allin'};else if(l.check)a={type:'check'};else a={type:rng()<.77?'call':'fold'};P.action(g,g.turn,a);P.assert(g);}
 A.equal(g.phase,'finished',`Партия ${run} зависла`);A.equal(g.players[g.winner].stack,g.players.length*1500);
}
// Боты всех уровней принимают легальные решения по приватному виду.
for(const level of ['лёгкий','обычный','сложный']){g=P.create(3,91);for(let k=0;k<25&&g.phase!=='finished';k++){const i=g.turn,a=B.move(P.view(g,i),level,rng);A(a);P.action(g,i,a);}}
console.log('Покер: комбинации, кикеры, головы-вдвоём, ва-банк, боковые банки, нечётная фишка, приватность, 120 партий и 3 уровня ботов — OK');
