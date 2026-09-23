'use strict';
(function () {
  const П = typeof module !== 'undefined' && module.exports ? require('./домино-правила') : window.ДоминоПравила;
  function ход(v, уровень = 'обычный', random = Math.random) {
    if (v.фаза !== 'игра' || v.ход !== v.я) return null;
    if (!v.допустимые.length) return { действие: v.базар ? 'базар' : 'пас' };
    if (уровень === 'лёгкий') return { действие: 'кость', ...v.допустимые[Math.floor(random() * v.допустимые.length)] };
    const frequency = Array(7).fill(0);
    v.рука.forEach(id => П.КОСТИ[id].forEach(n => frequency[n]++));
    let best = null, score = -Infinity;
    for (const move of v.допустимые) {
      const [a, b] = П.КОСТИ[move.кость];
      let s = a + b + (a === b ? 2 : 0) + (frequency[a] + frequency[b]) * .3;
      if (уровень === 'сложный' && v.цепь.length) {
        const old = move.конец === 'лево' ? v.цепь[0].a : v.цепь[v.цепь.length - 1].b;
        const next = a === old ? b : a, opponent = (v.я + 1) % v.мест;
        const remains = v.рука.filter(id => id !== move.кость);
        s += remains.filter(id => П.КОСТИ[id].includes(next)).length * 2;
        if (!v.базар && v.отказы.some(p => p.кто === opponent && p.концы.includes(next))) s += 5;
        if (v.количества[opponent] <= 2) s += a + b;
      }
      if (s > score) { score = s; best = move; }
    }
    return { действие: 'кость', ...best };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { ход };
  if (typeof window !== 'undefined') window.ДоминоБот = { ход };
})();
