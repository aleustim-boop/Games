'use strict';
(function(root){
  const РЕСУРСЫ=['wood','brick','wool','grain','ore'];
  const secureRandom=typeof module!=='undefined'?require('node:crypto').randomInt:null;
  const ЦЕНЫ={road:[1,1,0,0,0],settlement:[1,1,1,1,0],city:[0,0,0,2,3],development:[0,0,1,1,1]};
  const нули=()=>[0,0,0,0,0], сумма=a=>a.reduce((s,n)=>s+n,0), копия=x=>JSON.parse(JSON.stringify(x));
  function нужно(ok,text){if(!ok)throw Error(text);}
  function random(g){if(g.secure)return secureRandom(0,4294967296)/4294967296;let x=g.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;g.seed=x>>>0;return g.seed/4294967296;}
  function shuffle(g,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function геометрия(){
    const hexes=[],vertices=[],edges=[],vm=new Map(),em=new Map();
    for(let r=-2;r<=2;r++)for(let q=Math.max(-2,-r-2);q<=Math.min(2,-r+2);q++){
      const h={id:hexes.length,q,r,x:Math.sqrt(3)*(q+r/2),y:1.5*r,vertices:[],edges:[]};
      for(let k=0;k<6;k++){
        const angle=(60*k-30)*Math.PI/180,x=h.x+Math.cos(angle),y=h.y+Math.sin(angle),key=Math.round(x*1e5)+','+Math.round(y*1e5);
        if(!vm.has(key)){vm.set(key,vertices.length);vertices.push({id:vertices.length,x,y,hexes:[],edges:[],neighbors:[]});}
        const v=vertices[vm.get(key)];h.vertices.push(v.id);v.hexes.push(h.id);
      }
      for(let k=0;k<6;k++){
        const a=h.vertices[k],b=h.vertices[(k+1)%6],key=[a,b].sort((a,b)=>a-b).join(',');
        if(!em.has(key)){
          em.set(key,edges.length);const e={id:edges.length,a,b,hexes:[]};edges.push(e);
          vertices[a].edges.push(e.id);vertices[b].edges.push(e.id);vertices[a].neighbors.push(b);vertices[b].neighbors.push(a);
        }
        const e=edges[em.get(key)];e.hexes.push(h.id);h.edges.push(e.id);
      }
      hexes.push(h);
    }
    return {hexes,vertices,edges};
  }
  const Г=геометрия();
  function создать(n=4,seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0,secure=false){
    нужно([3,4].includes(n),'Нужно 3 или 4 игрока');
    нужно(!secure||secureRandom,'Защищённая случайность доступна на сервере');
    const g={version:1,seed:seed||1,n,turn:0,round:1,phase:'setupSettlement',bank:[19,19,19,19,19],roads:Array(72).fill(-1),buildings:Array(54).fill(null),players:Array.from({length:n},()=>({resources:нули(),dev:[],knights:0})),deck:[],log:[],serial:0,dice:null,offer:null,roadOwner:-1,armyOwner:-1,lengths:Array(n).fill(0),winner:-1,playedDev:false,discard:Array(n).fill(0),setupIndex:0,lastSettlement:-1,freeRoads:0,returnPhase:'main'};
    g.secure=Boolean(secure);
    const terrain=shuffle(g,[0,0,0,0,1,1,1,2,2,2,2,3,3,3,3,4,4,4,5]);
    let nums,valid=false;
    while(!valid){
      const ns=shuffle(g,[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12]);let p=0;
      nums=terrain.map(t=>t===5?0:ns[p++]);
      valid=Г.edges.every(e=>e.hexes.length!==2||!e.hexes.every(i=>[6,8].includes(nums[i])));
    }
    g.hexes=terrain.map((resource,id)=>({id,resource,number:nums[id]}));g.robber=terrain.indexOf(5);
    const coast=Г.edges.filter(e=>e.hexes.length===1).sort((a,b)=>{
      const p=Г.vertices[a.a],q=Г.vertices[a.b],r=Г.vertices[b.a],s=Г.vertices[b.b];return Math.atan2(p.y+q.y,p.x+q.x)-Math.atan2(r.y+s.y,r.x+s.x);
    });
    const types=shuffle(g,[-1,-1,-1,-1,0,1,2,3,4]);
    g.ports=[0,3,6,10,13,16,20,23,26].map((j,i)=>({edge:coast[j].id,resource:types[i]}));
    g.deck=shuffle(g,[...Array(14).fill('knight'),...Array(5).fill('vp'),...Array(2).fill('roads'),...Array(2).fill('plenty'),...Array(2).fill('monopoly')]);
    g.start=Math.floor(random(g)*n);const order=Array.from({length:n},(_,i)=>(i+g.start)%n);g.setup=[...order,...order.slice().reverse()];g.turn=g.setup[0];
    return g;
  }
  function фигуры(g,p){return {road:g.roads.filter(x=>x===p).length,settlement:g.buildings.filter(x=>x?.owner===p&&x.level===1).length,city:g.buildings.filter(x=>x?.owner===p&&x.level===2).length};}
  function поселения(g,p,initial=false){
    if(фигуры(g,p).settlement>=5)return [];
    return Г.vertices.filter(v=>!g.buildings[v.id]&&v.neighbors.every(id=>!g.buildings[id])&&(initial||v.edges.some(id=>g.roads[id]===p))).map(v=>v.id);
  }
  function дороги(g,p,initial=false){
    if(фигуры(g,p).road>=15)return [];
    return Г.edges.filter(e=>g.roads[e.id]<0&&(initial?[e.a,e.b].includes(g.lastSettlement):[e.a,e.b].some(id=>{
      const b=g.buildings[id];return b?b.owner===p:Г.vertices[id].edges.some(eid=>g.roads[eid]===p);
    }))).map(e=>e.id);
  }
  function длина(g,p){
    function walk(v,used){
      if(used.size&&g.buildings[v]&&g.buildings[v].owner!==p)return used.size;
      let best=used.size;
      for(const id of Г.vertices[v].edges)if(g.roads[id]===p&&!used.has(id)){
        used.add(id);const e=Г.edges[id];best=Math.max(best,walk(e.a===v?e.b:e.a,used));used.delete(id);
      }
      return best;
    }
    return Math.max(0,...Г.vertices.filter(v=>v.edges.some(id=>g.roads[id]===p)).map(v=>walk(v.id,new Set())));
  }
  function награда(values,current,min){const max=Math.max(...values);if(max<min)return -1;const tied=values.flatMap((v,i)=>v===max?[i]:[]);return tied.includes(current)?current:tied.length===1?tied[0]:-1;}
  function очки(g,p,hidden=true){return g.buildings.reduce((s,b)=>s+(b?.owner===p?b.level:0),0)+(g.roadOwner===p?2:0)+(g.armyOwner===p?2:0)+(hidden?g.players[p].dev.filter(d=>d.type==='vp').length:0);}
  function итог(g){
    g.lengths=g.players.map((_,i)=>длина(g,i));g.roadOwner=награда(g.lengths,g.roadOwner,5);g.armyOwner=награда(g.players.map(p=>p.knights),g.armyOwner,3);
    if(g.phase!=='finished'&&!g.phase.startsWith('setup')&&очки(g,g.turn)>=10){g.winner=g.turn;g.phase='finished';g.offer=null;}
  }
  function хватит(h,cost){return cost.every((n,i)=>h[i]>=n);}
  function pay(g,p,cost){нужно(хватит(g.players[p].resources,cost),'Не хватает ресурсов');cost.forEach((n,i)=>{g.players[p].resources[i]-=n;g.bank[i]+=n;});}
  function take(g,p,r,n){const amount=Math.min(g.bank[r],n);g.bank[r]-=amount;g.players[p].resources[r]+=amount;return amount;}
  function курс(g,p,r){let rate=4;for(const port of g.ports){const e=Г.edges[port.edge];if([e.a,e.b].some(id=>g.buildings[id]?.owner===p))rate=Math.min(rate,port.resource===r?2:port.resource===-1?3:4);}return rate;}
  function ресурсы(a){return Array.isArray(a)&&a.length===5&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=19);}
  function жертвы(g,p,hex=g.robber){return [...new Set(Г.hexes[hex].vertices.map(id=>g.buildings[id]?.owner).filter(i=>i!==undefined&&i!==p&&сумма(g.players[i].resources)>0))];}
  function кто(g){return g.phase==='finished'?-1:g.phase==='discard'?g.discard.findIndex(n=>n>0):g.turn;}
  function событие(g,p,type,extra={}){g.log.push({id:++g.serial,player:p,type,...extra});if(g.log.length>100)g.log.shift();}
  function произвести(g,sum){
    const gains=g.players.map(()=>нули());
    for(const h of g.hexes)if(h.number===sum&&h.id!==g.robber)for(const v of Г.hexes[h.id].vertices){const b=g.buildings[v];if(b)gains[b.owner][h.resource]+=b.level;}
    const actual=g.players.map(()=>нули());
    for(let r=0;r<5;r++){
      const recipients=gains.flatMap((a,p)=>a[r]?[p]:[]),total=gains.reduce((s,a)=>s+a[r],0);
      if(g.bank[r]>=total||recipients.length===1)for(const p of recipients)actual[p][r]=take(g,p,r,gains[p][r]);
    }
    return actual;
  }
  function завершитьРазбойника(g){g.phase=g.returnPhase;g.returnPhase='main';}
  function украсть(g,p,victim){
    const h=g.players[victim].resources;let index=Math.floor(random(g)*сумма(h));
    for(let r=0;r<5;r++){if(index<h[r]){h[r]--;g.players[p].resources[r]++;break;}index-=h[r];}
    событие(g,p,'steal',{victim});завершитьРазбойника(g);
  }
  function применить(g,p,a){
    нужно(Number.isInteger(p)&&p>=0&&p<g.n&&g.phase!=='finished','Партия недоступна');
    нужно(a&&typeof a.type==='string','Неизвестное действие');
    if(a.type==='surrender'){g.phase='finished';g.winner=-1;g.surrendered=p;g.offer=null;событие(g,p,'surrender');return;}
    if(a.type==='accept'){
      const o=g.offer;нужно(g.phase==='main'&&o&&p!==o.from&&(o.to===-1||o.to===p)&&a.offer===o.id,'Предложение уже недоступно');
      нужно(хватит(g.players[p].resources,o.want)&&хватит(g.players[o.from].resources,o.give),'Ресурсы для обмена изменились');
      for(let r=0;r<5;r++){g.players[p].resources[r]+=o.give[r]-o.want[r];g.players[o.from].resources[r]+=o.want[r]-o.give[r];}
      событие(g,p,'trade',{other:o.from,give:o.want,want:o.give});g.offer=null;return;
    }
    if(a.type==='offer'){
      нужно(g.phase==='main','Обмен доступен после броска');
      нужно(Number.isInteger(a.to)&&a.to>=-1&&a.to<g.n&&a.to!==p&&(p===g.turn||a.to===g.turn),'Обмен только с активным игроком');
      нужно(ресурсы(a.give)&&ресурсы(a.want)&&сумма(a.give)>0&&сумма(a.want)>0&&a.give.every((n,i)=>!n||!a.want[i]),'Выберите разные ресурсы с обеих сторон');
      нужно(хватит(g.players[p].resources,a.give),'У вас нет предложенных ресурсов');
      g.offer={id:g.serial+1,from:p,to:a.to,give:a.give.slice(),want:a.want.slice()};событие(g,p,'offer');return;
    }
    if(a.type==='cancelOffer'){нужно(g.offer&&(g.offer.from===p||g.turn===p),'Нельзя отменить чужой обмен');g.offer=null;return;}
    if(a.type==='discard'){
      нужно(g.phase==='discard'&&g.discard[p]>0,'Вам не нужно сбрасывать карты');
      нужно(ресурсы(a.resources)&&сумма(a.resources)===g.discard[p]&&хватит(g.players[p].resources,a.resources),'Выберите ровно половину ресурсов');
      pay(g,p,a.resources);g.discard[p]=0;событие(g,p,'discard',{count:сумма(a.resources)});
      if(!g.discard.some(Boolean))g.phase='robber';return;
    }
    нужно(p===g.turn,'Сейчас ход другого игрока');
    if(g.phase==='setupSettlement'){
      нужно(a.type==='settlement'&&поселения(g,p,true).includes(a.vertex),'Выберите свободное перекрестье с соблюдением расстояния');
      g.buildings[a.vertex]={owner:p,level:1};g.lastSettlement=a.vertex;
      if(g.setupIndex>=g.n)for(const h of Г.vertices[a.vertex].hexes){const r=g.hexes[h].resource;if(r<5)take(g,p,r,1);}
      g.phase='setupRoad';событие(g,p,'settlement',{vertex:a.vertex});return;
    }
    if(g.phase==='setupRoad'){
      нужно(a.type==='road'&&дороги(g,p,true).includes(a.edge),'Дорога должна идти от нового поселения');g.roads[a.edge]=p;
      g.setupIndex++;if(g.setupIndex===g.n*2){g.turn=g.start;g.phase='roll';}else{g.turn=g.setup[g.setupIndex];g.phase='setupSettlement';}
      событие(g,p,'road',{edge:a.edge});return;
    }
    if(a.type==='dev'){
      нужно(['roll','main'].includes(g.phase)&&!g.playedDev,'Можно сыграть одну карту развития за ход');
      const idx=g.players[p].dev.findIndex(d=>d.type===a.card&&d.bought<g.round);нужно(idx>=0&&a.card!=='vp','Эта карта пока недоступна');
      if(a.card==='plenty')нужно(ресурсы(a.resources)&&сумма(a.resources)===Math.min(2,сумма(g.bank))&&хватит(g.bank,a.resources),'Выберите два доступных ресурса');
      if(a.card==='monopoly')нужно(Number.isInteger(a.resource)&&a.resource>=0&&a.resource<5,'Выберите ресурс');
      if(a.card==='roads')нужно(дороги(g,p).length>0,'Нет места для дороги');
      g.players[p].dev.splice(idx,1);g.playedDev=true;g.offer=null;событие(g,p,'dev',{card:a.card});
      if(a.card==='knight'){g.players[p].knights++;g.returnPhase=g.phase;g.phase='robber';}
      if(a.card==='roads'){g.returnPhase=g.phase;g.phase='freeRoad';g.freeRoads=Math.min(2,15-фигуры(g,p).road);}
      if(a.card==='plenty')a.resources.forEach((n,r)=>take(g,p,r,n));
      if(a.card==='monopoly')for(let j=0;j<g.n;j++)if(j!==p){g.players[p].resources[a.resource]+=g.players[j].resources[a.resource];g.players[j].resources[a.resource]=0;}
      return;
    }
    if(g.phase==='robber'){
      нужно(a.type==='robber'&&Number.isInteger(a.hex)&&a.hex>=0&&a.hex<19&&a.hex!==g.robber,'Переместите разбойника на другой гекс');
      g.robber=a.hex;событие(g,p,'robber',{hex:a.hex});const victims=жертвы(g,p);
      if(victims.length===1)украсть(g,p,victims[0]);else if(victims.length>1)g.phase='steal';else завершитьРазбойника(g);return;
    }
    if(g.phase==='steal'){нужно(a.type==='steal'&&жертвы(g,p).includes(a.victim),'Выберите соседа разбойника');украсть(g,p,a.victim);return;}
    if(g.phase==='freeRoad'){
      нужно(a.type==='road'&&дороги(g,p).includes(a.edge),'Выберите свободный участок своей дороги');g.roads[a.edge]=p;g.freeRoads--;событие(g,p,'road',{edge:a.edge});
      if(!g.freeRoads||!дороги(g,p).length){g.phase=g.returnPhase;g.freeRoads=0;}return;
    }
    if(a.type==='roll'){
      нужно(g.phase==='roll','Кубики уже брошены');g.dice=[1+Math.floor(random(g)*6),1+Math.floor(random(g)*6)];const sum=сумма(g.dice);
      if(sum===7){g.discard=g.players.map(x=>сумма(x.resources)>7?Math.floor(сумма(x.resources)/2):0);g.phase=g.discard.some(Boolean)?'discard':'robber';g.returnPhase='main';событие(g,p,'roll',{dice:g.dice,gains:null});}
      else{g.phase='main';событие(g,p,'roll',{dice:g.dice,gains:произвести(g,sum)});}return;
    }
    нужно(g.phase==='main','Сначала завершите текущее действие');
    if(a.type==='end'){
      g.turn=(g.turn+1)%g.n;g.round++;g.phase='roll';g.playedDev=false;g.offer=null;событие(g,p,'end');return;
    }
    if(a.type==='bank'){
      нужно(Number.isInteger(a.give)&&Number.isInteger(a.want)&&a.give>=0&&a.give<5&&a.want>=0&&a.want<5&&a.give!==a.want,'Выберите разные ресурсы');
      const rate=курс(g,p,a.give);нужно(g.players[p].resources[a.give]>=rate&&g.bank[a.want]>0,'Обмен недоступен');const cost=нули();cost[a.give]=rate;pay(g,p,cost);take(g,p,a.want,1);событие(g,p,'bank',{give:a.give,want:a.want,rate});g.offer=null;return;
    }
    нужно(Object.hasOwn(ЦЕНЫ,a.type),'Неизвестное действие');
    if(a.type==='road')нужно(дороги(g,p).includes(a.edge),'Здесь нельзя построить дорогу');
    if(a.type==='settlement')нужно(поселения(g,p).includes(a.vertex),'Здесь нельзя построить поселение');
    if(a.type==='city')нужно(фигуры(g,p).city<4&&g.buildings[a.vertex]?.owner===p&&g.buildings[a.vertex].level===1,'Город заменяет ваше поселение');
    if(a.type==='development')нужно(g.deck.length>0,'Карты развития закончились');
    pay(g,p,ЦЕНЫ[a.type]);g.offer=null;
    if(a.type==='road')g.roads[a.edge]=p;
    if(a.type==='settlement')g.buildings[a.vertex]={owner:p,level:1};
    if(a.type==='city')g.buildings[a.vertex].level=2;
    if(a.type==='development')g.players[p].dev.push({type:g.deck.pop(),bought:g.round});
    событие(g,p,a.type,{...(Number.isInteger(a.vertex)?{vertex:a.vertex}:{}),...(Number.isInteger(a.edge)?{edge:a.edge}:{})});
  }
  function действие(g,p,a){const draft=копия(g);применить(draft,p,a);итог(draft);Object.assign(g,draft);return g;}
  function вид(g,me){
    нужно(Number.isInteger(me)&&me>=0&&me<g.n,'Игрок не найден');
    const h=g.players[me].resources,legal={road:[],settlement:[],city:[],development:false,dev:[]},mine=me===g.turn;
    if(mine){
      if(g.phase==='setupSettlement')legal.settlement=поселения(g,me,true);
      if(g.phase==='setupRoad')legal.road=дороги(g,me,true);
      if(g.phase==='freeRoad')legal.road=дороги(g,me);
      if(g.phase==='main'){
        if(хватит(h,ЦЕНЫ.road))legal.road=дороги(g,me);
        if(хватит(h,ЦЕНЫ.settlement))legal.settlement=поселения(g,me);
        if(хватит(h,ЦЕНЫ.city)&&фигуры(g,me).city<4)legal.city=g.buildings.flatMap((b,id)=>b?.owner===me&&b.level===1?[id]:[]);
        legal.development=g.deck.length>0&&хватит(h,ЦЕНЫ.development);
      }
      if(['roll','main'].includes(g.phase)&&!g.playedDev)legal.dev=[...new Set(g.players[me].dev.filter(d=>d.type!=='vp'&&d.bought<g.round&&(d.type!=='roads'||дороги(g,me).length)).map(d=>d.type))];
    }
    return копия({version:1,n:g.n,me,turn:g.turn,actor:кто(g),round:g.round,phase:g.phase,hexes:g.hexes,ports:g.ports,roads:g.roads,buildings:g.buildings,robber:g.robber,bank:g.bank,dice:g.dice,deckCount:g.deck.length,
      players:g.players.map((p,i)=>({score:очки(g,i,i===me||g.phase==='finished'),cards:сумма(p.resources),devCount:p.dev.length,victoryCards:i===me||g.phase==='finished'?p.dev.filter(d=>d.type==='vp').length:null,knights:p.knights,pieces:фигуры(g,i),roadLength:g.lengths[i]})),hand:h,dev:g.players[me].dev,legal,
      rates:РЕСУРСЫ.map((_,r)=>курс(g,me,r)),discard:g.discard,offer:g.offer,roadOwner:g.roadOwner,armyOwner:g.armyOwner,winner:g.winner,surrendered:g.surrendered??-1,log:g.log,serial:g.serial,victims:g.phase==='steal'&&mine?жертвы(g,me):[],freeRoads:g.freeRoads});
  }
  const api={РЕСУРСЫ,ЦЕНЫ,Г,создать,действие,вид,кто,очки,длина,поселения,дороги,курс,произвести,итог,фигуры,сумма};
  if(typeof module!=='undefined')module.exports=api;else root.КатанПравила=api;
})(typeof window!=='undefined'?window:globalThis);
