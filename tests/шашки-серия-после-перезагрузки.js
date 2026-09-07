/* Серия побед должна пережить перезагрузку страницы: в Telegram игра
   запускается заново при каждом открытии из бота. Две победы → перезагрузка
   → третья победа обязана дать «Побед подряд: 3», а таблица — одну строку. */
const { chromium } = require('./браузер-робот.js');
const ПОРТ = Number(process.argv[2]) || 8080;    // страничный сервер уже поднят

(async () => {
  const браузер = await chromium.launch();
  const окно = await браузер.newContext({ viewport: { width: 360, height: 640 } });
  const страница = await окно.newPage();
  const записать = (исход) => страница.evaluate(
    (и) => window.ШашкиРекорды.записатьПартию({ исход: и, уровень: 'обычный' }), исход);

  await страница.goto('http://127.0.0.1:' + ПОРТ + '/шашки.html');
  await страница.waitForTimeout(300);
  await записать('победа');
  const до = await записать('победа');

  await страница.reload();
  await страница.waitForTimeout(300);
  const после = await записать('победа');
  const таблица = await страница.evaluate(async () => (await window.loadScore('шашки')).таблица
    .map((с) => с.очки + ' ' + с.сложность));

  console.log('до перезагрузки: «' + до + '», после: «' + после + '», таблица: ' + таблица.join(' | '));
  const хорошо = /^Побед подряд: 3/.test(после) && таблица.length === 1 && таблица[0] === '3 обычный';
  console.log(хорошо ? 'ВСЁ ЗЕЛЁНОЕ' : 'ПЛОХО: серия не пережила перезагрузку');
  await браузер.close();
  process.exit(хорошо ? 0 : 1);
})().catch((о) => { console.error(о); process.exit(2); });
