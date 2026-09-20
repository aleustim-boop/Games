'use strict';

/* =====================================================================
   Браузерная проверка: переключатель «Состав игроков» на экране рейтинга
   (кнопки «Личный» и «2 на 2») кликаются и визуально переключаются.

   Задача: убедиться, что:
   — Экран рейтинга открывается без ошибок;
   — Кнопка «2 на 2» кликабельна (не disabled);
   — При клике на «2 на 2» кнопка получает класс --выбран и aria-checked="true";
   — При клике на «2 на 2» кнопка «Личный» теряет класс --выбран и aria-checked="true";
   — Консоль в браузере не содержит красных ошибок;
   — Один снимок экрана рейтинга на диск.

   Запуск:
     node tests/браузер-рейтинг-состав.js
     TEST_URL=http://127.0.0.1:8131 node tests/браузер-рейтинг-состав.js

   Ломающий запуск (обязан покраснеть):
     TEST_URL=http://127.0.0.1:8131 node tests/браузер-рейтинг-состав.js --сломать

   ===================================================================== */

const { chromium, подготовитьПодделку, общееОблако, безTelegram } = require('./браузер-робот.js');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:8131';
const SCREENSHOT_DIR = path.join(__dirname, 'снимки');

let ошибок = 0;
let тестов = 0;

const СЛОМАТЬ = process.argv.includes('--сломать');

function проверить(название, условие) {
  тестов += 1;
  if (!условие) {
    ошибок += 1;
    console.log('  ✗ ' + название);
  } else {
    console.log('  ✓ ' + название);
  }
}

/**
 * Дождаться, пока экран с заданным id станет видимым (класс 'экран--виден').
 * Образец: tests/стрелка-после-рейтинга.js
 */
async function дождатьсяЭкрана(страница, id, мс) {
  try {
    await страница.waitForFunction(function (и) {
      const э = document.getElementById(и);
      return Boolean(э && э.classList.contains('экран--виден'));
    }, id, { timeout: мс || 6000 });
    return true;
  } catch (сбой) {
    return false;
  }
}

