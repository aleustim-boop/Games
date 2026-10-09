'use strict';
(function () {
  // На входе только карта выстрелов: скрытая расстановка сюда не передаётся.
  function выстрел(карта, уровень = 'обычный', random = Math.random) {
    const доступные = карта.map((v, n) => v === 'неизвестно' ? n : -1).filter(n => n >= 0);
    if (!доступные.length) return null;
    const выбрать = a => a[Math.floor(random() * a.length)];
    if (уровень === 'лёгкий') return выбрать(доступные);
    const длины = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1], посещены = new Set();
    for (let n = 0; n < 100; n++) if (карта[n] === 'потоплен' && !посещены.has(n)) {
      const очередь = [n]; посещены.add(n);
      for (const c of очередь) for (const m of [c - 10, c + 10, c - 1, c + 1]) {
        if (m >= 0 && m < 100 && Math.abs(m % 10 - c % 10) + Math.abs(Math.floor(m / 10) - Math.floor(c / 10)) === 1 && карта[m] === 'потоплен' && !посещены.has(m)) { посещены.add(m); очередь.push(m); }
      }
      const i = длины.indexOf(очередь.length); if (i >= 0) длины.splice(i, 1);
    }
    const раненые = карта.map((v, n) => v === 'попадание' ? n : -1).filter(n => n >= 0);
    const вес = Array(100).fill(0);
    for (const d of длины) for (let n = 0; n < 100; n++) for (const шаг of d === 1 ? [1] : [1, 10]) {
      if (шаг === 1 ? n % 10 + d > 10 : Math.floor(n / 10) + d > 10) continue;
      const к = Array.from({ length: d }, (_, i) => n + i * шаг);
      if (к.some(c => !['неизвестно', 'попадание'].includes(карта[c]))) continue;
      if (раненые.length && !раненые.every(c => к.includes(c))) continue;
      к.forEach(c => { if (карта[c] === 'неизвестно') вес[c] += 1; });
    }
    const max = Math.max(...доступные.map(n => вес[n]));
    if (раненые.length || уровень === 'сложный') return выбрать(доступные.filter(n => вес[n] === max));
    const кандидаты = доступные.filter(n => вес[n] > 0 && (Math.min(...длины) === 1 || (n % 10 + Math.floor(n / 10)) % 2 === 0));
    return выбрать(кандидаты.length ? кандидаты : доступные);
  }
  const api = { выстрел };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.МорскойБойБот = api;
})();
