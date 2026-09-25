'use strict';
(function(){
  const П=window.КатанПравила,Б=window.КатанБот,$=id=>document.getElementById(id);
  const KEY='catan-match-v1',PREF='catan-settings',HIST='catan-history';
  const ресурсы=['Дерево','Глина','Шерсть','Зерно','Руда'];
  const названия={road:'Дорога',settlement:'Поселение',city:'Город',development:'Развитие',knight:'Рыцарь',roads:'Строительство дорог',plenty:'Изобилие',monopoly:'Монополия',vp:'Победное очко'};
  const описания={knight:'Переместите разбойника и заберите случайный ресурс у соседа.',roads:'Постройте две дороги бесплатно.',plenty:'Возьмите два ресурса из банка.',monopoly:'Заберите у соперников все ресурсы выбранного вида.',vp:'Скрытое победное очко. Учитывается автоматически в ваш ход.'};
  let g=null,record=null,v=null,online=false,network=null,mode=null,timer=null,busy=false,lastResult='',dialogKind='',prefs={n:4,level:'обычный',sound:true};
  let lastSerial=null,audio=null,selected=null,presentationTimer=null,presenting=false,boardFilter='all';
  let refreshTrade=null;
  let autoRoll=null,autoRollTimer=null,autoRollSent='';
  const autoRollKey=()=>`${online?network?.код:record?.id}:${network?.сыграноПартий||0}:${v?.round}:${v?.turn}:${v?.serial}`;
  const canAutoRoll=()=>v?.phase==='roll'&&v.turn===v.me&&!v.dev.length&&!busy&&!presenting&&document.visibilityState==='visible'&&$('экран-игры').classList.contains('экран--виден')&&!$('кат-диалог').open;
  function stopAutoRoll(){clearInterval(autoRollTimer);autoRollTimer=null;autoRoll=null;}
  function syncAutoRoll(){
    if(!canAutoRoll()||autoRollKey()===autoRollSent){stopAutoRoll();return;}
    const key=autoRollKey();
    if(autoRoll?.key!==key){stopAutoRoll();autoRoll={key,deadline:Date.now()+3000};autoRollTimer=setInterval(tickAutoRoll,100);}
    tickAutoRoll();
  }
  function tickAutoRoll(){
    if(!canAutoRoll()||autoRoll?.key!==autoRollKey()){stopAutoRoll();return;}
    const left=Math.max(0,Math.ceil((autoRoll.deadline-Date.now())/1000));
    if(left){$('кат-главное').textContent=`Кубики · ${left} с`;$('кат-подсказка').textContent=`Автобросок через ${left} с. Можно бросить раньше.`;return;}
    autoRollSent=autoRoll.key;stopAutoRoll();act({type:'roll'});
  }
  document.addEventListener('visibilitychange',()=>{stopAutoRoll();if(document.visibilityState==='visible')syncAutoRoll();});
  const viewDefaults={terrain:'balanced',probability:true,labels:false,motion:true,pace:2800};
  let display={...viewDefaults};
  try{const p=JSON.parse(localStorage.getItem('catan-display-v1'));if(p){for(const key of ['probability','labels','motion'])if(typeof p[key]==='boolean')display[key]=p[key];if(['soft','balanced','bright'].includes(p.terrain))display.terrain=p.terrain;if([2800,4500,6500].includes(p.pace))display.pace=p.pace;}}catch(_){}
  const motion=()=>display.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  function applyDisplay(){
    const root=$('экран-игры');root.dataset.terrain=display.terrain;root.classList.toggle('без-вероятностей',!display.probability);root.classList.toggle('названия-ресурсов',display.labels);root.classList.toggle('без-анимации',!motion());
    const filter=mode?'all':boardFilter,last=v?.log.findLast(e=>e.type==='roll');
    $('кат-поле').querySelectorAll('.кат-гекс').forEach(e=>{const hex=Number(e.dataset.hex),h=v.hexes[hex];const match=filter==='all'||filter==='roll'&&h.number===П.сумма(last?.dice||[])&&hex!==v.robber||filter==='mine'&&П.Г.hexes[hex].vertices.some(id=>v.buildings[id]?.owner===v.me)||String(h.resource)===filter;e.classList.toggle('кат-приглушён',!match);});
    $('кат-фильтр').textContent=boardFilter==='all'?'Вид поля':`Фильтр: ${({roll:'бросок',mine:'мои земли'})[boardFilter]||ресурсы[+boardFilter]}`;
  }
  function displaySettings(){
    const body=modal('Настройки поля','display');
    function choices(title,values,current,change){body.append(el('h3',title));const row=el('div',undefined,'кат-выбор-настроек');values.forEach(([value,label])=>{const b=button(label,()=>{change(value);localStorage.setItem('catan-display-v1',JSON.stringify(display));render();displaySettings();});b.setAttribute('aria-pressed',String(value===current));row.append(b);});body.append(row);}
    choices('Яркость ландшафта',[['soft','Приглушённый'],['balanced','Средний'],['bright','Яркий']],display.terrain,x=>display.terrain=x);
    if(v&&$('экран-игры').classList.contains('экран--виден')){choices('Выделить на поле',[['all','Все земли'],...ресурсы.map((r,i)=>[String(i),r]),['roll','Последний бросок'],['mine','Мои земли']],boardFilter,x=>boardFilter=x);body.append(el('p','Фильтр приглушает остальные земли. При выборе места строительства или разбойника виден весь остров.','кат-тихо'));}
    for(const [key,label]of [['probability','Вероятности на жетонах'],['labels','Названия ресурсов на поле'],['motion','Анимация броска'],['sound','Звук']]){const row=el('label',undefined,'кат-настройка-флажок'),input=el('input');input.type='checkbox';input.checked=key==='sound'?prefs.sound:display[key];input.onchange=()=>{if(key==='sound'){prefs.sound=input.checked;save();}else{display[key]=input.checked;localStorage.setItem('catan-display-v1',JSON.stringify(display));}render();};row.append(input,el('span',label));body.append(row);}
    choices('Темп ботов в одиночной игре',[[2800,'Обычный'],[4500,'Спокойный'],[6500,'Медленный']],display.pace,x=>display.pace=x);
    body.append(button('Готово',close,'кнопка кнопка--главная'));
  }
  function clearPresentation(){clearTimeout(presentationTimer);presentationTimer=null;presenting=false;$('кат-бросок').hidden=true;}
  function restoreBuilds(){const root=$('кат-стройки');if(root.parentElement!==$('кат-стройки-хранилище'))$('кат-стройки-хранилище').append(root);}
  function selectPlace(action){
    if(busy||presenting)return;
    if(!mode&&v.phase==='main'&&v.turn===v.me){
      const body=modal(названия[action.type]);body.append(el('p',action.type==='city'?'Улучшить это поселение до города?':'Построить здесь '+(action.type==='road'?'дорогу?':'поселение?')),el('p','Стоимость: '+resourceText(П.ЦЕНЫ[action.type])));
      body.append(button('Построить '+(action.type==='city'?'город':action.type==='road'?'дорогу':'поселение'),async()=>{if(await act(action))close();},'кнопка кнопка--главная'),button('Отмена',close));return;
    }
    selected=action;render();
  }
  function statIcon(kind){
    const paths={resources:'M7 3h12v16H7z M4 6H2v16h12v-2 M10 7h6 M10 10h6 M10 13h4',development:'M5 2h14v20H5z M12 6l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 9.5l3.5-.5z',knights:'M6 21h13l-1-5 1-5-4-8-5-1 1 4-6 6 4 2 4-3-3 6-4 1z',road:'M3 17l15-9 3 4-15 9z M5 16l3 4 M10 13l3 4 M15 10l3 4',settlement:'M3 11l9-9 9 9 M5 9v13h14V9 M10 22v-7h4v7',city:'M2 22V9h4V4h5v5h4V2h5v20z M6 13v3 M11 13v3 M16 7v3 M16 14v3'};
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');path.setAttribute('d',paths[kind]);svg.append(path);return svg;
  }
  function showBuilds(){const body=modal('Что построим?','build');body.append(el('p','Выберите постройку. Затем укажите подсвеченное место на острове.'),$('кат-стройки'));}
  function showRoll(event){
    clearPresentation();presenting=true;const root=$('кат-бросок');root.hidden=false;root.replaceChildren();
    const who=el('b',event.player===v.me?'Вы бросаете кубики':name(event.player)+' бросает кубики'),dice=el('div',undefined,'кат-бросок-кубики'),result=el('strong',String(П.сумма(event.dice))),detail=el('p',logText(event));
    dice.append(...event.dice.map((value,i)=>{
      const space=el('div',undefined,'кат-кубик-пространство'),cube=el('div',undefined,'кат-кубик-3d');cube.dataset.value=value;cube.setAttribute('aria-label',`Кубик: ${value}`);
      const other=[1,2,3,4,5,6].filter(n=>n!==value&&n!==7-value),right=other[0],top=other.find(n=>n!==right&&n!==7-right);
      [value,7-value,right,7-right,top,7-top].forEach((n,face)=>{const side=die(n);side.classList.add('кат-грань','грань-'+face);side.setAttribute('aria-hidden','true');cube.append(side);});space.append(cube);
      if(motion())cube.animate([{transform:`translate3d(${i?110:-110}px,-110px,60px) rotateX(600deg) rotateY(${i?-520:520}deg) rotateZ(${i?140:-140}deg)`},{transform:'translate3d(0,12px,0) rotateX(40deg) rotateY(-30deg) rotateZ(12deg)',offset:.65},{transform:'translate3d(0,-12px,0) rotateX(-20deg) rotateY(15deg) rotateZ(-6deg)',offset:.83},{transform:'rotateX(-12deg) rotateY(-18deg) rotateZ(0deg)'}],{duration:1250,easing:'cubic-bezier(.2,.65,.4,1)'});
      return space;
    }));root.append(who,dice,result,detail);
    presentationTimer=setTimeout(()=>{clearPresentation();render();},2800);
  }
  let artReady=false;
  Promise.all(['земли-v4','окружение-v4','фигуры-v4','карты-v4','ресурсы-v2'].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=`img/катан/${file}.webp`;}))).catch(()=>{$('кат-ошибка').textContent='Часть графики не загрузилась. Проверьте соединение и обновите страницу.';}).finally(()=>{artReady=true;render();});
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const button=(text,action,cls='кнопка')=>{const e=el('button',text,cls);e.type='button';e.onclick=action;return e;};
  const icons={back:'<path d="m15 4-8 8 8 8"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',robot:'<rect x="3" y="6" width="18" height="15" rx="4"/><path d="M12 6V2M1 11v6M23 11v6M9 16h6"/><circle cx="8" cy="11" r="1"/><circle cx="16" cy="11" r="1"/>',person:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',book:'<path d="M12 5v16M3 3c4-1 6 0 9 2 3-2 5-3 9-2v16c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>'};
  function icon(kind){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.innerHTML=icons[kind];return svg;}
  function profile(){
    $('кат-имя').textContent=window.Телеграм?.имяИгрока?.()||'Вы';
    const avatar=$('кат-аватар'),photo=window.Телеграм?.фотоИгрока?.()||'';
    if(avatar.dataset.photo===photo)return;avatar.dataset.photo=photo;avatar.replaceChildren();
    if(photo){const img=new Image();img.alt='';img.onload=()=>{if(avatar.dataset.photo===photo)avatar.replaceChildren(img);};img.src=photo;}
  }
  const name=i=>i===v?.me?'Вы':v?.names?.[i]||`Бот ${i}`;
  const picture=(i,cls='кат-рисунок')=>{const e=el('span',undefined,cls);e.style.setProperty('--столбец',i%3);e.style.setProperty('--ряд',Math.floor(i/3));e.setAttribute('aria-hidden','true');return e;};
  function cardPicture(i){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image'),clip=document.createElementNS(ns,'clipPath'),rect=document.createElementNS(ns,'rect'),x=[153,594,1039][i%3],y=i<3?21:518,id='кат-карта-обрезка-'+i;svg.setAttribute('viewBox',`${x} ${y} 347 474`);svg.setAttribute('aria-hidden','true');svg.setAttribute('class','кат-ресурс-карта');clip.id=id;for(const [k,value]of Object.entries({x,y,width:347,height:474,rx:22}))rect.setAttribute(k,value);clip.append(rect);image.setAttribute('href','img/катан/карты-v4.webp');image.setAttribute('width','1536');image.setAttribute('height','1024');image.setAttribute('clip-path',`url(#${id})`);svg.append(clip,image);return svg;}
  const die=n=>{const e=el('span',undefined,'кат-кубик');e.setAttribute('aria-label',`Кубик: ${n}`);for(const cell of [[5],[1,9],[1,5,9],[1,3,7,9],[1,3,5,7,9],[1,3,4,6,7,9]][n-1]){const dot=el('i');dot.style.gridArea=`${Math.ceil(cell/3)} / ${(cell-1)%3+1}`;e.append(dot);}return e;};
  const resourceText=a=>a.flatMap((n,i)=>n?[`${ресурсы[i]} × ${n}`]:[]).join(', ');
  try{const p=JSON.parse(localStorage.getItem(PREF));if(p&&[3,4].includes(p.n)&&['лёгкий','обычный','сложный'].includes(p.level))prefs=p;}catch(_){}
  prefs.options=П.настройки(prefs.options);
  prefs.targetPoints=[10,12,15].includes(prefs.targetPoints)?prefs.targetPoints:10;
  let optionsReturn='кат-настройки';
  window.КатанНастройкиСтола=()=>({...prefs.options});
  function tableOptions(root){
    root.replaceChildren(el('small','ПРАВИЛА ВАШЕГО ОСТРОВА'),el('h2','Как будем играть?'));
    for(const [key,title,description]of [['friendlyRobber','Дружелюбный разбойник','Не блокирует земли игроков с 2 очками и не крадёт у них ресурсы.'],['easyStart','Мягкий старт','Семёрки перебрасываются в первые два хода каждого игрока.']]){
      const row=el('label',undefined,'кат-правило'),input=el('input'),text=el('span');input.type='checkbox';input.checked=prefs.options[key];input.onchange=()=>{prefs.options[key]=input.checked;save();document.querySelectorAll('.кат-правила-стола').forEach(tableOptions);};text.append(el('b',title),el('small',description));row.append(text,input);root.append(row);
    }
    const harborRow=el('label',undefined,'кат-правило'),harborText=el('span'),harbors=el('select');harbors.setAttribute('aria-label','Гавани');harborText.append(el('b','Гавани'),el('small','Закреплённые — классическая схема. Случайные — типы гаваней перемешиваются перед партией.'));
    for(const [value,title]of [['fixed','Закреплённые'],['random','Случайные']]){const option=el('option',title);option.value=value;harbors.append(option);}harbors.value=prefs.options.harbors;harbors.onchange=()=>{prefs.options.harbors=harbors.value;save();document.querySelectorAll('.кат-правила-стола').forEach(tableOptions);};harborRow.append(harborText,harbors);root.append(harborRow);
    const label=el('label',undefined,'кат-правило'),text=el('span'),time=el('select');time.setAttribute('aria-label','Время на ход');text.append(el('b','Время на ход'),el('small','По истечении времени ход завершается; обязательные действия выполняются автоматически.'));
    for(const [value,title]of [[0,'Без таймера'],[60,'1 минута'],[120,'2 минуты'],[180,'3 минуты']]){const o=el('option',title);o.value=value;time.append(o);}time.value=prefs.options.turnSeconds;time.onchange=()=>{prefs.options.turnSeconds=Number(time.value);save();document.querySelectorAll('.кат-правила-стола').forEach(tableOptions);};label.append(text,time);root.append(label,button('Вид поля и анимации',displaySettings,'кат-ссылка'));
  }
  let loadError='';
  try{const r=JSON.parse(localStorage.getItem(KEY));if(r){g=window.КатанПамять.восстановить(r);record=r;}}catch(_){loadError='Сохранение повреждено. Начните новую партию.';}
  function save(){try{localStorage.setItem(PREF,JSON.stringify(prefs));if(record&&!online)localStorage.setItem(KEY,JSON.stringify(record));}catch(_){$('кат-ошибка').textContent='Не удалось сохранить партию в этом браузере.';}}
  function screen(id){
    clearTimeout(timer);timer=null;if(id!=='экран-игры'){clearPresentation();stopAutoRoll();}if(id==='экран-меню')id='экран-лобби';
    document.querySelectorAll('.экран').forEach(e=>e.classList.toggle('экран--виден',e.id===id));
    $('кат-продолжить').classList.toggle('скрыт',!g||g.phase==='finished');
    window.Телеграм?.показатьСтрелку(back);лист?.освежитьКнопкуНастроек(id);
    if(id==='экран-лобби')profile();
  }
  function close(){ refreshTrade=null;restoreBuilds();$('кат-диалог').close();dialogKind='';if(!online)render();else syncAutoRoll(); }
  function closeAction(){if(dialogKind!=='result')close();}
  function modal(title,kind=''){stopAutoRoll();refreshTrade=null;restoreBuilds();dialogKind=kind;if(!online){clearTimeout(timer);timer=null;}$('кат-диалог-заголовок').textContent=title;const body=$('кат-диалог-тело');body.replaceChildren();if(!$('кат-диалог').open)$('кат-диалог').showModal();return body;}
  function back(){
    if($('кат-диалог').open){close();return;}
    if($('кат-доп-настройки').classList.contains('экран--виден')){settings();screen(optionsReturn);return;}
    if(document.querySelector('.кат-карта.увеличена')){zoom(false);return;}
    if(лист.открыт()){лист.закрыть();return;}
    if($('экран-комнаты').classList.contains('экран--виден')){$('кнопка-комната-отмена').click();return;}
    if(online&&$('экран-игры').classList.contains('экран--виден')){
      if(v?.phase!=='finished'&&лист.спроситьЗавершить())return;
      window.Сеть.покинутьПартию();online=false;
    }
    if($('экран-лобби').classList.contains('экран--виден'))location.href='index.html';
    else screen('экран-лобби');
  }
  function zoom(on){const map=document.querySelector('.кат-карта');map.classList.toggle('увеличена',on);$('кат-масштаб').textContent=on?'Готово ↙':'Увеличить ↗';if(on)requestAnimationFrame(()=>{const w=$('кат-окно-карты');w.scrollLeft=(w.scrollWidth-w.clientWidth)/2;w.scrollTop=(w.scrollHeight-w.clientHeight)/2;});}
  function fresh(){
    clearPresentation();selected=null;online=false;network=null;mode=null;lastResult='';busy=false;lastSerial=null;
    const seed=crypto.getRandomValues(new Uint32Array(1))[0]||1;
    record={version:1,rules:3,id:crypto.randomUUID(),seed,n:prefs.n,level:prefs.level,options:{...prefs.options,targetPoints:prefs.targetPoints},actions:[]};g=П.создать(record.n,seed,false,record.rules,record.options);record.clock=window.КатанЧасы.обновить({},g);save();screen('экран-игры');render();
  }
  function local(player,action){if(action.type==='undo'&&window.КатанЧасы.остаток(record.clock)<=0)throw Error('Время хода истекло');П.действие(g,player,action);record.clock=window.КатанЧасы.обновить(record.clock||{},g);record.actions.push({player,action});save();}
  async function act(action){
    if(busy||presenting)return false;stopAutoRoll();busy=true;$('кат-ошибка').textContent='';let ok=false;
    try{
      if(online){const reply=await window.Сеть.отправитьХод(action.type==='surrender'?{действие:'сдаться'}:{действие:'катан',move:action});if(!reply?.принято)throw Error(reply?.причина||'Нет связи. Повторите ход.');}
      else local(0,action);
      mode=null;selected=null;zoom(false);ok=true;
    }catch(e){$('кат-ошибка').textContent=e.message;if($('кат-диалог').open){let error=$('кат-диалог-ошибка');if(!error){error=el('p');error.id='кат-диалог-ошибка';error.setAttribute('role','alert');$('кат-диалог-тело').append(error);}error.textContent=e.message;error.scrollIntoView({block:'nearest'});}}
    finally{busy=false;render();}
    return ok;
  }
  function bot(){
    if(online||!g||g.phase==='finished'||busy||presenting||$('кат-диалог').open)return;
    let who=-1,action=null;
    for(let i=1;i<g.n;i++){
      const view=П.вид(g,i);
      if(g.phase==='discard'&&g.discard[i]){who=i;action=Б.ход(view,record.level);break;}
      const trade=Б.обмен(view);if(trade){who=i;action=trade;break;}
    }
    if(who<0&&П.кто(g)>0){who=П.кто(g);action=Б.ход(П.вид(g,who),record.level);}
    if(!action)return;
    timer=setTimeout(()=>{try{local(who,action);render();}catch(e){$('кат-ошибка').textContent='Ошибка хода бота: '+e.message;}},display.pace);
  }
  const phaseText={setupSettlement:'Поставьте поселение на подсвеченное перекрестье',setupRoad:'Проложите дорогу от нового поселения',roll:'Бросьте кубики, чтобы получить ресурсы',main:'Стройте, обменивайтесь или завершите ход',discard:'Сбросьте половину ресурсов',robber:'Выберите другой гекс для разбойника',steal:'Выберите, у кого забрать ресурс',freeRoad:'Проложите бесплатную дорогу',finished:'Партия завершена'};
  function feedback(){
    const first=lastSerial===null;if(lastSerial===v.serial)return;const previous=lastSerial;lastSerial=v.serial;if(first)return;
    const event=v.log.at(-1);if(!event)return;
    const roll=v.log.filter(e=>e.id>previous&&e.type==='roll').at(-1);if(roll)showRoll(roll);
    if(motion()){
      const target=Number.isInteger(event.vertex)?$(`кат-поле`).querySelector(`[data-vertex="${event.vertex}"]`):Number.isInteger(event.edge)?$(`кат-поле`).querySelector(`[data-edge="${event.edge}"]`):null;
      target?.animate([{opacity:.15},{opacity:1,offset:.5},{opacity:.5,offset:.7},{opacity:1}],{duration:1200});
    }
    if(prefs.sound&&navigator.userActivation?.hasBeenActive&&['roll','road','settlement','city'].includes(event.type))try{
      audio||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;
      osc.type='triangle';osc.frequency.setValueAtTime(event.type==='roll'?280:440,t);osc.frequency.exponentialRampToValueAtTime(140,t+.1);gain.gain.setValueAtTime(.025,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.13);
    }catch(_){}
  }
  function render(){
    clearTimeout(timer);timer=null;if(!online&&g)v=П.вид(g,0);
    if(!v||!$('экран-игры').classList.contains('экран--виден'))return;
    if(dialogKind==='trade'&&$('кат-диалог').open)refreshTrade?.();
    document.querySelector('.кат-карта').classList.toggle('загрузка',!artReady);
    const mine=v.phase==='discard'?v.discard[v.me]>0:v.turn===v.me,active=v.phase!=='finished';
    $('экран-игры').classList.toggle('расстановка',v.phase.startsWith('setup'));
    feedback();
    const forced={setupSettlement:'settlement',setupRoad:'road',freeRoad:'road',robber:'robber'}[v.phase];
    if(forced)mode=mine?forced:null;else if(v.phase!=='main'||!mine||!['road','settlement','city'].includes(mode))mode=null;
    $('кат-раунд').textContent=(v.phase.startsWith('setup')?`Расстановка ${v.setupRound||1}/2`:`Ход ${v.round}`)+` · до ${v.options.targetPoints||10}`;
    $('кат-игроки').replaceChildren(...v.players.map((p,i)=>{
      const card=button('',()=>playerInfo(i),`кат-игрок цвет-${i}`);card.style.gridArea=['self','northwest','northeast','southwest'][(i-v.me+v.players.length)%v.players.length];card.classList.toggle('ходит',active&&(v.phase==='discard'?v.discard[i]>0:i===v.turn));
      const title=el('b',name(i));title.title=name(i);
      const avatar=el('span',undefined,'кат-аватар кат-портрет');avatar.style.backgroundPosition=[ '100% 100%','0% 0%','100% 0%','0% 100%' ][i%4];avatar.setAttribute('aria-hidden','true');
      if(i===v.me&&window.Телеграм?.фотоИгрока?.()){const photo=new Image();photo.alt='';photo.src=window.Телеграм.фотоИгрока();avatar.append(photo);}
      const stats=el('span',undefined,'кат-показатели');
      const values=[['resources',p.cards,'Ресурсы в руке'],['development',p.devCount,'Карты развития в руке'],['knights',p.knights,'Сыгранные рыцари'],['road',p.pieces.road,'Построенные дороги'],['settlement',p.pieces.settlement,'Поселения на поле'],['city',p.pieces.city,'Города на поле']];
      for(const [kind,count,label]of values){const stat=el('span',undefined,'кат-показатель');stat.dataset.stat=kind;stat.title=`${label}: ${count}`;stat.setAttribute('aria-label',stat.title);stat.append(statIcon(kind),el('span',count));stats.append(stat);}
      const acting=active&&(v.phase==='discard'?v.discard[i]>0:i===v.actor),status=el('span',undefined,'кат-игрок-статус');
      if(acting){if(i!==v.me){const clock=el('span',undefined,'кат-думает-часы');clock.setAttribute('role','img');clock.setAttribute('aria-label','Соперник думает');status.append(clock);}status.append(document.createTextNode(i===v.me?'● Ваш ход':v.phase==='discard'?'Сбрасывает карты':'Думает…'));}
      card.append(avatar,title,el('strong',p.score),stats,status);card.setAttribute('aria-label',`${name(i)}: ${p.score} очков. ${values.map(([,count,label])=>label+': '+count).join(', ')}${acting?', '+(i===v.me?'Ваш ход':'Соперник думает'):''}`);return card;
    }));
    if(selected&&(selected.type!==mode||(selected.type==='robber'?!v.legal.robber.includes(selected.hex):!(selected.type==='road'?v.legal.road:v.legal[selected.type]||[]).includes(selected.edge??selected.vertex))))selected=null;
    window.КатанПоле.рисовать($('кат-поле'),v,busy||presenting?null:mode||((mine&&v.phase==='main')?'direct':null),selectPlace);
    if(selected){const target=$('кат-поле').querySelector(selected.type==='robber'?`[data-hex="${selected.hex}"]`:selected.type==='road'?`[data-edge="${selected.edge}"][role=button]`:`[data-vertex="${selected.vertex}"][role=button]`);target?.classList.add('кат-выбрано');}
    applyDisplay();
    $('кат-кубики').replaceChildren(...(v.dice?v.dice.map(die):[el('span','Кубики ещё не брошены')]));
    if(v.dice){$('кат-кубики').append(el('b',' = '+П.сумма(v.dice)));const roll=v.log.findLast(e=>e.type==='roll');$('кат-кубики').append(el('small',roll?`Бросок: ${name(roll.player)}`:'Последний бросок'));}
    $('кат-награды').textContent=`Дорога: ${v.roadOwner<0?'от 5 участков':name(v.roadOwner)} · Армия: ${v.armyOwner<0?'от 3 рыцарей':name(v.armyOwner)}`;
    $('кат-шаги').hidden=!v.phase.startsWith('setup');$('кат-шаги').children[0].classList.toggle('текущий',v.phase==='setupSettlement');$('кат-шаги').children[2].classList.toggle('текущий',v.phase==='setupRoad');
    $('кат-действие-текст').textContent=!active?'Партия завершена':busy?'Отправляем ход…':presenting?(v.turn===v.me?'Вы бросаете кубики':`Бросает ${name(v.turn)}`):mine&&v.phase.startsWith('setup')?'Ваш ход · расстановка':mine?'Ваш ход':`Ходит ${name(v.actor)}`;
    $('кат-подсказка').textContent=mode&&v.phase==='main'?`Выберите место: ${названия[mode].toLowerCase()}`:mine&&v.phase==='setupSettlement'?`Поселение бесплатно · круг ${v.setupRound}/2${v.setupRound===2?' · получите соседние ресурсы':''}`:mine?phaseText[v.phase]:({setupSettlement:'Выбирает место для поселения',setupRoad:'Прокладывает дорогу',roll:'Готовится бросить кубики',main:'Строит и обменивается',discard:'Ждём сброса ресурсов',robber:'Перемещает разбойника',steal:'Выбирает соперника',freeRoad:'Прокладывает бесплатную дорогу',finished:'Партия завершена'}[v.phase]);
    $('кат-ход').classList.toggle('ваш',mine&&active);$('кат-ход').classList.toggle('ожидание',!mine&&active);
    if(selected?.type==='robber'){
      const h=v.hexes[selected.hex],owners=[...new Set(П.Г.hexes[h.id].vertices.map(id=>v.buildings[id]?.owner).filter(i=>i!==undefined))],victims=owners.filter(i=>i!==v.me&&v.players[i].cards>0&&(!v.options.friendlyRobber||v.players[i].score>2));
      $('кат-подсказка').textContent=`${ресурсы[h.resource]||'Пустыня'}${h.number?' · '+h.number:''}. `+(victims.length?'Ресурс у: '+victims.map(name).join(', '):'Забрать ресурс не у кого.')+(owners.includes(v.me)?' Блокирует и ваши постройки.':'');
    }
    const last=v.log.at(-1);$('кат-событие').textContent=last?logText(last):v.startRolls?.length?`${name(v.start)} начинает: наибольший бросок кубиков`:'Выберите первое поселение';
    $('кат-ресурсы').replaceChildren(...v.hand.map((n,i)=>{const e=button('',()=>resourceInfo(i),'кат-ресурс');e.append(cardPicture(i),el('strong',n),el('small',ресурсы[i]));e.title=`${ресурсы[i]}: у вас ${n}, в банке ${v.bank[i]}`;e.setAttribute('aria-label',e.title);return e;}));
    $('кат-стройки').replaceChildren(...Object.entries(П.ЦЕНЫ).map(([type,cost])=>{
      const enabled=type==='development'?v.legal.development:v.legal[type].length>0;
      const b=button(названия[type],()=>{
        if(!enabled){const body=modal(названия[type]);body.append(el('p','Стоимость: '+resourceText(cost)));const missing=cost.map((n,r)=>Math.max(0,n-v.hand[r]));body.append(el('p',П.сумма(missing)?'Не хватает: '+resourceText(missing):type==='development'?'Колода развития закончилась.':'Нет доступного места или закончились фигуры этого типа.'));body.append(button('Понятно',close));return;}
        if(type==='development')act({type});else{mode=mode===type?null:type;selected=null;close();render();}
      },enabled?'':'кат-нехватка');
      b.disabled=busy||presenting||!mine||v.phase!=='main';b.setAttribute('aria-pressed',String(mode===type));
      b.dataset.build=type;
      const icon=el('span',undefined,'кат-строение');icon.setAttribute('aria-hidden','true');b.prepend(icon);
      const price=el('span',undefined,'кат-цена');cost.forEach((n,r)=>{for(let j=0;j<n;j++)price.append(picture(r,'кат-рисунок кат-мини'));});b.append(price);
      const missing=cost.map((n,r)=>Math.max(0,n-v.hand[r]));b.title=resourceText(cost)+(П.сумма(missing)?' · Не хватает: '+resourceText(missing):'');return b;
    }));
    $('кат-отмена').classList.toggle('скрыт',!selected&&(!mode||v.phase!=='main'));
    $('кат-вернуть').classList.toggle('скрыт',!active||!$('кат-отмена').classList.contains('скрыт'));
    $('кат-вернуть').disabled=busy||presenting||!v.legal.undo;
    $('кат-вернуть').title=v.legal.undo?'Вернуть последнее действие: '+(v.legal.undoAction==='bank'?'обмен с банком':названия[v.legal.undoAction]):'Доступно после своего строительства или обмена с банком, до следующего действия';
    $('кат-главное').textContent=!active?'Результаты':presenting?'Смотрим бросок…':selected?({road:'Проложить дорогу',settlement:'Поставить поселение',city:'Построить город',robber:'Переместить разбойника'}[selected.type]):v.phase==='roll'?'Бросить кубики':v.phase==='discard'&&mine?`Сбросить ${v.discard[v.me]}`:v.phase==='steal'&&mine?'Выбрать соперника':v.phase==='main'&&mine?'Завершить ход':mine?'Выберите место':'Ждём хода';
    $('кат-главное').disabled=busy||presenting||active&&(!mine||!selected&&!['roll','main','discard','steal'].includes(v.phase));
    syncAutoRoll();
    $('кат-строить').disabled=busy||presenting||!mine||v.phase!=='main';
    $('кат-обмен').disabled=busy||presenting;$('кат-карты').disabled=busy||presenting;$('кат-карты').textContent=`Развитие${v.dev.length?' · '+v.dev.length:''}`;
    offer();
    if(!active){saveResult();const key=`${network?.код||record?.id}:${network?.сыграноПартий||0}`;if(lastResult!==key){lastResult=key;results();}}
    bot();
  }
  function chooseResources(title,limit,count,done){
    const body=modal(title,'resources'),values=[0,0,0,0,0],summary=el('p'),confirm=button('Подтвердить',async()=>{if(await done(values.slice()))closeAction();},'кнопка кнопка--главная');
    const update=()=>{const total=П.сумма(values);summary.textContent=`Выбрано ${total} из ${count}`;confirm.disabled=total!==count||busy;};body.append(summary);
    ресурсы.forEach((text,i)=>{const row=el('label',undefined,'кат-строка-выбора'),input=el('input');input.type='number';input.min=0;input.max=limit[i];input.step=1;input.value=0;input.inputMode='numeric';input.setAttribute('aria-label',text);input.oninput=()=>{values[i]=Math.max(0,Math.min(limit[i],Math.floor(Number(input.value)||0)));input.value=values[i];update();};row.append(picture(i),el('span',`${text} · ${limit[i]} доступно`),input);body.append(row);});body.append(confirm);update();
  }
  function playerInfo(i){
    const p=v.players[i],body=modal(name(i),'player');
    body.append(el('p',`Победные очки: ${p.score} из ${v.options.targetPoints||10}`),el('p',`В руке: ${p.cards} ресурсов · ${p.devCount} карт развития`));
    for(const [title,value]of [['Поселения',p.pieces.settlement],['Города',p.pieces.city*2],['Самая длинная дорога',v.roadOwner===i?2:0],['Самая большая армия',v.armyOwner===i?2:0]]){const row=el('div',undefined,'кат-счёт-строка');row.append(el('span',title),el('b',String(value)));body.append(row);}
    if(p.victoryCards!==null){const row=el('div',undefined,'кат-счёт-строка');row.append(el('span',i===v.me?'Ваши скрытые победные очки':'Карты победных очков'),el('b',String(p.victoryCards)));body.append(row);}else body.append(el('p','Победные карты соперника скрыты и не входят в его видимый счёт до конца партии.'));
    body.append(el('p',`Непрерывная дорога: ${p.roadLength} · Разыграно рыцарей: ${p.knights}`),el('p',`Фигуры в запасе: ${15-p.pieces.road} дорог, ${5-p.pieces.settlement} поселений, ${4-p.pieces.city} городов.`));
  }
  function resourceInfo(r){
    const body=modal(ресурсы[r],'resource'),art=picture(r,'кат-рисунок кат-ресурс-крупно');body.append(art,el('p',`У вас: ${v.hand[r]} · В банке: ${v.bank[r]} · Ваш курс: ${v.rates[r]} к 1`));
    const lands=v.hexes.filter(h=>h.resource===r);body.append(el('p',`Ресурс приносят ${['леса','глиняные холмы','пастбища','поля','горы'][r]} при броске: ${lands.map(h=>h.number).sort((a,b)=>a-b).join(', ')}.`),el('p','Поселение у такого гекса получает 1 карту, город — 2. Это работает на бросках всех игроков. Гекс с разбойником не производит ресурсов.'));
  }
  function development(){
    const body=modal('Карты развития','development');
    const purchase=button('Купить карту развития',async()=>{if(await act({type:'development'}))development();},'кнопка кнопка--главная');purchase.disabled=!v.legal.development||busy||presenting;
    body.append(el('p',`Цена: 1 шерсть + 1 зерно + 1 руда. В колоде: ${v.deckCount}. Купленная карта скрыта от соперников.`),purchase);
    if(purchase.disabled)body.append(el('small',!v.deckCount?'Колода развития закончилась.':v.phase!=='main'||v.turn!==v.me?'Покупка доступна в ваш ход после броска кубиков.':'Не хватает ресурсов: '+resourceText(П.ЦЕНЫ.development.map((n,i)=>Math.max(0,n-v.hand[i]))),'кат-тихо'));
    body.append(el('h3','Ваша рука'));
    if(!v.dev.length){body.append(el('p','Пока нет карт. Рыцарь, дороги, изобилие, монополия или победное очко — какая карта придёт вам?'));return;}
    for(const [index,type]of ['knight','roads','plenty','monopoly','vp'].entries()){
      const cards=v.dev.filter(d=>d.type===type);if(!cards.length)continue;
      const b=button('',()=>{
        if(type==='plenty')chooseResources('Изобилие',v.bank,Math.min(2,П.сумма(v.bank)),resources=>act({type:'dev',card:type,resources}));
        else if(type==='monopoly'){const target=modal('Выберите ресурс','monopoly');ресурсы.forEach((r,i)=>target.append(button(r,async()=>{if(await act({type:'dev',card:type,resource:i}))closeAction();})));}
        else act({type:'dev',card:type}).then(ok=>{if(ok)closeAction();});
      },'кат-карта-развития');
      const text=el('div');text.append(el('b',`${названия[type]} × ${cards.length}`),el('small',описания[type]));
      if(type!=='vp'&&!v.legal.dev.includes(type))text.append(el('small',cards.every(d=>d.bought===v.round)?'Доступна со следующего хода':'Сейчас разыграть нельзя'));
      b.append(picture(index),text);b.disabled=!v.legal.dev.includes(type)||busy;body.append(b);
    }
  }
  function trade(bankChoice){
    const body=modal('Торговля','trade');
    if(v.phase!=='main'){body.append(el('p','Торговля доступна после броска кубиков и завершения действий разбойника. Можно обмениваться с банком, через порты и с игроками.'));return;}
    const turn=v.turn,bankPanel=el('div',undefined,'кат-форма-обмена'),peoplePanel=el('div',undefined,'кат-форма-обмена');
    const validTurn=()=>{if(v.phase!=='main'||v.turn!==turn){$('кат-ошибка').textContent='Ход сменился. Откройте обмен заново.';close();return false;}return true;};
    const tabs=el('div',undefined,'кат-переключатель');
    function tab(bank){bankPanel.hidden=!bank;peoplePanel.hidden=bank;[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String((i===0)===bank)));}
    if(v.turn===v.me){
      tabs.append(button('Банк и порты',()=>tab(true)),button('С игроками',()=>tab(false)));body.append(tabs);
      bankPanel.append(el('p','Курс учитывает ваши порты. Выберите ресурс, который отдаёте, и тот, который нужен.'));
      let give=bankChoice?.give??v.hand.findIndex((n,r)=>n>=v.rates[r]),want=bankChoice?.want??-1;
      const giveRow=el('div',undefined,'кат-обмен-карты'),wantRow=el('div',undefined,'кат-обмен-карты'),summary=el('p',undefined,'кат-обмен-итог');summary.setAttribute('aria-live','polite');
      const exchange=button('Обменять',async()=>{if(validTurn()&&await act({type:'bank',give,want}))trade({give,want});},'кнопка кнопка--главная');
      function update(){
        [...giveRow.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(give===i)));[...wantRow.children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(want===i));b.disabled=i===give||!v.bank[i];});
        exchange.disabled=give<0||want<0||give===want||v.hand[give]<v.rates[give]||!v.bank[want]||busy;
        summary.textContent=give<0?'Пока не хватает ресурсов для обмена с банком. Попробуйте обмен с игроками.':want<0?'Выберите, какой ресурс получить.':`${ресурсы[give]} × ${v.rates[give]} → ${ресурсы[want]} × 1`+(v.hand[give]<v.rates[give]?' · Не хватает ресурсов':'');
      }
      ресурсы.forEach((r,i)=>{const a=button('',()=>{give=i;if(want===give)want=-1;update();},'кат-обмен-карта');a.dataset.bankGive=i;a.setAttribute('aria-label',`Отдать ${r}`);a.append(picture(i),el('b',r),el('strong',`${v.rates[i]} → 1`),el('small',`У вас ${v.hand[i]}`));a.disabled=v.hand[i]<v.rates[i];giveRow.append(a);
        const b=button('',()=>{want=i;update();},'кат-обмен-карта');b.dataset.bankWant=i;b.setAttribute('aria-label',`Получить ${r}`);b.append(picture(i),el('b',r),el('small',`В банке ${v.bank[i]}`));wantRow.append(b);});
      bankPanel.append(el('h3','Отдаю'),giveRow,el('h3','Получаю'),wantRow,summary,exchange);update();
    }
    body.append(bankPanel,peoplePanel);tab(v.turn===v.me);
    const inventory=el('div',undefined,'кат-торговля-запас'),stock=el('div',undefined,'кат-торговля-ресурсы');inventory.append(el('b','У вас на руках'),stock);
    const balances=ресурсы.map((r,i)=>{const item=el('span'),count=el('strong',v.hand[i]);item.dataset.resource=i;item.setAttribute('aria-label',`${r}: ${v.hand[i]}`);item.title=r;item.append(picture(i),count);stock.append(item);return count;});
    peoplePanel.append(inventory,el('p','Укажите ресурсы с обеих сторон. Обмен состоится только после согласия игрока.'));
    const target=el('select');target.setAttribute('aria-label','Кому предложить обмен');
    if(v.turn===v.me){const o=el('option','Всем игрокам');o.value=-1;target.append(o);}
    v.players.forEach((_,i)=>{if(i!==v.me&&(v.turn===v.me||i===v.turn)){const o=el('option',name(i));o.value=i;target.append(o);}});peoplePanel.append(target);
    const give=[0,0,0,0,0],want=[0,0,0,0,0];
    const confirm=button('Предложить обмен',async()=>{if(validTurn()&&await act({type:'offer',to:Number(target.value),give,want}))closeAction();},'кнопка кнопка--главная');
    const remaining=[],giveInputs=[];
    const update=()=>{
      confirm.disabled=busy||v.phase!=='main'||v.turn!==turn||!П.сумма(give)||!П.сумма(want)||give.some((n,i)=>n>v.hand[i]||n&&want[i]);
      balances.forEach((count,i)=>{count.textContent=v.hand[i];count.parentElement.setAttribute('aria-label',`${ресурсы[i]}: ${v.hand[i]}`);if(remaining[i]){remaining[i].textContent=give[i]>v.hand[i]?'Не хватает':`Останется ${v.hand[i]-give[i]}`;remaining[i].title=`У вас ${v.hand[i]}, отдаёте ${give[i]}`;}if(giveInputs[i])giveInputs[i].max=v.hand[i];});
    };refreshTrade=update;
    const head=el('div',undefined,'кат-обмен-строка кат-обмен-шапка');head.append(el('span','Ресурс'),el('span','Отдаю'),el('span','Получаю'));peoplePanel.append(head);
    ресурсы.forEach((r,i)=>{const row=el('div',undefined,'кат-обмен-строка'),label=el('span',undefined,'кат-обмен-ресурс'),text=el('span');remaining[i]=el('small',undefined,'кат-торговля-остаток');text.append(el('span',r),remaining[i]);label.append(picture(i),text);row.append(label);
      for(const [label,values,max]of [['Отдаю',give,v.hand[i]],['Получаю',want,19]]){const input=el('input');input.type='number';input.min=0;input.max=max;input.value=0;input.inputMode='numeric';input.setAttribute('aria-label',`${label}: ${r}`);if(values===give)giveInputs[i]=input;const minus=button('−',()=>{input.value=Number(input.value)-1;input.oninput();}),plus=button('+',()=>{input.value=Number(input.value)+1;input.oninput();});minus.setAttribute('aria-label',`Уменьшить ${label}: ${r}`);plus.setAttribute('aria-label',`Увеличить ${label}: ${r}`);input.oninput=()=>{const limit=values===give?v.hand[i]:19;values[i]=Math.max(0,Math.min(limit,Math.floor(Number(input.value)||0)));input.value=values[i];minus.disabled=values[i]===0;plus.disabled=values[i]===limit;update();};const stepper=el('div',undefined,'кат-счётчик');stepper.append(minus,input,plus);row.append(stepper);input.oninput();}peoplePanel.append(row);
    });peoplePanel.append(confirm);update();
  }
  function offer(){
    const root=$('кат-предложение'),o=v.offer;root.classList.toggle('скрыт',!o);root.replaceChildren();if(!o)return;
    root.append(button(o.from===v.me?'Ваш обмен · ждём ответа…':`Обмен: ${name(o.from)} → посмотреть`,()=>{
      const body=modal('Предложение обмена','offer');body.append(el('p',`${name(o.from)} отдаёт: ${resourceText(o.give)}.`),el('p',`Просит: ${resourceText(o.want)}.`));
      if(o.from!==v.me&&(o.to===-1||o.to===v.me)){const b=button('Принять',async()=>{if(await act({type:'accept',offer:o.id}))closeAction();},'кнопка кнопка--главная');b.disabled=busy||o.want.some((n,r)=>n>v.hand[r]);body.append(b);if(b.disabled)body.append(el('p','У вас не хватает ресурсов для этого обмена.'));}
      if(o.from===v.me||v.turn===v.me)body.append(button('Отменить предложение',async()=>{if(await act({type:'cancelOffer'}))closeAction();}));
      body.append(button('Закрыть',close));
    },'кат-ссылка'));
  }
  function logText(e){
    const n=name(e.player);
    if(e.type==='roll')return `${n}: выпало ${e.dice.join(' + ')}. `+(e.gains?e.gains.flatMap((a,i)=>П.сумма(a)?[`${name(i)} получает ${resourceText(a)}`]:[]).join('; ')||'Ресурсы не получены.':'Разбойник выходит на остров.');
    if(e.type==='bank')return `${n}: ${ресурсы[e.give]} × ${e.rate} → ${ресурсы[e.want]} × 1`;
    if(e.type==='trade')return `${n} и ${name(e.other)}: ${resourceText(e.give)} ↔ ${resourceText(e.want)}`;
    if(e.type==='steal')return `${n} забирает случайный ресурс у ${name(e.victim)}`;
    if(e.type==='dev')return `${n}: ${названия[e.card]}`;
    if(e.type==='discard')return `${n}: сброшено ${e.count} ресурсов`;
    if(e.type==='undo')return `${n}: отменено — ${e.action==='bank'?'обмен с банком':названия[e.action]||e.action}`;
    return `${n}: ${названия[e.type]||{end:'ход завершён',offer:'предложен обмен',robber:'разбойник перемещён'}[e.type]||e.type}`;
  }
  function journal(){const body=modal('Журнал ходов','log');if(!v?.log.length)body.append(el('p','Здесь появятся броски кубиков, постройки и обмены.'));else v.log.slice().reverse().forEach(e=>body.append(el('div',logText(e),'кат-журнал')));if(v?.startRolls?.length){body.append(el('h3','Кто начинает'));v.startRolls.forEach((rolls,i)=>body.append(el('p',`Бросок ${i+1}: `+rolls.map(r=>`${name(r.player)} — ${r.dice.join(' + ')} = ${П.сумма(r.dice)}`).join('; '))));body.append(el('p','Начинает: '+name(v.start)));}}
  function saveResult(){
    if(online||record.resultSaved)return;
    try{let history=JSON.parse(localStorage.getItem(HIST))||[];if(!Array.isArray(history))history=[];if(!history.some(x=>x.id===record.id))history.unshift({id:record.id,date:Date.now(),win:v.winner===0,scores:v.players.map(p=>p.score),level:record.level});localStorage.setItem(HIST,JSON.stringify(history.slice(0,30)));record.resultSaved=true;save();}catch(_){}
  }
  function results(){
    const body=modal(v.winner<0?'Партия завершена':v.winner===v.me?'Вы победили!':`Победитель: ${name(v.winner)}`,'result');
    if(v.surrendered>=0)body.append(el('p',`${name(v.surrendered)} завершили партию досрочно.`));else if(v.interrupted)body.append(el('p','Партия прервана без результата.'));
    [...v.players.entries()].sort((a,b)=>b[1].score-a[1].score).forEach(([i,p])=>{const row=el('div',undefined,'кат-итог');row.append(el('b',name(i)),el('strong',`${p.score} / ${v.options.targetPoints||10}`),el('small',`Поселения: ${p.pieces.settlement} · Города: ${p.pieces.city*2} очк.`),el('small',`Победные карты: ${p.victoryCards??0} · Дорога: ${v.roadOwner===i?2:0} · Армия: ${v.armyOwner===i?2:0}`));body.append(row);});
    body.append(button('Посмотреть остров',close));
    body.append(button(online&&network?.яХочуЕщё?'Ждём согласия игроков…':'Сыграть ещё',async()=>{if(online){const r=await window.Сеть.отправитьХод({действие:'ещё'});if(!r?.принято)$('кат-ошибка').textContent=r?.причина||'Нет связи';}else{close();fresh();}},'кнопка кнопка--главная'));
    body.append(button('В меню',()=>{close();if(online)window.Сеть.покинутьПартию();online=false;screen('экран-лобби');}));
  }
  function history(){const body=modal('Мои партии');let items=[];try{items=JSON.parse(localStorage.getItem(HIST))||[];}catch(_){}if(!Array.isArray(items))items=[];if(!items.length)body.append(el('p','Здесь появятся завершённые партии с ботами.'));items.forEach(x=>body.append(el('div',`${new Date(x.date).toLocaleDateString('ru-RU')} · ${x.win?'Победа':'Поражение'} · ${x.scores.join(' : ')}`,'кат-журнал')));}
  function rules(){
    const body=modal('Как играть в Катан');
    for(const [title,text]of [
      ['Остров','В новых партиях используем сбалансированную раскладку: рядом не бывает связной группы из трёх одинаковых ресурсов. Это дополнительное правило нашего приложения. Красные жетоны 6 и 8 не соседствуют.'],
      ['Отменить ход','Кнопка возвращает только последнее своё строительство или обмен с банком. При начальной расстановке можно вернуть поселение, пока не поставлена дорога. Отмена возвращает ресурсы и очки, но не время на ход. Она недоступна после чужого действия, броска кубиков, кражи, покупки или розыгрыша карты развития, предложения или принятия обмена с игроком, завершения хода и победы. Повторно отменять предыдущее действие нельзя.'],
      ['Цель — 10 очков','Поселение даёт 1 очко, город — 2. Самая длинная дорога и самая большая армия дают по 2 очка. Карты победных очков хранятся скрыто. Победа проверяется только в ваш ход.'],
      ['Расстановка','По очереди поставьте поселение и дорогу. Второй круг идёт в обратном порядке. За второе поселение получите по ресурсу с соседних земель. Между поселениями всегда должно оставаться свободное перекрестье.'],
      ['Ресурсы и строительство','Бросьте два кубика. Совпавшие номера приносят ресурсы всем соседним поселениям: один за поселение, два за город. Нажмите нужную постройку и выберите подсвеченное место. Можно строить и обмениваться несколько раз за ход.'],
      ['Обмен','С игроками обменивайтесь по договорённости. Банк меняет 4 одинаковых ресурса на 1. Поселение или город в порту улучшает курс до 3:1 либо 2:1 для указанного ресурса.'],
      ['Семёрка и разбойник','Производства нет. Все, у кого больше 7 ресурсов, сбрасывают половину с округлением вниз. Активный игрок перемещает разбойника на другой гекс и забирает случайную карту ресурса у одного из соседей. Гекс с разбойником не производит ресурсы.'],
      ['Карты развития','Можно сыграть одну карту за ход, даже до броска кубиков, но нельзя играть купленную в этом ходу. Исключение — победные очки: они учитываются сразу. Рыцарь перемещает разбойника, остальные эффекты указаны на картах.'],
      ['Дорога и армия','Дорога должна содержать не менее 5 непрерывных участков. Чужое поселение разрывает её. Армия — минимум 3 разыгранных рыцаря. При равенстве награда остаётся у текущего владельца.'],
      ['Управление','Кнопка «Увеличить» открывает крупный остров. Его можно двигать пальцем. Все доступные места строительства подсвечены. Журнал показывает, кому достались ресурсы после броска.']]){body.append(el('h3',title),el('p',text));}
    const link=el('a','Официальные правила CATAN');link.href='https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf';link.target='_blank';link.rel='noopener';body.append(link);
  }
  function settings(){
    document.querySelectorAll('.кат-правила-стола').forEach(tableOptions);
    function radios(id,values,current,change){$(id).replaceChildren(...values.map(([value,label])=>{const b=button(label,()=>{change(value);save();settings();});b.setAttribute('role','radio');b.setAttribute('aria-checked',String(value===current));return b;}));}
    radios('кат-число',[[3,'Трое'],[4,'Четверо']],prefs.n,n=>prefs.n=n);
    radios('кат-цель',[[10,'10 ПО'],[12,'12 ПО'],[15,'15 ПО']],prefs.targetPoints,n=>prefs.targetPoints=n);
    document.querySelector('.кат-настройки-факты').textContent=`До ${prefs.targetPoints} победных очков`;
    radios('кат-уровень',[['лёгкий','Лёгкий'],['обычный','Обычный'],['сложный','Сложный']],prefs.level,x=>prefs.level=x);
    radios('кат-число-онлайн',[[3,'Трое'],[4,'Четверо']],Number($('катан-мест-друга').value),n=>$('катан-мест-друга').value=n);
    for(const [id,n,bots]of [['кат-стол-ботов',prefs.n,true],['кат-стол-онлайн',Number($('катан-мест-друга').value),false]]){
      const root=$(id);root.style.setProperty('--мест',n);root.replaceChildren();
      const preview=document.createElementNS('http://www.w3.org/2000/svg','svg');preview.classList.add('кат-превью');preview.setAttribute('aria-hidden','true');
      window.КатанПоле.рисовать(preview,П.вид(П.создать(n,1729),0),null,null,id+'-');root.append(preview);
      for(let i=0;i<n;i++){
        const b=button('',()=>{
          if(bots){const body=modal('Сила соперников','seat');body.append(el('p','Выбранный уровень применяется ко всем ботам за столом.'));
            for(const [value,label]of [['лёгкий','Лёгкий · знакомство с игрой'],['обычный','Обычный · сбалансированная игра'],['сложный','Сложный · опытные соперники']]){const choice=button(label,()=>{prefs.level=value;save();settings();close();},value===prefs.level?'кнопка кнопка--главная':'кнопка');body.append(choice);}
          }else{const body=modal('Свободное место','seat');body.append(el('p','После создания стола пригласите друга по коду или посадите сюда бота.'),button('Создать стол',()=>{close();$('кнопка-создать-игру').click();},'кнопка кнопка--главная'));}
        },`рассадка__место рассадка__место--${i===0?'я':bots?'бот':'свободно'} цвет-${i}`);
        b.style.setProperty('--номер-места',n/2+i);b.setAttribute('aria-label',i===0?'Ваше место':bots?`Бот ${i}: ${prefs.level}. Изменить сложность`:`Место ${i+1}: пригласить игрока`);
        const avatar=el('span',undefined,'кат-место-значок');avatar.append(i===0?icon('person'):bots?icon('robot'):el('span','+'));b.append(avatar,el('span',i===0?'Вы':bots?`Бот ${i}`:'Пригласить','рассадка__имя'));b.disabled=i===0;root.append(b);
      }
    }
  }
  const лист=window.ЛистЕщё.подключить({экраныСЛистом:['экран-лобби','экран-игры','кат-настройки','экран-друга','экран-комнаты'],двери:{вМеню:{действие:back},завершить:{видна:()=>$('экран-игры').classList.contains('экран--виден')&&v?.phase!=='finished',текст:()=>'Вы завершите партию досрочно. Вам будет записано поражение.',действие:()=>act({type:'surrender'})},какИграть:{действие:rules},рекорды:{действие:history},звук:{состояние:()=>prefs.sound?'вкл':'выкл',действие:()=>{prefs.sound=!prefs.sound;save();}}}});
  document.querySelectorAll('[data-back]').forEach(b=>{b.replaceChildren(icon('back'));b.onclick=back;});document.querySelectorAll('[data-menu]').forEach(b=>{b.replaceChildren(icon('more'));b.onclick=()=>лист.открыть();});$('кат-правила').prepend(icon('book'));
  $('кат-закрыть').onclick=close;$('кат-диалог').addEventListener('cancel',e=>{e.preventDefault();close();});
  $('кат-боты').onclick=()=>{settings();screen('кат-настройки');};
  $('кат-начать').onclick=()=>{if(g&&g.phase!=='finished')$('кат-новая').showModal();else fresh();};
  $('кат-новая-да').onclick=()=>{$('кат-новая').close();fresh();};
  $('кат-продолжить').onclick=()=>{online=false;lastResult='';screen('экран-игры');render();};
  $('кат-строить').onclick=showBuilds;
  $('кат-главное').onclick=()=>{if(selected){act(selected);return;}if(v.phase==='finished')results();else if(v.phase==='discard')chooseResources('Сбросьте ресурсы',v.hand,v.discard[v.me],resources=>act({type:'discard',resources}));else if(v.phase==='steal'){const body=modal('У кого забрать ресурс?');v.victims.forEach(i=>body.append(button(`${name(i)} · ${v.players[i].cards} ресурсов`,async()=>{if(await act({type:'steal',victim:i}))closeAction();})));}else act({type:v.phase==='roll'?'roll':'end'});};
  $('кат-масштаб').onclick=()=>zoom(!document.querySelector('.кат-карта').classList.contains('увеличена'));
  $('кат-фильтр').onclick=displaySettings;
  const settingsEntry=button('Настройки поля',()=>{лист.закрыть();displaySettings();},'лист-ещё__строка');$('кнопка-лист-игры-правила').after(settingsEntry);
  $('кат-отмена').onclick=()=>{selected=null;mode=null;render();};$('кат-вернуть').onclick=()=>act({type:'undo',serial:v.serial});$('кат-обмен').onclick=()=>trade();$('кат-карты').onclick=development;$('кат-журнал-кнопка').onclick=journal;$('кат-правила').onclick=rules;
  $('кат-профиль').onclick=()=>window.ЭкранПрофиля.открыть('катан');window.addEventListener('load',profile);
  $('кнопка-комната-назад').onclick=()=>$('кнопка-комната-отмена').click();$('кнопка-комната-ещё').onclick=()=>лист.открыть();
  $('экран-лобби').insertBefore($('кнопка-вернуться-в-игру'),$('кат-продолжить'));
  document.querySelector('nav.нижние-вкладки').innerHTML=window.НижниеВкладки.вкладкиНабора('лобби-деберц').map(x=>window.НижниеВкладки.кнопкаHTML({...x,id:x.id.replace('деберц','катан')})).join('');
  $('катан-вкладка-игры').onclick=()=>location.href='index.html';$('катан-вкладка-рейтинг').onclick=()=>window.ЭкранРейтинга.открыть('катан');$('катан-вкладка-профиль').onclick=()=>$('кат-профиль').click();
  const oldScores=window.ЭкранРейтинга.открытьСчёт;window.ЭкранРейтинга.открытьСчёт=game=>game==='катан'?history():oldScores(game);
  window.ИграПоСети={
    начать(){clearTimeout(timer);online=true;},
    показатьВид(state){if(!state.катан||network?.код===state.код&&state.версия<network.версия)return;const changed=!network||network.код!==state.код||network.сыграноПартий!==state.сыграноПартий;if(changed){clearPresentation();selected=null;lastSerial=null;mode=null;lastResult='';close();}online=true;network=state;v=state.катан;serverDeadline=Number.isFinite(v.secondsLeft)?Date.now()+v.secondsLeft*1000:null;screen('экран-игры');render();},
    показатьСвязь(text){$('строка-связи').textContent=text||'';$('строка-связи').classList.toggle('скрыт',!text);},экран:screen,вМеню(){online=false;network=null;screen('экран-лобби');},идёт:()=>online
  };
  let serverDeadline=null;
  const extra=el('section',undefined,'экран');extra.id='кат-доп-настройки';
  const extraHeader=el('header',undefined,'кат-настройки-шапка');extraHeader.append(el('small','КАТАН · НАСТРОЙКИ'),el('h1','Правила стола'));
  extra.append(extraHeader,el('div',undefined,'кат-правила-стола'),button('Готово',back,'кнопка кнопка--главная'));
  $('кат-настройки').after(extra);
  const targetPanel=el('div',undefined,'кат-панель'),targets=el('div',undefined,'кат-переключатель');targets.id='кат-цель';targets.setAttribute('role','radiogroup');targets.setAttribute('aria-label','Победные очки');targetPanel.append(el('h2','Победные очки'),targets);document.querySelector('.кат-настройки-факты').before(targetPanel);
  for(const id of ['кат-настройки','экран-друга']){$(id).querySelector(id==='кат-настройки'?'#кат-начать':'#кнопка-создать-игру').before(button('Дополнительные настройки',()=>{optionsReturn=id;tableOptions(extra.querySelector('.кат-правила-стола'));screen(extra.id);},'кнопка кат-доп-настройки-кнопка'));}
  const clockLabel=el('span',undefined,'кат-таймер');clockLabel.setAttribute('aria-label','Осталось времени на ход');$('кат-действие-текст').after(clockLabel);
  setInterval(()=>{
    if(!v||!$('экран-игры').classList.contains('экран--виден'))return;
    const Ч=window.КатанЧасы;if(!online&&g)record.clock=Ч.обновить(record.clock||{},g);
    const left=online?(serverDeadline===null?Infinity:Math.max(0,(serverDeadline-Date.now())/1000)):Ч.остаток(record.clock);
    clockLabel.hidden=!Number.isFinite(left)||v.phase==='finished';clockLabel.textContent=Number.isFinite(left)?`${Math.floor(Math.ceil(left)/60)}:${String(Math.ceil(left)%60).padStart(2,'0')}`:'';clockLabel.classList.toggle('истекает',left<=15);
    if(!online&&left<=0&&!busy&&!presenting&&g.phase!=='finished'){
      const who=П.кто(g),view=П.вид(g,who),action=view.phase==='main'?{type:'end'}:Б.ход(view,record.level);
      if(action){if($('кат-диалог').open)close();selected=null;local(who,action);if(Ч.остаток(record.clock)<=0)record.clock.deadline=Date.now()+3000;save();render();}
    }
  },250);
  settings();screen('экран-лобби');if(loadError){const p=el('p',loadError,'кат-тихо');$('кат-продолжить').after(p);}
})();
