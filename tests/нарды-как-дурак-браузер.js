'use strict';

/* =====================================================================
   НАРДЫ ОНЛАЙН КАК ДУРАК — ПРОВЕРКА В НАСТОЯЩЕМ БРАУЗЕРЕ
   (штаб/план-онлайн-как-дурак.md, этап Э6). Место файла — tests/.

   Слова владельца: «все игры онлайн так, как дурак… в нардах только код,
   нет реализации как в дураке». Здесь два окна (два игрока с разными
   подписями Telegram) проходят путь дурака на странице нард:
     1. Хозяин: «Играть онлайн» → «Создать игру» → комната-05: место «Вы»,
        свободное место, «Позвать», код стола, кнопка «Начать».
     2. Гость: «Играть онлайн» → «Есть код? Войти» → код → входит.
     3. Хозяин жмёт «Начать» — у обоих доска нард.
     4. Хозяин настоящими нажатиями («Сказать» → смайлик) шлёт знак — он
        доходит до гостя, а кнопка «Бросить кубики» у хозяина после этого
        по-прежнему работает (диалог знаков не перехватывает ход).
     5. Гость закрывает вкладку и открывает страницу заново — в лобби
        видна плашка «Вернуться к игре».
   Снимки комнаты и партии — в tests/снимки/.

   СТЕНД: файлы — tests/локальный-сервер.js на ПОРТ_ФАЙЛОВ; сервер комнат —
   server/сервер.js модулем в этом же процессе на ПОРТ_КОМНАТ (8841, не
   боевой 8790). Тот же приём, что в tests/подбор-шашки-нарды-браузер.js.

   ЛОМАЮЩИЙ ПРОГОН (--сломать): полная копия нужных частей проекта во
   временной папке, из копии нарды.html вырезано подключение
   js/дурак-комната.js. Прогон обязан покраснеть именно на проверке
   комнаты-05 (метка [комната-05]). Файлы проекта не трогаются.

   Запуск:
       node tests/нарды-как-дурак-браузер.js
       node tests/нарды-как-дурак-браузер.js --сломать
       node tests/нарды-как-дурак-браузер.js --корень <папка-с-копией>

   Перед запуском (отдельной командой): node штаб/браузер-занят.js --ждать
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

/* Файл живёт в tests/; пока он лежит вне проекта — берём проект по пути. */
const ПРОЕКТ = path.basename(__dirname) === 'tests' ? path.join(__dirname, '..') : 'D:\\Claud\\Games';
const ТЕСТЫ = path.join(ПРОЕКТ, 'tests');
const { chromium, подготовитьПодделку } = require(path.join(ТЕСТЫ, 'браузер-робот.js'));

const ПОРТ_ФАЙЛОВ = 8979;
const ПОРТ_КОМНАТ = 8841;
const АДРЕС_ФАЙЛОВ = 'http://127.0.0.1:' + ПОРТ_ФАЙЛОВ + '/';
const АДРЕС_КОМНАТ = 'http://127.0.0.1:' + ПОРТ_КОМНАТ;
const АДРЕС_НАРД = АДРЕС_ФАЙЛОВ + 'нарды.html?сервер=' + encodeURIComponent(АДРЕС_КОМНАТ);
const ТОКЕН_ДЛЯ_ПРОБЫ = '1234567:VYDUMANNYY-TOKEN-nardy-kak-durak';
const МЕТКА_КОМНАТЫ = '[комната-05]';
const СТРОКА_КОМНАТЫ = '<script src="js/дурак-комната.js?v=19"></script>';

let всегоПроверок = 0;
let провалов = 0;
function проверить(условие, слова) {
  всегоПроверок++;
  if (условие) console.log('  ок   — ' + слова);
  else { провалов++; console.log('  ПЛОХО— ' + слова); }
  return условие;
}

/* ---------- Подпись initData, как у настоящего Telegram ---------- */

