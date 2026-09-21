#!/usr/bin/env node
'use strict';

/**
 * Снимок экрана рейтинга с открытой и закрытой панелью выбора игры.
 * Открывает браузер, переходит на витрину, затем на рейтинг.
 * Снимает панель закрытой и открытой.
 */

const { chromium } = require('./браузер-робот.js');
const path = require('path');
const fs = require('fs');

// Адреса и пути
const GAME_URL = 'http://127.0.0.1:8888/index.html';
const SCREENSHOT_DIR = path.join(__dirname, 'снимки');

// Имена узлов из js/рейтинг-экран.js
const УЗЕЛ_ВЫБОР_ИГРЫ = 'рейтинг-выбор-игры';
const КНОПКА_ТЕКУЩАЯ_ИГРА = 'рейтинг-выбор-игры-кнопка';
const УЗЕЛ_ПАНЕЛЬ_ИГР = 'рейтинг-панель-игр';

// Кнопки вкладок
const КНОПКА_ВКЛАДКА_РЕЙТИНГ = 'кнопка-вкладка-профиль'; // Рейтинг на витрине

(async () => {
  let browser;
  try {
    // Убедимся, что директория снимков существует
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    // Запускаем браузер
    console.log('Запускаю браузер...');
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Устанавливаем размер экрана 390×844 (телефон)
    await page.setViewportSize({ width: 390, height: 844 });
    console.log('Размер экрана: 390×844');

    // Открываем игру
    console.log('Открываю игру на ' + GAME_URL);
    await page.goto(GAME_URL, { waitUntil: 'networkidle' });

    // Ждём загрузки страницы
    await page.waitForTimeout(1000);

    // Переходим на рейтинг (нажимаем вкладку)
    console.log('Переключаюсь на вкладку рейтинга...');
    const кнопкаРейтинг = page.locator('#' + КНОПКА_ВКЛАДКА_РЕЙТИНГ);
    const существует = await кнопкаРейтинг.isVisible({ timeout: 5000 }).catch(() => false);

    if (!существует) {
      throw new Error('Кнопка вкладки рейтинга не найдена: #' + КНОПКА_ВКЛАДКА_РЕЙТИНГ);
    }

    await кнопкаРейтинг.click();
    console.log('Вкладка рейтинга открыта');

    // Ждём загрузки рейтинга
    await page.waitForTimeout(2000);

    // Ищем элементы панели выбора игры
    console.log('Ищу элементы панели выбора игры...');
    const выборИгры = page.locator('#' + УЗЕЛ_ВЫБОР_ИГРЫ);
    const кнопкаИгра = page.locator('#' + КНОПКА_ТЕКУЩАЯ_ИГРА);
    const панель = page.locator('#' + УЗЕЛ_ПАНЕЛЬ_ИГР);

    const выборЕсть = await выборИгры.isVisible({ timeout: 2000 }).catch(() => false);
    const кнопкаЕсть = await кнопкаИгра.isVisible({ timeout: 2000 }).catch(() => false);

    if (!выборЕсть) {
      throw new Error('Элемент выбора игры не найден: #' + УЗЕЛ_ВЫБОР_ИГРЫ);
    }
    if (!кнопкаЕсть) {
      throw new Error('Кнопка текущей игры не найдена: #' + КНОПКА_ТЕКУЩАЯ_ИГРА);
    }

    console.log('Элементы найдены:');
    console.log('  - #' + УЗЕЛ_ВЫБОР_ИГРЫ);
    console.log('  - #' + КНОПКА_ТЕКУЩАЯ_ИГРА);
    console.log('  - #' + УЗЕЛ_ПАНЕЛЬ_ИГР);

    // Первый снимок: панель закрыта
    console.log('Снимаю панель закрытой...');
    const файл1 = path.join(SCREENSHOT_DIR, 'рейтинг-панель-закрыта-390x844.png');
    await page.screenshot({ path: файл1 });
    console.log('Сохранено: ' + файл1);

    // Нажимаем кнопку для открытия панели
    console.log('Открываю панель выбора игры...');
    await кнопкаИгра.click();
    await page.waitForTimeout(500);

    // Проверяем, видна ли панель
    const панельВидна = await панель.isVisible({ timeout: 2000 }).catch(() => false);
    if (!панельВидна) {
      throw new Error('Панель не открылась после клика');
    }

    // Второй снимок: панель открыта
    console.log('Снимаю панель открытой...');
    const файл2 = path.join(SCREENSHOT_DIR, 'рейтинг-панель-открыта-390x844.png');
    await page.screenshot({ path: файл2 });
    console.log('Сохранено: ' + файл2);

    // Проверяем консоль на ошибки
    console.log('Проверяю консоль браузера...');
    const консольСообщения = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        консольСообщения.push(msg.text());
      }
    });

    // Ждём немного для сбора ошибок
    await page.waitForTimeout(1000);

    if (консольСообщения.length > 0) {
      console.log('Ошибки в консоли:');
      консольСообщения.forEach(м => console.log('  ' + м));
    } else {
      console.log('Ошибок в консоли не найдено');
    }

    // Закрываем браузер
    await context.close();
    await browser.close();
    console.log('Браузер закрыт');

  } catch (ошибка) {
    console.error('Ошибка:', ошибка.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
