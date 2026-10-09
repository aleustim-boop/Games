'use strict';
/* =====================================================================
   ДУРАК: КОГДА СТОЛ ЖДЁТ ТОЛЬКО «БИТО» — КНОПКА СВЕТИТСЯ, ПОДСКАЗКА ЗОВЁТ.

   Что проверяем. В партии против бота С ЛИМИТОМ ВРЕМЕНИ на ход бывает
   положение: слово у человека, а подкинуть нечем. Тогда:
     1) у кнопки «Бито» (#кнопка-завершить) есть класс «кнопка--ждут»;
     2) кнопка видна и не ниже 44 точек (палец попадает);
     3) строка подсказки содержит «ход ждёт вас» и не обрезана;
     4) после нажатия «Бито» класс снят.
   Ширины 320 и 390. Снимки (до нажатия): tests/снимки/дурак-бито/320.png и 390.png.
   Узла нет — это провал, а не пропуск.

   Как доходим до положения. Честной игрой: настоящая партия с ботом,
   лимит 60 секунд, человек ходит сам нажатиями; когда игра дошла до
   «подкидывание, моё слово, подкинуть нечем» — меряем. Положение ищем
   НЕЗАВИСИМО от проверяемого кода (по фазе и рукам, а не по ждутТолькоБито).
   Не вышло за 8 партий — провал «не дошли до положения».

   Запуск:
       node tests/дурак-бито-снимок.js
   Ломающий запуск (портит КОПИЮ игры/дурак/game.js во временной папке — класс
   не ставится — и требует провала):
       node tests/дурак-бито-снимок.js --сломать <путь к временной папке>
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');

const ПРОЕКТ = path.join(__dirname, '..');
const { chromium, подготовитьПодделку } = require(path.join(__dirname, 'браузер-робот.js'));
const { сестьБезНажатий } = require(path.join(__dirname, 'сесть-за-стол.js'));

const арги = process.argv.slice(2);
const иСломать = арги.indexOf('--сломать');
const иИгра = арги.indexOf('--игра');
const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки', 'дурак-бито');
const РАЗМЕРЫ = [{ w: 320, h: 568 }, { w: 390, h: 844 }];
const МИН_ВЫСОТА = 44;
const ПОДМЕНА_ИГРЫ = иИгра !== -1 ? арги[иИгра + 1] : null;

let всего = 0;
let провалов = 0;
function проверить(условие, слова) {
  всего++;
  if (условие) console.log('  ок    — ' + слова);
  else { провалов++; console.log('  ПЛОХО — ' + слова); }
  return Boolean(условие);
}

/* ---------- Свой сервер файлов (можно подменить игры/дурак/game.js копией) ---------- */
const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };

function поднятьСервер(подменаИгры) {
  const сервер = http.createServer(function (запрос, ответ) {
    let п;
    try { п = decodeURIComponent(new URL(запрос.url, 'http://x').pathname); } catch (_) { ответ.writeHead(400); ответ.end(); return; }
    const файл = п === '/' ? path.join(ПРОЕКТ, 'index.html') : path.join(ПРОЕКТ, п);
    if (path.relative(ПРОЕКТ, файл).startsWith('..')) { ответ.writeHead(403); ответ.end(); return; }
    const отн = path.relative(ПРОЕКТ, файл).split(path.sep).join('/');
    const отдать = подменаИгры && отн === 'игры/дурак/game.js' ? подменаИгры : файл;
    fs.readFile(отдать, function (ош, данные) {
      if (ош) { ответ.writeHead(404); ответ.end('нет файла'); return; }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      ответ.end(данные);
    });
  });
  return new Promise(function (готово, беда) {
    сервер.once('error', беда);
    сервер.listen(0, '127.0.0.1', function () { готово(сервер); });
  });
}

/* ---------- В странице ---------- */

