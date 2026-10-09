'use strict';
/* =====================================================================
   ПРОВЕРКА (браузер, нужен playwright): «Захват» — пилюли на карте не лезут на капсулы.
   Было (до Р27): после щипка-зума пилюля «Столица … · N очков» вставала на капсулы игроков.
  С Р30 остаток идёт в самую опасную область: пилюля остатка называется «Столица ИМЯ · 3 очка» только
  если эта область — столица, иначе это просто имя области (короче). Ищем пилюлю по классу
  «захват-пилюля--остаток», а не по слову «Столица»; сколько из них столичных — печатаем для справки.
   Что делает: на ширинах 320×640, 390×844, 430×932 при 2, 4, 6 игроках в каждой партии
   делает щипок-зум по карте, жмёт «Готово» с остатком и меряет рамки всех видимых пилюль
   против капсул, ряда игроков и пульта. Пересечение — провал.
   Ноль найденных пилюль остатка — тоже провал (проверка не должна молча «ничего не найти»).
   Сочетания, где был брак (390×844×4, 430×932×6, 390×844×2), играются по 65 партий,
   остальные по 4(ПОПЫТОК_БРАК / ПОПЫТОК_ОБЫЧНЫЕ меняют числа).

   Запуск:  node штаб/браузер-занят.js   (код 1 — занято, тогда --ждать)
            node tests/захват-пилюли-окно.js
   Ломающий запуск (обязан краснеть, код 1):
            node tests/захват-пилюли-окно.js --сломать            (копию со старой границей делает сама, во временной папке)
            node tests/захват-пилюли-окно.js --сломать <путь копии стола>
   Файл проекта игры/захват/захват-стол.js не трогается: запрос к нему подменяется копией.
   ===================================================================== */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const ПРОЕКТ = path.resolve(__dirname, '..');
const { chromium, подготовитьПодделку } = require(path.join(__dirname, 'браузер-робот.js'));

const арг = process.argv.slice(2);
const иС = арг.indexOf('--сломать');
let КОПИЯ = null;
if (иС >= 0) {
  if (арг[иС + 1] && !арг[иС + 1].startsWith('--')) КОПИЯ = path.resolve(арг[иС + 1]);
  else {
    // Встроенная порча: страховка выкинута, штраф вне окна = 1 (как было до Р27). Делаем КОПИЮ во временной папке.
    const исходник = fs.readFileSync(path.join(ПРОЕКТ, 'игры', 'захват', 'захват-стол.js'), 'utf8');
    const а = '      вписатьПилюлиВОкно(пилюли);\n';
    const б = 'const ШТРАФ_ЗА_ВЫХОД_ИЗ_ОКНА = 50;';
    if (исходник.split(а).length !== 2 || исходник.split(б).length !== 2) {
      console.log('  ПЛОХО— не нашёл места для порчи (якорь не встретился ровно один раз) — это провал, а не пропуск');
      process.exit(1);
    }
    КОПИЯ = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'захват-порча-')), 'захват-стол-старая-граница.js');
    fs.writeFileSync(КОПИЯ, исходник.replace(а, '').replace(б, 'const ШТРАФ_ЗА_ВЫХОД_ИЗ_ОКНА = 1;'));
  }
}
const ПОПЫТОК_БРАК = Number(process.env.ПОПЫТОК_БРАК || 65);
const ПОПЫТОК_ОБЫЧНЫЕ = Number(process.env.ПОПЫТОК_ОБЫЧНЫЕ || 4);
const БРАЧНЫЕ = ['390×844×4', '430×932×6', '390×844×2'];

