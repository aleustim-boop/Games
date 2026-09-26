'use strict';
const fs=require('node:fs'),path=require('node:path');
const GAMES=['косынка','сапёр','нарды','шахматы','дурак','шашки','домино','морской-бой','катан','монополия','деберц','2048','судоку','японский-кроссворд'];
const DAY=86400000;
function создать(file=null){
  let days={},actors={},timer;
  const sessions=new Map();
  if(file){try{const data=JSON.parse(fs.readFileSync(file,'utf8'));days=data.days||{};actors=data.actors||{};}catch{}}
  function prune(now){
    for(const day of Object.keys(days))if(Number(day)<Math.floor(now/DAY)-29)delete days[day];
    for(const id of Object.keys(actors))if(now-actors[id].last>DAY)delete actors[id];
    for(const [key,value]of sessions)if(now-value.last>3600000)sessions.delete(key);
  }
  function дописать(){
    clearTimeout(timer);timer=null;if(!file)return;
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file+'.пишем',JSON.stringify({days,actors}));fs.renameSync(file+'.пишем',file);
  }
  function учесть(user,game,event,now=Date.now()){
    if(!/^\d{1,20}$/.test(String(user))||!GAMES.includes(game)||!event||
      !/^[a-zA-Z0-9-]{8,64}$/.test(event.сеанс)||!Number.isSafeInteger(event.номер)||event.номер<0||
      !Number.isFinite(event.секунд)||event.секунд<0||event.секунд>60)return false;
    prune(now);
    const key=user+':'+game+':'+event.сеанс,prev=sessions.get(key);
    if(prev&&event.номер<=prev.seq)return false;
    sessions.set(key,{seq:event.номер,last:now});
    const actor=actors[user]||(actors[user]={last:now,games:{}}),last=actor.games[game];
    const day=days[Math.floor(now/DAY)]||(days[Math.floor(now/DAY)]={});
    const count=day[game]||(day[game]={launches:0,seconds:0});
    if(last===undefined||now-last>=1800000)count.launches++;
    // At most one second per wall-clock second per person, across tabs/games.
    count.seconds+=Math.min(event.секунд,Math.max(0,(now-actor.last)/1000),60);
    actor.last=now;actor.games[game]=now;
    if(file&&!timer){timer=setTimeout(дописать,5000);timer.unref();}
    return true;
  }
  function сводка(now=Date.now()){
    prune(now);
    const rows=GAMES.map(game=>({game,launches:0,seconds:0}));
    for(const day of Object.values(days))for(const row of rows){row.launches+=day[row.game]?.launches||0;row.seconds+=day[row.game]?.seconds||0;}
    const launches=rows.reduce((n,r)=>n+r.launches,0)||1,seconds=rows.reduce((n,r)=>n+r.seconds,0)||1;
    for(const row of rows)row.score=.5*row.launches/launches+.5*row.seconds/seconds;
    return rows.sort((a,b)=>b.score-a.score||GAMES.indexOf(a.game)-GAMES.indexOf(b.game));
  }
  return {учесть,сводка,дописать};
}
module.exports={создать};
