'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const оригинал = fs.readFileSync(require.resolve('../общее/js/языки'), 'utf8');
function проверить(код) {
  const среда = { module: { exports: {} } };
  vm.runInNewContext(код, среда);
  const я = среда.module.exports;
  assert.equal(я.язык('uk-UA'), 'uk');
  assert.equal(я.язык('EN-us'), 'en');
  assert.equal(я.язык('fr'), 'ru');
  for (const [ключ, строки] of Object.entries(я.словарь)) {
    for (const язык of ['ru', 'uk', 'en']) assert.ok(строки[язык]?.trim(), `${ключ}: ${язык}`);
  }
  assert.equal(я.текст('2 игрока', 'uk'), '2 гравці');
  assert.equal(я.текст('52 карты', 'uk'), '52 карти');
  assert.equal(я.текст('11 карт', 'uk'), '11 карт');
  assert.equal(я.текст('1 карта', 'en'), '1 card');
  assert.equal(я.текст('Ждём, что сделает соперник', 'en'), 'Waiting for opponent');
  assert.equal(я.текст('Соперник отбил 7♥ картой 8♥', 'en'), 'Opponent beats 7♥ with 8♥');
  assert.equal(я.текст('Алексей ходит 7♥', 'en'), 'Алексей plays 7♥');
  assert.equal(я.текст('Бито — в отбой 2 карты, вы добрали 1', 'en'), 'Attack over — 2 cards discarded, you drew 1');
  assert.equal(я.текст('неизвестное имя', 'en'), 'неизвестное имя');
}
проверить(оригинал);
const порча = оригинал.replace("['ru', 'uk', 'en'].includes(код)", "['ru'].includes(код)");
assert.notEqual(порча, оригинал);
assert.throws(() => проверить(порча), 'проверка должна заметить отключённый язык в копии');
console.log('PASS: словарь, язык, склонения, динамические события, сохранение имён; порча копии обнаружена.');
