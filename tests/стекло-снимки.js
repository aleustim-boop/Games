// Снимки «стекла» и значков «Захвата» (этап П1б). Нужен браузер (playwright, через tests/браузер-робот.js).
// Запуск: node tests/стекло-снимки.js [--сломать]
// Что делает: поднимает свой маленький сервер на свободном порту (сам гасит), открывает
// страницу шириной 390 с картой img/захват/макет-партия-парящий.png и пятью классами стекла поверх.
// Пишет: tests/снимки/стекло-классы/стекло-390.png, стекло-без-размытия-390.png,
//        tests/снимки/захват-значки/значки-на-тёмном.png (значки 96 и 20 px на #14181c).
// Кроме картинок проверяет: у пяти классов размытие в обычном виде есть, а под
// «.стекло-без-размытия» его нет; значки загрузились (не пустые).
// Флаг --сломать: ломающий запуск. Рисует тот же снимок с ПОРЧЕНОЙ копией css (из неё
// вырезано размытие), пишет только во временную папку и требует, чтобы картинка и
// проверка размытия отличались от обычных. Снимки в tests/снимки/ он НЕ перезаписывает.
// Итог: «Итого проверок: N, провалов: M».
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { chromium } = require('./браузер-робот');

const КОРЕНЬ = path.join(__dirname, '..');
const КЛАССЫ = ['стекло-панель', 'стекло-капсула', 'стекло-кнопка-круг', 'стекло-акцент', 'стекло-полоса'];
const ЛОМАТЬ = process.argv.includes('--сломать');
const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.js': 'text/javascript; charset=utf-8' };

const итог = [];
function проверка(название, ок, подробность) {
  итог.push(!!ок);
  console.log((ок ? 'ЗЕЛЕНО  ' : 'КРАСНОЕ ') + название + (ок || !подробность ? '' : ' — ' + подробность));
}

const КАРТА = '/img/захват/макет-партия-парящий.png';
const СТРАНИЦА_СТЕКЛА = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/общее/css/style.css">
<style>
html,body{margin:0;padding:0;background:#0b0e12}
#сцена{position:relative;width:390px;height:780px;overflow:hidden;background:#0b0e12 url('${КАРТА}') center/cover no-repeat;font-family:system-ui,sans-serif;color:#f4f4ed}
#сцена>*{position:absolute}
.п{left:20px;top:60px;width:350px;padding:18px;box-sizing:border-box}
.к{left:20px;top:230px;padding:10px 18px}
.о{left:300px;top:225px;width:56px;height:56px;display:flex;align-items:center;justify-content:center}
.а{left:20px;top:330px;padding:14px 26px;font-weight:700}
.л{left:0;right:0;bottom:0;padding:16px 20px;box-sizing:border-box}
</style></head><body>
<div id="сцена">
  <div class="стекло-панель п">Панель: Ваш ход. Захвачено областей: 7</div>
  <div class="стекло-капсула к">Капсула: 12 очков</div>
  <button class="стекло-кнопка-круг о" type="button">II</button>
  <button class="стекло-акцент а" type="button">Ударить</button>
  <div class="стекло-полоса л">Полоса: нижняя панель</div>
</div></body></html>`;

const СТРАНИЦА_ЗНАЧКОВ = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#14181c}
#с{width:390px;padding:16px;box-sizing:border-box;background:#14181c;color:#f4f4ed;font:13px system-ui,sans-serif}
.р{display:flex;align-items:center;gap:20px;margin:0 0 14px}
.р b{width:70px;font-weight:400;color:#9aa4ad}
.ч{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:#222a31}
</style></head><body><div id="с">
${['край', 'столица', 'области'].map(и => `<div class="р"><b>${и}</b>
 <img class="б" src="/img/захват/значок-${и}.png" width="96" height="96" alt="">
 <span class="ч"><img class="м" src="/img/захват/значок-${и}.png" width="20" height="20" alt="">12</span></div>`).join('\n')}
</div></body></html>`;

function сервер(папкаСтиля) {
  return http.createServer((зап, отв) => {
    const адрес = decodeURIComponent(зап.url.split('?')[0]);
    if (адрес === '/стекло.html') { отв.writeHead(200, { 'Content-Type': ТИПЫ['.html'] }); return отв.end(СТРАНИЦА_СТЕКЛА); }
    if (адрес === '/значки.html') { отв.writeHead(200, { 'Content-Type': ТИПЫ['.html'] }); return отв.end(СТРАНИЦА_ЗНАЧКОВ); }
    const база = (адрес === '/общее/css/style.css' && папкаСтиля) ? папкаСтиля : КОРЕНЬ;
    const файл = path.join(база, адрес);
    if (!файл.startsWith(база) || !fs.existsSync(файл) || fs.statSync(файл).isDirectory()) { отв.writeHead(404); return отв.end('нет'); }
    отв.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл)] || 'application/octet-stream' });
    отв.end(fs.readFileSync(файл));
  });
}

