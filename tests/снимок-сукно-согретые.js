'use strict';

/* =====================================================================
   СНИМКИ ЛОББИ ДУРАКА С СОГРЕТЫМИ КАРТОЧКАМИ.

   Задача: показать владельцу сравнение — текущий вид (серые карточки
   на бордовом сукне) и предложение (тёплые тона под дерево).

   Что делает:
     1. Открывает браузер на http://127.0.0.1:8080/index.html
     2. Нажимает дурака, открывается лобби
     3. Ждёт узел #экран-лобби
     4. Делает снимок 1: карточки согреты только (class карточка-входа + карточка-профиля)
     5. Согревает нижнюю полосу вкладок
     6. Делает снимок 2: всё согрето (карточки + вкладки)
     7. Закрывает браузер

   Запуск:
       node tests/снимок-сукно-согретые.js

   Снимки:
       tests/снимки/сукно-лобби-согретые-390x844.png
       tests/снимки/сукно-лобби-согретые-всё-390x844.png
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const { chromium, подготовитьПодделку } = require('./браузер-робот.js');

const ПАПКА_СНИМКОВ = path.join(__dirname, 'снимки');
const САЙТ = 'http://127.0.0.1:8080';
const РАЗМЕР = { width: 390, height: 844 };

let браузер = null;

const новоеЖдание = (мс) => new Promise((р) => setTimeout(р, мс));

function ждатьВидимости(страница, id, максМс) {
  return new Promise(async (готово) => {
    const начало = Date.now();
    while (Date.now() - начало < (максМс || 5000)) {
      const виден = await страница.evaluate((идентификатор) => {
        const узел = document.getElementById(идентификатор);
        if (!узел) return false;
        const вид = window.getComputedStyle(узел);
        return вид.display !== 'none' && вид.visibility !== 'hidden' && Number(вид.opacity) > 0.05;
      }, id);
      if (виден) {
        готово(true);
        return;
      }
      await новоеЖдание(20);
    }
    готово(false);
  });
}

async function запустить() {
  console.log('Снимки лобби с согретыми карточками\n');

  if (!fs.existsSync(ПАПКА_СНИМКОВ)) {
    fs.mkdirSync(ПАПКА_СНИМКОВ, { recursive: true });
  }

  try {
    браузер = await chromium.launch();
    const контекст = await браузер.newContext({
      viewport: РАЗМЕР,
      hasTouch: true,
      deviceScaleFactor: 1
    });

    const страница = await контекст.newPage();
    const красные = [];
    страница.on('pageerror', (ошибка) => красные.push(ошибка.message));
    страница.on('console', (сообщение) => {
      if (сообщение.type() === 'error') {
        красные.push(сообщение.text());
      }
    });

    await подготовитьПодделку(страница, { версия: '7.10' });

    console.log('1. Открываю витрину (index.html)...');
    const адресВитрины = САЙТ + '/index.html';
    await страница.goto(адресВитрины, { waitUntil: 'domcontentloaded' });
    console.log('   Витрина загружена ✓');

    console.log('\n2. Нажимаю дурака...');
    await новоеЖдание(300);
    const естьДурак = await ждатьВидимости(страница, 'кнопка-игра-дурак', 3000);
    if (!естьДурак) {
      console.error('ПРОВАЛ: кнопка дурака не найдена');
      процесс.exit(1);
    }
    await страница.click('#кнопка-игра-дурак');
    console.log('   Дурак открыт ✓');

    console.log('\n3. Жду лобби...');
    await новоеЖдание(500);
    const естьЛобби = await ждатьВидимости(страница, 'экран-лобби', 5000);
    if (!естьЛобби) {
      console.error('ПРОВАЛ: лобби дурака не найдено (экран-лобби)');
      process.exit(1);
    }
    console.log('   Лобби видимо ✓');

    // Подсчёт узлов
    console.log('\n4. Проверяю селекторы карточек...');
    const считыЛобби = await страница.evaluate(() => {
      return {
        входов: document.querySelectorAll('.карточка-входа').length,
        профиля: document.querySelectorAll('.карточка-профиля').length,
        вкладок: document.querySelectorAll('.нижние-вкладки').length
      };
    });

    console.log('   Найдено:');
    console.log(`   - карточек входов (.карточка-входа): ${считыЛобби.входов}`);
    console.log(`   - карточек профиля (.карточка-профиля): ${считыЛобби.профиля}`);
    console.log(`   - полос вкладок (.нижние-вкладки): ${считыЛобби.вкладок}`);

    if (считыЛобби.входов === 0) {
      console.error('ПРОВАЛ: селектор .карточка-входа не нашёл узлов');
      process.exit(1);
    }
    if (считыЛобби.профиля === 0) {
      console.error('ПРОВАЛ: селектор .карточка-профиля не нашёл узлов');
      process.exit(1);
    }
    if (считыЛобби.вкладок === 0) {
      console.error('ПРОВАЛ: селектор .нижние-вкладки не нашёл узлов');
      process.exit(1);
    }

    // Снимок 1: только карточки согреты
    console.log('\n5. Добавляю CSS для согрева карточек...');
    await страница.addStyleTag({
      content: `
        .карточка-входа {
          background: linear-gradient(180deg, #5a3a22, #3d2615) !important;
          border: 1px solid rgba(230, 179, 74, 0.28) !important;
        }
        .карточка-профиля {
          background: linear-gradient(180deg, #5a3a22, #3d2615) !important;
          border: 1px solid rgba(230, 179, 74, 0.28) !important;
        }
      `
    });
    console.log('   CSS добавлено ✓');

    await новоеЖдание(200);
    const путьСнимок1 = path.join(ПАПКА_СНИМКОВ, 'сукно-лобби-согретые-390x844.png');
    console.log(`\n6. Делаю снимок 1 (только карточки)...`);
    await страница.screenshot({ path: путьСнимок1 });
    console.log(`   Сохранено: ${путьСнимок1}`);

    // Снимок 2: карточки + вкладки согреты
    console.log('\n7. Добавляю CSS для согрева вкладок...');
    await страница.addStyleTag({
      content: `
        .нижние-вкладки {
          background: linear-gradient(180deg, #5a3a22, #3d2615) !important;
          border-top: 1px solid rgba(230, 179, 74, 0.28) !important;
        }
      `
    });
    console.log('   CSS для вкладок добавлено ✓');

    await новоеЖдание(200);
    const путьСнимок2 = path.join(ПАПКА_СНИМКОВ, 'сукно-лобби-согретые-всё-390x844.png');
    console.log(`\n8. Делаю снимок 2 (карточки и вкладки)...`);
    await страница.screenshot({ path: путьСнимок2 });
    console.log(`   Сохранено: ${путьСнимок2}`);

    // Ошибки в консоли
    console.log('\n9. Ошибки в консоли:');
    if (красные.length > 0) {
      console.log('   Найдены ошибки:');
      красные.slice(0, 5).forEach((е) => console.log('   - ' + е));
      if (красные.length > 5) console.log(`   ... и ещё ${красные.length - 5}`);
    } else {
      console.log('   Ошибок не найдено ✓');
    }

    console.log('\n10. Закрываю браузер...');
    await контекст.close();
    await браузер.close();
    console.log('    Браузер закрыт ✓');

    console.log('\n' + '='.repeat(60));
    console.log('ОТЧЁТ:');
    console.log('='.repeat(60));
    console.log('\nСнимки готовы:');
    console.log(`  1. ${путьСнимок1}`);
    console.log(`  2. ${путьСнимок2}`);
    console.log('\nПрименённые селекторы:');
    console.log(`  .карточка-входа (${считыЛобби.входов} узлов)`);
    console.log(`  .карточка-профиля (${считыЛобби.профиля} узлов)`);
    console.log(`  .нижние-вкладки (${считыЛобби.вкладок} узлов)`);
    console.log('\nОформление (согрев):');
    console.log('  Фон: linear-gradient(180deg, #5a3a22, #3d2615)');
    console.log('  Рамка: 1px solid rgba(230, 179, 74, 0.28)');
    console.log(`\nОшибок в консоли: ${красные.length}`);
    console.log('\nКод выхода: 0');
    console.log('='.repeat(60));

    process.exit(0);

  } catch (ошибка) {
    console.error('\nОшибка стенда: ' + ошибка.message);
    if (ошибка.stack) console.error(ошибка.stack);
    process.exit(1);
  } finally {
    if (браузер) {
      try {
        await браузер.close();
      } catch (е) {
        // молча
      }
    }
  }
}

запустить().catch((ошибка) => {
  console.error('Стенд упал: ' + ошибка.message);
  process.exit(2);
});
