'use strict';

/* =====================================================================
   ДУРАК: СНИМОК ЭКРАНА «ИЩЕМ СОПЕРНИКА» ПРИ ОНЛАЙН-ПОИСКЕ.

   Задача: владелец жалуется, что экран поиска соперника плохо виден
   и не похож на общий стиль игры. Нужен снимок для оценки.

   Стенд:
     1. Поднимает тестовую копию server/сервер.js на свободном порту
     2. Открывает браузер на вертикальном размере телефона (390x844)
     3. Открывает index.html с параметром сервера
     4. Нажимает кнопку дурака → лобби дурака
     5. Нажимает кнопку "Играть онлайн" → начинает поиск
     6. Ждёт появления экрана "Ищем соперника"
     7. Делает снимок (ДО того, как подсадится бот через 20 секунд)
     8. Закрывает браузер и гасит сервер

   Запуск:
       node tests/дурак-ищем-соперника-снимок.js

   Снимки положены в tests/снимки/ с понятными именами.
   ===================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium, подготовитьПодделку } = require('./браузер-робот.js');

const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки');
const ПАПКА_ПРОЕКТА = path.join(__dirname, '..');
const САЙТ_ПОРТ = 8080;
const САЙТ = 'http://127.0.0.1:' + САЙТ_ПОРТ;

let серверСтраниц = null;
let браузер = null;
let процесс = null;

function поискСвободногоПорта() {
  return new Promise((resolve) => {
    const тестовый = http.createServer();
    тестовый.listen(0, '127.0.0.1', () => {
      const адрес = тестовый.address();
      тестовый.close(() => resolve(адрес.port));
    });
  });
}

async function поднятьСервер(порт) {
  return new Promise((resolve, reject) => {
    процесс = spawn('node', ['server/сервер.js', String(порт), '--без-памяти'], {
      cwd: ПАПКА_ПРОЕКТА,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let готов = false;
    const таймер = setTimeout(() => {
      if (!готов) {
        процесс.kill();
        reject(new Error('Сервер не ответил за 10 секунд'));
      }
    }, 10000);

    процесс.on('error', (ошибка) => {
      clearTimeout(таймер);
      reject(ошибка);
    });

    процесс.stdout.on('data', (данные) => {
      const текст = данные.toString();
      console.log('[сервер ' + порт + '] ' + текст.trim());
      if (текст.includes('8790') || текст.includes(String(порт))) {
        готов = true;
        clearTimeout(таймер);
        resolve(процесс);
      }
    });

    процесс.stderr.on('data', (данные) => {
      console.error('[ошибка] ' + данные.toString().trim());
    });
  });
}

function постучать(адрес) {
  return new Promise((готово) => {
    const запрос = http.get(адрес + '/здоровье', (ответ) => {
      let текст = '';
      ответ.on('data', (кусок) => { текст += кусок; });
      ответ.on('end', () => {
        try {
          const данные = JSON.parse(текст);
          готово(Boolean(данные && данные.живой));
        } catch (ошибка) {
          готово(false);
        }
      });
    });
    запрос.on('error', () => готово(false));
    запрос.setTimeout(3000, () => { запрос.destroy(); готово(false); });
  });
}

async function ждатьВидимости(страница, id, максМс) {
  const начало = Date.now();
  while (Date.now() - начало < (максМс || 5000)) {
    const виден = await страница.evaluate((идентификатор) => {
      const узел = document.getElementById(идентификатор);
      if (!узел) return false;
      const вид = window.getComputedStyle(узел);
      return вид.display !== 'none' && вид.visibility !== 'hidden' && Number(вид.opacity) > 0.05;
    }, id);
    if (виден) return true;
    await новоеЖдание(20);
  }
  return false;
}

const новоеЖдание = (мс) => new Promise((р) => setTimeout(р, мс));

function поднятьПаГечный() {
  return new Promise((resolve, reject) => {
    const сервер = http.createServer((запрос, ответ) => {
      ответ.setHeader('Access-Control-Allow-Origin', '*');

      let путь = запрос.url.split('?')[0];
      if (путь === '/') путь = '/index.html';

      try {
        путь = decodeURIComponent(путь);
      } catch (е) {
        /* оставим как есть */
      }

      const файл = path.join(ПАПКА_ПРОЕКТА, путь);
      fs.readFile(файл, (ошибка, данные) => {
        if (ошибка) {
          ответ.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          ответ.end('404');
          return;
        }

        let тип = 'text/plain';
        if (путь.endsWith('.html')) тип = 'text/html; charset=utf-8';
        else if (путь.endsWith('.css')) тип = 'text/css; charset=utf-8';
        else if (путь.endsWith('.js')) тип = 'application/javascript; charset=utf-8';
        else if (путь.endsWith('.png')) тип = 'image/png';
        else if (путь.endsWith('.jpg')) тип = 'image/jpeg';
        else if (путь.endsWith('.woff2')) тип = 'font/woff2';
        else if (путь.endsWith('.svg')) тип = 'image/svg+xml';

        ответ.writeHead(200, { 'Content-Type': тип });
        ответ.end(данные);
      });
    });

    сервер.on('error', reject);
    сервер.listen(САЙТ_ПОРТ, '127.0.0.1', () => {
      console.log('Страничный сервер на порту ' + САЙТ_ПОРТ);
      resolve(сервер);
    });
  });
}

