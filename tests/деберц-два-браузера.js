'use strict';
/* =====================================================================
   ДЕБЕРЦ — ДВА БРАУЗЕРА, ПОЛНАЯ СЕТЕВАЯ ПАРТИЯ

   Деберц переведён на общее онлайн-лобби (штаб/план-онлайн-как-дурак.md,
   Э9): скрытая кнопка «#кнопка-с-другом» (класс «скрыт», tabindex="-1")
   больше не дверь для живого клика — по ней нельзя щёлкнуть мышью/пальцем,
   Playwright такой клик не делает. Новый вход, как у дурака/нард/шашек:
     хозяин: #лобби-найти-игру → #открытые-столы-создать (эта кнопка сама
       программно нажимает скрытую «кнопка-с-другом» — см.
       js/деберц-экран.js, window.НастройкиЭкранаОнлайн) → #экран-друга
       (цель 501) → #кнопка-создать-игру → код в #код-комнаты.
     гость: #лобби-найти-игру → #открытые-столы-код (жмёт скрытую
       «кнопка-войти-по-коду») → #поле-кода, #кнопка-войти.
   Живой образец такого входа — tests/деберц-комната-браузер.js и
   tests/деберц-как-дурак-браузер.js (обе зелёные, устройство оттуда).
   Восстановление после перезагрузки — тоже не «#кнопка-с-другом» (скрыта),
   а «#кнопка-вернуться-в-игру» (тот же узел, что ставит лобби для плашки
   возврата — см. tests/деберц-комната-браузер.js, строка «if
   (!isVisible) … кнопка-вернуться-в-игру»).

   КОНСОЛЬ: провалом считаются только console.error и pageerror.
   console.warn собирается отдельно и печатается списком в конце —
   он не проваливает проверку (мог быть и раньше, но раньше сюда
   ошибочно попадал под тем же именем «ошибки», что и настоящие сбои).

   ЛОМАЮЩИЙ ПРОГОН (--сломать): копия проекта во временной папке,
   из копии деберц.html вырезано подключение js/онлайн-лобби.js —
   без него #комната не ставится вовсе (js/открытые-столы.js и
   window.НастройкиЭкранаОнлайн остаются рабочими, кнопка «Создать
   комнату» реально создаёт комнату на сервере, но разметку комнаты-05
   ставить некому), код комнаты не появляется, и прогон обязан упасть.
   Файлы проекта не трогаются.

   Запуск:
       node tests/деберц-два-браузера.js [порт-файлов] [порт-комнат]
       node tests/деберц-два-браузера.js --сломать

   Перед браузерным запуском (отдельной командой):
       node штаб/браузер-занят.js --ждать
   ===================================================================== */
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const нажатьКарту = require('./деберц-нажать-карту.js');
const { chromium, безTelegram } = require('./браузер-робот.js');

const ПРОЕКТ = path.join(__dirname, '..');

function адресДля(портФайлов, портКомнат) {
  return 'http://127.0.0.1:' + портФайлов + '/деберц.html?server=' +
    encodeURIComponent('http://127.0.0.1:' + портКомнат);
}

