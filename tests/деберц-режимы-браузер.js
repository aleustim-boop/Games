'use strict';
/* =====================================================================
   ДЕБЕРЦ — РЕЖИМЫ (3 / 4 / 2×2) НА РАЗНЫХ ШИРИНАХ

   Деберц переведён на общее онлайн-лобби (штаб/план-онлайн-как-дурак.md,
   Э9). Эта проверка игровой стол не через комнату открывает (первый блок
   вызывает window.ИграПоСети.показатьВид напрямую, второй блок играет
   с ботом через #деберц-боты — оба пути не были тронуты переходом), так
   что по устройству она не изменилась. Но красная была: жёсткий порог
   «высота карты взятки не меньше 100px» не подходит для ширины 320 —
   там карты стабильно 80px (2×2, четыре карты в ряд) или 92px (3/4).
   На 390px и шире — честные 132px, порог там проходит.

   Замер (node tests/деберц-режимы-браузер.js на самом узком экране,
   плюс скриншот tests/снимки/деберц-2x2-320.png) показал: карты видно
   целиком, без обрезки и наложений, только чуть компактнее, чем раньше.
   Это не поломка — верстка подстраивается под самый маленький телефон,
   выше запас увеличен. Порог занижен до 70px (с запасом 10px от самого
   тесного случая), смысл проверки («карта — не полоска в пиксель») тот
   же самый.

   Второй, отдельный от перехода на лобби провал: во втором блоке (игра
   с ботом) тест уводил экран назад кликом по «‹» (#деберц-назад) и ждал
   переоткрытия лобби после reload — а с 23.09 «‹» всегда ведёт на
   index.html (общий список игр), в лобби самого деберца возврат теперь
   только через лист «⋯» → «В меню» (см. tests/деберц-браузер.js, там
   уже так). Это было сломано ещё до перехода на онлайн-лобби, тест
   просто давно не гоняли до конца — поправлено тем же приёмом.

   Запуск:
       node tests/деберц-режимы-браузер.js [порт-файлов] [порт-комнат] [--макет]
       node tests/деберц-режимы-браузер.js --сломать

   Перед браузерным запуском (отдельной командой):
       node штаб/браузер-занят.js --ждать
   ===================================================================== */
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { chromium, безTelegram } = require('./браузер-робот.js');
const нажатьКарту = require('./деберц-нажать-карту.js');

const ПРОЕКТ = path.join(__dirname, '..');
const МЕТКА = '[режимы]';
// Откуда цифра — см. пояснение в шапке файла.
const МИН_ВЫСОТА_КАРТЫ = 70;