async function запустить() {
  console.log('Дурак: снимок экрана «Ищем соперника»');

  if (!fs.existsSync(ПАПКА_СНИМКОВ)) {
    fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
  }

  let порт = null;
  try {
    порт = await поискСвободногоПорта();
    console.log('Свободный порт: ' + порт);
  } catch (ошибка) {
    console.error('Ошибка поиска порта: ' + ошибка.message);
    process.exit(1);
  }

  try {
    серверСтраниц = await поднятьПаГечный();

    процесс = await поднятьСервер(порт);
    console.log('Сервер на порту ' + порт + ', PID ' + процесс.pid);

    await новоеЖдание(1000);
    const живой = await постучать('http://127.0.0.1:' + порт);
    if (!живой) {
      console.error('Сервер не ответил');
      process.exit(1);
    }
    console.log('Сервер живой ✓');

    браузер = await chromium.launch();
    const контекст = await браузер.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true
    });

    const страница = await контекст.newPage();
    const красные = [];
    страница.on('pageerror', (ошибка) => красные.push(ошибка.message));
    страница.on('console', (сообщение) => {
      if (сообщение.type() === 'error') {
        красные.push(сообщение.text());
      }
    });

    await подготовитьПодделку(страница, { версия: '7.10' });

    console.log('Открываю витрину...');
    const адресВитрины = САЙТ + '/index.html?сервер=' + encodeURIComponent('http://127.0.0.1:' + порт);
    await страница.goto(адресВитрины, { waitUntil: 'domcontentloaded' });
    console.log('Витрина загружена');

    console.log('Нажимаю дурака...');
    const естьДурак = await ждатьВидимости(страница, 'кнопка-игра-дурак', 5000);
    if (естьДурак) {
      await страница.click('#кнопка-игра-дурак');
      console.log('Дурак открыт');
    } else {
      красные.push('Кнопка дурака не найдена');
    }

    await новоеЖдание(500);
    const естьЛобби = await ждатьВидимости(страница, 'лобби-играть-онлайн', 5000);
    if (естьЛобби) {
      console.log('Лобби виден, делаю снимок...');
      await страница.screenshot({
        path: path.join(ПАПКА_СНИМКОВ, 'дурак-лобби-онлайн-390x844.png')
      });
      console.log('Снимок лобби: ' + path.join(ПАПКА_СНИМКОВ, 'дурак-лобби-онлайн-390x844.png'));
    }

    console.log('Нажимаю «Играть онлайн»...');
    await страница.click('#лобби-играть-онлайн');
    console.log('Поиск начат');

    await новоеЖдание(500);
    console.log('Жду экрана поиска...');
    const естьПоиск = await ждатьВидимости(страница, 'экран-подбор-соперника', 15000);

    if (естьПоиск) {
      console.log('Экран поиска появился ✓');
    } else {
      console.log('Экран поиска не появился, делаю снимок того, что есть');
      красные.push('Экран поиска не найден');
    }

    console.log('Делаю снимок...');
    await страница.screenshot({
      path: path.join(ПАПКА_СНИМКОВ, 'дурак-ищем-соперника-390x844.png')
    });
    console.log('Снимок: ' + path.join(ПАПКА_СНИМКОВ, 'дурак-ищем-соперника-390x844.png'));

    if (красные.length > 0) {
      console.log('\nОшибки в консоли:');
      красные.slice(0, 5).forEach((е) => console.log('  ' + е));
      if (красные.length > 5) console.log('  ... и ещё ' + (красные.length - 5));
    } else {
      console.log('Ошибок в консоли: нет ✓');
    }

    await контекст.close();
    await браузер.close();
    console.log('Браузер закрыт ✓');

  } catch (ошибка) {
    console.error('Ошибка стенда: ' + ошибка.message);
    if (ошибка.stack) console.error(ошибка.stack);
    process.exit(1);
  } finally {
    if (процесс && процесс.pid) {
      console.log('Гашу сервер (PID ' + процесс.pid + ')...');
      try {
        process.kill(-процесс.pid);
      } catch (е) {
        процесс.kill();
      }
      console.log('Сервер потушен ✓');
    }
    if (серверСтраниц) {
      серверСтраниц.close();
    }
  }

  console.log('\nСнимки готовы:');
  console.log('  ' + path.join(ПАПКА_СНИМКОВ, 'дурак-лобби-онлайн-390x844.png'));
  console.log('  ' + path.join(ПАПКА_СНИМКОВ, 'дурак-ищем-соперника-390x844.png'));
}

запустить().catch((ошибка) => {
  console.error('Стенд упал: ' + ошибка.message);
  process.exit(2);
});
