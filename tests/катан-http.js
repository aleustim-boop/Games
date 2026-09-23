'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
process.env.ДАННЫЕ_ИГРЫ=path.join(os.tmpdir(),'catan-http-'+process.pid);
const server=require('../server/сервер').создатьСервер(),Б=require('../js/катан-бот');
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const req=async(p,body)=>{const r=await fetch(base+'/'+encodeURIComponent(p),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;};
  try{
    for(const n of [3,4]){
      const a=await req('создать',{игра:'катан',имя:'Анна',мест:n}),players=[{код:a.код,пропуск:a.пропуск}];
      for(let i=1;i<n;i++){const p=await req('войти',{код:a.код,имя:`Участник ${i}`});players.push({код:a.код,пропуск:p.пропуск});}
      const turn=(i,action)=>req('ход',{...players[i],...action});assert.equal((await turn(0,{действие:'начать'})).принято,true);
      let count=0;
      while(count++<2000){
        const states=await Promise.all(players.map(p=>req('состояние',p))),views=states.map(s=>(s.состояние||s).катан),v=views[0];
        assert(v);assert.equal(v.names[1],'Участник 1');
        for(const view of views){assert.equal(view.hand.length,5);assert(!('seed'in view));assert(!('deck'in view));assert(view.players.every(p=>!('resources'in p)&&!('dev'in p)));}
        if(v.phase==='finished')break;
        const who=v.actor,move=Б.ход(views[who],'сложный');
        if(!['discard','accept','offer'].includes(move.type))assert.equal((await turn((who+1)%n,{действие:'катан',move})).принято,false);
        const answer=await turn(who,{действие:'катан',move});assert.equal(answer.принято,true,JSON.stringify({answer,move,phase:v.phase}));
      }
      assert(count<2000,'Партия зависла');for(let i=0;i<n;i++)assert.equal((await turn(i,{действие:'ещё'})).принято,true);
      const again=await req('состояние',players[0]);assert.equal((again.состояние||again).катан.phase,'setupSettlement');
      assert.equal((await turn(1,{действие:'сдаться'})).принято,true);
      for(const p of players)await req('выйти',p);console.log(`Катан HTTP ${n}: полная партия, имена, приватность, очередь, реванш, сдача — OK (${count} действий)`);
    }
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
