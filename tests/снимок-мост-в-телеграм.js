'use strict';
/* =====================================================================
   СНИМКИ И ПРОВЕРКА МОСТА В TELEGRAM (js/мост-в-телеграм.js), браузер.

   Три случая на ширинах 390 и 320:
   1. Витрина (index.html) вне Telegram — карточка видна над списком игр.
   2. Лобби монополии вне Telegram — карточка видна, не налезает на
      нижнюю полосу, нет горизонтальной прокрутки.
   3. Витрина с подделанной подписью Telegram — карточки нет вовсе.
   «Вне Telegram» — настоящий скрипт telegram.org не пускаем и подделку
   не ставим: WebApp не появляется.

   Раздача файлов — своя, на свободном порту; «подмены» дают ломающим
   запускам копию модуля из временной папки (файл проекта не портим).

   Запуск:  node штаб/браузер-занят.js --ждать   (до этого)
            node tests/снимок-мост-в-телеграм.js
   Ломающие запуски (каждый обязан покраснеть):
            node tests/снимок-мост-в-телеграм.js --сломать-нет-карточки   (гость не видит карточку)
            node tests/снимок-мост-в-телеграм.js --сломать-в-телеграме    (карточка видна и в Telegram)
   Снимки: tests/снимки/мост-*.png
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { chromium, подготовитьПодделку, безTelegram } = require('./браузер-робот.js');

const КОРЕНЬ = path.join(__dirname, '..');
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки');
if (!fs.existsSync(ПАПКА_СНИМКОВ)) fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });

const СЛОМАТЬ_НЕТ_КАРТОЧКИ = process.argv.includes('--сломать-нет-карточки');
const СЛОМАТЬ_В_ТЕЛЕГРАМЕ = process.argv.includes('--сломать-в-телеграме');
const СЛОМАНО = СЛОМАТЬ_НЕТ_КАРТОЧКИ || СЛОМАТЬ_В_ТЕЛЕГРАМЕ;

const ШИРИНЫ = [{ ш: 390, в: 844 }, { ш: 320, в: 568 }];
const КАРТОЧКА = '.мост-в-телеграм';
const ЛОББИ_ИГР = ['деберц', 'домино', 'монополия', 'морской-бой', 'нарды', 'шахматы', 'шашки'];

let всего = 0;
let провалов = 0;
function проверка(слова, условие, подробность) {
  всего++;
  if (условие) console.log('  ок: ' + слова);
  else { провалов++; console.log('  ПРОВАЛ: ' + слова + (подробность ? ' — ' + подробность : '')); }
}

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg'
};

/** Раздача файлов проекта на свободном порту; «подмены» — {url-путь: файл-на-диске}. */
function поднятьРаздачу(подмены) {
  const сервер = http.createServer(function (запрос, ответ) {
    let путь = запрос.url.split('?')[0].split('#')[0];
    try { путь = decodeURIComponent(путь); } catch (ошибка) { /* оставим как есть */ }
    const файл = подмены[путь] || path.join(КОРЕНЬ, путь === '/' ? 'index.html' : путь.slice(1));
    fs.readFile(файл, function (беда, тело) {
      if (беда) { ответ.writeHead(404); ответ.end('нет такого файла'); return; }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
      ответ.end(тело);
    });
  });
  return new Promise(function (готово) { сервер.listen(0, '127.0.0.1', function () { готово(сервер); }); });
}

/** Испорченная копия модуля во временной папке. */
function копияМодуля() {
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'мост-снимок-'));
  let текст = fs.readFileSync(path.join(КОРЕНЬ, 'js', 'мост-в-телеграм.js'), 'utf8');
  if (СЛОМАТЬ_НЕТ_КАРТОЧКИ) {
    // Гость карточки не получает: вставка превращена в пустую
    текст = текст.replace('вставить(собратьКарточку());', '/* сломано */');
  }
  if (СЛОМАТЬ_В_ТЕЛЕГРАМЕ) {
    // Признак «мы в Telegram» всегда «нет» — карточка полезет и в Telegram
    текст = текст.replace('if (открытоВTelegram()) return;', '/* сломано */');
  }
  const файл = path.join(папка, 'мост-в-телеграм.js');
  fs.writeFileSync(файл, текст);
  return файл;
}

/** Открыть страницу; «вTelegram» — с подделкой и подписью, иначе без WebApp вообще. */
async function открыть(браузер, адрес, размер, вTelegram) {
  const контекст = await браузер.newContext({ viewport: { width: размер.ш, height: размер.в }, hasTouch: true });
  const страница = await контекст.newPage();
  const ошибки = [];
  страница.on('pageerror', function (е) { ошибки.push(е.message); });
  if (вTelegram) await подготовитьПодделку(страница, { версия: '8.0', подпись: 'query_id=AAA&user=%7B%7D&hash=bbb' });
  else await безTelegram(страница);
  await страница.goto(адрес, { waitUntil: 'load' });
  await страница.waitForTimeout(600);
  return { контекст, страница, ошибки };
}