async function прогнать(портФайлов, портКомнат) {
  const адрес = адресДля(портФайлов, портКомнат);
  const браузер = await chromium.launch({ headless: true });
  try {
    const страницы = [];
    const ошибки = [];
    const предупреждения = [];
    for (let i = 0; i < 2; i++) {
      const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 } });
      const с = await контекст.newPage(); await безTelegram(с);
      с.on('pageerror', e => { ошибки.push(e.message); console.error('Ошибка страницы:', e.stack); });
      с.on('console', m => {
        // «Failed to load resource» на telegram-web-app.js — это сам безTelegram()
        // нарочно обрывает запрос к настоящему скрипту Telegram (см.
        // tests/браузер-робот.js), а не поломка игры. Тот же фильтр — в
        // tests/стол-с-кодом-как-в-дураке.js.
        if (m.type() === 'error') {
          if (/Failed to load resource/.test(m.text())) return;
          ошибки.push(m.text()); console.error('Ошибка консоли:', m.text());
        } else if (m.type() === 'warning') { предупреждения.push(m.text()); }
      });
      await с.goto(адрес); страницы.push(с);
    }
    const [а, б] = страницы;

    // Хозяин: «Играть онлайн» → «Создать игру» → #экран-друга (цель 501) → «Создать комнату».
    await а.locator('#лобби-найти-игру').click();
    await а.locator('#открытые-столы-создать').click();
    await а.locator('[data-друзья-цель="501"]').click();
    await а.locator('#кнопка-создать-игру').click();
    await а.waitForFunction(() => /^[A-Z0-9]{4,6}$/.test(document.getElementById('код-комнаты').textContent));
    const код = await а.locator('#код-комнаты').textContent();

    // Гость: «Играть онлайн» → «Есть код? Войти» → код → «Войти».
    await б.locator('#лобби-найти-игру').click();
    await б.locator('#открытые-столы-код').click();
    await б.locator('#поле-кода').fill(код);
    await б.locator('#кнопка-войти').click();

    // Комната заполнена (двое из двух мест) — хозяин жмёт «Начать».
    await а.locator('#комната-начать').waitFor({ state: 'visible' });
    await а.waitForFunction(() => !document.getElementById('комната-начать').disabled);
    await а.locator('#комната-начать').click();

    await Promise.all(страницы.map(с => с.locator('#экран-игры').waitFor({ state: 'visible' })));
    for (const с of страницы) assert.equal(await с.locator('#деберц-цель-стола').textContent(), '501');
    for (const с of страницы) assert.equal(await с.locator('#деберц-имя-соперника').textContent(), 'Друг');
    let конец = false;
    let перезагружено = false;
    let сведенияПроверены = false;
    // Партия идёт до 501 очков — на реальном сервере комнат сбор каждой
    // взятки сам ждёт клиентский таймер (2400/6400мс), и всё это время
    // цикл просто «ждёт 30мс» — на одну раздачу уходит по 400-700 таких
    // шагов. 1500 шагов хватает лишь на 2-3 раздачи из нужных 6-10, дальше
    // тест гаснет по исчерпанию цикла, а не по поломке игры (замечено на
    // ручном прогоне — счёт застыл на «Сдача 3»). Подняли запас с запасом.
    for (let шаг = 0; шаг < 6000; шаг++) {
      if (шаг === 6) {
        await а.reload();
        if (!(await а.locator('#экран-игры').isVisible())) {
          await а.locator('#кнопка-вернуться-в-игру').click();
        }
        await а.locator('#экран-игры').waitFor({ state: 'visible' });
        перезагружено = true;
      }
      if (await а.getByRole('button', { name: 'Реванш', exact: true }).isVisible()) { конец = true; break; }
      if (!сведенияПроверены && await а.locator('#деберц-последняя-карты .карта').count() === 2
          && await а.getByRole('button', { name: 'За столом', exact: true }).isVisible()) {
        await а.getByRole('button', { name: 'За столом', exact: true }).click();
        assert.match(await а.locator('#деберц-очки-я').textContent(), /^\d+$/);
        assert.match(await а.locator('#деберц-очки-друг').textContent(), /^\d+$/);
        await а.locator('#деберц-сведения form button').click();
        сведенияПроверены = true;
      }
      let нажали = false;
      for (const с of страницы) {
        // #кнопка-эмоции («Сказать») исключаем отдельно: это не ход, а открытие
        // диалога «Сказать за столом», общий класс «кнопка--инфо» на неё не
        // навешан — без исключения цикл иногда жал её вместо хода, диалог
        // оставался открытым и перехватывал клики (тот же приём, что в
        // tests/деберц-комната-браузер.js).
        const кнопка = с.locator('#панель-кнопок button:enabled:not(.кнопка--инфо):not(#кнопка-эмоции), #деберц-итог-действия button:enabled').first();
        const карта = с.locator('#карты-человека button:enabled').first();
        if (await кнопка.isVisible() && !['Реванш', 'В меню', 'Рекорды', 'Похвастаться', 'Сыграть с ботом'].includes(await кнопка.textContent())) { await кнопка.click(); нажали = true; break; }
        if (await карта.isVisible()) { await нажатьКарту(с, карта); нажали = true; break; }
      }
      if (!нажали) await а.waitForTimeout(30);
    }
    if (!конец) for (let i = 0; i < страницы.length; i++) await страницы[i].screenshot({ path: 'tests/снимки/деберц-сеть-ошибка-' + i + '.png' });
    assert(конец, 'В двух браузерах сыграна полная партия');
    assert(перезагружено, 'Комната восстановлена после перезагрузки');
    assert(сведенияПроверены, 'Сетевые очки и последняя взятка доступны');
    for (const с of страницы) await с.getByRole('button', { name: 'Реванш', exact: true }).click();
    await а.waitForFunction(() => document.getElementById('счёт-я').textContent === '0');
    for (const с of страницы) assert.equal(await с.locator('#деберц-цель-стола').textContent(), '501');
    await а.getByRole('button', { name: 'За столом', exact: true }).click();
    await а.locator('#деберц-сдаться').click();
    await а.locator('#деберц-сдаться-да').click();
    await б.waitForFunction(() => document.getElementById('деберц-статус').textContent.includes('Вы победили'));
    await а.getByRole('button', { name: 'В меню', exact: true }).click();
    assert(await а.locator('#деберц-боты').isVisible());
    await б.getByRole('button', { name: 'В меню', exact: true }).click();
    assert.deepEqual(ошибки, []);
    if (предупреждения.length) {
      console.log('Предупреждения в консоли (не проваливают проверку, ' + предупреждения.length + ' шт.):');
      for (const п of предупреждения) console.log('  - ' + п);
    } else {
      console.log('Предупреждений в консоли нет.');
    }
    console.log('Деберц: два браузера — выбор 501, создание, код, полная партия, реванш, сдача и выход — OK');
  } finally { await браузер.close(); }
}

