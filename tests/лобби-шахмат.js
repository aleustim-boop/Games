'use strict';
/* =====================================================================
   ПРОВЕРКА НОВОГО ЛОББИ ШАХМАТ (не закоммичено на момент проверки).

   Что здесь проверяется: восемь сценариев работы лобби (открытие,
   запасной путь при отсутствии файла лобби, элементы на месте, сохранение
   выбора, переходы на доску), возврат в меню, возврат в лобби из листа
   во время партии, и что фон страницы берётся из CSS переменной --сб-фон.

   Запуск (стенд уже поднят, например tests/локальный-сервер.js 8797):
       node tests/лобби-шахмат.js          порт 8080
       node tests/лобби-шахмат.js 8797     другой порт

   Написано тестировщиком, живёт в tests/, игру не трогает.
   ===================================================================== */

const { chromium, подготовитьПодделку, безTelegram, перехватить } = require('./браузер-робот.js');

const ПОРТ = Number(process.argv[2]) || 8080;
const АДРЕС = 'http://127.0.0.1:' + ПОРТ + '/шахматы.html';
const СЛОМАТЬ = process.argv.includes('--сломать');

let провалов = 0;
let всегоПроверок = 0;
function проверить(условие, слова) {
  всегоПроверок++;
  if (условие) console.log('  ок   — ' + слова);
  else { провалов++; console.log('  ПЛОХО— ' + слова); }
}

