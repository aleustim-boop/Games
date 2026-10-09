'use strict';

/* =====================================================================
   «ПОХВАСТАТЬСЯ» И СЧЁТ ПАРТИЙ В ОБЩЕМ ОКНЕ ИТОГА общее/casual/casual-ui.js (браузер, playwright).
   Этап О4 плана штаб/план-похвастаться-ярлык.md.

   Случаи (сапёр; до итога доводим подменой G.act: первый же ход «выигрывает»
   или «проигрывает» с известным временем 73 с — честно играть не нужно):
     1) победа в Telegram (есть initData) — кнопка «Похвастаться» есть, нажатие даёт
        {игра:'сапёр', исход:'победа', мера:'секунд', значение:<целое > 0>};
     2) победа без Telegram — кнопки нет;
     3) поражение в Telegram — кнопки нет;
     4) Ярлык.партияСыграна позвана ровно один раз за партию (победа и поражение);
     5) все 10 страниц на casual-ui.js открываются, из лобби запускается партия, в консоли
        нет ошибок; на 7 видимых есть дверь Сеть.похвастаться, на 3 скрытых её нет.

   Узел не найден — провал, а не пропуск: у «кнопки нет» сперва проверяем, что окно итога
   открыто и в нём есть «Сыграть ещё».

   СТЕНД: свой файловый сервер на свободном порту (не 8790 и не 8765), гасится в конце.
   Запрос к telegram.org обрывается, поддельный Telegram кладётся до загрузки страницы.

   ЛОМАЮЩИЙ ПРОГОН: node tests/похвастаться-casual.js --сломать
   Во временной папке делается КОПИЯ общее/casual/casual-ui.js, где кнопка показывается и при
   поражении (настоящий файл не трогаем); страница получает её подменой запроса.
   Проверка обязана покраснеть на случае «поражение»; строка порчи должна найтись ровно
   один раз. Контрольный прогон по целой копии обязан быть зелёным.

   Запуск (перед ним отдельной командой: node штаб/браузер-занят.js):
       node tests/похвастаться-casual.js
       node tests/похвастаться-casual.js --сломать
   Снимок: tests/снимки/сапёр-похвастаться.png
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const ПРОЕКТ = path.join(__dirname, '..');
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки');
const ИМЯ_ФАЙЛА = 'общее/casual/casual-ui.js';
const ВИДИМЫЕ = ['mines', 'klondike', 'spider', 'freecell', 'mahjong', 'wordsearch', 'fifteen'];
const СКРЫТЫЕ = ['blocks', 'match3', 'snake'];
const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav'
};

const { chromium, подготовитьПодделку, безTelegram } = require('./браузер-робот.js');

let всего = 0;
let провалов = 0;
function проверить(условие, слова) {
  всего++;
  if (условие) console.log('  ок    — ' + слова);
  else { провалов++; console.log('  ПЛОХО — ' + слова); }
  return Boolean(условие);
}

/* ---------- Файловый сервер стенда ---------- */

function поднятьСервер(подмены) {
  const сервер = http.createServer(function (запрос, ответ) {
    let адрес;
    try { адрес = decodeURIComponent(запрос.url.split('?')[0]); } catch (е) { ответ.writeHead(400); ответ.end(); return; }
    if (адрес === '/') адрес = '/mines.html';
    const относительный = path.normalize(адрес).replace(/^(\.\.[\\/])+/, '').replace(/^[\\/]+/, '');
    const части = относительный.split(/[\\/]/).filter(Boolean);
    if (адрес.toLowerCase().indexOf('.env') !== -1 || (части[0] || '').toLowerCase() === 'bot' ||
        части.some(function (ч) { return ч.charAt(0) === '.'; })) {
      ответ.writeHead(403); ответ.end('закрыто'); return;
    }
    const ключ = относительный.split(path.sep).join('/');
    const файл = подмены[ключ] || path.join(ПРОЕКТ, относительный);
    fs.readFile(файл, function (ошибка, данные) {
      if (ошибка) { ответ.writeHead(404); ответ.end('нет файла'); return; }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      ответ.end(данные);
    });
  });
  return new Promise(function (готово, беда) {
    сервер.once('error', беда);
    сервер.listen(0, '127.0.0.1', function () { готово(сервер); });
  });
}

