'use strict';
// Единый аватар владельца: фото Telegram, затем защищённый серверный резерв.
(function(){
 const T=window.Телеграм;if(!T)return;
 const direct=T.фотоИгрока.bind(T),selector='#лобби-профиль .аватар,#лобби-профиль .фото-лобби__аватар,#кат-аватар,#mono-profile .mono-portrait,#строка-меня .аватар,.строка-игрока--я .аватар,[data-my-avatar],.профиль-карточка__аватар,.рассадка__место--я > img,.рассадка__место--я > .аватар';
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
 let состав=[];
 function игрок(e,person={}){
   if(person.этоБот){if(e.dataset.playerAvatar){e.replaceChildren();delete e.dataset.playerAvatar;delete e.dataset.playerPhoto;delete e.dataset.tgAvatar;e.classList.remove('тг-аватар');e.style.removeProperty('background-image');e.style.removeProperty('background-color');}delete e.dataset.myAvatar;return e;}
   if(person.этоЯ)e.dataset.myAvatar='';else delete e.dataset.myAvatar;
   const base=window.Сеть?.адрес?.()||location.origin,key=person.фото;
   const url=person.этоЯ?(T.фотоИгрока()||(/^[0-9a-f]{24}$/.test(key||'')?base.replace(/[/]$/,'')+'/фото/'+key:'')):(/^[0-9a-f]{24}$/.test(key||'')?base.replace(/[/]$/,'')+'/фото/'+key:'');
   e.classList.add('тг-аватар');e.style.backgroundImage='none';e.style.backgroundColor='#243536';
   if(e.dataset.playerPhoto===url&&e.dataset.playerAvatar==='yes')return e;
   e.dataset.playerAvatar='yes';e.dataset.playerPhoto=url;e.replaceChildren();
   const fallback=document.createElement('span');fallback.innerHTML='<svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true"><circle cx="20" cy="13" r="7" fill="currentColor"/><path d="M6 38v-5c0-16 28-16 28 0v5" fill="currentColor"/></svg>';fallback.setAttribute('aria-hidden','true');fallback.style.cssText='display:grid;place-items:center;width:100%;height:100%;font-size:24px;color:#c9d4d4';e.append(fallback);
   if(url){const photo=new Image();photo.alt='';photo.className='тг-аватар-фото';photo.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:inherit';photo.onload=()=>{if(e.dataset.playerPhoto===url)e.replaceChildren(photo);};photo.src=url;}
   return e;
 }
 function комната(){document.querySelectorAll('#комната-стол .рассадка__место').forEach(e=>{const seat=Number(e.style.getPropertyValue('--номер-места')),person=состав.find(p=>p.номер===seat),avatar=e.querySelector('.аватар');if(person&&avatar)игрок(avatar,person);else if(avatar?.dataset.playerAvatar)игрок(avatar,{этоБот:true});});}
 const observer=new MutationObserver(()=>комната());observer.observe(document.body,{childList:true,subtree:true});
 window.МойАватар={обновить:refresh,игрок,состав(state){состав=state?.аватары||[];комната();}};
})();
