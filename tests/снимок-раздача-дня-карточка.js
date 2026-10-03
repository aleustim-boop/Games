'use strict';
/* =====================================================================
   Снимки лобби дурака с карточкой «Раздача дня» (этап Б2).
     а) до партии, 390×844: подпись «Одна раздача для всех», карточка нажимается;
     б) сыграна (запись daily_durak за сегодня, место 3), 390×844:
        подпись «Победа · 14 ходов · 3-е место», класс «сыграна»;
     в) то же на 320×640 — без горизонтальной прокрутки страницы, подпись
        в одну строку, после прокрутки до конца последняя карточка выше
        нижней полосы.
     В б) и в) галочка стоит в той же коробке, что значки соседних карточек.
   Консоль — без ошибок. Снимки: tests/снимки/раздача-дня/.
   Свой http-сервер на свободном порту (не 8790/8765), гасится в конце.
   Запуск: node tests/снимок-раздача-дня-карточка.js [--сломать]
   --сломать: перед проверкой узел карточки вынимается из страницы — обязано краснеть.
   ===================================================================== */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium, безTelegram, перехватить } = require(path.join(__dirname, 'браузер-робот.js'));

const КОРЕНЬ = path.join(__dirname, '..');
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки', 'раздача-дня');
const СЛОМАТЬ = process.argv.indexOf('--сломать') !== -1;
const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };

let провалов = 0;
let проверок = 0;
function надо(условие, слова) {
  проверок++;
  console.log((условие ? '  ок    — ' : '  ПЛОХО — ') + слова);
  if (!условие) провалов++;
}

function поднятьСервер() {
  return new Promise((готово) => {
    const сервер = http.createServer((запрос, ответ) => {
      let путь = '/';
      try { путь = decodeURIComponent(запрос.url.split('?')[0]); } catch (о) { /* как есть */ }
      if (путь.slice(-1) === '/') путь += 'index.html';
      const файл = path.join(КОРЕНЬ, путь);
      if (файл.indexOf(КОРЕНЬ) !== 0 || !fs.existsSync(файл) || fs.statSync(файл).isDirectory()) {
        ответ.writeHead(404); ответ.end('нет'); return;
      }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
      ответ.end(fs.readFileSync(файл));
    });
    сервер.listen(0, '127.0.0.1', () => готово(сервер));
  });
}

async function открыть(браузер, адрес, ширина, высота, ошибки, запись) {
  const страница = await браузер.newPage({ viewport: { width: ширина, height: высота } });
  await безTelegram(страница);
  страница.on('console', (з) => {
    const откуда = (з.location && з.location().url) || '';
    if (з.type() === 'error' && откуда.indexOf('telegram-web-app.js') !== -1) return;
    if (з.type() === 'error') ошибки.push(з.text() + (откуда ? ' @ ' + откуда : ''));
  });
  страница.on('pageerror', (о) => ошибки.push('pageerror: ' + (о && о.message)));
  // Боевой сервер 8790 не нужен: отвечаем пустышкой.
  await перехватить(страница, /^http:\/\/127\.0\.0\.1:8790\//, (путь) =>
    путь.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ ок: false }) }));
  if (запись) {
    // Запись «сыграно сегодня» кладём в память до скриптов страницы; дата — по часам браузера.
    await страница.addInitScript((з) => {
      const д = new Date();
      const дата = д.getFullYear() + '-' + String(д.getMonth() + 1).padStart(2, '0') + '-' + String(д.getDate()).padStart(2, '0');
      window.localStorage.setItem('daily_durak', JSON.stringify(Object.assign({ дата: дата }, з)));
    }, запись);
  }
  await страница.goto(адрес);
  await страница.waitForFunction(() => typeof настройкиИгрыСБотами !== 'undefined' && typeof путьДурака !== 'undefined');
  await страница.waitForTimeout(400);
  await страница.evaluate(() => { const к = document.querySelector('#кнопка-игра-дурак'); if (к) к.click(); });
  await страница.waitForTimeout(500);
  if (СЛОМАТЬ) await страница.evaluate(() => { const у = document.getElementById('карточка-раздачи-дня'); if (у) у.remove(); });
  return страница;
}

const снять = (с) => с.evaluate(() => {
  const к = document.getElementById('карточка-раздачи-дня');
  const п = к && к.querySelector('.карточка-входа__подпись');
  const р = document.documentElement;
  // Значок раздачи — в той же коробке и на том же месте, что у соседних карточек.
  const значки = [...document.querySelectorAll('#экран-лобби .лобби__входы .карточка-входа .карточка-входа__значок')]
    .map((з) => Math.round(з.getBoundingClientRect().left) + ':' + Math.round(з.getBoundingClientRect().width));
  const мойЗначок = к && к.querySelector('.карточка-входа__значок');
  const местоМоего = мойЗначок ? Math.round(мойЗначок.getBoundingClientRect().left) + ':' + Math.round(мойЗначок.getBoundingClientRect().width) : null;
  // Чернила знака (✦/✓) — канвой тем же шрифтом: ширина не меньше 2/3 коробки.
  let ширинаЗнака = 0;
  if (мойЗначок) {
    const стиль = getComputedStyle(мойЗначок, '::before');
    const кх = document.createElement('canvas').getContext('2d');
    кх.font = стиль.font;
    const м = кх.measureText(String(стиль.content || '').replace(/^"|"$/g, ''));
    ширинаЗнака = м.actualBoundingBoxRight + м.actualBoundingBoxLeft;
  }
  const строкПодписи = п ? Math.round(п.getBoundingClientRect().height / parseFloat(getComputedStyle(п).lineHeight)) : 0;
  // Прокрутка до конца: последняя карточка целиком выше нижней полосы.
  const экран = document.getElementById('экран-лобби');
  if (экран) экран.scrollTop = 1e6;
  window.scrollTo(0, 1e6);
  const полоса = document.querySelector('#экран-лобби .нижние-вкладки');
  const карточки = document.querySelectorAll('#экран-лобби .лобби__входы .карточка-входа');
  const низПоследней = карточки.length ? карточки[карточки.length - 1].getBoundingClientRect().bottom : Infinity;
  const верхПолосы = полоса ? полоса.getBoundingClientRect().top : -Infinity;
  if (экран) экран.scrollTop = 0;
  window.scrollTo(0, 0);
  return {
    значкиНаОднойЛинии: Boolean(местоМоего) && значки.length === 4 && значки.every((з) => з === местоМоего),
    значки: значки.join(' '),
    ширинаЗнака,
    строкПодписи,
    низПоследней, верхПолосы,
    есть: Boolean(к),
    подпись: п ? п.textContent.trim() : null,
    сыграна: Boolean(к && к.classList.contains('сыграна')),
    отключена: Boolean(к && к.disabled),
    классыВхода: Boolean(к && к.classList.contains('карточка-входа') && к.classList.contains('карточка-входа--раздача')),
    виднаНаЭкране: Boolean(к && к.getBoundingClientRect().width > 0 && к.getBoundingClientRect().height > 0),
    сдвигВбок: Math.max(r_(р), r_(document.body)) > window.innerWidth
  };
  function r_(э) { return э.scrollWidth; }
});

