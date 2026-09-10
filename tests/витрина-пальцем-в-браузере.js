/* =====================================================================
   ВИТРИНА ПАЛЬЦЕМ В НАСТОЯЩЕМ БРАУЗЕРЕ.

   Проверка tests/витрина-по-макету.js смотрит витрину в поддельном
   документе: там нет настоящего оформления, размеров и переходов между
   страницами. Этот стенд делает то же, что тестировщик руками 10 сентября:
   открывает витрину в Chromium и нажимает, как человек.

   Что проверяет:
     1) на трёх телефонах (360×740, 390×844, 430×932) — нет прокрутки
        вбок, ничего не вылезло за край, всё живое нажимаемое не меньше
        44×44, все семь картинок плиток пришли (без 404);
     2) фильтры «Все / Настольные / Карточные» показывают ровно нужные
        плитки, выключенные не оживают;
     3) нажатие в выключенную плитку (домино, морской бой, деберц) —
        НАСТОЯЩИМ щелчком мыши по месту на экране — ничего не делает;
     4) нарды, шахматы, шашки открывают свои страницы, и назад приводит
        на витрину — и кнопкой на экране, и возвратом браузера;
        дурак открывает своё меню, и кнопка «К выбору игры» возвращает;
     5) «Профиль» — экран рейтинга, серия дней там видна, «Назад» — витрина;
        витрина → «Профиль» → «Назад» → «Дурак» → «Играть с другом» →
        «Назад» приводит в меню дурака, а не на витрину;
     6) лист «Ещё»: «Звук» переключается и переживает перезагрузку,
        «Рейтинг» открывает рейтинг и закрывает лист, лист закрывается
        нажатием мимо и клавишей Esc;
     7) звук на витрине общий: выключенный там, он выключен и в шахматах,
        и в шашках (находка 10 сентября, починена в тот же вечер). И обратное:
        выключатель внутри шахмат глушит только шахматы — дурак и шашки
        звучат, а строка на витрине остаётся «вкл», пока звучит хоть одна игра;
     8) как в Telegram: настоящий скрипт telegram.org и «#tgWebAppData=…»
        в адресе. Верхняя строка спрятана, пункт «Настройки» открывает
        лист, стрелка «Назад» Telegram ведёт по сценарию ревьюера,
        окно тёмное (#101416). Нет связи с telegram.org — раздел
        пропускается с пометкой «не проверено», а не краснеет.

   На всём пути ловятся красные ошибки страницы и ответы сервера 400+.

   Запуск: node tests/витрина-пальцем-в-браузере.js
   Раздачу страниц поднимает сама на свободном порту. Выход 0 — провалов нет.
   ===================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

/* Боевую папку данных не трогаем даже случайно. */
process.env.GAMES_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'витрина-пальцем-'));

const КОРЕНЬ = path.join(__dirname, '..');
const робот = require(path.join(__dirname, 'браузер-робот.js'));

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg'
};

const ШИРИНЫ = [[360, 740], [390, 844], [430, 932]];
const ВСЕ_ИГРЫ = 'нарды,шахматы,дурак,шашки,домино,морской-бой,деберц';
const НАСТОЛЬНЫЕ = 'нарды,шахматы,шашки,домино,морской-бой';
const КАРТОЧНЫЕ = 'дурак,деберц';
const ВЫКЛЮЧЕННЫЕ = ['домино', 'морской-бой', 'деберц'];

/* Признаки Telegram в адресе: так настоящий клиент открывает мини-приложение.
   Подпись выдуманная — серверу её никто не показывает. */
const ХВОСТ_TELEGRAM = '#tgWebAppData=' + encodeURIComponent('query_id=AAH1&user=' +
  encodeURIComponent(JSON.stringify({ id: 424242, first_name: 'Tester' })) + '&auth_date=1757530000&hash=abc123') +
  '&tgWebAppVersion=7.10&tgWebAppPlatform=android&tgWebAppThemeParams=' +
  encodeURIComponent(JSON.stringify({ bg_color: '#ffffff', text_color: '#000000' }));

