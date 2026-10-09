'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { chromium, безTelegram } = require('./браузер-робот.js');
const И = require('../server/игры/деберц.js');
const П = require('../игры/деберц/деберц-правила.js');

const ПРОЕКТ = path.join(__dirname, '..');

/* Логика проверки (сценарий, все assert) НЕ меняется — только адрес стенда
   вынесен в доводы, чтобы --сломать мог указать на порченую копию проекта
   на своём порту, не трогая порты 8137/8838 обычного прогона. */
async function прогнать(портФайлов, портКомнат) {
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    await безTelegram(p); await p.goto('http://127.0.0.1:' + портФайлов + '/деберц.html?server=http://127.0.0.1:' + портКомнат);
    // Терц/Полтинник перед первой взяткой уводят игру в отдельную ветку
    // «Показываем комбинации перед сбором» (игры/деберц/деберц-экран.js, показКомбинаций):
    // клиентский таймер там продвигает игру только стороне с ОТНОСИТЕЛЬНЫМ
    // ходом 0, а тут проверяется зритель «а», у которого после розыгрыша ход
    // почти никогда не 0 (следующий = игрок+1 по кругу) — показ зависает
    // навсегда, и это не поломка игры, а другая, не тестируемая здесь ветка.
    // Поэтому раздачу с комбинацией (и деберц — 7 козырей, сразу «конец»)
    // честно пересдаём, а не ждём зависающий показ.
    let п, и, попытка = 0;
    for (;;) {
      п = И.раздать(null, { игроки: ['а', 'б', 'в', 'г'], парами: true });
      и = п.игра; и.сдающий = 0; и.ход = 1;
      П.торг(и, 1, и.открытая.масть);
      const комбинацияВыпала = и.фаза !== 'игра' || и.объявления.some(список => список.some(к => ['Терц', 'Полтинник'].includes(к.название)));
      if (!комбинацияВыпала) break;
      assert(++попытка < 500, 'Не удалось пересдать раздачу без Терца/Полтинника/деберца за 500 попыток');
    }
    let версия = 0;
    const показать = () => p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
    await показать(); await p.waitForTimeout(1600);
    assert.match(await p.locator('#статус-хода').innerText(), /Ходит: Игрок 2/);
    for (let k = 0; k < 4; k++) {
      const кто = и.ход, карта = П.доступные(и, кто)[0];
      П.сыграть(и, кто, карта.id); await показать();
      if (кто) {
        const полёт = await p.locator('#стол .карта').last().evaluate((э, кто) => {
          const а = э.getAnimations()[0]; if (!а) return null;
          а.pause(); а.currentTime = 0;
          const r = э.getBoundingClientRect(), от = document.querySelector('[data-игрок="' + кто + '"]').getBoundingClientRect();
          return { ms: а.effect.getTiming().duration, dx: Math.abs(r.x + r.width / 2 - от.x - от.width / 2), dy: Math.abs(r.y + r.height / 2 - от.y - от.height / 2) };
        }, кто);
        assert(полёт && полёт.ms >= 1000, 'Ход соперника виден не менее секунды');
        assert(полёт.dx < 12 && полёт.dy < 12, 'Карта стартует от конкретного игрока: ' + JSON.stringify(полёт));
      }
      await p.locator('#стол .карта').evaluateAll(карты => карты.forEach(к => к.getAnimations().forEach(а => а.finish())));
      await p.waitForTimeout(100);
    }
    const победитель = П.старшаяКарта(и).игрок;
    // В #деберц-статус текст «Взятку забирает: …» вообще не долетает до
    // экрана: игры/деберц/деберц-экран.js сразу после него (строка с «получатель
    // !== null») безусловно переписывает статус на «Карты уходят
    // победителю» — а при комбинации, которую мы тут исключили пересдачей,
    // на «Показываем комбинации перед сбором». Проверяем то, что реально
    // видит игрок.
    assert.match(await p.locator('#деберц-статус').innerText(), /Карты уходят победителю/);
    const цель = победитель ? '[data-игрок="' + победитель + '"]' : '#карты-человека';
    assert(await p.locator(цель).evaluate(э => э.classList.contains('деберц-забирает')));
    П.забрать(и); await показать();
    const уход = await p.locator('#слой-улетающих-карт .карта').evaluateAll(карты => карты.map(к => к.getAnimations()[0]?.effect.getTiming().duration));
    assert.equal(уход.length, 4); assert(уход.every(ms => ms === 750));
    assert(await p.locator('#слой-улетающих-карт .карта').evaluateAll((карты, цель) => {
      const r = document.querySelector(цель).getBoundingClientRect();
      return карты.every(к => {
        const а = к.getAnimations()[0]; а.pause(); а.currentTime = 0;
        const начало = к.getBoundingClientRect();
        const m = а.effect.getKeyframes().at(-1).transform.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/);
        return m && Math.abs(начало.x + начало.width / 2 + +m[1] - r.x - r.width / 2) < 5
          && Math.abs(начало.y + начало.height / 2 + +m[2] - r.y - r.height / 2) < 5;
      });
    }, цель), 'Все карты улетают в центр панели победителя');
    for (const [width, height] of [[320, 640], [1920, 1080]]) {
      await p.setViewportSize({ width, height });
      await показать(); await p.waitForTimeout(1600);
      assert(await p.locator('#деберц-участники').evaluate(э => { const r = э.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
    }
    console.log('Движение: вылет от каждого бота, 1050 мс, сбор 750 мс, выделение хода/победителя и ширина панелей — OK');
  } finally { await b.close(); }
}

/* ---------- Ломающий прогон: портим в КОПИИ игры/деберц/деберц-экран.js текст «Карты уходят победителю» ----------
   Копия во временной папке, файл проекта не трогаем. Без этого текста
   #деберц-статус показывает другую строку, и assert.match на
   /Карты уходят победителю/ обязан упасть — проверка должна это поймать. */
const БЫЛО = "'Карты уходят победителю'";
const СТАЛО = "'Карты летят к победителю'";
const ПОРТ_ФАЙЛОВ_ЛОМ = 8173;
const ПОРТ_КОМНАТ_ЛОМ = 8873;

function сделатьКопиюПроекта(папка) {
  for (const часть of ['server', ...require('./пути-проекта.js').папкиКода(), 'img']) {
    const откуда = path.join(ПРОЕКТ, часть);
    if (!fs.existsSync(откуда)) continue;
    fs.cpSync(откуда, path.join(папка, часть), {
      recursive: true,
      filter: ф => { const имя = path.basename(ф); return имя !== 'данные' && имя !== 'node_modules'; }
    });
  }
  for (const файл of fs.readdirSync(ПРОЕКТ)) {
    if (файл.endsWith('.html') || файл.endsWith('.css')) fs.copyFileSync(path.join(ПРОЕКТ, файл), path.join(папка, файл));
  }
}

function поднятьФайловыйСервер(корень, порт) {
  const сервер = spawn(process.execPath, [path.join(ПРОЕКТ, 'tests', 'локальный-сервер.js'), String(порт)], {
    env: Object.assign({}, process.env, { КОРЕНЬ_СЕРВЕРА: корень }), stdio: 'pipe'
  });
  return new Promise((готово, беда) => {
    let вывод = '';
    const т = setTimeout(() => беда(new Error('файловый сервер не поднялся за 5с')), 5000);
    сервер.stdout.on('data', d => { вывод += d.toString(); if (вывод.includes('запущен')) { clearTimeout(т); готово(сервер); } });
    сервер.on('error', e => { clearTimeout(т); беда(e); });
  });
}

function поднятьСерверКомнат(порт) {
  // Правила и текст статуса тут не портим — реальный сервер из проекта,
  // а не из копии; ему тут достаточно принимать соединение.
  const сервер = spawn(process.execPath, [path.join(ПРОЕКТ, 'server', 'сервер.js'), String(порт), '--без-памяти'], { stdio: 'pipe' });
  return new Promise((готово, беда) => {
    let вывод = '';
    const т = setTimeout(() => беда(new Error('сервер комнат не поднялся за 5с')), 5000);
    сервер.stdout.on('data', d => { вывод += d.toString(); if (вывод.includes('работает')) { clearTimeout(т); готово(сервер); } });
    сервер.on('error', e => { clearTimeout(т); беда(e); });
  });
}

async function ломать() {
  console.log('=== Ломающий прогон: текст «Карты уходят победителю» испорчен в копии игры/деберц/деберц-экран.js — обязан покраснеть ===');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'деберц-движение-лом-'));
  let файловый = null;
  let комнатный = null;
  try {
    сделатьКопиюПроекта(папка);
    const файл = path.join(папка, 'игры', 'деберц', 'деберц-экран.js');
    const текст = fs.readFileSync(файл, 'utf8');
    if (!текст.includes(БЫЛО)) {
      console.log('ПРОВАЛ: в копии игры/деберц/деберц-экран.js нет строки ' + БЫЛО + ' — портить нечего');
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(файл, текст.replace(БЫЛО, СТАЛО), 'utf8');
    console.log('Порченая копия: ' + папка);

    файловый = await поднятьФайловыйСервер(папка, ПОРТ_ФАЙЛОВ_ЛОМ);
    комнатный = await поднятьСерверКомнат(ПОРТ_КОМНАТ_ЛОМ);
    const прогон = spawnSync(process.execPath, [__filename, String(ПОРТ_ФАЙЛОВ_ЛОМ), String(ПОРТ_КОМНАТ_ЛОМ)], { encoding: 'utf8', timeout: 60000 });
    console.log('\n----- вывод ломающего прогона -----\n' + (прогон.stdout || '') + (прогон.stderr ? '\nstderr: ' + прогон.stderr : ''));
    console.log('------------------------------------');
    const покраснел = прогон.status === 1;
    console.log(покраснел ? 'ЛОМАЮЩИЙ ПРОГОН ПОКРАСНЕЛ, как и должен.' : 'ПРОВАЛ: ломающий прогон не покраснел (код ' + прогон.status + ')!');
    process.exitCode = покраснел ? 0 : 1;
  } finally {
    if (файловый) файловый.kill();
    if (комнатный) комнатный.kill();
    fs.rmSync(папка, { recursive: true, force: true });
    console.log('Временная копия убрана: ' + папка + '; файловый сервер и сервер комнат лома погашены по PID.');
  }
}

function довод(индекс, поумолчанию) {
  const з = process.argv[индекс];
  return (з && !з.startsWith('--')) ? з : поумолчанию;
}

if (process.argv.includes('--сломать')) {
  ломать().catch(e => { console.error(e); process.exitCode = 1; });
} else {
  const портФайлов = довод(2, '8137');
  const портКомнат = довод(3, '8838');
  прогнать(портФайлов, портКомнат).catch(e => { console.error(e); process.exitCode = 1; });
}