// Один прогон: снимает стекло обычное и без размытия в папку, вернёт буферы и счётчики размытия.
async function снять(папкаСтиля, куда) {
  const срв = сервер(папкаСтиля);
  await new Promise(р => срв.listen(0, '127.0.0.1', р));
  const порт = срв.address().port;
  const б = await chromium.launch();
  const ошибки = [];
  const рез = { буферы: {}, размытий: { обычный: 0, лёгкий: 0 }, значки: null };
  try {
    const стр = await б.newPage({ viewport: { width: 390, height: 780 } });
    стр.on('console', м => { if (м.type() === 'error') ошибки.push(м.text()); });
    стр.on('pageerror', е => ошибки.push(String(е)));
    await стр.goto('http://127.0.0.1:' + порт + '/стекло.html');
    await стр.waitForLoadState('load');
    await стр.waitForTimeout(400);
    const считать = () => стр.evaluate(кл => кл.map(к => {
      const э = document.querySelector('.' + к);
      const с = getComputedStyle(э);
      const б = с.backdropFilter || с.webkitBackdropFilter || 'none';
      return /blur/.test(б) ? 1 : 0;
    }).reduce((a, x) => a + x, 0), КЛАССЫ);
    рез.размытий.обычный = await считать();
    fs.mkdirSync(куда.стекло, { recursive: true });
    const ф1 = path.join(куда.стекло, 'стекло-390.png');
    await (await стр.$('#сцена')).screenshot({ path: ф1 });
    await стр.evaluate(() => document.body.classList.add('стекло-без-размытия'));
    await стр.waitForTimeout(200);
    рез.размытий.лёгкий = await считать();
    const ф2 = path.join(куда.стекло, 'стекло-без-размытия-390.png');
    await (await стр.$('#сцена')).screenshot({ path: ф2 });
    рез.буферы.обычный = fs.readFileSync(ф1);
    рез.буферы.лёгкий = fs.readFileSync(ф2);
    if (!ЛОМАТЬ) {
      await стр.goto('http://127.0.0.1:' + порт + '/значки.html');
      await стр.waitForLoadState('load');
      await стр.waitForTimeout(300);
      рез.значки = await стр.evaluate(() => [...document.images].map(и => ({ ок: и.complete && и.naturalWidth > 0, ш: и.naturalWidth })));
      fs.mkdirSync(куда.значки, { recursive: true });
      await (await стр.$('#с')).screenshot({ path: path.join(куда.значки, 'значки-на-тёмном.png') });
    }
  } finally {
    await б.close();
    срв.close();
  }
  рез.ошибки = ошибки;
  return рез;
}

(async () => {
  const настоящие = {
    стекло: path.join(КОРЕНЬ, 'tests', 'снимки', 'стекло-классы'),
    значки: path.join(КОРЕНЬ, 'tests', 'снимки', 'захват-значки'),
  };
  if (!ЛОМАТЬ) {
    const р = await снять(null, настоящие);
    проверка('в обычном виде размытие есть у всех 5 классов', р.размытий.обычный === КЛАССЫ.length, 'размытие у ' + р.размытий.обычный + ' из ' + КЛАССЫ.length);
    проверка('под .стекло-без-размытия размытия нет ни у одного класса', р.размытий.лёгкий === 0, 'осталось у ' + р.размытий.лёгкий);
    проверка('снимок стекло-390.png не пустой', р.буферы.обычный.length > 20000, 'размер ' + р.буферы.обычный.length);
    проверка('снимок стекло-без-размытия-390.png не пустой', р.буферы.лёгкий.length > 20000, 'размер ' + р.буферы.лёгкий.length);
    проверка('оба снимка стекла различаются (иначе переключатель ничего не делает)', Buffer.compare(р.буферы.обычный, р.буферы.лёгкий) !== 0);
    проверка('значков найдено 6 (3 по 96 px и 3 по 20 px) и все загрузились', р.значки && р.значки.length === 6 && р.значки.every(з => з.ок), JSON.stringify(р.значки));
    проверка('в консоли страницы нет красных ошибок', р.ошибки.length === 0, р.ошибки.join(' | '));
    console.log('Снимки: ' + настоящие.стекло + ' ; ' + настоящие.значки);
  } else {
    const врем = fs.mkdtempSync(path.join(os.tmpdir(), 'стекло-снимки-'));
    const куда = { стекло: path.join(врем, 'снимки'), значки: path.join(врем, 'значки') };
    const чистая = await снять(null, { стекло: path.join(врем, 'чистые'), значки: куда.значки });
    // порченая копия css: размытие вырезано отовсюду
    const папкаСтиля = path.join(врем, 'css');
    fs.mkdirSync(папкаСтиля, { recursive: true });
    const css = fs.readFileSync(path.join(КОРЕНЬ, 'общее/css/style.css'), 'utf8');
    fs.writeFileSync(path.join(папкаСтиля, 'style.css'), css.replace(/(-webkit-)?backdrop-filter\s*:[^;}]*;/g, ''));
    const порча = await снять(папкаСтиля, куда);
    проверка('чистая копия: размытие у всех 5 классов (опора для сравнения)', чистая.размытий.обычный === КЛАССЫ.length, 'у ' + чистая.размытий.обычный);
    проверка('порченая копия (размытие вырезано): проверка размытия краснеет', порча.размытий.обычный !== КЛАССЫ.length, 'порча не замечена');
    проверка('порченая копия: картинка отличается от чистой', Buffer.compare(порча.буферы.обычный, чистая.буферы.обычный) !== 0, 'картинки одинаковые');
    проверка('настоящие снимки в tests/снимки не тронуты порчей (писали только в ' + врем + ')', !куда.стекло.startsWith(КОРЕНЬ));
  }
  const провалов = итог.filter(x => !x).length;
  console.log('Итого проверок: ' + итог.length + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
})().catch(е => { console.log('Сбой: ' + (е && е.stack || е)); console.log('Итого проверок: ' + (итог.length + 1) + ', провалов: ' + (итог.filter(x => !x).length + 1)); process.exit(1); });
