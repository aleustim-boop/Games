'use strict';

/* Проверка этапа О5 плана штаб/план-похвастаться-ярлык.md: кнопка «Похвастаться»
   и счёт партий для ярлыка в окне итога 2048 и судоку (браузер, playwright).

   Случаи на каждую игру:
     - итог в Telegram: кнопка есть, нажатие даёт верное описание (целое > 0,
       режим — ключ из js/игры-реестр.js);
     - без Telegram: кнопки нет;
     - 2048: счёт 0 — кнопки нет; после «Отменить ход» — кнопки нет;
     - судоку: после подсказки — кнопки нет;
     - Ярлык.партияСыграна — ровно один раз за партию;
     - консоль без ошибок.

   Запуск:  node tests/похвастаться-2048-судоку.js
            [--ui2048=<путь к КОПИИ js/2048-ui.js>] [--uiсудоку=<путь к КОПИИ js/sudoku-ui.js>]
   Ломающий запуск: копии без условий «счёт > 0 / без отмены» и «без подсказок»
   (делает scratchpad-скрипт) — проверка обязана покраснеть. Настоящие файлы не портим.
   Страницы раздаёт собственный статический сервер на свободном порту (не 8790/8765),
   он гасится в конце. Итог: «Итого проверок: N, провалов: M», код 1 при провале. */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium, подготовитьПодделку, безTelegram } = require('./браузер-робот');

const КОРЕНЬ = path.resolve(__dirname, '..');
const реестр = require(path.join(КОРЕНЬ, 'js', 'игры-реестр.js'));
const R2048 = require(path.join(КОРЕНЬ, 'js', '2048-rules.js'));

function довод(имя) {
  const найдено = process.argv.find(function (а) { return а.indexOf('--' + имя + '=') === 0; });
  return найдено ? найдено.slice(имя.length + 3) : '';
}
const КОПИИ = { '2048-ui.js': довод('ui2048'), 'sudoku-ui.js': довод('uiсудоку') };

let всего = 0;
let провалов = 0;
function проверить(что, правда) {
  всего++;
  if (!правда) провалов++;
  console.log((правда ? '  ок   ' : '  БЕДА ') + что);
}

const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };

/** Маленький статический сервер на свободном порту: страницы нужны по http://. */
function поднятьСервер() {
  return new Promise(function (готово) {
    const сервер = http.createServer(function (запрос, ответ) {
      let имя = '/';
      try { имя = decodeURIComponent(new URL(запрос.url, 'http://x').pathname); } catch (_) { /* оставим корень */ }
      const файл = path.join(КОРЕНЬ, имя === '/' ? 'index.html' : имя);
      if (!файл.startsWith(КОРЕНЬ) || !fs.existsSync(файл) || fs.statSync(файл).isDirectory()) {
        ответ.writeHead(404); ответ.end(); return;
      }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл)] || 'application/octet-stream' });
      ответ.end(fs.readFileSync(файл));
    });
    сервер.listen(0, '127.0.0.1', function () { готово({ сервер: сервер, порт: сервер.address().port }); });
  });
}

/** Новая страница: с Telegram или без, шпионы после загрузки, подмена ui-файла копией. */
async function открыть(браузер, адрес, { телеграм, ошибки }) {
  const страница = await браузер.newPage({ viewport: { width: 390, height: 844 } });
  страница.on('pageerror', function (е) { ошибки.push('pageerror: ' + е.message); });
  страница.on('console', function (с) {
    if (с.type() !== 'error') return;
    // Ресурсы без ответа (telegram.org оборван нарочно, сервер игр не поднят) — не поломка страницы.
    if (/Failed to load resource|net::ERR/.test(с.text())) return;
    ошибки.push('console: ' + с.text());
  });
  if (телеграм) await подготовитьПодделку(страница, { версия: '8.0', подпись: 'проверка' });
  else await безTelegram(страница);
  for (const имя of Object.keys(КОПИИ)) {
    if (!КОПИИ[имя]) continue;
    await страница.route('**/js/' + имя + '*', function (путь) {
      путь.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: fs.readFileSync(КОПИИ[имя], 'utf8') });
    });
  }
  await страница.goto(адрес);
  // Шпионы ставим после загрузки скриптов, до первого нажатия.
  await страница.evaluate(function () {
    window.__похвастаться = []; window.__ярлык = [];
    window.Сеть = window.Сеть || {};
    window.Сеть.похвастаться = function (о) { window.__похвастаться.push(о); return Promise.resolve({ отправлено: true }); };
    window.Ярлык = window.Ярлык || {};
    window.Ярлык.партияСыграна = function (и) { window.__ярлык.push(и); };
  });
  return страница;
}