function подписать(поля, токен) {
  const строки = Object.keys(поля).filter(function (к) { return к !== 'hash'; })
    .map(function (к) { return к + '=' + поля[к]; }).sort();
  const ключ = crypto.createHmac('sha256', 'WebAppData').update(токен).digest();
  return crypto.createHmac('sha256', ключ).update(строки.join('\n')).digest('hex');
}

function initDataИгрока(номер, имя) {
  const поля = {
    query_id: 'AAF' + номер,
    user: JSON.stringify({ id: номер, first_name: имя, username: 'игрок' + номер }),
    auth_date: String(Math.floor(Date.now() / 1000))
  };
  const сподписью = Object.assign({}, поля, { hash: подписать(поля, ТОКЕН_ДЛЯ_ПРОБЫ) });
  return Object.keys(сподписью)
    .map(function (к) { return encodeURIComponent(к) + '=' + encodeURIComponent(сподписью[к]); })
    .join('&');
}

/* ---------- Два сервера стенда ---------- */

function поднятьФайловыйСервер(корень) {
  const сервер = spawn('node', [path.join(ТЕСТЫ, 'локальный-сервер.js'), String(ПОРТ_ФАЙЛОВ)], {
    env: Object.assign({}, process.env, { КОРЕНЬ_СЕРВЕРА: корень }),
    stdio: 'pipe'
  });
  return new Promise(function (готово, беда) {
    let вывод = '';
    const таймаут = setTimeout(function () { беда(new Error('Файловый сервер не поднялся за 5 секунд')); }, 5000);
    сервер.stdout.on('data', function (д) {
      вывод += д.toString();
      if (вывод.includes('запущен')) { clearTimeout(таймаут); готово(сервер); }
    });
    сервер.stderr.on('data', function (д) { console.log('  ошибка файлового сервера: ' + д.toString().trim()); });
    сервер.on('error', function (е) { clearTimeout(таймаут); беда(е); });
  });
}

/** Сервер комнат — модулем в этом процессе; данные уводим во временную папку ДО require. */
function поднятьСерверКомнат(корень) {
  process.env.ДАННЫЕ_ИГРЫ = path.join(os.tmpdir(), 'нарды-как-дурак-' + process.pid);
  const сервера = require(path.join(корень, 'server', 'сервер.js'));
  сервера.оснасткаДляПроверки(ТОКЕН_ДЛЯ_ПРОБЫ, function () { return { ok: true }; });
  const сервер = сервера.создатьСервер();
  return new Promise(function (готово, беда) {
    сервер.once('error', беда);
    сервер.listen(ПОРТ_КОМНАТ, '127.0.0.1', function () { готово(сервер); });
  });
}

/* ---------- Что смотрим в странице ---------- */

async function новаяСтраница(контекст, ошибки) {
  const страница = await контекст.newPage();
  страница.on('pageerror', function (о) { ошибки.push('исключение: ' + о.message); });
  страница.on('console', function (с) {
    if (с.type() === 'error' && !/Failed to load resource/.test(с.text())) ошибки.push('консоль: ' + с.text());
  });
  return страница;
}

async function новыйИгрок(браузер, номер, имя) {
  const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const ошибки = [];
  const страница = await новаяСтраница(контекст, ошибки);
  await подготовитьПодделку(страница, { подпись: initDataИгрока(номер, имя) });
  return { контекст: контекст, страница: страница, ошибки: ошибки, номер: номер, имя: имя };
}

async function нажать(страница, id) {
  return страница.evaluate(function (id) {
    const у = document.getElementById(id);
    if (!у) return false;
    у.click();
    return true;
  }, id);
}

async function ждать(страница, функция, довод, мс) {
  try {
    await страница.waitForFunction(функция, довод, { timeout: мс || 8000 });
    return true;
  } catch (сбой) {
    return false;
  }
}