async function прогон(браузер, база, размер, имя, путь, вTelegram, ожидаемВидна, снимок, лобби) {
  const метка = имя + ' ' + размер.ш;
  console.log('— ' + метка);
  const { контекст, страница, ошибки } = await открыть(браузер, база + путь, размер, вTelegram);
  const число = await страница.locator(КАРТОЧКА).count();
  if (ожидаемВидна) {
    // Ноль найденного — провал, а не пропуск
    проверка(метка + ': карточка есть в разметке', число === 1, 'найдено ' + число);
    if (число === 1) {
      const карточка = страница.locator(КАРТОЧКА);
      await карточка.scrollIntoViewIfNeeded();
      проверка(метка + ': карточка видна', await карточка.isVisible());
      const ссылка = await страница.locator(КАРТОЧКА + ' a').getAttribute('href');
      проверка(метка + ': ссылка ?start=src_site', ссылка === 'https://t.me/BoardingGames_bot?start=src_site', String(ссылка));
      const рамка = await карточка.boundingBox();
      const окно = размер;
      проверка(метка + ': карточка целиком по ширине экрана',
        !!рамка && рамка.x >= 0 && рамка.x + рамка.width <= окно.ш + 0.5, JSON.stringify(рамка));
      const кнопка = await страница.locator(КАРТОЧКА + ' a').boundingBox();
      проверка(метка + ': кнопка внутри карточки',
        !!кнопка && !!рамка && кнопка.x >= рамка.x - 0.5 && кнопка.x + кнопка.width <= рамка.x + рамка.width + 0.5, JSON.stringify(кнопка));
      // После прокрутки к карточке меряем в самой странице (getBoundingClientRect)
      const замер = await страница.evaluate(function (селекторКарточки) {
        const к = document.querySelector(селекторКарточки).getBoundingClientRect();
        const видимые = function (э) { const р = э.getBoundingClientRect(); return р.width > 0 && р.height > 0 && getComputedStyle(э).visibility !== 'hidden'; };
        const полосы = Array.from(document.querySelectorAll('.нижние-вкладки')).filter(видимые);
        const верхПолосы = полосы.length ? Math.min.apply(null, полосы.map(function (п) { return п.getBoundingClientRect().top; })) : null;
        // Входы лобби: видимые кнопки лобби вне карточки моста и вне нижней полосы
        const лобби = document.getElementById('экран-лобби');
        const пересекает = [];
        if (лобби) {
          Array.from(лобби.querySelectorAll('button, .карточка-входа')).forEach(function (э) {
            if (э.closest('.мост-в-телеграм') || э.closest('.нижние-вкладки') || !видимые(э)) return;
            const р = э.getBoundingClientRect();
            const налезает = р.left < к.right - 0.5 && р.right > к.left + 0.5 && р.top < к.bottom - 0.5 && р.bottom > к.top + 0.5;
            if (налезает) пересекает.push((э.id || э.className || э.tagName) + '');
          });
        }
        return { низ: к.bottom, верхПолосы: верхПолосы, пересекает: пересекает, видимаяПолоса: полосы.length };
      }, КАРТОЧКА);
      if (лобби) проверка(метка + ': нижняя полоса вкладок найдена', замер.видимаяПолоса > 0, 'полос: ' + замер.видимаяПолоса);
      проверка(метка + ': низ карточки выше верха нижней полосы',
        замер.верхПолосы === null || замер.низ <= замер.верхПолосы + 0.5,
        'низ карточки ' + замер.низ + ', верх полосы ' + замер.верхПолосы);
      if (лобби) проверка(метка + ': не перекрывает карточки входов', замер.пересекает.length === 0, замер.пересекает.join(', '));
    }
    const прокрутка = await страница.evaluate(function () {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    проверка(метка + ': нет горизонтальной прокрутки', прокрутка <= 0, 'лишних точек: ' + прокрутка);
  } else {
    проверка(метка + ': карточки нет', число === 0, 'найдено ' + число);
  }
  проверка(метка + ': нет ошибок страницы', ошибки.length === 0, ошибки.join(' | '));
  if (снимок) await страница.screenshot({ path: path.join(ПАПКА_СНИМКОВ, снимок) });
  await контекст.close();
}

(async function () {
  const подмены = СЛОМАНО ? { '/js/мост-в-телеграм.js': копияМодуля() } : {};
  const сервер = await поднятьРаздачу(подмены);
  const база = 'http://127.0.0.1:' + сервер.address().port + '/';
  const браузер = await chromium.launch();
  try {
    for (const размер of ШИРИНЫ) {
      await прогон(браузер, база, размер, 'витрина вне Telegram', 'index.html', false, true, 'мост-витрина-' + размер.ш + '.png');
      for (const игра of ЛОББИ_ИГР) {
        // Снимок лобби — только на 320
        await прогон(браузер, база, размер, 'лобби ' + игра + ' вне Telegram', игра + '.html', false, true,
          размер.ш === 320 ? 'мост-лобби-' + игра + '-320.png' : null, true);
      }
      await прогон(браузер, база, размер, 'витрина в Telegram', 'index.html', true, false, 'мост-витрина-в-телеграме-' + размер.ш + '.png');
    }
  } finally {
    await браузер.close();
    сервер.close();
  }
  console.log('Итого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов > 0 ? 1 : 0);
})().catch(function (ошибка) {
  console.error(ошибка);
  process.exit(1);
});