function режимИзРеестра(игра, режим) {
  const запись = реестр.поКлючу(игра);
  const ключи = запись && запись.счёт && запись.счёт.режимы ? запись.счёт.режимы.map(function (р) { return р.ключ; }) : [];
  return ключи.indexOf(режим) !== -1;
}

function описаниеГодное(о, игра, мера) {
  return Boolean(о) && о.игра === игра && о.исход === 'победа' && о.мера === мера &&
    Number.isInteger(о.значение) && о.значение > 0 &&
    (о.режим === undefined || режимИзРеестра(игра, о.режим));
}

/* ------------------------------- 2048 ------------------------------- */

/** Жмём стрелки по кругу, пока не откроется окно итога (без отмены). Эффекты выключены — ходы мгновенные. */
async function довестиДоИтога2048(страница) {
  const стрелки = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'];
  for (let круг = 0; круг < 2500; круг++) {
    if (await страница.locator('#dialog').evaluate(function (д) { return д.open; })) return true;
    await страница.keyboard.press(стрелки[круг % 4]);
  }
  return false;
}

const НАСТРОЙКИ_БЕЗ_ЭФФЕКТОВ = { effects: false, sound: false, haptic: false };

async function прогнать2048(браузер, база) {
  console.log('\n2048');
  const ошибки = [];
  const подготовить = async function (страница) {
    await страница.evaluate(function (п) { localStorage.setItem('game-2048-prefs', JSON.stringify(п)); }, НАСТРОЙКИ_БЕЗ_ЭФФЕКТОВ);
    await страница.reload();
    await страница.evaluate(function () {
      window.__похвастаться = []; window.__ярлык = [];
      window.Сеть = window.Сеть || {};
      window.Сеть.похвастаться = function (о) { window.__похвастаться.push(о); return Promise.resolve({ отправлено: true }); };
      window.Ярлык = window.Ярлык || {};
      window.Ярлык.партияСыграна = function (и) { window.__ярлык.push(и); };
    });
  };
  const кнопка = function (страница) { return страница.locator('#dialog-content button', { hasText: 'Похвастаться' }); };

  // 1. В Telegram: настоящая партия до тупика.
  let страница = await открыть(браузер, база + '/2048.html', { телеграм: true, ошибки: ошибки });
  await подготовить(страница);
  await страница.locator('#play').click();
  проверить('2048: партия дошла до окна итога', await довестиДоИтога2048(страница));
  проверить('2048 в Telegram: кнопка «Похвастаться» есть', await кнопка(страница).count() === 1);
  проверить('2048 в Telegram: партияСыграна позвана ровно один раз (' + JSON.stringify(await страница.evaluate(function () { return window.__ярлык; })) + ')',
    JSON.stringify(await страница.evaluate(function () { return window.__ярлык; })) === '["2048"]');
  await страница.screenshot({ path: path.join(КОРЕНЬ, 'tests', 'снимки', 'похвастаться-2048-итог.png'), animations: 'disabled' });
  // Вид: кнопка на всю ширину колонки окна, как главные, и не вплотную к соседней.
  const размеры = await страница.evaluate(function () {
    const к = [].slice.call(document.querySelectorAll('#dialog-content button'));
    const моя = к.find(function (б) { return б.textContent.indexOf('Похвастаться') !== -1; });
    const главная = моя && моя.previousElementSibling;
    if (!моя || !главная) return null;
    const а = моя.getBoundingClientRect(), б = главная.getBoundingClientRect();
    return { ширинаМоей: Math.round(а.width), ширинаГлавной: Math.round(б.width), зазор: Math.round(а.top - б.bottom) };
  });
  проверить('2048: «Похвастаться» на всю ширину и с отступом ' + JSON.stringify(размеры),
    Boolean(размеры) && Math.abs(размеры.ширинаМоей - размеры.ширинаГлавной) <= 1 && размеры.зазор >= 8);
  if (await кнопка(страница).count() === 1) {
    await кнопка(страница).click();
    await страница.waitForTimeout(150);
    const вызовы = await страница.evaluate(function () { return window.__похвастаться; });
    проверить('2048: нажатие даёт один вызов с верным описанием ' + JSON.stringify(вызовы),
      вызовы.length === 1 && описаниеГодное(вызовы[0], '2048', 'очки') && вызовы[0].режим === 'classic');
  } else {
    проверить('2048: нажатие даёт описание (кнопки нет — нечего нажимать)', false);
  }

  // 2. После «Отменить последний ход» кнопки больше нет; счёт партии для ярлыка не удваивается.
  const отмена = страница.locator('#dialog-content button', { hasText: 'Отменить последний ход' });
  if (await отмена.count() === 1) {
    await отмена.click();
    проверить('2048 после отмены: итог снова наступил', await довестиДоИтога2048(страница));
    проверить('2048 после отмены: кнопки нет', await кнопка(страница).count() === 0);
    проверить('2048 после отмены: партияСыграна всё ещё один раз',
      (await страница.evaluate(function () { return window.__ярлык.length; })) === 1);
  } else {
    проверить('2048: в окне итога есть «Отменить последний ход»', false);
  }
  await страница.close();

  // 3. Счёт 0: готовая заблокированная доска без слияний.
  страница = await открыть(браузер, база + '/2048.html', { телеграм: true, ошибки: ошибки });
  await страница.evaluate(function (с) { localStorage.setItem('game-2048-v1', JSON.stringify(с)); }, Object.assign(R2048.create(15), { board: [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2], score: 0, over: true }));
  await подготовить(страница);
  await страница.locator('#play').click();
  проверить('2048 со счётом 0: окно итога открыто', await страница.locator('#dialog').evaluate(function (д) { return д.open; }));
  проверить('2048 со счётом 0: кнопки нет', await кнопка(страница).count() === 0);
  await страница.close();

  // 4. Без Telegram.
  страница = await открыть(браузер, база + '/2048.html', { телеграм: false, ошибки: ошибки });
  await подготовить(страница);
  await страница.locator('#play').click();
  проверить('2048 без Telegram: партия дошла до итога', await довестиДоИтога2048(страница));
  проверить('2048 без Telegram: кнопки нет', await кнопка(страница).count() === 0);
  await страница.close();

  проверить('2048: консоль без ошибок (' + ошибки.join(' | ') + ')', ошибки.length === 0);
}

