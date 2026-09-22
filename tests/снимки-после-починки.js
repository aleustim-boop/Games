#!/usr/bin/env node
'use strict';

/**
 * СНИМКИ ЭКРАНОВ ПОСЛЕ ПОЧИНКИ ПЕРЕКРАСКИ.
 *
 * Проверяет, что после правки style.css служебные экраны дурака (лобби, друг, комната)
 * стали бордовыми (сукно), а лобби остальных игр остались тёмными (графит).
 * Снимки для смотрителя — оценить вид глазами.
 *
 * Запуск:
 *     node tests/снимки-после-починки.js
 *
 * Поднимает локальный сервер на свободном порту, открывает браузер,
 * делает снимки всех интересующих экранов, собирает ошибки консоли.
 */

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

function поднятьПроцесс(команда, аргументы, метка, опции) {
  return new Promise((resolve, reject) => {
    const параметры = Object.assign({ cwd: ПАПКА_ПРОЕКТА, stdio: ['ignore', 'pipe', 'pipe'] }, опции);
    const процесс = spawn(команда, аргументы, параметры);
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
    return false;
  }
}

async function ждатьВидимой(страница, селектор, максМс) {
  try {
    await страница.waitForSelector(селектор, { state: 'visible', timeout: максМс || 5000 });
    return true;
  } catch (ошибка) {
    return false;
  }
}

async function нажать(страница, селектор, что) {
  try {
    await страница.waitForSelector(селектор, { state: 'visible', timeout: 5000 });
    await страница.click(селектор, { timeout: 5000 });
    console.log('    нажал: ' + что);
    return true;
  } catch (ошибка) {
    console.log('    НЕ нашёл: ' + что + ' (селектор: ' + селектор + ')');
    return false;
  }
}

async function сделатьСнимок(страница, имяФайла, папка) {
  const путь = path.join(папка, имяФайла);
  await спать(300); // даём время на рендер
  try {
    await страница.screenshot({ path: путь });
    console.log('    ✓ Снимок: ' + путь);
    return путь;
  } catch (ошибка) {
    console.log('    ✗ Ошибка при снимке: ' + ошибка.message);
    return null;
  }
}

async function запустить() {
  console.log('Снимки экранов после починки перекраски');

  if (!fs.existsSync(ПАПКА_СНИМКОВ)) fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });

  const портСтраниц = (await портСвободен(ПРЕДПОЧТИТЕЛЬНЫЙ_ПОРТ_СТРАНИЦ)) ? ПРЕДПОЧТИТЕЛЬНЫЙ_ПОРТ_СТРАНИЦ : await свободныйПорт();
  console.log('Порт сервера страниц: ' + портСтраниц);

  let процессСтраниц = null;
  let браузер = null;
  const снятыеСнимки = [];
  const красные = [];
  const беды = [];

  try {
    процессСтраниц = await поднятьПроцесс('node', ['tests/локальный-сервер.js', String(портСтраниц)], 'сервер');
    const страницыЖивы = await ждатьОтвета('http://127.0.0.1:' + портСтраниц + '/index.html', 8000);
    if (!страницыЖивы) throw new Error('сервер страниц на ' + портСтраниц + ' не ответил');
    console.log('Сервер страниц живой ✓\n');

    браузер = await chromium.launch();
    const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const страница = await контекст.newPage();

    // Сбор ошибок консоли
    страница.on('pageerror', (о) => красные.push('падение: ' + о.message));
    страница.on('console', (м) => {
      if (м.type() !== 'error') return;
      const текст = м.text();
      const л = м.location && м.location();
      const откуда = (л && л.url) || '';
      // Отсеиваем ожидаемый шум от браузера
      if (/telegram-web-app\.js|telegram\.org/.test(откуда)) return;
      красные.push('консоль: ' + текст + (откуда ? ' (' + откуда + ')' : ''));
    });

    await подготовитьПодделку(страница, { версия: '7.10' });

    const адрес = (файл) => 'http://127.0.0.1:' + портСтраниц + '/' + файл;

    // 1. Лобби Дурака
    console.log('1. Лобби Дурака...');
    красные.length = 0;
    await страница.goto(адрес('index.html'), { waitUntil: 'domcontentloaded' });
    if (await ждатьВидимой(страница, '[data-игра="дурак"]')) {
      await нажать(страница, '[data-игра="дурак"]', 'плитка Дурака');
      const лобби = await ждатьВидимогоЭкрана(страница, 'экран-лобби', 5000);
      if (лобби) {
        const файл = await сделатьСнимок(страница, 'после-починки-дурак-лобби.png', ПАПКА_СНИМКОВ);
        if (файл) снятыеСнимки.push(файл);
      } else {
        беды.push('Лобби Дурака не открылось');
      }
    } else {
      беды.push('Плитка Дурака не найдена');
    }
    if (красные.length > 0) {
      console.log('    Ошибки консоли:');
      красные.forEach(е => console.log('      ' + е));
    }

    // 2. Лобби Шашек
    console.log('\n2. Лобби Шашек...');
    красные.length = 0;
    await страница.goto(адрес('шашки.html'), { waitUntil: 'domcontentloaded' });
    const лоббиШашек = await ждатьВидимогоЭкрана(страница, 'экран-лобби', 5000);
    if (лоббиШашек) {
      const файл = await сделатьСнимок(страница, 'после-починки-шашки-лобби.png', ПАПКА_СНИМКОВ);
      if (файл) снятыеСнимки.push(файл);
    } else {
      беды.push('Лобби Шашек не открылось');
    }
    if (красные.length > 0) {
      console.log('    Ошибки консоли:');
      красные.forEach(е => console.log('      ' + е));
    }

    // 3. Лобби Шахмат
    console.log('\n3. Лобби Шахмат...');
    красные.length = 0;
    await страница.goto(адрес('шахматы.html'), { waitUntil: 'domcontentloaded' });
    const лоббиШахмат = await ждатьВидимогоЭкрана(страница, 'экран-лобби', 5000);
    if (лоббиШахмат) {
      const файл = await сделатьСнимок(страница, 'после-починки-шахматы-лобби.png', ПАПКА_СНИМКОВ);
      if (файл) снятыеСнимки.push(файл);
    } else {
      беды.push('Лобби Шахмат не открылось');
    }
    if (красные.length > 0) {
      console.log('    Ошибки консоли:');
      красные.forEach(е => console.log('      ' + е));
    }

    // 4. Лобби Нард
    console.log('\n4. Лобби Нард...');
    красные.length = 0;
    await страница.goto(адрес('нарды.html'), { waitUntil: 'domcontentloaded' });
    const лоббиНард = await ждатьВидимогоЭкрана(страница, 'экран-лобби', 5000);
    if (лоббиНард) {
      const файл = await сделатьСнимок(страница, 'после-починки-нарды-лобби.png', ПАПКА_СНИМКОВ);
      if (файл) снятыеСнимки.push(файл);
    } else {
      беды.push('Лобби Нард не открылось');
    }
    if (красные.length > 0) {
      console.log('    Ошибки консоли:');
      красные.forEach(е => console.log('      ' + е));
    }

    // 5. Экран «Играть с другом» Дурака
    console.log('\n5. Экран «Играть с другом» (Дурак)...');
    красные.length = 0;
    try {
      await страница.goto(адрес('index.html'), { waitUntil: 'domcontentloaded' });
      if (await ждатьВидимой(страница, '[data-игра="дурак"]')) {
        if (await нажать(страница, '[data-игра="дурак"]', 'плитка Дурака')) {
          if (await ждатьВидимогоЭкрана(страница, 'экран-лобби', 5000)) {
            // Ищем кнопку для входа с другом
            const кнопкиДрузей = await страница.$$('[data-вход="друг"], [data-action="с-другом"], #лобби-играть-с-другом');
            if (кнопкиДрузей.length > 0) {
              try {
                await страница.click('[data-вход="друг"], [data-action="с-другом"], #лобби-играть-с-другом', { timeout: 3000 });
                console.log('    нажал: кнопка «Играть с другом»');
                await спать(500);
                const экран = await ждатьВидимогоЭкрана(страница, 'экран-друга', 5000);
                if (экран) {
                  const файл = await сделатьСнимок(страница, 'после-починки-дурак-с-другом.png', ПАПКА_СНИМКОВ);
                  if (файл) снятыеСнимки.push(файл);
                } else {
                  console.log('    ! Экран «Играть с другом» не открылся');
                }
              } catch (е) {
                console.log('    ! Не удалось нажать кнопку: ' + е.message);
              }
            } else {
              console.log('    ! Кнопка «Играть с другом» не найдена в лобби');
            }
          }
        }
      }
    } catch (е) {
      console.log('    ! Ошибка при попытке открыть экран: ' + е.message);
    }
    if (красные.length > 0) {
      console.log('    Ошибки консоли:');
      красные.forEach(е => console.log('      ' + е));
    }

    // 6. Экран «Играть с другом» Шашек (если возможно)
    console.log('\n6. Экран «Играть с другом» (Шашки)...');
    красные.length = 0;
    try {
      await страница.goto(адрес('шашки.html'), { waitUntil: 'domcontentloaded' });
      if (await ждатьВидимогоЭкрана(страница, 'экран-лобби', 5000)) {
        // Ищем кнопку для входа с другом
        const кнопкиДрузей = await страница.$$('[data-вход="друг"], [data-action="с-другом"], #лобби-играть-с-другом');
        if (кнопкиДрузей.length > 0) {
          try {
            await страница.click('[data-вход="друг"], [data-action="с-другом"], #лобби-играть-с-другом', { timeout: 3000 });
            console.log('    нажал: кнопка «Играть с другом»');
            await спать(500);
            const экран = await ждатьВидимогоЭкрана(страница, 'экран-друга', 5000);
            if (экран) {
              const файл = await сделатьСнимок(страница, 'после-починки-шашки-с-другом.png', ПАПКА_СНИМКОВ);
              if (файл) снятыеСнимки.push(файл);
            } else {
              console.log('    ! Экран «Играть с другом» не открылся');
            }
          } catch (е) {
            console.log('    ! Не удалось нажать кнопку: ' + е.message);
          }
        } else {
          console.log('    ! Кнопка «Играть с другом» не найдена в лобби Шашек');
        }
      } else {
        console.log('    ! Лобби Шашек не открылось');
      }
    } catch (е) {
      console.log('    ! Ошибка при попытке открыть экран: ' + е.message);
    }
    if (красные.length > 0) {
      console.log('    Ошибки консоли:');
      красные.forEach(е => console.log('      ' + е));
    }

    await контекст.close();
    await браузер.close();
    браузер = null;
    console.log('\n✓ Браузер закрыт');

  } finally {
    if (браузер) { try { await браузер.close(); } catch (е) { /* уже закрыт */ } }
    if (процессСтраниц && процессСтраниц.pid) {
      console.log('Гашу сервер (PID ' + процессСтраниц.pid + ')...');
      процессСтраниц.kill();
      const молчит = await ждатьМолчания('http://127.0.0.1:' + портСтраниц + '/index.html', 5000);
      console.log('Порт ' + портСтраниц + ': ' + (молчит ? 'молчит ✓' : 'ВСЁ ЕЩЁ ОТВЕЧАЕТ!'));
    }
  }

  console.log('\n=== ИТОГОВЫЙ ОТЧЁТ ===');
  console.log('Сервер работал на порту: ' + портСтраниц);
  console.log('Снято снимков: ' + снятыеСнимки.length);
  console.log('');

  if (снятыеСнимки.length > 0) {
    console.log('Снимки:');
    снятыеСнимки.forEach(ф => console.log('  ' + ф));
  }

  if (красные.length > 0) {
    console.log('\nОшибки консоли: ' + красные.length);
    красные.forEach(е => console.log('  ' + е));
  } else {
    console.log('\nОшибок консоли: нет ✓');
  }

  if (беды.length > 0) {
    console.log('\nНе удалось открыть:');
    беды.forEach(б => console.log('  ' + б));
    process.exit(1);
  }
}

запустить().catch((ошибка) => {
  console.error('\nЦентральная ошибка: ' + ошибка.message);
  console.error(ошибка.stack);
  process.exit(2);
});
