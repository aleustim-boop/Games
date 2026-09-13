'use strict';
/* =====================================================================
   ПРОВЕРКА НОВОГО ЛОББИ ШАШЕК (не закоммичено на момент проверки).

   Что здесь проверяется — то, что руками через обычный клик по кнопке
   не устроить: подмена файла (запасной путь) и пункт «Настройки» в меню
   самого Telegram (нужен поддельный Telegram, обычный клик мышкой сюда
   не дотянется).

   Запуск (стенд уже поднят, например tests/локальный-сервер.js 8797):
       node tests/лобби-шашек-новое.js          порт 8080
       node tests/лобби-шашек-новое.js 8797     другой порт
       node tests/лобби-шашек-новое.js 8797 8796   плюс сервер комнат
         на 8796 (для блока 3 — «мост сети и возврат в лобби»)

   Написано тестировщиком, живёт в tests/, игру не трогает.
   ===================================================================== */

const { chromium, подготовитьПодделку, безTelegram, перехватить } = require('./браузер-робот.js');

const ПОРТ = Number(process.argv[2]) || 8080;
const ПОРТ_СЕРВЕРА = Number(process.argv[3]) || 0;
const АДРЕС = 'http://127.0.0.1:' + ПОРТ + '/шашки.html';

let провалов = 0;
function проверить(условие, слова) {
  if (условие) console.log('  ок   — ' + слова);
  else { провалов++; console.log('  ПЛОХО— ' + слова); }
}

