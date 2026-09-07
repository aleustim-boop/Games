/* =====================================================================
   Экран «Как играть» — живой прогон.
     1) кнопка в ряду на 320: два ряда, доска не уменьшилась;
     2) текст влезает в 360×640 без прокрутки (на 320 — сколько влезло);
     3) открыли посреди партии, закрыли — позиция и очередь хода те же;
     4) подписи полей переключаются с экрана правил и помнятся;
     5) стрелка «Назад» Telegram закрывает правила первым нажатием.
   ===================================================================== */

const { chromium, подготовитьПодделку } = require('./браузер-робот.js');
const ПОРТ = Number(process.argv[2]) || 8080;    // страничный сервер уже поднят
const АДРЕС = 'http://127.0.0.1:' + ПОРТ + '/шашки.html';
const ПАПКА = require('path').join(__dirname, 'скриншоты') + '/';

let провалов = 0;
function проверить(условие, слова) {
  console.log((условие ? '  ок   — ' : '  ПЛОХО— ') + слова);
  if (!условие) провалов++;
}

/** Слепок доски: где какие шашки, чей ход, что поднято. */
const слепок = (страница) => страница.evaluate(() => ({
  шашки: Array.from(document.querySelectorAll('.поле[data-поле]'))
    .map((к) => к.getAttribute('data-поле') + ':' + (к.querySelector('.фишка') ? к.querySelector('.фишка').className : '-'))
    .join('|'),
  строкаХода: document.getElementById('строка-хода').textContent,
  перевёрнута: document.getElementById('доска').classList.contains('доска-шашек--перевёрнута'),
  выбрано: document.querySelectorAll('.поле--выбрано').length
}));

async function тап(страница) {
  return страница.evaluate(() => {
    const случайный = (с) => с[Math.floor(Math.random() * с.length)];
    const куда = Array.from(document.querySelectorAll('.поле--можно, .поле--можно-бой'));
    if (куда.length) { случайный(куда).click(); return 'ход'; }
    const свои = Array.from(document.querySelectorAll('.фишка--может-ходить'));
    if (свои.length) { случайный(свои).parentElement.click(); return 'поднял'; }
    return 'нечего';
  });
}