let проверок = 0;
const провалы = [];
const непроверено = [];

function проверить(условие, что) {
  проверок++;
  if (условие) { console.log('  ок      ' + что); return; }
  провалы.push(что);
  console.log('  ПРОВАЛ  ' + что);
}

const спать = (мс) => new Promise((готово) => setTimeout(готово, мс));

/** Раздача файлов проекта: браузер-робот не открывает диск напрямую. */
function поднятьРаздачу() {
  const сервер = http.createServer(function (запрос, ответ) {
    let путь = запрос.url.split('?')[0].split('#')[0];
    try { путь = decodeURIComponent(путь); } catch (ошибка) { /* оставим как есть */ }
    const файл = path.join(КОРЕНЬ, путь === '/' ? 'index.html' : путь.slice(1));
    /* Секреты и служебное не раздаём даже локально. */
    if (файл.indexOf(path.join(КОРЕНЬ, 'bot')) === 0 || /[\\/]\./.test(файл.slice(КОРЕНЬ.length))) {
      ответ.writeHead(403); ответ.end('нельзя'); return;
    }
    fs.readFile(файл, function (беда, тело) {
      if (беда) { ответ.writeHead(404); ответ.end('нет такого файла'); return; }
      ответ.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'text/plain' });
      ответ.end(тело);
    });
  });
  return new Promise((готово) => сервер.listen(0, '127.0.0.1', () => готово(сервер)));
}

function видимыйЭкран(страница) {
  return страница.evaluate(function () {
    return Array.from(document.querySelectorAll('.экран.экран--виден')).map(function (э) { return э.id; }).join(',');
  });
}

function путьСтраницы(страница) {
  try { return decodeURIComponent(new URL(страница.url()).pathname); } catch (е) { return страница.url(); }
}

/** Видимые плитки витрины по порядку — по настоящему оформлению, а не по классу. */
function видимыеПлитки(страница) {
  return страница.evaluate(function () {
    return Array.from(document.querySelectorAll('#экран-витрины .плитка-игры')).filter(function (п) {
      const р = п.getBoundingClientRect();
      return getComputedStyle(п).display !== 'none' && р.width > 0 && р.height > 0;
    }).map(function (п) { return п.getAttribute('data-игра'); }).join(',');
  });
}

function выключены(страница) {
  return страница.evaluate(function (имена) {
    return имена.every(function (и) {
      const п = document.querySelector('[data-игра="' + и + '"]');
      return Boolean(п) && п.disabled;
    });
  }, ВЫКЛЮЧЕННЫЕ);
}

/** Мерка вёрстки витрины: прокрутка вбок, выезд за край, мелкие живые кнопки. */
function меркаВёрстки(страница) {
  return страница.evaluate(function () {
    const ширина = document.documentElement.clientWidth;
    const видим = function (у) {
      const с = getComputedStyle(у); const р = у.getBoundingClientRect();
      return с.display !== 'none' && с.visibility !== 'hidden' && р.width > 0 && р.height > 0 && !у.closest('.скрыт');
    };
    const имя = function (у) { return (у.id || у.getAttribute('data-игра') || у.getAttribute('data-фильтр') || у.className || у.tagName).toString().slice(0, 40); };
    const заКраем = Array.from(document.querySelectorAll('#экран-витрины *')).filter(видим).filter(function (у) {
      const р = у.getBoundingClientRect(); return р.right > ширина + 0.5 || р.left < -0.5;
    }).map(имя);
    const мелкие = Array.from(document.querySelectorAll('#экран-витрины button')).filter(видим).filter(function (у) {
      if (у.disabled) return false;
      const р = у.getBoundingClientRect(); return р.width < 44 || р.height < 44;
    }).map(function (у) { const р = у.getBoundingClientRect(); return имя(у) + ' ' + Math.round(р.width) + '×' + Math.round(р.height); });
    return { вбок: document.documentElement.scrollWidth - ширина, заКраем: заКраем, мелкие: мелкие };
  });
}