/** Один шаг человека; кнопку «Бито» не жмём никогда — она наша цель. */
function шагЧеловека() {
  const к = (id) => document.getElementById(id);
  const можно = [...document.querySelectorAll('#карты-человека .карта--можно')];
  const выбрана = document.querySelector('#карты-человека .карта--выбрана');
  const цель = document.querySelector('#стол .пара--цель');
  if (выбрана && цель) { цель.click(); return 'бью'; }
  if (!к('кнопка-беру').disabled) {
    if (можно.length) { можно[0].click(); return 'поднял'; }
    к('кнопка-беру').click(); return 'взял';
  }
  const бито = к('кнопка-завершить');
  if (!бито.disabled && можно.length) { можно[0].click(); return 'подкинул'; }
  if (можно.length) { можно[0].click(); return 'сходил'; }
  return '';
}

/** Положение «слово у человека, подкинуть нечем» — по рукам и фазе, не по проверяемой функции. */
function естьПоложение() {
  if (!партия || партия.завершена) return false;
  if (фаза(партия) !== 'подкидывание' || партия.атакует !== 'человек') return false;
  if (!сейчасМойХод() || картаДляБроска !== null) return false;
  if (!партия.руки.человек.length) return false;   // с пустой рукой игра пасует сама
  if (партия.стол.some((п) => !п.защита)) return false;   // ещё не всё отбито
  return !партия.руки.человек.some((к) => можноПоложить(партия, к));
}

function замер() {
  const кн = document.getElementById('кнопка-завершить');
  const под = document.getElementById('подсказка-текст') || document.getElementById('подсказка');
  const ответ = { кнопка: null, подсказка: null };
  if (кн) {
    const р = кн.getBoundingClientRect(), с = getComputedStyle(кн);
    ответ.кнопка = {
      класс: кн.classList.contains('кнопка--ждут'),
      виден: с.display !== 'none' && с.visibility !== 'hidden' && р.width > 0 && р.height > 0 && !кн.classList.contains('скрыт'),
      h: р.height, w: р.width, текст: кн.textContent.trim()
    };
  }
  if (под) {
    ответ.подсказка = { текст: под.textContent.trim(), scrollWidth: под.scrollWidth, clientWidth: под.clientWidth };
  }
  return ответ;
}

/* ---------- Один прогон по ширине ---------- */

async function довестиДоПоложения(страница, адрес) {
  for (let партияНомер = 0; партияНомер < 8; партияНомер++) {
    if (партияНомер > 0) await страница.goto(адрес);
    await страница.waitForFunction(() => typeof настройкиИгрыСБотами !== 'undefined');
    await страница.evaluate(() => { настройкиИгрыСБотами.лимитСекундНаХод = 60; });
    await сестьБезНажатий(страница, { игроков: 2 });
    await страница.waitForTimeout(1200);
    for (let шаг = 0; шаг < 90; шаг++) {
      if (await страница.evaluate(естьПоложение)) { await страница.waitForTimeout(500); return true; }
      if (await страница.evaluate(() => !партия || партия.завершена)) break;
      await страница.evaluate(шагЧеловека);
      await страница.waitForTimeout(450);
    }
  }
  return false;
}

