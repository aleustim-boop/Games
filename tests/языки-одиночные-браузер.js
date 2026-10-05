'use strict';
/* Браузерная проверка: 12 одиночных страниц на английском — без русских надписей,
   со строкой «Язык» в окне справки/настроек.
   Для каждой страницы (390×844, games_language=en):
     1) открываем, ждём отрисовки, ошибки консоли — провал;
     2) ищем видимую кириллицу в тексте и в aria-label/title/placeholder;
     3) нажимаем кнопку справки/настроек, как игрок; в открытом <dialog> должна быть строка
        «Язык» с подписью «English» и не должно быть кириллицы (нет кнопки/окна — ПРОВАЛ);
     4) снимок открытого окна: tests/снимки/языки/<страница>-окно-en.png.
   Список страниц берётся из разметки: все *.html корня с «язык-строка.js»; их должно быть ровно 12.
   Запуск:  node tests/языки-одиночные-браузер.js
   Ломающий: node tests/языки-одиночные-браузер.js --сломать <временная папка>
     (во временной папке делается копия 2048.html без подключения словаря страницы;
      копия подсовывается перехватом запроса; проверка обязана покраснеть). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium, безTelegram } = require('./браузер-робот');

const КОРЕНЬ = path.join(__dirname, '..');
const КИР = '[А-Яа-яЁёІіЇїЄєҐґ]';
const ОЖИДАЕМО_СТРАНИЦ = 12;
// Кнопки, которыми игрок открывает справку или настройки (первая видимая).
const КНОПКИ_ОКНА = ['#help', '[data-rules]', '#settings', '#how'];
// Узлы, где русский остаётся намеренно: [страница, селектор].
const НАМЕРЕННО_РУССКОЕ = [['wordsearch.html', '#playfield, #game-tools']];

function найтиСтраницы() {
  return fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html') &&
    fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8').includes('язык-строка.js')).sort();
}

async function поднятьСервер(подмены) {
  const http = require('node:http');
  const типы = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
  const сервер = http.createServer((з, о) => {
    let имя;
    try { имя = decodeURIComponent(new URL(з.url, 'http://localhost').pathname); } catch (_) { о.writeHead(400); return о.end(); }
    const файл = подмены[имя.slice(1)] || path.resolve(КОРЕНЬ, '.' + имя);
    if (!подмены[имя.slice(1)] && !файл.startsWith(КОРЕНЬ + path.sep)) { о.writeHead(404); return о.end(); }
    fs.readFile(файл, (е, данные) => {
      if (е) { о.writeHead(404); return о.end(); }
      о.setHeader('Content-Type', типы[path.extname(файл)] || 'application/octet-stream');
      о.end(данные);
    });
  });
  await new Promise(р => сервер.listen(0, '127.0.0.1', р));
  return { url: 'http://127.0.0.1:' + сервер.address().port, close: () => new Promise(р => сервер.close(р)) };
}

// Кириллица в видимом: корень — document.body или открытый dialog; исключения — селектор.
function собрать({ корень, исключить, ре }) {
  const РЕ = new RegExp(ре);
  const кор = корень ? document.querySelector(корень) : document.body;
  if (!кор) return { всего: 0, кир: [], нет: true };
  const искл = исключить ? [...document.querySelectorAll(исключить)] : [];
  const видим = у => {
    for (let э = у; э && э.nodeType === 1; э = э.parentElement) {
      if (э.closest('[data-no-translate]')) return false;
      if (искл.some(и => и === э || и.contains(э))) return false;
      const с = getComputedStyle(э);
      if (с.display === 'none' || с.visibility === 'hidden') return false;
    }
    const р = у.getBoundingClientRect();
    return р.width > 0 && р.height > 0;
  };
  const всего = [], кир = [];
  const учесть = (текст, откуда, место) => {
    const т = (текст || '').replace(/\s+/g, ' ').trim();
    if (!т) return;
    всего.push(т);
    if (РЕ.test(т)) кир.push(откуда + ': «' + т + '» (' + место + ')');
  };
  const имяУзла = э => э.tagName.toLowerCase() + (э.id ? '#' + э.id : '') + (typeof э.className === 'string' && э.className ? '.' + э.className.trim().split(/\s+/)[0] : '');
  const обход = document.createTreeWalker(кор, NodeFilter.SHOW_TEXT);
  for (let у = обход.nextNode(); у; у = обход.nextNode()) {
    const р = у.parentElement;
    if (!р || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(р.tagName)) continue;
    if (видим(р)) учесть(у.nodeValue, 'текст', имяУзла(р));
  }
  for (const э of кор.querySelectorAll('[aria-label],[title],[placeholder]')) {
    if (!видим(э)) continue;
    for (const а of ['aria-label', 'title', 'placeholder']) if (э.hasAttribute(а)) учесть(э.getAttribute(а), а, имяУзла(э));
  }
  return { всего: всего.length, кир, текст: всего.join(' | ') };
}

async function проверитьСтраницу(браузер, стенд, файл, опции) {
  const итог = { файл, всего: 0, кир: [], окно: 'не открывалось', окноКир: [], консоль: [], сбои: [], провалы: [] };
  const страница = await браузер.newPage({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  try {
    await безTelegram(страница);
    await страница.addInitScript(л => { try { localStorage.setItem('games_language', л); } catch (_) {} }, 'en');
    await страница.route('https://igra.medart.com.ua/**', м => м.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    // Боевой сервер комнат (порт 8790) не трогаем: страница ждёт его «пульс», отвечаем заглушкой.
    await страница.route('http://127.0.0.1:8790/**', м => м.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    страница.on('pageerror', е => итог.консоль.push('pageerror: ' + е.message));
    страница.on('console', с => { if (с.type() === 'error' && !/503|net::ERR_FAILED/.test(с.text())) итог.консоль.push('console: ' + с.text()); });
    страница.on('requestfailed', з => итог.сбои.push(з.url().slice(0, 80)));
    страница.on('response', о => { if (о.url().startsWith(стенд.url) && о.status() >= 400) итог.консоль.push('HTTP ' + о.status() + ': ' + о.url().replace(стенд.url, '')); });
    await страница.goto(стенд.url + '/' + encodeURI(файл));
    await страница.waitForTimeout(1800); // перевод накладывается по мере изменений DOM
    const искл = НАМЕРЕННО_РУССКОЕ.filter(([ф]) => ф === файл).map(([, с]) => с).join(', ');
    const р = await страница.evaluate(собрать, { корень: null, исключить: искл, ре: КИР });
    итог.всего = р.всего;
    итог.кир = р.кир;
    if (р.всего === 0) итог.провалы.push('видимых надписей ноль — страница не загрузилась');
    if (р.кир.length) итог.провалы.push('непереведённых надписей на странице: ' + р.кир.length);

    // Окно справки/настроек: нажимаем кнопку, как игрок.
    const метка = await страница.evaluate(кн => {
      for (const с of кн) {
        const э = [...document.querySelectorAll(с)].find(э => { const р = э.getBoundingClientRect(); return р.width > 0 && р.height > 0 && getComputedStyle(э).visibility !== 'hidden'; });
        if (э) { э.setAttribute('data-проверка-окно', '1'); return с; }
      }
      return null;
    }, КНОПКИ_ОКНА);
    if (!метка) {
      итог.окно = 'кнопка справки/настроек не найдена';
      итог.провалы.push('кнопки справки/настроек нет (' + КНОПКИ_ОКНА.join(', ') + ')');
    } else {
      await страница.click('[data-проверка-окно]');
      try {
        await страница.waitForSelector('dialog[open]', { timeout: 4000 });
        await страница.waitForTimeout(800);
        const о = await страница.evaluate(собрать, { корень: 'dialog[open]', исключить: '', ре: КИР });
        const естьСтрока = await страница.evaluate(() => {
          const с = document.querySelector('dialog[open] [data-язык-строка]');
          return с ? с.innerText.replace(/\s+/g, ' ').trim() : null;
        });
        // Допущено: в английской фразе названы сами русские буквы «Е» и «Ё» — так и задумано.
        о.кир = о.кир.filter(с => !(файл === 'wordsearch.html' && /The letters Е and Ё are different/.test(с)));
        итог.окноКир = о.кир;
        if (естьСтрока === null) { итог.окно = 'открыто (' + метка + '), строки «Язык» нет'; итог.провалы.push('в окне нет строки «Язык»'); }
        else {
          итог.окно = 'открыто (' + метка + '), строка: «' + естьСтрока + '»';
          if (!/^Language\s+English$/i.test(естьСтрока)) итог.провалы.push('строка языка не «Language English»: «' + естьСтрока + '»');
        }
        if (о.всего === 0) итог.провалы.push('в окне видимых надписей ноль');
        if (о.кир.length) итог.провалы.push('кириллица в окне: ' + о.кир.length);
        if (!опции.безСнимков) {
          const снимки = path.join(__dirname, 'снимки', 'языки');
          fs.mkdirSync(снимки, { recursive: true });
          await страница.screenshot({ path: path.join(снимки, файл.replace(/\.html$/, '') + '-окно-en.png') });
        }
      } catch (е) { итог.окно = 'кнопка нажата, окно не открылось'; итог.провалы.push('окно <dialog> не открылось: ' + е.message.split('\n')[0]); }
    }
    if (итог.консоль.length) итог.провалы.push('ошибки консоли: ' + итог.консоль.length);
  } catch (е) {
    итог.провалы.push('падение: ' + е.message.split('\n')[0]);
  } finally { await страница.close(); }
  return итог;
}

(async () => {
  const иск = process.argv.indexOf('--сломать');
  const ломаем = иск >= 0;
  const подмены = {};
  let страницы = найтиСтраницы();
  let провалов = 0;
  if (страницы.length !== ОЖИДАЕМО_СТРАНИЦ) {
    console.log('ПРОВАЛ: страниц с «язык-строка.js» ' + страницы.length + ', ожидалось ' + ОЖИДАЕМО_СТРАНИЦ + ': ' + страницы.join(', '));
    провалов++;
  }
  if (ломаем) {
    const папка = process.argv[иск + 1];
    if (!папка) { console.error('Укажите временную папку: --сломать <папка>'); process.exit(2); }
    fs.mkdirSync(папка, { recursive: true });
    const исх = fs.readFileSync(path.join(КОРЕНЬ, '2048.html'), 'utf8');
    const порча = исх.replace(/<script[^>]*src="js\/языки-2048\.js[^"]*"[^>]*><\/script>/, '');
    if (порча === исх) { console.error('Ломающий: не нашёл подключение языки-2048.js в 2048.html'); process.exit(2); }
    const копия = path.join(папка, '2048.html');
    fs.writeFileSync(копия, порча);
    подмены['2048.html'] = копия;
    страницы = ['2048.html'];
    console.log('Сломана КОПИЯ страницы без словаря 2048: ' + копия);
  }
  const стенд = await поднятьСервер(подмены);
  const браузер = await chromium.launch({ headless: true });
  const итоги = [];
  try {
    for (const ф of страницы) итоги.push(await проверитьСтраницу(браузер, стенд, ф, { безСнимков: ломаем }));
  } finally { await браузер.close(); await стенд.close(); }
  for (const и of итоги) {
    console.log('\n== ' + и.файл + ': видимых надписей ' + и.всего + ', с кириллицей ' + и.кир.length + '; окно: ' + и.окно);
    for (const с of и.кир.slice(0, 15)) console.log('   • ' + с);
    for (const с of и.окноКир.slice(0, 10)) console.log('   • окно: ' + с);
    for (const с of и.консоль.slice(0, 8)) console.log('   консоль: ' + с);
    for (const с of и.сбои.slice(0, 4)) console.log('   сорвался запрос: ' + с);
    for (const п of и.провалы) { console.log('   ПРОВАЛ: ' + п); провалов++; }
  }
  console.log('\nИтого проверок: ' + (итоги.length + 1) + ', провалов: ' + провалов);
  if (ломаем) console.log(провалов > 0 ? 'Ломающий запуск покраснел, как и должен.' : 'ВНИМАНИЕ: ломающий запуск НЕ покраснел — проверка слепая!');
  process.exitCode = провалов ? 1 : 0;
})().catch(е => { console.error(е); process.exitCode = 1; });
