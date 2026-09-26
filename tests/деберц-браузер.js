'use strict';
const assert = require('node:assert/strict');
const нажатьКарту = require('./деберц-нажать-карту.js');
const fs = require('node:fs');
const { chromium, безTelegram } = require('./браузер-робот.js');
const адрес = 'http://127.0.0.1:' + (process.argv[2] || '8137');
(async () => {
  const браузер = await chromium.launch({ headless: true });
  try {
    const страница = await браузер.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await безTelegram(страница);
    await страница.addInitScript(() => localStorage.setItem('server_address', 'http://127.0.0.1:8837'));
    const ошибки = [];
    страница.on('pageerror', e => ошибки.push(e.message));
    страница.on('response', r => { if (r.status() >= 400) ошибки.push(r.url() + ' ' + r.status()); });
    await страница.goto(адрес + '/index.html');
    if (process.argv.includes('--эталон')) {
      const { сестьЗаСтол } = require('./сесть-за-стол.js');
      await страница.locator('#кнопка-игра-дурак').click();
      await страница.screenshot({ path: 'tests/снимки/эталон-дурак-лобби.png' });
      await сестьЗаСтол(страница, { игроков: 2 });
      await страница.screenshot({ path: 'tests/снимки/эталон-дурак-стол.png' });
      return;
    }
    const вход = страница.locator('a[data-игра="деберц"]');
    assert.equal(await вход.count(), 1);
    await вход.click();
    await страница.waitForURL('**/' + encodeURI('деберц.html'));
    if (process.argv.includes('--интерфейс')) {
      const И = require('../server/игры/деберц.js');
      const П = require('../js/деберц-правила.js');
      const партия = И.раздать(null, { игроки: ['а', 'б'] });
      for (let i = 0; i < 2; i++) И.сделатьХод(партия, И.чейХод(партия), { действие: 'торг', масть: null });
      const я = И.чейХод(партия);
      let версия = 1;
      const показать = async () => страница.evaluate(вид => window.ИграПоСети.показатьВид(вид), И.видДляИгрока(партия, я, { код: 'TEST', версия: версия++ }));
      await страница.setViewportSize({ width: 320, height: 640 });
      await показать();
      await страница.waitForTimeout(800);
      assert.equal(await страница.locator('#панель-кнопок .деберц-масть').count(), 3);
      assert(await страница.locator('#панель-кнопок').evaluate(э => [...э.children].every(к => к.scrollWidth <= к.clientWidth)));
      await страница.screenshot({ path: 'tests/снимки/деберц-торговля-320.png' });
      И.сделатьХод(партия, я, { действие: 'торг', масть: П.вариантыКозыря(партия.игра)[0] });
      await показать();
      assert.equal(await страница.locator('#козырная-карта .карта').count(), 0, 'Отвергнутая масть не выглядит новым козырем');
      for (let i = 0; i < 2; i++) И.ходЗаБота(партия, И.чейХод(партия), 'обычный');
      await показать(); await страница.waitForTimeout(900);
      assert(await страница.locator('#стол').evaluate(э => {
        const [a, b] = [...э.querySelectorAll('.карта')].map(к => к.getBoundingClientRect());
        return Math.min(a.right, b.right) > Math.max(a.left, b.left)
          && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)
          && +getComputedStyle(э.children[1]).zIndex > +getComputedStyle(э.children[0]).zIndex;
      }), 'Ответная карта перекрывает первую и лежит выше');
      await страница.screenshot({ path: 'tests/снимки/деберц-перекрытие-320.png' });
      И.сделатьХод(партия, И.чейХод(партия), { действие: 'взятка' });
      await показать();
      await страница.getByRole('button', { name: 'За столом', exact: true }).click();
      assert.equal(await страница.locator('#деберц-сведения').evaluate(э => э.scrollTop), 0, 'Сведения открываются с заголовка');
      assert.equal(await страница.locator('#деберц-последняя-карты .карта').count(), 2);
      const вид = И.видДляИгрока(партия, я).деберц;
      assert.equal(await страница.locator('#деберц-очки-я').textContent(), String(вид.очки[0]));
      await страница.screenshot({ path: 'tests/снимки/деберц-сведения-320.png' });
      await страница.locator('#деберц-результаты').click();
      assert.equal(await страница.locator('dialog[open]').count(), 1, 'Результаты не складываются поверх другого диалога');
      await страница.getByRole('button', { name: 'Закрыть результаты', exact: true }).click();
      const к = (масть, имя) => ({ id: масть + имя, масть, имя });
      for (const пример of [
        { первая: к('♠', '7'), рука: [к('♠', '8'), к('♥', '9')], текст: 'Ответьте в масть ♠' },
        { первая: к('♠', '7'), рука: [к('♦', '8'), к('♥', '9')], текст: 'Нет ♠ — ходите козырем ♥' },
        { первая: к('♥', '7'), рука: [к('♥', 'В'), к('♣', '9')], текст: 'Ответьте старшим козырем ♥' },
        { первая: к('♠', '7'), рука: [к('♦', '8'), к('♣', '9')], текст: 'Нет масти и козырей — можно любую карту' }
      ]) {
        const индекс = партия.игроки.indexOf(я);
        Object.assign(партия.игра, { фаза: 'игра', козырь: '♥', ход: индекс, стол: [{ игрок: 1 - индекс, карта: пример.первая }] });
        партия.игра.руки[индекс] = пример.рука;
        await показать();
        assert.equal(await страница.locator('#деберц-статус').textContent(), пример.текст);
      }
      assert.deepEqual(ошибки, []);
      const индекс = партия.игроки.indexOf(я);
      const рука = [...['7', '8', '9'].map(x => к('♣', x)), ...['10', 'В', 'Д', 'К'].map(x => к('♠', x)), к('♥', 'Д'), к('♥', 'К')];
      Object.assign(партия.игра, { цель: 1001, фаза: 'игра', ход: индекс, стол: [], козырь: '♥' });
      партия.игра.руки[индекс] = рука;
      партия.игра.объявления[индекс] = П.комбинации(рука, '♥');
      партия.игра.белла[индекс] = true; партия.игра.бонусы[индекс] = 70;
      await показать(); await страница.waitForTimeout(800);
      assert.equal(await страница.locator('#деберц-цель-стола').textContent(), '1001');
      const объявлено = await страница.locator('#деберц-объявление').textContent();
      for (const название of ['Бела', 'Терц', 'Полтинник']) assert(объявлено.includes(название));
      assert(await страница.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await страница.screenshot({ path: 'tests/снимки/деберц-комбинации-320.png' });
      for (const [масть, имя] of Object.entries({ '♠': 'Пики', '♥': 'Червы', '♦': 'Бубны', '♣': 'Трефы' })) {
        партия.игра.козырь = масть;
        партия.игра.руки[индекс] = П.масти.flatMap(м => ['7', 'В'].map(x => к(м, x)));
        await показать();
        assert.equal(await страница.locator('#деберц-козырь').textContent(), 'Козырь — ' + имя);
        assert.equal(await страница.locator('#деберц-масть-козыря').textContent(), масть);
        const мастиРуки = await страница.locator('#карты-человека > .карта').evaluateAll(карты => карты.map(к => к.dataset.масть));
        assert(мастиРуки.slice(-2).every(м => м === масть) && мастиРуки.slice(0, -2).every(м => м !== масть), 'Все козыри справа');
      }
      console.log('Деберц: торговля на 320, козырь, очки, последняя взятка, подсказки и названия комбинаций — OK');
      return;
    }
    if (process.argv.includes('--макет')) {
      await страница.screenshot({ path: 'tests/снимки/деберц-лобби.png' });
      await страница.locator('#деберц-боты').click();
      await страница.screenshot({ path: 'tests/снимки/деберц-настройки.png' });
      await страница.locator('#деберц-начать').click();
      await страница.waitForTimeout(1800);
      for (let i = 0; i < 30; i++) {
        if (await страница.locator('#карты-человека button:enabled').count()) break;
        const торг = страница.locator('#панель-кнопок button:enabled:not(.кнопка--инфо):not(#кнопка-эмоции)').first();
        if (await торг.isVisible()) await торг.click();
        await страница.waitForTimeout(200);
      }
      await страница.waitForTimeout(900);
      for (const width of [320, 390, 768]) {
        await страница.setViewportSize({ width, height: 844 });
        await страница.waitForTimeout(300);
        await страница.screenshot({ path: 'tests/снимки/деберц-стол-' + width + '.png' });
      }
      await страница.setViewportSize({ width: 390, height: 844 });
      const первая = страница.locator('#карты-человека button:enabled').first();
      await первая.evaluate(к => { window.__проверяемаяКарта = к; });
      await нажатьКарту(страница, первая);
      assert(await страница.evaluate(() => document.getElementById('стол').contains(window.__проверяемаяКарта)), 'Карта переехала из руки на стол тем же DOM-узлом');
      await страница.waitForTimeout(450);
      await страница.screenshot({ path: 'tests/снимки/деберц-ход.png' });
      assert.deepEqual(ошибки, []);
      return;
    }
    await страница.locator('#деберц-вкладка-профиль').click();
    assert(await страница.locator('#экран-профиля-игрока').isVisible());
    await страница.locator('#кнопка-профиля-как-я-играю').click();
    assert(await страница.locator('#деберц-история').isVisible());
    await страница.getByRole('button', { name: 'Закрыть результаты', exact: true }).click();
    await страница.locator('#кнопка-профиля-назад').click();
    assert(await страница.locator('#деберц-боты').isVisible());
    await страница.locator('#деберц-вкладка-рейтинг').click();
    await страница.locator('#кнопка-рейтинг-игроков-назад').click();
    assert(await страница.locator('#деберц-боты').isVisible());
    await страница.locator('#деберц-правила').click();
    assert(await страница.locator('#деберц-справка').isVisible());
    await страница.getByRole('button', { name: 'Понятно', exact: true }).click();
    fs.mkdirSync('tests/снимки', { recursive: true });
    await страница.screenshot({ path: 'tests/снимки/деберц-лобби.png', fullPage: true });
    await страница.locator('#деберц-боты').click();
    await страница.locator('[data-уровень=обычный]').click();
    for (const цель of [301, 1001, 501]) {
      await страница.locator('[data-цель="' + цель + '"]').click();
      assert.equal(await страница.locator('[data-цель="' + цель + '"]').getAttribute('aria-checked'), 'true');
    }
    await страница.locator('#деберц-начать').click();
    assert.equal(await страница.locator('#деберц-цель-стола').textContent(), '501');
    // «‹» (#деберц-назад) с 23.09 всегда уводит на index.html (общий список игр) —
    // назад к лобби ДЕБЕРЦА теперь только через лист «⋯» → «В меню» (js/деберц-экран.js: кВыборуИгр/меню).
    await страница.locator('#кнопка-игра-ещё').click();
    await страница.locator('#кнопка-лист-игры-меню').click();
    const сохранённая = await страница.evaluate(() => localStorage.getItem('deberts_local_v1'));
    await страница.reload();
    assert.equal(await страница.evaluate(() => localStorage.getItem('deberts_local_v1')), сохранённая);
    assert(await страница.locator('#деберц-продолжить').isVisible());
    assert(await страница.locator('#деберц-уровень').isDisabled());
    assert(await страница.locator('#деберц-боты').isVisible(), 'Вход к боту не исчезает при сохранённой партии');
    await страница.locator('#деберц-боты').click();
    await страница.locator('#деберц-начать').click();
    assert(await страница.locator('#деберц-новая-партия').isVisible());
    await страница.locator('#деберц-новая-партия form button').click();
    assert.equal(await страница.evaluate(() => localStorage.getItem('deberts_local_v1')), сохранённая, 'Отмена сохраняет прежнюю партию');
    // Тот же случай: «‹» экрана настроек тоже привязана к кВыборуИгр (index.html).
    await страница.locator('#деберц-настройки-ещё').click();
    await страница.locator('#кнопка-лист-игры-меню').click();
    await страница.locator('#деберц-продолжить').click();
    assert.equal(await страница.locator('#деберц-цель-стола').textContent(), '501');
    await страница.locator('#кнопка-игра-ещё').click();
    await страница.locator('#кнопка-лист-игры-правила').click();
    assert(await страница.locator('#деберц-справка').isVisible());
    await страница.getByRole('button', { name: 'Понятно', exact: true }).click();
    await страница.locator('#кнопка-игра-ещё').click();
    await страница.locator('#кнопка-лист-игры-меню').click();
    assert(await страница.locator('#деберц-продолжить').isVisible());
    await страница.locator('#деберц-продолжить').click();
    // Ускоряем только паузы бота, действия игрока — настоящие нажатия.
    await страница.evaluate(() => {
      const таймер = window.setTimeout.bind(window);
      window.setTimeout = (fn, мс, ...args) => таймер(fn, мс === 1500 || мс === 2400 || мс === 6000 ? 15 : мс, ...args);
    });
    let конец = false, снимок = false;
    for (let шаг = 0; шаг < 1500; шаг++) {
      const ещё = страница.getByRole('button', { name: 'Сыграть ещё', exact: true });
      if (await ещё.isVisible()) { конец = true; break; }
      // Бот может закончить партию между двумя чтениями DOM. Не нажимаем
      // реванш вместо следующей сдачи при таком обновлении экрана.
      const действие = страница.locator('#панель-кнопок button:enabled:not(.кнопка--инфо):not(#кнопка-эмоции), #деберц-итог-действия button:enabled')
        .filter({ hasNotText: /Сыграть ещё|В лобби/ }).first();
      if (await действие.isVisible()) await действие.click();
      else {
        const карта = страница.locator('#карты-человека button:enabled').first();
        if (await карта.count()) {
          if (!снимок) {
            for (const ширина of [320, 390, 768]) {
              await страница.setViewportSize({ width: ширина, height: 844 });
              assert(await страница.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Нет горизонтального переполнения');
              await страница.screenshot({ path: 'tests/снимки/деберц-стол-' + ширина + '.png', fullPage: true });
            }
            снимок = true;
          }
          await нажатьКарту(страница, карта);
        } else await страница.waitForTimeout(25);
      }
    }
    assert(конец, 'Полная партия завершилась');
    assert(снимок, 'Игровой стол действительно показан');
    await страница.locator('#кнопка-игра-ещё').click();
    await страница.locator('#кнопка-лист-игры-звук').click();
    assert.equal(await страница.locator('#кнопка-лист-игры-звук').getAttribute('aria-checked'), 'false');
    await страница.locator('#кнопка-лист-игры-рекорды').click();
    assert.equal(await страница.locator('#деберц-список li').count(), 1);
    await страница.getByRole('button', { name: 'Закрыть результаты', exact: true }).click();
    await страница.getByRole('button', { name: 'Сыграть ещё', exact: true }).click();
    assert.equal(await страница.locator('#счёт-я').textContent(), '0');
    assert.equal(await страница.locator('#счёт-бот').textContent(), '0');
    await страница.getByRole('button', { name: 'За столом', exact: true }).click();
    await страница.locator('#деберц-сдаться').click();
    await страница.getByRole('button', { name: 'Продолжить игру', exact: true }).click();
    assert(await страница.locator('#экран-игры').isVisible());
    await страница.getByRole('button', { name: 'За столом', exact: true }).click();
    await страница.locator('#деберц-сдаться').click();
    await страница.locator('#деберц-сдаться-да').click();
    await страница.reload();
    await страница.locator('#деберц-лобби-ещё').click();
    await страница.locator('#кнопка-лист-игры-рекорды').click();
    assert.equal(await страница.locator('#деберц-список li').count(), 2);
    assert.deepEqual(ошибки, []);
    console.log('Деберц: витрина, справка, меню, 3 ширины, полная партия, сохранение, результаты, звук и сдача — OK');
  } finally { await браузер.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