async function запуститьПроверку() {
  let browser;
  try {
    // Создать директорию для снимков
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    console.log('=== Браузерная проверка: переключатель состава на рейтинге ===\n');

    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();

    // Блокировать настоящий скрипт Telegram (поддельный будет в index.html)
    await безTelegram(page);

    // Слушать консоль браузера и ошибки загрузки
    const консольОшибки = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        консольОшибки.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      консольОшибки.push('Ошибка страницы: ' + err.message);
    });

    // Слушать ошибки загрузки ресурсов
    page.on('requestfailed', req => {
      const url = req.url();
      // Пропускаем ошибки Telegram (он не должен загружаться в тесте)
      if (url.includes('telegram')) return;
      // Favicon и некритичные ресурсы пропускаем
      if (url.includes('favicon') || url.includes('apple-touch-icon')) return;
      консольОшибки.push('Не загрузился ресурс: ' + url);
    });

    // Открыть главную страницу (index.html)
    console.log('1. Открытие главной страницы');
    try {
      await page.goto(BASE_URL + '/', {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      проверить('главная страница загрузилась', true);
    } catch (e) {
      проверить('главная страница загрузилась', false);
      console.log('  Ошибка загрузки:', e.message);
      if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
        console.log('  → HTTP-сервер не запущен на ' + BASE_URL);
      }
      throw e;
    }

    // Открыть лобби дурака (кликнуть на кнопку дурака на витрине)
    console.log('\n2. Открытие лобби дурака');

    // Сначала дождаться видимости витрины
    const витринаВидна = await дождатьсяЭкрана(page, 'экран-витрины', 4000);
    проверить('витрина видна', витринаВидна);

    if (витринаВидна) {
      // Теперь найти и кликнуть кнопку дурака
      const кнопкаДурак = await page.$('[id^="кнопка"][id*="дурак"]');
      проверить('кнопка "Дурак" на витрине найдена', кнопкаДурак !== null);

      if (кнопкаДурак) {
        await кнопкаДурак.click();
        const лоббиОткрыто = await дождатьсяЭкрана(page, 'экран-лобби', 4000);
        проверить('лобби дурака открылось после клика', лоббиОткрыто);
        if (!лоббиОткрыто) throw new Error('Не удалось открыть лобби дурака');
      } else {
        throw new Error('Кнопка дурака не найдена');
      }
    } else {
      throw new Error('Витрина не видна');
    }

    // Открыть рейтинг (кликнуть на вкладку рейтинга)
    console.log('\n3. Открытие экрана рейтинга');
    const вкладкаРейтинг = await page.$('#лобби-вкладка-рейтинг');
    проверить('вкладка "Рейтинг" на нижней полосе найдена', вкладкаРейтинг !== null);
    if (вкладкаРейтинг) {
      await вкладкаРейтинг.click();
      const рейтингОткрыт = await дождатьсяЭкрана(page, 'экран-рейтинга-игроков', 4000);
      проверить('экран рейтинга открылся после клика на вкладку', рейтингОткрыт);
      if (!рейтингОткрыт) throw new Error('Не удалось открыть рейтинг');
    } else {
      throw new Error('Вкладка рейтинга не найдена');
    }

    // Проверить отсутствие ошибок в консоли (кроме ошибок загрузки внешних ресурсов)
    console.log('\n4. Консоль браузера');
    const критичныеОшибки = консольОшибки.filter(err =>
      !err.includes('Failed to load resource') &&
      !err.includes('telegram') &&
      !err.includes('Telegram') &&
      !err.includes('favicon') &&
      !err.includes('apple-touch-icon')
    );
    проверить('критичных ошибок нет в консоли', критичныеОшибки.length === 0);
    if (критичныеОшибки.length > 0) {
      console.log('    Критичные ошибки:');
      критичныеОшибки.forEach(err => {
        console.log('      → ' + err.substring(0, 80));
      });
    }
    if (консольОшибки.length > критичныеОшибки.length) {
      console.log('    (Некритичные: ' + (консольОшибки.length - критичныеОшибки.length) +
        ' — внешние ресурсы)');
    }

    // Найти кнопку «2 на 2»
    console.log('\n5. Кнопка "2 на 2"');
    const кнопка2на2 = await page.$('[data-состав="парами"]');
    проверить('кнопка найдена на странице', кнопка2на2 !== null);

    if (кнопка2на2) {
      // Проверить, что кнопка НЕ disabled
      const isDisabled = await кнопка2на2.evaluate(el => el.disabled);
      проверить('кнопка "2 на 2" не заблокирована (disabled=false)', !isDisabled);

      // Проверить начальное состояние (должна быть не выбрана)
      const ariaCheckedДо = await кнопка2на2.evaluate(el => el.getAttribute('aria-checked'));
      проверить('перед кликом aria-checked="false" (не выбрана)',
        ariaCheckedДо === 'false');

      const классДо = await кнопка2на2.evaluate(el =>
        el.classList.contains('переключатель__вариант--выбран')
      );
      проверить('перед кликом нет класса --выбран',
        !классДо);

      // Кликнуть на кнопку
      console.log('\n6. Клик на кнопку "2 на 2"');
      await кнопка2на2.click();
      // Подождать небольшую анимацию/перерисовку
      await page.waitForTimeout(300);

      // Проверить, что после клика кнопка выбрана
      const ariaCheckedПосле = await кнопка2на2.evaluate(el =>
        el.getAttribute('aria-checked')
      );
      // При --сломать инвертируем ожидаемое значение, чтобы тест упал
      const ожидалось = СЛОМАТЬ ? 'false' : 'true';
      проверить('после клика aria-checked="' + ожидалось + '" (выбрана)',
        ariaCheckedПосле === ожидалось);

      const классПосле = await кнопка2на2.evaluate(el =>
        el.classList.contains('переключатель__вариант--выбран')
      );
      // При --сломать инвертируем ожидание, чтобы тест упал
      проверить('после клика класс --выбран добавлен',
        СЛОМАТЬ ? !классПосле : классПосле);

      // Найти кнопку «Личный» и проверить, что она БОЛЬШЕ не выбрана
      console.log('\n7. Кнопка "Личный" после клика на "2 на 2"');
      const кнопкаЛичный = await page.$('[data-состав="личный"]');
      проверить('кнопка "Личный" найдена', кнопкаЛичный !== null);

      if (кнопкаЛичный) {
        const ariaCheckedЛичный = await кнопкаЛичный.evaluate(el =>
          el.getAttribute('aria-checked')
        );
        проверить('после клика на "2 на 2" кнопка "Личный" имеет aria-checked="false"',
          ariaCheckedЛичный === 'false');

        const классЛичный = await кнопкаЛичный.evaluate(el =>
          el.classList.contains('переключатель__вариант--выбран')
        );
        проверить('после клика на "2 на 2" кнопка "Личный" теряет класс --выбран',
          !классЛичный);
      }
    }

    // Снимок экрана
    console.log('\n8. Снимок экрана');
    const screenshotPath = path.join(SCREENSHOT_DIR, 'рейтинг-состав.png');
    await page.screenshot({ path: screenshotPath });
    проверить('снимок сохранён: ' + screenshotPath, true);

    await context.close();
    await browser.close();

  } catch (err) {
    console.error('Критическая ошибка:', err.message);
    ошибок += 1;
    if (browser) {
      await browser.close();
    }
  }

  // Итог
  console.log('\n' + '='.repeat(60));
  console.log('Итого проверок: ' + тестов + ', провалов: ' + ошибок);

  process.exit(ошибок === 0 ? 0 : 1);
}

запуститьПроверку();
