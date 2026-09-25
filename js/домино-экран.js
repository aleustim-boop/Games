'use strict';
(function () {
  const П = window.ДоминоПравила, Б = window.ДоминоБот, К = window.ДоминоКости, $ = id => document.getElementById(id);
  const KEY = 'домино-партия-v1', PREF = 'домино-настройки', HIST = 'домино-история';
  let игра = null, запись = null, вид = null, поСети = false, сетевой = null, selected = null, timer = null, busy = false, resultKey = '', lastKey = '', audio;
  let настройки = { мест: 2, цель: 100, уровень: 'обычный', звук: true };
  try { const p = JSON.parse(localStorage.getItem(PREF)); if (p && [2, 3, 4].includes(p.мест) && [50, 100, 150].includes(p.цель) && ['лёгкий', 'обычный', 'сложный'].includes(p.уровень)) настройки = p; } catch (_) {}
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) { игра = window.ДоминоПамять.восстановить(s); запись = s; } } catch (_) { $('дом-память').textContent = 'Сохранение повреждено. Можно начать новую партию.'; }
  function сохранить() {
    try { localStorage.setItem(PREF, JSON.stringify(настройки)); if (запись && !поСети) localStorage.setItem(KEY, JSON.stringify(запись)); }
    catch (_) { $('дом-память').textContent = 'Браузер запретил сохранение. Не закрывайте текущую партию.'; }
  }
  const имя = i => i === вид?.я ? 'Вы' : вид?.имена?.[i] || `Бот ${i}`;
  const открыть = id => { if (!$(id).open) $(id).showModal(); };
  function экран(id) {
    clearTimeout(timer); timer = null;
    if (id === 'экран-меню') id = 'экран-лобби';
    document.querySelectorAll('.экран').forEach(e => e.classList.toggle('экран--виден', e.id === id));
    $('дом-продолжить').classList.toggle('скрыт', !игра || игра.фаза === 'конец');
    window.Телеграм?.показатьСтрелку(назад); лист.освежитьКнопкуНастроек(id);
  }
  function назад() {
    const d = document.querySelector('dialog[open]'); if (d) { d.close(); return; }
    if (лист.открыт()) { лист.закрыть(); return; }
    if ($('экран-лобби').classList.contains('экран--виден')) { location.href = 'index.html'; return; }
    if ($('экран-игры').classList.contains('экран--виден') && поСети && вид?.фаза !== 'конец') { открыть('дом-подтверждение'); return; }
    экран('экран-лобби');
  }
  function звук() {
    if (!настройки.звук) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
      const o = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
      o.type = 'triangle'; o.frequency.setValueAtTime(340, t); o.frequency.exponentialRampToValueAtTime(95, t + .09);
      gain.gain.setValueAtTime(.07, t); gain.gain.exponentialRampToValueAtTime(.001, t + .13); o.connect(gain); gain.connect(audio.destination); o.start(t); o.stop(t + .14);
    } catch (_) {}
    window.Телеграм?.отклик?.('ход');
  }
  function новая() {
    поСети = false; сетевой = null; selected = null; busy = false; resultKey = ''; lastKey = '';
    const deck = П.колода(); игра = П.создать(настройки.мест, настройки.цель, deck);
    запись = { версия: 1, id: Date.now().toString(36) + Math.random().toString(36).slice(2), мест: настройки.мест, цель: настройки.цель, уровень: настройки.уровень, колода: deck, журнал: [] };
    сохранить(); экран('экран-игры'); рисовать();
  }
  function локально(who, action) {
    if (action.действие === 'раунд') { action.колода = П.колода(); П.следующий(игра, action.колода); }
    else П.действие(игра, who, action);
    запись.журнал.push({ ...action, кто: who }); сохранить();
  }
  async function действие(action) {
    if (busy) return; busy = true; let ошибка = '';
    try {
      if (поСети) { const r = await window.Сеть.отправитьХод(action); if (!r?.принято) throw Error(r?.причина || 'Нет связи. Попробуйте ещё раз.'); }
      else локально(0, action);
      selected = null;
    } catch (e) { ошибка = e.message; }
    finally { busy = false; рисовать(); if (ошибка) $('дом-подсказка').textContent = ошибка; }
  }
  function сохранитьИтог() {
    if (поСети || запись.итогЗаписан || игра.фаза !== 'конец') return;
    try {
      let a = JSON.parse(localStorage.getItem(HIST)) || []; if (!Array.isArray(a)) a = [];
      if (!a.some(x => x.id === запись.id)) { a.unshift({ id: запись.id, дата: Date.now(), победа: игра.победители.includes(0), счёт: игра.счёт, цель: игра.цель, уровень: запись.уровень }); localStorage.setItem(HIST, JSON.stringify(a.slice(0, 30))); }
      запись.итогЗаписан = true; сохранить();
    } catch (_) {}
  }
  /** Пустой узел под «В друзья» на диалоге результата: создаём один раз, переиспользуем. */
  function узелВДрузья() {
    let узел = $('гнездо-друзей');
    if (!узел) { узел = document.createElement('div'); узел.id = 'гнездо-друзей'; узел.className = 'подпись'; $('дом-результат').appendChild(узел); }
    return узел;
  }
  let гнездоДрузейKey = '';   // ключ партии, для которой уже спросили соседей
  /** Спросить соседей по столу — один раз на партию по сети, только когда она доиграна. */
  function освежитьКнопкуВДрузья(key) {
    if (гнездоДрузейKey === key) return;
    if (!window.Сеть || typeof window.Сеть.кнопкаВДрузья !== 'function') return;
    гнездоДрузейKey = key;
    window.Сеть.кнопкаВДрузья(узелВДрузья());
  }
  /** Раунд не последний или партия с ботом — блока «В друзья» здесь быть не должно. */
  function убратьКнопкуВДрузья() {
    гнездоДрузейKey = '';
    const узел = $('гнездо-друзей');
    if (узел) узел.textContent = '';
  }
  function итоги() {
    const end = вид.фаза === 'конец', r = вид.итог;
    $('дом-итог-заголовок').textContent = end ? вид.победители.includes(вид.я) ? 'Вы победили!' : 'Партия завершена' : `Раунд №${вид.раунд}`;
    // Соперник уже позвал реванш, а мы нет — говорим об этом прямо в подписи итога.
    const ждётСоперник = end && поСети && !сетевой.яХочуЕщё && сетевой.соперникХочетЕщё;
    $('дом-итог-подпись').textContent = (вид.прерван ? 'Партия прервана без результата.' : вид.последнее?.тип === 'сдача' ? `${имя(вид.последнее.кто)}: сдача` : r?.причина === 'рыба' ? r.победитель < 0 ? 'Рыба · равный минимум, очки не начисляются' : `Рыба · наименьший остаток: ${имя(r.победитель)}` : r ? `${имя(r.победитель)} выложили все кости` : '')
      + (ждётСоперник ? ' Соперник зовёт сыграть ещё.' : '');
    $('дом-итоги').replaceChildren(...вид.счёт.map((total, i) => {
      const e = document.createElement('div'); e.className = 'дом-итог-игрок';
      const name = document.createElement('b'); name.textContent = имя(i);
      const plus = document.createElement('strong'); plus.textContent = `+${r?.прибавка[i] || 0}`;
      const score = document.createElement('b'); score.textContent = `${total} из ${вид.цель}`;
      const left = document.createElement('small'); left.textContent = `Остаток: ${r?.остатки[i] ?? П.сумма(вид.руки?.[i] || [])}`;
      const hand = document.createElement('div'); hand.className = 'дом-остаток'; (вид.руки?.[i] || []).forEach(id => hand.append(К.кость(...П.КОСТИ[id])));
      e.append(name, plus, score, left, hand); return e;
    }));
    $('дом-раунды').replaceChildren(...вид.история.map(r => { const p = document.createElement('p'); p.className = 'дом-история-строка'; p.textContent = `Раунд ${r.раунд} · ${r.причина === 'рыба' ? 'Рыба' : 'Выход'}: ` + r.прибавка.map((n, i) => `${имя(i)} +${n} (всего ${r.счёт[i]})`).join(' · '); return p; }));
    $('дом-дальше').disabled = busy || (поСети && (end ? сетевой.яХочуЕщё || сетевой.соперникУшёл : !вид.можноПродолжить));
    $('дом-дальше').textContent = end ? поСети && сетевой.яХочуЕщё ? 'Ждём согласия игроков…' : 'Сыграть ещё' : поСети && !вид.можноПродолжить ? 'Ждём хозяина стола…' : 'Следующий раунд';
    $('дом-дальше').classList.toggle('дом-ждём', $('дом-дальше').disabled && !busy);
    const key = `${сетевой?.код || запись?.id}:${сетевой?.сыграноПартий || 0}:${вид.раунд}:${вид.фаза}`;
    if (key !== resultKey) { resultKey = key; открыть('дом-результат'); }
    // «В друзья» — только когда партия по сети доиграна целиком, не после каждого раунда.
    if (end && поСети) освежитьКнопкуВДрузья(key); else убратьКнопкуВДрузья();
  }
  function рисовать() {
    clearTimeout(timer); timer = null;
    if (!поСети && игра) вид = П.вид(игра, 0);
    if (!вид || !$('экран-игры').classList.contains('экран--виден')) return;
    const active = вид.фаза === 'игра', mine = active && вид.ход === вид.я && !busy;
    if (!вид.рука.includes(selected)) selected = null;
    $('дом-раунд').textContent = `Раунд ${вид.раунд} · до ${вид.цель}`;
    $('дом-счёт').replaceChildren(...вид.счёт.map((score, i) => {
      const e = document.createElement('div'); e.className = 'дом-игрок'; e.id = `дом-игрок-${i}`; e.classList.toggle('ходит', active && вид.ход === i);
      const name = document.createElement('b'); name.textContent = имя(i); name.title = имя(i);
      const n = document.createElement('strong'); n.textContent = score; n.setAttribute('aria-label', `${score} очков`);
      const count = document.createElement('small'); count.textContent = `${вид.количества[i]} костей`; e.append(name, n, count);
      if (i !== вид.я) {
        const backs = document.createElement('span'); backs.className = 'дом-закрытые'; backs.setAttribute('aria-hidden', 'true');
        for (let j = 0; j < Math.min(вид.количества[i], 7); j++) backs.append(document.createElement('i'));
        e.append(backs);
      }
      return e;
    }));
    $('дом-базар').textContent = `Базар: ${вид.базар} костей`;
    К.цепь($('дом-цепь'), вид.цепь, вид.последнее);
    if ($('дом-обзор').open) К.цепь($('дом-цепь-большая'), вид.цепь, вид.последнее);
    const last = вид.последнее, key = `${вид.раунд}:${вид.цепь.length}:${JSON.stringify(last)}`;
    if (last && key !== lastKey) {
      lastKey = key;
      if (last.тип === 'кость') {
        звук(); const tile = $('дом-цепь').querySelector(`[data-id="${last.кость}"]`);
        tile?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (tile && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const to = tile.getBoundingClientRect(), from = $(`дом-игрок-${last.кто}`).getBoundingClientRect();
          tile.animate([{ translate: `${from.x - to.x}px ${last.кто === вид.я ? 120 : from.y - to.y}px`, opacity: .3 }, { translate: '0 0', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' });
        }
      }
    }
    const options = вид.допустимые.filter(v => v.кость === selected);
    $('дом-лево').textContent = вид.цепь.length ? `← ${вид.цепь[0].a} · слева` : 'Начать цепь';
    $('дом-право').textContent = вид.цепь.length ? `${вид.цепь[вид.цепь.length - 1].b} · справа →` : 'Правый конец';
    $('дом-лево').disabled = !mine || !options.some(m => ['лево', 'начало'].includes(m.конец));
    $('дом-право').disabled = !mine || !options.some(m => m.конец === 'право');
    $('дом-очередь').classList.toggle('ваш', mine);
    $('дом-кто').textContent = !active ? 'Раунд завершён' : busy ? 'Ход отправляется' : mine ? 'Ваш ход' : `Ходит ${имя(вид.ход)}`;
    $('дом-кто').classList.toggle('дом-ждём', active && !mine);
    const lastText = last?.тип === 'базар' ? `${имя(last.кто)}: взято ${last.сколько}` : last?.тип === 'пас' ? `${имя(last.кто)}: пас` : 'Очередь по часовой стрелке';
    $('дом-подсказка').textContent = mine ? !вид.цепь.length ? `Начните с ${П.КОСТИ[вид.открывающая].join('–')}` : selected !== null ? 'Выберите подсвеченный конец на столе' : вид.допустимые.length ? 'Выберите подходящую кость' : вид.базар ? 'Нет подходящей кости — возьмите из базара' : 'Нет хода и базар пуст — пасуйте' : lastText;
    const scroll = $('дом-рука').scrollTop;
    $('дом-рука').style.setProperty('--костей', Math.max(1, Math.min(7, вид.рука.length)));
    $('дом-рука').replaceChildren(...вид.рука.slice().sort((a, b) => a - b).map(id => {
      const tile = К.кость(...П.КОСТИ[id], true); tile.dataset.id = id;
      const legal = вид.допустимые.some(v => v.кость === id); tile.dataset.можно = legal;
      tile.disabled = !mine || !legal; tile.setAttribute('aria-pressed', String(selected === id));
      tile.onclick = () => { selected = selected === id ? null : id; рисовать(); }; return tile;
    })); $('дом-рука').scrollTop = scroll;
    $('дом-рука-подпись').textContent = `Ваша рука · ${вид.рука.length} костей` + ($('дом-рука').scrollHeight > $('дом-рука').clientHeight + 2 ? ' · ↕ листайте' : '');
    $('дом-действие').textContent = !active ? 'Результат раунда' : !mine ? 'Ждём хода' : вид.допустимые.length ? selected === null ? 'Выберите кость' : 'Выберите конец на столе' : вид.базар ? `Взять из базара · ${вид.базар}` : 'Пас';
    $('дом-действие').disabled = busy || active && (!mine || !!вид.допустимые.length);
    if (!active) { if (вид.фаза === 'конец') сохранитьИтог(); итоги(); }
    else if (!поСети && игра.ход !== 0 && !busy) timer = setTimeout(() => { const who = игра.ход; локально(who, Б.ход(П.вид(игра, who), запись.уровень)); рисовать(); }, 1100);
  }
  function история() {
    let items = []; try { items = JSON.parse(localStorage.getItem(HIST)) || []; } catch (_) {}
    if (!Array.isArray(items)) items = [];
    $('дом-история-список').replaceChildren(...items.map(x => { const p = document.createElement('p'); p.className = 'дом-история-строка'; p.textContent = `${new Date(x.дата).toLocaleDateString('ru-RU')} · ${x.победа ? 'Победа' : 'Поражение'} · ${x.счёт.join(' : ')} · до ${x.цель}`; return p; }));
    if (!items.length) $('дом-история-список').textContent = 'Здесь появятся завершённые партии с ботами.';
    открыть('дом-история');
  }
  const сказать = window.ДеберцСказать(() => ({ поСети, место: i => $(`дом-игрок-${i}`), игроки: вид ? вид.количества.map((_, i) => ({ индекс: i, id: вид.местаИгроков?.[i] ?? i, имя: имя(i) })).filter(p => p.индекс !== вид.я) : [] }));
  const лист = window.ЛистЕщё.подключить({ экраныСЛистом: ['экран-лобби', 'экран-игры', 'дом-настройки'], двери: {
    вМеню: { действие: назад },
    завершить: { видна: () => $('экран-игры').classList.contains('экран--виден') && вид?.фаза !== 'конец',
      текст: () => 'Вы сдадитесь. Остальным участникам будет записана победа.', действие: () => действие({ действие: 'сдаться' }) },
    какИграть: { действие: () => открыть('дом-справка') }, рекорды: { действие: история },
    звук: { состояние: () => настройки.звук ? 'вкл' : 'выкл', действие: () => { настройки.звук = !настройки.звук; сохранить(); } }
  } });
  document.querySelectorAll('[data-назад]').forEach(e => e.onclick = назад);
  document.querySelectorAll('[data-меню]').forEach(e => e.onclick = () => лист.открыть());
  $('дом-боты').onclick = () => { for (const key of ['мест', 'цель', 'уровень']) $(`дом-${key}`).value = настройки[key]; window.ДоминоСтол?.обновить(); экран('дом-настройки'); };
  $('дом-начать').onclick = () => {
    настройки.мест = Number($('дом-мест').value); настройки.цель = Number($('дом-цель').value); настройки.уровень = $('дом-уровень').value; сохранить();
    if (игра && игра.фаза !== 'конец') открыть('дом-новая'); else новая();
  };
  $('дом-новая-да').onclick = () => { $('дом-новая').close(); новая(); };
  $('дом-продолжить').onclick = () => { поСети = false; resultKey = ''; экран('экран-игры'); рисовать(); };
  $('дом-старую').onclick = () => { $('дом-новая').close(); $('дом-продолжить').click(); };
  $('дом-лево').onclick = () => действие({ действие: 'кость', кость: selected, конец: вид.цепь.length ? 'лево' : 'начало' });
  $('дом-право').onclick = () => действие({ действие: 'кость', кость: selected, конец: 'право' });
  $('дом-действие').onclick = () => вид.фаза === 'игра' ? действие({ действие: вид.базар ? 'базар' : 'пас' }) : открыть('дом-результат');
  $('дом-правила').onclick = () => открыть('дом-справка');
  $('кнопка-эмоции').onclick = () => сказать.открыть();
  $('дом-увеличить').onclick = () => { открыть('дом-обзор'); К.цепь($('дом-цепь-большая'), вид.цепь, вид.последнее); };
  $('дом-сдаться').onclick = () => { $('дом-подтверждение').close(); действие({ действие: 'сдаться' }); };
  $('дом-посмотреть').onclick = () => $('дом-результат').close();
  $('дом-в-лобби').onclick = () => { $('дом-результат').close(); if (поСети) window.Сеть.покинутьПартию(); поСети = false; экран('экран-лобби'); };
  $('дом-дальше').onclick = async () => {
    if (вид.фаза === 'итог') { $('дом-результат').close(); await действие({ действие: 'раунд' }); }
    else if (!поСети) { $('дом-результат').close(); новая(); }
    else { $('дом-дальше').disabled = true; const r = await window.Сеть.отправитьХод({ действие: 'ещё' }); if (!r?.принято) { $('дом-итог-подпись').textContent = r?.причина || 'Нет связи'; $('дом-дальше').disabled = false; } }
  };
  $('кнопка-лобби-назад').onclick = () => location.href = 'index.html';
  $('дом-рейтинг').onclick = () => window.ЭкранРейтинга.открыть('домино');
  $('дом-профиль').onclick = () => window.ЭкранПрофиля.открыть('домино');
  $('экран-лобби').insertBefore($('кнопка-вернуться-в-игру'), $('дом-продолжить'));
  const oldScores = window.ЭкранРейтинга.открытьСчёт;
  window.ЭкранРейтинга.открытьСчёт = game => game === 'домино' ? история() : oldScores(game);
  window.ИграПоСети = {
    начать() { clearTimeout(timer); поСети = true; },
    показатьВид(v) {
      if (!v.домино || сетевой?.код === v.код && v.версия < сетевой.версия) return;
      if (!сетевой || сетевой.код !== v.код || сетевой.сыграноПартий !== v.сыграноПартий || вид?.раунд !== v.домино.раунд) selected = null;
      if (!сетевой || сетевой.код !== v.код || сетевой.сыграноПартий !== v.сыграноПартий || v.домино.фаза === 'игра') $('дом-результат').close();
      поСети = true; сетевой = v; вид = v.домино; экран('экран-игры'); сказать.принять(v); рисовать();
    },
    показатьСвязь(text) { $('строка-связи').textContent = text || ''; $('строка-связи').classList.toggle('скрыт', !text); },
    экран, вМеню() { поСети = false; сетевой = null; экран('экран-лобби'); }, идёт: () => поСети
  };
  $('кнопка-комната-назад')?.addEventListener('click', () => $('кнопка-комната-отмена').click());
  $('кнопка-комната-ещё')?.addEventListener('click', () => открыть('дом-справка'));
  window.addEventListener('resize', () => {
    if (вид && $('экран-игры').classList.contains('экран--виден')) {
      К.цепь($('дом-цепь'), вид.цепь, вид.последнее);
      if ($('дом-обзор').open) К.цепь($('дом-цепь-большая'), вид.цепь, вид.последнее);
    }
  });
  window.addEventListener('load', () => window.Телеграм?.показатьСтрелку(назад));
  экран('экран-лобби');
})();
