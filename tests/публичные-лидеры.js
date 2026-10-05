'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
process.env.ДАННЫЕ_ИГРЫ = fs.mkdtempSync(path.join(os.tmpdir(), 'games-top-'));
const недельный = require('../server/недельный-счёт');
const рейтинг = require('../server/рейтинг');
const раздача = require('../server/раздача-дня');
const публичные = require('../server/публичные-лидеры');
const день = раздача.ключДня();
const игрок = (номер, имя, победил) => ({ номер, имя, победил, этоБот: false });
const имяОпасное = '<img src=x onerror=alert(1)>';

async function запустить() {
  fs.mkdirSync(path.dirname(рейтинг.ФАЙЛ), { recursive: true });
  fs.writeFileSync(рейтинг.ФАЙЛ, JSON.stringify({ игроки: [{ игра: 'дурак', номер: 810001, имя: 'Прошлый чемпион', очки: 9000, побед: 900, партий: 900, последняяИгра: день }] }));
  рейтинг.загрузить();
  рейтинг.включитьЗапись();
  раздача.включитьЗапись();
  assert.deepEqual(рейтинг.лидерыНедели(['дурак']).игры[0].лидеры, [], 'общий счёт не выдают за недельный');
  const застолье = [игрок(810002, имяОпасное, true), игрок(810003, 'Лада', false)];
  рейтинг.учестьПартию('дурак', застолье, 'top-test-game');
  рейтинг.учестьПартию('дурак', застолье, 'top-test-game');
  assert.equal(рейтинг.срезДляИгрока('дурак', 810002).я.очки, 10);
  const запись = JSON.parse(fs.readFileSync(рейтинг.ФАЙЛ, 'utf8')).игроки.find(и => и.номер === 810002);
  assert.equal(запись.недельный.очки, 10);
  assert.equal(запись.недельный.партий, 1, 'повтор не удваивает неделю');
  const до = рейтинг.лидерыНедели(['дурак']);
  delete require.cache[require.resolve('../server/рейтинг')];
  const перезапуск = require('../server/рейтинг');
  assert.deepEqual(перезапуск.лидерыНедели(['дурак']), до, 'неделя переживает перезапуск');
  assert.equal(раздача.записать(день, 810004, 'победа', 40, 'Марко').ок, true);
  assert.equal(раздача.записать(день, 810005, 'победа', 30, 'Олена').ок, true);
  assert.equal(раздача.публичныеЛидеры(день)[0].имя, 'Олена');
  delete require.cache[require.resolve('../server/раздача-дня')];
  assert.deepEqual(require('../server/раздача-дня').публичныеЛидеры(день), раздача.публичныеЛидеры(день));
  const сервер = require('../server/сервер').создатьСервер();
  await new Promise(г => сервер.listen(0, '127.0.0.1', г));
  return { url: 'http://127.0.0.1:' + сервер.address().port, close: async () => { сервер.closeAllConnections(); await new Promise(г => сервер.close(г)); } };
}

async function проверить() {
  assert.equal(недельный.началоНедели('2026-10-04'), '2026-09-28');
  assert.equal(недельный.началоНедели('2026-10-05'), '2026-10-05');
  const запись = { номер: 1, имя: 'Игрок проверки' };
  недельный.добавить(запись, '2026-10-04', 10, true);
  assert.equal(недельный.список([запись], '2026-10-05', () => false).length, 0);
  недельный.добавить(запись, '2026-10-05', 2, true);
  assert.equal(запись.недельный.очки, 2);
  assert.equal(недельный.список([запись], '2026-10-05', () => true).length, 0, 'искусственные игроки не в публичном списке');
  let время = 1000, обращений = 0;
  const кэш = публичные.создать({ лидерыНедели() { обращений++; return { неделяС: '2026-09-28', сегодня: '2026-10-04', учётС: '2026-10-04', игры: Array.from({ length: 11 }, () => ({ лидеры: [] })) }; } }, { публичныеЛидеры: () => [] }, () => время);
  const первый = кэш();
  время = 60999;
  assert.equal(кэш(), первый);
  assert.equal(обращений, 1);
  время = 61000;
  кэш();
  assert.equal(обращений, 2);
  assert.match(первый.html, /Первое место свободно/);
  const стенд = await запустить();
  try {
    for (const путь of ['/top', '/top/']) {
      const ответ = await fetch(стенд.url + путь);
      assert.equal(ответ.status, 200);
      assert.equal(ответ.headers.get('cache-control'), 'public, max-age=60');
      const html = await ответ.text();
      assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
      assert.doesNotMatch(html, /<img src=x/);
      assert.match(html, /Олена/);
      assert.match(html, /og:image/);
      assert.match(html, /start=src_top/);
      assert.doesNotMatch(html, /81000[1-5]|tg:\/\/|data-user|<script/);
    }
    const данные = await (await fetch(стенд.url + encodeURI('/публичные-лидеры'))).json();
    assert.equal(данные.игры.length, 11);
    assert.equal(данные.головоломки.length, 6);
    for (const л of [...данные.игры.flatMap(и => и.лидеры), ...данные.головоломки.flatMap(и => и.лидеры), ...данные.раздача]) assert.deepEqual(Object.keys(л).sort(), ['имя', 'место']);
    assert.equal((await fetch(стенд.url + '/top', { method: 'HEAD' })).status, 200);
    // Портим только копию в памяти: отсутствие экранирования обязано обнаруживаться.
    const исходник = fs.readFileSync(require.resolve('../server/публичные-лидеры'), 'utf8');
    const порча = исходник.replace('экранировать(л.имя)', 'л.имя');
    assert.notEqual(порча, исходник);
    const среда = { module: { exports: {} }, require: require('module').createRequire(require.resolve('../server/публичные-лидеры')) };
    vm.runInNewContext(порча, среда);
    assert.throws(() => assert.doesNotMatch(среда.module.exports.нарисовать(данные), /<img src=x/));
    console.log('PASS: настоящие рейтинг, запись, перезапуск, смена недели, раздача дня, GET/HEAD, минутный кэш, приватность и защита HTML; порча обнаружена.');
  } finally { await стенд.close(); }
}
module.exports = { запустить };
if (require.main === module) проверить().catch(е => { console.error(е); process.exitCode = 1; });
