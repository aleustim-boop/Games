'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
if (process.argv[2] === '--самопроверка') {
  const fs = require('node:fs'), os = require('node:os'), { spawnSync } = require('node:child_process');
  const файл = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'deberts-obligation-')), 'rules.js');
  const код = fs.readFileSync(path.join(__dirname, '../js/деберц-правила.js'), 'utf8');
  fs.writeFileSync(файл, код.replace('if (обязанВыбрать(игра)) throw', 'if (false) throw'));
  const ответ = spawnSync(process.execPath, [__filename, файл], { encoding: 'utf8' });
  assert.equal(ответ.status, 1); assert.match(ответ.stderr, /Missing expected exception/);
  console.log('Самопроверка: разрешённый пас на обязе в копии обнаружен — OK'); process.exit(0);
}
const П = require(process.argv[2] ? path.resolve(process.argv[2]) : '../js/деберц-правила.js');
const И = require('../server/игры/деберц.js');
for (const режим of ['2', '3', '4', '2x2']) {
  const n = режим === '2x2' ? 4 : +режим;
  for (let seed = 1; seed <= 60; seed++) {
    let s = seed;
    const и = П.создать(() => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296), 301, true, режим);
    assert.equal(и.жеребьёвка.at(-1).имя, 'Т');
    assert(и.жеребьёвка.slice(0, -1).every(к => к.имя !== 'Т'));
    assert.equal(и.сдающий, (и.жеребьёвка.length - 1) % n);
    for (let k = 0; k < n; k++) {
      assert.deepEqual(П.вариантыКозыря(и), [и.открытая.масть]);
      for (const м of П.масти.filter(м => м !== и.открытая.масть)) {
        const до = JSON.stringify(и);
        assert.throws(() => П.торг(и, и.ход, м)); assert.equal(JSON.stringify(и), до);
      }
      П.торг(и, и.ход, null);
    }
    for (let k = 0; k < n - 1; k++) П.торг(и, и.ход, null);
    assert(П.обязанВыбрать(и));
    const до = JSON.stringify(и);
    assert.throws(() => П.торг(и, и.ход, null), /обяз/); assert.equal(JSON.stringify(и), до);
    const п = { игроки: Array.from({ length: n }, (_, i) => 'игрок' + i), игра: и, завершена: false, проигравшие: [] };
    И.ходЗаБота(п, И.чейХод(п), 'лёгкий');
    assert(['игра', 'конец'].includes(и.фаза));
    if (и.фаза === 'конец') continue;
    const сдающий = и.сдающий;
    while (и.фаза === 'игра' || и.фаза === 'взятка') {
      if (и.фаза === 'игра') П.сыграть(и, и.ход, П.доступные(и, и.ход)[0].id);
      else {
        const кто = П.старшаяКарта(и).игрок;
        const до = и.очки.slice(), сумма = и.стол.reduce((s, к) => s + П.очки(к.карта, и.козырь), 0);
        const послед = и.руки.every(р => !р.length);
        const бела = и.белаСтатус.map((с, i) => с === 'ждёт' && П.команда(и, i) === П.команда(и, кто) ? 20 : 0);
        П.забрать(и);
        assert.equal(и.очки[кто] - до[кто], сумма + (послед ? 10 : 0) + бела[кто]);
        assert(и.очки.every((v, i) => i === кто || v === до[i] + бела[i]));
      }
    }
    assert.equal(и.сдающий, сдающий, 'Обяз завершённой сдачи не меняется до следующей раздачи');
    if (и.фаза === 'итог') {
      const следующий = и.следующийСдающий;
      П.раздать(и); assert.equal(и.сдающий, следующий);
    }
  }
}
console.log('240 сдач: жеребьёвка до туза, оба круга, запрет паса при обязе, бот и последние +10 — OK');