/** Вид комнаты-05: видна ли, места по ролям, код, «Позвать», «Начать». */
async function видКомнаты(страница) {
  return страница.evaluate(function () {
    const видно = function (у) { return Boolean(у && !у.classList.contains('скрыт') && у.offsetParent !== null); };
    const комната = document.getElementById('комната');
    const места = Array.prototype.slice.call(document.querySelectorAll('#комната-стол .рассадка__место'));
    const код = document.getElementById('код-комнаты');
    const начать = document.getElementById('комната-начать');
    return {
      комнатаВидна: видно(комната),
      мест: места.length,
      моё: места.filter(function (м) { return м.classList.contains('рассадка__место--я'); }).map(function (м) { return м.textContent.trim(); }),
      свободных: места.filter(function (м) { return м.classList.contains('рассадка__место--свободно'); }).length,
      код: код ? код.textContent.trim() : '',
      кодВНовомВиде: Boolean(код && комната && комната.contains(код)),
      позватьВидна: видно(document.getElementById('кнопка-позвать-друга')),
      начатьЕсть: видно(начать),
      начатьДоступна: Boolean(начать && !начать.disabled)
    };
  });
}

async function ждатьДоску(страница, мс) {
  return ждать(страница, function () {
    const доска = document.getElementById('доска');
    return Boolean(доска && доска.classList.contains('доска-нард') && доска.children.length > 0 && доска.offsetParent !== null);
  }, null, мс || 10000);
}

/* ---------- Сценарий ---------- */

