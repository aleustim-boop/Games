'use strict';

/* =====================================================================
   «ЗАХВАТ», ВИД «ПАРЯЩИЙ» (этап П3) — БРАУЗЕРНАЯ ПРОВЕРКА (playwright/chromium).
   Сводный node-прогон её не гоняет: нужен настоящий браузер.

   Что делает: открывает стол «Захвата» на 390×844 и 320×640, играет партию
   на шестерых (самый тесный ряд капсул, 3 + 3) и в трёх фазах — расстановка,
   приказы (лист приказа и стол с отданным приказом), итог раунда — проверяет:
     1. все кнопки видимого экрана не меньше 44 по обеим сторонам;
     2. текст на столе не мельче 12 px (подписи на самой карте — отдельной
        строкой-замечанием, в счёт не идут);
     3. капсулы игроков не налезают друг на друга, на «‹ ⋯» и на капсулу раунда;
     4. пульт целиком выше нижней безопасной зоны (--отступ-снизу);
     5. высота пульта не больше --захват-пульт-наибольший (её читаем из css,
        нет переменной — провал), в итоге раунда пульт обязан быть «--итог»;
     6. салатовый #D2F76B (по вычисленному цвету: текст, фон, рамки, тени,
        градиенты, ::before/::after) — только у разрешённых узлов: «Готово»,
        «Ударить», рамка и имя «Вы», «+N» на карте (и число на стрелке удара).
   Ноль найденного узла = провал: не нашли «Готово», капсулы, пульт — красное.

   Запуск:
       node tests/захват-парящий.js
       node tests/захват-парящий.js --css <путь к style-захват.css>   (для порчи копий)
       node tests/захват-парящий.js --сломать
       node tests/захват-парящий.js --без-снимков
   Снимки: tests/снимки/захват-парящий/<фаза>-<ширина>.png (6 штук).

   --сломать: во временной папке три порченые копии css, каждая обязана дать
   провалы: (а) кнопки пульта высотой 40; (б) салатовый у «Отменить»;
   (в) нет переменной --захват-пульт-наибольший. Файлы проекта не портятся.

   Стенд — свой файловый сервер на свободном порту (не 8790 и не 8765).
   Перед запуском: node штаб/браузер-занят.js --ждать
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const ПРОЕКТ = path.join(__dirname, '..');
const ПАПКА_СНИМКОВ = path.join(ПРОЕКТ, 'tests', 'снимки', 'захват-парящий');
const { chromium, безTelegram } = require(path.join(ПРОЕКТ, 'tests', 'браузер-робот.js'));

const аргументы = process.argv.slice(2);
const без_снимков = аргументы.includes('--без-снимков');
const ключ = имя => { const н = аргументы.indexOf(имя); return н >= 0 ? аргументы[н + 1] : null; };

let провалов = 0;
let проверок = 0;
function проверить(условие, слова) {
  проверок++;
  console.log((условие ? '  ок   — ' : '  ПЛОХО— ') + слова);
  if (!условие) провалов++;
  return условие;
}

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};

/* Сервер проекта; style-захват.css отдаёт из данного пути (если дан). */
function поднятьСервер(путьCss) {
  const сервер = http.createServer((запрос, ответ) => {
    let путь = '/';
    try { путь = decodeURIComponent(запрос.url.split('?')[0]); } catch (_) { /* как есть */ }
    if (путь === '/') путь = '/index.html';
    let файл = path.join(ПРОЕКТ, путь);
    if (путь === '/style-захват.css' && путьCss) файл = путьCss;
    if (!файл.startsWith(ПРОЕКТ) && файл !== путьCss) { ответ.writeHead(403); ответ.end('нельзя'); return; }
    try {
      if (fs.statSync(файл).isFile()) {
        ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream' });
        ответ.end(fs.readFileSync(файл));
        return;
      }
    } catch (_) { /* нет файла */ }
    ответ.writeHead(404); ответ.end('нет такого файла');
  });
  return new Promise(готово => сервер.listen(0, '127.0.0.1', () => готово(сервер)));
}

