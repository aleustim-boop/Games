'use strict';

/* =====================================================================
   МОНОПОЛИЯ: КНОПКА «⋯» В ВЕРХНЕЙ СТРОКЕ — ЖИВОЙ БРАУЗЕРНЫЙ ПРОГОН.

   tests/монополия-верхняя-строка.js проверяет текст файлов без браузера;
   этот стенд нажимает пальцем: на лобби и на партии кнопка «⋯» видна,
   открывает общий лист «Ещё» (#лист-игры), «Закрыть» его прячет; в
   Telegram-версии партии кнопки не видно (там лист открывает системный
   пункт «Настройки»); ширины 390 и 320; консоль чистая.

   Партия с ботами поднимается тем же приёмом, что и
   tests/монополия-витрина-и-движение.js: localStorage 'monopoly-match-v1'
   с сидом, где ходит игрок 0, затем перезагрузка и клик «Продолжить».

   Страницы отдаёт свой маленький статический сервер (playwright не
   открывает file://) — копия нужных частей проекта (server/js/img/шрифты
   + html/css), тем же приёмом, что в tests/монополия-как-дурак-браузер.js.

   Запуск:
       node tests/браузер-монополия-верхняя-строка.js
       node tests/браузер-монополия-верхняя-строка.js --сломать
       node tests/браузер-монополия-верхняя-строка.js --корень <папка>

   --сломать: копия во временной папке, из копии монополия.html вырезана
   кнопка [data-more] в шапке партии (#экран-игры) — прогон обязан
   покраснеть ровно на пункте [партия].

   Перед запуском (сам стенд тоже это делает): node штаб/браузер-занят.js --ждать
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFileSync, spawnSync } = require('child_process');

const ПРОЕКТ = path.join(__dirname, '..');
const МЕТКА_ПАРТИИ = '[партия]';

let провалов = 0;
let проверок = 0;
function проверить(условие, слова) {
  проверок++;
  console.log((условие ? '  ок   — ' : '  ПЛОХО— ') + слова);
  if (!условие) провалов++;
  return условие;
}

const ТИПЫ_ФАЙЛОВ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2'
};

function поднятьСтатику(корень, порт) {
  const кореньПолный = path.resolve(корень);
  return new Promise(function (готово) {
    const сервер = http.createServer(function (запрос, ответ) {
      let адрес; try { адрес = decodeURIComponent(запрос.url.split('?')[0]); } catch (о) { адрес = '/некорректно'; }
      if (адрес === '/') адрес = '/монополия.html';
      const файл = path.join(кореньПолный, адрес.split(/[\\/]/).filter(Boolean).join(path.sep));
      if (файл !== кореньПолный && !файл.startsWith(кореньПолный + path.sep)) { ответ.writeHead(403); ответ.end(); return; }
      fs.readFile(файл, function (ошибка, данные) {
        if (ошибка) { ответ.writeHead(404); ответ.end('не найдено: ' + адрес); return; }
        ответ.writeHead(200, { 'Content-Type': ТИПЫ_ФАЙЛОВ[path.extname(файл).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        ответ.end(данные);
      });
    });
    сервер.listen(порт, '127.0.0.1', function () { готово(сервер); });
  });
}

/* Копия нужных частей проекта — тот же список, что и в
   tests/монополия-как-дурак-браузер.js (без него js/картинки/css не найдутся). */
function копияПроекта(папка) {
  for (const часть of ['server', ...require('./пути-проекта.js').папкиКода(), 'img']) {
    const откуда = path.join(ПРОЕКТ, часть);
    if (!fs.existsSync(откуда)) continue;
    fs.cpSync(откуда, path.join(папка, часть), { recursive: true, filter: (ф) => path.basename(ф) !== 'данные' && path.basename(ф) !== 'node_modules' });
  }
  for (const файл of fs.readdirSync(ПРОЕКТ)) {
    if (файл.endsWith('.html') || файл.endsWith('.css')) fs.copyFileSync(path.join(ПРОЕКТ, файл), path.join(папка, файл));
  }
}