/* ---------- Один случай ---------- */

/** Ошибки консоли без шума оборванного telegram.org («Failed to load resource»). */
function слушатьОшибки(страница) {
  const ошибки = [];
  страница.on('pageerror', function (е) { ошибки.push(е.message); });
  страница.on('console', function (с) {
    if (с.type() === 'error' && !/Failed to load resource/.test(с.text())) ошибки.push(с.text());
  });
  return ошибки;
}

/** Партия в сапёре до итога: первый ход «выигрывает» или «проигрывает» за 73 секунды. */
async function сапёрДоИтога(браузер, порт, настройка) {
  const страница = await браузер.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const ошибки = слушатьОшибки(страница);
  if (настройка.телеграм) await подготовитьПодделку(страница, { подпись: 'query_id=проверка&user=1' });
  else await безTelegram(страница);
  await страница.goto('http://127.0.0.1:' + порт + '/mines.html');
  await страница.evaluate(function (исход) {
    window.__ярлык = [];
    window.__хвастовство = [];
    if (window.Ярлык) window.Ярлык.партияСыграна = function (игра) { window.__ярлык.push(игра); };
    if (window.Сеть && typeof window.Сеть.похвастаться === 'function') {
      window.Сеть.похвастаться = function (описание) { window.__хвастовство.push(описание); return Promise.resolve({ отправлено: true }); };
    }
    window.CasualGame.act = function (состояние) { состояние[исход] = true; состояние.seconds = 73.4; return true; };
  }, настройка.победа ? 'won' : 'lost');
  await страница.locator('#play').click();
  await страница.locator('#playfield button').first().waitFor({ state: 'visible', timeout: 8000 });
  await страница.locator('#playfield button').first().click();
  await страница.locator('#dialog[open]').waitFor({ state: 'visible', timeout: 5000 });
  return { страница: страница, ошибки: ошибки };
}