const ТИПЫ = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
function поднять() {
  const с = http.createServer((з, о) => {
    let п = '/';
    try { п = decodeURIComponent(з.url.split('?')[0]); } catch (_) { /* как есть */ }
    if (п === '/') п = '/index.html';
    const ф = path.join(ПРОЕКТ, п);
    try { if (ф.startsWith(path.normalize(ПРОЕКТ)) && fs.statSync(ф).isFile()) { о.writeHead(200, { 'Content-Type': ТИПЫ[path.extname(ф).toLowerCase()] || 'application/octet-stream' }); о.end(fs.readFileSync(ф)); return; } } catch (_) { /* нет */ }
    о.writeHead(404); о.end('нет');
  });
  return new Promise(г => с.listen(0, '127.0.0.1', () => г(с))); // порт свободный, любой
}

let провалов = 0, проверок = 0;
function проверить(у, с) { проверок++; console.log((у ? '  ок   — ' : '  ПЛОХО— ') + с); if (!у) провалов++; }

const замер = () => {
  const k_ = x => Math.round(x * 10) / 10;
  const р = у => { const к = у.getBoundingClientRect(); return { l: k_(к.left), r: k_(к.right), t: k_(к.top), b: k_(к.bottom) }; };
  const видна = у => { const к = у.getBoundingClientRect(); const с = getComputedStyle(у); return к.width > 0 && к.height > 0 && с.visibility !== 'hidden' && с.display !== 'none' && Number(с.opacity) > 0.05; };
  const пилюли = Array.from(document.querySelectorAll('.захват-пилюля')).filter(видна).map(у => ({ текст: (у.textContent || '').trim().slice(0, 40), остаток: у.classList.contains('захват-пилюля--остаток'), рамка: р(у) }));
  const препятствия = [];
  const ряд = document.getElementById('захват-игроки');
  if (ряд) препятствия.push({ имя: 'ряд-игроков', рамка: р(ряд) });
  Array.from(document.querySelectorAll('.захват-игрок')).filter(видна).forEach((у, н) => препятствия.push({ имя: 'капсула-' + н, рамка: р(у) }));
  const пульт = document.getElementById('захват-пульт');
  if (пульт && видна(пульт)) препятствия.push({ имя: 'пульт', рамка: р(пульт) });
  return { пилюли, препятствия };
};
const пересекает = (а, б) => Math.min(а.r, б.r) - Math.max(а.l, б.l) > 0.5 && Math.min(а.b, б.b) - Math.max(а.t, б.t) > 0.5;