/* Вырезать кнопку [data-more] из шапки партии (#экран-игры) в копии. */
function испортитьШапкуПартии(файлHtml) {
  const текст = fs.readFileSync(файлHtml, 'utf8');
  const секцОт = текст.indexOf('<section id="экран-игры"');
  if (секцОт === -1) throw new Error('приём порчи устарел: секции #экран-игры нет');
  const образец = /<button\s+data-more[\s\S]*?<\/button>/;
  const хвост = текст.slice(секцОт);
  const совпадение = хвост.match(образец);
  if (!совпадение) throw new Error('приём порчи устарел: [data-more] в шапке партии не нашли');
  fs.writeFileSync(файлHtml, текст.slice(0, секцОт) + хвост.replace(образец, ''), 'utf8');
}

async function прогнать(корень) {
  const { chromium, безTelegram } = require(path.join(ПРОЕКТ, 'tests', 'браузер-робот.js'));
  const P = require(path.join(корень, 'игры', 'монополия', 'монополия-правила'));
  const ПОРТ = 8934;
  const АДРЕС = 'http://127.0.0.1:' + ПОРТ + '/монополия.html';
  const сервер = await поднятьСтатику(корень, ПОРТ);
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const ошибки = [];
    await безTelegram(p);
    /* Только настоящие необработанные исключения JS — не сетевые «Failed to
       load resource», которые заведомо шумят из-за оборванного безTelegram()
       запроса к telegram-web-app.js (так же считают и другие браузерные
       тесты монополии: tests/монополия-витрина-и-движение.js слушает только
       pageerror). */
    p.on('pageerror', (e) => ошибки.push(String(e)));

    await p.goto(АДРЕС);
    await p.locator('#экран-лобби').waitFor();

    /* ---------- Лобби: кнопка «⋯» видна, открывает и закрывает лист ---------- */
    const кнопкаЛобби = p.locator('#экран-лобби .mono-top [data-more]');
    проверить(await кнопкаЛобби.count() > 0, 'лобби: кнопка [data-more] найдена');
    проверить(await кнопкаЛобби.isVisible(), 'лобби: кнопка [data-more] видна');
    await p.screenshot({ path: 'tests/снимки/монополия-лобби-верх-390.png' });
    await кнопкаЛобби.click();
    /* Лист — оверлей на position:fixed: offsetParent у таких узлов всегда
       null в Chromium, даже когда узел на экране. Открытость меряем тем же
       способом, что и сам общее/js/лист-ещё.js (функция «открыт») — по классу. */
    const листОткрытЛобби = await p.locator('#лист-игры').evaluate((e) => !e.classList.contains('скрыт'));
    проверить(листОткрытЛобби, 'лобби: клик по «⋯» открыл #лист-игры');
    await p.locator('#кнопка-лист-игры-закрыть').click();
    const листЗакрытЛобби = await p.locator('#лист-игры').evaluate((e) => e.classList.contains('скрыт'));
    проверить(листЗакрытЛобби, 'лобби: «Закрыть» спрятал лист');

    /* ---------- Старт партии с ботами (приём монополия-витрина-и-движение.js) ---------- */
    let seed = 1;
    while (P.create(3, seed).turn !== 0) seed++;
    await p.evaluate((s) => localStorage.setItem('monopoly-match-v1', JSON.stringify({ version: 1, n: 3, seed: s, id: 321, actions: [], result: false })), seed);
    await p.reload();
    await p.locator('#mono-resume').click();
    await p.locator('#экран-игры').waitFor();

    /* ---------- Партия: та же кнопка «⋯» ---------- */
    const кнопкаПартии = p.locator('#экран-игры .mono-top [data-more]');
    проверить(await кнопкаПартии.count() > 0, МЕТКА_ПАРТИИ + ' кнопка [data-more] найдена');
    проверить(await кнопкаПартии.isVisible(), МЕТКА_ПАРТИИ + ' кнопка [data-more] видна');
    await кнопкаПартии.click();
    const листОткрытПартия = await p.locator('#лист-игры').evaluate((e) => !e.classList.contains('скрыт'));
    проверить(листОткрытПартия, МЕТКА_ПАРТИИ + ' клик по «⋯» открыл #лист-игры');
    await p.screenshot({ path: 'tests/снимки/монополия-партия-лист-390.png' });
    await p.locator('#кнопка-лист-игры-закрыть').click();
    проверить(await p.locator('#лист-игры').evaluate((e) => e.classList.contains('скрыт')), МЕТКА_ПАРТИИ + ' «Закрыть» спрятал лист');

    let ширина = await p.evaluate(() => document.documentElement.scrollWidth);
    проверить(ширина <= 391, МЕТКА_ПАРТИИ + ' 390: нет горизонтальной прокрутки (scrollWidth=' + ширина + ')');
    await p.screenshot({ path: 'tests/снимки/монополия-партия-верх-390.png' });

    /* ---------- Ширина 320 ---------- */
    await p.setViewportSize({ width: 320, height: 700 });
    проверить(await кнопкаПартии.isVisible(), МЕТКА_ПАРТИИ + ' 320: кнопка [data-more] видна');
    ширина = await p.evaluate(() => document.documentElement.scrollWidth);
    проверить(ширина <= 321, МЕТКА_ПАРТИИ + ' 320: нет горизонтальной прокрутки (scrollWidth=' + ширина + ')');
    await p.screenshot({ path: 'tests/снимки/монополия-партия-верх-320.png' });
    await p.setViewportSize({ width: 390, height: 844 });

    /* ---------- В Telegram кнопка на партии спрятана (СНОРС html.в-телеграме) ---------- */
    await p.evaluate(() => document.documentElement.classList.add('в-телеграме'));
    проверить(!(await кнопкаПартии.isVisible()), МЕТКА_ПАРТИИ + ' в Telegram (html.в-телеграме) кнопка [data-more] не видна');

    проверить(ошибки.length === 0, 'консоль чистая' + (ошибки.length ? ' — ' + ошибки.join(' | ') : ''));
  } finally {
    await b.close();
    await new Promise((r) => сервер.close(r));
  }
}

