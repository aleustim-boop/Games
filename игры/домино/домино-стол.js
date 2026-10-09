'use strict';
(function () {
  const $ = id => document.getElementById(id);
  let creating = false;
  function выбрать(select, value) { select.value = String(value); select.dispatchEvent(new Event('change', { bubbles:true })); }
  function переключатель(id, select, values) {
    const root = $(id); root.replaceChildren(...values.map(([value,label]) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.disabled = creating && id.startsWith('дом-онлайн');
      button.setAttribute('role','radio'); button.setAttribute('aria-checked',String(select.value === String(value)));
      button.onclick = () => выбрать(select,value); return button;
    }));
  }
  async function онлайнМесто(index) {
    if (creating) return; creating = true; обновить();
    $('кнопка-создать-игру').disabled = true;
    try {
      const answer = await window.Сеть.создатьКомнату({ открытый:true });
      if (answer?.ок) $('комната-стол').querySelectorAll('button')[index]?.click();
    } finally { creating = false; $('кнопка-создать-игру').disabled = false; обновить(); }
  }
  function стол(prefix, count, bot) {
    const root = $(prefix+'-стол'), n = Number(count.value);
    root.style.setProperty('--мест',String(bot?4:n));
    root.replaceChildren();
    const caption = document.createElement('span'); caption.className = 'дом-выбор-стол__центр';
    caption.textContent = 'ДОМИНО'; root.append(caption);
    // «Вы» внизу; соперник напротив. Дополнительные места — по бокам.
    const positions = [2,0,1,3];
    for (let i=0;i<(bot?4:n);i++) {
      const me = i === 0, filled = i < n;
      const button = document.createElement('button'); button.type='button';
      button.className='рассадка__место рассадка__место--'+(me?'я':bot&&filled?'бот':'свободно');
      button.style.setProperty('--номер-места',bot?positions[i]:n/2+i);
      const face=document.createElement('span'); face.className='дом-место-значок';
      if(me||bot&&filled){const img=document.createElement('img');img.src='img/дурак/значки/'+(me?'avatar':'robot')+'.svg';img.alt='';face.append(img);}else face.textContent='+';
      const name=document.createElement('span');name.className='рассадка__имя';name.textContent=me?'Вы':bot&&filled?'Бот '+i:'Свободно';
      button.append(face,name);button.disabled=me||creating;
      button.setAttribute('aria-label',me?'Ваше место':bot?filled?'Убрать бота '+i:'Посадить бота':'Выбрать игрока на место '+(i+1));
      if(bot&&filled&&n===2){button.disabled=true;button.title='Для игры нужен хотя бы один соперник';}
      button.onclick=()=>bot?выбрать(count,filled?n-1:n+1):онлайнМесто(i);
      root.append(button);
    }
    $(prefix+'-состав').textContent=creating&&!bot?'Создаём стол…':bot?'Вы и '+(n===2?'один бот':n===3?'два бота':'три бота')+' · каждый за себя':n+' места · каждый за себя';
  }
  function обновить() {
    for(const [prefix,countId,goalId,bot] of [['дом-выбор','дом-мест','дом-цель',true],['дом-онлайн','домино-мест-друга','домино-цель-друга',false]]) {
      const count=$(countId),goal=$(goalId);
      переключатель(prefix+'-число',count,[[2,'Двое'],[3,'Трое'],[4,'Четверо']]);
      переключатель(prefix+'-цель',goal,[[50,'50'],[100,'100'],[150,'150']]);
      стол(prefix,count,bot);
    }
    переключатель('дом-выбор-уровень',$('дом-уровень'),[['лёгкий','Лёгкий'],['обычный','Обычный'],['сложный','Сложный']]);
  }
  for(const id of ['дом-мест','дом-цель','дом-уровень','домино-мест-друга','домино-цель-друга']) $(id).addEventListener('change',обновить);
  window.ДоминоСтол={обновить};обновить();
})();
