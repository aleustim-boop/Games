/*
  Страницы грузятся без потерь (БРАУЗЕРНАЯ проверка — нужен playwright и chromium).

  Что проверяет: каждую страницу *.html из корня папки открывает в настоящем
  безголовом браузере (телефон 390x844) и смотрит, чтобы не потерялся ни один
  свой файл (css, js, шрифт, картинка — в том числе подгруженные из css и js),
  не было ошибок страницы и ошибок в консоли. На каждой странице обязан
  загрузиться хотя бы один свой css и хотя бы один свой js (иначе «ноль
  найденного» выдал бы себя за успех). Ноль страниц — провал.

  Чужие адреса (telegram.org, сервер комнат, wss и т. п.) обрываются сразу и
  потерей не считаются; ошибки консоли, вызванные именно этим обрывом
  (net::ERR_FAILED / ERR_BLOCKED по чужому адресу), не считаются.

  Запуск:  node tests/страницы-грузятся-без-потерь.js
           node tests/страницы-грузятся-без-потерь.js --корень=<папка>
  Перед запуском: node штаб/браузер-занят.js --ждать
  Своего раздатчика файлов поднимает на 127.0.0.1 на свободном порту.
  Код выхода 1 при провалах.
*/
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('./браузер-робот.js');

const аргКорень = process.argv.find(а => а.startsWith('--корень='));
const корень = path.resolve(аргКорень ? аргКорень.slice('--корень='.length) : path.join(__dirname, '..'));

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.gif': 'image/gif', '.txt': 'text/plain; charset=utf-8'
};

function раздатчик() {
  return http.createServer((зап, отв) => {
    let путь;
    try { путь = decodeURIComponent(зап.url.split('?')[0].split('#')[0]); } catch (e) { путь = ''; }
    if (путь === '/') путь = '/index.html';
    const полный = path.resolve(path.join(корень, путь));
    if (!полный.startsWith(корень) || !fs.existsSync(полный) || !fs.statSync(полный).isFile()) {
      отв.writeHead(404, { 'Content-Type': 'text/plain' });
      return отв.end('нет такого файла');
    }
    отв.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(полный).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(полный).pipe(отв);
  });
}

async function главная() {
  const страницы = fs.existsSync(корень)
    ? fs.readdirSync(корень).filter(и => и.endsWith('.html') && fs.statSync(path.join(корень, и)).isFile()).sort()
    : [];
  console.log('Папка: ' + корень + ', страниц: ' + страницы.length);
  if (!страницы.length) { console.log('ПЛОХО: ни одной страницы *.html'); console.log('Цело 0, провалов 1'); process.exit(1); }

  const сервер = раздатчик();
  await new Promise(р => сервер.listen(0, '127.0.0.1', р));
  const порт = сервер.address().port;
  const свой = 'http://127.0.0.1:' + порт;

  const браузер = await chromium.launch();
  let цело = 0, провалов = 0;
  try {
    for (const имя of страницы) {
      const беды = [];
      let css = 0, js = 0;
      const контекст = await браузер.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
      const стр = await контекст.newPage();
      const оборванныеЧужие = new Set();
      await стр.route('**/*', маршрут => {
        const адрес = маршрут.request().url();
        if (адрес.startsWith(свой + '/') || адрес.startsWith('data:') || адрес.startsWith('blob:') || адрес.startsWith('about:')) return маршрут.continue();
        оборванныеЧужие.add(адрес);
        return маршрут.abort();
      });
      стр.on('response', о => {
        const у = о.url();
        if (!у.startsWith(свой + '/')) return;
        const п = у.slice(свой.length).split('?')[0];
        if (о.status() >= 400) беды.push('ответ ' + о.status() + ': ' + п);
        else {
          if (/\.css$/i.test(п)) css++;
          if (/\.m?js$/i.test(п)) js++;
        }
      });
      стр.on('requestfailed', з => {
        const у = з.url();
        if (у.startsWith(свой + '/')) беды.push('запрос сорвался: ' + у.slice(свой.length) + ' (' + (з.failure() && з.failure().errorText) + ')');
      });
      стр.on('pageerror', е => беды.push('ошибка страницы: ' + (е && е.message || е)));
      стр.on('console', с => {
        if (с.type() !== 'error') return;
        const т = с.text();
        const адресСообщения = (с.location() && с.location().url) || '';
        // Ошибка «Failed to load resource» про 404 своего файла уже учтена ответом; чужой оборванный адрес не считаем.
        const чужой = адресСообщения && !адресСообщения.startsWith(свой + '/') && оборванныеЧужие.has(адресСообщения);
        if (чужой && /Failed to load resource|ERR_/i.test(т)) return;
        беды.push('консоль: ' + т + (адресСообщения ? ' [' + адресСообщения.replace(свой, '') + ']' : ''));
      });
      try {
        await стр.goto(свой + '/' + encodeURIComponent(имя), { waitUntil: 'load', timeout: 30000 });
      } catch (е) { беды.push('страница не открылась: ' + е.message); }
      await стр.waitForTimeout(1500);
      if (!css) беды.push('не загрузился ни один свой css');
      if (!js) беды.push('не загрузился ни один свой js');
      await контекст.close();

      const уник = Array.from(new Set(беды));
      if (уник.length) {
        провалов++;
        console.log('ПЛОХО ' + имя);
        уник.forEach(б => console.log('    ' + б));
      } else {
        цело++;
        console.log('ок    ' + имя + ' (css ' + css + ', js ' + js + ')');
      }
    }
  } finally {
    await браузер.close();
    await new Promise(р => сервер.close(р));
  }
  console.log('Цело ' + цело + ', провалов ' + провалов);
  console.log('Итого проверок: ' + (цело + провалов) + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}

главная().catch(е => { console.log('ПЛОХО: проверка сама упала: ' + (е && е.stack || е)); process.exit(1); });