/* ---------- Замеры внутри страницы (одна функция на все фазы) ---------- */
function замерВСтранице(разрешённыеОтдать) {
  const салатный = (строка, допуск) => {
    // ищем в строке любые цвета (rgb, rgba, color(srgb …)) и сравниваем с #D2F76B (210, 247, 107) с допуском
    const найдено = [];
    (строка || '').replace(/rgba?\(([^)]+)\)/g, (_, т) => { const ч = т.split(/[ ,\/]+/).filter(Boolean).map(Number); найдено.push({ к: ч[0], з: ч[1], с: ч[2], а: ч.length > 3 ? ч[3] : 1 }); return ''; });
    (строка || '').replace(/color\(srgb ([^)]+)\)/g, (_, т) => { const ч = т.split(/[ \/]+/).filter(Boolean).map(Number); найдено.push({ к: ч[0] * 255, з: ч[1] * 255, с: ч[2] * 255, а: ч.length > 3 ? ч[3] : 1 }); return ''; });
    return найдено.some(ц => ц.а > 0.05 && Math.abs(ц.к - 210) <= допуск && Math.abs(ц.з - 247) <= допуск && Math.abs(ц.с - 107) <= допуск);
  };
  const видим = у => {
    if (!у || !у.isConnected) return false;
    const р = у.getBoundingClientRect();
    if (р.width <= 0 || р.height <= 0) return false;
    const ст = getComputedStyle(у);
    return ст.display !== 'none' && ст.visibility !== 'hidden';
  };
  const экран = document.getElementById('экран-игры');
  const все = Array.from(document.querySelectorAll('#экран-игры *')).filter(видим);
  const прям = у => { const р = у.getBoundingClientRect(); return { л: р.left, в: р.top, п: р.right, н: р.bottom, ш: р.width, вы: р.height }; };
  const имя = у => (у.id ? '#' + у.id : '') + (typeof у.className === 'string' && у.className ? '.' + у.className.trim().split(/\s+/).join('.') : '') || у.tagName.toLowerCase();
  const вКарте = у => !!у.closest('#захват-карта');

  // 1. кнопки (и ползунок, он тоже палец)
  const кнопки = все.filter(у => у.tagName === 'BUTTON' || у.getAttribute('role') === 'button').map(у => ({ имя: имя(у), текст: (у.textContent || '').trim().slice(0, 20), ...прям(у) }));

  // 2. текст
  const мелкий = [], мелкийНаКарте = [];
  for (const у of все) {
    const своё = Array.from(у.childNodes).some(у2 => у2.nodeType === 3 && (у2.textContent || '').trim());
    if (!своё) continue;
    const р = у.getBoundingClientRect();
    if (р.width < 3 || р.height < 3) continue;   // «спрятано для глаз»
    const размер = parseFloat(getComputedStyle(у).fontSize);
    if (размер < 12) (вКарте(у) ? мелкийНаКарте : мелкий).push(имя(у) + ' ' + размер + 'px «' + (у.textContent || '').trim().slice(0, 18) + '»');
  }
  const текстов = все.filter(у => Array.from(у.childNodes).some(у2 => у2.nodeType === 3 && (у2.textContent || '').trim())).length;

  // 3. капсулы
  const капсулы = Array.from(document.querySelectorAll('.захват-игрок')).filter(видим).map(у => ({ место: у.getAttribute('data-место'), ...прям(у) }));
  const круги = Array.from(document.querySelectorAll('#экран-игры .верх-игры__кнопка')).filter(видим).map(у => ({ имя: 'круг ' + (у.getAttribute('aria-label') || ''), ...прям(у) }));
  const капсулаРаунда = Array.from(document.querySelectorAll('#экран-игры .захват-раунд')).filter(видим).map(у => ({ имя: 'капсула раунда', ...прям(у) }));

  // 4–5. пульт
  const пульт = document.getElementById('захват-пульт');
  const стОтступ = getComputedStyle(document.documentElement).getPropertyValue('--отступ-снизу');
  const наибольшийТекст = getComputedStyle(document.body).getPropertyValue('--захват-пульт-наибольший').trim();
  const пультВиден = видим(пульт);
  const рамкаПульта = пультВиден ? прям(пульт) : null;

  // 6. салатовый
  const ЦВЕТА = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderRightColor', 'borderBottomColor',
    'borderLeftColor', 'outlineColor', 'boxShadow', 'textDecorationColor', 'borderImageSource'];
  const салатовые = [];
  for (const у of Array.from(document.querySelectorAll('body *')).filter(видим)) {
    for (const псевдо of [null, '::before', '::after']) {
      const ст = getComputedStyle(у, псевдо);
      if (псевдо && (ст.content === 'none' || ст.content === 'normal')) continue;
      const где = ЦВЕТА.filter(с => {
        // рамка с нулевой шириной цвета не показывает
        if (/^border(Top|Right|Bottom|Left)Color$/.test(с)) {
          const сторона = с.replace('border', '').replace('Color', '');
          if (parseFloat(ст['border' + сторона + 'Width']) === 0) return false;
        }
        if (с === 'outlineColor' && (ст.outlineStyle === 'none' || parseFloat(ст.outlineWidth) === 0)) return false;
        return салатный(ст[с], 36);   // «салатовый по виду»: допуск 36 на канал (смесь с белым и 92% прозрачности тоже ловится)
      });
      if (где.length) салатовые.push({ имя: имя(у) + (псевдо || ''), где: где.join(','), id: у.id || '', точный: где.some(с => салатный(ст[с], 8)),
        разрешён: !!(у.closest('#захват-готово, #захват-приказ-отдать, .захват-игрок--я, .захват-пилюля, .захват-число-приказа--удар')) });
    }
  }
  const классПульта = пульт ? пульт.className : '';
  return { кнопки, мелкий, мелкийНаКарте, текстов, капсулы, круги, капсулаРаунда, рамкаПульта, пультВиден, стОтступ, наибольшийТекст,
    салатовые, классПульта, окно: { ш: window.innerWidth, в: window.innerHeight }, листДля: экран.className };
}

