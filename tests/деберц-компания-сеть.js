'use strict';
const assert = require('node:assert/strict');
const адрес = 'http://127.0.0.1:' + (process.argv[2] || 8837);
async function запрос(путь, тело) {
  const r = await fetch(адрес + '/' + encodeURIComponent(путь), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(тело) });
  const d = await r.json(); assert.equal(r.status, 200, JSON.stringify(d)); return d;
}
(async () => {
  for (const режим of ['3', '4', '2x2']) {
    const n = режим === '2x2' ? 4 : +режим;
    const хозяин = await запрос('создать', { игра: 'деберц', мест: n, парами: режим === '2x2', цельДеберца: 501, имя: 'Первый' });
    const игроки = [{ код: хозяин.код, пропуск: хозяин.пропуск }];
    try {
      assert.equal(хозяин.состояние.застолом.length, 1); assert(!хозяин.состояние.можноНачать);
      for (let i = 1; i < n; i++) {
        const гость = await запрос('войти', { код: хозяин.код, имя: 'Гость ' + i });
        игроки.push({ код: хозяин.код, пропуск: гость.пропуск });
        if (i === 1) assert.equal((await запрос('ход', { ...игроки[0], действие: 'начать' })).принято, false, 'Нельзя начать неполным составом');
      }
      assert((await запрос('ход', { ...игроки[0], действие: 'начать' })).принято);
      let конец = false;
      for (let шаг = 0; шаг < 5000; шаг++) {
        const виды = await Promise.all(игроки.map(к => запрос('состояние', к)));
        const в = виды.map(x => x.состояние);
        for (const вид of в) {
          assert.equal(вид.деберц.режим, режим); assert.equal(вид.деберц.мест, n); assert.equal(вид.деберц.цель, 501);
          assert.equal(вид.деберц.имена.length, n); assert.equal(вид.деберц.рука.length, вид.деберц.количестваКарт[0]);
          assert(!Object.hasOwn(вид.деберц, 'запас')); assert(!Object.hasOwn(вид.деберц, 'руки'));
        }
        if (в[0].завершена) {
          assert.equal(в.filter(x => x.деберц.победители.includes(0)).length, режим === '2x2' ? 2 : 1); конец = true; break;
        }
        const кто = в.findIndex(x => x.яХожу); assert(кто >= 0);
        const и = в[кто].деберц;
        const ход = и.фаза === 'торговля' ? { действие: 'торг', масть: и.открытая.масть }
          : и.фаза === 'игра' ? { действие: 'карта', id: и.можно[0] }
            : { действие: и.фаза === 'взятка' ? 'взятка' : 'раздача' };
        assert((await запрос('ход', { ...игроки[кто], ...ход })).принято);
      }
      assert(конец);
      for (const к of игроки) assert((await запрос('ход', { ...к, действие: 'ещё' })).принято);
      for (const к of игроки) {
        const и = (await запрос('состояние', к)).состояние.деберц;
        assert.equal(и.режим, режим); assert.equal(и.цель, 501); assert(и.счёт.every(x => x === 0));
      }
      console.log('HTTP: ' + режим + ' — состав, полная партия до 501, победители и реванш — OK');
    } finally { await Promise.all(игроки.map(к => запрос('выйти', к))); }
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