/* ---------- Ломающий прогон: портим подключение js/онлайн-лобби.js в копии деберц.html ---------- */
const СТРОКА_КОМНАТЫ = '<script src="js/онлайн-лобби.js?v=1"></script>';
const ПОРТ_ФАЙЛОВ_ЛОМ = 8172;
const ПОРТ_КОМНАТ_ЛОМ = 8872;

function сделатьКопиюПроекта(папка) {
  for (const часть of ['server', 'js', 'img', 'шрифты']) {
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

function поднятьСерверКомнат(корень, порт) {
  const сервер = spawn(process.execPath, [path.join(корень, 'server', 'сервер.js'), String(порт), '--без-памяти'], { stdio: 'pipe' });
  return new Promise((готово, беда) => {
    let вывод = '';
    const т = setTimeout(() => беда(new Error('сервер комнат не поднялся за 5с')), 5000);
    сервер.stdout.on('data', d => { вывод += d.toString(); if (вывод.includes('работает')) { clearTimeout(т); готово(сервер); } });
    сервер.stderr.on('data', d => console.log('  ошибка сервера комнат: ' + d.toString().trim()));
    сервер.on('error', e => { clearTimeout(т); беда(e); });
  });
}

async function ломать() {
  console.log('=== Ломающий прогон: подключение js/онлайн-лобби.js вырезано из копии деберц.html — обязан покраснеть ===');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'деберц-два-браузера-лом-'));
  let файловый = null;
  let комнатный = null;
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
    комнатный = await поднятьСерверКомнат(папка, ПОРТ_КОМНАТ_ЛОМ);
    const прогон = spawnSync(process.execPath, [__filename, String(ПОРТ_ФАЙЛОВ_ЛОМ), String(ПОРТ_КОМНАТ_ЛОМ)], { encoding: 'utf8', timeout: 120000 });
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
  const портКомнат = довод(3, '8837');
  прогнать(портФайлов, портКомнат).catch(e => { console.error(e); process.exitCode = 1; });
}