async function сценарий(браузер, папкаСнимков) {
  const хозяин = await новыйИгрок(браузер, 910201, 'Аня');
  const гость = await новыйИгрок(браузер, 910202, 'Боря');
  try {
    console.log('\n=== 1. Хозяин: «Играть онлайн» → «Создать игру» → комната-05 ===');
    await хозяин.страница.goto(АДРЕС_НАРД);
    await хозяин.страница.waitForTimeout(700);
    /* Для разбора провала: последний вид, который сеть отдала комнате-05. */
    await хозяин.страница.evaluate(function () {
      const к = window.ДуракКомната;
      if (!к || typeof к.показать !== 'function') return;
      const родная = к.показать;
      к.показать = function (вид) {
        window.__видКомнаты = { застолом: вид.застолом, мест: вид.мест, мойНомер: вид.мойНомер, этап: вид.этап };
        return родная.apply(this, arguments);
      };
    });
    проверить(await нажать(хозяин.страница, 'лобби-найти-игру'), 'карточка «Играть онлайн» нажалась');
    await хозяин.страница.waitForTimeout(400);
    проверить(await нажать(хозяин.страница, 'открытые-столы-создать'), 'кнопка «Создать игру» нажалась');

    await ждать(хозяин.страница, function () {
      return document.querySelectorAll('#комната-стол .рассадка__место').length >= 2 &&
        /[A-Z0-9]{4}/.test((document.getElementById('код-комнаты') || {}).textContent || '');
    }, null, 8000);
    const к = await видКомнаты(хозяин.страница);
    проверить(к.комнатаВидна && к.мест === 2, МЕТКА_КОМНАТЫ + ' комната-05 видна, мест за столом 2 (вышло: видна=' + к.комнатаВидна + ', мест=' + к.мест + ')');
    проверить(к.моё.length === 1 && /Вы/.test(к.моё[0]), 'моё место подписано «Вы» (вышло: ' + JSON.stringify(к.моё) + ')' +
      (к.моё.length ? '' : '; вид от сервера: ' + JSON.stringify(await хозяин.страница.evaluate(function () { return window.__видКомнаты || null; }))));
    проверить(к.свободных === 1, 'одно место свободно (вышло: ' + к.свободных + ')');
    проверить(/^[A-Z0-9]{4,6}$/.test(к.код) && к.кодВНовомВиде, 'код стола виден в комнате: «' + к.код + '»');
    проверить(к.позватьВидна, 'кнопка «Позвать» видна');
    проверить(к.начатьЕсть && !к.начатьДоступна, 'кнопка «Начать» у хозяина есть и пока закрыта (гостя нет)');
    const снимокКомнаты = path.join(папкаСнимков, 'нарды-как-дурак-комната-390.png');
    await хозяин.страница.screenshot({ path: снимокКомнаты });
    console.log('  снимок: ' + снимокКомнаты);

    console.log('\n=== 2. Гость входит по коду ===');
    await гость.страница.goto(АДРЕС_НАРД);
    await гость.страница.waitForTimeout(700);
    проверить(await нажать(гость.страница, 'лобби-найти-игру'), 'гость: «Играть онлайн» нажалась');
    await гость.страница.waitForTimeout(400);
    проверить(await нажать(гость.страница, 'открытые-столы-код'), 'гость: «Есть код? Войти» нажалась');
    await гость.страница.waitForTimeout(300);
    await гость.страница.fill('#поле-кода', к.код);
    проверить(await нажать(гость.страница, 'кнопка-войти'), 'гость: «Войти в игру» нажалась');
    const гостьСел = await ждать(гость.страница, function () {
      return document.querySelectorAll('#комната-стол .рассадка__место--соперник').length >= 1;
    }, null, 8000);
    проверить(гостьСел, 'гость за столом: видит хозяина в комнате');

    console.log('\n=== 3. Хозяин жмёт «Начать» — у обоих доска нард ===');
    const можноНачать = await ждать(хозяин.страница, function () {
      const н = document.getElementById('комната-начать');
      return Boolean(н && !н.disabled);
    }, null, 8000);
    проверить(можноНачать, 'у хозяина «Начать» открылась, когда гость сел');
    проверить(await нажать(хозяин.страница, 'комната-начать'), 'хозяин нажал «Начать»');
    const [доскаА, доскаБ] = await Promise.all([ждатьДоску(хозяин.страница), ждатьДоску(гость.страница)]);
    проверить(доскаА, 'у хозяина видна доска нард');
    проверить(доскаБ, 'у гостя видна доска нард');
    await гость.страница.waitForTimeout(800);
    const снимокПартии = path.join(папкаСнимков, 'нарды-как-дурак-партия-390.png');
    await гость.страница.screenshot({ path: снимокПартии });
    console.log('  снимок: ' + снимокПартии);

    console.log('\n=== 4. Хозяин настоящими нажатиями шлёт знак — он доходит до гостя ===');
    const кнопкаСказатьГотова = await ждать(хозяин.страница, function () {
      const у = document.getElementById('кнопка-эмоции');
      return Boolean(у && !у.classList.contains('скрыт') && !у.disabled && у.offsetParent !== null);
    }, null, 8000);
    проверить(кнопкаСказатьГотова, 'у хозяина кнопка «Сказать» появилась и включена');
    проверить(await нажать(хозяин.страница, 'кнопка-эмоции'), 'хозяин нажал «Сказать»');
    const диалогОткрылся = await ждать(хозяин.страница, function () {
      const о = document.getElementById('экран-эмоций');
      return Boolean(о && о.open);
    }, null, 3000);
    проверить(диалогОткрылся, 'диалог знаков открылся (#экран-эмоций)');
    const рядГотов = await ждать(хозяин.страница, function () {
      const ряд = document.getElementById('ряд-эмоций');
      return Boolean(ряд && ряд.children.length > 0);
    }, null, 3000);
    проверить(рядГотов, 'в ряду эмоций есть кнопки (#ряд-эмоций)');
    const нажалиЗнак = await хозяин.страница.evaluate(function () {
      const ряд = document.getElementById('ряд-эмоций');
      const первый = ряд && ряд.firstElementChild;
      if (!первый) return false;
      первый.click();
      return true;
    });
    проверить(нажалиЗнак, 'хозяин нажал на первый смайлик в ряду эмоций');
    const дошла = await ждать(гость.страница, function () {
      const полка = document.getElementById('знаки-внимания');
      return Boolean(полка && полка.children.length > 0);
    }, null, 5000);
    проверить(дошла, 'у гостя эмоция появилась на полке знаков (#знаки-внимания)');
    const диалогЗакрылся = await ждать(хозяин.страница, function () {
      const о = document.getElementById('экран-эмоций');
      return Boolean(о && !о.open);
    }, null, 3000);
    проверить(диалогЗакрылся, 'диалог знаков закрылся сам после отправки');

    console.log('\n=== 4б. После знака бросок костей у хозяина по-прежнему работает ===');
    const кубикиДоБроска = await хозяин.страница.evaluate(function () {
      const к = document.getElementById('кубики');
      return к ? к.children.length : -1;
    });
    проверить(кубикиДоБроска === 0, 'кубики ещё не брошены (узлов: ' + кубикиДоБроска + ')');
    проверить(await нажать(хозяин.страница, 'кнопка-бросить'), 'хозяин нажал «Бросить кубики»');
    const костиВыпали = await ждать(хозяин.страница, function () {
      const к = document.getElementById('кубики');
      return Boolean(к && к.children.length > 0);
    }, null, 5000);
    проверить(костиВыпали, 'после клика кости появились в #кубики — знак не перехватил ход хозяина');

    console.log('\n=== 5. Гость закрыл вкладку — в лобби «Вернуться к игре» ===');
    await гость.страница.close();
    /* Закрытая вкладка ещё 15 с числится «владельцем» стола (js/сеть.js,
       СРОК_ЗАНЯТОСТИ) — пока она не истекла, новая вкладка плашку не
       покажет. Человек вернётся позже, чем через миг, — ждём срок с запасом. */
    await хозяин.страница.waitForTimeout(16500);
    const новая = await новаяСтраница(гость.контекст, гость.ошибки);
    await подготовитьПодделку(новая, { подпись: initDataИгрока(гость.номер, гость.имя) });
    await новая.goto(АДРЕС_НАРД);
    const плашка = await ждать(новая, function () {
      const лобби = document.getElementById('экран-лобби');
      const п = document.getElementById('кнопка-вернуться-в-игру');
      return Boolean(лобби && п && п.parentNode === лобби && лобби.classList.contains('экран--виден') &&
        !п.classList.contains('скрыт') && п.offsetParent !== null);
    }, null, 8000);
    const гдеПлашка = await новая.evaluate(function () {
      const п = document.getElementById('кнопка-вернуться-в-игру');
      const экран = document.querySelector('.экран.экран--виден');
      return { виденЭкран: экран ? экран.id : null, родитель: п && п.parentNode ? п.parentNode.id : null, классы: п ? п.className : null,
        память: Object.keys(localStorage).filter(function (к) { return к.indexOf('room_') === 0; }) };
    });
    проверить(плашка, 'в лобби гостя видна плашка «Вернуться к игре»' + (плашка ? '' : ' (вышло: ' + JSON.stringify(гдеПлашка) + ')'));
    const снимокВозврата = path.join(папкаСнимков, 'нарды-как-дурак-возврат-390.png');
    await новая.screenshot({ path: снимокВозврата });
    console.log('  снимок: ' + снимокВозврата);

    проверить(хозяин.ошибки.length === 0, 'у хозяина красных ошибок в консоли нет' + (хозяин.ошибки.length ? ' — ' + хозяин.ошибки.join(' | ') : ''));
    проверить(гость.ошибки.length === 0, 'у гостя красных ошибок в консоли нет' + (гость.ошибки.length ? ' — ' + гость.ошибки.join(' | ') : ''));
  } finally {
    await хозяин.контекст.close();
    await гость.контекст.close();
  }
}