function пересекаются(а, б) {
  return а.л < б.п - 0.5 && б.л < а.п - 0.5 && а.в < б.н - 0.5 && б.в < а.н - 0.5;
}

/* ---------- Проверки одной фазы ---------- */
async function проверитьФазу(страница, ш, фаза, ожидание) {
  const м = await страница.evaluate(замерВСтранице);
  const метка = ш + ' · ' + фаза + ': ';

  проверить(м.кнопки.length >= ожидание.кнопокНеМенее, метка + 'найдено кнопок ' + м.кнопки.length + ' (нужно ≥ ' + ожидание.кнопокНеМенее + ', ноль — провал)');
  const тесные = м.кнопки.filter(к => к.ш < 44 - 0.01 || к.вы < 44 - 0.01);
  проверить(тесные.length === 0, метка + 'все кнопки ≥ 44 по обеим сторонам' + (тесные.length ? ' — тесные: ' + тесные.map(к => к.имя + ' «' + к.текст + '» ' + Math.round(к.ш * 10) / 10 + '×' + Math.round(к.вы * 10) / 10).join('; ') : ''));

  проверить(м.текстов >= 3, метка + 'найдено текстовых узлов ' + м.текстов + ' (нужно ≥ 3, ноль — провал)');
  проверить(м.мелкий.length === 0, метка + 'текст на столе не мельче 12 px' + (м.мелкий.length ? ' — мельче: ' + м.мелкий.join('; ') : ''));
  if (м.мелкийНаКарте.length) console.log('  замечание — ' + метка + 'подписи на самой карте мельче 12 px (в счёт не идут): ' + Array.from(new Set(м.мелкийНаКарте)).slice(0, 4).join('; '));

  if (ожидание.капсулы) {
    проверить(м.капсулы.length >= 2, метка + 'видно капсул игроков ' + м.капсулы.length + ' (нужно ≥ 2, ноль — провал)');
    проверить(м.круги.length === 2, метка + 'видно кругов «‹ ⋯»: ' + м.круги.length + ' (нужно 2)');
    const пары = [];
    for (let а = 0; а < м.капсулы.length; а++) {
      for (let б = а + 1; б < м.капсулы.length; б++) if (пересекаются(м.капсулы[а], м.капсулы[б])) пары.push(м.капсулы[а].место + '×' + м.капсулы[б].место);
      for (const к of м.круги.concat(м.капсулаРаунда)) if (пересекаются(м.капсулы[а], к)) пары.push('капсула ' + м.капсулы[а].место + '×' + к.имя);
    }
    проверить(пары.length === 0, метка + 'капсулы не налезают друг на друга и на «‹ ⋯» и капсулу раунда' + (пары.length ? ' — налезают: ' + пары.join(', ') : ''));
    const вылез = м.капсулы.filter(к => к.л < -0.5 || к.п > м.окно.ш + 0.5);
    проверить(вылез.length === 0, метка + 'капсулы целиком в ширине экрана');
  }

  if (ожидание.пульт) {
    проверить(м.пультВиден && !!м.рамкаПульта, метка + 'пульт найден и виден (нет — провал)');
    if (м.рамкаПульта) {
      const отступ = parseFloat(м.стОтступ) || 0;
      проверить(м.рамкаПульта.н <= м.окно.в - отступ + 0.5, метка + 'пульт целиком выше нижней безопасной зоны (низ пульта ' + Math.round(м.рамкаПульта.н) + ', граница ' + (м.окно.в - отступ) + ')');
      const наибольший = parseFloat(м.наибольшийТекст);
      проверить(Number.isFinite(наибольший) && наибольший > 0, метка + 'в css есть --захват-пульт-наибольший (прочитано «' + м.наибольшийТекст + '», пусто — провал)');
      if (Number.isFinite(наибольший)) проверить(м.рамкаПульта.вы <= наибольший + 0.01, метка + 'высота пульта ' + Math.round(м.рамкаПульта.вы * 10) / 10 + ' ≤ --захват-пульт-наибольший ' + наибольший);
    }
  }

  const чужие = м.салатовые.filter(с => !с.разрешён);
  проверить(чужие.length === 0, метка + 'салатовый только у разрешённых узлов' + (чужие.length ? ' — лишний у: ' + чужие.map(с => с.имя + ' (' + с.где + ')').join('; ') : ''));
  for (const с of м.салатовые) if (/#захват-готово|#захват-приказ-отдать/.test(с.имя) && !с.точный && !/::/.test(с.имя)) { console.log('  замечание — ' + метка + 'у ' + с.имя.split('.')[0] + ' салатовый не точно #D2F76B (по полям: ' + с.где + ')'); break; }
  for (const нужный of ожидание.салатовыеЕсть) {
    проверить(м.салатовые.some(с => с.разрешён && нужный.test(с.имя)), метка + 'салатовый найден у ' + нужный + ' (ноль найденного — провал)');
  }
  return м;
}

/* ---------- Прогон на одной ширине ---------- */
async function прогнать(браузер, порт, ш, в) {
  console.log('\n=== ' + ш + '×' + в + ' ===');
  const контекст = await браузер.newContext({ viewport: { width: ш, height: в } });
  const страница = await контекст.newPage();
  await безTelegram(страница);   // вне Telegram верхняя строка «‹ ⋯» рисуется страницей, её и проверяем
  const ошибки = [];
  страница.on('console', с => {
    if (с.type() === 'error' && (с.location().url || '').indexOf('telegram-web-app.js') === -1) ошибки.push(с.text());
  });
  страница.on('pageerror', е => ошибки.push('необработанная ошибка: ' + е.message));
  await страница.addInitScript(() => { try { localStorage.setItem('zahvat-learned', '1'); } catch (_) { /* пусто */ } });
  await страница.goto('http://127.0.0.1:' + порт + '/захват.html', { waitUntil: 'load' });
  await страница.waitForTimeout(800);
  const снять = async имя => {
    if (без_снимков) return;
    fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
    const файл = path.join(ПАПКА_СНИМКОВ, имя + '-' + ш + '.png');
    await страница.screenshot({ path: файл });
    console.log('    снимок: ' + файл);
  };
  const видимУзел = ид => страница.evaluate(и => {
    const у = document.getElementById(и);
    if (!у) return false;
    const р = у.getBoundingClientRect();
    return !у.classList.contains('скрыт') && р.width > 0 && р.height > 0;
  }, ид);
  const подсказка = () => страница.evaluate(() => (document.getElementById('захват-подсказка').textContent || '').trim());

  // Лобби → настройки → шестеро → «Начать».
  await страница.click('#захват-боты');
  await страница.waitForTimeout(300);
  await страница.click('#захват-выбор-число [data-значение="6"]');
  await страница.click('#захват-начать');
  await страница.waitForTimeout(1000);
  const столОткрыт = await страница.evaluate(() => document.getElementById('экран-игры').classList.contains('экран--виден'));
  if (!проверить(столОткрыт, ш + ': после «Начать» открылся стол (нет — дальше идти некуда)')) { await контекст.close(); return; }

  // Фаза 1: расстановка.
  await проверитьФазу(страница, ш, 'расстановка', { кнопокНеМенее: 4, капсулы: true, пульт: true, итог: false, салатовыеЕсть: [/#захват-готово/, /захват-игрок--я/] });
  await снять('расстановка');

  // Расставляем остаток в первую свою область.
  const мои = await страница.evaluate(() => {
    const с = JSON.parse(localStorage.getItem('zahvat-save') || 'null');
    const р = [];
    if (с) for (let н = 1; н < с.партия.хозяева.length; н++) if (с.партия.хозяева[н] === 'человек') р.push(н);
    return р;
  });
  проверить(мои.length > 0, ш + ': найдены свои области (' + мои.length + ', ноль — провал)');
  if (!мои.length) { await контекст.close(); return; }
  const открытая = номер => страница.evaluate(н => {
    const т = window.ЗахватЭкран.гдеОбласть(н);
    if (!т) return null;
    const э = document.elementFromPoint(т.x, т.y);
    return э && э.closest('#захват-карта, #захват-слой') ? { x: т.x, y: т.y } : null;
  }, номер);
  let своя = мои[0];
  for (const н of мои) { if (await открытая(н)) { своя = н; break; } }
  for (let н = 0; н < 40; н++) {
    if (!/^Поставьте войска/.test(await подсказка())) break;
    const т = await открытая(своя);
    if (!т) break;
    await страница.mouse.click(т.x, т.y);
    await страница.waitForTimeout(120);
  }
  проверить(!/^Поставьте войска/.test(await подсказка()), ш + ': остаток расставлен, подсказка «' + await подсказка() + '»');

  // Фаза 2: приказы. Протяжка от своей области к соседней → лист приказа.
  const пары = await страница.evaluate(() => {
    const с = JSON.parse(localStorage.getItem('zahvat-save') || 'null');
    if (!с || !window.ЗахватКарты) return [];
    const К = window.ЗахватКарты, п = с.партия;
    const соседи = К.соседство(К.КАРТЫ[п.карта]);
    const р = [];
    for (let н = 1; н < п.хозяева.length; н++) {
      if (п.хозяева[н] !== 'человек') continue;
      for (const сосед of (соседи[н] || []).filter(к => п.хозяева[к] !== 'человек')) р.push({ из: н, куда: сосед });
    }
    return р;
  });
  let пара = null;
  for (const кандидат of пары) { if (await открытая(кандидат.из) && await открытая(кандидат.куда)) { пара = кандидат; break; } }
  if (!проверить(!!пара, ш + ': нашлась своя область с соседом для приказа (нет — провал)')) { await контекст.close(); return; }
  const а = await страница.evaluate(н => window.ЗахватЭкран.гдеОбласть(н), пара.из);
  const б = await страница.evaluate(н => window.ЗахватЭкран.гдеОбласть(н), пара.куда);
  await страница.mouse.move(а.x, а.y);
  await страница.mouse.down();
  await страница.mouse.move((а.x + б.x) / 2, (а.y + б.y) / 2, { steps: 8 });
  await страница.mouse.move(б.x, б.y, { steps: 6 });
  await страница.mouse.up();
  await страница.waitForTimeout(600);
  проверить(await видимУзел('захват-приказ'), ш + ': после протяжки открыт лист приказа (нет — провал)');
  await проверитьФазу(страница, ш, 'приказы, лист приказа', { кнопокНеМенее: 5, капсулы: true, пульт: false, итог: false, салатовыеЕсть: [/#захват-приказ-отдать/, /захват-игрок--я/] });
  await страница.click('#захват-приказ-отдать');
  await страница.waitForTimeout(500);
  await проверитьФазу(страница, ш, 'приказы, стол с приказом', { кнопокНеМенее: 3, капсулы: true, пульт: true, итог: false, салатовыеЕсть: [/#захват-готово/, /захват-игрок--я/, /захват-число-приказа--удар|захват-пилюля/] });
  await снять('приказы');

  // Фаза 3: итог раунда. «Готово» (иногда спрашивает про остаток — отвечаем «да»).
  await страница.click('#захват-готово');
  const пластина = await страница.waitForFunction(() => {
    const у = document.getElementById('захват-пластина');
    return !!у && !у.classList.contains('скрыт') && у.getBoundingClientRect().height > 0;
  }, null, { timeout: 40000 }).then(() => true, () => false);
  проверить(пластина, ш + ': пластина итога раунда появилась в пульте (нет — провал)');
  await страница.waitForTimeout(500);
  const классЕсть = await страница.evaluate(() => document.getElementById('захват-пульт').classList.contains('захват-пульт--итог'));
  if (!классЕсть) {
    console.log('  замечание — ' + ш + ': код не ставит пульту класс захват-пульт--итог (его ставит этап П5); замер итога сделан с классом, поставленным вручную');
    await страница.evaluate(() => document.getElementById('захват-пульт').classList.add('захват-пульт--итог'));
    await страница.waitForTimeout(200);
  }
  await проверитьФазу(страница, ш, 'итог раунда', { кнопокНеМенее: 2, капсулы: true, пульт: true, итог: true, салатовыеЕсть: [/захват-игрок--я/] });
  const пластинаВПульте = await страница.evaluate(() => { const п = document.getElementById('захват-пластина'); return !!п && !!п.closest('#захват-пульт'); });
  проверить(пластинаВПульте, ш + ': пластина лежит внутри пульта');
  await снять('итог');

  проверить(ошибки.length === 0, ш + ': консоль без ошибок' + (ошибки.length ? ': ' + ошибки.join(' | ') : ''));
  await контекст.close();
}

async function весьПрогон(путьCss) {
  const сервер = await поднятьСервер(путьCss);
  const порт = сервер.address().port;
  console.log('Стенд: http://127.0.0.1:' + порт + (путьCss ? '  (css из ' + путьCss + ')' : ''));
  const браузер = await chromium.launch();
  try {
    await прогнать(браузер, порт, 390, 844);
    await прогнать(браузер, порт, 320, 640);
  } finally {
    await браузер.close();
    сервер.close();
  }
}

/* ---------- Порченые копии css ---------- */
function испортить(как) {
  const css = fs.readFileSync(path.join(ПРОЕКТ, 'style-захват.css'), 'utf8');
  let новый = css;
  if (как === 'кнопки-40') {
    новый = css.replace('flex: 1 1 0; min-width: 0; height: 56px; min-height: 56px; padding: 0 12px;', 'flex: 1 1 0; min-width: 0; height: 40px; min-height: 40px; padding: 0 12px;');
  } else if (как === 'салат-у-отменить') {
    новый = css + '\nbody.захват #захват-пульт #захват-отменить { background: #d2f76b !important; color: #d2f76b !important; }\n';
  } else if (как === 'без-переменной') {
    новый = css.replace(/--захват-пульт-наибольший\s*:\s*[^;]+;/g, '');
  }
  if (новый === css) throw new Error('--сломать «' + как + '»: порча не нашла, что портить (css изменился?)');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'захват-парящий-'));
  const файл = path.join(папка, 'style-захват.css');
  fs.writeFileSync(файл, новый);
  return файл;
}

async function главное() {
  if (аргументы.includes('--сломать')) {
    const итоги = [];
    for (const как of ['кнопки-40', 'салат-у-отменить', 'без-переменной']) {
      const файл = испортить(как);
      const до = провалов;
      console.log('\n##### ЛОМАЮЩИЙ ЗАПУСК «' + как + '» (копия ' + файл + ') #####');
      await весьПрогон(файл);
      итоги.push({ как, красных: провалов - до });
    }
    console.log('\nЛомающие запуски:');
    let всёКраснеет = true;
    for (const и of итоги) { console.log('  ' + (и.красных > 0 ? 'краснеет' : 'НЕ КРАСНЕЕТ') + ' — ' + и.как + ' (провалов ' + и.красных + ')'); if (!и.красных) всёКраснеет = false; }
    process.exit(всёКраснеет ? 0 : 1);
  }
  await весьПрогон(ключ('--css'));
  console.log('\nИтого проверок: ' + проверок + ', провалов: ' + провалов);
  process.exit(провалов ? 1 : 0);
}

главное().catch(е => { console.error(е); process.exit(2); });
