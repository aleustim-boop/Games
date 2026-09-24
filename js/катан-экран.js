'use strict';
(function(){
  const П=window.КатанПравила,Б=window.КатанБот,$=id=>document.getElementById(id);
  const KEY='catan-match-v1',PREF='catan-settings',HIST='catan-history';
  const ресурсы=['Дерево','Глина','Шерсть','Зерно','Руда'];
  const названия={road:'Дорога',settlement:'Поселение',city:'Город',development:'Развитие',knight:'Рыцарь',roads:'Строительство дорог',plenty:'Изобилие',monopoly:'Монополия',vp:'Победное очко'};
  const описания={knight:'Переместите разбойника и заберите случайный ресурс у соседа.',roads:'Постройте две дороги бесплатно.',plenty:'Возьмите два ресурса из банка.',monopoly:'Заберите у соперников все ресурсы выбранного вида.',vp:'Скрытое победное очко. Учитывается автоматически в ваш ход.'};
  let g=null,record=null,v=null,online=false,network=null,mode=null,timer=null,busy=false,lastResult='',dialogKind='',prefs={n:4,level:'обычный',sound:true};
  let lastSerial=null,audio=null;
  let artReady=false;
  Promise.all(['земли-v2','ресурсы-v2'].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=`img/катан/${file}.webp`;}))).catch(()=>{$('кат-ошибка').textContent='Часть графики не загрузилась. Проверьте соединение и обновите страницу.';}).finally(()=>{artReady=true;render();});
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const button=(text,action,cls='кнопка')=>{const e=el('button',text,cls);e.type='button';e.onclick=action;return e;};
  const name=i=>i===v?.me?'Вы':v?.names?.[i]||`Бот ${i}`;
  const picture=(i,cls='кат-рисунок')=>{const e=el('span',undefined,cls);e.style.setProperty('--столбец',i%3);e.style.setProperty('--ряд',Math.floor(i/3));e.setAttribute('aria-hidden','true');return e;};
  const die=n=>{const e=el('span',undefined,'кат-кубик');e.setAttribute('aria-label',`Кубик: ${n}`);for(const cell of [[5],[1,9],[1,5,9],[1,3,7,9],[1,3,5,7,9],[1,3,4,6,7,9]][n-1]){const dot=el('i');dot.style.gridArea=`${Math.ceil(cell/3)} / ${(cell-1)%3+1}`;e.append(dot);}return e;};
  const resourceText=a=>a.flatMap((n,i)=>n?[`${ресурсы[i]} × ${n}`]:[]).join(', ');
  try{const p=JSON.parse(localStorage.getItem(PREF));if(p&&[3,4].includes(p.n)&&['лёгкий','обычный','сложный'].includes(p.level))prefs=p;}catch(_){}
  let loadError='';
  try{const r=JSON.parse(localStorage.getItem(KEY));if(r){g=window.КатанПамять.восстановить(r);record=r;}}catch(_){loadError='Сохранение повреждено. Начните новую партию.';}
  function save(){try{localStorage.setItem(PREF,JSON.stringify(prefs));if(record&&!online)localStorage.setItem(KEY,JSON.stringify(record));}catch(_){$('кат-ошибка').textContent='Не удалось сохранить партию в этом браузере.';}}
  function screen(id){
    clearTimeout(timer);timer=null;if(id==='экран-меню')id='экран-лобби';
    document.querySelectorAll('.экран').forEach(e=>e.classList.toggle('экран--виден',e.id===id));
    $('кат-продолжить').classList.toggle('скрыт',!g||g.phase==='finished');
    window.Телеграм?.показатьСтрелку(back);лист?.освежитьКнопкуНастроек(id);
  }
  function close(){ $('кат-диалог').close();dialogKind='';if(!online)render(); }
  function closeAction(){if(dialogKind!=='result')close();}
  function modal(title,kind=''){dialogKind=kind;if(!online){clearTimeout(timer);timer=null;}$('кат-диалог-заголовок').textContent=title;const body=$('кат-диалог-тело');body.replaceChildren();if(!$('кат-диалог').open)$('кат-диалог').showModal();return body;}
  function back(){
    if($('кат-диалог').open){close();return;}
    if(document.querySelector('.кат-карта.увеличена')){zoom(false);return;}
    if(лист.открыт()){лист.закрыть();return;}
    if(online&&$('экран-игры').classList.contains('экран--виден')){
      if(v?.phase!=='finished'&&лист.спроситьЗавершить())return;
      window.Сеть.покинутьПартию();online=false;
    }
    if($('экран-лобби').classList.contains('экран--виден'))location.href='index.html';
    else screen('экран-лобби');
  }
  function zoom(on){const map=document.querySelector('.кат-карта');map.classList.toggle('увеличена',on);$('кат-масштаб').textContent=on?'Готово ↙':'Увеличить ↗';if(on)requestAnimationFrame(()=>{const w=$('кат-окно-карты');w.scrollLeft=(w.scrollWidth-w.clientWidth)/2;w.scrollTop=(w.scrollHeight-w.clientHeight)/2;});}
  function fresh(){
    online=false;network=null;mode=null;lastResult='';busy=false;lastSerial=null;
    const seed=crypto.getRandomValues(new Uint32Array(1))[0]||1;
    record={version:1,rules:2,id:crypto.randomUUID(),seed,n:prefs.n,level:prefs.level,actions:[]};g=П.создать(record.n,seed,false,2);save();screen('экран-игры');render();
  }
  function local(player,action){П.действие(g,player,action);record.actions.push({player,action});save();}
  async function act(action){
    if(busy)return false;busy=true;$('кат-ошибка').textContent='';let ok=false;
    try{
      if(online){const reply=await window.Сеть.отправитьХод(action.type==='surrender'?{действие:'сдаться'}:{действие:'катан',move:action});if(!reply?.принято)throw Error(reply?.причина||'Нет связи. Повторите ход.');}
      else local(0,action);
      mode=null;zoom(false);ok=true;
    }catch(e){$('кат-ошибка').textContent=e.message;if($('кат-диалог').open){let error=$('кат-диалог-ошибка');if(!error){error=el('p');error.id='кат-диалог-ошибка';error.setAttribute('role','alert');$('кат-диалог-тело').append(error);}error.textContent=e.message;error.scrollIntoView({block:'nearest'});}}
    finally{busy=false;render();}
    return ok;
  }
  function bot(){
    if(online||!g||g.phase==='finished'||busy||$('кат-диалог').open)return;
    let who=-1,action=null;
    for(let i=1;i<g.n;i++){
      const view=П.вид(g,i);
      if(g.phase==='discard'&&g.discard[i]){who=i;action=Б.ход(view,record.level);break;}
      const trade=Б.обмен(view);if(trade){who=i;action=trade;break;}
    }
    if(who<0&&П.кто(g)>0){who=П.кто(g);action=Б.ход(П.вид(g,who),record.level);}
    if(!action)return;
    timer=setTimeout(()=>{try{local(who,action);render();}catch(e){$('кат-ошибка').textContent='Ошибка хода бота: '+e.message;}},950);
  }
  const phaseText={setupSettlement:'Поставьте поселение на подсвеченное перекрестье',setupRoad:'Проложите дорогу от нового поселения',roll:'Бросьте кубики, чтобы получить ресурсы',main:'Стройте, обменивайтесь или завершите ход',discard:'Сбросьте половину ресурсов',robber:'Выберите другой гекс для разбойника',steal:'Выберите, у кого забрать ресурс',freeRoad:'Проложите бесплатную дорогу',finished:'Победитель набрал 10 очков'};
  function feedback(){
    const first=lastSerial===null;if(lastSerial===v.serial)return;lastSerial=v.serial;if(first)return;
    const event=v.log.at(-1);if(!event)return;
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      if(event.type==='roll')document.querySelectorAll('.кат-кубик').forEach((e,i)=>e.animate([{transform:`rotate(${i?75:-75}deg) scale(.65)`,opacity:.4},{transform:'rotate(0deg) scale(1)',opacity:1}],{duration:380,easing:'ease-out'}));
      const target=Number.isInteger(event.vertex)?$(`кат-поле`).querySelector(`[data-vertex="${event.vertex}"]`):Number.isInteger(event.edge)?$(`кат-поле`).querySelector(`[data-edge="${event.edge}"]`):null;
      target?.animate([{opacity:.1},{opacity:1}],{duration:350});
    }
    if(prefs.sound&&navigator.userActivation?.hasBeenActive&&['roll','road','settlement','city'].includes(event.type))try{
      audio||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;
      osc.type='triangle';osc.frequency.setValueAtTime(event.type==='roll'?280:440,t);osc.frequency.exponentialRampToValueAtTime(140,t+.1);gain.gain.setValueAtTime(.025,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.13);
    }catch(_){}
  }
  function render(){
    clearTimeout(timer);timer=null;if(!online&&g)v=П.вид(g,0);
    if(!v||!$('экран-игры').classList.contains('экран--виден'))return;
    document.querySelector('.кат-карта').classList.toggle('загрузка',!artReady);
    const mine=v.phase==='discard'?v.discard[v.me]>0:v.turn===v.me,active=v.phase!=='finished';
    const forced={setupSettlement:'settlement',setupRoad:'road',freeRoad:'road',robber:'robber'}[v.phase];
    if(forced)mode=mine?forced:null;else if(v.phase!=='main'||!mine||!['road','settlement','city'].includes(mode))mode=null;
    $('кат-раунд').textContent=(v.phase.startsWith('setup')?`Расстановка ${v.setupRound||1}/2`:`Ход ${v.round}`)+' · до 10';
    $('кат-игроки').replaceChildren(...v.players.map((p,i)=>{
      const card=button('',()=>playerInfo(i),`кат-игрок цвет-${i}`);card.classList.toggle('ходит',active&&(v.phase==='discard'?v.discard[i]>0:i===v.turn));
      const title=el('b',name(i));title.title=name(i);
      const avatar=el('span',name(i).slice(0,1),'кат-аватар');avatar.setAttribute('aria-hidden','true');
      card.append(avatar,title,el('strong',p.score),el('small',`${p.cards} ресурсов · ${p.devCount} карт`));card.setAttribute('aria-label',`${name(i)}: ${p.score} очков, ${p.cards} ресурсов`);return card;
    }));
    window.КатанПоле.рисовать($('кат-поле'),v,busy?null:mode,act);
    $('кат-кубики').replaceChildren(...(v.dice?v.dice.map(die):[el('span','Кубики ещё не брошены')]));
    if(v.dice)$('кат-кубики').append(el('b',' = '+П.сумма(v.dice)));
    $('кат-награды').textContent=`Дорога: ${v.roadOwner<0?'от 5 участков':name(v.roadOwner)} · Армия: ${v.armyOwner<0?'от 3 рыцарей':name(v.armyOwner)}`;
    $('кат-действие-текст').textContent=!active?'Партия завершена':busy?'Отправляем ход…':mine?'Ваш ход':`Ходит ${name(v.actor)}`;
    $('кат-подсказка').textContent=mode&&v.phase==='main'?`Выберите место: ${названия[mode].toLowerCase()}`:mine&&v.phase==='setupSettlement'?`Поселение бесплатно · круг ${v.setupRound}/2${v.setupRound===2?' · получите соседние ресурсы':''}`:mine?phaseText[v.phase]:({setupSettlement:'Выбирает место для поселения',setupRoad:'Прокладывает дорогу',roll:'Готовится бросить кубики',main:'Строит и обменивается',discard:'Ждём сброса ресурсов',robber:'Перемещает разбойника',steal:'Выбирает соперника',freeRoad:'Прокладывает бесплатную дорогу',finished:'Партия завершена'}[v.phase]);
    $('кат-ход').classList.toggle('ваш',mine&&active);$('кат-ход').classList.toggle('ожидание',!mine&&active);
    const last=v.log.at(-1);$('кат-событие').textContent=last?logText(last):v.startRolls?.length?`${name(v.start)} начинает: наибольший бросок кубиков`:'Выберите первое поселение';
    $('кат-ресурсы').replaceChildren(...v.hand.map((n,i)=>{const e=button('',()=>resourceInfo(i),'кат-ресурс');e.append(picture(i),el('strong',n),el('small',ресурсы[i]));e.title=`${ресурсы[i]}: у вас ${n}, в банке ${v.bank[i]}`;e.setAttribute('aria-label',e.title);return e;}));
    $('кат-стройки').replaceChildren(...Object.entries(П.ЦЕНЫ).map(([type,cost])=>{
      const enabled=type==='development'?v.legal.development:v.legal[type].length>0;
      const b=button(названия[type],()=>{
        if(!enabled){const body=modal(названия[type]);body.append(el('p','Стоимость: '+resourceText(cost)));const missing=cost.map((n,r)=>Math.max(0,n-v.hand[r]));body.append(el('p',П.сумма(missing)?'Не хватает: '+resourceText(missing):type==='development'?'Колода развития закончилась.':'Нет доступного места или закончились фигуры этого типа.'));body.append(button('Понятно',close));return;}
        if(type==='development')act({type});else{mode=mode===type?null:type;render();}
      },enabled?'':'кат-нехватка');
      b.disabled=busy||!mine||v.phase!=='main';b.setAttribute('aria-pressed',String(mode===type));
      b.dataset.build=type;
      const icon=el('span',undefined,'кат-строение');icon.setAttribute('aria-hidden','true');b.prepend(icon);
      const price=el('span',undefined,'кат-цена');cost.forEach((n,r)=>{for(let j=0;j<n;j++)price.append(picture(r,'кат-рисунок кат-мини'));});b.append(price);
      const missing=cost.map((n,r)=>Math.max(0,n-v.hand[r]));b.title=resourceText(cost)+(П.сумма(missing)?' · Не хватает: '+resourceText(missing):'');return b;
    }));
    $('кат-отмена').classList.toggle('скрыт',!mode||v.phase!=='main');
    $('кат-главное').textContent=!active?'Результаты':v.phase==='roll'?'Бросить кубики':v.phase==='discard'&&mine?`Сбросить ${v.discard[v.me]}`:v.phase==='steal'&&mine?'Выбрать соперника':v.phase==='main'&&mine?'Завершить ход':mine?'Выберите место':'Ждём хода';
    $('кат-главное').disabled=busy||active&&(!mine||!['roll','main','discard','steal'].includes(v.phase));
    $('кат-обмен').disabled=busy||v.phase!=='main';$('кат-карты').disabled=!v.dev.length;$('кат-карты').textContent=`Мои карты${v.dev.length?' · '+v.dev.length:''}`;
    offer();
    feedback();
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
    body.append(el('p',`Победные очки: ${p.score} из 10`),el('p',`В руке: ${p.cards} ресурсов · ${p.devCount} карт развития`));
    for(const [title,value]of [['Поселения',p.pieces.settlement],['Города',p.pieces.city*2],['Самая длинная дорога',v.roadOwner===i?2:0],['Самая большая армия',v.armyOwner===i?2:0]]){const row=el('div',undefined,'кат-счёт-строка');row.append(el('span',title),el('b',String(value)));body.append(row);}
    if(p.victoryCards!==null){const row=el('div',undefined,'кат-счёт-строка');row.append(el('span',i===v.me?'Ваши скрытые победные очки':'Карты победных очков'),el('b',String(p.victoryCards)));body.append(row);}else body.append(el('p','Победные карты соперника скрыты и не входят в его видимый счёт до конца партии.'));
    body.append(el('p',`Непрерывная дорога: ${p.roadLength} · Разыграно рыцарей: ${p.knights}`),el('p',`Фигуры в запасе: ${15-p.pieces.road} дорог, ${5-p.pieces.settlement} поселений, ${4-p.pieces.city} городов.`));
  }
  function resourceInfo(r){
    const body=modal(ресурсы[r],'resource'),art=picture(r,'кат-рисунок кат-ресурс-крупно');body.append(art,el('p',`У вас: ${v.hand[r]} · В банке: ${v.bank[r]} · Ваш курс: ${v.rates[r]} к 1`));
    const lands=v.hexes.filter(h=>h.resource===r);body.append(el('p',`Ресурс приносят ${['леса','глиняные холмы','пастбища','поля','горы'][r]} при броске: ${lands.map(h=>h.number).sort((a,b)=>a-b).join(', ')}.`),el('p','Поселение у такого гекса получает 1 карту, город — 2. Это работает на бросках всех игроков. Гекс с разбойником не производит ресурсов.'));
  }
  function development(){
    const body=modal('Ваши карты развития','development');
    if(!v.dev.length){body.append(el('p','Карты покупаются за шерсть, зерно и руду.'));return;}
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
  function trade(){
    const body=modal('Обмен ресурсами','trade');
    const turn=v.turn,bankPanel=el('div',undefined,'кат-форма-обмена'),peoplePanel=el('div',undefined,'кат-форма-обмена');
    const validTurn=()=>{if(v.phase!=='main'||v.turn!==turn){$('кат-ошибка').textContent='Ход сменился. Откройте обмен заново.';close();return false;}return true;};
    const tabs=el('div',undefined,'кат-переключатель');
    function tab(bank){bankPanel.hidden=!bank;peoplePanel.hidden=bank;[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String((i===0)===bank)));}
    if(v.turn===v.me){
      tabs.append(button('Банк и порты',()=>tab(true)),button('С игроками',()=>tab(false)));body.append(tabs);
      bankPanel.append(el('p','Курс учитывает ваши порты. Выберите ресурс, который отдаёте, и тот, который нужен.'));
      const give=el('select'),want=el('select');give.setAttribute('aria-label','Отдать банку');want.setAttribute('aria-label','Получить из банка');
      ресурсы.forEach((r,i)=>{const a=el('option',`${r} · отдать ${v.rates[i]}`);a.value=i;give.append(a);const b=el('option',`${r} · в банке ${v.bank[i]}`);b.value=i;want.append(b);});want.value=1;
      const exchange=button('Обменять',async()=>{if(validTurn()&&await act({type:'bank',give:Number(give.value),want:Number(want.value)}))trade();},'кнопка кнопка--главная');
      const update=()=>exchange.disabled=give.value===want.value||v.hand[+give.value]<v.rates[+give.value]||v.bank[+want.value]===0;give.onchange=want.onchange=update;update();bankPanel.append(el('b','Отдаю'),give,el('b','Получаю'),want,exchange);
    }
    body.append(bankPanel,peoplePanel);tab(v.turn===v.me);
    peoplePanel.append(el('p','Укажите ресурсы с обеих сторон. Обмен состоится только после согласия игрока.'));
    const target=el('select');target.setAttribute('aria-label','Кому предложить обмен');
    if(v.turn===v.me){const o=el('option','Всем игрокам');o.value=-1;target.append(o);}
    v.players.forEach((_,i)=>{if(i!==v.me&&(v.turn===v.me||i===v.turn)){const o=el('option',name(i));o.value=i;target.append(o);}});peoplePanel.append(target);
    const give=[0,0,0,0,0],want=[0,0,0,0,0];
    const confirm=button('Предложить обмен',async()=>{if(validTurn()&&await act({type:'offer',to:Number(target.value),give,want}))closeAction();},'кнопка кнопка--главная');
    const update=()=>confirm.disabled=!П.сумма(give)||!П.сумма(want)||give.some((n,i)=>n&&want[i]);
    const head=el('div',undefined,'кат-обмен-строка кат-обмен-шапка');head.append(el('span','Ресурс'),el('span','Отдаю'),el('span','Получаю'));peoplePanel.append(head);
    ресурсы.forEach((r,i)=>{const row=el('div',undefined,'кат-обмен-строка'),label=el('span',undefined,'кат-обмен-ресурс');label.append(picture(i),el('span',r));row.append(label);
      for(const [label,values,max]of [['Отдаю',give,v.hand[i]],['Получаю',want,19]]){const input=el('input');input.type='number';input.min=0;input.max=max;input.value=0;input.inputMode='numeric';input.setAttribute('aria-label',`${label}: ${r}`);input.oninput=()=>{values[i]=Math.max(0,Math.min(max,Math.floor(Number(input.value)||0)));input.value=values[i];update();};row.append(input);}peoplePanel.append(row);
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
    return `${n}: ${названия[e.type]||{end:'ход завершён',offer:'предложен обмен',robber:'разбойник перемещён'}[e.type]||e.type}`;
  }
  function journal(){const body=modal('Журнал ходов','log');if(!v?.log.length)body.append(el('p','Здесь появятся броски кубиков, постройки и обмены.'));else v.log.slice().reverse().forEach(e=>body.append(el('div',logText(e),'кат-журнал')));if(v?.startRolls?.length){body.append(el('h3','Кто начинает'));v.startRolls.forEach((rolls,i)=>body.append(el('p',`Бросок ${i+1}: `+rolls.map(r=>`${name(r.player)} — ${r.dice.join(' + ')} = ${П.сумма(r.dice)}`).join('; '))));body.append(el('p','Начинает: '+name(v.start)));}}
  function saveResult(){
    if(online||record.resultSaved)return;
    try{let history=JSON.parse(localStorage.getItem(HIST))||[];if(!Array.isArray(history))history=[];if(!history.some(x=>x.id===record.id))history.unshift({id:record.id,date:Date.now(),win:v.winner===0,scores:v.players.map(p=>p.score),level:record.level});localStorage.setItem(HIST,JSON.stringify(history.slice(0,30)));record.resultSaved=true;save();}catch(_){}
  }
  function results(){
    const body=modal(v.winner<0?'Партия завершена':v.winner===v.me?'Ваш остров победил!':`Победитель: ${name(v.winner)}`,'result');
    if(v.surrendered>=0)body.append(el('p',`${name(v.surrendered)} завершили партию досрочно.`));else if(v.interrupted)body.append(el('p','Партия прервана без результата.'));
    [...v.players.entries()].sort((a,b)=>b[1].score-a[1].score).forEach(([i,p])=>{const row=el('div',undefined,'кат-итог');row.append(el('b',name(i)),el('strong',`${p.score} / 10`),el('small',`Поселения: ${p.pieces.settlement} · Города: ${p.pieces.city*2} очк.`),el('small',`Карты: ${p.victoryCards??0} · Дорога: ${v.roadOwner===i?2:0} · Армия: ${v.armyOwner===i?2:0}`));body.append(row);});
    body.append(button('Посмотреть остров',close));
    body.append(button(online&&network?.яХочуЕщё?'Ждём согласия игроков…':'Сыграть ещё',async()=>{if(online){const r=await window.Сеть.отправитьХод({действие:'ещё'});if(!r?.принято)$('кат-ошибка').textContent=r?.причина||'Нет связи';}else{close();fresh();}},'кнопка кнопка--главная'));
    body.append(button('В меню',()=>{close();if(online)window.Сеть.покинутьПартию();online=false;screen('экран-лобби');}));
  }
  function history(){const body=modal('Мои партии');let items=[];try{items=JSON.parse(localStorage.getItem(HIST))||[];}catch(_){}if(!Array.isArray(items))items=[];if(!items.length)body.append(el('p','Здесь появятся завершённые партии с ботами.'));items.forEach(x=>body.append(el('div',`${new Date(x.date).toLocaleDateString('ru-RU')} · ${x.win?'Победа':'Поражение'} · ${x.scores.join(' : ')}`,'кат-журнал')));}
  function rules(){
    const body=modal('Как играть в Катан');
    for(const [title,text]of [
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
    function radios(id,values,current,change){$(id).replaceChildren(...values.map(([value,label])=>{const b=button(label,()=>{change(value);save();settings();});b.setAttribute('role','radio');b.setAttribute('aria-checked',String(value===current));return b;}));}
    radios('кат-число',[[3,'Трое'],[4,'Четверо']],prefs.n,n=>prefs.n=n);
    radios('кат-уровень',[['лёгкий','Лёгкий'],['обычный','Обычный'],['сложный','Сложный']],prefs.level,x=>prefs.level=x);
    radios('кат-число-онлайн',[[3,'Трое'],[4,'Четверо']],Number($('катан-мест-друга').value),n=>$('катан-мест-друга').value=n);
    for(const [id,n,bots]of [['кат-стол-ботов',prefs.n,true],['кат-стол-онлайн',Number($('катан-мест-друга').value),false]]){
      const root=$(id);root.style.setProperty('--мест',n);root.replaceChildren(el('b','КАТАН'));
      for(let i=0;i<n;i++){const b=button('',()=>{if(bots){const body=modal(`Бот ${i}`);body.append(el('p','Сила соперников выбирается под столом.'));}else $('кнопка-создать-игру').click();},`рассадка__место рассадка__место--${i===0?'я':bots?'бот':'свободно'}`);b.style.setProperty('--номер-места',n/2+i);const img=el('img');img.src=`img/дурак/значки/${i===0?'avatar':'robot'}.svg`;img.alt='';b.append(bots||i===0?img:el('span','+'),el('span',i===0?'Вы':bots?`Бот ${i}`:'Свободно','рассадка__имя'));b.disabled=i===0;root.append(b);}
    }
  }
  const лист=window.ЛистЕщё.подключить({экраныСЛистом:['экран-лобби','экран-игры','кат-настройки'],двери:{вМеню:{действие:back},завершить:{видна:()=>$('экран-игры').classList.contains('экран--виден')&&v?.phase!=='finished',текст:()=>'Вы завершите партию досрочно. Вам будет записано поражение.',действие:()=>act({type:'surrender'})},какИграть:{действие:rules},рекорды:{действие:history},звук:{состояние:()=>prefs.sound?'вкл':'выкл',действие:()=>{prefs.sound=!prefs.sound;save();}}}});
  document.querySelectorAll('[data-back]').forEach(b=>b.onclick=back);document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>лист.открыть());
  $('кат-закрыть').onclick=close;$('кат-диалог').addEventListener('cancel',e=>{e.preventDefault();close();});
  $('кат-боты').onclick=()=>{settings();screen('кат-настройки');};
  $('кат-начать').onclick=()=>{if(g&&g.phase!=='finished')$('кат-новая').showModal();else fresh();};
  $('кат-новая-да').onclick=()=>{$('кат-новая').close();fresh();};
  $('кат-продолжить').onclick=()=>{online=false;lastResult='';screen('экран-игры');render();};
  $('кат-главное').onclick=()=>{if(v.phase==='finished')results();else if(v.phase==='discard')chooseResources('Сбросьте ресурсы',v.hand,v.discard[v.me],resources=>act({type:'discard',resources}));else if(v.phase==='steal'){const body=modal('У кого забрать ресурс?');v.victims.forEach(i=>body.append(button(`${name(i)} · ${v.players[i].cards} ресурсов`,async()=>{if(await act({type:'steal',victim:i}))closeAction();})));}else act({type:v.phase==='roll'?'roll':'end'});};
  $('кат-масштаб').onclick=()=>zoom(!document.querySelector('.кат-карта').classList.contains('увеличена'));
  $('кат-отмена').onclick=()=>{mode=null;render();};$('кат-обмен').onclick=trade;$('кат-карты').onclick=development;$('кат-журнал-кнопка').onclick=journal;$('кат-правила').onclick=rules;
  $('кат-профиль').onclick=()=>window.ЭкранПрофиля.открыть('катан');$('кат-имя').textContent=window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name||'Вы';
  $('кнопка-комната-назад').onclick=()=>$('кнопка-комната-отмена').click();$('кнопка-комната-ещё').onclick=()=>лист.открыть();
  $('экран-лобби').insertBefore($('кнопка-вернуться-в-игру'),$('кат-продолжить'));
  document.querySelector('nav.нижние-вкладки').innerHTML=window.НижниеВкладки.вкладкиНабора('лобби-деберц').map(x=>window.НижниеВкладки.кнопкаHTML({...x,id:x.id.replace('деберц','катан')})).join('');
  $('катан-вкладка-игры').onclick=()=>location.href='index.html';$('катан-вкладка-рейтинг').onclick=()=>window.ЭкранРейтинга.открыть('катан');$('катан-вкладка-профиль').onclick=()=>$('кат-профиль').click();
  const oldScores=window.ЭкранРейтинга.открытьСчёт;window.ЭкранРейтинга.открытьСчёт=game=>game==='катан'?history():oldScores(game);
  window.ИграПоСети={
    начать(){clearTimeout(timer);online=true;},
    показатьВид(state){if(!state.катан||network?.код===state.код&&state.версия<network.версия)return;const changed=!network||network.код!==state.код||network.сыграноПартий!==state.сыграноПартий;if(changed){mode=null;lastResult='';close();}online=true;network=state;v=state.катан;screen('экран-игры');render();},
    показатьСвязь(text){$('строка-связи').textContent=text||'';$('строка-связи').classList.toggle('скрыт',!text);},экран:screen,вМеню(){online=false;network=null;screen('экран-лобби');},идёт:()=>online
  };
  settings();screen('экран-лобби');if(loadError){const p=el('p',loadError,'кат-тихо');$('кат-продолжить').after(p);}
})();
