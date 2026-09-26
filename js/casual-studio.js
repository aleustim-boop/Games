'use strict';
/* Presentation only: the rules and saved positions remain in each game engine. */
window.CasualStudio=(()=>{
 const $=id=>document.getElementById(id),reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const titles={match3:'Ювелирная коллекция',mahjong:'Тихий сад',klondike:'Золотая раздача',spider:'Вечерняя партия',freecell:'Искусство порядка',mines:'Точность каждого решения',blocks:'Мастерская форм',wordsearch:'Слова между строк',fifteen:'Механика порядка',snake:'Нефритовый сад'};
 const paths={hint:'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9Z',undo:'M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12',new:'M20 8a8 8 0 1 0 1 8M20 3v5h-5',home:'m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',sound:'M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',mute:'M3 9h4l5-4v14l-5-4H3Zm13 0 6 6m0-6-6 6',flag:'M6 22V3m0 1c5-4 7 4 14 0v10c-7 4-9-4-14 0',rotate:'M20 7V2m0 5h-5M20 7a8 8 0 1 0 1 8',place:'M4 4h7v7H4Zm9 9h7v7h-7Zm-9 0h7v7H4Z',cards:'M5 3h12v17H5Zm14 3h2v17H9v-1',up:'m6 14 6-6 6 6'};
 const svg=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name==='pause'?'<path d="M8 5v14M16 5v14"/>':`<path d="${paths[name]||paths.hint}"/>`}</svg>`;
 let initialized=false,audio=null,muted=true;
 try{muted=localStorage.getItem('casual-studio-sound')!=='on';}catch{}
 function sound(kind='tap'){
  if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime,notes=kind==='win'?[523,659,784,1046]:kind==='gem'?[880,1320,1760]:kind==='pair'?[659,988]:kind==='place'?[220,330]:[420];notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type=kind==='place'?'sine':'triangle';o.frequency.setValueAtTime(f,t+i*.055);g.gain.setValueAtTime(0,t+i*.055);g.gain.linearRampToValueAtTime(.025,t+i*.055+.008);g.gain.exponentialRampToValueAtTime(.0001,t+i*.055+.22);o.connect(g);g.connect(audio.destination);o.start(t+i*.055);o.stop(t+i*.055+.24);});}catch{}
 }
 function decorate(button,name,label){if(!button||button.dataset.studio)return;const original=label||button.textContent.trim();button.dataset.studio='1';button.setAttribute('aria-label',original);button.innerHTML=svg(name)+`<span>${original}</span>`;}
 function init(G){if(initialized)return;initialized=true;document.body.dataset.studio=G.id;
  const heading=document.querySelector('.game-heading'),subtitle=document.createElement('div');subtitle.className='studio-edition';subtitle.textContent=titles[G.id];heading.prepend(subtitle);
  const meter=document.createElement('div');meter.className='studio-meter';meter.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="meter-track" cx="32" cy="32" r="28"/><circle class="meter-value" cx="32" cy="32" r="28" pathLength="100"/></svg><strong id="studio-number"></strong><small id="studio-unit"></small>';
  document.querySelector('.status').append(meter);const detail=document.createElement('small');detail.id='studio-detail';$('metric').parentElement.append(detail);
  const audioButton=document.createElement('button');audioButton.id='studio-sound';audioButton.className='studio-sound';audioButton.type='button';audioButton.onclick=()=>{muted=!muted;try{localStorage.setItem('casual-studio-sound',muted?'off':'on');}catch{}paintSound();sound();};document.querySelector('.game-heading').append(audioButton);paintSound();
  decorate($('undo'),'undo','Отмена');decorate($('collection'),'home','В лобби');decorate($('new'),'new','Новая игра');
 }
 function paintSound(){const b=$('studio-sound');b.innerHTML=svg(muted?'mute':'sound');b.setAttribute('aria-label',muted?'Включить звук':'Выключить звук');b.setAttribute('aria-pressed',String(!muted));}
 function update(G,s){init(G);let number=s.moves,unit='ходов',detail='',ratio=0;
  switch(G.id){
   case 'match3':number=s.left;unit='ходов';detail='Цель '+s.goal.toLocaleString('ru-RU');ratio=s.score/s.goal;break;
   case 'mahjong':{const gone=s.tiles.filter(t=>t.gone).length;number=gone/2;unit='пар';detail=G.pairs(s).length+' свободных пар';ratio=gone/s.tiles.length;break;}
   case 'klondike':case 'freecell':{const n=s.foundations.reduce((n,p)=>n+p.length,0);number=s.moves;unit='ходов';detail='из 52 карт';ratio=n/52;break;}
   case 'spider':number=s.moves;unit='ходов';detail='8 последовательностей';ratio=s.finished.length/8;break;
   case 'mines':number=Math.round(s.score/(s.w*s.h-s.mines)*100);unit='открыто %';detail='Мины − флажки';ratio=s.score/(s.w*s.h-s.mines);$('metric-label').textContent='НА ПОЛЕ';break;
   case 'blocks':number=s.lines;unit='линий';detail=s.combo?'Серия ×'+s.combo:'Каждая линия — 100 очков';ratio=Math.min(1,s.combo/5);break;
   case 'wordsearch':number=s.words.filter(w=>w.found).length;unit='слов';detail=s.theme;ratio=number/s.words.length;break;
   case 'fifteen':number=s.tiles.filter((v,i)=>v&&v===i+1).length;unit='на месте';detail='Поле '+s.size+' × '+s.size;ratio=number/(s.tiles.length-1);break;
   case 'snake':number=s.eaten;unit='яблок';detail='Длина '+s.body.length;ratio=s.body.length/256;break;
  }
  $('studio-number').textContent=number;$('studio-unit').textContent=unit;$('studio-detail').textContent=detail;document.querySelector('.meter-value').style.strokeDasharray=Math.max(0,Math.min(100,ratio*100))+' 100';
  $('metric').textContent=typeof $('metric').textContent==='string'&&/^\d{4,}$/.test($('metric').textContent)?Number($('metric').textContent).toLocaleString('ru-RU'):$('metric').textContent;
  for(const b of $('game-tools').children){const label=b.textContent;let name=/Подсказ|Первая|Подсказать/.test(label)?'hint':/Повернуть/.test(label)?'rotate':/фигуру/.test(label)?'place':/Флажок/.test(label)?'flag':/карты|стол|дом/.test(label)?'cards':'eye';if(b.dataset.dir!=null)continue;decorate(b,name,label.replace(/^[✦⚑↻]\s*/,''));}
 }
 function burst(x,y,label,kind='gold'){
  if(reduced())return;const host=document.querySelector('.casual-app'),el=document.createElement('div');el.className='studio-score-pop';el.textContent=label;Object.assign(el.style,{left:x+'px',top:y+'px'});host.append(el);el.animate([{opacity:0,translate:'-50% 8px',scale:.7},{opacity:1,translate:'-50% -14px',scale:1,offset:.22},{opacity:0,translate:'-50% -64px',scale:1.05}],{duration:850,fill:'forwards',easing:'ease-out'}).finished.then(()=>el.remove(),()=>el.remove());
  for(let i=0;i<10;i++){const p=document.createElement('i');p.className='studio-spark '+kind;Object.assign(p.style,{left:x+'px',top:y+'px'});host.append(p);const angle=i*Math.PI/5,dist=22+(i%3)*13;p.animate([{opacity:1,translate:'0 0',scale:1},{opacity:0,translate:`${Math.cos(angle)*dist}px ${Math.sin(angle)*dist}px`,scale:0}],{duration:450+i*17,easing:'ease-out',fill:'forwards'}).finished.then(()=>p.remove(),()=>p.remove());}
 }
 function feedback(G,before,after,action){if(!before)return;const board=$('playfield').getBoundingClientRect();if(after.won&&!before.won){sound('win');burst(board.x+board.width/2,board.y+board.height/2,'Отличная партия');return;}if(G.id==='match3'||G.id==='blocks'&&after.lines>before.lines)return;
  if(G.id==='blocks'&&after.lines>before.lines){sound('place');burst(board.x+board.width/2,board.y+board.height*.4,(after.lines-before.lines)+' линии · ×'+after.combo);}
  else if(G.id==='mahjong'&&after.score>before.score){sound('pair');}
  else if(G.id==='snake'&&after.eaten>before.eaten){sound('gem');const cell=before.food;burst(board.x+(cell%16+.5)/16*board.width,board.y+(Math.floor(cell/16)+.5)/16*board.width,'+100');}
  else if(G.id==='wordsearch'&&after.score>before.score){sound('pair');burst(board.x+board.width/2,board.y+board.height*.4,'Найдено');}
  else if(action.type!=='tick')sound(['place','slide'].includes(action.type)?'place':'tap');
 }
 const medal=won=>`<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="medal-gold" x2="1" y2="1"><stop stop-color="#fff3bc"/><stop offset=".45" stop-color="#b28a3e"/><stop offset=".65" stop-color="#f6dd99"/><stop offset="1" stop-color="#886525"/></linearGradient></defs><circle cx="60" cy="60" r="48" fill="#11281d" stroke="url(#medal-gold)" stroke-width="3"/><circle cx="60" cy="60" r="42" fill="none" stroke="#a38b4e" stroke-width=".7"/><path d="M29 83Q9 60 27 36M91 83Q111 60 93 36M23 72l-11-5 9-3M20 60l-8-8 11 1M23 47l-4-10 9 5M97 72l11-5-9-3M100 60l8-8-11 1M97 47l4-10-9 5" fill="none" stroke="url(#medal-gold)" stroke-width="3" stroke-linecap="round"/><path d="${won?'m60 29 8 20 22 2-17 14 5 22-18-12-18 12 5-22-17-14 22-2Z':'M38 60a22 22 0 1 0 6-16m-6-9v14h14'}" fill="${won?'url(#medal-gold)':'none'}" stroke="url(#medal-gold)" stroke-width="3"/></svg>`;return {update,feedback,burst,sound,svg,medal};
})();
