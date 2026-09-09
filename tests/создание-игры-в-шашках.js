/* Создание игры с другом в шашках — ДОРОГОЙ ЧЕЛОВЕКА:
   витрина → «Шашки» → «Играть с другом онлайн» → «Создать игру».

   Проверяет не только «комната создалась», но и С КАКИМ АДРЕСОМ: беда,
   ради которой проверка написана, была именно в адресе. У человека
   в памяти лежал вчерашний адрес туннеля, на странице шашек ссылки нет
   вовсе — и игра стучалась в мёртвый сервер, хотя у дурака всё работало.

   Запуск: node tests/создание-игры-в-шашках.js
   Выход 0 — провалов нет. Свой сервер и раздачу страниц поднимает сама,
   порты берёт свободные. */

const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
process.env.GAMES_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'дорога-'));
const К = path.join(__dirname, '..');
const робот = require(path.join(К, 'tests', 'браузер-робот.js'));
const сервера = require(path.join(К, 'server', 'сервер.js'));
const комнаты = require(path.join(К, 'server', 'комнаты.js'));
const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

let проверок = 0; const провалы = [];
function проверить(у, ч) { проверок++; if (!у) { провалы.push(ч); console.log('  ПРОВАЛ: ' + ч); } else console.log('  ок   ' + ч); }
const спать = м => new Promise(f => setTimeout(f, м));

/* Мёртвый адрес: порт, на котором заведомо никого нет. */
const МЁРТВЫЙ = 'http://127.0.0.1:9';

(async () => {
  console.log('=== Создание игры дорогой человека ===\n');
  const стр = http.createServer((з, о) => {
    const путь = decodeURIComponent(з.url.split('?')[0]);
    fs.readFile(path.join(К, путь === '/' ? 'index.html' : путь.slice(1)), (б, т) => {
      if (б) { о.writeHead(404); о.end(); return; }
      о.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(путь)] || 'text/plain' });
      о.end(т);
    });
  }).listen(0);
  const портСтраниц = стр.address().port;
  const сервер = сервера.создатьСервер();
  await new Promise(r => сервер.listen(0, r));
  комнаты.запуститьУборку();
  const живой = 'http://127.0.0.1:' + сервер.address().port;

  const браузер = await робот.chromium.launch();
  const окно = () => браузер.newContext({ viewport: { width: 390, height: 780 } }).then(к => к.newPage());
  let сбой = null;

  try {
    const с = await окно();
    await робот.безTelegram(с);
    с.on('pageerror', e => console.log('   ОШИБКА СТРАНИЦЫ: ' + e.message));

    console.log('1. У человека в памяти вчерашний адрес, в ссылке — сегодняшний');
    await с.goto('http://127.0.0.1:' + портСтраниц + '/index.html');
    await с.evaluate(а => window.localStorage.setItem('подкидной-дурак:адрес-сервера', а), МЁРТВЫЙ);
    await с.goto('http://127.0.0.1:' + портСтраниц + '/index.html?сервер=' + encodeURIComponent(живой));
    await спать(900);
    const уДурака = await с.evaluate(() => window.Сеть.адрес());
    проверить(уДурака === живой, 'у дурака адрес свежий: ' + уДурака);

    /* Дурак должен успеть решить спор адресов: он идёт в фоне, экран его
       не ждёт. Даём ему это время и заодно проверяем, что экран нарисован. */
    const экранСразу = await с.evaluate(() =>
      Array.from(document.querySelectorAll('.экран')).some(э => э.classList.contains('экран--виден')));
    проверить(экранСразу, 'экран нарисован сразу, стука к серверу не ждёт');
    await с.evaluate(() => window.Сеть.проверитьАдрес && window.Сеть.проверитьАдрес());
    await спать(2500);

    console.log('2. Идём на шашки, как человек — кнопкой с витрины');
    await с.evaluate(() => {
      const кнопки = Array.from(document.querySelectorAll('button'));
      const шашки = кнопки.find(к => /шашк/i.test(к.textContent) && !к.classList.contains('скрыт'));
      if (шашки) шашки.click();
    });
    await спать(1500);
    проверить(/шашки/i.test(decodeURIComponent(с.url())), 'открылась страница шашек');
    const уШашек = await с.evaluate(() => window.Сеть.адрес());
    console.log('   адрес сервера у шашек: ' + уШашек);
    проверить(уШашек === живой, 'адрес на шашках ЖИВОЙ, а не вчерашний');

    console.log('3. Создаём игру с другом');
    await с.evaluate(() => document.getElementById('кнопка-с-другом').click());
    await спать(400);
    await с.evaluate(() => document.getElementById('кнопка-создать-игру').click());
    await спать(2500);
    const итог = await с.evaluate(() => ({
      код: (document.getElementById('код-комнаты') || {}).textContent.trim(),
      экран: Array.from(document.querySelectorAll('#приложение > .экран'))
        .filter(э => э.classList.contains('экран--виден')).map(э => э.id).join(','),
      беда: (document.getElementById('нет-сервера-главное') || {}).textContent.trim()
    }));
    console.log('   код комнаты: «' + итог.код + '», экран: ' + итог.экран);
    проверить(/^[A-Z0-9]{4,}$/.test(итог.код), 'комната создана и код виден человеку');
    проверить(итог.экран.indexOf('экран-комнаты') !== -1, 'человек на экране комнаты, а не на плашке беды');
    проверить(!итог.беда, 'плашки «не знаю, где сервер» нет');
    проверить(комнаты.сколькоКомнат() > 0, 'сервер и правда завёл комнату (' + комнаты.сколькоКомнат() + ')');

    console.log('4. Живой вписанный адрес чужая ссылка не отбирает');
    const с2 = await окно();
    await робот.безTelegram(с2);
    await с2.goto('http://127.0.0.1:' + портСтраниц + '/index.html');
    await с2.evaluate(а => window.localStorage.setItem('подкидной-дурак:адрес-сервера', а), живой);
    const чужой = живой.replace('127.0.0.1', 'localhost');   // тоже живой, но другой
    await с2.goto('http://127.0.0.1:' + портСтраниц + '/index.html?сервер=' + encodeURIComponent(чужой));
    await спать(900);
    await с2.evaluate(() => window.Сеть.проверитьАдрес && window.Сеть.проверитьАдрес());
    await спать(2500);
    const вПамяти = await с2.evaluate(() => window.localStorage.getItem('подкидной-дурак:адрес-сервера'));
    console.log('   в памяти осталось: ' + вПамяти);
    проверить(вПамяти === живой, 'свой живой сервер остался в памяти — чужая ссылка его не отобрала');
  } catch (е) { сбой = е; }

  await браузер.close(); комнаты.остановитьУборку(); сервер.close(); стр.close();
  console.log('\n----------------------------------------');
  if (сбой) console.log('ОБОРВАЛОСЬ: ' + сбой.message);
  console.log('Проверок сделано: ' + проверок);
  console.log('ПРОВАЛОВ: ' + провалы.length);
  process.exit(провалы.length === 0 && !сбой ? 0 : 1);
})();
