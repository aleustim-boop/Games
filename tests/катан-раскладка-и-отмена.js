'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),Module=require('node:module'),path=require('node:path');
const P=require('../js/катан-правила'),B=require('../js/катан-бот'),M=require('../js/катан-память'),C=require('../js/катан-часы'),A=require('../server/игры/катан');
const clone=x=>JSON.parse(JSON.stringify(x));
const stable=g=>{const x=clone(g);delete x._undo;delete x.log;delete x.serial;if(x.options)delete x.options.harbors;return x;};
function checkMap(g){
  assert.deepEqual([0,1,2,3,4,5].map(r=>g.hexes.filter(h=>h.resource===r).length),[4,3,4,4,3,1]);
  assert.deepEqual(g.hexes.map(h=>h.number).filter(Boolean).sort((a,b)=>a-b),[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12]);
  for(const e of P.Г.edges)if(e.hexes.length===2)assert(!e.hexes.every(id=>[6,8].includes(g.hexes[id].number)));
  const seen=new Set();
  for(const h of g.hexes){if(seen.has(h.id))continue;const queue=[h.id];seen.add(h.id);
    for(let i=0;i<queue.length;i++)for(const edge of P.Г.hexes[queue[i]].edges)for(const id of P.Г.edges[edge].hexes)
      if(!seen.has(id)&&g.hexes[id].resource===h.resource){seen.add(id);queue.push(id);}
    assert(queue.length<=2,'Связная группа одинаковых ресурсов: '+queue.join(','));
  }
}
for(let seed=1;seed<=2000;seed++)checkMap(P.создать(seed%2?3:4,seed,false,3));
for(let i=0;i<25;i++)checkMap(P.создать(4,1,true,3));
const fixed=P.создать(4,1,false,3,{harbors:'fixed'}).ports;
const randomMaps=new Set();
for(let seed=1;seed<=150;seed++)for(const harbors of ['fixed','random']){
 const game=P.создать(4,seed,false,3,{harbors});
 assert.equal(game.options.harbors,harbors);
 assert.deepEqual(game.ports.map(p=>p.resource).sort((a,b)=>a-b),[-1,-1,-1,-1,0,1,2,3,4]);
 const ends=game.ports.flatMap(p=>{const e=P.Г.edges[p.edge];assert.equal(e.hexes.length,1);return [e.a,e.b]});assert.equal(new Set(ends).size,18);
 if(harbors==='fixed')assert.deepEqual(game.ports,fixed);else randomMaps.add(JSON.stringify(game.ports));
}
assert(randomMaps.size>100);
// Старые сохранения должны воспроизводить прежний остров и случайность.
const filename=path.resolve(__dirname,'../js/катан-правила.js'),legacy=new Module(filename);
legacy.filename=filename;legacy.paths=module.paths;
legacy._compile(cp.execFileSync('git',['show','2939834:js/катан-правила.js'],{encoding:'utf8'}),filename);
for(const rules of [1,2])for(const seed of [1,19,12345]){
  const old=legacy.exports.создать(4,seed,false,rules),now=P.создать(4,seed,false,rules);
  for(let i=0;i<45;i++){assert.deepEqual(stable(now),stable(old));const p=P.кто(old),a=B.ход(legacy.exports.вид(old,p),'обычный');legacy.exports.действие(old,p,a);P.действие(now,p,a);}
}
let base=P.создать(4,321,false,3);
while(base.phase!=='main'){const p=P.кто(base);P.действие(base,p,B.ход(P.вид(base,p),'сложный'));}
const p=base.turn,q=(p+1)%base.n;
function rich(){const g=clone(base);g._undo=null;g.players[p].resources.forEach((n,r)=>{g.bank[r]+=n;g.bank[r]-=10;});g.players[p].resources=[10,10,10,10,10];return g;}
function reverse(g,a){const before=stable(g);P.действие(g,p,a);assert(P.вид(g,p).legal.undo);assert(!P.вид(g,q).legal.undo);assert(!JSON.stringify(P.вид(g,q)).includes('_undo'));const serial=g.serial;
  const unchanged=clone(g);assert.throws(()=>P.действие(g,q,{type:'undo',serial}));assert.deepEqual(g,unchanged);
  assert.throws(()=>P.действие(g,p,{type:'undo',serial:serial-1}));assert.deepEqual(g,unchanged);
  P.действие(g,p,{type:'undo',serial});assert.deepEqual(stable(g),before);assert.equal(g.serial,serial+1);assert.equal(g.log.at(-1).type,'undo');
  assert.throws(()=>P.действие(g,p,{type:'undo',serial:g.serial}));
}
reverse(rich(),{type:'road',edge:P.дороги(base,p)[0]});
reverse(rich(),{type:'city',vertex:base.buildings.findIndex(b=>b?.owner===p)});
reverse(rich(),{type:'bank',give:0,want:1});
let g=rich();while(!P.поселения(g,p).length){P.действие(g,p,{type:'road',edge:P.дороги(g,p)[0]});}reverse(g,{type:'settlement',vertex:P.поселения(g,p)[0]});
g=rich();g.phase='freeRoad';g.freeRoads=1;g.returnPhase='main';reverse(g,{type:'road',edge:P.дороги(g,p)[0]});
// Обе начальные расстановки: возвращаются и выданные за второе поселение ресурсы.
for(const second of [false,true]){
  g=P.создать(4,55,false,3);while(second&&g.setupIndex<g.n){const who=P.кто(g);P.действие(g,who,B.ход(P.вид(g,who),'обычный'));}
  const who=g.turn,before=stable(g);P.действие(g,who,{type:'settlement',vertex:P.поселения(g,who,true)[0]});P.действие(g,who,{type:'undo',serial:g.serial});assert.deepEqual(stable(g),before);
  P.действие(g,who,{type:'settlement',vertex:P.поселения(g,who,true)[0]});P.действие(g,who,{type:'road',edge:P.дороги(g,who,true)[0]});assert(!P.вид(g,who).legal.undo);
}
// Любое успешное взаимодействие или раскрытие информации закрывает отмену.
for(const next of ['offer','development','dev','end']){
  g=rich();g.players[p].dev.push({type:'plenty',bought:-1});P.действие(g,p,{type:'bank',give:0,want:1});
  const a=next==='offer'?{type:'offer',to:p,give:[0,1,0,0,0],want:[1,0,0,0,0]}:next==='dev'?{type:'dev',card:'plenty',resources:[1,0,1,0,0]}:{type:next};
  if(next==='offer'){g.players[q].resources[1]++;g.bank[1]--;}
  P.действие(g,next==='offer'?q:p,a);assert(!P.вид(g,p).legal.undo);
}
g=rich();P.действие(g,p,{type:'bank',give:0,want:1});const keep=clone(g);assert.throws(()=>P.действие(g,q,{type:'city',vertex:999}));assert.deepEqual(g,keep);
g=rich();g.phase='roll';P.действие(g,p,{type:'roll'});assert(!P.вид(g,p).legal.undo);
g=rich();g.players[p].dev=Array.from({length:10-P.очки(g,p)-1},()=>({type:'vp',bought:-1}));P.действие(g,p,{type:'city',vertex:g.buildings.findIndex(b=>b?.owner===p)});assert.equal(g.phase,'finished');assert(!P.вид(g,p).legal.undo);
// Таймер не продлевается при отмене; просроченная отмена отвергается сервером.
g=rich();g.options.turnSeconds=60;const party={игроки:['a','b','c','d'],игра:g,часы:C.обновить({},g),завершена:false};
const who=party.игроки[p],deadline=party.часы.deadline;
assert(A.сделатьХод(party,who,{действие:'катан',move:{type:'bank',give:0,want:1}}).принято);
assert(A.сделатьХод(party,who,{действие:'катан',move:{type:'undo',serial:g.serial}}).принято);assert.equal(party.часы.deadline,deadline);
assert(A.сделатьХод(party,who,{действие:'катан',move:{type:'bank',give:0,want:1}}).принято);party.часы.deadline=Date.now()-1;
assert.equal(A.сделатьХод(party,who,{действие:'катан',move:{type:'undo',serial:g.serial}}).принято,false);
const record={version:1,rules:3,seed:111,n:3,level:'обычный',actions:[]},saved=P.создать(3,111,false,3),whoSaved=saved.turn;
for(const action of [{type:'settlement',vertex:P.поселения(saved,whoSaved,true)[0]},{type:'undo',serial:1}]){P.действие(saved,whoSaved,action);record.actions.push({player:whoSaved,action});}
assert.deepEqual(M.восстановить(record),saved);
console.log('Катан: 2025 островов, совместимость старых партий, отмена/запреты/ресурсы/таймер/восстановление — OK');
