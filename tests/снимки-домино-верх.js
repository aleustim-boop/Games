'use strict';

/**
 * ДОМИНО: ВЕРХНЯЯ СТРОКА ЭКРАНОВ «НАСТРОЙКИ» И «С ДРУГОМ» — СНИМКИ В БРАУЗЕРЕ (playwright).
 *
 * До экранов доходим настоящими нажатиями, как игрок, а не снятием классов
 * (снятие классов клало экраны друг на друга и давало ложные снимки):
 *   лобби → «Играть с ботами» → экран дом-настройки;
 *   лобби → «Играть онлайн» → «Создать игру» → экран экран-друга.
 *
 * На каждом экране требуем:
 *   - виден ровно один экран и это нужный;
 *   - на странице ровно одна видимая строка .верх-игры, и она внутри этого экрана;
 *   - в ней ровно одна видимая data-назад и ровно одна data-меню;
 *   - «‹» прижата к левому краю (центр в левой трети окна), «⋯» — к правому.
 * Ноль найденного — провал, а не пропуск.
 *
 * Запуск без флагов: проверка + снимки tests/снимки/домино-настройки-верх.png
 *   и tests/снимки/домино-друг-верх.png (390×844).
 * --сломать: копия домино.html во временной папке без класса верх-игры на
 *   экране-друга; проверка обязана покраснеть (снимки не пишутся).
 * --сломать-вид: копия style-домино.css без правила, тянущего строку на всю
 *   ширину; проверка обязана покраснеть (снимки не пишутся).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { chromium } = require(path.join(__dirname, 'браузер-робот.js'));

const ПРОЕКТ = path.join(__dirname, '..');
const ШИРИНА = 390;
const ВЫСОТА = 844;
const ТИПЫ = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

// Экраны: как до них дойти нажатиями и как назвать снимок.
const ЭКРАНЫ = [
  { id: 'дом-настройки', нажатия: ['#дом-боты'], снимок: 'домино-настройки-верх.png' },
  { id: 'экран-друга', нажатия: ['#лобби-найти-игру', '#открытые-столы-создать'], снимок: 'домино-друг-верх.png' }
];

let провалов = 0;
let проверок = 0;

function провал(текст) {
  провалов++;
  console.error('  ПРОВАЛ: ' + текст);
}

// Свой http-сервер файлов; подмены — { 'имя-файла': путь-к-копии }.
function поднятьСерверФайлов(подмены) {
  const сервер = http.createServer(function (запрос, ответ) {
    let путь;
    try {
      путь = decodeURIComponent(new URL(запрос.url, 'http://x').pathname);
    } catch (_) {
      ответ.writeHead(400);
      ответ.end();
      return;
    }
    const файл = путь === '/' ? path.join(ПРОЕКТ, 'домино.html') : path.join(ПРОЕКТ, путь);
    if (path.relative(ПРОЕКТ, файл).startsWith('..')) {
      ответ.writeHead(403);
      ответ.end();
      return;
    }
    const отдать = подмены[path.basename(файл)] || файл;
    fs.readFile(отдать, function (ош, данные) {
      if (ош) {
        ответ.writeHead(404);
        ответ.end('нет файла');
        return;
      }
      ответ.writeHead(200, {
        'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      ответ.end(данные);
    });
  });
  return new Promise(function (готово, беда) {
    сервер.once('error', беда);
    сервер.listen(0, '127.0.0.1', function () {
      готово(сервер);
    });
  });
}

// Порча копии домино.html: у экрана-друга убираем класс верх-игры.
function испортитьРазметку(папка) {
  const текст = fs.readFileSync(path.join(ПРОЕКТ, 'домино.html'), 'utf8');
  const начало = текст.indexOf('id="экран-друга"');
  const место = начало < 0 ? -1 : текст.indexOf('class="верх-игры"', начало);
  if (место < 0) throw new Error('порча не удалась: в домино.html не нашлась строка верх-игры экрана-друга');
  const испорчено = текст.slice(0, место) + 'class="верх-испорчен"' + текст.slice(место + 'class="верх-игры"'.length);
  const копия = path.join(папка, 'домино.html');
  fs.writeFileSync(копия, испорчено);
  return копия;
}

// Порча копии style-домино.css: выкидываем правило про #экран-друга > .верх-игры.
function испортитьВид(папка) {
  const текст = fs.readFileSync(path.join(ПРОЕКТ, 'игры/домино/style-домино.css'), 'utf8');
  const строки = текст.split('\n');
  const оставить = строки.filter((с) => !с.includes('#экран-друга > .верх-игры'));
  if (оставить.length === строки.length) throw new Error('порча не удалась: правило #экран-друга > .верх-игры не нашлось в style-домино.css');
  const копия = path.join(папка, 'style-домино.css');
  fs.writeFileSync(копия, оставить.join('\n'));
  return копия;
}

// Измерения в странице: что видно и где стоят кнопки.
function измерить() {
  const видимо = (узел) => {
    for (let у = узел; у && у.nodeType === 1; у = у.parentElement) {
      const с = getComputedStyle(у);
      if (с.display === 'none' || с.visibility === 'hidden') return false;
    }
    const р = узел.getBoundingClientRect();
    return р.width > 0 && р.height > 0;
  };
  const центр = (узел) => {
    const р = узел.getBoundingClientRect();
    return { лево: р.left, право: р.right, центр: (р.left + р.right) / 2 };
  };
  const видимыеЭкраны = Array.from(document.querySelectorAll('.экран')).filter(видимо).map((э) => э.id);
  const видимыеСтроки = Array.from(document.querySelectorAll('.верх-игры')).filter(видимо);
  const строка = видимыеСтроки[0] || null;
  const назад = строка ? Array.from(строка.querySelectorAll('[data-назад]')).filter(видимо) : [];
  const меню = строка ? Array.from(строка.querySelectorAll('[data-меню]')).filter(видимо) : [];
  return {
    видимыеЭкраны,
    строкВсего: видимыеСтроки.length,
    строкаВЭкране: строка && строка.closest('.экран') ? строка.closest('.экран').id : null,
    назадВидимых: назад.length,
    менюВидимых: меню.length,
    назад: назад[0] ? центр(назад[0]) : null,
    меню: меню[0] ? центр(меню[0]) : null,
    окно: document.documentElement.clientWidth
  };
}

function проверитьИзмерения(экран, м) {
  проверок++;
  console.log('  видимые экраны: ' + JSON.stringify(м.видимыеЭкраны) + ', видимых строк верх-игры: ' + м.строкВсего + ', строка в экране: ' + м.строкаВЭкране);
  if (м.видимыеЭкраны.length !== 1 || м.видимыеЭкраны[0] !== экран.id) {
    провал('должен быть виден только экран ' + экран.id + ', а видны: ' + JSON.stringify(м.видимыеЭкраны));
  }
  if (м.строкВсего !== 1) провал('должна быть ровно одна видимая строка верх-игры, найдено ' + м.строкВсего + ' (ноль — тоже провал)');
  if (м.строкаВЭкране !== экран.id) провал('видимая строка верх-игры не внутри экрана ' + экран.id + ', а внутри ' + м.строкаВЭкране);
  if (м.назадВидимых !== 1) провал('видимых кнопок data-назад должно быть 1, найдено ' + м.назадВидимых);
  if (м.менюВидимых !== 1) провал('видимых кнопок data-меню должно быть 1, найдено ' + м.менюВидимых);
  if (!м.назад || !м.меню) return;
  console.log('  центр «‹» = ' + Math.round(м.назад.центр) + ', центр «⋯» = ' + Math.round(м.меню.центр) + ' (окно ' + м.окно + ')');
  if (!(м.назад.центр < м.окно / 3)) провал('«‹» не в левой трети окна: центр ' + Math.round(м.назад.центр));
  if (!(м.меню.центр > (м.окно * 2) / 3)) провал('«⋯» не в правой трети окна: центр ' + Math.round(м.меню.центр));
}

// Идём к экрану настоящими нажатиями из свежего лобби.
async function дойтиДоЭкрана(страница, адрес, экран) {
  await страница.goto(адрес + '/домино.html');
  await страница.waitForSelector('#экран-лобби.экран--виден', { timeout: 8000 });
  await страница.waitForTimeout(300);
  for (const селектор of экран.нажатия) {
    await страница.click(селектор, { timeout: 5000 });
    await страница.waitForTimeout(350);
  }
  await страница.waitForSelector('#' + экран.id + '.экран--виден', { timeout: 5000 });
  await страница.waitForTimeout(250);
}

async function снять(страница, имя) {
  const папка = path.join(ПРОЕКТ, 'tests', 'снимки');
  fs.mkdirSync(папка, { recursive: true });
  const файл = path.join(папка, имя);
  await страница.screenshot({ path: файл });
  console.log('  снято: ' + файл);
}

async function основной() {
  const ломатьРазметку = process.argv.includes('--сломать');
  const ломатьВид = process.argv.includes('--сломать-вид');
  const ломаем = ломатьРазметку || ломатьВид;
  const подмены = {};
  let временная = null;
  let сервер = null;
  let браузер = null;

  try {
    if (ломаем) {
      временная = fs.mkdtempSync(path.join(os.tmpdir(), 'домино-верх-'));
      if (ломатьРазметку) подмены['домино.html'] = испортитьРазметку(временная);
      if (ломатьВид) подмены['style-домино.css'] = испортитьВид(временная);
      console.log('Порченые копии лежат в ' + временная);
    }

    сервер = await поднятьСерверФайлов(подмены);
    const адрес = 'http://127.0.0.1:' + сервер.address().port;
    console.log('Свой сервер файлов: ' + адрес + ' (PID процесса проверки ' + process.pid + ')');

    браузер = await chromium.launch({ headless: true });
    const страница = await браузер.newPage({ viewport: { width: ШИРИНА, height: ВЫСОТА } });
    const ошибкиКонсоли = [];
    страница.on('pageerror', (ош) => ошибкиКонсоли.push(String(ош.message || ош)));

    for (const экран of ЭКРАНЫ) {
      console.log('\n### ' + экран.id);
      try {
        await дойтиДоЭкрана(страница, адрес, экран);
      } catch (ош) {
        проверок++;
        провал('до экрана ' + экран.id + ' не дошли нажатиями: ' + ош.message.split('\n')[0]);
        continue;
      }
      проверитьИзмерения(экран, await страница.evaluate(измерить));
      if (!ломаем) await снять(страница, экран.снимок);
    }

    if (ошибкиКонсоли.length) {
      console.log('\nОшибки страницы:');
      ошибкиКонсоли.forEach((т) => console.log('  ' + т));
    }

    console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
    if (ломаем) {
      if (провалов === 0) {
        console.error('Режим порчи: проверка обязана покраснеть, а она зелёная.');
        process.exitCode = 1;
      } else {
        console.log('Режим порчи: проверка покраснела, как и должна.');
        process.exitCode = 0;
      }
    } else {
      process.exitCode = провалов > 0 ? 1 : 0;
    }
  } catch (ош) {
    console.error('Ошибка: ' + ош.message);
    process.exitCode = 1;
  } finally {
    if (браузер) await браузер.close();
    if (сервер) сервер.close();
    for (const копия of Object.values(подмены)) {
      if (fs.existsSync(копия)) fs.unlinkSync(копия);
    }
    if (временная && fs.existsSync(временная)) fs.rmdirSync(временная);
  }
}

основной();
