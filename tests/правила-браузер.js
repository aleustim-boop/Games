'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { chromium, безTelegram } = require('./браузер-робот');
(async () => {
  const стенд = await require('./бастион-стенд')();
  const браузер = await chromium.launch({ headless: true });
  try {
    for (const ширина of [390, 1280]) {
      const страница = await браузер.newPage({ viewport: { width: ширина, height: 900 }, javaScriptEnabled: false });
      await страница.route('https://igra.medart.com.ua/img/**', async маршрут => {
        const файл = path.join(__dirname, '..', decodeURIComponent(new URL(маршрут.request().url()).pathname));
        await маршрут.fulfill({ path: файл });
      });
      await страница.goto(стенд.url + '/rules/durak/index.html');
      assert.equal(await страница.locator('h1').textContent(), 'Правила подкидного дурака');
      assert.equal(await страница.getByRole('link', { name: 'Сыграть сейчас', exact: true }).count(), 2);
      assert.ok(await страница.locator('.обложка').evaluate(э => э.complete && э.naturalWidth > 0));
      assert.ok(await страница.locator('body').evaluate(э => э.scrollWidth <= innerWidth));
      fs.mkdirSync(path.join(__dirname, 'снимки'), { recursive: true });
      await страница.screenshot({ path: path.join(__dirname, 'снимки', 'правила-' + ширина + '.png'), fullPage: true });
      await страница.getByRole('link', { name: 'Сыграть сейчас', exact: true }).first().click();
      assert.ok(new URL(страница.url()).pathname.endsWith('/index.html'));
      console.log('PASS правила без JS:', ширина);
      await страница.close();
    }
    const всеПравила = await браузер.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await всеПравила.route('https://igra.medart.com.ua/img/**', маршрут => маршрут.fulfill({ path: path.join(__dirname, '..', decodeURIComponent(new URL(маршрут.request().url()).pathname)) }));
    for (const [метка, , заголовок] of require('../штаб/скрипты/страницы-правил').игры) {
      assert.equal((await всеПравила.goto(стенд.url + '/rules/' + метка + '/index.html')).status(), 200);
      assert.equal(await всеПравила.locator('h1').textContent(), заголовок);
      assert.ok(await всеПравила.locator('.обложка').evaluate(э => э.complete && э.naturalWidth > 0), метка + ': обложка');
      assert.ok(await всеПравила.evaluate(() => document.documentElement.scrollWidth <= innerWidth), метка + ': переполнение');
      if (метка === '2048') await всеПравила.screenshot({ path: path.join(__dirname, 'снимки', 'правила-2048-390.png'), fullPage: true });
    }
    await всеПравила.close();
    console.log('PASS: 22 страницы правил без JS на телефоне, обложки и ширина.');
    const вход = await браузер.newPage({ viewport: { width: 390, height: 844 } });
    await безTelegram(вход);
    await вход.route('https://igra.medart.com.ua/**', р => р.fulfill({ status: 503, body: '{}' }));
    await вход.goto(стенд.url + '/index.html?game=durak');
    await вход.locator('#экран-лобби.экран--виден').waitFor();
    assert.equal(await вход.locator('#экран-витрины').isVisible(), false);
    await вход.close();
    console.log('PASS: кнопка правил открывает лобби дурака.');
  } finally { await браузер.close(); await стенд.close(); }
})().catch(е => { console.error(е); process.exitCode = 1; });
