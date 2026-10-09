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
    // Реальная ширина дубля — 39, обычной кости — 78: стыкуем их,
    // а не разбрасываем по одинаковым ячейкам с большими промежутками.
    const edge = 6, right = root.clientWidth - edge;
    let row = 0, cursor = edge;
    const rows = [[]];
    const points = chain.map(t => {
      const width = t.a === t.b ? 39 : 78;
      if (row % 2 ? cursor - width < edge : cursor + width > right) {
        row++; rows.push([]); cursor = row % 2 ? right : edge;
      }
      const reverse = row % 2, x = cursor + (reverse ? -width / 2 : width / 2);
      cursor += (reverse ? -1 : 1) * (width + 3);
      const point = [x, 0, reverse];
      rows[row].push({ point, height:t.a === t.b ? 78 : 39 });
      return point;
    });
    // Между обычными рядами больше не остаётся пустой полосы в полкостяшки.
    // Высоту ряда задаёт самая высокая кость (вертикальный дубль, если он есть).
    let bottom = 7;
    for (const items of rows) {
      const height = Math.max(39, ...items.map(t => t.height));
      items.forEach(t => { t.point[1] = bottom + height / 2; });
      bottom += height + 9;
    }
    const inner = document.createElement('div'); inner.className = 'дом-цепь-внутри'; inner.style.height = `${bottom}px`;
    if (points.length > 1) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('aria-hidden', 'true');
      const line = document.createElementNS(svg.namespaceURI, 'polyline'); line.setAttribute('points', points.map(p => p.slice(0,2).join(',')).join(' ')); svg.append(line); inner.append(svg);
    }
    chain.forEach((t, i) => {
      const reverse = points[i][2], tile = кость(reverse ? t.b : t.a, reverse ? t.a : t.b);
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
