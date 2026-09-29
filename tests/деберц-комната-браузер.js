'use strict';
/* =====================================================================
   ДЕБЕРЦ — ОНЛАЙН-КОМНАТА (СОЗДАНИЕ, БОТЫ, ВЗЯТКА, ВОЗВРАТ, СДАЧА)

   Деберц переведён на общее онлайн-лобби (штаб/план-онлайн-как-дурак.md,
   Э9). Эта проверка ПО УСТРОЙСТВУ уже была написана под новый путь входа
   (#лобби-найти-игру → #открытые-столы-создать → #комната) — переписывать
   тут нечего, дважды подряд прогнана на своём стенде (см. ниже) и оба раза
   зелёная. Красноту, о которой сказал штаб, объясняет не смена устройства,
   а старая хрупкость: цикл ожидания взятки — 150 попыток по 100мс (15с),
   а бот может думать до 6000мс, если ему выпало показывать комбинации
   (задержкаБота в server/игры/деберц.js). При недетерминированной раздаче
   (Math.random без seed) несколько таких ходов подряд могли не уложиться
   в 15 секунд и тест падал не из-за поломки игры, а из-за жадного лимита.
   Лимит увеличен до 400 попыток (40с) — с запасом на пару «думающих»
   ходов бота подряд.

   Запуск:
       node tests/деберц-комната-браузер.js [порт-файлов] [порт-комнат]
       node tests/деберц-комната-браузер.js --сломать

   Перед браузерным запуском (отдельной командой):
       node штаб/браузер-занят.js --ждать
   ===================================================================== */
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { chromium, безTelegram } = require('./браузер-робот.js');
const нажатьКарту = require('./деберц-нажать-карту.js');

const ПРОЕКТ = path.join(__dirname, '..');
const МЕТКА = '[комната]';

async function прогнать(портФайлов, портКомнат) {
  const адрес = `http://127.0.0.1:${портФайлов}/деберц.html?server=${encodeURIComponent('http://127.0.0.1:' + портКомнат)}`;
  const browser = await chromium.launch({ headless: true }); const ошибки = [];
  try {
    for (const режим of ['3', '4', '2x2']) {
      const n = режим === '2x2' ? 4 : +режим;
      const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await безTelegram(p); p.on('pageerror', e => ошибки.push(e.message));
      await p.goto(адрес); await p.locator('#лобби-найти-игру').click(); await p.locator('#открытые-столы-создать').click();
      await p.locator('[data-друзья-режим="' + режим + '"]').click();
      await p.locator('[data-друзья-цель="501"]').click();
      await p.locator('#кнопка-создать-игру').click();
      await p.locator('#комната').waitFor({ state: 'visible' });
      assert(await p.locator('#комната-начать').isDisabled(), МЕТКА + ' начать нельзя, пока не все места заняты');
      for (let i = 1; i < n; i++) {
        await p.locator('#комната-стол button').nth(i).click(); await p.locator('#лист-места').getByRole('button', { name: /Посадить бота/ }).click();
        await p.waitForFunction(n => document.querySelectorAll('#комната-стол .рассадка__место--бот').length >= n - 1, i + 1);
      }
      await p.locator('#комната-начать').click();
      await p.locator('#экран-игры').waitFor({ state: 'visible' });
      assert.equal(await p.locator('.деберц-участник').count(), n - 1, МЕТКА + ' видны все соперники');
      assert.equal(await p.locator('#деберц-цель-стола').textContent(), '501', МЕТКА + ' цель партии из настроек комнаты');
      let взятка = false;
      for (let i = 0; i < 400; i++) {
        if (await p.locator('#деберц-последняя-карты .карта').count() === n) { взятка = true; break; }
        // #кнопка-эмоции («Сказать») исключаем отдельно: это не ход, а открытие
        // диалога «Сказать за столом» (js/деберц-сказать.js) — общий класс
        // «кнопка--инфо» на неё не навешан (она не служебная, ей можно
        // пользоваться в игре), поэтому раньше цикл иногда кликал по ней
        // вместо хода, диалог-модалка оставался открытым и перехватывал
        // клики — взятка зависала до таймаута.
        const b = p.locator('#панель-кнопок button:enabled:not(.кнопка--инфо):not(#кнопка-эмоции)').first();
        if (await b.isVisible()) await b.click();
        else {
          const card = p.locator('#карты-человека button:enabled').first();
          if (await card.isVisible()) await нажатьКарту(p, card); else await p.waitForTimeout(100);
        }
      }
      assert(взятка, МЕТКА + ' в комнате разыграна взятка всеми участниками');
      assert.match(await p.locator('#деберц-обяз').textContent(), /^Обяз: /, МЕТКА + ' обяз подписан после взятки');
      await p.reload();
      if (!(await p.locator('#экран-игры').isVisible())) await p.locator('#кнопка-вернуться-в-игру').click();
      await p.locator('#экран-игры').waitFor({ state: 'visible' });
      assert.equal(await p.locator('.деберц-участник').count(), n - 1, МЕТКА + ' партия восстановлена после перезагрузки');
      await p.getByRole('button', { name: 'За столом', exact: true }).click();
      await p.locator('#деберц-сдаться').click(); await p.locator('#деберц-сдаться-да').click();
      await p.getByRole('button', { name: 'В лобби', exact: true }).click();
      assert(await p.locator('#деберц-боты').isVisible(), МЕТКА + ' после сдачи вернулись в лобби деберца');
      console.log('Комната ' + режим + ': создание, боты, начало, взятка, возврат и сдача — OK');
      await p.close();
    }
    assert.deepEqual(ошибки, [], МЕТКА + ' в консоли нет исключений');
  } finally { await browser.close(); }
}