function ломать() {
  console.log('=== Ломающий прогон: копия без [data-more] в шапке партии — обязан покраснеть ===');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'монополия-верх-браузер-лом-'));
  try {
    копияПроекта(папка);
    испортитьШапкуПартии(path.join(папка, 'монополия.html'));
    console.log('Порченая копия: ' + папка);
    const прогон = spawnSync(process.execPath, [__filename, '--корень', папка], { encoding: 'utf8', timeout: 180000 });
    console.log(прогон.stdout || ''); if (прогон.stderr) console.log('stderr: ' + прогон.stderr);
    const покраснелНаПартии = прогон.status === 1 && (прогон.stdout || '').split('\n').some((с) => с.includes('ПЛОХО') && с.includes(МЕТКА_ПАРТИИ) && с.includes('[data-more]'));
    console.log(покраснелНаПартии ? 'Ломающий прогон покраснел на кнопке партии — как и должен.' : 'ПРОВАЛ: ломающий прогон не покраснел на кнопке партии.');
    process.exitCode = покраснелНаПартии ? 0 : 1;
  } finally {
    fs.rmSync(папка, { recursive: true, force: true });
  }
}

function доводПосле(имя) {
  const где = process.argv.indexOf(имя);
  return где !== -1 ? process.argv[где + 1] : null;
}

if (process.argv.includes('--сломать')) {
  ломать();
} else {
  try {
    execFileSync(process.execPath, [path.join(ПРОЕКТ, 'штаб', 'браузер-занят.js'), '--ждать'], { stdio: 'inherit' });
  } catch (о) {
    console.log('Место для браузера не освободилось вовремя — проверка не пойдёт: ' + (о.message || о));
    process.exit(2);
  }
  прогнать(path.resolve(доводПосле('--корень') || ПРОЕКТ)).then(() => {
    console.log('Итого проверок: ' + проверок + ', провалов: ' + провалов);
    process.exit(провалов ? 1 : 0);
  }).catch((e) => { console.error(e); process.exit(1); });
}
