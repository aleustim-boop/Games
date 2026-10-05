'use strict';
const assert = require('node:assert/strict');
const { chromium, подготовитьПодделку } = require('./браузер-робот');
const { карточки } = require('../bot/inline-игры');
const { ИГРЫ } = require('../server/названия');
(async () => {
  const стенд = await require('./бастион-стенд')();
  const браузер = await chromium.launch({ headless: true });
  try {
    const все = карточки({ query: '' }, { секрет: 'browser-test', сервер: 'https://inline.invalid', сайт: стенд.url, бот: 'test_bot', приложение: 'BoardGames' });
    for (let и = 0; и < все.length; и++) {
      const страница = await браузер.newPage({ viewport: { width: 390, height: 844 } });
      await подготовитьПодделку(страница, { подпись: 'test-signature' });
      const хвост = new URL(все[и].reply_markup.inline_keyboard[0][0].url).searchParams.get('startapp');
      const запросы = [];
      const ошибки = [];
      страница.on('pageerror', е => ошибки.push(е.message));
      await страница.route('https://inline.invalid/**', async маршрут => {
        const путь = decodeURIComponent(new URL(маршрут.request().url()).pathname);
        let тело = {}; try { тело = маршрут.request().postDataJSON() || {}; } catch (_) {}
        запросы.push({ путь, тело });
        const ответ = путь === '/inline-стол' ? { код: 'ABCD', игра: ИГРЫ[и].игра } : { ошибка: 'Проверка входа завершена', почему: 'нет' };
        await маршрут.fulfill({ status: путь === '/inline-стол' ? 200 : 403, contentType: 'application/json', body: JSON.stringify(ответ) });
      });
      await страница.goto(стенд.url + '/index.html?tgWebAppStartParam=' + хвост);
      try {
        await страница.waitForFunction(() => document.body.textContent.includes('Попросите новую ссылку'), null, { timeout: 12000 });
      } catch (е) {
        console.error({ игра: ИГРЫ[и].игра, запросы, ошибки, экран: await страница.locator('body').innerText() });
        throw е;
      }
      const вход = запросы.find(з => з.путь === '/войти');
      assert.ok(вход, ИГРЫ[и].игра + ': запрос входа');
      assert.equal(вход.тело.код, 'ABCD');
      assert.equal(вход.тело.игра, ИГРЫ[и].игра);
      assert.ok(вход.тело.inline.includes('_src_inline_'));
      assert.equal(запросы.filter(з => з.путь === '/inline-стол').length, 1);
      assert.deepEqual(ошибки, []);
      console.log('PASS браузер:', ИГРЫ[и].игра);
      await страница.close();
    }
    const отмена = await браузер.newPage({ viewport: { width: 390, height: 844 } });
    await подготовитьПодделку(отмена, { подпись: 'test-signature' });
    let разрешить, открывается;
    const ожидание = new Promise(г => { разрешить = г; });
    const пришёл = new Promise(г => { открывается = г; });
    let входов = 0;
    await отмена.route('https://inline.invalid/**', async маршрут => {
      const путь = decodeURIComponent(new URL(маршрут.request().url()).pathname);
      if (путь === '/inline-стол') { открывается(); await ожидание; }
      if (путь === '/войти') входов++;
      await маршрут.fulfill({ contentType: 'application/json', body: JSON.stringify({ код: 'ABCD', игра: 'дурак' }) });
    });
    const хвост = new URL(все[0].reply_markup.inline_keyboard[0][0].url).searchParams.get('startapp');
    await отмена.goto(стенд.url + '/index.html?tgWebAppStartParam=' + хвост);
    await пришёл;
    await отмена.locator('#кнопка-вход-назад').click();
    const ответ = отмена.waitForResponse(о => decodeURIComponent(new URL(о.url()).pathname) === '/inline-стол');
    разрешить();
    await ответ;
    await отмена.waitForTimeout(300);
    assert.equal(входов, 0, 'поздний ответ не сажает за стол после отмены');
    await отмена.close();
    console.log('PASS: отмена открытия приглашения.');
  } finally { await браузер.close(); await стенд.close(); }
})().catch(е => { console.error(е); process.exitCode = 1; });