/* ------------------------------ судоку ------------------------------ */

/** Вводим цифры во все пустые клетки; hintПервой — первую клетку заполняем через подсказку. */
async function решитьСудоку(страница, сПодсказкой) {
  const партия = await страница.evaluate(function () { return JSON.parse(localStorage.getItem('sudoku-game-v1')); });
  const пустые = [];
  for (let i = 0; i < 81; i++) if (!партия.puzzle[i]) пустые.push(i);
  const клетка = function (i) { return страница.locator('#board button').nth(i); };
  let начало = 0;
  if (сПодсказкой) {
    await клетка(пустые[0]).click();
    await страница.locator('#hint').click();
    await страница.locator('#dialog-body button', { hasText: 'Продолжить самостоятельно' }).click();
    начало = 0; // подсказка только посмотрена — цифру всё равно вводим сами, подсказка уже учтена
  }
  // Время партии растёт раз в секунду: ждём, чтобы секунд было больше нуля.
  await страница.waitForTimeout(1500);
  for (let k = начало; k < пустые.length; k++) {
    await клетка(пустые[k]).click();
    await страница.keyboard.press(String(партия.solution[пустые[k]]));
  }
  await страница.locator('#dialog').waitFor({ state: 'visible', timeout: 5000 }).catch(function () {});
  return await страница.locator('#dialog').evaluate(function (д) { return д.open; });
}