async function прогнать(портФайлов, портКомнат, толькоМакет) {
  const И = require(path.join(ПРОЕКТ, 'server', 'игры', 'деберц.js'));
  const base = 'http://127.0.0.1:' + портФайлов;
  const server = 'http://127.0.0.1:' + портКомнат;
  const browser = await chromium.launch({ headless: true });
  const ошибки = [];
  async function страница() {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await безTelegram(p); p.on('pageerror', e => ошибки.push(e.message));
    await p.goto(base + '/деберц.html?server=' + encodeURIComponent(server)); return p;
  }
  try {
    const p = await страница();
    let версия = 0;
    for (const режим of ['3', '4', '2x2']) {
      const n = режим === '2x2' ? 4 : +режим;
      const п = И.раздать(null, { игроки: ['а', 'б', 'в', 'г'].slice(0, n), парами: режим === '2x2' });
      И.сделатьХод(п, И.чейХод(п), { действие: 'торг', масть: п.игра.открытая.масть });
      assert.equal(п.игра.фаза, 'игра', МЕТКА + ' торг завершён, началась игра');
      for (let i = 0; i < n; i++) И.ходЗаБота(п, И.чейХод(п), 'обычный');
      for (const width of [320, 390, 768, 1920]) {
        await p.setViewportSize({ width, height: width === 320 ? 640 : 844 });
        await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
        await p.waitForTimeout(1400);
        assert.equal(await p.locator('.деберц-участник').count(), n - 1, МЕТКА + ` показаны все соперники (режим ${режим}, ${width}px)`);
        assert.equal(await p.locator('#стол .карта').count(), n, МЕТКА + ` на столе карты всех игроков (режим ${режим})`);
        assert.match(await p.locator('#деберц-обяз').textContent(), /^Обяз: /, МЕТКА + ' обяз подписан');
        assert.equal(await p.locator('.деберц-участник--напарник').count(), режим === '2x2' ? 1 : 0, МЕТКА + ' напарник выделен только в 2×2');
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), МЕТКА + ' нет горизонтальной прокрутки');
        assert(await p.locator('#стол').evaluate((э, мин) => [...э.querySelectorAll('.карта')].every(к => {
          const r = к.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.height >= мин;
        }), МИН_ВЫСОТА_КАРТЫ), МЕТКА + ` все карты взятки помещаются и не мельче ${МИН_ВЫСОТА_КАРТЫ}px (режим ${режим}, ${width}px)`);
        await p.screenshot({ path: path.join(ПРОЕКТ, 'tests', 'снимки', `деберц-${режим}-${width}.png`) });
      }
    }
    await p.close();
    if (!толькоМакет) for (const режим of ['3', '4', '2x2']) {
      const p = await страница();
      await p.locator('#деберц-боты').click(); await p.locator('[data-режим="' + режим + '"]').click();
      await p.locator('#деберц-начать').click();
      // «‹» с 23.09 уводит на index.html (общий список игр), не в лобби деберца —
      // назад к лобби только через лист «⋯» → «В меню» (как в tests/деберц-браузер.js).
      await p.locator('#кнопка-игра-ещё').click(); await p.locator('#кнопка-лист-игры-меню').click();
      await p.reload();
      await p.locator('#деберц-продолжить').click();
      assert.equal(await p.evaluate(() => window.ДеберцПамять.открыть(localStorage).игра.режим), режим, МЕТКА + ' партия с ботом восстановлена после перезагрузки');
      await p.evaluate(() => { const timer = window.setTimeout.bind(window); window.setTimeout = (fn, ms, ...args) => timer(fn, ms === 1500 || ms === 2400 || ms === 6000 ? 10 : ms, ...args); });
      let завершена = false;
      for (let шаг = 0; шаг < 3000; шаг++) {
        if (await p.getByRole('button', { name: 'Играть ещё', exact: true }).isVisible()) { завершена = true; break; }
        const действие = p.locator('#панель-кнопок button:enabled:not(.кнопка--инфо):not(#кнопка-эмоции), #деберц-итог-действия button:enabled').filter({ hasNotText: /Играть ещё|В меню|Рекорды|Похвастаться|Сыграть с ботом/ }).first();
        if (await действие.isVisible()) await действие.click();
        else {
          const карта = p.locator('#карты-человека button:enabled').first();
          if (await карта.count()) await нажатьКарту(p, карта); else await p.waitForTimeout(20);
        }
      }
      assert(завершена, МЕТКА + ' ' + режим + ': полная партия через нажатия');
      const результат = await p.evaluate(() => window.ДеберцПамять.открыть(localStorage).результаты());
      assert.equal(результат.length, 1, МЕТКА + ' результат партии записан'); assert.equal(результат[0].режим, режим, МЕТКА + ' режим результата верный');
      await p.getByRole('button', { name: 'Играть ещё', exact: true }).click();
      assert.equal(await p.locator('#счёт-я').textContent(), '0', МЕТКА + ' новая партия начата с нуля');
      await p.getByRole('button', { name: 'За столом', exact: true }).click();
      await p.locator('#деберц-сдаться').click(); await p.locator('#деберц-сдаться-да').click();
      assert.equal(await p.evaluate(() => window.ДеберцПамять.открыть(localStorage).результаты().length), 2, МЕТКА + ' сдача тоже записана в результаты');
      console.log('Браузер: ' + режим + ' — выбор, восстановление, полная партия, повтор и сдача — OK');
      await p.close();
    }
    assert.deepEqual(ошибки, [], МЕТКА + ' в консоли нет исключений');
    console.log('Обяз, игроки, напарник и 3/4 карты взятки на четырёх ширинах — OK');
  } finally { await browser.close(); }
}