(async () => {
  const браузер = await chromium.launch();

  /* -------- 1. Лобби видно при входе -------- */
  console.log('\n=== 1. Лобби видно при входе на страницу ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    // При ломающем запуске сломаем id экрана-лобби и CSS переменную фона
    if (СЛОМАТЬ) {
      await страница.evaluate(() => {
        const лобби = document.getElementById('экран-лобби');
        if (лобби) лобби.id = 'экран-лобби-сломан';
        // Портим CSS переменную, чтобы упал сценарий 8 (проверка фона)
        document.documentElement.style.setProperty('--сб-фон', 'rgb(255, 0, 0)');
      });
    }

    const стартовыйЭкран = await страница.evaluate(() => {
      const лобби = document.getElementById('экран-лобби');
      const доска = document.getElementById('экран-шахмат');
      return {
        лоббиВиден: Boolean(лобби && лобби.classList.contains('экран--виден')),
        доскаВиден: Boolean(доска && доска.classList.contains('экран--виден'))
      };
    });
    проверить(стартовыйЭкран.лоббиВиден && !стартовыйЭкран.доскаВиден,
      'страница открылась на лобби, а не на старой доске');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* -------- 2. Запасной путь: js/шахматы-лобби.js не доехал -------- */
  console.log('\n=== 2. Запасной путь — файл js/шахматы-лобби.js заблокирован ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await безTelegram(страница);
    await перехватить(страница, 'шахматы-лобби.js', (путь) => путь.abort());
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    const экраны = await страница.evaluate(() => {
      const лобби = document.getElementById('экран-лобби');
      const доска = document.getElementById('экран-шахмат');
      return {
        лоббиВиден: Boolean(лобби && лобби.classList.contains('экран--виден')),
        доскаВиден: Boolean(доска && доска.classList.contains('экран--виден'))
      };
    });
    проверить(!экраны.лоббиВиден && экраны.доскаВиден,
      'без js/шахматы-лобби.js страница открылась на прежней доске');

    // Старый путь должен работать: «Играть вдвоём» на доске
    await страница.click('#кнопка-вдвоём');
    await страница.waitForTimeout(300);
    const доскаВиден = await страница.evaluate(() => {
      const доска = document.getElementById('экран-шахмат');
      return Boolean(доска && доска.classList.contains('экран--виден'));
    });
    проверить(доскаВиден, 'кнопка «Играть вдвоём» на доске работает (партия начинается)');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* -------- 3. Проверяем элементы лобби -------- */
  console.log('\n=== 3. Лобби содержит нужные элементы ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    const элементы = await страница.evaluate(() => {
      return {
        лоббиВиден: document.getElementById('экран-лобби')?.classList.contains('экран--виден') || false,
        серияТекст: document.getElementById('лобби-серия-текст')?.textContent?.trim() || '',
        уровеньЛёгкий: !!document.getElementById('лобби-уровень-лёгкий'),
        уровеньОбычный: !!document.getElementById('лобби-уровень-обычный'),
        уровеньСложный: !!document.getElementById('лобби-уровень-сложный'),
        кнопкаБоты: !!document.getElementById('лобби-боты'),
        кнопкаВдвоём: !!document.getElementById('лобби-вдвоём'),
        кнопкаОнлайн: !!document.getElementById('лобби-онлайн'),
        кнопкаОнлайнВключена: !document.getElementById('лобби-онлайн')?.disabled || false,
        нижниеВкладки: !!document.querySelector('[data-вкладки="лобби-шахмат"]')
      };
    });

    проверить(элементы.лоббиВиден, 'лобби видно при входе');
    проверить(элементы.серияТекст.length > 0, 'серия из памяти показана: «' + элементы.серияТекст + '»');
    проверить(элементы.уровеньЛёгкий, 'кнопка уровня «Лёгкий» на месте');
    проверить(элементы.уровеньОбычный, 'кнопка уровня «Обычный» на месте');
    проверить(элементы.уровеньСложный, 'кнопка уровня «Сложный» на месте');
    проверить(элементы.кнопкаБоты, 'кнопка «Играть с ботом» на месте');
    проверить(элементы.кнопкаВдвоём, 'кнопка «Вдвоём на этом устройстве» на месте');
    проверить(элементы.кнопкаОнлайн, 'кнопка «Играть онлайн» на месте');
    проверить(!элементы.кнопкаОнлайнВключена, 'кнопка «Онлайн» отключена (disabled)');
    проверить(элементы.нижниеВкладки, 'нижние вкладки набор «лобби-шахмат» подключены');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* -------- 4. Выбор сложности сохраняется -------- */
  console.log('\n=== 4. Выбор сложности переживает перезагрузку ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    // Выбираем сложный уровень
    await страница.evaluate(() => {
      const кнопка = document.getElementById('лобби-уровень-сложный');
      if (кнопка) кнопка.click();
    });
    await страница.waitForTimeout(200);

    const выбранОдно = await страница.evaluate(() => {
      const кнопка = document.getElementById('лобби-уровень-сложный');
      return кнопка?.classList.contains('переключатель__вариант--выбран') || false;
    });
    проверить(выбранОдно, 'кнопка «Сложный» помечена как выбранная после клика');

    // Перезагружаемся
    await страница.reload({ waitUntil: 'networkidle' });
    await страница.waitForTimeout(400);

    const выбранДва = await страница.evaluate(() => {
      const кнопка = document.getElementById('лобби-уровень-сложный');
      return кнопка?.classList.contains('переключатель__вариант--выбран') || false;
    });
    проверить(выбранДва, 'выбор сложности переживает перезагрузку: «Сложный» остался выбран');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* -------- 5. Кнопки переходят на доску -------- */
  console.log('\n=== 5. Кнопки входов открывают доску ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    // Нажимаем «Вдвоём»
    await страница.evaluate(() => {
      const кнопка = document.getElementById('лобби-вдвоём');
      if (кнопка) кнопка.click();
    });
    await страница.waitForTimeout(300);

    const доскаВиден = await страница.evaluate(() => {
      const доска = document.getElementById('экран-шахмат');
      const лобби = document.getElementById('экран-лобби');
      return {
        доска: Boolean(доска && доска.classList.contains('экран--виден')),
        лобби: Boolean(лобби && лобби.classList.contains('экран--виден'))
      };
    });
    проверить(доскаВиден.доска && !доскаВиден.лобби, '«Вдвоём» открывает доску и прячет лобби');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* -------- 6. Кнопка назад с лобби ведёт на витрину -------- */
  console.log('\n=== 6. Кнопка назад ведёт на витрину ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    // Нажимаем кнопку назад
    await страница.evaluate(() => {
      const кнопка = document.getElementById('кнопка-лобби-назад');
      if (кнопка) кнопка.click();
    });
    await страница.waitForTimeout(400);

    const адрес = страница.url();
    проверить(адрес.includes('index.html') || адрес === 'http://127.0.0.1:' + ПОРТ + '/',
      'кнопка назад ведёт на витрину (index.html), адрес: ' + адрес);

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* -------- 7. «В меню» из листа с доски возвращает в лобби -------- */
  console.log('\n=== 7. «В меню» из листа с доски возвращает в лобби ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    // Входим на доску
    await страница.evaluate(() => {
      const кнопка = document.getElementById('лобби-боты');
      if (кнопка) кнопка.click();
    });
    await страница.waitForTimeout(300);

    // Открываем лист
    await страница.evaluate(() => {
      const кнопка = document.getElementById('кнопка-игра-ещё');
      if (кнопка) кнопка.click();
    });
    await страница.waitForTimeout(200);

    // Кликаем «В меню»
    const пункт = await страница.evaluate(() => {
      const пункты = Array.from(document.querySelectorAll('#лист-игры button'));
      const меню = пункты.find((п) => /В меню|в меню/i.test(п.textContent));
      if (меню) меню.click();
      return !!меню;
    });
    await страница.waitForTimeout(400);

    const кудаУвело = await страница.evaluate(() => {
      const лобби = document.getElementById('экран-лобби');
      const доска = document.getElementById('экран-шахмат');
      return {
        лоббиВиден: Boolean(лобби && лобби.classList.contains('экран--виден')),
        доскаВиден: Boolean(доска && доска.classList.contains('экран--виден'))
      };
    });

    проверить(пункт, 'пункт «В меню» найден и нажат');
    проверить(кудаУвело.лоббиВиден && !кудаУвело.доскаВиден,
      '«В меню» из листа во время партии вернул в лобби');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  /* -------- 8. Фон страницы тёмный -------- */
  console.log('\n=== 8. Фон страницы тёмный из CSS переменной ===');
  {
    const окно = await браузер.newContext({ viewport: { width: 390, height: 844 } });
    const страница = await окно.newPage();
    const ошибки = [];
    страница.on('pageerror', (о) => ошибки.push('исключение: ' + о.message));
    страница.on('console', (с) => {
      if (с.type() === 'error' && /Failed to load resource/.test(с.text())) return;
      if (с.type() === 'error') ошибки.push('консоль: ' + с.text());
    });
    await подготовитьПодделку(страница, { версия: '7.10' });
    await страница.goto(АДРЕС);
    await страница.waitForTimeout(400);

    // При ломающем запуске портим backgroundColor элемента напрямую, чтобы он не совпадал с переменной
    if (СЛОМАТЬ) {
      await страница.evaluate(() => {
        const приложение = document.getElementById('приложение');
        if (приложение) приложение.style.backgroundColor = 'rgb(255, 0, 0)';
      });
    }

    const вид = await страница.evaluate(() => {
      const приложение = document.getElementById('приложение');
      const фонПриложения = getComputedStyle(приложение).backgroundColor;

      // Создаём временный div с background: var(--сб-фон) и получаем вычисленный цвет
      const тестовыйDiv = document.createElement('div');
      тестовыйDiv.style.background = 'var(--сб-фон)';
      document.body.appendChild(тестовыйDiv);
      const фонИзПеременной = getComputedStyle(тестовыйDiv).backgroundColor;
      document.body.removeChild(тестовыйDiv);

      return {
        фонПриложения: фонПриложения,
        фонИзПеременной: фонИзПеременной,
        совпадают: фонПриложения === фонИзПеременной
      };
    });
    console.log('  фон #приложение: ' + вид.фонПриложения + ', фон из переменной --сб-фон: ' + вид.фонИзПеременной);
    проверить(вид.совпадают,
      'фон #приложение совпадает с значением переменной --сб-фон');

    проверить(ошибки.length === 0, 'красных ошибок в консоли нет' +
      (ошибки.length ? ' — а они есть: ' + ошибки.join(' | ') : ''));
    await окно.close();
  }

  await браузер.close();
  console.log('\nИтого проверок: ' + всегоПроверок + ', провалов: ' + провалов);
  process.exit(провалов === 0 ? 0 : 1);
})().catch((ошибка) => { console.error('проверка сломалась:', ошибка); process.exit(2); });