async function перебор(браузер, порт, ш, в, мест, попыток) {
  const к = await браузер.newContext({ viewport: { width: ш, height: в } });
  const с = await к.newPage();
  const ошибки = [];
  с.on('pageerror', е => ошибки.push(е.message));
  await подготовитьПодделку(с, {});
  if (КОПИЯ) {
    await с.route(а => { try { return /\/игры\/захват\/захват-стол\.js/.test(decodeURIComponent(а.pathname)); } catch (_) { return false; } },
      м => м.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: fs.readFileSync(КОПИЯ) }));
  }
  await с.addInitScript(() => { try { localStorage.setItem('zahvat-learned', '1'); } catch (_) { /* пусто */ } });
  await с.goto('http://127.0.0.1:' + порт + '/захват.html', { waitUntil: 'load' });
  await с.waitForTimeout(700);
  let видели = 0, столичных = 0, плохих = 0;
  let пример = '';
  for (let п = 0; п < попыток; п++) {
    // Каждая вторая партия — «только столица»: остальные области человека делаем ничьими, и остаток идёт в столицу.
    // Без этого самая длинная пилюля «Столица ИМЯ · 3 очка» почти не встречалась бы (остаток идёт в самую опасную область).
    await с.evaluate(([н, толькоСтолица]) => {
      const игроки = ['человек'];
      for (let i = 1; i < н; i++) игроки.push('бот-' + i);
      const партия = window.ЗахватПравила.новаяПартия({ игроки: игроки, люди: ['человек'], сейчас: Date.now(), раундовЗахвата: 10 }, Math.random);
      if (толькоСтолица) {
        const столицы = партия.столицы.map(к => к.область);
        партия.хозяева.forEach((х, о) => { if (о > 0 && х === 'человек' && столицы.indexOf(о) === -1) партия.хозяева[о] = null; });
      }
      window.ЗахватЭкран.начатьПартиюСБотами(партия, { мест: н, уровень: 'лёгкий', раундовЗахвата: 10, новичок: false });
    }, [мест, п % 2 === 1]);
    await с.waitForTimeout(200);
    // Щипок-зум по карте: два пальца раздвигаются, центр и сдвиг случайные.
    await с.evaluate(() => {
      const у = document.getElementById('захват-карта'); const р = у.getBoundingClientRect();
      const цx = р.left + р.width * (0.2 + 0.6 * Math.random()), цy = р.top + р.height * (0.2 + 0.6 * Math.random());
      const ф = 1.4 + 1.1 * Math.random(), д0 = 60, д1 = д0 * ф, сдвиг = (Math.random() - 0.5) * 160;
      const соб = (тип, id, x, y) => у.dispatchEvent(new PointerEvent(тип, { pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: 'touch', isPrimary: id === 101 }));
      соб('pointerdown', 101, цx - д0 / 2, цy); соб('pointerdown', 102, цx + д0 / 2, цy);
      соб('pointermove', 101, цx - д1 / 2, цy + сдвиг); соб('pointermove', 102, цx + д1 / 2, цy + сдвиг);
      соб('pointerup', 101, цx - д1 / 2, цy + сдвиг); соб('pointerup', 102, цx + д1 / 2, цy + сдвиг);
    });
    await с.waitForTimeout(100);
    await с.click('#захват-готово').catch(() => {});
    await с.waitForTimeout(250);
    const з = await с.evaluate(замер);
    const пилюлиОстатка = з.пилюли.filter(п2 => п2.остаток);
    видели += пилюлиОстатка.length;
    столичных += пилюлиОстатка.filter(п2 => /^Столица /.test(п2.текст)).length;
    const плохо = з.пилюли.filter(п2 => з.препятствия.some(пр => пересекает(п2.рамка, пр.рамка)));
    if (плохо.length) {
      плохих++;
      if (!пример) пример = '«' + плохо[0].текст + '» на ' + з.препятствия.filter(пр => пересекает(плохо[0].рамка, пр.рамка)).map(пр => пр.имя).join(', ');
    }
  }
  const м = ш + '×' + в + '×' + мест;
  проверить(видели > 0, м + ': пилюль остатка увидено ' + видели + ' за ' + попыток + ' партий, из них «Столица…» ' + столичных + ' (ноль — провал)');
  проверить(столичных > 0, м + ': пилюль «Столица…» увидено ' + столичных + ' (самые длинные; ноль — провал)');
  проверить(плохих === 0, м + ': партий с пилюлей на капсулах/ряду/пульте ' + плохих + ' из ' + попыток + (пример ? ' — например ' + пример : ''));
  проверить(ошибки.length === 0, м + ': консоль без ошибок' + (ошибки.length ? ' — ' + ошибки[0] : ''));
  await к.close();
}

(async () => {
  const начало = Date.now();
  const сервер = await поднять();
  const порт = сервер.address().port;
  const браузер = await chromium.launch();
  try {
    for (const [ш, в] of [[320, 640], [390, 844], [430, 932]]) {
      for (const м of [2, 4, 6]) {
        const п = БРАЧНЫЕ.indexOf(ш + '×' + в + '×' + м) >= 0 ? ПОПЫТОК_БРАК : ПОПЫТОК_ОБЫЧНЫЕ;
        try { await перебор(браузер, порт, ш, в, м, п); } catch (е) { проверить(false, ш + '×' + в + '×' + м + ': упало: ' + String(е.message).split('\n')[0]); }
      }
    }
  } finally { await браузер.close(); сервер.close(); }
  console.log('Итого проверок: ' + проверок + ', провалов: ' + провалов + ', секунд: ' + Math.round((Date.now() - начало) / 1000) + (КОПИЯ ? ' (ломающий запуск)' : ''));
  process.exit(провалов ? 1 : 0);
})();
