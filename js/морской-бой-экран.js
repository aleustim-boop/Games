'use strict';
(function () {
  const П = window.МорскойБойПравила, Б = window.МорскойБойБот, $ = id => document.getElementById(id);
  const KEY = 'морской-бой-партия-v1', PREF = 'морской-бой-настройки', HIST = 'морской-бой-история';
  const буквы = 'АБВГДЕЖЗИК', coord = n => буквы[n % 10] + (Math.floor(n / 10) + 1);
  let игра = null, запись = null, черновик = [], вид = null, поСети = false, сетевой = null, цель = null, длина = 4, вертикально = false;
  let busy = false, timer = null, последний = '', итогПоказан = false, audio = null;
  let настройки = { уровень: 'обычный', звук: true };
  const ключЧерновика = v => `морской-бой-расстановка:${v.код}:${v.сыграноПартий || 0}`;
  try { const p = JSON.parse(localStorage.getItem(PREF)); if (p && ['лёгкий', 'обычный', 'сложный'].includes(p.уровень)) настройки = { уровень: p.уровень, звук: p.звук !== false }; } catch (_) {}
  function сохранить() {
    try {
      if (запись && !поСети) { запись.черновик = черновик; localStorage.setItem(KEY, JSON.stringify(запись)); }
      if (поСети && сетевой && вид?.фаза === 'расстановка') sessionStorage.setItem(ключЧерновика(сетевой), JSON.stringify(черновик));
      localStorage.setItem(PREF, JSON.stringify(настройки));
    }
    catch (_) { $('море-память').textContent = 'Браузер запретил сохранение. Не закрывайте текущую партию.'; }
  }
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) { игра = window.МорскойБойПамять.восстановить(s); запись = s; черновик = s.черновик; } }
  catch (_) { $('море-память').textContent = 'Сохранение повреждено. Можно начать новый бой.'; }
  function звук(hit) {
    if (!настройки.звук) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
      const o = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
      o.type = hit ? 'triangle' : 'sine'; o.frequency.setValueAtTime(hit ? 220 : 500, t); o.frequency.exponentialRampToValueAtTime(hit ? 60 : 180, t + .18);
      gain.gain.setValueAtTime(.08, t); gain.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(gain); gain.connect(audio.destination); o.start(t); o.stop(t + .22);
    } catch (_) {}
    window.Телеграм?.отклик?.(hit ? 'выбор' : 'ход');
  }
  function экран(id) {
    clearTimeout(timer); timer = null;
    if (id === 'экран-меню') id = 'экран-лобби';
    document.querySelectorAll('.экран').forEach(e => e.classList.toggle('экран--виден', e.id === id));
    if (id === 'экран-лобби') $('море-продолжить').classList.toggle('скрыт', !игра || игра.фаза === 'конец');
    window.Телеграм?.показатьСтрелку(назад);
    лист.освежитьКнопкуНастроек(id);
  }
  function открыть(id) { if (!$(id).open) $(id).showModal(); }
  function назад() {
    const d = document.querySelector('dialog[open]'); if (d) { d.close(); return; }
    if (лист.открыт()) { лист.закрыть(); return; }
    if ($('экран-игры').classList.contains('экран--виден') && поСети) { открыть('море-подтверждение'); return; }
    if ($('экран-лобби').classList.contains('экран--виден')) { location.href = 'index.html'; return; }
    экран('экран-лобби');
  }
  function история() {
    let a = []; try { a = JSON.parse(localStorage.getItem(HIST)) || []; } catch (_) {}
    $('море-история-список').replaceChildren(...a.map(x => { const p = document.createElement('p'); p.textContent = `${new Date(x.дата).toLocaleDateString('ru-RU')} · ${x.победа ? 'Победа' : 'Поражение'} · ${x.уровень} · ${x.выстрелы} выстрелов`; return p; }));
    if (!a.length) $('море-история-список').textContent = 'Здесь появятся завершённые бои с ботами.';
    открыть('море-история');
  }
  function записатьИтог() {
    if (поСети || запись.итогЗаписан || игра.фаза !== 'конец') return;
    try {
      let a = JSON.parse(localStorage.getItem(HIST)) || [];
      if (!a.some(x => x.id === запись.id)) { a.unshift({ id: запись.id, дата: Date.now(), победа: вид.победа, уровень: запись.уровень, выстрелы: игра.выстрелы[0] }); localStorage.setItem(HIST, JSON.stringify(a.slice(0, 30))); }
      запись.итогЗаписан = true; сохранить();
    } catch (_) {}
  }
  function локально(e) {
    if (e.тип === 'готов') П.готов(игра, e.кто, e.флот);
    else if (e.тип === 'выстрел') П.стрелять(игра, e.кто, e.клетка);
    else П.сдаться(игра, e.кто);
    запись.журнал.push(e); сохранить();
  }
  function новая() {
    clearTimeout(timer); поСети = false; сетевой = null; busy = false; цель = null; итогПоказан = false; последний = '';
    игра = П.создать(игра ? 1 - игра.первый : undefined); черновик = []; длина = 4;
    запись = { версия: 1, id: Date.now().toString(36) + Math.random().toString(36).slice(2), первый: игра.первый, уровень: настройки.уровень, журнал: [], черновик };
    локально({ тип: 'готов', кто: 1, флот: П.случайныйФлот() });
    экран('экран-игры'); рисовать();
  }
  async function действие(действие, поля = {}) {
    if (busy) return;
    busy = true; рисовать();
    try {
      if (поСети) {
        const r = await window.Сеть.отправитьХод({ действие, ...поля });
        if (!r?.принято) $('строка-связи').textContent = r?.причина || 'Связь потеряна. Попробуйте снова.';
        $('строка-связи').classList.toggle('скрыт', !!r?.принято);
      } else локально({ тип: действие, кто: 0, ...поля });
    } catch (e) { $('строка-связи').textContent = e.message; $('строка-связи').classList.remove('скрыт'); }
    finally { busy = false; цель = null; рисовать(); }
  }
  function построитьПоле(id, click) {
    const root = $(id); root.append(document.createElement('span'));
    for (const letter of буквы) { const e = document.createElement('span'); e.textContent = letter; root.append(e); }
    for (let row = 0; row < 10; row++) {
      const label = document.createElement('span'); label.textContent = row + 1; root.append(label);
      for (let col = 0; col < 10; col++) {
        const n = row * 10 + col, e = document.createElement('button'); e.type = 'button'; e.className = 'море-клетка'; e.dataset.клетка = n;
        e.onclick = () => click?.(n); e.setAttribute('aria-label', coord(n)); root.append(e);
        e.onkeydown = ev => { const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -10, ArrowDown: 10 }[ev.key]; if (delta) { ev.preventDefault(); root.querySelector(`[data-клетка="${Math.min(99, Math.max(0, n + delta))}"]`)?.focus(); } };
      }
    }
  }
  function поле(id, marks, fleet, active, selected) {
    const occupied = new Set((fleet || []).flat());
    $(id).querySelectorAll('button').forEach((e, n) => {
      const state = marks?.[n] || 'неизвестно', shown = state === 'неизвестно' && occupied.has(n) ? 'корабль' : state;
      e.dataset.состояние = shown; e.textContent = selected === n ? '⌖' : state === 'мимо' ? '●' : state === 'пусто' ? '·' : ['попадание', 'потоплен'].includes(state) ? '×' : '';
      e.setAttribute('aria-label', `${coord(n)}: ${shown === 'неизвестно' ? 'не проверена' : shown}`);
      e.setAttribute('aria-pressed', String(selected === n)); e.disabled = !active || (id === 'море-поле-врага' && state !== 'неизвестно');
      e.classList.toggle('последняя', !!вид?.последний && вид.последний.клетка === n && ((id === 'море-поле-врага') === вид.последний.ваш));
    });
    window.МорскойБойФлот.рисовать($(id), marks, fleet);
  }
  function разместить(n) {
    if (вид?.готовы[0] || busy) return;
    const i = черновик.findIndex(s => s.includes(n));
    if (i >= 0) { длина = черновик[i].length; черновик.splice(i, 1); }
    else {
      const ship = Array.from({ length: длина }, (_, i) => n + i * (вертикально ? 10 : 1));
      const error = !вертикально && n % 10 + длина > 10 ? 'Корабль выходит за правый край' : П.проверитьФлот([...черновик, ship], false);
      if (error) { $('море-подсказка-расстановки').textContent = error; return; }
      черновик.push(ship); длина = П.СОСТАВ.find(d => черновик.filter(s => s.length === d).length < П.СОСТАВ.filter(v => v === d).length) || 1;
    }
    $('море-подсказка-расстановки').textContent = 'Нажмите на установленный корабль, чтобы убрать и поставить заново.';
    сохранить(); рисовать();
  }
  построитьПоле('море-поле-расстановки', разместить);
  построитьПоле('море-поле-врага', n => { if (вид?.вашХод && !busy) { цель = n; рисовать(); } });
  построитьПоле('море-поле-своё'); построитьПоле('море-поле-большое');
  function расстановка() {
    const ready = вид.готовы[0];
    поле('море-поле-расстановки', null, ready ? вид.своиКорабли : черновик, !ready && !busy, null);
    $('море-готовность').textContent = ready ? 'Флот готов' : `${черновик.length} из 10 кораблей`;
    $('море-корабли').replaceChildren(...[4, 3, 2, 1].map(d => {
      const left = П.СОСТАВ.filter(x => x === d).length - черновик.filter(s => s.length === d).length;
      const b = document.createElement('button'); b.className = 'кнопка'; b.disabled = ready || !left || busy;
      const caption = document.createElement('span'); caption.className = 'море-корабль-подпись'; caption.textContent = `${d} пал. · ${left}`; b.append(caption);
      const preview = document.createElement('img'); preview.src = `img/морской-бой/корабль-${d}.png`; preview.alt = ''; b.prepend(preview);
      b.setAttribute('aria-label', `${d} палубы: осталось ${left}`); b.setAttribute('aria-pressed', String(длина === d)); b.onclick = () => { длина = d; расстановка(); }; return b;
    }));
    for (const id of ['море-повернуть', 'море-случайно', 'море-очистить']) $(id).disabled = ready || busy;
    $('море-готов').disabled = ready || busy || !!П.проверитьФлот(черновик);
    $('море-готов').textContent = ready ? 'Ждём готовности соперника…' : 'Готов к бою';
    if (ready) $('море-подсказка-расстановки').textContent = 'Ваш флот подтверждён. Соперник ещё расставляет корабли.';
  }
  function итог() {
    $('море-итог-заголовок').textContent = вид.победа ? 'Победа!' : 'Бой окончен';
    $('море-итог-подпись').textContent = вид.прерван ? 'Соперник покинул игру. Бой завершён без победителя.' : вид.победа ? 'Ваша тактика принесла победу.' : 'Победил соперник. Попробуем ещё раз?';
    $('море-статистика').replaceChildren(...вид.статистика.map((s, i) => {
      const root = document.createElement('div'), name = document.createElement('b'), num = document.createElement('strong'), caption = document.createElement('small'), p = document.createElement('p');
      name.textContent = i ? 'Соперник' : 'Вы'; num.textContent = `${i ? вид.потеряноВами : вид.потопленоВами}/10`; caption.textContent = 'кораблей потоплено'; p.textContent = `${s.выстрелы} выстрелов · точность ${s.точность}%`;
      root.append(name, num, caption, p); return root;
    }));
    $('море-реванш').disabled = поСети && (сетевой?.яХочуЕщё || сетевой?.соперникУшёл);
    $('море-реванш').textContent = поСети && сетевой?.яХочуЕщё ? 'Ждём согласия соперника…' : поСети && сетевой?.соперникХочетЕщё ? 'Принять реванш' : 'Ещё бой';
    if (!итогПоказан) { итогПоказан = true; открыть('море-результат'); }
  }
  function рисовать() {
    clearTimeout(timer); timer = null;
    if (!поСети && игра) вид = П.вид(игра, 0);
    if (!вид || !$('экран-игры').classList.contains('экран--виден')) return;
    const setup = вид.фаза === 'расстановка';
    $('море-расстановка').hidden = !setup; $('море-бой').hidden = setup;
    $('море-сдаться').textContent = вид.фаза === 'конец' ? 'Результат' : 'Сдаться';
    if (setup) { расстановка(); return; }
    поле('море-поле-врага', вид.вашиВыстрелы, вид.флотСоперника, вид.вашХод && !busy, цель);
    поле('море-поле-своё', вид.поВам, вид.своиКорабли, false, null);
    поле('море-поле-большое', вид.поВам, вид.своиКорабли, false, null);
    $('море-соперник').textContent = поСети ? сетевой?.имяСоперника || 'Соперник' : `Бот · ${запись.уровень}`;
    $('море-счёт-врага').textContent = `Потоплено ${вид.потопленоВами} / 10`;
    $('море-счёт-свой').textContent = `Ваших кораблей: ${10 - вид.потеряноВами} / 10`;
    $('море-очередь').textContent = вид.фаза === 'конец' ? 'Бой окончен' : busy ? 'Выстрел…' : вид.вашХод ? 'Ваш ход' : 'Ход соперника';
    $('море-цель').textContent = 'Цель: ' + (цель == null ? '—' : coord(цель));
    $('море-выстрел').disabled = busy || !вид.вашХод || цель == null;
    const last = вид.последний;
    $('море-событие').textContent = last ? `${last.ваш ? 'Вы' : 'Соперник'} · ${coord(last.клетка)} — ${last.результат === 'попадание' ? 'ранен' : last.результат}` : 'Выберите клетку для выстрела';
    const key = JSON.stringify(last);
    if (last && key !== последний) {
      последний = key; звук(last.результат !== 'мимо');
      window.МорскойБойФлот.эффект($(last.ваш ? 'море-поле-врага' : 'море-поле-своё'), last.клетка, last.результат !== 'мимо');
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const cell = $(last.ваш ? 'море-поле-врага' : 'море-поле-своё').querySelector(`[data-клетка="${last.клетка}"]`);
        cell?.animate([{ filter: 'brightness(3)', transform: 'scale(.85)' }, { filter: 'brightness(1)', transform: 'scale(1)' }], { duration: 550 });
      }
    }
    if (вид.фаза === 'конец') { записатьИтог(); итог(); }
    else if (!поСети && игра.ход === 1 && !busy) timer = setTimeout(() => {
      const n = Б.выстрел(П.вид(игра, 1).вашиВыстрелы, запись.уровень);
      локально({ тип: 'выстрел', кто: 1, клетка: n }); рисовать();
    }, 950);
  }
  const сказать = window.ДеберцСказать(() => ({ поСети, место: i => $(i ? 'море-поле-врага' : 'море-поле-своё'), игроки: [{ индекс: 1, id: вид?.местоСоперника ?? 1, имя: поСети ? сетевой?.имяСоперника || 'Соперник' : 'Бот' }] }));
  const лист = window.ЛистЕщё.подключить({ экраныСЛистом: ['экран-лобби', 'экран-игры', 'море-настройки'], двери: { вМеню: { действие: назад }, какИграть: { действие: () => открыть('море-справка') }, рекорды: { действие: история }, звук: { состояние: () => настройки.звук ? 'вкл' : 'выкл', действие: () => { настройки.звук = !настройки.звук; сохранить(); } } } });
  document.querySelectorAll('[data-назад]').forEach(b => b.onclick = назад);
  document.querySelectorAll('[data-меню]').forEach(b => b.onclick = () => лист.открыть());
  $('море-правила').onclick = () => открыть('море-справка');
  $('море-боты').onclick = () => { экран('море-настройки'); document.querySelectorAll('[data-уровень]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.уровень === настройки.уровень))); };
  document.querySelectorAll('[data-уровень]').forEach(b => b.onclick = () => { настройки.уровень = b.dataset.уровень; сохранить(); $('море-боты').click(); });
  $('море-начать').onclick = () => игра && игра.фаза !== 'конец' ? открыть('море-новая') : новая();
  $('море-новая-да').onclick = () => { $('море-новая').close(); новая(); };
  $('море-продолжить').onclick = () => { поСети = false; черновик = запись.черновик; экран('экран-игры'); рисовать(); };
  $('море-старую').onclick = () => { $('море-новая').close(); $('море-продолжить').click(); };
  $('море-повернуть').onclick = () => { вертикально = !вертикально; $('море-повернуть').textContent = вертикально ? '↻ Вертикально' : '↻ Горизонтально'; };
  $('море-случайно').onclick = () => { черновик = П.случайныйФлот(); сохранить(); рисовать(); };
  $('море-очистить').onclick = () => { черновик = []; длина = 4; сохранить(); рисовать(); };
  $('море-готов').onclick = () => действие('готов', { флот: черновик });
  $('море-выстрел').onclick = () => { if (цель != null) действие('выстрел', { клетка: цель }); };
  $('кнопка-эмоции').onclick = () => сказать.открыть();
  $('море-сдаться').onclick = () => открыть(вид?.фаза === 'конец' ? 'море-результат' : 'море-подтверждение');
  $('море-сдаться-да').onclick = () => { $('море-подтверждение').close(); действие('сдаться'); };
  $('море-посмотреть').onclick = () => $('море-результат').close();
  $('море-в-лобби').onclick = () => { $('море-результат').close(); if (поСети) window.Сеть.покинутьПартию(); поСети = false; экран('экран-лобби'); };
  $('море-реванш').onclick = async () => {
    if (!поСети) { $('море-результат').close(); новая(); return; }
    $('море-реванш').disabled = true; const r = await window.Сеть.отправитьХод({ действие: 'ещё' });
    if (!r?.принято) { $('море-итог-подпись').textContent = r?.причина || 'Не удалось предложить реванш'; $('море-реванш').disabled = false; }
  };
  $('море-увеличить').onclick = () => открыть('море-большой-флот');
  $('кнопка-лобби-назад').onclick = () => location.href = 'index.html';
  $('море-рейтинг').onclick = () => window.ЭкранРейтинга.открыть('морской-бой');
  $('экран-лобби').insertBefore($('кнопка-вернуться-в-игру'), $('море-продолжить'));
  $('море-профиль').onclick = () => window.ЭкранПрофиля.открыть('морской-бой');
  const oldScores = window.ЭкранРейтинга.открытьСчёт;
  window.ЭкранРейтинга.открытьСчёт = game => game === 'морской-бой' ? история() : oldScores(game);
  window.ИграПоСети = {
    начать() { clearTimeout(timer); поСети = true; },
    показатьВид(v) {
      if (!v.море || (сетевой?.код === v.код && v.версия < сетевой.версия)) return;
      const fresh = !сетевой || сетевой.код !== v.код || сетевой.сыграноПартий !== v.сыграноПартий;
      if (fresh) {
        черновик = [];
        if (v.море.фаза === 'расстановка') try {
          const saved = JSON.parse(sessionStorage.getItem(ключЧерновика(v)));
          if (Array.isArray(saved) && !П.проверитьФлот(saved, false)) черновик = saved;
        } catch (_) {}
        цель = null; итогПоказан = false; последний = ''; $('море-результат').close();
      }
      поСети = true; сетевой = v; вид = v.море; экран('экран-игры'); сказать.принять(v); рисовать();
    },
    показатьСвязь(text) { $('строка-связи').textContent = text || ''; $('строка-связи').classList.toggle('скрыт', !text); },
    экран,
    вМеню() { поСети = false; сетевой = null; экран('экран-лобби'); },
    идёт: () => поСети
  };
  window.addEventListener('load', () => window.Телеграм?.показатьСтрелку(назад));
  экран('экран-лобби');
})();
