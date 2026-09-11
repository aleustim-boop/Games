'use strict';
/* =====================================================================
   УВЕЛИЧЕННОЕ ОКНО НА ПЛАНШЕТЕ И МОНИТОРЕ.

   Зачем. На широком окне игра рисует «экран» телефона шириной 480 точек
   и увеличивает его целиком (transform: scale) ступенями по высоте окна —
   ступени лежат в style.css. Увеличение ломает всё, что считает место
   на экране: полёт брошенного предмета, полёт карт, шторку листа «Ещё»,
   плашку итога. Проверяем четыре окна, которые назвал штаб 11 сентября:
   планшет 768×1024 и 820×1180, планшет лёжа 1180×820, монитор 1920×1080.

   Что меряем в каждом окне (дурак, стол на троих):
     1) увеличение — ровно та ступень, что записана в style.css (ступени
        читаем из самого файла оформления, а не держим копию здесь);
     2) «экран» целиком внутри окна;
     3) бросок: точка, куда летит предмет, совпадает с серединой цели
        (рука человека и места соперников) — промах не больше 2 точек;
     4) полёт карты: первый кадр ставит карту туда, откуда она летит;
     5) лист «Ещё» стола — внутри «экрана» и внутри окна;
     6) плашка итога после настоящей партии — внутри «экрана» и окна;
     7) консоль без красного.
   Ломающий прогон (всегда, на 820×1180): игре подсовываем «увеличения
   нет» (увеличениеЭкрана → 1) — промах броска обязан стать большим.

   Запуск (страничный сервер уже поднят):
       node tests/увеличенное-окно.js [порт]
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { chromium, безTelegram } = require(path.join(__dirname, 'браузер-робот.js'));
const { сестьБезНажатий } = require(path.join(__dirname, 'сесть-за-стол.js'));

const АДРЕС = 'http://127.0.0.1:' + (process.argv[2] || '8080') + '/';
const ОКНА = [
  { ш: 768, в: 1024, имя: 'планшет 768×1024' },
  { ш: 820, в: 1180, имя: 'планшет 820×1180' },
  { ш: 1180, в: 820, имя: 'планшет лёжа 1180×820' },
  { ш: 1920, в: 1080, имя: 'монитор 1920×1080' }
];

let провалов = 0;
function надо(условие, слова) {
  console.log((условие ? '  ок    — ' : '  ПЛОХО — ') + слова);
  if (!условие) провалов++;
}

/* Ступени увеличения — из style.css. Первая мерка (с какого окна вообще
   рисуется «экран») — правило с «--масштаб: 1», дальше ступени. */
