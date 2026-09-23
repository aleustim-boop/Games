'use strict';
(function () {
  const КОСТИ = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) КОСТИ.push(Object.freeze([a, b]));
  Object.freeze(КОСТИ);
  const копия = x => JSON.parse(JSON.stringify(x));
  const сумма = рука => рука.reduce((s, id) => s + КОСТИ[id][0] + КОСТИ[id][1], 0);
  function колода(random = Math.random) {
    const ids = КОСТИ.map((_, i) => i);
    for (let i = 27; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids;
  }
  function проверитьКолоду(ids) {
    if (!Array.isArray(ids) || ids.length !== 28 || new Set(ids).size !== 28 || ids.some(n => !Number.isInteger(n) || n < 0 || n > 27)) throw Error('Неверный набор костей');
  }
  function раздать(g, ids) {
    проверитьКолоду(ids);
    const deck = ids.slice(), size = g.мест === 2 ? 7 : 5;
    g.руки = Array.from({ length: g.мест }, () => deck.splice(0, size));
    g.базар = deck; g.цепь = []; g.пасы = 0; g.отказы = []; g.итог = null; g.последнее = null;
    const dealt = g.руки.flat();
    const вес = id => { const [a, b] = КОСТИ[id]; return (a === b ? 100 : 0) + (a + b) * 7 + b; };
    g.открывающая = dealt.reduce((a, b) => вес(a) > вес(b) ? a : b);
    g.ход = g.руки.findIndex(r => r.includes(g.открывающая));
    g.фаза = 'игра';
  }
  function создать(мест = 2, цель = 100, ids = колода()) {
    if (![2, 3, 4].includes(мест) || ![50, 100, 150].includes(цель)) throw Error('Неверные настройки');
    const g = { версия: 1, мест, цель, раунд: 1, счёт: Array(мест).fill(0), история: [], победители: [] };
    раздать(g, ids); return g;
  }
  function варианты(hand, chain, opening) {
    if (!chain.length) return hand.includes(opening) ? [{ кость: opening, конец: 'начало' }] : [];
    const left = chain[0].a, right = chain[chain.length - 1].b, result = [];
    for (const id of hand) {
      if (КОСТИ[id].includes(left)) result.push({ кость: id, конец: 'лево' });
      if (КОСТИ[id].includes(right)) result.push({ кость: id, конец: 'право' });
    }
    return result;
  }
  function допустимые(g, кто) {
    return g.фаза === 'игра' && g.ход === кто ? варианты(g.руки[кто], g.цепь, g.открывающая) : [];
  }
  function проверитьХод(g, кто) {
    if (!Number.isInteger(кто) || кто < 0 || кто >= g.мест) throw Error('Неизвестный игрок');
    if (g.фаза !== 'игра') throw Error('Раунд уже завершён');
    if (g.ход !== кто) throw Error('Сейчас ход другого игрока');
  }
  function итог(g, причина, вышел) {
    const остатки = g.руки.map(сумма), min = Math.min(...остатки);
    const lowest = остатки.map((s, i) => s === min ? i : -1).filter(i => i >= 0);
    const победитель = причина === 'выход' ? вышел : lowest.length === 1 ? lowest[0] : -1;
    const прибавка = Array(g.мест).fill(0);
    if (победитель >= 0) прибавка[победитель] = остатки.reduce((s, n) => s + n, 0) - остатки[победитель] * (причина === 'рыба' ? 2 : 1);
    g.счёт = g.счёт.map((s, i) => s + прибавка[i]);
    g.итог = { раунд: g.раунд, причина, победитель, остатки, прибавка, счёт: g.счёт.slice(), руки: копия(g.руки) };
    g.история.push(копия(g.итог));
    g.победители = g.счёт.map((s, i) => s >= g.цель ? i : -1).filter(i => i >= 0);
    g.фаза = g.победители.length ? 'конец' : 'итог'; g.ход = null;
  }
  function положить(g, кто, id, конец) {
    проверитьХод(g, кто);
    if (!допустимые(g, кто).some(v => v.кость === id && v.конец === конец)) throw Error('Эта кость не подходит к выбранному концу');
    let [a, b] = КОСТИ[id];
    if (конец === 'лево' && b !== g.цепь[0].a || конец === 'право' && a !== g.цепь[g.цепь.length - 1].b) [a, b] = [b, a];
    const tile = { id, a, b, кто };
    if (конец === 'лево') g.цепь.unshift(tile); else g.цепь.push(tile);
    g.руки[кто].splice(g.руки[кто].indexOf(id), 1); g.пасы = 0;
    g.последнее = { тип: 'кость', кто, кость: id, конец };
    if (!g.руки[кто].length) итог(g, 'выход', кто); else g.ход = (кто + 1) % g.мест;
  }
  function взять(g, кто) {
    проверитьХод(g, кто);
    if (допустимые(g, кто).length) throw Error('Есть подходящая кость — сыграйте её');
    if (!g.базар.length) throw Error('Базар пуст');
    let сколько = 0;
    do { g.руки[кто].push(g.базар.shift()); сколько++; } while (g.базар.length && !допустимые(g, кто).length);
    g.последнее = { тип: 'базар', кто, сколько };
  }
  function пас(g, кто) {
    проверитьХод(g, кто);
    if (допустимые(g, кто).length || g.базар.length) throw Error('Пасовать нельзя: сыграйте кость или возьмите из базара');
    g.пасы++; g.отказы.push({ кто, концы: [g.цепь[0].a, g.цепь[g.цепь.length - 1].b] });
    g.последнее = { тип: 'пас', кто };
    if (g.пасы === g.мест) итог(g, 'рыба'); else g.ход = (кто + 1) % g.мест;
  }
  function следующий(g, ids = колода()) {
    if (g.фаза !== 'итог') throw Error('Новый раунд пока недоступен');
    проверитьКолоду(ids); g.раунд++; раздать(g, ids);
  }
  function сдаться(g, кто) {
    if (!Number.isInteger(кто) || кто < 0 || кто >= g.мест || g.фаза === 'конец') throw Error('Партия недоступна');
    g.фаза = 'конец'; g.ход = null; g.победители = Array.from({ length: g.мест }, (_, i) => i).filter(i => i !== кто);
    g.последнее = { тип: 'сдача', кто };
  }
  function действие(g, кто, data) {
    if (!data || typeof data !== 'object') throw Error('Неизвестное действие');
    if (data.действие === 'кость') положить(g, кто, data.кость, data.конец);
    else if (data.действие === 'базар') взять(g, кто);
    else if (data.действие === 'пас') пас(g, кто);
    else if (data.действие === 'сдаться') сдаться(g, кто);
    else throw Error('Неизвестное действие');
  }
  function вид(g, я) {
    if (!Number.isInteger(я) || я < 0 || я >= g.мест) throw Error('Неизвестный игрок');
    return { версия: 1, я, мест: g.мест, цель: g.цель, раунд: g.раунд, фаза: g.фаза, ход: g.ход,
      рука: g.руки[я].slice(), количества: g.руки.map(r => r.length), базар: g.базар.length,
      цепь: копия(g.цепь), открывающая: g.цепь.length ? null : g.открывающая,
      счёт: g.счёт.slice(), история: копия(g.история), итог: копия(g.итог),
      последнее: копия(g.последнее), отказы: копия(g.отказы), победители: g.победители.slice(),
      допустимые: допустимые(g, я), руки: g.фаза === 'игра' ? null : копия(g.руки) };
  }
  const api = { КОСТИ, колода, создать, варианты, допустимые, положить, взять, пас, следующий, сдаться, действие, вид, сумма };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ДоминоПравила = api;
})();
