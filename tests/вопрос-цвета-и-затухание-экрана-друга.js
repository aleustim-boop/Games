'use strict';

/* =====================================================================
   ВОПРОСЫ ШТАБА ПРО ЭКРАН #ЭКРАН-ДРУГА В СОСТОЯНИИ «СЕРВЕР НЕДОСТУПЕН»

   Вопрос 1: Какого цвета плашка беды на самом деле?
   Вопрос 2: Работает ли затухание нижнего края (#экран-друга::after)?

   Запуск:
       node tests/вопрос-цвета-и-затухание-экрана-друга.js
   ===================================================================== */

const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium, подготовитьПодделку } = require('./браузер-робот.js');

const ПАПКА_ПРОЕКТА = path.join(__dirname, '..');
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки');
const ПРЕДПОЧТИТЕЛЬНЫЙ_ПОРТ_СТРАНИЦ = 8081;

const спать = (мс) => new Promise((р) => setTimeout(р, мс));

function портСвободен(порт) {
  return new Promise((готово) => {
    const проба = net.createServer();
    проба.once('error', () => готово(false));
    проба.listen(порт, '127.0.0.1', () => проба.close(() => готово(true)));
  });
}

function свободныйПорт() {
  return new Promise((готово) => {
    const проба = net.createServer();
    проба.listen(0, '127.0.0.1', () => {
      const порт = проба.address().port;
      проба.close(() => готово(порт));
    });
  });
}

function постучать(адрес) {
  return new Promise((готово) => {
    const запрос = http.get(адрес, (ответ) => { ответ.resume(); готово(true); });
    запрос.on('error', () => готово(false));
    запрос.setTimeout(2000, () => { запрос.destroy(); готово(false); });
  });
}

async function ждатьОтвета(адрес, максМс) {
  const край = Date.now() + (максМс || 8000);
  while (Date.now() < край) {
    if (await постучать(адрес)) return true;
    await спать(150);
  }
  return false;
}

async function ждатьМолчания(адрес, максМс) {
  const край = Date.now() + (максМс || 5000);
  while (Date.now() < край) {
    if (!(await постучать(адрес))) return true;
    await спать(150);
  }
  return false;
}

function поднятьПроцесс(команда, аргументы, метка) {
  return new Promise((resolve, reject) => {
    const процесс = spawn(команда, аргументы, { cwd: ПАПКА_ПРОЕКТА, stdio: ['ignore', 'pipe', 'pipe'] });
    процесс.stdout.on('data', (д) => console.log('[' + метка + '] ' + д.toString().trim()));
    процесс.stderr.on('data', (д) => console.error('[' + метка + ' ошибка] ' + д.toString().trim()));
    процесс.on('error', reject);
    setTimeout(() => resolve(процесс), 400);
  });
}

async function ждатьВидимогоЭкрана(страница, id, максМс) {
  try {
    await страница.waitForFunction((и) => {
      const узел = document.getElementById(и);
      return Boolean(узел && узел.classList.contains('экран--виден'));
    }, id, { timeout: максМс || 8000 });
    return true;
  } catch (ошибка) {
    const видно = await страница.evaluate(() => {
      const э = document.querySelector('.экран.экран--виден');
      return э ? э.id : '(нет видимого экрана)';
    });
    console.error('    не дождался экрана «' + id + '», сейчас видно: ' + видно);
    return false;
  }
}

async function нажать(страница, селектор, что) {
  await страница.waitForSelector(селектор, { state: 'visible', timeout: 8000 });
  await страница.click(селектор, { timeout: 5000 });
  console.log('    нажал: ' + что);
}

async function дойтиДоЛоббиИОнлайна(страница) {
  await нажать(страница, '#кнопка-игра-дурак', 'Дурак на витрине');
  await ждатьВидимогоЭкрана(страница, 'экран-лобби', 8000);
  await спать(200);
  await нажать(страница, '#лобби-играть-онлайн', '«Играть онлайн» в лобби');
  await ждатьВидимогоЭкрана(страница, 'экран-открытые-столы', 8000);
  await спать(200);
}

