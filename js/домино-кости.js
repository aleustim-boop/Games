'use strict';
(function () {
  const точки = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  function половина(n) {
    const half = document.createElement('span'); half.className = 'дом-половина'; half.setAttribute('aria-hidden', 'true');
    for (let p = 0; p < 9; p++) { const dot = document.createElement('i'); if (точки[n].includes(p)) dot.className = 'точка'; half.append(dot); }
    return half;
  }
  function кость(a, b, button = false) {
    const root = document.createElement(button ? 'button' : 'span'); root.className = 'дом-кость';
    root.setAttribute('aria-label', `${a}–${b}`); root.append(половина(a), половина(b));
    if (button) root.type = 'button'; return root;
  }
  function цепь(root, chain, last) {
    const columns = Math.max(2, Math.floor(root.clientWidth / 94)), cellW = root.clientWidth / columns, cellH = 94;
    const inner = document.createElement('div'); inner.className = 'дом-цепь-внутри'; inner.style.height = `${Math.max(2, Math.ceil(chain.length / columns)) * cellH}px`;
    const points = chain.map((t, i) => { const row = Math.floor(i / columns), col = row % 2 ? columns - 1 - i % columns : i % columns; return [(col + .5) * cellW, (row + .5) * cellH]; });
    if (points.length > 1) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('aria-hidden', 'true');
      const line = document.createElementNS(svg.namespaceURI, 'polyline'); line.setAttribute('points', points.map(p => p.join(',')).join(' ')); svg.append(line); inner.append(svg);
    }
    chain.forEach((t, i) => {
      const reverse = Math.floor(i / columns) % 2, tile = кость(reverse ? t.b : t.a, reverse ? t.a : t.b);
      tile.classList.add('дом-на-столе'); if (t.a === t.b) tile.classList.add('дом-дубль');
      tile.style.left = `${points[i][0]}px`; tile.style.top = `${points[i][1]}px`; tile.dataset.id = t.id;
      if (last?.тип === 'кость' && last.кость === t.id) tile.classList.add('дом-последняя');
      inner.append(tile);
    });
    const top = root.scrollTop; root.replaceChildren(inner); root.scrollTop = top;
    if (!chain.length) { const p = document.createElement('p'); p.className = 'дом-пустой-стол'; p.textContent = 'Здесь начинается цепь'; root.append(p); }
  }
  window.ДоминоКости = { кость, цепь };
})();
