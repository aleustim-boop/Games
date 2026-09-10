/* =====================================================================
   ЧТО ЧИТАЕТ ХОЗЯИН СТОЛА В ШАШКАХ, СОЗДАВ ИГРУ С ДРУГОМ.

   Беда, ради которой проверка написана: человек создавал стол и видел
   «Ждём, когда хозяин начнёт игру» — то есть игра советовала ему ждать
   самого себя, — и кнопку «Выйти из комнаты» вместо «Отменить игру».
   Он искал кнопку «Начать игру», которой в шашках нет вовсе, и решал,
   что игра сломана. Владелец так и написал: «в шашках не могу создать
   игру с другом».

   Проверка читает СЛОВА С ЭКРАНА, а не «комната создалась»: беда была
   именно в словах, а комната всё это время заводилась исправно.

   Идёт дорогой человека: страница шашек → «Играть с другом онлайн» →
   «Создать игру».

   Запуск: node tests/слова-хозяину-в-шашках.js
   Выход 0 — провалов нет. Свой сервер и раздачу страниц поднимает сама,
   порты берёт свободные.
   ===================================================================== */

const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
process.env.GAMES_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'слова-хозяину-'));

const КОРЕНЬ = path.join(__dirname, '..');
const робот = require(path.join(КОРЕНЬ, 'tests', 'браузер-робот.js'));
const сервера = require(path.join(КОРЕНЬ, 'server', 'сервер.js'));
const комнаты = require(path.join(КОРЕНЬ, 'server', 'комнаты.js'));
const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

let проверок = 0; const провалы = [];
function проверить(у, ч) { проверок++; if (!у) { провалы.push(ч); console.log('  ПРОВАЛ: ' + ч); } else console.log('  ок   ' + ч); }
const спать = м => new Promise(f => setTimeout(f, м));

(async () => {
  console.log('=== Слова хозяину стола в шашках ===\n');
  const стр = http.createServer((з, о) => {
    const путь = decodeURIComponent(з.url.split('?')[0]);
    fs.readFile(path.join(КОРЕНЬ, путь === '/' ? 'шашки.html' : путь.slice(1)), (б, т) => {
      if (б) { о.writeHead(404); о.end(); return; }
      о.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(путь)] || 'text/plain' });
      о.end(т);
    });
  }).listen(0);
  const сервер = сервера.создатьСервер();
  await new Promise(r => сервер.listen(0, r));
  комнаты.запуститьУборку();
  const адрес = 'http://127.0.0.1:' + стр.address().port + '/шашки.html?сервер=' +
                encodeURIComponent('http://127.0.0.1:' + сервер.address().port);

  const браузер = await робот.chromium.launch();
  let сбой = null;

  try {
    const с = await (await браузер.newContext({ viewport: { width: 390, height: 780 } })).newPage();
    await робот.безTelegram(с);
    с.on('pageerror', e => console.log('   ОШИБКА СТРАНИЦЫ: ' + e.message));
    await с.goto(адрес);
    await спать(600);

    console.log('1. Создаём игру дорогой человека');
    await с.evaluate(() => document.getElementById('кнопка-с-другом').click());
    await спать(400);
    await с.evaluate(() => document.getElementById('кнопка-создать-игру').click());
    await спать(2500);

    const экран = await с.evaluate(() => Array.from(document.querySelectorAll('#приложение > .экран'))
      .filter(э => э.classList.contains('экран--виден')).map(э => э.id).join(','));
    const код = (await с.textContent('#код-комнаты')).trim();
    console.log('   экран: ' + экран + ', код комнаты: «' + код + '»');
    проверить(/^[A-Z0-9]{4,}$/.test(код), 'комната создана и код виден');

    console.log('2. Что написано хозяину');
    const слова = await с.evaluate(() => ({
      ожидание: (document.getElementById('ожидание-соперника') || {}).textContent || '',
      отмена: (document.getElementById('кнопка-комната-отмена') || {}).textContent || '',
      прихожаяВидна: !(document.getElementById('прихожая') || { classList: { contains: () => true } })
        .classList.contains('скрыт'),
      кнопкиХозяина: !(document.getElementById('кнопки-хозяина') || { classList: { contains: () => true } })
        .classList.contains('скрыт')
    }));
    console.log('   строка ожидания: «' + слова.ожидание.trim() + '»');
    console.log('   кнопка отмены:   «' + слова.отмена.trim() + '»');

    проверить(!/жд[её]м, когда хозяин/i.test(слова.ожидание),
      'хозяину НЕ написано, что он ждёт хозяина');
    проверить(/друг|код/i.test(слова.ожидание),
      'написано про друга и код — то, чего человек и ждёт');
    проверить(/отменить/i.test(слова.отмена),
      'кнопка называется «Отменить игру», а не «Выйти из комнаты»');
    проверить(!слова.прихожаяВидна,
      'списка мест за столом на двоих нет — ждать нечего, кроме друга');
    проверить(!слова.кнопкиХозяина,
      'кнопок «Начать игру» и ботов нет: в шашках их не бывает');

    console.log('3. Друг входит — партия начинается сама');
    const второй = await (await браузер.newContext({ viewport: { width: 390, height: 780 } })).newPage();
    await робот.безTelegram(второй);
    await второй.goto(адрес);
    await спать(500);
    await второй.evaluate(() => document.getElementById('кнопка-с-другом').click());
    await спать(300);
    await второй.evaluate(() => document.getElementById('кнопка-войти-по-коду').click());
    await второй.fill('#поле-кода', код);
    await второй.evaluate(() => document.getElementById('кнопка-войти').click());

    let заДоской = true;
    try { await с.waitForSelector('#экран-шашек.экран--виден', { timeout: 15000 }); }
    catch (е) { заДоской = false; }
    проверить(заДоской, 'у хозяина открылась доска, как только друг вошёл');
  } catch (е) { сбой = е; }

  await браузер.close(); комнаты.остановитьУборку(); сервер.close(); стр.close();
  console.log('\n----------------------------------------');
  if (сбой) console.log('ОБОРВАЛОСЬ: ' + сбой.message);
  console.log('Проверок сделано: ' + проверок);
  console.log('ПРОВАЛОВ: ' + провалы.length);
  process.exit(провалы.length === 0 && !сбой ? 0 : 1);
})();