/* ---------- Ломающий прогон ---------- */

function сделатьКопиюПроекта(папка) {
  for (const часть of ['server', 'js', 'img', 'шрифты']) {
    const откуда = path.join(ПРОЕКТ, часть);
    if (!fs.existsSync(откуда)) continue;
    fs.cpSync(откуда, path.join(папка, часть), {
      recursive: true,
      filter: function (ф) { const имя = path.basename(ф); return имя !== 'данные' && имя !== 'node_modules'; }
    });
  }
  for (const файл of fs.readdirSync(ПРОЕКТ)) {
    if (файл.endsWith('.html') || файл.endsWith('.css')) fs.copyFileSync(path.join(ПРОЕКТ, файл), path.join(папка, файл));
  }
}

function ломать() {
  console.log('=== Ломающий прогон: копия нарды.html без js/дурак-комната.js — обязан покраснеть ===');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'нарды-как-дурак-лом-'));
  /* process.exit() внутри try обрывает выполнение немедленно и до finally
     не доходит — временная папка так и остаётся висеть в %TEMP%. Поэтому
     код выхода копим в process.exitCode, а уборку делаем в finally. */
  try {
    сделатьКопиюПроекта(папка);
    const файл = path.join(папка, 'нарды.html');
    const текст = fs.readFileSync(файл, 'utf8');
    if (текст.indexOf(СТРОКА_КОМНАТЫ) === -1) {
      console.log('ПРОВАЛ: в копии нарды.html нет строки «' + СТРОКА_КОМНАТЫ + '» — портить нечего');
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(файл, текст.split(СТРОКА_КОМНАТЫ).join(''), 'utf8');
    console.log('Порченая копия: ' + папка);

    const прогон = spawnSync(process.execPath, [__filename, '--корень', папка], { encoding: 'utf8', timeout: 180000 });
    console.log('\n----- вывод ломающего прогона -----\n' + (прогон.stdout || '') + (прогон.stderr ? '\nstderr: ' + прогон.stderr : ''));
    console.log('------------------------------------');
    const покраснелНаКомнате = прогон.status === 1 &&
      (прогон.stdout || '').split('\n').some(function (с) { return с.indexOf('ПЛОХО') !== -1 && с.indexOf(МЕТКА_КОМНАТЫ) !== -1; });
    console.log(покраснелНаКомнате
      ? 'ЛОМАЮЩИЙ ПРОГОН ПОКРАСНЕЛ на проверке ' + МЕТКА_КОМНАТЫ + ', как и должен.'
      : 'ПРОВАЛ: ломающий прогон не покраснел на ' + МЕТКА_КОМНАТЫ + ' (код ' + прогон.status + ') — проверка не ловит поломку!');
    console.log('\nИтого проверок: 1, провалов: ' + (покраснелНаКомнате ? 0 : 1));
    process.exitCode = покраснелНаКомнате ? 0 : 1;
  } finally {
    fs.rmSync(папка, { recursive: true, force: true });
    console.log('Временная копия убрана: ' + папка);
  }
}