(async () => {
  const браузер = await chromium.launch();

  console.log('\n=== 1–2. Кнопка в ряду и текст на экране ===');
  for (const р of [{ w: 320, h: 568 }, { w: 360, h: 640 }, { w: 390, h: 844 }]) {
    const окно = await браузер.newContext({ viewport: { width: р.w, height: р.h }, deviceScaleFactor: 2 });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push(о.message));
    страница.on('console', (с) => { if (с.type() === 'error') ошибки.push(с.text()); });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(250);

    const ряд = await страница.evaluate(() => {
      const имена = ['кнопка-с-ботом', 'кнопка-вдвоём', 'кнопка-звук', 'кнопка-как-играть', 'кнопка-рекорды', 'кнопка-назад'];
      const ряды = new Set();
      const кнопки = имена.map((имя) => {
        const у = document.getElementById(имя).getBoundingClientRect();
        ряды.add(Math.round(у.top));
        return имя.replace('кнопка-', '') + ' ' + Math.round(у.width) + '×' + Math.round(у.height) +
          (у.right <= window.innerWidth + 0.5 && у.bottom <= window.innerHeight + 0.5 && у.height >= 44 ? '' : ' ПЛОХО');
      });
      const метки = document.getElementById('кнопка-метки').getBoundingClientRect();
      return { рядов: ряды.size, кнопки, доска: Math.round(document.getElementById('доска').getBoundingClientRect().width),
        метокНетВРяду: метки.width === 0 };
    });
    console.log('  ' + р.w + '×' + р.h + ': рядов ' + ряд.рядов + ', доска ' + ряд.доска + '; ' + ряд.кнопки.join(', '));
    проверить(ряд.рядов === 2 && !ряд.кнопки.some((к) => /ПЛОХО/.test(к)), 'два ряда, все кнопки в окне и не ниже 44');
    проверить(ряд.доска >= (р.w === 320 ? 317 : р.w), 'доска не уменьшилась: ' + ряд.доска);
    проверить(ряд.метокНетВРяду, 'кнопка подписей полей с доски ушла (лежит на экране правил)');

    await страница.click('#кнопка-как-играть');
    await страница.waitForTimeout(200);
    const экран = await страница.evaluate(() => {
      const список = document.querySelector('#экран-правил .правила');
      const назад = document.getElementById('кнопка-правила-назад').getBoundingClientRect();
      const метки = document.getElementById('кнопка-метки').getBoundingClientRect();
      const правила = Array.from(список.querySelectorAll('.подпись'));
      const последнее = правила[правила.length - 1].getBoundingClientRect();
      return {
        открыт: window.ШашкиКакИграть.открыты(),
        доскаСкрыта: !document.getElementById('экран-шашек').classList.contains('экран--виден'),
        правил: правила.length,
        прокрутка: список.scrollHeight - список.clientHeight,
        последнееВидно: последнее.bottom <= список.getBoundingClientRect().bottom + 0.5,
        назадВОкне: назад.bottom <= window.innerHeight + 0.5 && назад.height >= 44,
        меткиВОкне: метки.bottom <= window.innerHeight + 0.5 && метки.height >= 44 && метки.top >= 0,
        страницаНеЕдет: document.documentElement.scrollHeight <= window.innerHeight + 1,
        знаков: правила.reduce((с, п) => с + п.textContent.length, 0)
      };
    });
    console.log('  экран правил: правил ' + экран.правил + ', знаков ' + экран.знаков + ', не влезло по высоте ' + экран.прокрутка + ' точек');
    проверить(экран.открыт && экран.доскаСкрыта, 'экран правил открылся, доска спрятана');
    проверить(экран.правил === 6, 'ровно шесть правил');
    if (р.w >= 360) proверитьВлезло(экран); else console.log('  (320×568: ' + (экран.прокрутка > 0 ? 'список прокручивается на ' + экран.прокрутка + ' точек — так и задумано' : 'влезло целиком') + ')');
    // Кнопка подписей полей лежит внутри списка: там, где список прокручивается,
    // до неё долистывают, и требовать её на экране сразу нельзя.
    const меткиКакНадо = экран.прокрутка > 0 ? true : экран.меткиВОкне;
    проверить(экран.назадВОкне && меткиКакНадо && экран.страницаНеЕдет,
      '«Назад к доске» в окне' + (экран.прокрутка > 0 ? '' : ', кнопка подписей полей видна и не ниже 44') + ', страница не едет');
    await страница.screenshot({ path: ПАПКА + 'как-играть-' + р.w + '.png' });
    проверить(ошибки.length === 0, 'красных ошибок нет' + (ошибки.length ? ': ' + ошибки.join(' | ') : ''));
    await окно.close();
  }
  function proверитьВлезло(экран) {
    проверить(экран.прокрутка <= 0 && экран.последнееВидно, 'все шесть правил видны без прокрутки');
  }

  console.log('\n=== 3. Правила посреди партии: позиция не сбрасывается ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 360, height: 640 } });
    const страница = await окно.newPage();
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(200);
    for (let i = 0; i < 6; i++) { await тап(страница); await страница.waitForTimeout(30); }   // три хода вдвоём
    await тап(страница); await страница.waitForTimeout(30);                                    // и поднятая шашка
    const до = await слепок(страница);
    await страница.click('#кнопка-как-играть');
    await страница.waitForTimeout(150);
    await страница.click('#кнопка-правила-назад');
    await страница.waitForTimeout(150);
    const после = await слепок(страница);
    const доскаВидна = await страница.evaluate(() => document.getElementById('экран-шашек').classList.contains('экран--виден'));
    console.log('  до: «' + до.строкаХода + '», поднято ' + до.выбрано + ', перевёрнута ' + до.перевёрнута);
    проверить(доскаВидна, 'после «Назад к доске» доска снова видна');
    проверить(до.шашки === после.шашки, 'все шашки на тех же полях');
    проверить(до.строкаХода === после.строкаХода && до.перевёрнута === после.перевёрнута && до.выбрано === после.выбрано,
      'очередь хода, поворот доски и поднятая шашка — те же');

    // Партия дальше играется
    const что = await тап(страница);
    await страница.waitForTimeout(50);
    const дальше = await слепок(страница);
    проверить(что !== 'нечего' && дальше.шашки !== после.шашки, 'после чтения правил партия продолжается тем же ходом');
    await окно.close();
  }

  console.log('\n=== 4. Подписи полей с экрана правил и память выбора ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 360, height: 640 } });
    const страница = await окно.newPage();
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(200);
    const сМетками = () => страница.evaluate(() => document.getElementById('доска').classList.contains('доска-шашек--с-метками'));
    проверить(await сМетками(), 'по умолчанию подписи полей показаны');
    await страница.click('#кнопка-как-играть');
    await страница.click('#кнопка-метки');
    const подпись = await страница.evaluate(() => document.getElementById('кнопка-метки').textContent);
    проверить(!(await сМетками()) && /нет$/.test(подпись), 'нажали на экране правил — подписи сняты, кнопка «…: нет»');
    await страница.reload();
    await страница.waitForTimeout(200);
    проверить(!(await сМетками()), 'после перезагрузки подписи по-прежнему сняты');
    проверить(await страница.evaluate(() => localStorage.getItem('шашки:метки')) === 'нет', 'в памяти «шашки:метки» = «нет»');
    await страница.click('#кнопка-как-играть');
    await страница.click('#кнопка-метки');
    проверить(await сМетками(), 'вернули подписи обратно');
    await окно.close();
  }

  console.log('\n=== 5. Стрелка «Назад» Telegram закрывает правила первой ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    await подготовитьПодделку(страница, { версия: '7.0' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(300);
    await страница.click('#кнопка-как-играть');
    проверить(await страница.evaluate(() => window.ШашкиКакИграть.открыты()), 'правила открыты');
    await страница.evaluate(() => window.ПоддельныйТелеграм.нажатьНазад());
    проверить(await страница.evaluate(() => !window.ШашкиКакИграть.открыты() &&
      document.getElementById('экран-шашек').classList.contains('экран--виден')), 'первое нажатие стрелки закрыло правила, доска на месте');
    await страница.evaluate(() => window.ПоддельныйТелеграм.нажатьНазад());
    await страница.waitForTimeout(400);
    проверить(/index\.html$/.test(страница.url()), 'второе нажатие увело на index.html');
    await окно.close();
  }

  await браузер.close();
  console.log('\n' + (провалов === 0 ? 'ВСЁ ЗЕЛЁНОЕ' : 'ПРОВАЛОВ: ' + провалов));
  process.exit(провалов === 0 ? 0 : 1);
})().catch((о) => { console.error('проверка сломалась:', о); process.exit(2); });