async function начатьСудоку(страница) {
  await страница.locator('#play').click();
}

async function прогнатьСудоку(браузер, база) {
  console.log('\nсудоку');
  const ошибки = [];
  const кнопка = function (страница) { return страница.locator('#dialog-body button', { hasText: 'Похвастаться' }); };

  // 1. В Telegram, решено без подсказок.
  let страница = await открыть(браузер, база + '/sudoku.html', { телеграм: true, ошибки: ошибки });
  await начатьСудоку(страница);
  проверить('судоку: решено, окно итога открыто', await решитьСудоку(страница, false));
  проверить('судоку в Telegram без подсказок: кнопка «Похвастаться» есть', await кнопка(страница).count() === 1);
  const ярлык = await страница.evaluate(function () { return window.__ярлык; });
  проверить('судоку: партияСыграна ровно один раз ' + JSON.stringify(ярлык), JSON.stringify(ярлык) === '["судоку"]');
  await страница.screenshot({ path: path.join(КОРЕНЬ, 'tests', 'снимки', 'похвастаться-судоку-итог.png'), animations: 'disabled' });
  if (await кнопка(страница).count() === 1) {
    await кнопка(страница).click();
    await страница.waitForTimeout(150);
    const вызовы = await страница.evaluate(function () { return window.__похвастаться; });
    проверить('судоку: нажатие даёт один вызов с верным описанием ' + JSON.stringify(вызовы),
      вызовы.length === 1 && описаниеГодное(вызовы[0], 'судоку', 'секунд') && режимИзРеестра('судоку', вызовы[0].режим));
  } else {
    проверить('судоку: нажатие даёт описание (кнопки нет — нечего нажимать)', false);
  }
  await страница.close();

  // 2. С подсказкой — кнопки нет, ярлык всё равно считается.
  страница = await открыть(браузер, база + '/sudoku.html', { телеграм: true, ошибки: ошибки });
  await начатьСудоку(страница);
  проверить('судоку с подсказкой: решено, окно итога открыто', await решитьСудоку(страница, true));
  проверить('судоку с подсказкой: кнопки нет', await кнопка(страница).count() === 0);
  проверить('судоку с подсказкой: партияСыграна ровно один раз',
    JSON.stringify(await страница.evaluate(function () { return window.__ярлык; })) === '["судоку"]');
  await страница.close();

  // 3. Без Telegram.
  страница = await открыть(браузер, база + '/sudoku.html', { телеграм: false, ошибки: ошибки });
  await начатьСудоку(страница);
  проверить('судоку без Telegram: решено, окно итога открыто', await решитьСудоку(страница, false));
  проверить('судоку без Telegram: кнопки нет', await кнопка(страница).count() === 0);
  await страница.close();

  проверить('судоку: консоль без ошибок (' + ошибки.join(' | ') + ')', ошибки.length === 0);
}

async function главная() {
  const { сервер, порт } = await поднятьСервер();
  const база = 'http://127.0.0.1:' + порт;
  const браузер = await chromium.launch();
  try {
    проверить('реестр знает режимы 2048 и судоку', режимИзРеестра('2048', 'classic') && режимИзРеестра('судоку', 'easy'));
    await прогнать2048(браузер, база);
    await прогнатьСудоку(браузер, база);
  } catch (ошибка) {
    проверить('проверка дошла до конца без сбоя: ' + (ошибка && ошибка.message), false);
  } finally {
    await браузер.close();
    сервер.close();
  }
  console.log('Итого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}

главная();
