'use strict';

/* =====================================================================
   ВХОД В ТУРНИР — ЖИВАЯ СТРАНИЦА (штаб/план-турниры.md, этап Э8).
   Браузерная часть tests/турнир-вход.js (там — разметка и песочница).

   Что проверяет в настоящем Chromium, экран 390×844:
     Г1) на плитке дурака пометка «турнир идёт»;
     Г2–Г4) в лобби дурака ровно одна карточка турнира, видна, снимок;
     Г5) нажатие на карточку открывает #экран-турнир;
     Г6–Г9) итог турнирной партии: кнопка «К турниру», пояснение про два
        пропущенных хода, нажатие открывает экран турнира;
     Г10) красных ошибок в консоли нет.
   Снимки: tests/снимки/турнир-карточка-лобби-390.png,
           tests/снимки/турнир-итог-к-турниру-390.png.

   Перед запуском — node штаб/браузер-занят.js --ждать.

   Запуск:
       node tests/турнир-вход-браузер.js
       node tests/турнир-вход-браузер.js --index <путь> --файл <путь>
         — ломающий запуск: index.html и/или js/game.js берутся из КОПИЙ
           по указанным путям (файлы проекта не трогаем).
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const http = require('http');

const КОРЕНЬ = path.join(__dirname, '..');

function аргумент(имя) {
  const индекс = process.argv.indexOf(имя);
  return индекс !== -1 ? process.argv[индекс + 1] : null;
}

const ПУТЬ_INDEX = аргумент('--index') || path.join(КОРЕНЬ, 'index.html');
const ПУТЬ_GAME = аргумент('--файл') || path.join(КОРЕНЬ, 'js', 'game.js');

let проверок = 0;
let провалов = 0;
function надо(условие, слова, подробности) {
  проверок++;
  if (условие) console.log('OK    ' + слова);
  else {
    провалов++;
    console.log('ПЛОХО ' + слова + (подробности ? ' — ' + подробности : ''));
  }
}

const ТЕКСТ_GAME = fs.readFileSync(ПУТЬ_GAME, 'utf8');

/* id карточки читаем из js/game.js — того же места, что её слушает. */
const найденId = /const КАРТОЧКА_ТУРНИРА = '([^']+)'/.exec(ТЕКСТ_GAME);
const ID_КАРТОЧКИ = найденId ? найденId[1] : '';

