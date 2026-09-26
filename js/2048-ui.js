'use strict';
(()=>{
 const C=window.Game2048,F=window.Falling2048,$=id=>document.getElementById(id),PREF='game-2048-prefs';
 let mode=read('game-2048-mode','classic')==='falling'?'falling':'classic',R=mode==='falling'?F:C;
 let KEY=mode==='falling'?'game-2048-falling-v1':'game-2048-v1',BEST=mode==='falling'?'game-2048-falling-best':'game-2048-best';
 const fmt=n=>n.toLocaleString('ru-RU'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
 let state=R.restore(read(KEY,null)),best=read(BEST,0),prefs={effects:true,sound:false,haptic:true,...read(PREF,{})};
 if(!Number.isSafeInteger(best)||best<0)best=0;
 let playing=false,busy=false,animationTimer=null,audio=null,pointer=null,resultShown=false,paused=false,telegramActive=true,nextFall=0,bonusTimer=null;
 const fallDelay=()=>Math.max(350,850-Math.floor((state?.moves||0)/20)*50);
 const colors=[['#e0e1cd','#c8d3c1','#283d35'],['#e8dabb','#ceb88f','#3b3020'],['#91c8b2','#4a997f','#082f29'],['#53aaa4','#2c7576','#efffee'],['#527e98','#315571','#edf7ff'],['#7c789e','#534d79','#f7efff'],['#c89263','#9e6439','#fff7dd'],['#d9b974','#b58c44','#2f240e'],['#e8c168','#bd902e','#2c230b'],['#f1cf7d','#c49b40','#312206'],['#ffe3a0','#d5a33d','#332406']];
 const effects=()=>prefs.effects&&!reduced.matches;
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
 function save(){
  best=Math.max(best,state?.score||0);write(BEST,best);
  if(state&&!write(KEY,state))$('save-note').textContent='Сохранение недоступно. Не закрывайте вкладку до конца партии.';
  $('lobby-best').textContent=fmt(best);$('play').firstChild.textContent=state?'Продолжить игру ':'Начать игру ';
 }
 function position(e,index){const cols=mode==='falling'?F.COLS:4,rows=mode==='falling'?F.ROWS:4,c=index%cols,r=Math.floor(index/cols);e.style.left=`calc(${c*100/cols}% + ${c} * var(--gap) / ${cols})`;e.style.top=`calc(${r*100/rows}% + ${r} * var(--gap) / ${rows})`;}
 function configureMode(){
  document.body.dataset.mode=mode;$('cells').replaceChildren();
  for(let i=0;i<(mode==='falling'?35:16);i++){const cell=document.createElement('div');cell.className='cell';position(cell,i);$('cells').append(cell);}
  document.querySelectorAll('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('mode-description').textContent=mode==='falling'?'5 × 7 · блоки падают сами':'4 × 4 · без таймера';
  for(const id of ['falling-toolbar','falling-layer','falling-controls'])$(id).hidden=mode!=='falling';
  $('moves-label').textContent=mode==='falling'?'БЛОКИ':'ХОДЫ';
  $('undo').querySelector('span').textContent=mode==='falling'?'Вернуть блок':'Отменить ход';
  $('board').setAttribute('aria-label',mode==='falling'?'Падающие числа. Влево и вправо — двигать блок, вниз — ускорить, пробел — сбросить.':'Поле 2048. Свайпайте или используйте стрелки клавиатуры.');
  document.querySelector('[data-dir="up"]').hidden=mode==='falling';
 }
 function tile(value,index,className=''){
  const t=document.createElement('div'),inner=document.createElement('span'),level=Math.log2(value),color=colors[Math.min(level-1,colors.length-1)],cols=mode==='falling'?F.COLS:4;
  t.className='tile '+className;t.dataset.index=index;t.dataset.digits=String(value).length;t.dataset.high=String(value>=256);
  t.setAttribute('aria-label',`${value}, ряд ${Math.floor(index/cols)+1}, столбец ${index%cols+1}`);
  inner.className='tile-inner';inner.textContent=value;t.style.setProperty('--tile-a',color[0]);t.style.setProperty('--tile-b',color[1]);t.style.setProperty('--tile-ink',color[2]);position(t,index);t.append(inner);return t;
 }
 function paintFalling(){
  const layer=$('falling-layer');
  if(mode!=='falling'||!state?.active){layer.replaceChildren();return;}
  const a=state.active,land=F.landing(state);let active=layer.querySelector('.falling-active');
  if(!active||active.dataset.value!==String(a.value)){active=tile(a.value,a.y*F.COLS+a.x,'falling-active');active.dataset.value=a.value;layer.replaceChildren(active);}
  position(active,a.y*F.COLS+a.x);
  let ghost=layer.querySelector('.falling-ghost');if(!ghost){ghost=tile(a.value,land.y*F.COLS+land.x,'falling-ghost');ghost.setAttribute('aria-hidden','true');layer.prepend(ghost);}
  ghost.hidden=land.y===a.y;position(ghost,land.y*F.COLS+land.x);$('next-number').textContent=state.next;
 }
 configureMode();
 function paint(event){
  clearTimeout(bonusTimer);$('merge-bonus').hidden=true;
  $('tiles').replaceChildren();
  state.board.forEach((value,i)=>{if(value)$('tiles').append(tile(value,i,effects()&&event?.merged?.includes(i)?'merged':effects()&&event?.spawned===i?'born':''));});
  paintFalling();
  $('score').textContent=fmt(state.score);$('best').textContent=fmt(best);$('moves').textContent=fmt(state.moves);$('undo').disabled=!state.previous;
  const largest=Math.max(2,...state.board),progress=Math.min(11,Math.log2(largest));
  $('milestone').textContent=fmt(largest)+(largest<2048?' / 2048':' · дальше — больше');$('progress-fill').style.width=progress/11*100+'%';document.querySelector('.progress').setAttribute('aria-valuenow',progress);
  if(mode==='falling'){$('hint').textContent='← → двигать · ↓ ускорить · пробел или кнопка — сбросить';const bonus=event?.bonuses?.at(-1);$('falling-status').textContent=bonus?`Бонус: ${bonus.blocks} × ${bonus.input} → ${bonus.value}`:event?.chains>1?'Цепочка × '+event.chains:'Падающие числа';}
  else $('hint').textContent=state.moves?'Стрелки, свайпы или кнопки ниже — выбирайте удобный способ.':'Смахните в любую сторону. Одинаковые числа складываются.';
 }
 function sound(merged){
  if(!prefs.sound)return;
  try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const now=audio.currentTime;
   [0,...(merged?[.065]:[])].forEach((delay,i)=>{const o=audio.createOscillator(),gain=audio.createGain();o.type='sine';o.frequency.setValueAtTime(merged?(i?660:440):240,now+delay);gain.gain.setValueAtTime(.0001,now+delay);gain.gain.exponentialRampToValueAtTime(.07,now+delay+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+.14);o.connect(gain);gain.connect(audio.destination);o.start(now+delay);o.stop(now+delay+.15);});
  }catch{}
 }
 function sparks(indices){
  if(!effects())return;
  for(const index of indices){const cell=$('cells').children[index],r=cell.getBoundingClientRect(),b=$('board').getBoundingClientRect();
   for(let i=0;i<8;i++){const s=document.createElement('i');s.className='spark';s.style.left=r.x-b.x+r.width/2+'px';s.style.top=r.y-b.y+r.height/2+'px';$('particles').append(s);const angle=i*Math.PI/4;const a=s.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(angle)*45}px,${Math.sin(angle)*45}px) scale(.2)`,opacity:0}],{duration:420,easing:'ease-out'});a.finished.catch(()=>{}).finally(()=>s.remove());}
  }
 }
 function finishMove(result){
  clearTimeout(animationTimer);animationTimer=null;busy=false;if(mode==='falling')$('falling-layer').replaceChildren();paint(result);
  if(result){sparks(result.merged);if(result.gain){$('score-gain').textContent='+'+fmt(result.gain);if(effects())$('score-gain').animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-22px)'}],{duration:700,fill:'forwards'});else $('score-gain').textContent='';}}
  $('announce').textContent=`Счёт ${state.score}. Самая большая плитка ${Math.max(...state.board)}.${state.over?' Ходов больше нет.':''}`;
  const bonus=result?.bonuses?.at(-1);if(bonus){const notice=$('merge-bonus');notice.textContent=`БОНУС! ${bonus.blocks} × ${bonus.input} → ${bonus.value}`;notice.hidden=false;$('announce').textContent+=` Бонус: ${bonus.blocks} блока по ${bonus.input} дали ${bonus.value}.`;if(effects()){notice.animate([{opacity:0,transform:'translateY(10px) scale(.85)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.3},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:600,easing:'ease-out'});sparks(result.merged);}bonusTimer=setTimeout(()=>notice.hidden=true,1800);}
  if(playing&&!$('dialog').open)showResult();
 }
 function move(direction){
  if(!playing||busy||$('dialog').open)return;
  if(mode==='falling'){fallingMove(direction==='up'?'drop':direction);return;}
  const result=R.move(state,direction);
  if(!result.changed){if(effects())$('board').animate([{transform:'translateX(0)'},{transform:'translateX(3px)'},{transform:'translateX(-3px)'},{transform:'translateX(0)'}],{duration:150});return;}
  state=result.state;save();sound(result.merged.length);
  if(prefs.haptic)window.Телеграм?.отклик(result.merged.length?'взятка':'выбор');
  if(!effects()){finishMove(result);return;}
  busy=true;
  for(const motion of result.motions){const tile=$('tiles').querySelector(`[data-index="${motion.from}"]`);if(tile)position(tile,motion.to);}
  animationTimer=setTimeout(()=>finishMove(result),130);
 }
 function seed(){const values=new Uint32Array(1);crypto.getRandomValues(values);return values[0]||1;}
 function start(fresh=false){
  const returning=!!state&&!fresh;
  if(fresh||!state)state=R.create(seed());resultShown=false;playing=true;configureMode();
  setPaused(mode==='falling'&&returning);
  $('экран-лобби').hidden=true;$('экран-лобби').classList.remove('экран--виден');$('экран-игры').hidden=false;$('экран-игры').classList.add('экран--виден');
  save();paint();window.scrollTo(0,0);$('board').focus({preventScroll:true});showResult();
 }
 function back(){
  if($('dialog').open){close();return;}
  if(playing){playing=false;if(busy)finishMove();$('экран-игры').hidden=true;$('экран-игры').classList.remove('экран--виден');$('экран-лобби').hidden=false;$('экран-лобби').classList.add('экран--виден');save();window.scrollTo(0,0);return;}
  location.href='index.html';
 }
 function modal(title){
  const body=$('dialog-content');body.replaceChildren();const h=document.createElement('h2');h.id='dialog-title';h.textContent=title;body.append(h);
  if(!$('dialog').open)$('dialog').showModal();return body;
 }
 function text(body,value,className){const p=document.createElement('p');p.textContent=value;if(className)p.className=className;body.append(p);return p;}
 function button(body,label,fn,style='primary'){const b=document.createElement('button');b.className=style;b.textContent=label;b.onclick=fn;body.append(b);return b;}
 function close(){ $('dialog').close();nextFall=performance.now()+fallDelay();if(playing)$('board').focus({preventScroll:true}); }
 function undo(){if(busy||!state?.previous)return;state=R.undo(state);resultShown=false;nextFall=performance.now()+fallDelay();save();paint();$('announce').textContent='Последний ход отменён.';}
 function showResult(){
  if(resultShown||!state||(state.won&&state.continued&&!state.over)||(!state.won&&!state.over))return;
  resultShown=true;const win=state.won&&!state.continued,body=modal(win?'Вы собрали 2048!':'Каждый ход — опыт');
  text(body,win?'2048':fmt(state.score),'result-number');text(body,win?'Отличная партия. Продолжите и попробуйте собрать 4096.':(mode==='falling'?'Башня достигла точки появления нового блока. Попробуйте ещё раз или верните последний блок.':'Ходов больше нет. Попробуйте снова или отмените последний ход.'),'result-label');
  text(body,`Счёт ${fmt(state.score)} · ${fmt(state.moves)} ходов · рекорд ${fmt(best)}`);
  if(win)button(body,'Продолжить к 4096',()=>{state=R.continueGame(state);resultShown=false;save();close();if(state.over)showResult();});
  else if(state.previous)button(body,'Отменить последний ход',()=>{close();undo();});
  button(body,'Новая игра',()=>{close();start(true);},win?'secondary':'primary');
 }
 function help(){const body=modal('Как играть');if(mode==='falling'){text(body,'Числа падают сверху на поле 5 × 7. Двигайте текущий блок стрелками ← → или свайпами. Касание столбца перемещает блок туда, если путь свободен. Контур показывает место приземления.');text(body,'Кнопка «Сбросить блок», пробел или свайп вниз сразу опускают блок. Стрелка ↓ ускоряет падение на одну клетку. После приземления блок одновременно забирает всех равных соседей, которых касается стороной. Каждый сосед удваивает число: падающая 8 + одна 8 = 16; + две 8 = 32; + три 8 = 64. По диагонали слияния нет. Блоки над пустотами падают — так возникают цепочки. Линии не удаляются.');text(body,'Соберите 2048 и продолжайте дальше. Партия заканчивается, когда заблокировано место появления блока вверху по центру. Скорость постепенно растёт; есть пауза и возврат последнего блока.');button(body,'Понятно',close);return;}text(body,'Сдвигайте плитки свайпом или стрелками. Два одинаковых числа объединяются в одно: 2 + 2 = 4. За слияние вы получаете столько очков, сколько написано на новой плитке.');const example=document.createElement('div');example.className='rule-example';example.innerHTML='<b>2</b><span>+</span><b>2</b><span>→</span><b>4</b>';body.append(example);text(body,'После успешного хода появляется 2 или 4. Каждая плитка объединяется только один раз за ход. Соберите 2048 — и при желании играйте дальше. Если свободных клеток и слияний нет, партия завершена.');text(body,'Подсказка: держите самое большое число в одном углу и старайтесь не заполнять всё поле. Доступна отмена одного последнего хода.');button(body,'Понятно',close);}
 function applyPrefs(){document.body.classList.toggle('no-effects',!prefs.effects||reduced.matches);}
 function settings(){const body=modal('Ваш ритм игры');for(const [key,label]of [['effects','Анимации и искры'],['sound','Звук слияния'],['haptic','Вибрация в Telegram']]){const row=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input');row.className='setting-row';span.textContent=label;input.type='checkbox';input.checked=prefs[key];input.onchange=()=>{prefs[key]=input.checked;write(PREF,prefs);applyPrefs();};row.append(span,input);body.append(row);}text(body,'Если на устройстве включено уменьшение движения, анимации автоматически отключаются.');button(body,'Готово',close);}
 $('dialog').addEventListener('close',()=>{if(state?.won&&!state.continued&&resultShown){state=R.continueGame(state);resultShown=false;save();}});
 $('play').onclick=()=>start();$('back').onclick=e=>{e.preventDefault();back();};$('settings').onclick=settings;$('how').onclick=help;$('game-help').onclick=help;$('close-dialog').onclick=close;$('undo').onclick=undo;
 $('new').onclick=()=>{if(busy)return;const body=modal('Начать заново?');text(body,'Текущая партия будет заменена. Личный рекорд сохранится.');button(body,'Начать новую игру',()=>{close();start(true);});button(body,'Продолжить текущую',close,'secondary');};
 document.querySelectorAll('[data-fall-dir]').forEach(b=>b.onclick=()=>{move(b.dataset.fallDir);$('board').focus({preventScroll:true});});
 document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(b.dataset.dir));
 $('board').addEventListener('pointerdown',e=>{if(e.button!==0||pointer||!playing||busy||e.target.closest('button'))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('board').setPointerCapture(e.pointerId);});
 $('board').addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.max(Math.abs(dx),Math.abs(dy))<18){if(mode==='falling'&&!paused){const r=$('falling-layer').getBoundingClientRect(),column=Math.max(0,Math.min(4,Math.floor((e.clientX-r.left)/r.width*5)));for(let i=0;i<5&&state?.active?.x!==column;i++){const before=state.active.x;move(before<column?'right':'left');if(state.active.x===before)break;}}return;}move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(mode==='falling'?'drop':dy>0?'down':'up'));});
 $('board').addEventListener('pointercancel',()=>pointer=null);$('board').addEventListener('lostpointercapture',()=>pointer=null);
 document.addEventListener('keydown',e=>{if(!playing||$('dialog').open||e.ctrlKey||e.metaKey||e.altKey)return;if(mode==='falling'&&(e.key==='p'||e.key==='P')){e.preventDefault();setPaused(!paused);return;}if(mode==='falling'&&e.code==='Space'&&!e.target.closest('button')){e.preventDefault();move('drop');return;}const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};const direction=dirs[e.key];if(direction){e.preventDefault();move(direction);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer=null;if(mode==='falling')setPaused(true);if(busy)finishMove();save();}});
 window.addEventListener('pagehide',()=>{if(state)save();});reduced.addEventListener('change',applyPrefs);
 function telegram(){window.Телеграм?.показатьСтрелку(back);window.Телеграм?.цветОкна('#0c1518');const name=window.Телеграм?.имяИгрока();if(name)$('player-name').textContent=name;}
 function setPaused(value){paused=value;nextFall=performance.now()+fallDelay();$('resume').hidden=mode!=='falling'||!paused||!!state?.over;$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Продолжить падение':'Пауза');}
 function fallingMove(direction){
  if(paused||!telegramActive||document.hidden)return;
  const result=F.action(state,direction);if(!result.changed)return;
  state=result.state;save();
  if(!result.locked){paintFalling();if(direction==='down')nextFall=performance.now()+fallDelay();return;}
  nextFall=performance.now()+fallDelay();sound(result.chains);if(prefs.haptic)window.Телеграм?.отклик(result.chains?'взятка':'карта');
  if(!effects()){finishMove(result);return;}
  busy=true;const active=$('falling-layer').querySelector('.falling-active');if(active)position(active,result.landed.y*5+result.landed.x);
  animationTimer=setTimeout(()=>{finishMove(result);nextFall=performance.now()+fallDelay();},150);
 }
 $('pause').onclick=()=>setPaused(!paused);$('resume').onclick=()=>{setPaused(false);$('board').focus({preventScroll:true});};$('drop').onclick=()=>{move('drop');$('board').focus({preventScroll:true});};
 document.querySelectorAll('button[data-mode]').forEach(b=>b.onclick=()=>{
  if(playing||mode===b.dataset.mode)return;save();mode=b.dataset.mode;R=mode==='falling'?F:C;
  KEY=mode==='falling'?'game-2048-falling-v1':'game-2048-v1';BEST=mode==='falling'?'game-2048-falling-best':'game-2048-best';
  state=R.restore(read(KEY,null));best=read(BEST,0);if(!Number.isSafeInteger(best)||best<0)best=0;
  write('game-2048-mode',mode);configureMode();save();
 });
 setInterval(()=>{if(mode==='falling'&&playing&&!paused&&!busy&&!$('dialog').open&&!document.hidden&&telegramActive&&performance.now()>=nextFall)fallingMove('down');},80);
 let boundTelegram=null;
 function bindFallingVisibility(){const tg=window.Telegram?.WebApp;if(!tg||boundTelegram===tg)return;boundTelegram=tg;tg.onEvent?.('deactivated',()=>{telegramActive=false;if(mode==='falling'){setPaused(true);save();}});tg.onEvent?.('activated',()=>{telegramActive=true;nextFall=performance.now()+fallDelay();});}
 bindFallingVisibility();window.addEventListener('load',bindFallingVisibility);
 telegram();window.addEventListener('load',telegram);applyPrefs();save();
})();