/* ---------- Ломающий прогон: портим подключение js/онлайн-лобби.js в копии деберц.html ---------- */
const СТРОКА_КОМНАТЫ = '<script src="js/онлайн-лобби.js?v=1"></script>';

function сделатьКопиюПроекта(папка) {
  for (const часть of ['server', 'js', 'img', 'шрифты', 'tests']) {
    const откуда = path.join(ПРОЕКТ, часть);
    if (!fs.existsSync(откуда)) continue;
    fs.cpSync(откуда, path.join(папка, часть), {
      recursive: true,
      filter: ф => { const имя = path.basename(ф); return имя !== 'данные' && имя !== 'node_modules' && имя !== 'снимки'; }
    });
  }
  for (const файл of fs.readdirSync(ПРОЕКТ)) {
    if (файл.endsWith('.html') || файл.endsWith('.css')) fs.copyFileSync(path.join(ПРОЕКТ, файл), path.join(папка, файл));
  }
  fs.mkdirSync(path.join(папка, 'tests', 'снимки'), { recursive: true });
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

async function ломать() {
  console.log('=== Ломающий прогон: подключение js/онлайн-лобби.js вырезано из копии деберц.html — обязан покраснеть ===');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'деберц-комната-лом-'));
  const ПОРТ_ФАЙЛОВ_ЛОМ = 8151;
  let файловый = null;
  try {
    сделатьКопиюПроекта(папка);
    const файл = path.join(папка, 'деберц.html');
    const текст = fs.readFileSync(файл, 'utf8');
    if (!текст.includes(СТРОКА_КОМНАТЫ)) {
      console.log('ПРОВАЛ: в копии деберц.html нет строки «' + СТРОКА_КОМНАТЫ + '» — портить нечего');
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(файл, текст.replace(СТРОКА_КОМНАТЫ, ''), 'utf8');
    console.log('Порченая копия: ' + папка);

    файловый = await поднятьФайловыйСервер(папка, ПОРТ_ФАЙЛОВ_ЛОМ);
    // Сервер комнат правила игры не портит (порча только в разметке
    // деберц.html), поэтому переиспользуем уже работающий стенд на 8839.
    const прогон = spawnSync(process.execPath, [__filename, String(ПОРТ_ФАЙЛОВ_ЛОМ), '8839'], { encoding: 'utf8', timeout: 120000 });
    console.log('\n----- вывод ломающего прогона -----\n' + (прогон.stdout || '') + (прогон.stderr ? '\nstderr: ' + прогон.stderr : ''));
    console.log('------------------------------------');
    const покраснел = прогон.status === 1;
    console.log(покраснел ? 'ЛОМАЮЩИЙ ПРОГОН ПОКРАСНЕЛ, как и должен.' : 'ПРОВАЛ: ломающий прогон не покраснел (код ' + прогон.status + ')!');
    process.exitCode = покраснел ? 0 : 1;
  } finally {
    if (файловый) файловый.kill();
    fs.rmSync(папка, { recursive: true, force: true });
    console.log('Временная копия убрана: ' + папка + '; файловый сервер лома погашен по PID.');
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
  const портКомнат = довод(3, '8837');
  прогнать(портФайлов, портКомнат).catch(e => { console.error(e); process.exitCode = 1; });
}