async function проверитьВБраузере() {
  надо(ID_КАРТОЧКИ !== '', 'Г0) в js/game.js есть КАРТОЧКА_ТУРНИРА', 'нет строки const КАРТОЧКА_ТУРНИРА');
  const { chromium, безTelegram, перехватить } = require(path.join(__dirname, 'браузер-робот.js'));
  const ПАПКА = path.join(__dirname, 'снимки');
  fs.mkdirSync(ПАПКА, { recursive: true });
  const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
  /* index.html отдаём из ПУТЬ_INDEX: ломающий запуск подставляет копию. */
  const сервер = await new Promise((готово) => {
    const с = http.createServer((запрос, ответ) => {
      let путь = '/';
      try { путь = decodeURIComponent(запрос.url.split('?')[0]); } catch (о) { /* как есть */ }
      if (путь.slice(-1) === '/') путь += 'index.html';
      let файл = path.join(КОРЕНЬ, путь);
      if (путь === '/index.html') файл = ПУТЬ_INDEX;
      else if (путь === '/js/game.js') файл = ПУТЬ_GAME;
      if (!fs.existsSync(файл) || fs.statSync(файл).isDirectory()) { ответ.writeHead(404); ответ.end('нет'); return; }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
      ответ.end(fs.readFileSync(файл));
    });
    с.listen(0, '127.0.0.1', () => готово(с));
  });
  const адрес = 'http://127.0.0.1:' + сервер.address().port + '/index.html';
  const браузер = await chromium.launch();
  try {
    const ошибки = [];
    const страница = await браузер.newPage({ viewport: { width: 390, height: 844 } });
    await безTelegram(страница);
    страница.on('console', (з) => {
      const откуда = (з.location && з.location().url) || '';
      if (з.type() === 'error' && откуда.indexOf('telegram-web-app.js') !== -1) return;
      if (з.type() === 'error') ошибки.push(з.text() + (откуда ? ' @ ' + откуда : ''));
    });
    страница.on('pageerror', (о) => ошибки.push('pageerror: ' + (о && о.message)));
    await перехватить(страница, /^http:\/\/127\.0\.0\.1:8790\//, (п) =>
      п.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ ок: false }) }));
    await страница.goto(адрес);
    await страница.waitForFunction(() => window.Сеть && window.ТурнирЭкран && window.ИграПоСети);
    await страница.waitForTimeout(500);

    /* Заглушка сети турнира: стадия «идёт», ожидание стола висит. */
    await страница.evaluate(() => {
      const в = { ид: 'дурак-проверка', игра: 'дурак', состояние: 'идёт', началоМс: Date.now() - 600000,
        конецМс: Date.now() + 1200000, записалось: 2, записан: true, таблица: [] };
      window.Сеть.турнир = () => Promise.resolve({ ок: true, вид: в });
      window.Сеть.ждатьТурнир = () => new Promise(() => {});
      window.Сеть.броситьТурнир = () => {};
    });

    /* Г1. Пометка на плитке дурака. */
    const пометка = await страница.evaluate(async () => {
      последнийВопросПроТурнирМс = 0;
      освежитьВитрину();
      await new Promise((р) => setTimeout(р, 200));
      const у = document.getElementById('пометка-дурак');
      return у ? у.textContent : null;
    });
    надо(пометка === 'турнир идёт', 'Г1) на плитке дурака пометка «турнир идёт»', 'получено: ' + пометка);

    /* Г2. Лобби дурака с карточкой. */
    await страница.evaluate(() => открытьДурака());
    await страница.waitForTimeout(400);
    const лобби = await страница.evaluate((id) => {
      const к = document.querySelectorAll('#экран-лобби #' + CSS.escape(id));
      const у = к[0];
      const п = у ? у.getBoundingClientRect() : null;
      return { найдено: к.length, видна: !!п && п.width > 0 && п.height > 0 && !у.classList.contains('скрыт'),
        текст: у ? у.textContent.replace(/\s+/g, ' ').trim() : '' };
    }, ID_КАРТОЧКИ);
    надо(лобби.найдено === 1, 'Г2) карточка турнира найдена в лобби (найдено: ' + лобби.найдено + ')');
    надо(лобби.видна, 'Г3) карточка турнира видна');
    if (лобби.найдено === 1) {
      await страница.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center' }), ID_КАРТОЧКИ);
    }
    const снимокЛобби = path.join(ПАПКА, 'турнир-карточка-лобби-390.png');
    await страница.screenshot({ path: снимокЛобби });
    надо(fs.existsSync(снимокЛобби), 'Г4) снимок ' + снимокЛобби);

    /* Г5. Нажатие открывает экран турнира. */
    if (лобби.видна) await страница.click('#' + ID_КАРТОЧКИ);
    await страница.waitForTimeout(500);
    const экранТурнира = await страница.evaluate(() => {
      const э = document.getElementById('экран-турнир');
      return Boolean(э) && э.classList.contains('экран--виден');
    });
    надо(экранТурнира, 'Г5) нажатие на карточку открывает #экран-турнир');
    await страница.evaluate(() => { if (window.ТурнирЭкран.закрыть) window.ТурнирЭкран.закрыть(); });

    /* Г6. Итог турнирной партии: подделываем вид стола той же дверью,
       что и js/сеть.js (ИграПоСети.показатьВид). */
    await страница.evaluate(() => {
      const база = {
        завершена: false, итог: null, соперникПришёл: true, соперникНаСвязи: true,
        мояРука: [{ масть: '♠', имя: '6', вес: 6 }], картУСоперника: 3, стол: [],
        козырь: '♠', козырнаяКарта: { масть: '♠', имя: '6', вес: 6 }, вКолоде: 0, вОтбое: 20, подходов: 1,
        яХожу: false, яАтакую: false, берут: false, могуПодкинуть: false, могуПеревести: false, могуПодхватить: false,
        номерСобытия: 1, турнир: { до: 900 }
      };
      window.ИграПоСети.показатьВид(база);
      window.ИграПоСети.показатьВид(Object.assign({}, база, {
        номерСобытия: 2, завершена: true, итог: 'победа', видСобытия: 'пропуск-сдача',
        событие: 'Соперник пропускает два хода подряд — победа ваша', мояРука: []
      }));
    });
    await страница.waitForTimeout(1800);
    const итог = await страница.evaluate(() => {
      const к = document.getElementById('кнопка-ещё');
      const п = document.getElementById('пояснение-результата');
      return {
        кнопка: к ? к.textContent.trim() : null,
        видна: !!к && !к.classList.contains('скрыт') && к.getBoundingClientRect().height > 0,
        пояснение: п ? п.textContent : ''
      };
    });
    надо(итог.кнопка === 'К турниру' && итог.видна, 'Г6) на итоге турнирной партии видна «К турниру»',
      JSON.stringify(итог));
    надо(итог.пояснение.indexOf('Соперник пропускает два хода подряд — победа ваша') !== -1,
      'Г7) пояснение итога — про два пропущенных хода', итог.пояснение);
    const снимокИтога = path.join(ПАПКА, 'турнир-итог-к-турниру-390.png');
    await страница.screenshot({ path: снимокИтога });
    надо(fs.existsSync(снимокИтога), 'Г8) снимок ' + снимокИтога);
    if (итог.видна) await страница.click('#кнопка-ещё');
    await страница.waitForTimeout(500);
    const послеНажатия = await страница.evaluate(() => {
      const э = document.getElementById('экран-турнир');
      return Boolean(э) && э.classList.contains('экран--виден');
    });
    надо(послеНажатия, 'Г9) «К турниру» открывает #экран-турнир');
    надо(ошибки.length === 0, 'Г10) ошибок консоли нет', ошибки.join(' | '));
  } catch (о) {
    надо(false, 'Г) браузерный прогон упал', о && о.message);
  } finally {
    await браузер.close();
    сервер.close();
  }
}

(async () => {
  console.log('=== Вход в турнир, живая страница (index: ' + ПУТЬ_INDEX + ', game: ' + ПУТЬ_GAME + ') ===\n');
  await проверитьВБраузере();
  console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
  process.exit(провалов === 0 ? 0 : 1);
})();