/* ---------- Обычный прогон ---------- */

async function прогнать(корень) {
  const этоПроект = path.resolve(корень).toLowerCase() === path.resolve(ПРОЕКТ).toLowerCase();
  const папкаСнимков = этоПроект ? path.join(ТЕСТЫ, 'снимки') : path.join(корень, '_снимки-ломающего-прогона');
  fs.mkdirSync(папкаСнимков, { recursive: true });
  console.log('=== Нарды онлайн как дурак — проверка в браузере ===');
  console.log('корень: ' + корень + '\nфайлы: ' + АДРЕС_ФАЙЛОВ + ', комнаты: ' + АДРЕС_КОМНАТ + ' (не боевой 8790)');

  const файловый = await поднятьФайловыйСервер(корень);
  const серверКомнат = await поднятьСерверКомнат(корень);
  let браузер = null;
  try {
    браузер = await chromium.launch();
    await сценарий(браузер, папкаСнимков);
  } finally {
    if (браузер) await браузер.close();
    файловый.kill();
    серверКомнат.close();
    console.log('\nФайловый сервер погашен по PID ' + файловый.pid + ', сервер комнат (' + ПОРТ_КОМНАТ + ') закрыт.');
  }
  console.log('\nИтого проверок: ' + всегоПроверок + ', провалов: ' + провалов);
  process.exit(провалов > 0 ? 1 : 0);
}

function доводПосле(имя) {
  const где = process.argv.indexOf(имя);
  return где !== -1 ? process.argv[где + 1] : null;
}

if (process.argv.includes('--сломать')) {
  ломать();
} else {
  прогнать(path.resolve(доводПосле('--корень') || ПРОЕКТ)).catch(function (е) {
    console.error('ПРОВАЛ ЗАПУСКА: ' + (е && е.stack || е));
    process.exit(1);
  });
}
