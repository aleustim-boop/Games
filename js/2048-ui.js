'use strict';
(()=>{
 const R=window.Game2048,$=id=>document.getElementById(id),KEY='game-2048-v1',BEST='game-2048-best',PREF='game-2048-prefs';
 const fmt=n=>n.toLocaleString('ru-RU'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
 let state=R.restore(read(KEY,null)),best=read(BEST,0),prefs={effects:true,sound:false,haptic:true,...read(PREF,{})};
 if(!Number.isSafeInteger(best)||best<0)best=0;
 let playing=false,busy=false,animationTimer=null,audio=null,pointer=null,resultShown=false;
 const colors=[['#e0e1cd','#c8d3c1','#283d35'],['#e8dabb','#ceb88f','#3b3020'],['#91c8b2','#4a997f','#082f29'],['#53aaa4','#2c7576','#efffee'],['#527e98','#315571','#edf7ff'],['#7c789e','#534d79','#f7efff'],['#c89263','#9e6439','#fff7dd'],['#d9b974','#b58c44','#2f240e'],['#e8c168','#bd902e','#2c230b'],['#f1cf7d','#c49b40','#312206'],['#ffe3a0','#d5a33d','#332406']];
 const effects=()=>prefs.effects&&!reduced.matches;
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
 function save(){
  best=Math.max(best,state?.score||0);write(BEST,best);
  if(state&&!write(KEY,state))$('save-note').textContent='Сохранение недоступно. Не закрывайте вкладку до конца партии.';
  $('lobby-best').textContent=fmt(best);$('play').firstChild.textContent=state?'Продолжить игру ':'Начать игру ';
 }
 function position(e,index){const c=index%4,r=Math.floor(index/4);e.style.left=`calc(${c*25}% + ${c} * var(--gap) / 4)`;e.style.top=`calc(${r*25}% + ${r} * var(--gap) / 4)`;}
 for(let i=0;i<16;i++){const cell=document.createElement('div');cell.className='cell';position(cell,i);$('cells').append(cell);}
 function paint(event){
  $('tiles').replaceChildren();
  state.board.forEach((value,i)=>{
   if(!value)return;
   const tile=document.createElement('div'),inner=document.createElement('span'),level=Math.log2(value),color=colors[Math.min(level-1,colors.length-1)];
   tile.className='tile'+(effects()&&event?.merged?.includes(i)?' merged':effects()&&event?.spawned===i?' born':'');
   tile.dataset.index=i;tile.dataset.digits=String(value).length;tile.dataset.high=String(value>=256);tile.setAttribute('aria-label',`${value}, ряд ${Math.floor(i/4)+1}, столбец ${i%4+1}`);
   inner.className='tile-inner';inner.textContent=value;
   tile.style.setProperty('--tile-a',color[0]);tile.style.setProperty('--tile-b',color[1]);tile.style.setProperty('--tile-ink',color[2]);position(tile,i);tile.append(inner);$('tiles').append(tile);
  });
  $('score').textContent=fmt(state.score);$('best').textContent=fmt(best);$('moves').textContent=fmt(state.moves);$('undo').disabled=!state.previous;
  const largest=Math.max(...state.board),progress=Math.min(11,Math.log2(largest));
  $('milestone').textContent=fmt(largest)+(largest<2048?' / 2048':' · дальше — больше');$('progress-fill').style.width=progress/11*100+'%';document.querySelector('.progress').setAttribute('aria-valuenow',progress);
  $('hint').textContent=state.moves?'Стрелки, свайпы или кнопки ниже — выбирайте удобный способ.':'Смахните в любую сторону. Одинаковые числа складываются.';
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
  clearTimeout(animationTimer);animationTimer=null;busy=false;paint(result);
  if(result){sparks(result.merged);if(result.gain){$('score-gain').textContent='+'+fmt(result.gain);if(effects())$('score-gain').animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-22px)'}],{duration:700,fill:'forwards'});else $('score-gain').textContent='';}}
  $('announce').textContent=`Счёт ${state.score}. Самая большая плитка ${Math.max(...state.board)}.${state.over?' Ходов больше нет.':''}`;
  if(playing&&!$('dialog').open)showResult();
 }
 function move(direction){
  if(!playing||busy||$('dialog').open)return;
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
  if(fresh||!state)state=R.create(seed());resultShown=false;playing=true;
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
 function close(){ $('dialog').close();if(playing)$('board').focus({preventScroll:true}); }
 function undo(){if(busy||!state?.previous)return;state=R.undo(state);resultShown=false;save();paint();$('announce').textContent='Последний ход отменён.';}
 function showResult(){
  if(resultShown||!state||(state.won&&state.continued&&!state.over)||(!state.won&&!state.over))return;
  resultShown=true;const win=state.won&&!state.continued,body=modal(win?'Вы собрали 2048!':'Каждый ход — опыт');
  text(body,win?'2048':fmt(state.score),'result-number');text(body,win?'Отличная партия. Продолжите и попробуйте собрать 4096.':'Ходов больше нет. Попробуйте снова или отмените последний ход.','result-label');
  text(body,`Счёт ${fmt(state.score)} · ${fmt(state.moves)} ходов · рекорд ${fmt(best)}`);
  if(win)button(body,'Продолжить к 4096',()=>{state=R.continueGame(state);resultShown=false;save();close();if(state.over)showResult();});
  else if(state.previous)button(body,'Отменить последний ход',()=>{close();undo();});
  button(body,'Новая игра',()=>{close();start(true);},win?'secondary':'primary');
 }
 function help(){const body=modal('Как играть');text(body,'Сдвигайте плитки свайпом или стрелками. Два одинаковых числа объединяются в одно: 2 + 2 = 4. За слияние вы получаете столько очков, сколько написано на новой плитке.');const example=document.createElement('div');example.className='rule-example';example.innerHTML='<b>2</b><span>+</span><b>2</b><span>→</span><b>4</b>';body.append(example);text(body,'После успешного хода появляется 2 или 4. Каждая плитка объединяется только один раз за ход. Соберите 2048 — и при желании играйте дальше. Если свободных клеток и слияний нет, партия завершена.');text(body,'Подсказка: держите самое большое число в одном углу и старайтесь не заполнять всё поле. Доступна отмена одного последнего хода.');button(body,'Понятно',close);}
 function applyPrefs(){document.body.classList.toggle('no-effects',!prefs.effects||reduced.matches);}
 function settings(){const body=modal('Ваш ритм игры');for(const [key,label]of [['effects','Анимации и искры'],['sound','Звук слияния'],['haptic','Вибрация в Telegram']]){const row=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input');row.className='setting-row';span.textContent=label;input.type='checkbox';input.checked=prefs[key];input.onchange=()=>{prefs[key]=input.checked;write(PREF,prefs);applyPrefs();};row.append(span,input);body.append(row);}text(body,'Если на устройстве включено уменьшение движения, анимации автоматически отключаются.');button(body,'Готово',close);}
 $('dialog').addEventListener('close',()=>{if(state?.won&&!state.continued&&resultShown){state=R.continueGame(state);resultShown=false;save();}});
 $('play').onclick=()=>start();$('back').onclick=e=>{e.preventDefault();back();};$('settings').onclick=settings;$('how').onclick=help;$('game-help').onclick=help;$('close-dialog').onclick=close;$('undo').onclick=undo;
 $('new').onclick=()=>{if(busy)return;const body=modal('Начать заново?');text(body,'Текущая партия будет заменена. Личный рекорд сохранится.');button(body,'Начать новую игру',()=>{close();start(true);});button(body,'Продолжить текущую',close,'secondary');};
 document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(b.dataset.dir));
 $('board').addEventListener('pointerdown',e=>{if(e.button!==0||pointer||!playing||busy)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('board').setPointerCapture(e.pointerId);});
 $('board').addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});
 $('board').addEventListener('pointercancel',()=>pointer=null);$('board').addEventListener('lostpointercapture',()=>pointer=null);
 document.addEventListener('keydown',e=>{if(!playing||$('dialog').open||e.ctrlKey||e.metaKey||e.altKey)return;const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};const direction=dirs[e.key];if(direction){e.preventDefault();move(direction);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer=null;if(busy)finishMove();save();}});
 window.addEventListener('pagehide',()=>{if(state)save();});reduced.addEventListener('change',applyPrefs);
 function telegram(){window.Телеграм?.показатьСтрелку(back);window.Телеграм?.цветОкна('#0c1518');const name=window.Телеграм?.имяИгрока();if(name)$('player-name').textContent=name;}
 telegram();window.addEventListener('load',telegram);applyPrefs();save();
})();
