'use strict';
const assert = require('node:assert/strict'), { execFileSync } = require('node:child_process');
const commit = process.argv[2] || 'HEAD';
const site = 'https://aleustim-boop.github.io/Games/', backend = 'https://amongst-hunting-idaho-blocks.trycloudflare.com';
(async () => {
  const paths = ['домино.html','style-домино.css','js/домино-правила.js','js/домино-бот.js','js/домино-память.js','js/домино-кости.js','js/домино-экран.js','index.html','js/сеть.js','js/game.js','js/telegram.js','js/дурак-комната.js','js/рейтинг-экран.js'];
  for (const file of paths) {
    const r = await fetch(site + file.split('/').map(encodeURIComponent).join('/') + '?audit=' + commit); assert.equal(r.status, 200, file);
    const text = await r.text(), expected = execFileSync('git', ['show', commit + ':' + file], { encoding: 'utf8', maxBuffer: 8e6 });
    assert.equal(text.replace(/\r\n/g, '\n'), expected.replace(/\r\n/g, '\n'), file + ': публикация отличается');
  }
  const health = await (await fetch(backend + '/здоровье')).json(); assert(health.живой);
  const req = async (action, body) => { const r = await fetch(backend + '/' + encodeURIComponent(action), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); assert.equal(r.status, 200); return r.json(); };
  const people = [];
  try {
    const a = await req('создать', { игра: 'домино', имя: 'Проверка публикации', мест: 2, цельДомино: 50 }); people.push({ код: a.код, пропуск: a.пропуск });
    const b = await req('войти', { код: a.код, имя: 'Проверка связи' }); people.push({ код: a.код, пропуск: b.пропуск });
    assert.equal((await req('ход', { ...people[0], действие: 'начать' })).принято, true);
    const view = (await req('состояние', people[0])).состояние;
    assert.equal(view.домино.цель, 50); assert.equal(view.домино.руки, null);
    const current = view.домино.ход, mine = (await req('состояние', people[current])).состояние.домино;
    assert.equal((await req('ход', { ...people[current], действие: 'кость', ...mine.допустимые[0] })).принято, true);
    console.log(`Публикация: ${paths.length} файлов совпали с ${commit}; боевой сервер создаёт домино, скрывает чужие кости и принимает правильный первый ход.`);
  } finally { for (const p of people) await req('выйти', p); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
