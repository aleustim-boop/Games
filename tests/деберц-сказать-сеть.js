'use strict';
const assert = require('node:assert/strict');
const З = require('../js/деберц-знаки.js');
const fs = require('node:fs'), vm = require('node:vm');
const эталон = fs.readFileSync(require.resolve('../js/game.js'), 'utf8');
for (const имя of ['ЭМОЦИИ', 'ФРАЗЫ', 'БРОСКИ']) {
  const от = эталон.indexOf('const ' + имя + ' = [');
  const до = имя === 'ЭМОЦИИ' ? эталон.indexOf(';', от) + 1 : эталон.indexOf('\n];', от) + 3;
  assert.equal(JSON.stringify(З[имя]), JSON.stringify(vm.runInNewContext(эталон.slice(от, до) + '\n' + имя)), 'Каталог совпадает с Дураком');
}
const адрес = 'http://127.0.0.1:' + (process.argv[2] || 8838);
async function запрос(путь, тело) {
  const r = await fetch(адрес + '/' + encodeURIComponent(путь), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(тело) });
  const d = await r.json(); assert.equal(r.status, 200, JSON.stringify(d)); return d;
}
(async () => {
  const х = await запрос('создать', { игра: 'деберц', мест: 4, парами: true, имя: 'Первый' });
  const игроки = [{ код: х.код, пропуск: х.пропуск }];
  try {
    for (let i = 1; i < 4; i++) { const г = await запрос('войти', { код: х.код, имя: 'Игрок ' + i }); игроки.push({ код: х.код, пропуск: г.пропуск }); }
    assert((await запрос('ход', { ...игроки[0], действие: 'начать' })).принято);
    const до = (await запрос('состояние', игроки[0])).состояние.деберц;
    assert(!(await запрос('ход', { ...игроки[0], действие: 'эмоция', номер: 9999 })).принято);
    for (let i = 0; i < 4; i++) {
      const вид = (await запрос('состояние', игроки[i])).состояние;
      const номер = i === 0 ? 0 : i === 1 ? З.ЭМОЦИИ.length : З.ЭМОЦИИ.length + З.ФРАЗЫ.length;
      const ответ = await запрос('ход', { ...игроки[i], действие: 'эмоция', номер, ...(i >= 2 ? { цель: вид.деберц.местаИгроков[1] } : {}) });
      assert(ответ.принято, JSON.stringify(ответ));
      const получатель = (i + 1) % 4;
      const другой = (await запрос('состояние', игроки[получатель])).состояние;
      assert.equal(другой.знакВнимания.номер, номер); assert.equal(другой.знакВнимания.этоЯ, false);
      if (i >= 2) { assert.equal(другой.знакВнимания.вМеня, true); assert.equal(другой.знакВнимания.кому, 0); }
    }
    assert.deepEqual((await запрос('состояние', игроки[0])).состояние.деберц, до, 'Реплики и броски не меняют карты, ход или счёт');
    console.log('Сказать: каталог Дурака, смайлик/фраза/бросок доходят другим игрокам, цель верная, партия неизменна — OK');
  } finally { for (const и of игроки) await запрос('выйти', и); }
})().catch(e => { console.error(e); process.exitCode = 1; });
