/* Общие правила безлимитного холдема. Закрытые карты выходят только через view. */
(function(root){
  'use strict';
  const LABELS=['Старшая карта','Пара','Две пары','Тройка','Стрит','Флеш','Фулл-хаус','Каре','Стрит-флеш'];
  const rank=c=>c%13+2, suit=c=>Math.floor(c/13);
  const compare=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return Math.sign(d);}return 0;};
  function five(cs){
    const rs=cs.map(rank).sort((a,b)=>b-a),counts=new Map();rs.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
    const groups=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]),unique=[...counts.keys()],flush=cs.every(c=>suit(c)===suit(cs[0]));
    const straight=unique.length===5&&(rs[0]-rs[4]===4?rs[0]:rs.join(',')==='14,5,4,3,2'?5:0);
    if(flush&&straight)return [8,straight];
    if(groups[0][1]===4)return [7,groups[0][0],groups[1][0]];
    if(groups[0][1]===3&&groups[1][1]===2)return [6,groups[0][0],groups[1][0]];
    if(flush)return [5,...rs];if(straight)return [4,straight];
    if(groups[0][1]===3)return [3,...groups.map(g=>g[0])];
    if(groups[0][1]===2&&groups[1][1]===2)return [2,...groups.map(g=>g[0])];
    if(groups[0][1]===2)return [1,...groups.map(g=>g[0])];return [0,...rs];
  }
  function evaluate(cs){
    if(!Array.isArray(cs)||cs.length<5||cs.length>7||new Set(cs).size!==cs.length||cs.some(c=>!Number.isInteger(c)||c<0||c>51))throw Error('Неверный набор карт');
    let best=null,cards=[];
    for(let a=0;a<cs.length-4;a++)for(let b=a+1;b<cs.length-3;b++)for(let c=b+1;c<cs.length-2;c++)for(let d=c+1;d<cs.length-1;d++)for(let e=d+1;e<cs.length;e++){
      const picked=[cs[a],cs[b],cs[c],cs[d],cs[e]],score=five(picked);if(!best||compare(score,best)>0){best=score;cards=picked;}
    }
    return {score:best,cards,label:best[0]===8&&best[1]===14?'Роял-флеш':LABELS[best[0]]};
  }
  function random(g){g.seed=(Math.imul(1664525,g.seed)+1013904223)>>>0;return g.seed/4294967296;}
  function shuffle(g){const deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){let j;if(g.secure&&typeof require==='function')j=require('node:crypto').randomInt(i+1);else j=Math.floor(random(g)*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
  function next(g,i,predicate){for(let k=1;k<=g.players.length;k++){const j=(i+k)%g.players.length;if(predicate(g.players[j],j))return j;}return -1;}
  const alive=p=>!p.out,live=p=>!p.folded&&!p.out,canAct=p=>live(p)&&p.stack>0;
  function event(g,type,player=-1,amount=0){g.events.push({id:++g.version,hand:g.hand,type,player,amount});if(g.events.length>90)g.events.shift();}
  function pay(g,i,amount){const p=g.players[i],n=Math.min(p.stack,amount);p.stack-=n;p.bet+=n;p.total+=n;return n;}
  function create(n=4,seed=Date.now(),secure=false){
    if(!Number.isInteger(n)||n<2||n>6)throw Error('Нужно 2–6 игроков');
    const g={seed:seed>>>0,secure,players:Array.from({length:n},()=>({stack:1500,out:false,hole:[],bet:0,total:0,folded:false,acted:null,action:''})),hand:0,button:n-1,bb:20,board:[],events:[],version:0,phase:'ready',turn:0,winner:null,result:null};deal(g);return g;
  }
  function deal(g){
    const active=g.players.filter(p=>!p.out&&p.stack>0);if(active.length<2){g.phase='finished';g.winner=g.players.findIndex(p=>!p.out&&p.stack>0);g.turn=-1;return;}
    g.players.forEach(p=>{if(p.stack<=0)p.out=true;p.hole=[];p.bet=0;p.total=0;p.folded=p.out;p.acted=null;p.action='';});
    const previousBig=g.bbSeat;
    g.hand++;g.bb=Math.min(1280,20*Math.pow(2,Math.floor((g.hand-1)/10)));g.button=next(g,g.button,alive);
    // При переходе к игре вдвоём большой блайнд обязан перейти следующему живому месту.
    if(active.length===2&&Number.isInteger(previousBig)){const big=next(g,previousBig,alive);g.button=next(g,big,alive);}
    g.deck=shuffle(g);g.board=[];g.result=null;g.reveal=false;
    g.phase='preflop';g.minRaise=g.bb;g.currentBet=g.bb;
    let pos=g.button;for(let c=0;c<2;c++)for(let k=0;k<active.length;k++){pos=next(g,pos,alive);g.players[pos].hole.push(g.deck.pop());}
    g.sbSeat=active.length===2?g.button:next(g,g.button,alive);g.bbSeat=next(g,g.sbSeat,alive);
    pay(g,g.sbSeat,g.bb/2);pay(g,g.bbSeat,g.bb);g.players[g.sbSeat].action='Малый блайнд';g.players[g.bbSeat].action='Большой блайнд';
    g.turn=next(g,g.bbSeat,canAct);event(g,'deal');advance(g,g.bbSeat);
  }
  function legal(g,i){
    if(g.phase==='between')return {next:i===g.turn};
    if(g.phase==='finished'||i!==g.turn||!canAct(g.players[i]))return {};
    const p=g.players[i],call=Math.max(0,g.currentBet-p.bet),max=p.stack+p.bet;
    const reopened=p.acted===null||g.currentBet-p.acted>=g.minRaise;
    const rival=g.players.some((q,j)=>j!==i&&canAct(q));
    return {fold:true,check:call===0,call:Math.min(call,p.stack),toCall:call,min:g.currentBet+g.minRaise,max,raise:reopened&&rival&&max>g.currentBet,allIn:max<=g.currentBet||(reopened&&rival)};
  }
  function settle(g,showdown){
    // Несколько уровней взносов образуют независимые банки; единственный взнос возвращается.
    const levels=[...new Set(g.players.map(p=>p.total).filter(Boolean))].sort((a,b)=>a-b),wins=Array(g.players.length).fill(0),pots=[];let previous=0;
    const hands=g.players.map(p=>live(p)&&showdown?evaluate([...p.hole,...g.board]):null);
    for(const level of levels){
      const contributors=g.players.map((p,i)=>p.total>=level?i:-1).filter(i=>i>=0),amount=(level-previous)*contributors.length;previous=level;
      if(contributors.length===1){wins[contributors[0]]+=amount;pots.push({amount,winners:[contributors[0]],refund:true});continue;}
      const eligible=contributors.filter(i=>live(g.players[i]));
      if(!eligible.length)throw Error('Банк без участника');
      let winners=[eligible[0]];if(showdown)for(const i of eligible.slice(1)){const c=compare(hands[i].score,hands[winners[0]].score);if(c>0)winners=[i];else if(c===0)winners.push(i);}
      winners.sort((a,b)=>((a-g.button-1+g.players.length)%g.players.length)-((b-g.button-1+g.players.length)%g.players.length));
      const share=Math.floor(amount/winners.length);winners.forEach((i,k)=>wins[i]+=share+(k<amount%winners.length?1:0));pots.push({amount,winners,refund:false});
    }
    g.result={pots,wins,hands:hands.map(h=>h?{label:h.label,cards:h.cards}:null),showdown,total:g.players.reduce((s,p)=>s+p.total,0)};
    g.players.forEach((p,i)=>{p.stack+=wins[i];p.bet=0;p.total=0;if(p.stack===0)p.out=true;});
    g.reveal=showdown;g.phase='between';g.turn=next(g,g.button,p=>!p.out);event(g,'result');
    if(g.players.filter(p=>!p.out).length===1){g.phase='finished';g.winner=g.players.findIndex(p=>!p.out);g.turn=-1;}
  }
  function advance(g,after){
    if(g.players.filter(live).length===1){settle(g,false);return;}
    const actors=g.players.filter(canAct);
    const need=p=>canAct(p)&&(p.bet<g.currentBet||p.acted===null);
    // Если единственному игроку с фишками уже нечего уравнивать, торговля закончена.
    if(actors.length>1||actors.length===1&&actors[0].bet<g.currentBet){const t=next(g,after,need);if(t>=0){g.turn=t;return;}}
    if(g.phase==='river'){settle(g,true);return;}
    g.deck.pop();const count=g.phase==='preflop'?3:1;for(let k=0;k<count;k++)g.board.push(g.deck.pop());
    g.phase=g.phase==='preflop'?'flop':g.phase==='flop'?'turn':'river';g.currentBet=0;g.minRaise=g.bb;
    g.players.forEach(p=>{p.bet=0;p.acted=null;p.action=p.folded?'Пас':p.stack===0?'Ва-банк':'';});event(g,'street');
    if(actors.length<2){advance(g,g.button);return;}
    g.turn=next(g,g.button,canAct);
  }
  function action(g,i,a){
    if(!a||typeof a!=='object'||!Number.isInteger(i)||i<0||i>=g.players.length)throw Error('Неверный ход');
    const l=legal(g,i),p=g.players[i];
    if(a.type==='next'&&l.next){deal(g);return true;}
    if(!l.fold)throw Error('Сейчас ход другого игрока');
    let amount=0,type=a.type;
    if(type==='allin'){if(!l.allIn)throw Error('Повышение не открыто');if(l.max<=g.currentBet)type='call';else{type='raise';a={type:'raise',to:l.max};}}
    if(type==='fold'){p.folded=true;p.action='Пас';}
    else if(type==='check'){if(!l.check)throw Error('Нужно уравнять ставку');p.action='Чек';}
    else if(type==='call'){if(!l.toCall)throw Error('Ставки нет: можно сделать чек');amount=pay(g,i,l.call);p.action=p.stack===0?'Ва-банк':'Уравнял';}
    else if(type==='raise'){
      if(!l.raise||!Number.isSafeInteger(a.to)||a.to<=g.currentBet||a.to>l.max||(a.to<l.min&&a.to!==l.max))throw Error('Недопустимое повышение');
      const delta=a.to-g.currentBet;amount=pay(g,i,a.to-p.bet);if(delta>=g.minRaise)g.minRaise=delta;g.currentBet=a.to;p.action=p.stack===0?'Ва-банк':'Повысил';
    }else throw Error('Неизвестное действие');
    p.acted=g.currentBet;event(g,type,i,amount);advance(g,i);assert(g);return true;
  }
  function view(g,me){
    if(!Number.isInteger(me)||me<0||me>=g.players.length)throw Error('Нет места за столом');
    return {me,hand:g.hand,button:g.button,sbSeat:g.sbSeat,bbSeat:g.bbSeat,bb:g.bb,phase:g.phase,turn:g.turn,board:g.board.slice(),currentBet:g.currentBet,pot:g.players.reduce((s,p)=>s+p.total,0),version:g.version,winner:g.winner,
      players:g.players.map((p,i)=>({stack:p.stack,out:p.out,folded:p.folded,bet:p.bet,total:p.total,action:p.action,hole:i===me||g.reveal&&!p.folded?p.hole.slice():p.hole.map(()=>null)})),
      result:g.result?JSON.parse(JSON.stringify(g.result)):null,legal:legal(g,me),events:g.events.map(e=>({...e}))};
  }
  function assert(g){
    const n=g.players.reduce((s,p)=>s+p.stack+p.total,0);if(n!==g.players.length*1500)throw Error('Нарушена сумма фишек');
    for(const p of g.players)if(!Number.isSafeInteger(p.stack)||p.stack<0||p.total<0||p.bet<0||p.bet>p.total)throw Error('Неверная ставка');
    const cards=[...g.board,...g.players.flatMap(p=>p.hole)];if(new Set(cards).size!==cards.length)throw Error('Повтор карты');return true;
  }
  const api={create,action,view,legal,evaluate,compare,rank,suit,assert,LABELS};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ПокерПравила=api;
})(typeof window==='object'?window:globalThis);