async function пройтиТриШагаИСоздать(страница) {
  await нажать(страница, '#открытые-столы-создать', '«Создать игру» на экране «Играть онлайн»');
  await ждатьВидимогоЭкрана(страница, 'экран-путь-правила', 8000);
  await спать(150);
  await нажать(страница, '.экран.экран--виден [data-путь="далее"]', 'Далее на шаге 1 «Правила»');
  await ждатьВидимогоЭкрана(страница, 'экран-путь-игроки', 8000);
  await спать(150);
  await нажать(страница, '.экран.экран--виден [data-путь="далее"]', 'Далее на шаге 2 «Игроки»');
  await ждатьВидимогоЭкрана(страница, 'экран-путь-настройки', 8000);
  await спать(150);
  await нажать(страница, '#путь-начать', '«Создать игру» на шаге 3 «Настройки»');
}

async function запустить() {
  console.log('Вопросы штаба про экран друга: цвета плашки и затухание нижнего края\n');

  if (!fs.existsSync(ПАПКА_СНИМКОВ)) fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });

  const портСтраниц = (await портСвободен(ПРЕДПОЧТИТЕЛЬНЫЙ_ПОРТ_СТРАНИЦ)) ? ПРЕДПОЧТИТЕЛЬНЫЙ_ПОРТ_СТРАНИЦ : await свободныйПорт();
  const портБеды = await свободныйПорт();
  console.log('Порт страниц: ' + портСтраниц + ', порт беды (пустой): ' + портБеды + '\n');

  let процессСтраниц = null;
  let браузер = null;
  const красные = [];

  try {
    процессСтраниц = await поднятьПроцесс('node', ['tests/локальный-сервер.js', String(портСтраниц)], 'страницы');
    const страницыЖивы = await ждатьОтвета('http://127.0.0.1:' + портСтраниц + '/index.html', 8000);
    if (!страницыЖивы) throw new Error('страничный сервер на ' + портСтраниц + ' не ответил');
    console.log('Страничный сервер живой ✓\n');

    браузер = await chromium.launch();
    const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const страница = await контекст.newPage();

    страница.on('pageerror', (о) => красные.push('падение: ' + о.message));
    страница.on('console', (м) => {
      if (м.type() !== 'error') return;
      const текст = м.text();
      const л = м.location && м.location();
      const откуда = (л && л.url) || '';
      const вместе = текст + ' ' + откуда;
      // Фильтруем ожидаемые ошибки сети и Telegram
      if (/telegram-web-app\.js|telegram\.org/.test(вместе)) return;
      if (вместе.indexOf(':' + портБеды + '/') !== -1) return;
      красные.push('консоль: ' + текст + (откуда ? ' (' + откуда + ')' : ''));
    });

    await подготовитьПодделку(страница, { версия: '7.10' });

    // Открыть страницу с адресом неживого сервера
    const адресБеды = 'http://127.0.0.1:' + портСтраниц + '/index.html?сервер=' + encodeURIComponent('http://127.0.0.1:' + портБеды);
    console.log('Открываю с недоступным сервером...');
    await страница.goto(адресБеды, { waitUntil: 'domcontentloaded' });

    // Доходим до экрана создания игры
    await дойтиДоЛоббиИОнлайна(страница);
    await пройтиТриШагаИСоздать(страница);

    // Дождёмся появления #экран-друга с бедой
    const другВиден = await ждатьВидимогоЭкрана(страница, 'экран-друга', 10000);
    if (!другВиден) {
      throw new Error('экран-друга не появился');
    }

    await спать(500);

    console.log('\n=== ВОПРОС 1: ЦВЕТ ПЛАШКИ БЕДЫ ===\n');

    // Получаем информацию о плашке беды и кнопке
    const результат = await страница.evaluate(() => {
      const плашка = document.getElementById('нет-сервера-главное');
      if (!плашка) return { ошибка: 'Узел #нет-сервера-главное не найден' };

      const стиль = getComputedStyle(плашка);
      const цветФона = стиль.backgroundColor;
      const цветБордера = стиль.borderLeftColor;
      const подложка = стиль.getPropertyValue('--подложка');
      const акцент = стиль.getPropertyValue('--акцент');
      const класс = плашка.className;
      const инлайн = плашка.getAttribute('style');
      const прямоугольник = плашка.getBoundingClientRect();

      // Находим кнопку "Играть с ботом"
      const кнопка = document.getElementById('кнопка-играть-с-ботом');
      let кнопкаДанные = null;
      if (кнопка) {
        const кнопкаСтиль = getComputedStyle(кнопка);
        const кнопкаПрямоугольник = кнопка.getBoundingClientRect();
        кнопкаДанные = {
          backgroundColor: кнопкаСтиль.backgroundColor,
          top: кнопкаПрямоугольник.top,
          bottom: кнопкаПрямоугольник.bottom,
          left: кнопкаПрямоугольник.left,
          right: кнопкаПрямоугольник.right,
          height: кнопкаПрямоугольник.height,
          width: кнопкаПрямоугольник.width
        };
      }

      return {
        плашка: {
          цветФона: цветФона,
          цветБордера: цветБордера,
          подложка: подложка.trim() || '(не установлена)',
          акцент: акцент.trim() || '(не установлена)',
          класс: класс,
          инлайнСтиль: инлайн,
          видима: !плашка.classList.contains('скрыт'),
          top: прямоугольник.top,
          bottom: прямоугольник.bottom,
          left: прямоугольник.left,
          right: прямоугольник.right,
          height: прямоугольник.height,
          width: прямоугольник.width
        },
        кнопка: кнопкаДанные,
        зазорМеждуПлашкойИКнопкой: (кнопкаДанные && кнопкаДанные.top - прямоугольник.bottom) || null
      };
    });

    if (результат.ошибка) {
      console.log('ОШИБКА: ' + результат.ошибка);
    } else {
      console.log('Плашка #нет-сервера-главное:');
      console.log('  видима: ' + результат.плашка.видима);
      console.log('  getComputedStyle.backgroundColor: ' + результат.плашка.цветФона);
      console.log('  getComputedStyle.borderLeftColor: ' + результат.плашка.цветБордера);
      console.log('  --подложка: ' + результат.плашка.подложка);
      console.log('  --акцент: ' + результат.плашка.акцент);
      console.log('  className: ' + результат.плашка.класс);
      console.log('  getAttribute("style"): ' + (результат.плашка.инлайнСтиль || '(нет)'));
      console.log('  getBoundingClientRect: top=' + результат.плашка.top.toFixed(1) + ' bottom=' + результат.плашка.bottom.toFixed(1) + ' left=' + результат.плашка.left.toFixed(1) + ' right=' + результат.плашка.right.toFixed(1) + ' height=' + результат.плашка.height.toFixed(1) + ' width=' + результат.плашка.width.toFixed(1));

      if (результат.кнопка) {
        console.log('\nКнопка #кнопка-играть-с-ботом («Играть с ботом»):');
        console.log('  getComputedStyle.backgroundColor: ' + результат.кнопка.backgroundColor);
        console.log('  getBoundingClientRect: top=' + результат.кнопка.top.toFixed(1) + ' bottom=' + результат.кнопка.bottom.toFixed(1) + ' left=' + результат.кнопка.left.toFixed(1) + ' right=' + результат.кнопка.right.toFixed(1) + ' height=' + результат.кнопка.height.toFixed(1) + ' width=' + результат.кнопка.width.toFixed(1));
        console.log('\nЗазор между плашкой и кнопкой: ' + результат.зазорМеждуПлашкойИКнопкой.toFixed(1) + ' px (если 0 или отрицательный — они слиплись)');
      } else {
        console.log('\nКнопка #кнопка-играть-с-ботом не найдена');
      }
    }

    console.log('\n=== ВОПРОС 2: ЗАТУХАНИЕ НИЖНЕГО КРАЯ ===\n');

    // СНИМОК 1: сразу после открытия, без прокрутки
    console.log('Снимок 1: экран после открытия (без прокрутки)...');
    const файл1 = path.join(ПАПКА_СНИМКОВ, 'друг-край-до-прокрутки-390x844.png');
    await страница.screenshot({ path: файл1 });
    console.log('  ' + файл1);

    // Получаем состояние ДО прокрутки
    const доПрокрутки = await страница.evaluate(() => {
      const экран = document.getElementById('экран-друга');
      if (!экран) return { ошибка: 'Экран не найден' };

      const стиль = getComputedStyle(экран);
      const послеСтиль = getComputedStyle(экран, '::after');

      return {
        scrollTop: экран.scrollTop,
        scrollHeight: экран.scrollHeight,
        clientHeight: экран.clientHeight,
        afterHeight: послеСтиль.height,
        afterBottom: послеСтиль.bottom,
        afterBackgroundImage: послеСтиль.backgroundImage,
        afterContent: послеСтиль.content,
        afterPosition: послеСтиль.position
      };
    });

    if (доПрокрутки.ошибка) {
      console.log('\nОШИБКА: ' + доПрокрутки.ошибка);
    } else {
      console.log('\nДо прокрутки (#экран-друга):');
      console.log('  scrollTop: ' + доПрокрутки.scrollTop);
      console.log('  scrollHeight: ' + доПрокрутки.scrollHeight);
      console.log('  clientHeight: ' + доПрокрутки.clientHeight);
      console.log('  ::after height: ' + доПрокрутки.afterHeight);
      console.log('  ::after bottom: ' + доПрокрутки.afterBottom);
      console.log('  ::after background-image: ' + доПрокрутки.afterBackgroundImage);
      console.log('  ::after content: ' + доПрокрутки.afterContent);
      console.log('  ::after position: ' + доПрокрутки.afterPosition);
    }

    // Прокручиваем до дна
    console.log('\nПрокручиваю содержимое до дна...');
    await страница.evaluate(() => {
      const экран = document.getElementById('экран-друга');
      if (экран) {
        экран.scrollTop = экран.scrollHeight;
      }
    });
    await спать(300);

    // СНИМОК 2: после прокрутки
    console.log('Снимок 2: экран после прокрутки до дна...');
    const файл2 = path.join(ПАПКА_СНИМКОВ, 'друг-край-после-прокрутки-390x844.png');
    await страница.screenshot({ path: файл2 });
    console.log('  ' + файл2);

    // Получаем состояние ПОСЛЕ прокрутки
    const послеПрокрутки = await страница.evaluate(() => {
      const экран = document.getElementById('экран-друга');
      if (!экран) return { ошибка: 'Экран не найден' };

      const послеСтиль = getComputedStyle(экран, '::after');

      return {
        scrollTop: экран.scrollTop,
        scrollHeight: экран.scrollHeight,
        clientHeight: экран.clientHeight,
        afterHeight: послеСтиль.height,
        afterBottom: послеСтиль.bottom,
        afterBackgroundImage: послеСтиль.backgroundImage,
        afterContent: послеСтиль.content,
        afterPosition: послеСтиль.position
      };
    });

    if (послеПрокрутки.ошибка) {
      console.log('\nОШИБКА: ' + послеПрокрутки.ошибка);
    } else {
      console.log('\nПосле прокрутки (#экран-друга):');
      console.log('  scrollTop: ' + послеПрокрутки.scrollTop);
      console.log('  scrollHeight: ' + послеПрокрутки.scrollHeight);
      console.log('  clientHeight: ' + послеПрокрутки.clientHeight);
      console.log('  ::after height: ' + послеПрокрутки.afterHeight);
      console.log('  ::after bottom: ' + послеПрокрутки.afterBottom);
      console.log('  ::after background-image: ' + послеПрокрутки.afterBackgroundImage);
      console.log('  ::after content: ' + послеПрокрутки.afterContent);
      console.log('  ::after position: ' + послеПрокрутки.afterPosition);
    }

    if (красные.length) {
      console.log('\n=== КОНСОЛЬ ===\n');
      console.log('В консоли было ' + красные.length + ' ошибок/падений:');
      красные.forEach((с) => console.log('  ' + с));
    } else {
      console.log('\nОшибок в консоли: нет ✓');
    }

    await контекст.close();
    await браузер.close();
    браузер = null;
    console.log('\nБраузер закрыт ✓');

  } finally {
    if (браузер) { try { await браузер.close(); } catch (е) { /* */ } }
    if (процессСтраниц && процессСтраниц.pid) {
      console.log('\nГашу страничный сервер (PID ' + процессСтраниц.pid + ')...');
      процессСтраниц.kill();
      const молчит = await ждатьМолчания('http://127.0.0.1:' + портСтраниц + '/index.html', 5000);
      console.log('Порт ' + портСтраниц + ' (страницы): ' + (молчит ? 'молчит ✓' : 'ВСЁ ЕЩЁ ОТВЕЧАЕТ'));
    }
  }
}

запустить().catch((ошибка) => {
  console.error('Ошибка: ' + ошибка.message);
  console.error(ошибка.stack);
  process.exit(2);
});
