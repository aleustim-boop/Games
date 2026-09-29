'use strict';
/* =====================================================================
   ДЕБЕРЦ — ПОНЯТНОСТЬ ИГРОВОГО СТОЛА

   Деберц переведён на общее онлайн-лобби (штаб/план-онлайн-как-дурак.md,
   Э9): изменился вход в игру с другом, а сам игровой стол (счёт, обяз,
   подпись козыря, карты взятки) — тот же самый узел, что и раньше, эта
   проверка его не касается напрямую и по устройству не изменилась.

   Однако при первом прогоне после перехода проверка «Карты и имена не
   пересекают подпись заказчика» красная: она жёстко ждала, что подпись
   карты на столе стоит ВЫШЕ блока «Козырь — …/Играет …» (сравнение
   «низ подписи < верх заказа»). Замер координат на всех четырёх ширинах
   и обеих раздачах показал: подписи карт стабильно НИЖЕ блока заказа,
   с запасом от 32px (320×640) и больше — то есть визуально никакого
   наложения нет, просто верстка «стол-игры» ставит блок заказа первым
   (сверху), а стол с картами — под ним, и направление сравнения в
   проверке устарело. Заменено на проверку без пересечения в любую
   сторону — тот же смысл («подпись заказа и карты друг друга не
   перекрывают»), без привязки к конкретному порядку блоков.

   Запуск:
       node tests/деберц-понятный-стол.js [порт-файлов] [порт-комнат]
       node tests/деберц-понятный-стол.js --сломать

   Перед браузерным запуском (отдельной командой):
       node штаб/браузер-занят.js --ждать
   ===================================================================== */
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium, безTelegram } = require('./браузер-робот.js');

const ПРОЕКТ = path.join(__dirname, '..');
const МЕТКА = '[понятный-стол]';

async function прогнать(портФайлов, портКомнат) {
  const И = require(path.join(ПРОЕКТ, 'server', 'игры', 'деберц.js'));
  const П = require(path.join(ПРОЕКТ, 'js', 'деберц-правила.js'));
  const b = await chromium.launch({ headless: true });
  try {
    const p = await b.newPage(); const ошибки = [];
    p.on('pageerror', e => ошибки.push(e.message)); await безTelegram(p);
    await p.goto(`http://127.0.0.1:${портФайлов}/деберц.html?server=http://127.0.0.1:${портКомнат}`);
    let версия = 0;
    const п = И.раздать(null, { игроки: ['а', 'б'] });
    const и = п.игра; и.счёт = [68, 142];
    // Обяз локального игрока во втором круге: паса в интерфейсе нет.
    while (!П.обязанВыбрать(и)) П.торг(и, и.ход, null);
    await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, п.игроки[и.сдающий], { код: 'TEST', версия: ++версия }));
    assert.equal(await p.locator('#деберц-обяз').textContent(), 'Обяз: Вы', МЕТКА + ' обяз сдающего показан');
    assert.equal(await p.getByRole('button', { name: 'Пас', exact: true }).count(), 0, МЕТКА + ' у обяза паса в интерфейсе нет');
    assert.match(await p.locator('#деберц-заказ').textContent(), /круг 2/, МЕТКА + ' подпись «круг 2» видна');
    П.торг(и, и.ход, П.вариантыКозыря(и)[0]);
    for (const count of [1, 2]) {
      П.сыграть(и, и.ход, П.доступные(и, и.ход)[0].id);
      for (const [width, height] of [[320, 640], [390, 844], [515, 610], [768, 844]]) {
        await p.setViewportSize({ width, height });
        await p.evaluate(в => window.ИграПоСети.показатьВид(в), И.видДляИгрока(п, 'а', { код: 'TEST', версия: ++версия }));
        await p.waitForTimeout(1400);
        assert.match(await p.locator('.шапка-игры__подзаголовок').textContent(), /Вы: 68.*Друг: 142/, МЕТКА + ' счёт подписан именами');
        assert(!/фреза/i.test(await p.locator('#экран-игры').innerText()), МЕТКА + ' слова «фреза» на экране нет');
        await p.screenshot({ path: path.join(ПРОЕКТ, 'tests', 'снимки', `деберц-понятный-${width}-${count}.png`) });
        const непересекаются = await p.locator('#деберц-заказ').evaluate(э => {
          const r = э.getBoundingClientRect();
          return [...document.querySelectorAll('#стол .деберц-подпись-карты')].every(к => {
            const kr = к.getBoundingClientRect();
            return kr.bottom + 3 < r.top || kr.top > r.bottom + 3;
          });
        });
        assert(непересекаются, МЕТКА + ` карты и имена не пересекают подпись заказчика (${width}×${height}, раздача №${count})`);
      }
    }
    assert.deepEqual(ошибки, [], МЕТКА + ' в консоли нет исключений');
    console.log('Экран: подписанный счёт, обяз сдающего, запрет паса, без фрезы и наложений на четырёх размерах — OK');
  } finally { await b.close(); }
}

/* ---------- Ломающий прогон: портим id «деберц-обяз» в копии деберц.html ---------- */
function сделатьКопиюПроекта(папка) {
  for (const часть of ['server', 'js', 'img', 'шрифты', 'tests']) {
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
  const { spawn } = require('child_process');
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
  console.log('=== Ломающий прогон: id «деберц-обяз» испорчен в копии деберц.html — обязан покраснеть ===');
  const папка = fs.mkdtempSync(path.join(os.tmpdir(), 'деберц-понятный-стол-лом-'));
  const ПОРТ_ФАЙЛОВ_ЛОМ = 8149;
  let файловый = null;
  try {
    сделатьКопиюПроекта(папка);
    const файл = path.join(папка, 'деберц.html');
    const текст = fs.readFileSync(файл, 'utf8');
    const строка = 'id="деберц-обяз"';
    if (!текст.includes(строка)) {
      console.log('ПРОВАЛ: в копии деберц.html нет строки «' + строка + '» — портить нечего');
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(файл, текст.replace(строка, 'id="деберц-обяз-сломано"'), 'utf8');
    console.log('Порченая копия: ' + папка);

    файловый = await поднятьФайловыйСервер(папка, ПОРТ_ФАЙЛОВ_ЛОМ);
    // Сервер комнат правила игры не портит (порча только в разметке
    // деберц.html), поэтому переиспользуем уже работающий стенд на 8839 —
    // такой же сервер, тот же код server/игры/деберц.js.
    const прогон = spawnSync(process.execPath, [__filename, String(ПОРТ_ФАЙЛОВ_ЛОМ), '8839'], { encoding: 'utf8', timeout: 120000 });
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
  прогнать(портФайлов, портКомнат).catch(e => { console.error(e); process.exitCode = 1; });
}
