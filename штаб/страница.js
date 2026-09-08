/* Сборка страницы дашборда из добытых данных.

   Оформление (цвета, шрифты, раскладка, тёмная и светлая тема) взято
   один в один с той страницы штаба, которую владелец уже видел и одобрил.
   Своего вида здесь не выдумано — только числа заменены на настоящие.

   Страница собирается на этой стороне, а не в браузере. Так рисование
   живёт в одном месте: браузеру достаточно раз в 15 секунд забрать готовый
   кусок разметки и подставить его. */

'use strict';

const сбор = require('./сбор.js');

/** Любой текст, попадающий в разметку, обезвреживаем — мало ли что в задаче. */
function э(текст) {
  return String(текст === null || текст === undefined ? '' : текст)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Слово с правильным окончанием: 1 задача, 2 задачи, 5 задач. */
function счётСловом(число, одна, две, много) {
  const сотня = число % 100;
  const десяток = число % 10;
  if (сотня >= 11 && сотня <= 14) return число + ' ' + много;
  if (десяток === 1) return число + ' ' + одна;
  if (десяток >= 2 && десяток <= 4) return число + ' ' + две;
  return число + ' ' + много;
}

const ОФОРМЛЕНИЕ = `
  :root {
    --ground:      #F2F5F1;
    --surface:     #FFFFFF;
    --surface-2:   #EAEFE9;
    --ink:         #141E19;
    --ink-soft:    #3B4A42;
    --muted:       #64756B;
    --line:        #D6DED8;
    --line-soft:   #E4EAE4;

    --sukno:       #1E6B4A;
    --sukno-soft:  #E2EEE7;
    --chervi:      #A62A30;
    --chervi-soft: #F7E4E4;
    --yantar:      #A66A16;
    --yantar-soft: #F8EAD6;

    --shadow: 0 1px 2px rgba(20,30,25,.06), 0 8px 24px -16px rgba(20,30,25,.25);
    --radius: 10px;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground:      #0E1411;
      --surface:     #161E19;
      --surface-2:   #1D2620;
      --ink:         #E6EDE7;
      --ink-soft:    #C2CFC6;
      --muted:       #8B9C91;
      --line:        #27332C;
      --line-soft:   #202A24;
      --sukno:       #55B98A;
      --sukno-soft:  #163024;
      --chervi:      #E5787C;
      --chervi-soft: #331B1C;
      --yantar:      #D9A055;
      --yantar-soft: #33270F;
      --shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 28px -18px rgba(0,0,0,.8);
    }
  }

  :root[data-theme="dark"] {
    --ground:      #0E1411;
    --surface:     #161E19;
    --surface-2:   #1D2620;
    --ink:         #E6EDE7;
    --ink-soft:    #C2CFC6;
    --muted:       #8B9C91;
    --line:        #27332C;
    --line-soft:   #202A24;
    --sukno:       #55B98A;
    --sukno-soft:  #163024;
    --chervi:      #E5787C;
    --chervi-soft: #331B1C;
    --yantar:      #D9A055;
    --yantar-soft: #33270F;
    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 28px -18px rgba(0,0,0,.8);
  }

  * { box-sizing: border-box; }

  body {
    background: var(--ground);
    color: var(--ink);
    font-family: "Alegreya Sans", "Segoe UI", system-ui, sans-serif;
    font-size: 17px;
    line-height: 1.5;
    margin: 0;
    padding: 0 20px 72px;
    -webkit-font-smoothing: antialiased;
    overflow-wrap: anywhere;
  }

  .лист { max-width: 1060px; margin: 0 auto; }

  .шапка {
    display: flex; flex-wrap: wrap; align-items: flex-end;
    justify-content: space-between; gap: 16px;
    padding: 40px 0 22px;
    border-bottom: 2px solid var(--ink);
  }
  h1 {
    font-family: "Alegreya", Georgia, serif;
    font-weight: 800; font-size: clamp(30px, 5vw, 44px);
    line-height: 1.05; margin: 0; letter-spacing: -.01em;
    text-wrap: balance;
  }
  .подзаголовок { color: var(--muted); font-size: 16px; margin: 6px 0 0; max-width: 52ch; }
  .отметка-времени {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 12.5px; color: var(--muted);
    text-align: right; line-height: 1.7;
  }
  .отметка-времени b { color: var(--ink-soft); font-weight: 700; }

  .сводка {
    display: grid; gap: 1px; margin: 0 0 40px;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    background: var(--line); border-bottom: 1px solid var(--line);
  }
  .число { background: var(--ground); padding: 20px 4px 22px; }
  .число strong {
    display: block; font-family: "JetBrains Mono", monospace;
    font-size: 40px; font-weight: 700; line-height: 1;
    font-variant-numeric: tabular-nums; letter-spacing: -.03em;
  }
  .число span {
    display: block; margin-top: 8px; font-size: 13px;
    text-transform: uppercase; letter-spacing: .07em; color: var(--muted);
  }
  .число--сукно strong { color: var(--sukno); }
  .число--янтарь strong { color: var(--yantar); }
  .число--червь strong { color: var(--chervi); }

  section { margin: 0 0 44px; }
  h2 {
    font-family: "Alegreya", Georgia, serif;
    font-size: 25px; font-weight: 700; margin: 0 0 4px;
    display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
  }
  h2 .счёт {
    font-family: "JetBrains Mono", monospace; font-size: 14px;
    font-weight: 400; color: var(--muted); font-variant-numeric: tabular-nums;
  }
  .пояснение { color: var(--muted); font-size: 15px; margin: 0 0 18px; max-width: 68ch; }
  .пояснение b { color: var(--ink-soft); }

  .работы { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
  .работа {
    background: var(--surface); border: 1px solid var(--line);
    border-radius: var(--radius); border-left: 4px solid var(--sukno);
    padding: 16px 18px; box-shadow: var(--shadow);
    display: flex; flex-direction: column; gap: 8px;
  }
  .работа--горит { border-left-color: var(--chervi); }
  .работа--скоро { border-left-color: var(--yantar); }
  .работа h3 { font-size: 18px; font-weight: 700; margin: 0; line-height: 1.3; font-family: "Alegreya Sans", sans-serif; }
  .работа p { margin: 0; font-size: 15px; color: var(--ink-soft); }
  .низ-карточки {
    display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center;
    margin-top: auto; padding-top: 6px; font-size: 13.5px; color: var(--muted);
  }
  .кто { font-weight: 700; color: var(--ink-soft); }
  .срок { font-family: "JetBrains Mono", monospace; font-size: 12.5px; }

  /* Признак жизни исполнителя. Зелёный — файл его записей растёт прямо
     сейчас, красный — давно не менялся, серый — проверить не вышло. */
  .признак {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 2px 9px; border-radius: 999px; font-weight: 700; font-size: 12.5px;
    background: var(--surface-2); color: var(--muted);
  }
  .признак::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex: none; }
  .признак--работает { background: var(--sukno-soft); color: var(--sukno); }
  .признак--тихо { background: var(--yantar-soft); color: var(--yantar); }
  .признак--встал { background: var(--chervi-soft); color: var(--chervi); }

  /* Возраст списка — крупно и всегда, потому что именно этого не хватало:
     отличить «ничего не происходит» от «мне забыли сказать». */
  .свежесть {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px;
    background: var(--surface); border: 1px solid var(--line);
    border-left: 4px solid var(--sukno); border-radius: var(--radius);
    padding: 14px 18px; margin: 0 0 22px; box-shadow: var(--shadow);
  }
  .свежесть--старый { border-color: var(--chervi); border-left-color: var(--chervi); background: var(--chervi-soft); }
  .свежесть strong { font-size: 19px; font-family: "Alegreya Sans", sans-serif; color: var(--ink); }
  .свежесть--старый strong { color: var(--chervi); }
  .свежесть span { color: var(--muted); font-size: 14.5px; }

  .тревога {
    background: var(--chervi-soft); border: 1px solid var(--chervi);
    border-radius: var(--radius); padding: 16px 18px; margin: 0 0 28px;
  }
  .тревога h2 { color: var(--chervi); margin-bottom: 8px; }
  .тревога p { margin: 0 0 8px; font-size: 15.5px; color: var(--ink-soft); }
  .тревога ul { margin: 0; padding-left: 20px; font-size: 15px; color: var(--ink-soft); }
  .тревога .порт { font-family: "JetBrains Mono", monospace; font-size: 13px; }

  .очередь { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .очередь li {
    display: grid; grid-template-columns: 34px 1fr auto; gap: 14px; align-items: baseline;
    padding: 13px 4px 13px 10px; border-bottom: 1px solid var(--line-soft);
    border-left: 3px solid transparent;
  }
  .очередь li:first-child { border-top: 1px solid var(--line-soft); }
  .очередь li.горит { border-left-color: var(--chervi); }
  .очередь li.скоро { border-left-color: var(--yantar); }
  .очередь li.потом { border-left-color: var(--line); }
  .номер {
    font-family: "JetBrains Mono", monospace; font-size: 13px;
    color: var(--muted); font-variant-numeric: tabular-nums;
  }
  .задача { font-size: 16px; }
  .задача em { display: block; font-style: normal; font-size: 14px; color: var(--muted); margin-top: 3px; }
  .метка {
    font-size: 12px; letter-spacing: .05em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 999px; white-space: nowrap; font-weight: 700;
  }
  .метка--горит { background: var(--chervi-soft); color: var(--chervi); }
  .метка--скоро { background: var(--yantar-soft); color: var(--yantar); }
  .метка--потом { background: var(--surface-2); color: var(--muted); }
  .метка--задел { background: transparent; color: var(--muted); border: 1px solid var(--line); }

  /* Вопросы владельцу. Нарочно не похожи на задачи: это не наш долг,
     а ожидание его слова. */
  .вопросы { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .вопросы li {
    background: var(--yantar-soft); border: 1px solid var(--yantar);
    border-radius: var(--radius); padding: 14px 16px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .вопрос-о { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--yantar); font-weight: 700; }
  .вопрос-сам { font-size: 17px; font-weight: 700; color: var(--ink); font-family: "Alegreya Sans", sans-serif; }
  .вопрос-зачем { font-size: 14.5px; color: var(--ink-soft); }

  .проверьте { display: block; font-style: normal; font-size: 13.5px; color: var(--yantar); margin-top: 4px; }

  .лента { list-style: none; margin: 0; padding: 0; }
  .лента li {
    display: grid; grid-template-columns: 62px 1fr; gap: 16px;
    padding: 11px 4px; border-bottom: 1px solid var(--line-soft); align-items: baseline;
  }
  .лента li:first-child { border-top: 1px solid var(--line-soft); }
  .метка-версии {
    font-family: "JetBrains Mono", monospace; font-size: 12.5px; color: var(--sukno);
    font-variant-numeric: tabular-nums;
  }
  .лента .что { font-size: 15.5px; }
  .лента .не-выложено {
    display: inline-block; margin-left: 8px; font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .05em;
    background: var(--chervi-soft); color: var(--chervi);
    padding: 2px 8px; border-radius: 999px;
  }

  .службы { display: flex; flex-wrap: wrap; gap: 10px; }
  .служба {
    display: flex; align-items: center; gap: 9px;
    background: var(--surface); border: 1px solid var(--line);
    border-radius: 999px; padding: 8px 15px 8px 12px; font-size: 14.5px;
  }
  .огонёк { width: 9px; height: 9px; border-radius: 50%; background: var(--sukno); flex: none; }
  .служба--стоит .огонёк { background: var(--chervi); }
  .служба--неизвестно .огонёк { background: var(--muted); }
  .служба .порт { font-family: "JetBrains Mono", monospace; font-size: 12.5px; color: var(--muted); }

  .сноска {
    margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--line);
    color: var(--muted); font-size: 14.5px; max-width: 70ch;
  }
  .сноска b { color: var(--ink-soft); }

  @media (max-width: 620px) {
    body { padding: 0 14px 60px; }
    .шапка { padding-top: 26px; }
    .отметка-времени { text-align: left; }
    .лента li { grid-template-columns: 1fr; gap: 2px; }
    .очередь li { grid-template-columns: 26px 1fr; }
    .очередь .метка { grid-column: 2; justify-self: start; margin-top: 4px; }
    .работы { grid-template-columns: 1fr; }
  }
`;

/* ---------------------------------------------------------------------------
   Куски страницы
--------------------------------------------------------------------------- */

function шапка(данные) {
  const время = данные.собрано;
  const часы = сбор.часыМинуты(время) + ':' + String(время.getSeconds()).padStart(2, '0');
  const сегодняВсего = данные.публикации.сегодня.length;
  const ждут = данные.публикации.ждутОтправки.length;

  // Когда штаб последний раз трогал список задач: по этой строке видно,
  // отстаёт ли список от жизни — а именно с этим и была беда.
  // Время берётся у самого файла, а не со слов штаба.
  const свежесть = данные.свежесть;
  const списокПравился = свежесть && свежесть.есть
    ? '<br>список правился: <b>' + э(сбор.часыМинуты(new Date(свежесть.самоеСвежее))) + '</b>'
      + ' (' + э(свежесть.давность) + ' назад)'
    : '<br>когда правили список — <b>неизвестно</b>';

  return `
  <header class="шапка">
    <div>
      <h1>Штаб BoardGames</h1>
      <p class="подзаголовок">Что делается прямо сейчас, что уже у игроков в Telegram и что стоит в очереди. Страница собирается программой и обновляется сама каждые 15 секунд.</p>
    </div>
    <div class="отметка-времени">
      обновлено <b>${э(сбор.деньСловами(время))}, ${э(часы)}</b><br>
      исполнителей в работе: <b>${данные.задачи.вРаботе.length}</b><br>
      записей за день: <b>${сегодняВсего}</b>${ждут ? '<br>ждут отправки: <b>' + ждут + '</b>' : ''}${списокПравился}
    </div>
  </header>`;
}

function сводка(данные) {
  const сегодня = данные.публикации.сегодня;
  const ждут = данные.публикации.ждутОтправки.length;
  const уИгроков = сегодня.filter(function (з) { return з.выложено !== false; }).length;

  return `
  <div class="сводка">
    <div class="число число--сукно"><strong>${уИгроков}</strong><span>уехало сегодня</span></div>
    <div class="число"><strong>${данные.задачи.вРаботе.length}</strong><span>в работе</span></div>
    <div class="число"><strong>${данные.задачи.очередь.length}</strong><span>в очереди</span></div>
    <div class="число число--янтарь"><strong>${(данные.задачи.вопросы || []).length}</strong><span>ждут вашего слова</span></div>
    <div class="число ${ждут ? 'число--червь' : ''}"><strong>${ждут}</strong><span>ждут отправки</span></div>
  </div>`;
}

/**
 * Возраст списка — первое, что видно на странице.
 * Владелец дважды ловил неправду не потому, что дашборд считал плохо, а
 * потому, что список отставал от жизни и об этом нигде не было сказано.
 * Теперь сказано всегда, и время взято у файла, а не со слов штаба.
 */
function блокСвежесть(данные) {
  const с = данные.свежесть;

  if (!с || !с.есть) {
    return '<div class="свежесть свежесть--старый">'
      + '<strong>Возраст списка неизвестен</strong>'
      + '<span>ни ЗАДАЧИ.md, ни штаб/в-работе.json не удалось спросить о времени правки — значит про свежесть сказать нечего.</span>'
      + '</div>';
  }

  const час = э(сбор.часыМинуты(new Date(с.самоеСвежее)));

  if (с.устарел) {
    return '<div class="свежесть свежесть--старый">'
      + '<strong>Список не обновлялся ' + э(с.давность) + ' — ему можно не верить</strong>'
      + '<span>Последняя правка в ' + час + '. Всё, что ниже про задачи, с тех пор могло измениться: '
      + 'дела могли сдать, а новые — не записать.</span>'
      + '</div>';
  }

  return '<div class="свежесть">'
    + '<strong>Список свежий: правился ' + э(с.давность) + ' назад</strong>'
    + '<span>в ' + час + '. Время взято у самого файла, а не со слов штаба.</span>'
    + '</div>';
}

/** Заметный блок: закоммичено, но игроки этого ещё не видят. */
function блокНеОпубликовано(данные) {
  const ждут = данные.публикации.ждутОтправки;
  const сайт = данные.сайт;
  const расхождения = сайт.расхождения || [];

  if (!ждут.length && !расхождения.length && сайт.доступен !== false) return '';

  let куски = '<div class="тревога">';
  куски += '<h2>Не опубликовано</h2>';

  if (!сайт.доступен) {
    куски += '<p>Сайт игроков не удалось спросить: ' + э(сайт.беда || 'нет ответа') + '. Значит про версии сейчас сказать нечего — это не то же самое, что «всё в порядке».</p>';
  }

  if (расхождения.length) {
    куски += '<p>На сайте лежит не то, что на этом компьютере. Пока номера не сойдутся, игроки видят старую игру:</p><ul>';
    for (const р of расхождения) {
      куски += '<li>' + э(р.имя) + ': <span class="порт">тут v' + э(р.тут) + ' · у игроков ' + (р.там === null ? 'нет вовсе' : 'v' + э(р.там)) + '</span></li>';
    }
    куски += '</ul>';
  }

  if (ждут.length) {
    куски += '<p>' + счётСловом(ждут.length, 'запись', 'записи', 'записей') + ' сделана, но наружу не отправлена — коммит публикацией не считается:</p><ul>';
    for (const з of ждут.slice(0, 8)) {
      куски += '<li><span class="порт">' + э(сбор.часыМинуты(з.дата)) + '</span> ' + э(з.что) + '</li>';
    }
    куски += '</ul>';
  }

  куски += '</div>';
  return куски;
}

/** Кружок «работает / молчит» — добытый признак, а не слова штаба. */
function значокЖивости(живость) {
  if (!живость) return '';
  const известные = { 'работает': ' признак--работает', 'тихо': ' признак--тихо', 'встал': ' признак--встал' };
  const класс = известные[живость.состояние] || '';
  return '<span class="признак' + класс + '">' + э(живость.слова) + '</span>';
}

function блокВРаботе(данные) {
  const задачи = данные.задачи.вРаботе;
  const исполнители = данные.исполнители;

  let карточки = '';
  if (!задачи.length) {
    карточки = '<p class="пояснение">В разделе «В работе прямо сейчас» файла ЗАДАЧИ.md пусто. Либо все свободны, либо штаб не записал задачи — обе причины стоит проверить.</p>';
  } else {
    карточки = '<div class="работы">';
    for (const з of задачи) {
      const классУровня = з.уровень === 'горит' ? ' работа--горит' : (з.уровень === 'скоро' ? ' работа--скоро' : '');
      let низ = значокЖивости(з.живость);
      if (з.кто) низ += '<span class="кто">' + э(з.кто) + '</span>';
      if (з.идёт) низ += '<span class="срок">идёт ' + э(з.идёт) + '</span>';
      else if (з.начатоТекст) низ += '<span class="срок">начато ' + э(з.начатоТекст) + '</span>';
      if (з.оценка) низ += '<span class="срок">оценка ' + э(з.оценка) + '</span>';
      карточки += '<article class="работа' + классУровня + '">'
        + '<h3>' + э(з.что) + '</h3>'
        + '<div class="низ-карточки">' + низ + '</div>'
        + '</article>';
    }
    карточки += '</div>';
  }

  // Правда о живости, которую видно и без записей штаба: сколько файлов
  // исполнителей растёт прямо сейчас. Если тут есть кто-то лишний — значит
  // работа идёт, а в списке её нет.
  let проЗаписи = '';
  if (!исполнители || !исполнители.найдена) {
    проЗаписи = '<p class="пояснение">Признак жизни показать нечем: '
      + э((исполнители && исполнители.беда) || 'папка с записями исполнителей не найдена')
      + '. Это не «все встали» — это «проверить не удалось».</p>';
  } else {
    const лишние = исполнители.прочиеЖивые || [];
    проЗаписи = '<p class="пояснение">Признак жизни добыт сам: файл записей исполнителя растёт, пока он работает. '
      + 'Зелёный — правился меньше двух минут назад, жёлтый — притих, красный — молчит больше десяти минут.';
    if (лишние.length) {
      проЗаписи += ' <b>Растут ещё ' + счётСловом(лишние.length, 'запись', 'записи', 'записей')
        + ', не привязанных к списку</b> — либо это фоновые дела, либо кто-то работает, а штаб его не записал.';
    }
    проЗаписи += '</p>';
  }

  return `
  <section>
    <h2>Сейчас в работе <span class="счёт">${счётСловом(задачи.length, 'исполнитель', 'исполнителя', 'исполнителей')}</span></h2>
    <p class="пояснение">Каждый работает в своих файлах: двое в одном файле никогда не сидят — иначе они затирают друг друга. «Идёт» — это сколько времени прошло с начала работы, а не обещание срока.</p>
    ${проЗаписи}
    ${карточки}
  </section>`;
}

/**
 * Вопросы к владельцу — отдельно от очереди и нарочно заметно.
 * Владелец видел «девять задач висят», а три из них были не задачами, а
 * вопросами к нему самому. Они не двигались не потому, что мы ленимся, —
 * и выглядеть долгом команды не должны.
 */
function блокВопросы(данные) {
  const вопросы = (данные.задачи && данные.задачи.вопросы) || [];
  if (!вопросы.length) return '';

  let строки = '';
  for (const в of вопросы) {
    строки += '<li>'
      + '<span class="вопрос-о">' + э(в.что) + '</span>'
      + '<span class="вопрос-сам">' + э(в.вопрос) + '</span>'
      + (в.заметка ? '<span class="вопрос-зачем">' + э(в.заметка) + '</span>' : '')
      + '</li>';
  }

  return `
  <section>
    <h2>Ждём вашего слова <span class="счёт">${счётСловом(вопросы.length, 'вопрос', 'вопроса', 'вопросов')}</span></h2>
    <p class="пояснение">Это не наши задачи и не долг команды: работы тут на несколько строк, но решать должны вы — игра ваша. Пока ответа нет, они стоят, и стоят не по нашей лени. Ответите одним словом — уедут в работу.</p>
    <ul class="вопросы">${строки}</ul>
  </section>`;
}

function блокОчередь(данные) {
  const очередь = данные.задачи.очередь;
  const горит = очередь.filter(function (з) { return з.уровень === 'горит'; }).length;
  const скоро = очередь.filter(function (з) { return з.уровень === 'скоро'; }).length;

  let строки = '';
  let сПодсказкой = 0;
  очередь.forEach(function (з, номер) {
    const классСтроки = з.уровень === 'задел' ? '' : ' class="' + з.уровень + '"';
    const заметка = з.заметка ? '<em>' + э(з.заметка) + '</em>' : '';
    // Подсказку про похожую запись git ставим отдельной строкой: это повод
    // проверить, а не приговор — вычёркивать по совпадению слов нельзя.
    let подсказка = '';
    if (з.подсказка) {
      сПодсказкой += 1;
      подсказка = '<em class="проверьте">' + э(з.подсказка) + '</em>';
    }
    строки += '<li' + классСтроки + '>'
      + '<span class="номер">' + String(номер + 1).padStart(2, '0') + '</span>'
      + '<span class="задача">' + э(з.что) + заметка + подсказка + '</span>'
      + '<span class="метка метка--' + з.уровень + '">' + э(з.уровень) + '</span>'
      + '</li>';
  });

  const счёт = очередь.length
    ? счётСловом(очередь.length, 'задача', 'задачи', 'задач') + ' · горит ' + горит + ' · скоро ' + скоро
    : 'пусто';

  // Сторож: за день много записей git, а список очереди никто не тронул.
  const сторож = данные.сторожОчереди;
  const тревога = сторож
    ? '<p class="пояснение"><b>⚠️ Очередь могла отстать.</b> За сутки сделано '
      + счётСловом(сторож.записей, 'запись', 'записи', 'записей')
      + ', а список очереди не правился ' + сторож.часов + ' ч. Похоже, сделанное не вычеркнули.</p>'
    : '';

  const проПодсказки = сПодсказкой
    ? '<p class="пояснение">У ' + счётСловом(сПодсказкой, 'пункта', 'пунктов', 'пунктов')
      + ' стоит пометка «проверьте»: в записях git встретилось похожее по словам. Это только повод посмотреть — вычёркивать по совпадению слов программа не станет.</p>'
    : '';

  const пусто = !очередь.length
    ? '<p class="пояснение">Очередь пуста: всё, что в ней было, программа опознала как сделанное. Если вы ждёте чего-то ещё — скажите, этого просто нет в списке.</p>'
    : '';

  return `
  <section>
    <h2>Очередь <span class="счёт">${э(счёт)}</span></h2>
    <p class="пояснение">Четыре уровня. <b>Горит</b> — игрок видит поломку, берём немедленно. <b>Скоро</b> — вы ждёте, спросите на днях. <b>Потом</b> — нужное, но никто не ждёт. <b>Задел</b> — пригодится, когда вырастем. Сделанное вычёркивается программой по следу в коде, а не по памяти штаба.</p>
    ${тревога}${проПодсказки}${пусто}
    <ol class="очередь">${строки}</ol>
  </section>`;
}

function блокСегодня(данные) {
  const сегодня = данные.публикации.сегодня;

  let строки = '';
  for (const з of сегодня) {
    const пометка = з.выложено === false ? '<span class="не-выложено">ещё не у игроков</span>' : '';
    строки += '<li>'
      + '<span class="метка-версии">' + э(сбор.часыМинуты(з.дата)) + '</span>'
      + '<span class="что">' + э(з.что) + пометка + '</span>'
      + '</li>';
  }
  if (!строки) строки = '<li><span class="метка-версии">—</span><span class="что">сегодня записей ещё не было</span></li>';

  let раньше = '';
  if (данные.публикации.прошлыеДни.length) {
    раньше = '<p class="пояснение">Раньше: '
      + данные.публикации.прошлыеДни.map(function (д) {
        return э(д.день) + ' — ' + счётСловом(д.число, 'запись', 'записи', 'записей');
      }).join(' · ')
      + '.</p>';
  }

  const версии = (данные.сайт.версии || []).map(function (в) {
    return э(в.имя) + ' v' + (в.там === null ? '?' : э(в.там));
  }).join(', ');

  const проВерсии = данные.сайт.доступен
    ? '<p class="пояснение">Прямо сейчас сайт игроков отдаёт: <b>' + версии + '</b>'
      + (данные.сайт.расхождения.length ? ' — и это <b>не совпадает</b> с тем, что на компьютере.' : ' — то же самое, что и на этом компьютере.') + '</p>'
    : '<p class="пояснение">Сайт игроков сейчас не отвечает, версии показать нечем.</p>';

  return `
  <section>
    <h2>Сегодня уехало к игрокам <span class="счёт">${счётСловом(сегодня.length, 'запись', 'записи', 'записей')}</span></h2>
    ${проВерсии}
    <ul class="лента">${строки}</ul>
    ${раньше}
  </section>`;
}

function блокСлужбы(данные) {
  const с = данные.службы;

  function огонёк(имя, служба) {
    const класс = служба.жива === true ? '' : (служба.жива === false ? ' служба--стоит' : ' служба--неизвестно');
    return '<span class="служба' + класс + '"><span class="огонёк"></span>' + э(имя)
      + ' <span class="порт">' + э(служба.подпись) + '</span></span>';
  }

  const сайт = данные.сайт.доступен
    ? { жива: данные.сайт.расхождения.length === 0, подпись: данные.сайт.расхождения.length ? 'отстаёт' : 'свежий' }
    : { жива: false, подпись: 'не отвечает' };

  return `
  <section>
    <h2>Службы</h2>
    <p class="пояснение">Игра открывается всегда — она лежит в интернете. А игра вдвоём, приглашения и список знакомых работают, только пока включён ваш компьютер. Серый огонёк — не смог проверить, это не «работает».</p>
    <div class="службы">
      ${огонёк('Сервер комнат', с.комнаты)}
      ${огонёк('Страница игры', с.страницаИгры)}
      ${огонёк('Бот', с.бот)}
      ${огонёк('Туннель наружу', с.туннель)}
      ${огонёк('Сайт игры', сайт)}
    </div>
  </section>`;
}

function сноска(данные) {
  const беда = данные.задачи.беда
    ? '<br><br><b>Со списком задач беда.</b> ' + э(данные.задачи.беда) + ' Пока это не поправят в ЗАДАЧИ.md, разделы выше будут неполными.'
    : '';

  return `
  <p class="сноска">
    <b>Откуда числа.</b> Часы публикаций — из самих записей git, а не из чьей-то памяти. Списки задач — из файла ЗАДАЧИ.md, который ведёт штаб. Огоньки служб — настоящий запрос к каждой службе и список запущенных программ. Версии у игроков — ответ сайта на github.io, спрошенный заново.
    <br><br>
    <b>Про «работает» и «молчит».</b> Это единственное, что дашборд узнаёт вообще без участия штаба. У каждого запущенного исполнителя есть файл с его записями, и он растёт, пока тот работает. Мы смотрим только на время правки этого файла — в него самого не заглядываем. Поэтому «молчит 20 минут» соврать нельзя: либо файл менялся, либо нет.
    <br><br>
    <b>Про очередь и вычёркивание.</b> Сделанное вычёркивает программа, а не память штаба. У каждого пункта записана примета: какой файл или какая строка в коде появится, когда дело будет готово. Примета сработала — пункт уезжает в «Готово» со временем из записей git. Отдельно программа ищет в записях похожее по словам и ставит пометку «проверьте» — но сама по такому совпадению ничего не вычёркивает: на живых записях этот способ ошибался, слов «брызги» и «анимация» в коммитах не было вовсе.
    <br><br>
    <b>Про возраст списка.</b> Верхняя полоса показывает, когда список правили в последний раз, — время взято у файла. Старше получаса — полоса краснеет: значит перед вами могут быть вчерашние сведения, и лучше переспросить, чем поверить.
    <br><br>
    <b>Про время.</b> Обещанных сроков тут нет нарочно: программа не умеет их угадывать, а угаданные однажды уже наврали на три часа. Показано только то, что можно посчитать: сколько задача уже идёт. Если штаб напишет в ЗАДАЧИ.md оценку вида «≈ 40 мин», она появится на карточке.
    <br><br>
    <b>Про «не опубликовано».</b> Коммит — ещё не публикация: игроки видят только отправленное на сайт. Красный блок сверху появляется, когда номера версий на сайте разошлись с домашними или когда записи не отправлены.${беда}
  </p>`;
}

/** Всё содержимое листа — то, что браузер подменяет раз в 15 секунд. */
function внутренности(данные) {
  return шапка(данные)
    + блокСвежесть(данные)
    + сводка(данные)
    + блокНеОпубликовано(данные)
    + блокВРаботе(данные)
    + блокВопросы(данные)
    + блокОчередь(данные)
    + блокСегодня(данные)
    + блокСлужбы(данные)
    + сноска(данные);
}

/** Целая страница — её браузер получает один раз, при открытии. */
function целаяСтраница(данные) {
  return `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Штаб BoardGames</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:wght@500;700;800&family=Alegreya+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap">
<style>${ОФОРМЛЕНИЕ}</style>

<div class="лист">${внутренности(данные)}</div>

<script>
  // Обновляемся раз в 15 секунд: забираем у сервера готовый кусок разметки
  // и подменяем содержимое листа. Так место, где страница прокручена,
  // не сбрасывается — а при полной перезагрузке телефон каждый раз
  // прыгал бы в начало.
  var ШАГ_МС = 15000;

  async function обновить() {
    try {
      var ответ = await fetch('/кусок', { cache: 'no-store' });
      if (!ответ.ok) return;
      var разметка = await ответ.text();
      document.querySelector('.лист').innerHTML = разметка;
    } catch (ошибка) {
      // Сервер моргнул или его перезапускают — молча ждём следующей попытки.
    }
  }

  setInterval(обновить, ШАГ_МС);
  // Вернулись к вкладке — не ждём своей очереди, обновляемся сразу.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) обновить();
  });
</script>
</html>`;
}

module.exports = {
  целаяСтраница: целаяСтраница,
  внутренности: внутренности
};
