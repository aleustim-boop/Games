// Проверка (браузер, Playwright): игры без общего рейтинга (блоки, три-в-ряд, змейка)
// не должны попадать в панель выбора игры на экране рейтинга, но дверь на их
// СОБСТВЕННЫЙ рейтинг по адресу index.html?рейтинг=<ключ> обязана открываться
// (иначе кнопка «Рейтинг» на их страницах будет вести в никуда).
// Решение владельца 29.09 21:33.
//
// Обычный запуск:      node tests/браузер-дверь-рейтинга-спрятанных.js
// Ломающий (на копии):  node tests/браузер-дверь-рейтинга-спрятанных.js --сломать
//   портит КОПИЮ проекта (во временной папке): блокам ставит вРейтинге:true —
//   после порчи блоки обязаны появиться в панели выбора, и проверка обязана покраснеть.
// Можно указать готовую копию доводом --корень=ПУТЬ (тогда свою копию проверка не делает).

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { chromium, подготовитьПодделку, перехватить } = require('./браузер-робот.js');

const ПРОЕКТ = path.join(__dirname, '..');
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки');
const ПОРТ = 8206;

const доводКорень = process.argv.find((а) => а.startsWith('--корень='));
const РЕЖИМ_СЛОМАТЬ = process.argv.includes('--сломать');

let провалов = 0;
let проверок = 0;
function ок(условие, текст) {
  проверок++;
  if (условие) { console.log('  ✅ ' + текст); }
  else { провалов++; console.log('  ❌ ' + текст); }
}

// Копирует минимально нужное (html, css, js/) во временную папку.
function сделатьКопию() {
  const тек = fs.mkdtempSync(path.join(os.tmpdir(), 'games-рейтинг-дверь-'));
  for (const имя of fs.readdirSync(ПРОЕКТ)) {
    if (имя === '.git' || имя === 'node_modules' || имя === 'tests' || имя === 'штаб') continue;
    const из = path.join(ПРОЕКТ, имя);
    const в = path.join(тек, имя);
    fs.cpSync(из, в, { recursive: true });
  }
  return тек;
}

// Портит js/игры-реестр.js копии: у блоков вРейтинге:false -> true.
function испортитьРеестрБлоков(корень) {
  const файл = path.join(корень, 'js', 'игры-реестр.js');
  let текст = fs.readFileSync(файл, 'utf8');
  const метка = "ключ: 'блоки'";
  const место = текст.indexOf(метка);
  if (место === -1) throw new Error('приём порчи устарел: не нашла запись блоков в игры-реестр.js');
  const кусокПосле = текст.slice(место, место + 400);
  if (!/вРейтинге:\s*false/.test(кусокПосле)) {
    throw new Error('приём порчи устарел: у блоков уже не вРейтинге:false рядом с ключом');
  }
  const испорченныйКусок = кусокПосле.replace(/вРейтинге:\s*false/, 'вРейтинге: true');
  текст = текст.slice(0, место) + испорченныйКусок + текст.slice(место + 400);
  fs.writeFileSync(файл, текст, 'utf8');
}

function поднятьФайловыйСервер(корень) {
  const сервер = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let относительный = url === '/' ? '/index.html' : url;
    if (относительный.includes('..') || относительный.includes('bot/') || относительный.includes('.env')) {
      res.writeHead(403); res.end(); return;
    }
    const файл = path.join(корень, относительный);
    fs.readFile(файл, (ошибка, данные) => {
      if (ошибка) { res.writeHead(404); res.end(); return; }
      const расш = path.extname(файл);
      const тип = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[расш] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': тип });
      res.end(данные);
    });
  });
  return new Promise((resolve) => сервер.listen(ПОРТ, () => resolve(сервер)));
}

async function диспетчер(route, request, адрес) {
  const url = request.url();
  if (url.startsWith(адрес)) { await route.continue(); return; }
  if (url.includes('/рейтинг')) { await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); return; }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ок: false }) });
}