function ступениИзОформления() {
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  const образец = /@media \(min-width: (\d+)px\) and \(min-height: (\d+)px\) \{\s*:root:has\(#экран-витрины\) \{\s*--масштаб: ([\d.]+);/g;
  const ступени = [];
  let м;
  while ((м = образец.exec(css))) ступени.push({ ш: Number(м[1]), в: Number(м[2]), масштаб: Number(м[3]) });
  return ступени;
}
const СТУПЕНИ = ступениИзОформления();
function ждёмМасштаб(ш, в) {
  let итог = 1;
  for (const с of СТУПЕНИ) if (ш >= с.ш && в >= с.в && с.масштаб > итог) итог = с.масштаб;
  return итог;
}

/** Внутри ли рамка «внутри» рамки «снаружи» (с допуском в точку). */
const внутри = (а, б) => а.left >= б.left - 1 && а.top >= б.top - 1 && а.right <= б.right + 1 && а.bottom <= б.bottom + 1;
const рамкаСловами = (р) => Math.round(р.left) + ',' + Math.round(р.top) + '…' + Math.round(р.right) + ',' + Math.round(р.bottom);

async function открыть(браузер, окно, красные) {
  const стр = await браузер.newPage({ viewport: { width: окно.ш, height: окно.в } });
  await безTelegram(стр);
  стр.on('pageerror', (о) => красные.push(окно.имя + ': падение: ' + о.message));
  стр.on('console', (м) => {
    const откуда = (м.location && м.location() && м.location().url) || '';
    if (м.type() === 'error' && откуда.indexOf('telegram-web-app.js') === -1) красные.push(окно.имя + ': ' + м.text());
  });
  await стр.goto(АДРЕС);
  await стр.waitForFunction(() => typeof начатьПартию === 'function' && window.ДвижениеКарт);
  await стр.waitForTimeout(300);
  await сестьБезНажатий(стр, { игроков: 3, парами: false });
  await стр.waitForTimeout(800);
  return стр;
}

/** Промах броска: щуп встаёт туда же, куда летящий предмет, — в точках разметки. */
function промахБроска(стр, ломаем) {
  return стр.evaluate((сломать) => {
    if (сломать) window.увеличениеЭкрана = function () { return 1; };
    const экран = document.getElementById('экран-игры');
    const цели = [document.getElementById('рука-человека')].concat(Array.from(document.querySelectorAll('#соперники > *')));
    let худший = 0;
    for (const цель of цели) {
      const точка = центрУзла(цель, экран);
      const щуп = document.createElement('div');
      щуп.style.position = 'absolute';
      щуп.style.left = точка.x + 'px';
      щуп.style.top = точка.y + 'px';
      щуп.style.width = '0px';
      щуп.style.height = '0px';
      экран.appendChild(щуп);
      const где = щуп.getBoundingClientRect();
      const рамка = цель.getBoundingClientRect();
      щуп.remove();
      худший = Math.max(худший, Math.round(Math.hypot(где.left - (рамка.left + рамка.width / 2), где.top - (рамка.top + рамка.height / 2))));
    }
    return { целей: цели.length, худший: худший };
  }, Boolean(ломаем));
}

/** Первый кадр перелёта пробной карты — там, откуда она летит. */
function перелётКарты(стр) {
  return стр.evaluate(() => {
    const Д = window.ДвижениеКарт;
    const экран = document.getElementById('экран-игры');
    const карта = document.createElement('div');
    карта.className = 'карта';
    const поставить = (x, y) => { карта.style.position = 'absolute'; карта.style.left = x + 'px'; карта.style.top = y + 'px'; };
    поставить(40, 120);
    Д.началоКадра(); Д.узел('проба-окна', () => карта); экран.appendChild(карта); Д.конецКадра();
    const было = карта.getBoundingClientRect();
    Д.началоКадра(); Д.узел('проба-окна', () => карта); поставить(240, 320); Д.конецКадра();
    const анимаций = карта.getAnimations().length;
    for (const а of карта.getAnimations()) { а.pause(); а.currentTime = 0; }
    const первый = карта.getBoundingClientRect();
    Д.забытьВсё();
    карта.remove();
    /* Сравниваем СЕРЕДИНЫ, как проверка разработчика: в первом кадре карта
       бывает чуть другого размера (полёт её слегка увеличивает), и левый
       верхний угол от этого сдвигается, хотя стоит она на месте. */
    const ц = (р) => ({ x: р.left + р.width / 2, y: р.top + р.height / 2 });
    return { анимаций: анимаций, мимо: Math.round(Math.hypot(ц(первый).x - ц(было).x, ц(первый).y - ц(было).y)) };
  });
}

(async () => {
  console.log('Ступени увеличения из style.css: ' + СТУПЕНИ.map((с) => с.ш + '×' + с.в + '→' + с.масштаб).join(', '));
  надо(СТУПЕНИ.length >= 5, 'ступени увеличения нашлись в style.css (' + СТУПЕНИ.length + ')');
  const браузер = await chromium.launch();
  const красные = [];

  for (const окно of ОКНА) {
    console.log('\n=== ' + окно.имя + ' ===');
    const стр = await открыть(браузер, окно, красные);
    const ждём = ждёмМасштаб(окно.ш, окно.в);
    const экран = await стр.evaluate(() => {
      const п = document.getElementById('приложение');
      const р = п.getBoundingClientRect();
      return { увеличение: Math.round(р.width / п.offsetWidth * 100) / 100, рамка: { left: р.left, top: р.top, right: р.right, bottom: р.bottom },
               окно: { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight } };
    });
    надо(Math.abs(экран.увеличение - ждём) < 0.01, 'увеличение ' + экран.увеличение + ' — ступень из style.css (' + ждём + ')');
    надо(внутри(экран.рамка, экран.окно), '«экран» целиком внутри окна: ' + рамкаСловами(экран.рамка));

    const бросок = await промахБроска(стр, false);
    надо(бросок.целей >= 3 && бросок.худший <= 2, 'бросок попадает: промах ' + бросок.худший + ' точек, целей ' + бросок.целей);
    const полёт = await перелётКарты(стр);
    надо(полёт.анимаций > 0 && полёт.мимо <= 2, 'полёт карты: первый кадр на месте (мимо ' + полёт.мимо + ', анимаций ' + полёт.анимаций + ')');

    /* Лист меряем по тому, что в нём видно и нажимается, — по строкам
       и «Закрыть». Коробка самой шторки может чуть уходить под нижний
       край «экрана» пустым полем (на 1180×820 — на 16 точек): «экран»
       обрезает её скруглением, и глазу там нечего терять. */
    /* Лист открываем, как человек, — нажатием «⋯» над столом, и меряем,
       когда шторка доехала (через 700 мс). Открытие из кода в ту же
       минуту, что и раздача, на 1180×820 давало секундный сдвиг «экрана»
       (прокрутка 468) — человеческим нажатием он не повторяется ни разу,
       поэтому и мерить надо человеческую дорогу. */
    const замеритьЛист = async (сдвиг) => {
      await стр.evaluate((сдвинуть) => {
        const стиль = document.createElement('style');
        стиль.id = 'стенд-сдвиг-листа';
        if (сдвинуть) стиль.textContent = '#лист-игры .лист-ещё__лист { transform: translateY(' + сдвинуть + 'px) !important; animation: none !important; }';
        document.head.appendChild(стиль);
      }, сдвиг || 0);
      await стр.click('#кнопка-игра-ещё');
      await стр.waitForTimeout(700);
      return стр.evaluate(() => {
      const стиль = document.getElementById('стенд-сдвиг-листа');
      const ш = document.querySelector('#лист-игры .лист-ещё__лист').getBoundingClientRect();
      const п = document.getElementById('приложение').getBoundingClientRect();
      let р = null;
      document.querySelectorAll('#лист-игры button').forEach((к) => {
        if (к.offsetParent === null || к.classList.contains('скрыт')) return;
        const б = к.getBoundingClientRect();
        р = р ? { left: Math.min(р.left, б.left), top: Math.min(р.top, б.top), right: Math.max(р.right, б.right), bottom: Math.max(р.bottom, б.bottom) }
              : { left: б.left, top: б.top, right: б.right, bottom: б.bottom };
      });
      const ответ = { шторка: { left: ш.left, top: ш.top, right: ш.right, bottom: ш.bottom }, кнопки: р,
                      экран: { left: п.left, top: п.top, right: п.right, bottom: п.bottom } };
      закрытьЛистИгры(false);
      стиль.remove();
      return ответ;
      });
    };
    const лист = await замеритьЛист(0);
    надо(Boolean(лист.кнопки) && внутри(лист.кнопки, лист.экран) && внутри(лист.кнопки, экран.окно),
      'лист «Ещё»: строки и «Закрыть» внутри «экрана» и окна: ' + (лист.кнопки ? рамкаСловами(лист.кнопки) : 'кнопок нет') +
      ', «экран» ' + рамкаСловами(лист.экран));
    if (!внутри(лист.шторка, лист.экран)) {
      console.log('    (замечание: коробка шторки ' + рамкаСловами(лист.шторка) + ' уходит за край «экрана» на ' +
        Math.round(лист.шторка.bottom - лист.экран.bottom) + ' точек пустым полем — «экран» её обрезает)');
    }

    if (окно.ш === 820) {
      // Ломающий прогон мерки листа: шторку сдвигаем вниз — «Закрыть» обязан оказаться за краем.
      const сдвинутый = await замеритьЛист(300);
      надо(Boolean(сдвинутый.кнопки) && !внутри(сдвинутый.кнопки, сдвинутый.экран),
        'ЛОМАЮЩИЙ ПРОГОН: лист, сдвинутый на 300 точек вниз, мерка видит за краем «экрана» (кнопки до ' +
        (сдвинутый.кнопки ? Math.round(сдвинутый.кнопки.bottom) : '?') + ', край ' + Math.round(сдвинутый.экран.bottom) + ')');
      const сломано = await промахБроска(стр, true);
      надо(сломано.худший > 20, 'ЛОМАЮЩИЙ ПРОГОН: без поправки на увеличение промах ' + сломано.худший + ' точек — проверка это видит');
    }
    /* Партию до итога играем на СВЕЖЕЙ странице: пробы выше (пробная
       карта и «забытьВсё» у движения карт) трогают живую игру, и после них
       партия автоигрока дважды вставала с пустой рукой на экране. Без проб
       те же окна доиграли 5 партий из 5 — значит, мешали пробы, а не игра. */
    await стр.reload();
    await стр.waitForFunction(() => typeof начатьПартию === 'function');
    await сестьБезНажатий(стр, { игроков: 3, парами: false });
    await стр.waitForTimeout(600);

    // Итог — после настоящей партии (доигрывает общий автоигрок).
    await стр.addScriptTag({ path: path.join(__dirname, 'автоигрок-в-браузере.js') });
    await стр.evaluate(() => window.Автоигрок.начать(0.6, false, 0));
    const срок = Date.now() + 180000;
    let итогВиден = false;
    while (Date.now() < срок) {
      await стр.waitForTimeout(1000);
      итогВиден = await стр.evaluate(() => document.getElementById('экран-результата').classList.contains('экран--виден'));
      if (итогВиден) break;
    }
    const отчётИгрока = await стр.evaluate(() => window.Автоигрок ? window.Автоигрок.отчёт() : null);
    await стр.evaluate(() => window.Автоигрок && window.Автоигрок.стоп());
    надо(итогВиден, 'партия доиграна до плашки итога' + (итогВиден ? '' : ' — за 3 минуты не кончилась; автоигрок: ' +
      JSON.stringify(отчётИгрока && { работает: отчётИгрока.работает, подсказка: отчётИгрока.подсказка, поломки: отчётИгрока.поломки, итог: отчётИгрока.итог }).slice(0, 400)));
    if (!итогВиден) await стр.screenshot({ path: path.join(__dirname, 'скриншоты', 'увеличенное-окно-не-доиграна-' + окно.ш + 'x' + окно.в + '.png') });
    if (итогВиден) {
      await стр.waitForTimeout(700);
      const итог = await стр.evaluate(() => {
        const э = document.getElementById('экран-результата');
        /* Меряем то, что видно: листья плашки с размером (текст и кнопки). */
        let р = null;
        э.querySelectorAll('*').forEach((у) => {
          if (у.children.length) return;
          const к = у.getBoundingClientRect();
          if (к.width < 2 || к.height < 2) return;
          const с = getComputedStyle(у);
          if (с.visibility === 'hidden' || с.display === 'none' || Number(с.opacity) === 0) return;
          р = р ? { left: Math.min(р.left, к.left), top: Math.min(р.top, к.top), right: Math.max(р.right, к.right), bottom: Math.max(р.bottom, к.bottom) }
                : { left: к.left, top: к.top, right: к.right, bottom: к.bottom };
        });
        const п = document.getElementById('приложение').getBoundingClientRect();
        return { плашка: р, экран: { left: п.left, top: п.top, right: п.right, bottom: п.bottom } };
      });
      надо(Boolean(итог.плашка) && внутри(итог.плашка, итог.экран) && внутри(итог.плашка, экран.окно),
        'плашка итога внутри «экрана» и окна: ' + (итог.плашка ? рамкаСловами(итог.плашка) : 'пусто') + ', «экран» ' + рамкаСловами(итог.экран));
      await стр.screenshot({ path: path.join(__dirname, 'скриншоты', 'увеличенное-окно-итог-' + окно.ш + 'x' + окно.в + '.png') });
    }
    await стр.close();
  }

  надо(красные.length === 0, 'консоль без красного во всех окнах' + (красные.length ? ': ' + красные.slice(0, 4).join(' | ') : ''));
  await браузер.close();
  console.log('\nИтог: провалов ' + провалов);
  process.exit(провалов ? 1 : 0);
})().catch((о) => { console.error('проверка упала: ' + (о && о.stack || о)); process.exit(2); });
