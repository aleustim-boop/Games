'use strict';
const assert = require('node:assert/strict');
const path = require('path');
const { chromium, подготовитьПодделку, безTelegram } = require('./браузер-робот');
(async () => {
  const стенд = await require('./бастион-стенд')();
  const браузер = await chromium.launch({ headless: true });
  try {
    for (const язык of ['uk', 'en']) {
      const страница = await браузер.newPage({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
      await подготовитьПодделку(страница, { язык });
      await страница.route('https://igra.medart.com.ua/**', м => м.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
      const ошибки = [];
      страница.on('pageerror', е => ошибки.push(е.message));
      await страница.goto(стенд.url + '/index.html');
      await страница.waitForFunction(код => document.documentElement.lang === код, язык);
      assert.match(await страница.locator('#экран-витрины').innerText(), язык === 'en' ? /What shall we play/ : /У що зіграємо/);
      await страница.locator('[data-игра="дурак"]').click();
      await страница.getByRole('button', { name: язык === 'en' ? 'Play with bots' : 'Грати з ботами', exact: false }).click();
      assert.match(await страница.locator('#экран-путь-правила').innerText(), язык === 'en' ? /Choose your rules/ : /Як граємо/);
      await страница.locator('#экран-путь-правила [data-путь="далее"]').click();
      assert.match(await страница.locator('#экран-путь-игроки').innerText(), язык === 'en' ? /Including you/ : /Включно з вами/);
      await страница.locator('#экран-путь-игроки [data-путь="далее"]').click();
      assert.match(await страница.locator('#экран-путь-настройки').innerText(), язык === 'en' ? /2 players/ : /2 гравці/);
      await страница.locator('#путь-начать').click();
      await страница.waitForTimeout(500);
      const стол = await страница.locator('#экран-игры').innerText();
      assert.match(стол, язык === 'en' ? /End attack/ : /Бито/);
      if (язык === 'en') assert.doesNotMatch(стол, /[А-Яа-яЁё]/);
      assert.equal(await страница.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'нет горизонтальной прокрутки');
      await страница.screenshot({ path: path.join(__dirname, 'снимки', 'дурак-язык-' + язык + '.png') });
      if (язык === 'en') {
        const прогон = await страница.evaluate(async () => {
          clearTimeout(таймер);
          остановитьТаймерПросрочкиХода();
          const остатки = new Set();
          let ходов = 0;
          // Ускоренно играем настоящими правилами; после каждого хода проверяем
          // реальный текст стола. Это проверка перевода состояний, не качества бота.
          while (!партия.завершена && ходов++ < 1500) {
            const было = снимокДляРассказа();
            const кто = ктоХодит(партия);
            const что = ходБота(партия, кто, 'сложный');
            if (кто !== 'человек') показатьСобытие(рассказатьОХодеБота(было, кто, что), 1000);
            перерисовать();
            await Promise.resolve();
            for (const с of document.getElementById('экран-игры').innerText.split('\n')) if (/[А-Яа-яЁё]/.test(с)) остатки.add(с);
          }
          показатьРезультат();
          await Promise.resolve();
          for (const с of document.querySelector('.экран--виден')?.innerText.split('\n') || []) if (/[А-Яа-яЁё]/.test(с)) остатки.add(с);
          return { завершена: партия.завершена, остатки: [...остатки] };
        });
        assert.equal(прогон.завершена, true);
        assert.deepEqual(прогон.остатки, [], 'сообщения полной партии переведены');
      }
      assert.deepEqual(ошибки, []);
      await страница.goto(стенд.url + '/index.html');
      // Язык теперь выбирается строкой «Язык» в листе «⋯» витрины: она листает
      // по кругу, поэтому жмём, пока не придём к русскому (uk → en → ru, en → ru).
      // Внутри поддельного Telegram кнопка «⋯» спрятана (там пункт «Настройки»),
      // поэтому лист открываем той же функцией, что вешается на неё.
      await страница.evaluate(() => открытьЛистЕщё());
      assert.equal(await страница.locator('#экран-витрины .выбор-языка').count(), 0, 'старого поля над витриной нет');
      const строкаЯзыка = страница.locator('#кнопка-лист-язык');
      assert.equal(await строкаЯзыка.count(), 1, 'в листе витрины есть строка «Язык»');
      const названия = { uk: 'Українська', en: 'English', ru: 'Русский' };
      assert.equal((await страница.locator('#лист-язык-состояние').innerText()).trim(), названия[язык]);
      for (let нажатий = 0; нажатий < 3 && await страница.locator('html').getAttribute('lang') !== 'ru'; нажатий++) {
        await строкаЯзыка.click();
        assert.equal(await страница.locator('#лист-ещё').evaluate(у => у.classList.contains('скрыт')), false, 'лист не закрылся');
      }
      assert.equal(await страница.locator('html').getAttribute('lang'), 'ru');
      assert.equal((await страница.locator('#лист-язык-состояние').innerText()).trim(), 'Русский');
      await страница.reload();
      assert.equal(await страница.locator('html').getAttribute('lang'), 'ru');
      await страница.close();
    }
    for (const [locale, ожидаемый] of [['uk-UA', 'uk'], ['en-US', 'en'], ['fr-FR', 'ru']]) {
      const страница = await браузер.newPage({ locale });
      await безTelegram(страница);
      await страница.route('https://igra.medart.com.ua/**', м => м.fulfill({ status: 503, body: '{}' }));
      await страница.goto(стенд.url + '/index.html');
      await страница.waitForFunction(код => document.documentElement.lang === код, ожидаемый);
      await страница.close();
    }
    console.log('PASS: uk/en Telegram, язык браузера, русский запасной, реальные кнопки, стол, выбор языка и перезапуск.');
  } finally { await браузер.close(); await стенд.close(); }
})().catch(е => { console.error(е); process.exitCode = 1; });
