'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require('./браузер-робот');
(async () => {
  const стенд = await require('./публичные-лидеры').запустить();
  const браузер = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1280]) {
      const страница = await браузер.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: false });
      await страница.route(url => decodeURIComponent(url.pathname) === '/общее/css/style-публичные.css', р => р.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(__dirname, '..', 'общее/css/style-публичные.css')) }));
      const ответ = await страница.goto(стенд.url + '/top');
      assert.equal(ответ.status(), 200);
      assert.equal(await страница.locator('.лидеры__сетка section').count(), 17);
      assert.equal(await страница.locator('a[href*="src_top"]').count(), 2);
      assert.equal(await страница.locator('#раздача .лидеры li').first().locator('span').last().innerText(), 'Олена');
      assert.equal(await страница.locator('.лидеры__сетка').first().evaluate(э => getComputedStyle(э).display), 'grid');
      assert.equal(await страница.locator('#durak img').count(), 0, 'имя показано текстом');
      assert.equal(await страница.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await страница.screenshot({ path: path.join(__dirname, 'снимки', 'лидеры-' + width + '.png'), fullPage: true });
      await страница.close();
    }
    console.log('PASS: лидеры без JavaScript и авторизации, 390/1280, безопасные имена, раздача дня, кнопки и отсутствие переполнения.');
  } finally { await браузер.close(); await стенд.close(); }
})().catch(е => { console.error(е); process.exitCode = 1; });