async function прогон(подмены) {
  всего = 0; провалов = 0;
  const сервер = await поднятьСервер(подмены);
  const порт = сервер.address().port;
  const браузер = await chromium.launch();
  try {
    const кнопка = function (с) { return с.страница.locator('#dialog-body button', { hasText: 'Похвастаться' }); };
    const ещё = function (с) { return с.страница.locator('#dialog-body button', { hasText: 'Сыграть ещё' }); };
    const вызовы = function (с) { return с.страница.evaluate(function () { return { ярлык: window.__ярлык, хвастовство: window.__хвастовство }; }); };

    console.log('Случай 1: победа в Telegram');
    const победа = await сапёрДоИтога(браузер, порт, { телеграм: true, победа: true });
    проверить(await ещё(победа).count() === 1, 'окно итога открыто («Сыграть ещё» есть)');
    проверить(await кнопка(победа).count() === 1 && await кнопка(победа).isVisible(), 'кнопка «Похвастаться» видна');
    await победа.страница.screenshot({ path: path.join(ПАПКА_СНИМКОВ, 'сапёр-похвастаться.png') });
    if (await кнопка(победа).count() === 1) await кнопка(победа).click();
    const звонки = await вызовы(победа);
    проверить(звонки.хвастовство.length === 1, 'дверь Сеть.похвастаться позвана ровно один раз');
    const о = звонки.хвастовство[0] || {};
    проверить(о.игра === 'сапёр' && о.исход === 'победа' && о.мера === 'секунд', 'описание: игра «сапёр», исход «победа», мера «секунд»');
    проверить(Number.isInteger(о.значение) && о.значение >= 73 && о.значение <= 76, 'значение — целые секунды партии (73…76), пришло: ' + о.значение);
    проверить(Object.keys(о).sort().join(',') === 'игра,исход,значение,мера'.split(',').sort().join(','), 'режим не передаётся (у сапёра в реестре режимов нет)');
    проверить(звонки.ярлык.length === 1 && звонки.ярлык[0] === 'сапёр', 'Ярлык.партияСыграна позвана ровно один раз с «сапёр»');
    проверить(победа.ошибки.length === 0, 'ошибок страницы нет' + (победа.ошибки.length ? ': ' + победа.ошибки[0] : ''));
    await победа.страница.close();

    console.log('Случай 2: победа без Telegram');
    const безТГ = await сапёрДоИтога(браузер, порт, { телеграм: false, победа: true });
    проверить(await ещё(безТГ).count() === 1, 'окно итога открыто («Сыграть ещё» есть)');
    проверить(await кнопка(безТГ).count() === 0, 'кнопки «Похвастаться» нет');
    проверить((await вызовы(безТГ)).ярлык.length === 1, 'партия в ярлык отмечена и без Telegram (ровно один раз)');
    await безТГ.страница.close();

    console.log('Случай 3: поражение в Telegram');
    const поражение = await сапёрДоИтога(браузер, порт, { телеграм: true, победа: false });
    проверить(await ещё(поражение).count() === 1, 'окно итога открыто («Сыграть ещё» есть)');
    проверить(await кнопка(поражение).count() === 0, 'кнопки «Похвастаться» нет');
    const после = await вызовы(поражение);
    проверить(после.ярлык.length === 1 && после.ярлык[0] === 'сапёр', 'проигранная партия тоже отмечена в ярлык, ровно один раз');
    await поражение.страница.close();

    console.log('Случай 5: все 10 страниц casual — консоль чистая, партия запускается');
    for (const имя of ВИДИМЫЕ.concat(СКРЫТЫЕ)) {
      const страница = await браузер.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const ошибки = слушатьОшибки(страница);
      await подготовитьПодделку(страница, { подпись: 'query_id=проверка&user=1' });
      await страница.goto('http://127.0.0.1:' + порт + '/' + имя + '.html');
      await страница.locator('#play').click();
      let поле = 0;
      try {
        await страница.locator('#экран-игры').waitFor({ state: 'visible', timeout: 8000 });
        await страница.waitForTimeout(300);
        поле = await страница.locator('#playfield > *').count();
      } catch (е) { поле = 0; }
      const дверь = await страница.evaluate(function () { return typeof (window.Сеть && window.Сеть.похвастаться) === 'function'; });
      проверить(поле > 0, имя + ': партия запустилась, поле нарисовано (' + поле + ' узлов)');
      проверить(ошибки.length === 0, имя + ': консоль без ошибок' + (ошибки.length ? ' — ' + ошибки[0] : ''));
      проверить(дверь === ВИДИМЫЕ.includes(имя), имя + (ВИДИМЫЕ.includes(имя) ? ': дверь Сеть.похвастаться есть' : ': двери Сеть.похвастаться нет (скрытая игра)'));
      await страница.close();
    }
  } finally {
    await браузер.close();
    сервер.close();
  }
  return провалов;
}

/* ---------- Ломающий прогон ---------- */

async function сломать() {
  console.log('Контрольный прогон по целой копии (обязан быть зелёным)');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'хвастовство-casual-'));
  const копия = path.join(папка, 'casual-ui.js');
  const исходник = fs.readFileSync(path.join(ПРОЕКТ, ИМЯ_ФАЙЛА), 'utf8');
  fs.writeFileSync(копия, исходник);
  const контроль = await прогон({ [ИМЯ_ФАЙЛА]: копия });
  const условие = "if(!state.won||G.record!=='time'";
  const сколько = исходник.split(условие).length - 1;
  if (сколько !== 1) { console.log('ПЛОХО — строка порчи найдена ' + сколько + ' раз, нужно ровно 1'); process.exit(1); }
  fs.writeFileSync(копия, исходник.replace(условие, "if(G.record!=='time'"));
  console.log('\nЛомающий прогон: копия показывает кнопку и при поражении (обязан покраснеть)');
  const сломанный = await прогон({ [ИМЯ_ФАЙЛА]: копия });
  console.log('\nКонтроль: провалов ' + контроль + ' (нужно 0); сломанная копия: провалов ' + сломанный + ' (нужно больше 0)');
  fs.rmSync(папка, { recursive: true, force: true });
  process.exit(контроль === 0 && сломанный > 0 ? 0 : 1);
}

(async function () {
  if (process.argv.includes('--сломать')) return сломать();
  const красных = await прогон({});
  console.log('\nИтого проверок: ' + всего + ', провалов: ' + красных);
  process.exit(красных ? 1 : 0);
})().catch(function (е) { console.log('Проверка упала: ' + (е && е.stack || е)); process.exit(1); });