(async () => {
  fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
  if (СЛОМАТЬ) console.log('*** ЛОМАЮЩИЙ ЗАПУСК: узел карточки вынимается из страницы — проверка обязана покраснеть ***');
  const сервер = await поднятьСервер();
  const адрес = 'http://127.0.0.1:' + сервер.address().port + '/';
  console.log('сервер проверки: ' + адрес);
  const браузер = await chromium.launch();
  const ошибки = [];
  try {
    console.log('=== а) до партии, 390×844 ===');
    let с = await открыть(браузер, адрес, 390, 844, ошибки, null);
    let к = await снять(с);
    надо(к.есть, 'узел карточки-раздачи-дня найден (нет узла = провал)');
    надо(к.классыВхода, 'классы карточка-входа и карточка-входа--раздача на месте');
    надо(к.виднаНаЭкране, 'карточка видна на экране (ненулевой размер)');
    надо(к.подпись === 'Одна раздача для всех', 'подпись «Одна раздача для всех» (получено: ' + к.подпись + ')');
    надо(к.есть && !к.отключена && !к.сыграна, 'карточка нажимается и без класса «сыграна»');
    await с.screenshot({ path: path.join(ПАПКА_СНИМКОВ, 'а-до-партии-390.png') });
    await с.close();

    const запись = { исход: 'победа', ходов: 14, место: 3 };
    console.log('=== б) сыграна, 390×844 ===');
    с = await открыть(браузер, адрес, 390, 844, ошибки, запись);
    к = await снять(с);
    надо(к.есть, 'узел карточки найден');
    надо(к.сыграна, 'у карточки класс «сыграна»');
    надо(к.подпись === 'Победа · 14 ходов · 3-е место', 'подпись «Победа · 14 ходов · 3-е место» (получено: ' + к.подпись + ')');
    надо(к.отключена, 'сыгранная карточка не нажимается');
    надо(к.значкиНаОднойЛинии, 'галочка в той же коробке и на том же месте, что значки соседей (лево:ширина — ' + к.значки + ')');
    надо(к.ширинаЗнака >= 21, 'галочка не мельче соседних рисунков: чернила ≥ 21 из 32 (получено: ' + к.ширинаЗнака.toFixed(1) + ')');
    await с.screenshot({ path: path.join(ПАПКА_СНИМКОВ, 'б-сыграна-390.png') });
    await с.close();

    console.log('=== в) сыграна, 320×640 ===');
    с = await открыть(браузер, адрес, 320, 640, ошибки, запись);
    к = await снять(с);
    надо(к.есть, 'узел карточки найден');
    надо(к.сыграна && к.подпись === 'Победа · 14 ходов · 3-е место', 'на 320: класс «сыграна» и нужная подпись (получено: ' + к.подпись + ')');
    надо(!к.сдвигВбок, 'на 320 нет горизонтальной прокрутки страницы');
    надо(к.строкПодписи === 1, 'на 320 подпись итога в одну строку (строк: ' + к.строкПодписи + ')');
    надо(к.значкиНаОднойЛинии, 'на 320 галочка на месте значков соседей (' + к.значки + ')');
    надо(к.низПоследней <= к.верхПолосы, 'на 320 после прокрутки до конца последняя карточка целиком выше нижней полосы (низ ' + Math.round(к.низПоследней) + ', полоса ' + Math.round(к.верхПолосы) + ')');
    await с.screenshot({ path: path.join(ПАПКА_СНИМКОВ, 'в-сыграна-320.png') });
    // Тот же экран, прокрученный до конца, — смотрителю видно, что низ не под полосой.
    await с.evaluate(() => { const э = document.getElementById('экран-лобби'); if (э) э.scrollTop = 1e6; window.scrollTo(0, 1e6); });
    await с.waitForTimeout(150);
    await с.screenshot({ path: path.join(ПАПКА_СНИМКОВ, 'г-сыграна-320-прокручено.png') });
    await с.close();

    надо(ошибки.length === 0, 'ошибок в консоли: ' + ошибки.length + (ошибки.length ? ' — ' + ошибки.slice(0, 3).join(' | ') : ''));
  } finally {
    await браузер.close();
    сервер.close();
  }
  console.log('Итого проверок: ' + проверок + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
})().catch((о) => { console.error('Проверка упала: ' + (о && о.stack || о)); process.exit(2); });
