'use strict';
(function () {
  // Чужой флот здесь не нужен: силуэты собираются только из открытых
  // клеток «потоплен». До потопления даже длина корабля остаётся тайной.
  function потопленные(marks) {
    const rest = new Set((marks || []).flatMap((v, i) => v === 'потоплен' ? [i] : [])), ships = [];
    while (rest.size) {
      const ship = [rest.values().next().value]; rest.delete(ship[0]);
      for (let i = 0; i < ship.length; i++) {
        const n = ship[i];
        for (const m of [n - 10, n + 10, ...(n % 10 ? [n - 1] : []), ...(n % 10 < 9 ? [n + 1] : [])]) {
          if (rest.delete(m)) ship.push(m);
        }
      }
      ships.push(ship.sort((a,b) => a-b));
    }
    return ships;
  }
  function рисовать(root, marks, fleet) {
    let layer = root.querySelector('.море-флот-слой');
    if (!layer) { layer = document.createElement('div'); layer.className = 'море-флот-слой'; layer.setAttribute('aria-hidden','true'); root.append(layer); }
    const ships = fleet?.length ? fleet : потопленные(marks);
    const key = JSON.stringify([ships, marks]);
    if (layer.dataset.key === key) return;
    layer.dataset.key = key;
    layer.replaceChildren(...ships.map(ship => {
      const first = Math.min(...ship), vertical = ship.length > 1 && ship[1] % 10 === ship[0] % 10;
      const hull = document.createElement('div'); hull.className = 'море-корпус' + (vertical ? ' море-корпус--вертикальный' : '') + (ship.every(n => marks?.[n] === 'потоплен') ? ' море-корпус--потоплен' : '');
      hull.style.gridColumn = `${first % 10 + 1} / span ${vertical ? 1 : ship.length}`;
      hull.style.gridRow = `${Math.floor(first / 10) + 1} / span ${vertical ? ship.length : 1}`;
      hull.style.setProperty('--длина', ship.length);
      const frame = document.createElement('div'); frame.className = 'море-корпус-рисунок';
      const img = document.createElement('img'); img.src = `img/морской-бой/корабль-${ship.length}.png`; img.alt = ''; img.draggable = false;
      frame.append(img); hull.append(frame);
      return hull;
    }), ...(marks || []).flatMap((mark,n) => {
      if (!['попадание','потоплен'].includes(mark)) return [];
      const hit = document.createElement('span'); hit.className = 'море-пробоина'; hit.textContent = '×'; hit.style.gridColumn = n % 10 + 1; hit.style.gridRow = Math.floor(n/10) + 1; return [hit];
    }));
  }
  function эффект(root, n, hit) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cell = root.querySelector(`[data-клетка="${n}"]`); if (!cell) return;
    const box = cell.getBoundingClientRect(), parent = root.getBoundingClientRect();
    const burst = document.createElement('div'); burst.className = 'море-всплеск';
    burst.style.left = box.left - parent.left + box.width / 2 + 'px';
    burst.style.top = box.top - parent.top + box.height / 2 + 'px';
    burst.style.setProperty('--цвет-всплеска', hit ? '#ffb16b' : '#95e0ff');
    root.append(burst);
    for (let i = 0; i < 8; i++) {
      const dot = document.createElement('i'), angle = i * Math.PI / 4;
      burst.append(dot);
      dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(angle)*box.width*.7}px,${Math.sin(angle)*box.height*.7}px) scale(.2)`,opacity:0}],{duration:650,easing:'ease-out',fill:'forwards'});
    }
    const ring = document.createElement('b'); burst.append(ring);
    ring.animate([{transform:'translate(-50%,-50%) scale(.1)',opacity:.9},{transform:'translate(-50%,-50%) scale(1.5)',opacity:0}],{duration:750,easing:'ease-out',fill:'forwards'}).finished.then(()=>burst.remove());
  }
  const api = { рисовать, потопленные, эффект };
  if (typeof window !== 'undefined') window.МорскойБойФлот = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