(async function () {
  console.log('=== Витрина пальцем в настоящем браузере ===\n');

  const раздача = await поднятьРаздачу();
  const корень = 'http://127.0.0.1:' + раздача.address().port;
  const витрина = корень + '/index.html';

  const браузер = await робот.chromium.launch();
  let сбой = null;

  /* Красные ошибки и плохие ответы копим за всё время: поломка на пути
     туда-обратно так же важна, как на самой витрине. */
  const красные = [];
  const плохиеОтветы = [];
  const картинкиПлиток = new Set();

  async function новоеОкно(ширина, высота, сTelegram) {
    const место = await браузер.newContext({ viewport: { width: ширина, height: высота }, hasTouch: true });
    const страница = await место.newPage();
    if (!сTelegram) await робот.безTelegram(страница);
    страница.on('pageerror', function (беда) { красные.push('ошибка страницы: ' + беда.message); });
    страница.on('console', function (запись) {
      if (запись.type() !== 'error') return;
      const откуда = (запись.location && запись.location() && запись.location().url) || '';
      /* Отказ загрузки telegram-web-app.js в обычных окнах — наших рук дело:
         стенд сам его не пускает. Всё остальное — настоящая красная строка. */
      if (!сTelegram && /telegram-web-app\.js/.test(запись.text() + ' ' + откуда)) return;
      красные.push('консоль: ' + запись.text() + (откуда ? ' [' + откуда + ']' : ''));
    });
    страница.on('response', function (ответ) {
      let адрес = ответ.url();
      try { адрес = decodeURIComponent(адрес); } catch (е) { /* как есть */ }
      if (адрес.indexOf('/img/витрина/') !== -1 && ответ.status() === 200) картинкиПлиток.add(адрес.split('/').pop());
      if (ответ.status() >= 400 && адрес.indexOf('telegram.org') === -1) плохиеОтветы.push(ответ.status() + ' ' + адрес.replace(корень, ''));
    });
    return страница;
  }

  try {
    /* ---------------- 1. Три телефона ---------------- */
    console.log('1. Вёрстка на трёх телефонах');
    for (const [ш, в] of ШИРИНЫ) {
      const стр = await новоеОкно(ш, в, false);
      картинкиПлиток.clear();
      await стр.goto(витрина, { waitUntil: 'load' });
      await спать(500);
      const м = await меркаВёрстки(стр);
      проверить(м.вбок <= 0, ш + '×' + в + ': прокрутки вбок нет' + (м.вбок > 0 ? ' (лишних ' + м.вбок + ' точек)' : ''));
      проверить(м.заКраем.length === 0, ш + '×' + в + ': за край ничего не вылезло' + (м.заКраем.length ? ': ' + м.заКраем.join(', ') : ''));
      проверить(м.мелкие.length === 0, ш + '×' + в + ': всё живое нажимаемое не меньше 44×44' + (м.мелкие.length ? ': ' + м.мелкие.join(', ') : ''));
      проверить(картинкиПлиток.size === 7, ш + '×' + в + ': пришли все 7 картинок плиток (пришло ' + картинкиПлиток.size + ')');
      await стр.context().close();
    }

    const стр = await новоеОкно(390, 844, false);
    await стр.goto(витрина, { waitUntil: 'load' });
    await спать(500);

    /* ---------------- 2. Фильтры ---------------- */
    console.log('2. Фильтры');
    await стр.click('[data-фильтр="настольные"]');
    проверить(await видимыеПлитки(стр) === НАСТОЛЬНЫЕ, '«Настольные»: ' + await видимыеПлитки(стр));
    await стр.click('[data-фильтр="карточные"]');
    проверить(await видимыеПлитки(стр) === КАРТОЧНЫЕ, '«Карточные»: ' + await видимыеПлитки(стр));
    await стр.click('[data-фильтр="все"]');
    проверить(await видимыеПлитки(стр) === ВСЕ_ИГРЫ, '«Все»: снова семь по порядку');
    проверить(await выключены(стр), 'после всех фильтров домино, морской бой и деберц по-прежнему выключены');

    /* ---------------- 3. Выключенные плитки ---------------- */
    console.log('3. Нажатие в выключенные плитки');
    for (const игра of ВЫКЛЮЧЕННЫЕ) {
      /* Щелчок по месту на экране, а не по элементу: робот сам отказался бы
         жать выключенную кнопку, а палец не спрашивает. Бьём и в середину
         плитки, и в пилюлю «скоро» — туда попадают чаще всего. */
      for (const куда of ['[data-игра="' + игра + '"]', '[data-игра="' + игра + '"] .плитка-игры__пометка']) {
        const р = await стр.locator(куда).boundingBox();
        if (р) await стр.mouse.click(р.x + р.width / 2, р.y + р.height / 2);
      }
      await спать(300);
      проверить(путьСтраницы(стр) === '/index.html' && await видимыйЭкран(стр) === 'экран-витрины',
        '«' + игра + '» не реагирует: остались на витрине');
    }

    /* ---------------- 4. Дороги туда и обратно ---------------- */
    console.log('4. Игры открываются, назад — на витрину');
    for (const [игра, страница] of [['нарды', '/нарды.html'], ['шахматы', '/шахматы.html'], ['шашки', '/шашки.html']]) {
      await стр.click('#кнопка-игра-' + игра);
      await стр.waitForLoadState('load');
      await спать(500);
      проверить(путьСтраницы(стр) === страница, '«' + игра + '» открыли ' + путьСтраницы(стр));
      await стр.click('#кнопка-назад');
      await стр.waitForLoadState('load');
      await спать(500);
      проверить(путьСтраницы(стр) === '/index.html' && await видимыйЭкран(стр) === 'экран-витрины',
        игра + ': кнопка «К выбору игры» вернула на витрину');
      await стр.click('#кнопка-игра-' + игра);
      await стр.waitForLoadState('load');
      await спать(500);
      await стр.goBack({ waitUntil: 'load' });
      await спать(500);
      проверить(путьСтраницы(стр) === '/index.html' && await видимыйЭкран(стр) === 'экран-витрины',
        игра + ': возврат браузера вернул на витрину');
    }
    await стр.click('#кнопка-игра-дурак');
    await спать(300);
    проверить(await видимыйЭкран(стр) === 'экран-меню', '«Дурак» открыл меню дурака');
    await стр.click('#кнопка-меню-назад');
    await спать(300);
    проверить(await видимыйЭкран(стр) === 'экран-витрины', 'дурак: кнопка «К выбору игры» вернула на витрину');

    /* ---------------- 5. Профиль и сценарий ревьюера ---------------- */
    console.log('5. «Профиль», серия дней, сценарий ревьюера');
    /* Вчерашний день в серии: строка серии обязана появиться («сыграйте сегодня»). */
    await стр.evaluate(function () {
      const с = new Date();
      const сегодня = Math.floor((Date.UTC(с.getFullYear(), с.getMonth(), с.getDate()) - Date.UTC(2020, 0, 1)) / 86400000);
      localStorage.setItem('days_streak', JSON.stringify({ версия: 1, день: сегодня - 1, серия: 3, лучшая: 5 }));
    });
    await стр.click('#кнопка-вкладка-профиль');
    await спать(600);
    проверить(await видимыйЭкран(стр) === 'экран-рейтинга-игроков', '«Профиль» открыл экран рейтинга');
    const серия = await стр.evaluate(function () {
      const у = document.getElementById('серия-дней');
      return у && !у.classList.contains('скрыт') && у.getBoundingClientRect().height > 0 ? у.textContent.trim() : '';
    });
    проверить(/серию из 3/.test(серия), 'на рейтинге видна серия дней: «' + серия + '»');
    await стр.click('#кнопка-рейтинг-игроков-назад');
    await спать(300);
    проверить(await видимыйЭкран(стр) === 'экран-витрины', '«Назад» с рейтинга — на витрину');
    await стр.click('#кнопка-игра-дурак');
    await спать(300);
    await стр.click('#кнопка-с-другом');
    await спать(500);
    проверить(await видимыйЭкран(стр) === 'экран-друга', '«Играть с другом» открыл экран друга');
    await стр.click('#кнопка-друг-назад');
    await спать(300);
    проверить(await видимыйЭкран(стр) === 'экран-меню', 'сценарий ревьюера: «Назад» с экрана друга — меню дурака, а не витрина');
    await стр.click('#кнопка-меню-назад');
    await спать(300);
    await стр.evaluate(function () { localStorage.removeItem('days_streak'); });

    /* ---------------- 6. Лист «Ещё» ---------------- */
    console.log('6. Лист «Ещё»');
    const листОткрыт = () => стр.evaluate(function () { return !document.getElementById('лист-ещё').classList.contains('скрыт'); });
    const словоЗвука = () => стр.evaluate(function () { return document.getElementById('лист-звук-состояние').textContent.trim(); });
    await стр.click('#кнопка-витрина-ещё');
    await спать(300);
    проверить(await листОткрыт(), '«⋯» открыл лист');
    const былоСлово = await словоЗвука();
    await стр.click('#кнопка-лист-звук');
    await спать(200);
    const сталоСлово = await словоЗвука();
    проверить(былоСлово !== сталоСлово && /^(вкл|выкл)$/.test(сталоСлово), '«Звук» переключился: ' + былоСлово + ' → ' + сталоСлово);
    await стр.reload({ waitUntil: 'load' });
    await спать(500);
    await стр.click('#кнопка-витрина-ещё');
    await спать(300);
    проверить(await словоЗвука() === сталоСлово, 'после перезагрузки звук остался «' + сталоСлово + '»');
    await стр.keyboard.press('Escape');
    await спать(200);
    проверить(!(await листОткрыт()), 'Esc закрыл лист');
    await стр.click('#кнопка-витрина-ещё');
    await спать(300);
    await стр.mouse.click(195, 150);   // по затемнению над листом
    await спать(300);
    проверить(!(await листОткрыт()) && await видимыйЭкран(стр) === 'экран-витрины', 'нажатие мимо листа закрыло его и никуда не увело');
    await стр.click('#кнопка-витрина-ещё');
    await спать(300);
    await стр.click('#кнопка-лист-рейтинг');
    await спать(500);
    проверить(await видимыйЭкран(стр) === 'экран-рейтинга-игроков' && !(await листОткрыт()), '«Рейтинг» открыл рейтинг и закрыл лист');
    const подписьРейтинга = await стр.evaluate(function () {
      const у = document.getElementById('кнопка-лист-рейтинг');
      return у ? у.textContent.trim() : '(пункта нет)';
    });
    проверить(подписьРейтинга === 'Рейтинг', 'пункт листа подписан «Рейтинг» (подпись: «' + подписьРейтинга + '»)');
    await стр.click('#кнопка-рейтинг-игроков-назад');
    await спать(300);

    /* ---------------- 7. Звук с витрины — во всех играх ---------------- */
    console.log('7. Звук, выключенный на витрине, выключен и в других играх');
    /* Выключаем звук так, как это сделает человек: лист «Ещё» → «Звук». */
    async function поставитьЗвук(нужно) {
      await стр.click('#кнопка-витрина-ещё');
      await спать(300);
      if (await словоЗвука() !== нужно) await стр.click('#кнопка-лист-звук');
      await спать(200);
      const стало = await словоЗвука();
      await стр.click('#кнопка-лист-закрыть');
      await спать(300);
      return стало;
    }
    const наВитрине = await поставитьЗвук('выкл');
    for (const [игра, дверь] of [['шахматы', 'ШахматыЗвук'], ['шашки', 'ШашкиЗвук']]) {
      await стр.click('#кнопка-игра-' + игра);
      await стр.waitForLoadState('load');
      await спать(500);
      const включён = await стр.evaluate(function (имя) {
        return window[имя] && typeof window[имя].включён === 'function' ? window[имя].включён() : null;
      }, дверь);
      проверить(наВитрине === 'выкл' && включён === false,
        'на витрине звук «' + наВитрине + '», а ' + игра + ' считают его ' + (включён === null ? '(двери звука нет)' : (включён ? 'ВКЛЮЧЁННЫМ' : 'выключенным')));
      await стр.click('#кнопка-назад');
      await стр.waitForLoadState('load');
      await спать(400);
    }
    /* Обратная сторона: всем включили звук с витрины, потом человек
       выключил его ВНУТРИ шахмат. Это выключатель только шахмат: дурак
       и шашки звучат, строка на витрине остаётся «вкл». */
    console.log('7б. Обратное: выключатель внутри шахмат глушит только шахматы');
    проверить(await поставитьЗвук('вкл') === 'вкл', 'с витрины звук снова включён всем');
    await стр.click('#кнопка-игра-шахматы');
    await стр.waitForLoadState('load');
    await спать(500);
    const шахматыДо = await стр.evaluate(function () { return window.ШахматыЗвук ? window.ШахматыЗвук.включён() : null; });
    await стр.click('#кнопка-звук');
    await спать(200);
    const шахматыПосле = await стр.evaluate(function () { return window.ШахматыЗвук ? window.ШахматыЗвук.включён() : null; });
    проверить(шахматыДо === true && шахматыПосле === false, 'кнопка «Звук» в шахматах выключила шахматы (было ' + шахматыДо + ', стало ' + шахматыПосле + ')');
    await стр.click('#кнопка-назад');
    await стр.waitForLoadState('load');
    await спать(400);
    await стр.click('#кнопка-витрина-ещё');
    await спать(300);
    const послеШахмат = await стр.evaluate(function () {
      /* «звукВключён» объявлен в js/game.js через let: на window его нет,
         но из страницы он виден по имени. */
      return { слово: document.getElementById('лист-звук-состояние').textContent.trim(), дурак: typeof звукВключён === 'boolean' ? звукВключён : null };
    });
    проверить(послеШахмат.слово === 'вкл', 'на витрине строка «Звук» — «вкл»: дурак и шашки ещё звучат (строка: «' + послеШахмат.слово + '»)');
    проверить(послеШахмат.дурак === true, 'дурак звучит — шахматный выключатель его не тронул');
    await стр.click('#кнопка-лист-закрыть');
    await спать(300);
    await стр.click('#кнопка-игра-шашки');
    await стр.waitForLoadState('load');
    await спать(500);
    const шашкиЗвучат = await стр.evaluate(function () { return window.ШашкиЗвук ? window.ШашкиЗвук.включён() : null; });
    проверить(шашкиЗвучат === true, 'шашки звучат — шахматный выключатель их не тронул');
    await стр.click('#кнопка-назад');
    await стр.waitForLoadState('load');
    await спать(400);
    await стр.context().close();

    /* ---------------- 8. Как в Telegram ---------------- */
    console.log('8. Как в Telegram (настоящий скрипт telegram.org и #tgWebAppData)');
    const тг = await новоеОкно(390, 844, true);
    await тг.goto(витрина + ХВОСТ_TELEGRAM, { waitUntil: 'load' });
    await спать(1500);
    const естьСкрипт = await тг.evaluate(function () {
      return Boolean(window.Telegram && window.Telegram.WebApp && window.Telegram.WebView &&
        typeof window.Telegram.WebView.receiveEvent === 'function' && window.Telegram.WebApp.version === '7.10');
    });
    if (!естьСкрипт) {
      непроверено.push('раздел 8 (как в Telegram): скрипт telegram.org не загрузился — нет связи или его заблокировали');
      console.log('  НЕ ПРОВЕРЕНО: скрипт telegram.org не загрузился');
    } else {
      const сост = () => тг.evaluate(function () {
        const в = window.Telegram.WebApp;
        return {
          класс: document.documentElement.classList.contains('в-телеграме'),
          строка: getComputedStyle(document.querySelector('.витрина__панель')).display,
          экран: Array.from(document.querySelectorAll('.экран.экран--виден')).map(function (э) { return э.id; }).join(','),
          стрелка: в.BackButton.isVisible, настройки: в.SettingsButton.isVisible,
          шапка: в.headerColor, фон: в.backgroundColor, полоса: в.bottomBarColor,
          лист: !document.getElementById('лист-ещё').classList.contains('скрыт')
        };
      });
      const нажатьВTelegram = (событие) => тг.evaluate(function (имя) { window.Telegram.WebView.receiveEvent(имя, {}); }, событие);
      let с = await сост();
      проверить(с.класс && с.строка === 'none', 'на <html> класс «в-телеграме», верхняя строка спрятана');
      проверить(с.настройки && !с.стрелка, 'на витрине пункт «Настройки» показан, стрелки нет');
      проверить(с.шапка === '#101416' && с.фон === '#101416' && с.полоса === '#101416', 'шапка, фон и полоса окна — #101416');
      await нажатьВTelegram('settings_button_pressed');
      await спать(300);
      проверить((await сост()).лист, '«Настройки» в меню Telegram открыл лист «Ещё»');
      await тг.click('#кнопка-лист-закрыть');
      await спать(300);
      await тг.click('#кнопка-вкладка-профиль');
      await спать(500);
      с = await сост();
      проверить(с.экран === 'экран-рейтинга-игроков' && с.стрелка && !с.настройки, 'на рейтинге стрелка Telegram есть, «Настройки» нет');
      await тг.click('#кнопка-рейтинг-игроков-назад');
      await спать(300);
      await тг.click('#кнопка-игра-дурак');
      await спать(300);
      await тг.click('#кнопка-с-другом');
      await спать(500);
      await нажатьВTelegram('back_button_pressed');
      await спать(400);
      проверить((await сост()).экран === 'экран-меню', 'сценарий ревьюера: стрелка Telegram с экрана друга — в меню дурака');
      await нажатьВTelegram('back_button_pressed');
      await спать(400);
      с = await сост();
      проверить(с.экран === 'экран-витрины' && !с.стрелка && с.настройки, 'стрелка из меню дурака — на витрину, стрелка спряталась, «Настройки» вернулись');
      await тг.click('#кнопка-игра-нарды');
      await тг.waitForLoadState('load');
      await спать(800);
      await нажатьВTelegram('back_button_pressed');
      await тг.waitForLoadState('load');
      await спать(1200);
      с = await сост();
      проверить(путьСтраницы(тг) === '/index.html' && с.экран === 'экран-витрины' && с.класс && с.строка === 'none',
        'из нард стрелкой Telegram — на витрину, и верхняя строка не вернулась (решётки в адресе уже нет)');
    }
    await тг.context().close();
  } catch (беда) {
    сбой = беда;
  }

  await браузер.close();
  раздача.close();

  console.log('\n9. Ошибки на всём пути');
  проверить(красные.length === 0, 'красных ошибок нет' + (красные.length ? ': ' + красные.slice(0, 5).join(' | ') : ''));
  проверить(плохиеОтветы.length === 0, 'ответов 400+ нет' + (плохиеОтветы.length ? ': ' + плохиеОтветы.slice(0, 5).join(' | ') : ''));

  console.log('\n----------------------------------------');
  if (сбой) console.log('ОБОРВАЛОСЬ: ' + сбой.stack);
  console.log('Проверок сделано: ' + проверок);
  console.log('ПРОВАЛОВ: ' + провалы.length);
  провалы.forEach(function (что) { console.log('  · ' + что); });
  if (непроверено.length) {
    console.log('НЕ ПРОВЕРЕНО: ' + непроверено.length);
    непроверено.forEach(function (что) { console.log('  · ' + что); });
  }
  process.exit(провалы.length === 0 && !сбой ? 0 : 1);
})();
