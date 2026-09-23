'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/домино-правила'), 'utf8');
function load(from, to) {
  assert(source.includes(from)); const context = { module: { exports: {} } };
  vm.runInNewContext(source.replace(from, to), context); return context.module.exports;
}
// Проверяющий должен упасть на специально испорченном правиле, а не просто
// повторить тот же вычислительный код, который проверяет.
function checkJoin(П) {
  const g = П.создать(); g.ход = 0; g.цепь = [{ id: 27, a: 6, b: 6, кто: 1 }]; g.руки[0] = [0, 1];
  assert.throws(() => П.положить(g, 0, 0, 'лево'));
}
function checkPass(П) { const g = П.создать(); g.ход = 0; g.цепь = [{ id: 27, a: 6, b: 6, кто: 1 }]; g.руки[0] = [6]; assert.throws(() => П.пас(g, 0)); }
function checkPrivacy(П) { const g = П.создать(); assert.equal(П.вид(g, 0).руки, null); }
const real = require('../js/домино-правила'); checkJoin(real); checkPass(real); checkPrivacy(real);
assert.throws(() => checkJoin(load("if (!допустимые(g, кто).some(v => v.кость === id && v.конец === конец))", 'if (false)')));
assert.throws(() => checkPass(load('if (допустимые(g, кто).length || g.базар.length)', 'if (false)')));
assert.throws(() => checkPrivacy(load("руки: g.фаза === 'игра' ? null : копия(g.руки)", 'руки: копия(g.руки)')));
console.log('Домино: проверки поймали три намеренных нарушения — неверный стык, незаконный пас и утечку чужой руки.');
