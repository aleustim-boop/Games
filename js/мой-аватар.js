'use strict';
// Единый аватар владельца: фото Telegram, затем защищённый серверный резерв.
(function(){
 const T=window.Телеграм;if(!T)return;
 const direct=T.фотоИгрока.bind(T),selector='#лобби-профиль .аватар,#лобби-профиль .фото-лобби__аватар,#кат-аватар,#mono-profile .mono-portrait,#строка-меня .аватар,.строка-игрока--я .аватар,[data-my-avatar],.профиль-карточка__аватар,.рассадка__место--я > img';
 let resolved='',loaded='',loading='',fallbackTried=false,queued=false;
 T.фотоИгрока=()=>loaded||direct()||resolved;
 function paint(){
  if(!loaded)return;
  document.querySelectorAll(selector).forEach(e=>{
   if(e.dataset.tgAvatar===loaded&&(e.tagName==='IMG'||e.querySelector('img.тг-аватар-фото')))return;
   e.dataset.tgAvatar=loaded;e.classList.add('тг-аватар');
   if(e.tagName==='IMG'){e.src=loaded;return;}
   const photo=new Image();photo.src=loaded;photo.alt='';photo.className='тг-аватар-фото';photo.setAttribute('aria-hidden','true');e.replaceChildren(photo);
  });
 }
 async function fallback(){
  const initData=window.Telegram?.WebApp?.initData,base=window.Сеть?.адрес?.();
  if(fallbackTried||!initData||!base)return;fallbackTried=true;
  try{const response=await fetch(base.replace(/[/]$/,'')+'/мой-аватар',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData})});if(!response.ok)return;const data=await response.json();if(!data.ок||!(/^[0-9a-f]{24}$/).test(data.фото||''))return;resolved=base.replace(/[/]$/,'')+'/фото/'+data.фото;load(resolved);}catch(_){}
 }
 function load(url){
  if(!url){fallback();return;}if(url===loaded){paint();return;}if(url===loading)return;
  loading=url;const photo=new Image();photo.onload=()=>{loading='';loaded=url;paint();};photo.onerror=()=>{loading='';if(url!==resolved)fallback();};photo.src=url;
 }
 function refresh(){load(direct()||resolved);}
 function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;paint();});}
 new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('load',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});refresh();
 window.МойАватар={обновить:refresh};
})();
