'use strict';
(() => {
  const tag=document.currentScript,game=tag?.dataset.game;
  const catalogue=document.querySelector('.витрина__плитки');
  const key='catalog-popularity-v1';
  function endpoint(path){
    const query=new URLSearchParams(location.search);
    return (window.Сеть?.адрес?.()||query.get('сервер')||query.get('server')||location.origin).replace(/\/$/,'')+path;
  }
  function sort(rows){
    if(!catalogue||!Array.isArray(rows))return;
    const cards=[...catalogue.children],rank=new Map(rows.map((r,i)=>[r.game,i]));
    cards.sort((a,b)=>(rank.get(a.dataset.игра)??99)-(rank.get(b.dataset.игра)??99));
    cards.forEach(card=>catalogue.append(card));
  }
  if(catalogue){
    try{sort(JSON.parse(localStorage.getItem(key)));}catch{}
    fetch(endpoint('/статистика'),{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(data=>{
      if(!Array.isArray(data?.популярность))return;
      try{localStorage.setItem(key,JSON.stringify(data.популярность));}catch{}
      // Apply to the next visit when the user has already started browsing.
      if(!catalogue.matches(':hover')&&!catalogue.contains(document.activeElement)&&!document.querySelector('#экран-витрины')?.scrollTop)sort(data.популярность);
    }).catch(()=>{});
  }
  if(!game)return;
  const session=crypto.randomUUID();let seq=0,pending=0,previous=performance.now(),wasPlaying=false,entered=false,wasEntered=false,lastSend=0,telegramActive=true;
  function send(){
    const initData=window.Telegram?.WebApp?.initData;
    if(!initData)return;
    const seconds=Math.min(60,pending);pending=0;lastSend=performance.now();
    fetch(endpoint('/пульс'),{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
      body:JSON.stringify({initData,игра:game,каталог:{сеанс:session,номер:seq++,секунд:seconds}})}).catch(()=>{});
    return true;
  }
  function tick(){
    const now=performance.now(),elapsed=(now-previous)/1000;
    const visible=document.visibilityState==='visible'&&telegramActive;
    const playing=visible&&!!document.querySelector('#экран-игры.экран--виден,#экран-шахмат.экран--виден,#экран-шашек.экран--виден');
    const inGame=visible&&(playing||!!document.querySelector('#экран-лобби.экран--виден'));
    if(wasPlaying&&elapsed<=5)pending+=elapsed;
    previous=now;wasPlaying=playing;
    if(inGame&&!entered){entered=send()===true;}
    else if(pending>=30||wasEntered&&!inGame&&pending>0||inGame&&now-lastSend>=60000)send();
    wasEntered=inGame;
  }
  document.addEventListener('visibilitychange',tick);
  window.addEventListener('pagehide',()=>{tick();if(pending>0)send();});
  window.Telegram?.WebApp?.onEvent?.('activated',()=>{telegramActive=true;tick();});
  window.Telegram?.WebApp?.onEvent?.('deactivated',()=>{telegramActive=false;tick();});
  setInterval(tick,1000);tick();
})();
