'use strict';
/* Браузерная проверка: страница игры на английском — без русских надписей.
   Для каждой страницы: открываем с games_language=en (ширина 390×844), ждём лобби,
   собираем ВИДИМЫЕ надписи и атрибуты aria-label/title/placeholder с кириллицей,
   открываем лист «⋯» и смотрим строку языка. Снимки — tests/снимки/языки/.
   Запуск:  node tests/языки-страницы-браузер.js
   Ломающий: node tests/языки-страницы-браузер.js --сломать <временная папка>
     (копия словаря шахмат с вычеркнутой половиной строк подсовывается странице
     перехватом запроса; проверка обязана найти кириллицу и провалиться). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium, безTelegram } = require('./браузер-робот');

const КОРЕНЬ = path.join(__dirname, '..');
const КИРИЛЛИЦА = /[А-Яа-яЁёІіЇїЄєҐґ]/;

// Страницы: [файл, id узла «лобби готово»]. Для index — витрина.
const СТРАНИЦЫ = [
  ['шахматы.html', 'экран-лобби'], ['шашки.html', 'экран-лобби'], ['нарды.html', 'экран-лобби'],
  ['домино.html', 'экран-лобби'], ['морской-бой.html', 'экран-лобби'], ['катан.html', 'экран-лобби'],
  ['деберц.html', 'экран-лобби'], ['монополия.html', 'экран-лобби'], ['захват.html', 'экран-лобби'],
  ['index.html', 'экран-витрины']
];
const И_НА_УКРАИНСКОМ = ['шахматы.html', 'домино.html'];

// Допущенное без перевода: [регулярка надписи, причина]. Пока пусто — ничего не прощаем.
const ДОПУЩЕНО = [
  // пример: [/^Игрок$/, 'имя игрока-заглушки'],
];

// Свой маленький сервер на свободном порту (порт 0): отдаёт и шрифты, и картинки
// (общий бастион-стенд их не отдаёт и давал бы ложные 404).
async function поднятьСервер() {
  const http = require('node:http');
  const типы = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
  const сервер = http.createServer((з, о) => {
    let имя;
    try { имя = decodeURIComponent(new URL(з.url, 'http://localhost').pathname); } catch (_) { о.writeHead(400); return о.end(); }
    const файл = path.resolve(КОРЕНЬ, '.' + имя);
    if (!файл.startsWith(КОРЕНЬ + path.sep)) { о.writeHead(404); return о.end(); }
    fs.readFile(файл, (е, данные) => {
      if (е) { о.writeHead(404); return о.end(); }
      о.setHeader('Content-Type', типы[path.extname(файл)] || 'application/octet-stream');
      о.end(данные);
    });
  });
  await new Promise(р => сервер.listen(0, '127.0.0.1', р));
  return { url: 'http://127.0.0.1:' + сервер.address().port, close: () => new Promise(р => сервер.close(р)) };
}

// Собираем кириллицу на странице. Всё в одном evaluate — один запрос на проход.
function собрать() {
  const видим = у => {
    for (let э = у; э && э.nodeType === 1; э = э.parentElement) {
      if (э.closest('[data-no-translate]')) return false;
      const с = getComputedStyle(э);
      if (с.display === 'none' || с.visibility === 'hidden') return false;
    }
    const р = у.getBoundingClientRect();
    return р.width > 0 && р.height > 0;
  };
  const всего = [], кир = [];
  const ре = /[А-Яа-яЁёІіЇїЄєҐґ]/;
  const учесть = (текст, откуда) => {
    const т = (текст || '').replace(/\s+/g, ' ').trim();
    if (!т) return;
    всего.push(т);
    if (ре.test(т)) кир.push(откуда + ': ' + т);
  };
  const обход = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let у = обход.nextNode(); у; у = обход.nextNode()) {
    const р = у.parentElement;
    if (!р || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(р.tagName)) continue;
    if (видим(р)) учесть(у.nodeValue, 'текст');
  }
  for (const э of document.querySelectorAll('[aria-label],[title],[placeholder]')) {
    if (!видим(э)) continue;
    for (const а of ['aria-label', 'title', 'placeholder']) if (э.hasAttribute(а)) учесть(э.getAttribute(а), а);
  }
  return { всего: всего.length, кир };
}

function допущено(строка) {
  const т = строка.replace(/^[^:]*: /, '');
  return ДОПУЩЕНО.some(([ре]) => ре.test(т));
}

// Видимая кнопка «⋯» лобби/витрины: id вида кнопка-…-ещё или текст «⋯».
async function найтиКнопкуЛиста(страница) {
  return страница.evaluate(() => {
    const видна = э => { const р = э.getBoundingClientRect(); return р.width > 0 && р.height > 0 && getComputedStyle(э).display !== 'none'; };
    // «⋯» в тексте, либо подпись «More»/«Ещё» (на en страница уже переведена), либо id «…лобби…ещё».
    const к = [...document.querySelectorAll('button,[role=button]')].filter(э =>
      видна(э) && э.getBoundingClientRect().top < 110 && (/⋯/.test(э.textContent) || /^(More|Ещё|Ще)$/.test(э.getAttribute('aria-label') || '') || (/ещё/.test(э.id) && /лобби/.test(э.id))));
    if (!к.length) return undefined;
    к[0].setAttribute('data-проверка-ещё', '1');
    return 'метка';
  });
}

async function проверитьСтраницу(браузер, стенд, [файл, ждать], язык, опции) {
  const итог = { файл, язык, всего: 0, кир: [], лист: 'нет кнопки', листКир: [], консоль: [], провалы: [] };
  const страница = await браузер.newPage({ viewport: { width: 390, height: 844 }, locale: язык === 'en' ? 'en-US' : 'uk-UA' });
  try {
    await безTelegram(страница);
    await страница.addInitScript(л => { try { localStorage.setItem('games_language', л); } catch (_) {} }, язык);
    await страница.route('https://igra.medart.com.ua/**', м => м.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    if (опции.подмена) await страница.route(у => decodeURIComponent(у.pathname).endsWith('/js/языки-шахматы.js'), м => м.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: опции.подмена }));
    страница.on('pageerror', е => итог.консоль.push('pageerror: ' + е.message));
    страница.on('console', с => { if (с.type() === 'error' && !/503|net::ERR_FAILED/.test(с.text())) итог.консоль.push('console: ' + с.text()); });
    страница.on('response', о => { if (о.url().startsWith(стенд.url) && о.status() >= 400) итог.консоль.push('HTTP ' + о.status() + ': ' + о.url().replace(стенд.url, '')); });
    await страница.goto(стенд.url + '/' + encodeURI(файл));
    try {
      await страница.waitForSelector('#' + ждать, { state: 'visible', timeout: 10000 });
    } catch (_) { итог.провалы.push('лобби «' + ждать + '» не появилось'); }
    await страница.waitForTimeout(1200); // перевод накладывается по мере изменений DOM
    const р = await страница.evaluate(собрать);
    итог.всего = р.всего;
    итог.кир = р.кир.filter(с => !допущено(с));
    if (итог.всего === 0) итог.провалы.push('видимых надписей ноль — страница не загрузилась');
    if (итог.кир.length) итог.провалы.push('непереведённых надписей: ' + итог.кир.length);
    const снимки = path.join(__dirname, 'снимки', 'языки');
    fs.mkdirSync(снимки, { recursive: true });
    if (!опции.безСнимков) await страница.screenshot({ path: path.join(снимки, файл.replace(/\.html$/, '') + '-' + язык + '.png') });
    // Лист «⋯» — только на английском.
    if (язык === 'en') {
      const id = await найтиКнопкуЛиста(страница);
      if (id === undefined) {
        const верхние = await страница.evaluate(() => [...document.querySelectorAll('button,a,[role=button]')].filter(э => { const р = э.getBoundingClientRect(); return р.width > 0 && р.top < 110; }).map(э => (э.id || э.className || э.tagName) + '«' + (э.getAttribute('aria-label') || э.textContent.trim()).slice(0, 20) + '»'));
        итог.лист = 'кнопки «⋯» не нашлось (не проверено); сверху видны: ' + верхние.join(', ');
      }
      else {
        await страница.evaluate(() => document.querySelector('[data-проверка-ещё]').click());
        try {
          await страница.waitForSelector('#лист-ещё:not(.скрыт), #лист-игры:not(.скрыт)', { timeout: 3000 });
          await страница.waitForTimeout(600);
          const текстЛиста = await страница.evaluate(() => document.querySelector('#лист-ещё:not(.скрыт), #лист-игры:not(.скрыт)').innerText);
          const л = await страница.evaluate(() => {
            const ле = document.querySelector('#лист-ещё:not(.скрыт), #лист-игры:not(.скрыт)');
            const видим = э => { const р = э.getBoundingClientRect(); return р.width > 0 && р.height > 0; };
            const кир = [];
            for (const э of ле.querySelectorAll('*')) {
              if (!видим(э) || э.closest('[data-no-translate]')) continue;
              for (const у of э.childNodes) if (у.nodeType === 3 && /[А-Яа-яЁёІіЇїЄєҐґ]/.test(у.nodeValue)) кир.push(у.nodeValue.trim());
              for (const а of ['aria-label', 'title']) if (/[А-Яа-яЁёІіЇїЄєҐґ]/.test(э.getAttribute(а) || '')) кир.push(а + ': ' + э.getAttribute(а));
            }
            return кир;
          });
          итог.листКир = л.filter(с => !допущено(с));
          итог.лист = /English/.test(текстЛиста) ? 'открыт, строка языка с English есть' : 'открыт, но строки языка с «English» нет';
          if (!/English/.test(текстЛиста)) итог.провалы.push('в листе нет строки языка с «English»');
          if (итог.листКир.length) итог.провалы.push('кириллица в листе: ' + итог.листКир.length);
        } catch (_) { итог.лист = 'кнопка нажата, лист не открылся'; итог.провалы.push('лист «⋯» не открылся'); }
      }
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
  let подмена = null;
  if (ломаем) {
    const папка = process.argv[иск + 1];
    if (!папка) { console.error('Укажите временную папку: --сломать <папка>'); process.exit(2); }
    fs.mkdirSync(папка, { recursive: true });
    const строки = fs.readFileSync(path.join(КОРЕНЬ, 'js', 'языки-шахматы.js'), 'utf8').split('\n');
    let н = 0;
    const ост = строки.filter(с => !(/^[^|\n]+\|[^|\n]+\|[^|\n]+$/.test(с) && (н++ % 2 === 0)));
    подмена = ост.join('\n');
    fs.writeFileSync(path.join(папка, 'языки-шахматы.js'), подмена);
    console.log('Сломана КОПИЯ словаря: вычеркнуто строк ' + (строки.length - ост.length) + ' (' + path.join(папка, 'языки-шахматы.js') + ')');
  }
  const стенд = await поднятьСервер();
  const браузер = await chromium.launch({ headless: true });
  const итоги = [];
  try {
    const список = ломаем ? СТРАНИЦЫ.filter(с => с[0] === 'шахматы.html') : СТРАНИЦЫ;
    for (const с of список) {
      итоги.push(await проверитьСтраницу(браузер, стенд, с, 'en', { подмена, безСнимков: ломаем }));
      if (!ломаем && И_НА_УКРАИНСКОМ.includes(с[0])) итоги.push(await проверитьСтраницу(браузер, стенд, с, 'uk', {}));
    }
  } finally { await браузер.close(); await стенд.close(); }
  let провалов = 0;
  for (const и of итоги) {
    console.log('\n== ' + и.файл + ' [' + и.язык + ']: видимых надписей ' + и.всего + ', с кириллицей ' + и.кир.length + (и.язык === 'en' ? '; лист: ' + и.лист : ''));
    if (и.язык === 'en') for (const с of и.кир.slice(0, 15)) console.log('   • ' + с);
    else console.log('   (украинский: снимок для смотрителя, кириллица не считается ошибкой)');
    for (const с of и.листКир.slice(0, 10)) console.log('   • лист: ' + с);
    for (const с of и.консоль.slice(0, 8)) console.log('   консоль: ' + с);
    // На украинском провалом считаем только падение/пустую страницу/консоль.
    const провалы = и.язык === 'en' ? и.провалы : и.провалы.filter(п => !/^непереведённых/.test(п));
    for (const п of провалы) { console.log('   ПРОВАЛ: ' + п); провалов++; }
  }
  console.log('\nИтого проверок: ' + итоги.length + ', провалов: ' + провалов);
  if (ломаем) console.log(провалов > 0 ? 'Ломающий запуск покраснел, как и должен.' : 'ВНИМАНИЕ: ломающий запуск НЕ покраснел — проверка слепая!');
  process.exitCode = провалов ? 1 : 0;
})().catch(е => { console.error(е); process.exitCode = 1; });