async function прогон(адрес) {
  fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
  const браузер = await chromium.launch();
  const ошибки = [];
  try {
    for (const р of РАЗМЕРЫ) {
      console.log('\nШирина ' + р.w + ' (высота ' + р.h + ')');
      const окно = await браузер.newContext({ viewport: { width: р.w, height: р.h }, hasTouch: true });
      const страница = await окно.newPage();
      страница.on('pageerror', (e) => ошибки.push(String(e.message || e)));
      /* Красной считаем ошибку страницы и сбой СВОЕГО файла; обрыв чужого адреса
         (облако Telegram, сервер комнат — их на стенде нет) — не поломка игры. */
      страница.on('requestfailed', (з) => { if (з.url().startsWith(адрес)) ошибки.push('не загрузился свой файл ' + з.url()); });
      страница.on('console', (с) => { if (с.type() === 'error' && !/Failed to load resource/.test(с.text())) ошибки.push(с.text()); });
      await подготовитьПодделку(страница, { версия: '8.0', полныйЭкран: 'дают' });
      await страница.goto(адрес);
      const дошли = await довестиДоПоложения(страница, адрес);
      if (!проверить(дошли, 'партия с лимитом дошла до «слово у меня, подкинуть нечем»')) { await окно.close(); continue; }

      const м = await страница.evaluate(замер);
      if (!проверить(м.кнопка, 'узел «Бито» (#кнопка-завершить) найден')) { await окно.close(); continue; }
      проверить(м.кнопка.класс, 'у «Бито» есть класс «кнопка--ждут»');
      проверить(м.кнопка.виден, 'кнопка «Бито» видна');
      проверить(м.кнопка.h >= МИН_ВЫСОТА - 0.5, 'кнопка не ниже ' + МИН_ВЫСОТА + ' (высота ' + Math.round(м.кнопка.h) + ')');
      if (проверить(м.подсказка, 'строка подсказки найдена')) {
        проверить(/ход ждёт вас/i.test(м.подсказка.текст), 'подсказка говорит «ход ждёт вас» (сейчас: «' + м.подсказка.текст + '»)');
        проверить(м.подсказка.scrollWidth <= м.подсказка.clientWidth, 'подсказка не обрезана (' + м.подсказка.scrollWidth + ' ≤ ' + м.подсказка.clientWidth + ')');
      }
      const снимок = path.join(ПАПКА_СНИМКОВ, р.w + '.png');
      await страница.screenshot({ path: снимок });
      console.log('  снимок: ' + снимок);

      await страница.locator('#кнопка-завершить').click({ timeout: 4000 });
      await страница.waitForTimeout(400);
      const после = await страница.evaluate(замер);
      проверить(после.кнопка && !после.кнопка.класс, 'после нажатия «Бито» класс «кнопка--ждут» снят');
      await окно.close();
    }
  } finally {
    await браузер.close();
  }
  проверить(ошибки.length === 0, 'красных ошибок в консоли нет' + (ошибки.length ? ': ' + ошибки.slice(0, 3).join(' | ') : ''));
}

(async () => {
  if (иСломать !== -1) {
    /* Ломающий запуск: КОПИЯ game.js, где класс не ставится; проверка обязана покраснеть. */
    const папка = арги[иСломать + 1];
    if (!папка) { console.log('нужен путь к временной папке: --сломать <папка>'); process.exit(2); }
    fs.mkdirSync(папка, { recursive: true });
    const исходник = fs.readFileSync(path.join(ПРОЕКТ, 'игры', 'дурак', 'game.js'), 'utf8');
    const испорчено = исходник.replace("classList.toggle('кнопка--ждут', ждутТолькоБито())", "classList.toggle('кнопка--ждут', false)");
    if (испорчено === исходник) { console.log('ПЛОХО — в игры/дурак/game.js не нашлось строки, которую портим: ломающий запуск ничего не сломал'); process.exit(2); }
    const копия = path.join(папка, 'game.js');
    fs.writeFileSync(копия, испорчено);
    console.log('Ломающий запуск: копия ' + копия + ', класс не ставится — ждём провал.');
    const п = spawnSync(process.execPath, [__filename, '--игра', копия], { encoding: 'utf8', timeout: 400000 });
    console.log(п.stdout);
    if (п.status === 1) { console.log('ЛОМАЮЩИЙ ЗАПУСК: проверка покраснела, как и должна.'); process.exit(0); }
    console.log('ЛОМАЮЩИЙ ЗАПУСК ПРОВАЛЕН: проверка не покраснела (код ' + п.status + ') ' + (п.stderr || ''));
    process.exit(1);
  }
  const сервер = await поднятьСервер(ПОДМЕНА_ИГРЫ);
  const адрес = 'http://127.0.0.1:' + сервер.address().port + '/';
  try {
    await прогон(адрес);
  } catch (ошибка) {
    проверить(false, 'проверка упала: ' + (ошибка && ошибка.message || ошибка));
  }
  сервер.close();
  console.log('\nИтого проверок: ' + всего + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
})();