(async () => {
  const браузер = await chromium.launch();

  /* ---------------- 1. Пункт «Настройки» из ЛОББИ (поддельный Telegram) ---------------- */
  console.log('\n=== 1. Пункт «Настройки» в меню Telegram работает из лобби ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    const стартовыйЭкран = await страница.evaluate(() => {
      const лобби = document.getElementById('экран-лобби');
      const режимов = document.getElementById('экран-режимов');
      return {
        лоббиВиден: Boolean(лобби && лобби.classList.contains('экран--виден')),
        режимовВиден: Boolean(режимов && режимов.classList.contains('экран--виден'))
      };
    });
    проверить(стартовыйЭкран.лоббиВиден && !стартовыйЭкран.режимовВиден,
      'страница открылась на лобби, а не на старом экране «с кем играть»');

    // Нажимаем пункт «Настройки» прямо в меню Telegram (подделка)
    await страница.evaluate(() => window.ПоддельныйТелеграм.нажатьНастройки());
    await страница.waitForTimeout(200);
    const листОткрытИзЛобби = await страница.evaluate(() => {
      const лист = document.getElementById('лист-игры');
      return Boolean(лист && !лист.classList.contains('скрыт'));
    });
    проверить(листОткрытИзЛобби, 'по пункту «Настройки» лист «Ещё» открылся прямо из лобби');

    // Закрываем и переходим на стол, проверяем что там тоже работает (как раньше)
    await страница.evaluate(() => {
      const кнопка = document.getElementById('лист-игры-закрыть') || document.querySelector('#лист-игры button');
      if (кнопка) кнопка.click();
    });
    await страница.waitForTimeout(150);
    await страница.click('#лобби-боты');
    await страница.waitForTimeout(300);
    await страница.evaluate(() => window.ПоддельныйТелеграм.нажатьНастройки());
    await страница.waitForTimeout(200);
    const листОткрытСоСтола = await страница.evaluate(() => {
      const лист = document.getElementById('лист-игры');
      return Boolean(лист && !лист.classList.contains('скрыт'));
    });
    проверить(листОткрытСоСтола, 'по пункту «Настройки» лист «Ещё» открылся и со стола (как раньше)');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* ---------------- 2. Запасной путь: js/шашки-лобби.js не доехал ---------------- */
  console.log('\n=== 2. Запасной путь — файл js/шашки-лобби.js заблокирован ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      // Отказ загрузки шашки-лобби.js — наших рук дело, это и есть проверка запасного пути
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await безTelegram(страница);
    await перехватить(страница, 'шашки-лобби.js', (путь) => путь.abort());
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    const экраны = await страница.evaluate(() => {
      const лобби = document.getElementById('экран-лобби');
      const режимов = document.getElementById('экран-режимов');
      return {
        лоббиВиден: Boolean(лобби && лобби.classList.contains('экран--виден')),
        режимовВиден: Boolean(режимов && режимов.classList.contains('экран--виден'))
      };
    });
    проверить(!экраны.лоббиВиден && экраны.режимовВиден,
      'без js/шашки-лобби.js страница открылась на прежнем экране «С кем играть»');

    // Старый путь должен работать: «Играть вдвоём» на экране режимов
    await страница.click('#кнопка-вдвоём');
    await страница.waitForTimeout(300);
    const столВиден = await страница.evaluate(() => {
      const стол = document.getElementById('экран-шашек');
      return Boolean(стол && стол.classList.contains('экран--виден'));
    });
    проверить(столВиден, 'кнопка «Играть вдвоём» на старом экране всё ещё заводит партию');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* ---------------- 3. Мост сети и подмена window.ШашкиРежимы.показать ---------------- */
  if (ПОРТ_СЕРВЕРА) {
    console.log('\n=== 3. Мост сети: выход из комнаты приводит в ЛОББИ ===');
    const адресСервера = 'http://127.0.0.1:' + ПОРТ_СЕРВЕРА;
    const адресСХозяином = АДРЕС + '?сервер=' + encodeURIComponent(адресСервера);

    const окноХозяина = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const хозяин = await окноХозяина.newPage();
    const ошибкиХозяина = [];
    хозяин.on('pageerror', (о) => ошибкиХозяина.push('исключение: ' + о.message));
    хозяин.on('console', (с) => {
      // Отказ загрузки — наших рук дело: настоящий скрипт Telegram мы не пускаем
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибкиХозяина.push('консоль: ' + с.text());
    });
    await безTelegram(хозяин);
    await хозяин.goto(адресСХозяином);
    await хозяин.waitForTimeout(400);

    await хозяин.click('#лобби-друг');
    await хозяин.waitForTimeout(300);
    await хозяин.click('#кнопка-создать-игру');
    await хозяин.waitForTimeout(1500);
    const код = (await хозяин.textContent('#код-комнаты') || '').trim();
    проверить(/^[A-Z0-9]{4,}$/.test(код), 'хозяин создал комнату, код показан: «' + код + '»');

    const окноГостя = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const гость = await окноГостя.newPage();
    await безTelegram(гость);
    await гость.goto(АДРЕС + '?сервер=' + encodeURIComponent(адресСервера));
    await гость.waitForTimeout(400);
    await гость.click('#лобби-код');
    await гость.waitForTimeout(300);
    await гость.fill('#поле-кода', код);
    await гость.click('#кнопка-войти');
    await гость.waitForTimeout(2000);

    const хозяинНаСтоле = await хозяин.evaluate(() => {
      const стол = document.getElementById('экран-шашек');
      return Boolean(стол && стол.classList.contains('экран--виден'));
    });
    проверить(хозяинНаСтоле, 'после входа гостя партия у хозяина началась (стол виден)');

    // Хозяин сам выходит из сетевой партии кнопкой «В меню» в листе «⋯»
    // (window.ШашкиСеть.покинуть() + window.ШашкиРежимы.показать() — та самая
    // дверь, которую подменил js/шашки-лобби.js).
    await хозяин.click('#кнопка-игра-ещё');
    await хозяин.waitForTimeout(200);
    await хозяин.evaluate(() => {
      const пункты = Array.from(document.querySelectorAll('#лист-игры button'));
      const вМеню = пункты.find((к) => /В меню/.test(к.textContent));
      if (вМеню) вМеню.click();
    });
    await хозяин.waitForTimeout(800);
    const кудаУвелоХозяина = await хозяин.evaluate(() => {
      const лобби = document.getElementById('экран-лобби');
      const режимов = document.getElementById('экран-режимов');
      const стол = document.getElementById('экран-шашек');
      return {
        лобби: Boolean(лобби && лобби.classList.contains('экран--виден')),
        режимов: Boolean(режимов && режимов.classList.contains('экран--виден')),
        стол: Boolean(стол && стол.classList.contains('экран--виден'))
      };
    });
    console.log('  после «В меню» во время сетевой партии у хозяина видно: ' + JSON.stringify(кудаУвелоХозяина));
    проверить(кудаУвелоХозяина.лобби && !кудаУвелоХозяина.режимов && !кудаУвелоХозяина.стол,
      '«В меню» из сетевой партии увело хозяина в ЛОББИ, а не на старый экран «с кем играть»');

    проверить(ошибкиХозяина.length === 0, 'у хозяина красных ошибок в консоли нет' +
      (ошибкиХозяина.length ? ' — а они есть: ' + ошибкиХозяина.join(' | ') : ''));

    await окноГостя.close();
    await окноХозяина.close();
  } else {
    console.log('\n=== 3. Мост сети — ПРОПУЩЕНО (порт сервера комнат не передан вторым аргументом) ===');
  }

  await браузер.close();
  console.log('\n' + (провалов === 0 ? 'ВСЁ ЗЕЛЁНОЕ' : 'ПРОВАЛОВ: ' + провалов));
  process.exit(провалов === 0 ? 0 : 1);
})().catch((ошибка) => { console.error('проверка сломалась:', ошибка); process.exit(2); });