async function проверитьДверьБлоков(браузер, адрес, снимок) {
  const страница = await браузер.newPage();
  await страница.setViewportSize({ width: 390, height: 844 });
  await перехватить(страница, (route, req) => диспетчер(route, req, адрес));
  await подготовитьПодделку(страница);
  await страница.goto(адрес + '/index.html?рейтинг=блоки', { waitUntil: 'domcontentloaded' });
  const открылся = await страница.waitForSelector('#экран-рейтинга-игроков.экран--виден', { timeout: 4000 }).then(() => true).catch(() => false);
  ок(открылся, 'дверь index.html?рейтинг=блоки открывает экран рейтинга');
  if (открылся) {
    const текст = await страница.textContent('#экран-рейтинга-игроков');
    ок((текст || '').includes('Блоки'), 'на открытом экране написано «Блоки»');
  } else {
    ок(false, 'на открытом экране написано «Блоки» (экран не открылся)');
  }
  if (снимок) {
    if (!fs.existsSync(ПАПКА_СНИМКОВ)) fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
    await страница.screenshot({ path: снимок });
    console.log('  снимок: ' + снимок);
  }
  await страница.close();
}

async function проверитьПанельБезСпрятанных(браузер, адрес) {
  const страница = await браузер.newPage();
  await страница.setViewportSize({ width: 390, height: 844 });
  await перехватить(страница, (route, req) => диспетчер(route, req, адрес));
  await подготовитьПодделку(страница);
  await страница.goto(адрес + '/index.html?рейтинг=дурак', { waitUntil: 'domcontentloaded' });
  await страница.waitForSelector('#экран-рейтинга-игроков.экран--виден', { timeout: 4000 }).catch(() => {});
  await страница.click('#рейтинг-выбор-игры-кнопка').catch(() => {});
  await страница.waitForSelector('#рейтинг-панель-игр-список .рейтинг-панель-игр__пункт', { timeout: 4000 }).catch(() => {});
  const подписи = await страница.$$eval('#рейтинг-панель-игр-список .рейтинг-панель-игр__пункт', (узлы) => узлы.map((у) => у.textContent || ''));

  // Ноль найденного — провал, а не пропуск: без карточек проверка ничего не значит.
  ок(подписи.length > 0, 'панель выбора игры: карточки вообще нашлись (' + подписи.length + ' шт.)');

  const естьБлоки = подписи.some((т) => т.includes('Блоки'));
  const естьТриВРяд = подписи.some((т) => т.includes('Три в ряд'));
  const естьЗмейка = подписи.some((т) => т.includes('Змейка'));
  ок(!естьБлоки, 'панель НЕ содержит карточку «Блоки»');
  ок(!естьТриВРяд, 'панель НЕ содержит карточку «Три в ряд»');
  ок(!естьЗмейка, 'панель НЕ содержит карточку «Змейка»');

  const есть2048 = подписи.some((т) => т.includes('2048'));
  const естьСудоку = подписи.some((т) => т.includes('Судоку') || т.includes('судоку'));
  ок(есть2048, 'панель содержит карточку «2048» (контрольная, рейтинг есть)');
  ок(естьСудоку, 'панель содержит карточку «Судоку» (контрольная, рейтинг есть)');

  await страница.close();
}

async function прогон(корень, метка) {
  console.log('--- ' + метка + ' (' + корень + ') ---');
  const сервер = await поднятьФайловыйСервер(корень);
  const адрес = 'http://127.0.0.1:' + ПОРТ;
  const браузер = await chromium.launch();
  try {
    const снимок = метка.startsWith('обычный') ? path.join(ПАПКА_СНИМКОВ, 'дверь-рейтинга-блоки-390.png') : null;
    await проверитьДверьБлоков(браузер, адрес, снимок);
    await проверитьПанельБезСпрятанных(браузер, адрес);
  } finally {
    await браузер.close();
    сервер.close();
  }
}

(async () => {
  if (РЕЖИМ_СЛОМАТЬ) {
    const копия = сделатьКопию();
    испортитьРеестрБлоков(копия);
    await прогон(копия, 'ломающий: блокам поставлена вРейтинге:true в копии');
    console.log('\nпроверок: ' + проверок + ', провалов: ' + провалов);
    if (провалов > 0) { console.log('ЛОМАЮЩИЙ ЗАПУСК ПОКРАСНЕЛ КАК ОЖИДАЛОСЬ (порча сработала)'); process.exit(0); }
    console.log('ЛОМАЮЩИЙ ЗАПУСК НЕ ПОКРАСНЕЛ — приём порчи больше не ловится, проверка не годится');
    process.exit(1);
  }
  const корень = доводКорень ? доводКорень.slice('--корень='.length) : ПРОЕКТ;
  await прогон(корень, 'обычный');
  console.log('\nпроверок: ' + проверок + ', провалов: ' + провалов);
  process.exit(провалов > 0 ? 1 : 0);
})();