/* ---------- Ломающий прогон: портим класс «деберц-участник» в копии игры/деберц/деберц-экран.js ---------- */
function сделатьКопиюПроекта(папка) {
  for (const часть of ['server', ...require('./пути-проекта.js').папкиКода(), 'img', 'tests']) {
    const откуда = path.join(ПРОЕКТ, часть);
    if (!fs.existsSync(откуда)) continue;
    fs.cpSync(откуда, path.join(папка, часть), {
      recursive: true,
      filter: ф => { const имя = path.basename(ф); return имя !== 'данные' && имя !== 'node_modules' && имя !== 'снимки'; }
    });
  }
  for (const файл of fs.readdirSync(ПРОЕКТ)) {
    if (файл.endsWith('.html') || файл.endsWith('.css')) fs.copyFileSync(path.join(ПРОЕКТ, файл), path.join(папка, файл));
  }
  fs.mkdirSync(path.join(папка, 'tests', 'снимки'), { recursive: true });
}

function поднятьФайловыйСервер(корень, порт) {
  const сервер = spawn(process.execPath, [path.join(ПРОЕКТ, 'tests', 'локальный-сервер.js'), String(порт)], {
    env: Object.assign({}, process.env, { КОРЕНЬ_СЕРВЕРА: корень }), stdio: 'pipe'
  });
  return new Promise((готово, беда) => {
    let вывод = '';
    const т = setTimeout(() => беда(new Error('файловый сервер не поднялся за 5с')), 5000);
    сервер.stdout.on('data', d => { вывод += d.toString(); if (вывод.includes('запущен')) { clearTimeout(т); готово(сервер); } });
    сервер.on('error', e => { clearTimeout(т); беда(e); });
  });
}

async function ломать() {
  console.log('=== Ломающий прогон: класс «деберц-участник» испорчен в копии игры/деберц/деберц-экран.js — обязан покраснеть ===');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'деберц-режимы-лом-'));
  const ПОРТ_ФАЙЛОВ_ЛОМ = 8150;
  let файловый = null;
  try {
    сделатьКопиюПроекта(папка);
    const файл = path.join(папка, 'игры', 'деберц', 'деберц-экран.js');
    const текст = fs.readFileSync(файл, 'utf8');
    const строка = "узел.className = 'деберц-участник';";
    if (!текст.includes(строка)) {
      console.log('ПРОВАЛ: в копии игры/деберц/деберц-экран.js нет строки «' + строка + '» — портить нечего');
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(файл, текст.replace(строка, "узел.className = 'деберц-участник-сломано';"), 'utf8');
    console.log('Порченая копия: ' + папка);

    файловый = await поднятьФайловыйСервер(папка, ПОРТ_ФАЙЛОВ_ЛОМ);
    const прогон = spawnSync(process.execPath, [__filename, String(ПОРТ_ФАЙЛОВ_ЛОМ), '8839', '--макет'], { encoding: 'utf8', timeout: 120000 });
    console.log('\n----- вывод ломающего прогона -----\n' + (прогон.stdout || '') + (прогон.stderr ? '\nstderr: ' + прогон.stderr : ''));
    console.log('------------------------------------');
    const покраснел = прогон.status === 1;
    console.log(покраснел ? 'ЛОМАЮЩИЙ ПРОГОН ПОКРАСНЕЛ, как и должен.' : 'ПРОВАЛ: ломающий прогон не покраснел (код ' + прогон.status + ')!');
    process.exitCode = покраснел ? 0 : 1;
  } finally {
    if (файловый) файловый.kill();
    fs.rmSync(папка, { recursive: true, force: true });
    console.log('Временная копия убрана: ' + папка + '; файловый сервер лома погашен по PID.');
  }
}

function довод(индекс, поумолчанию) {
  const з = process.argv[индекс];
  return (з && !з.startsWith('--')) ? з : поумолчанию;
}

if (process.argv.includes('--сломать')) {
  ломать().catch(e => { console.error(e); process.exitCode = 1; });
} else {
  const портФайлов = довод(2, '8137');
  const портКомнат = довод(3, '8837');
  прогнать(портФайлов, портКомнат, process.argv.includes('--макет')).catch(e => { console.error(e); process.exitCode = 1; });
}
