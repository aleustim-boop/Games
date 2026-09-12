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

/** «7 мин», «2 ч 10 мин» — время по-человечески, а не числом минут. */
function длительностьСловами(мин) {
  if (мин === null || мин === undefined) return '';
  if (мин < 60) return мин + ' мин';
  const часов = Math.floor(мин / 60);
  const остаток = мин % 60;
  if (часов < 24) return остаток ? часов + ' ч ' + остаток + ' мин' : часов + ' ч';
  return Math.floor(часов / 24) + ' дн';
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
  .свежесть .расхождения {
    flex-basis: 100%; margin: 2px 0 4px; padding-left: 20px;
    font-size: 15px; color: var(--ink-soft);
  }
  .свежесть .расхождения li { margin-bottom: 4px; }

  /* Тихая строка: список сходится с правдой, сказать нечего, кроме часов. */
  .пересобрано {
    display: flex; align-items: center; gap: 8px;
    margin: 0 0 22px; font-size: 14.5px; color: var(--muted);
  }
  .пересобрано::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--sukno); flex: none; }

  /* Кнопка «Задания для ChatGPT» — первое, что видно на главной.
     Крупная, во всю ширину: по ней попадают пальцем с телефона. */
  .кнопка-заданий {
    display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 14px;
    margin: 20px 0 0; padding: 16px 18px 16px 20px; min-height: 72px;
    background: var(--sukno); color: var(--ground); text-decoration: none;
    border-radius: var(--radius); box-shadow: var(--shadow);
  }
  .кнопка-заданий__имя { font-size: 21px; font-weight: 700; line-height: 1.2; }
  .кнопка-заданий__число {
    grid-column: 2; grid-row: 1 / span 2;
    font-family: "JetBrains Mono", monospace; font-size: 28px; font-weight: 700;
    min-width: 54px; padding: 6px 12px; text-align: center; border-radius: 999px;
    background: rgba(255,255,255,.2);
  }
  .кнопка-заданий__пояснение { font-size: 14.5px; opacity: .9; }
  .кнопка-заданий--пусто { background: var(--surface); color: var(--ink); border: 1px solid var(--line); }
  .кнопка-заданий--пусто .кнопка-заданий__число { background: var(--surface-2); color: var(--muted); }

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
    border-bottom: 1px solid var(--line-soft);
    border-left: 3px solid transparent;
  }
  .очередь li:first-child { border-top: 1px solid var(--line-soft); }
  .очередь li.горит { border-left-color: var(--chervi); }
  .очередь li.скоро { border-left-color: var(--yantar); }
  .очередь li.потом { border-left-color: var(--line); }
  /* Пункт очереди — строка-оглавление (summary), подробности раскрываются
     по нажатию. Не ниже 44 точек: по этой строке попадают пальцем. */
  .очередь-пункт > summary {
    display: grid; grid-template-columns: 16px 34px 1fr auto; gap: 14px; align-items: center;
    min-height: 44px; padding: 10px 4px 10px 10px; cursor: pointer; list-style: none;
  }
  .очередь-пункт > summary::-webkit-details-marker { display: none; }
  .очередь-пункт > summary::before {
    content: '▸'; display: inline-block; color: var(--muted);
    transition: transform .15s ease; justify-self: center;
  }
  .очередь-пункт[open] > summary::before { transform: rotate(90deg); }
  .очередь-подробно { padding: 0 4px 14px 40px; }
  .очередь-подробно em { display: block; font-style: normal; font-size: 14px; color: var(--muted); margin-top: 3px; }
  /* Свёрнутое пояснение про уровни — компактной строкой над списком. */
  .очередь-легенда { margin-bottom: 10px; }
  .очередь-легенда > summary {
    cursor: pointer; list-style: none; min-height: 44px; display: flex; align-items: center;
    font-size: 14px; color: var(--muted); gap: 6px;
  }
  .очередь-легенда > summary::-webkit-details-marker { display: none; }
  .очередь-легенда > summary::before { content: '▸'; display: inline-block; transition: transform .15s ease; }
  .очередь-легенда[open] > summary::before { transform: rotate(90deg); }
  .очередь-легенда .пояснение { margin: 6px 0 0; }
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

  /* Раздел «Важное»: заголовки на главной и страницы записей.
     Оформление живёт здесь, а не рядом с самим разделом, потому что нужно
     сразу в двух местах — на главной и на странице записи. */
  .важное { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .важное li {
    background: var(--surface); border: 1px solid var(--line);
    border-left: 4px solid var(--line); border-radius: var(--radius);
    box-shadow: var(--shadow);
  }
  .важное a.запись { display: block; padding: 14px 16px; text-decoration: none; color: inherit; }
  .важное--ответ { border-left-color: var(--yantar); }
  .важное--сведение { border-left-color: var(--sukno); }
  .важное--решено { border-left-color: var(--line); opacity: .75; }

  .важное-верх { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
  .важное-вид {
    font-size: 11.5px; text-transform: uppercase; letter-spacing: .05em;
    font-weight: 700; padding: 2px 8px; border-radius: 999px;
    background: var(--surface-2); color: var(--muted);
  }
  .важное--ответ .важное-вид { background: var(--yantar-soft); color: var(--yantar); }
  .важное--сведение .важное-вид { background: var(--sukno-soft); color: var(--sukno); }
  .важное-новое {
    font-size: 11.5px; font-weight: 700; color: #fff; background: var(--chervi);
    padding: 2px 8px; border-radius: 999px;
  }
  .важное-когда { font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--muted); margin-left: auto; }
  .важное-заголовок { font-family: "Alegreya Sans", sans-serif; font-size: 17.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }
  .важное-суть { font-size: 15px; color: var(--ink-soft); margin-top: 5px; line-height: 1.5; }
  .важное-ответ-дан { display: inline-block; margin-top: 7px; font-size: 13.5px; font-weight: 700; color: var(--sukno); }
  /* Решённое за сутки на главной: ниже, бледнее, одной строкой —
     заголовок и начало «чем кончилось». На узком экране строка может
     занять две, но не больше: иначе она снова станет карточкой. */
  .важное-подзаголовок {
    margin: 18px 0 8px; font-size: 13px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em; color: var(--muted);
  }
  /* «Решено за сутки» свёрнуто по умолчанию: строка-заголовок нажимается,
     список решённого раскрывается под ней. */
  .важное-решено-блок > summary.важное-подзаголовок {
    cursor: pointer; list-style: none; min-height: 44px; display: flex; align-items: center; gap: 6px;
  }
  .важное-решено-блок > summary::-webkit-details-marker { display: none; }
  .важное-решено-блок > summary::before { content: '▸'; display: inline-block; transition: transform .15s ease; }
  .важное-решено-блок[open] > summary::before { transform: rotate(90deg); }
  .важное li.важное--строкой { box-shadow: none; opacity: .72; }
  .важное--строкой a.запись { padding: 9px 14px; font-size: 14.5px; line-height: 1.4; color: var(--ink-soft); }
  .важное--строкой .важное-строка-текст {
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
  }
  .важное--строкой .важное-строка-текст b { color: var(--ink); }
  .важное--строкой .важное-когда { margin: 0 6px 0 0; }
  @media (min-width: 621px) {
    .важное--строкой .важное-строка-текст { -webkit-line-clamp: 1; }
  }
  .важное-ещё {
    display: block; text-align: center; padding: 12px; margin-top: 4px;
    border: 1px dashed var(--line); border-radius: var(--radius);
    color: var(--muted); font-size: 14.5px; text-decoration: none;
  }

  /* Страница одной записи */
  .запись-лист { max-width: 720px; margin: 0 auto; padding: 0 4px; }
  .запись-лист h1 { font-size: 26px; line-height: 1.2; margin: 6px 0 10px; }
  .запись-лист h2 { font-size: 19px; margin: 26px 0 10px; }
  .запись-лист p { font-size: 16.5px; line-height: 1.55; color: var(--ink-soft); margin: 0 0 12px; }
  .запись-лист ul { margin: 0 0 14px; padding-left: 22px; }
  .запись-лист li { font-size: 16px; line-height: 1.5; color: var(--ink-soft); margin-bottom: 6px; }
  .запись-суть {
    background: var(--surface-2); border-radius: var(--radius);
    padding: 14px 16px; margin: 0 0 20px; font-size: 16.5px; line-height: 1.5; color: var(--ink);
  }
  .назад { display: inline-block; margin-bottom: 10px; font-size: 15px; color: var(--sukno); text-decoration: none; }

  .кнопки-ответа { display: grid; gap: 10px; margin: 18px 0 10px; }
  .кнопка-ответа {
    display: block; text-align: center; text-decoration: none;
    background: var(--surface); border: 1.5px solid var(--sukno); color: var(--sukno);
    border-radius: var(--radius); padding: 15px 12px; font-size: 16.5px; font-weight: 700;
  }
  .кнопка-ответа span { display: block; font-size: 13.5px; font-weight: 400; color: var(--muted); margin-top: 3px; }
  .принято { background: var(--sukno); color: #fff; border-radius: var(--radius); padding: 15px 17px; margin: 0 0 14px; }
  .принято p { color: #fff; margin: 0; font-size: 16px; }

  /* Форма «Написать штабу» / «Написать замечание»: свободный текст владельца
     рядом с кнопками-ответами. Поле большое — палец точно попадает, и на
     телефоне видно несколько строк без прокрутки к самому низу. */
  .форма-письма { margin: 18px 0; display: flex; flex-direction: column; gap: 8px; }
  .форма-письма__подпись { font-size: 14.5px; font-weight: 700; color: var(--ink-soft); }
  .форма-письма__поле {
    width: 100%; min-height: 130px; padding: 12px 14px; font-size: 16.5px;
    font-family: inherit; line-height: 1.45; color: var(--ink);
    background: var(--surface); border: 1.5px solid var(--line); border-radius: var(--radius);
    resize: vertical;
  }
  .форма-письма__поле:focus { outline: none; border-color: var(--sukno); }
  .форма-письма__кнопка {
    align-self: flex-start; min-height: 44px; padding: 11px 22px; font-size: 16px; font-weight: 700;
    color: #fff; background: var(--sukno); border: 0; border-radius: var(--radius); cursor: pointer;
  }

  /* Прежде отправленные письма по записи — чтобы было видно, что дошло. */
  .письма-список { margin: 18px 0; }
  .письма-список h2 { font-size: 17px; margin: 0 0 8px; }
  .письма { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .письмо { background: var(--surface-2); border-radius: var(--radius); padding: 12px 14px; }
  .письмо-когда { display: block; font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .письмо-текст { margin: 0; font-size: 15.5px; line-height: 1.5; color: var(--ink); white-space: pre-wrap; }

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
    .очередь-пункт > summary { grid-template-columns: 16px 26px 1fr; }
    .очередь-пункт > summary .метка { grid-column: 1 / -1; justify-self: start; margin-top: 4px; }
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

  // Когда списки задач пересобраны последний раз. Время — из часов машины
  // в минуту пересборки, а не со слов штаба.
  const п = данные.пересборка;
  const списокПравился = п && п.последняя
    ? '<br>пересобрано само: <b>' + э(сбор.часыМинуты(new Date(п.последняя))) + '</b>'
    : '<br>пересборки ещё не было';

  return `
  <header class="шапка">
    <div>
      <h1>Штаб BoardGames</h1>
      <p class="подзаголовок">Что делается прямо сейчас, что уже у игроков в Telegram и что стоит в очереди. Страница собирается программой: цифры обновляются каждые 15 секунд, а раз в 5 минут всё пересобирается целиком — и списки задач тоже.</p>
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

/* Раз в сколько минут дашборд сам пересобирает списки и страница
   перезагружается целиком. Сервер (штаб/дашборд.js) берёт число отсюда:
   оно одно на оба места, иначе полоса и расписание разойдутся. */
const ПЕРЕСБОРКА_МИН = 5;

/** «пересобрано в 19:40, само, раз в 5 минут» — время из часов машины. */
function словаПересборки(п) {
  if (!п) return 'пересборки нет: дашборд запущен без неё';
  if (!п.последняя) {
    return п.идёт ? 'идёт первая пересборка после запуска дашборда' : 'пересборки ещё не было';
  }
  return 'пересобрано в ' + э(сбор.часыМинуты(new Date(п.последняя)))
    + ', само, раз в ' + (п.шагМин || ПЕРЕСБОРКА_МИН) + ' минут';
}

/* Что делает каждая программа пересборки — чтобы сбой был сказан словами,
   а не только именем файла. */
const ЧТО_ДЕЛАЕТ = {
  'списки.js': 'очередь и «Готово»',
  'в-работе.js': 'список «В работе»',
  'важное.js': 'вопросы к вам («Ждём слова владельца»)'
};

/** Что в пересборке пошло не так — строками для её собственной полосы. */
function сбоиПересборки(п, сейчас) {
  if (!п) return [];
  const сбои = (п.шаги || []).filter(function (ш) { return !ш.прошёл; }).map(function (ш) {
    const что = ЧТО_ДЕЛАЕТ[ш.имя] ? ЧТО_ДЕЛАЕТ[ш.имя] + ' (' + ш.имя + ')' : ш.имя;
    return '<li><b>' + э(что) + '</b> — не пересобрано: ' + э(ш.строка || 'программа упала без объяснений') + '</li>';
  });
  // Пропустила два своих срока подряд — значит встала, и списки снова на памяти.
  const шагМс = (п.шагМин || ПЕРЕСБОРКА_МИН) * 60000;
  if (п.последняя && сейчас - new Date(п.последняя).getTime() > 2 * шагМс + 60000) {
    сбои.push('<li><b>вся пересборка</b> — не проходила с ' + э(сбор.часыМинуты(new Date(п.последняя)))
      + ', хотя должна раз в ' + (п.шагМин || ПЕРЕСБОРКА_МИН) + ' минут</li>');
  }
  return сбои;
}

/**
 * Верхняя полоса: врёт ли список «в работе» и прошла ли пересборка.
 *
 * Раньше полоса мерила возраст списка — время правки файла. Теперь дашборд
 * сам пересобирает список раз в пять минут, и время правки всегда свежее:
 * полоса по-старому молчала бы и тогда, когда список врёт. Поэтому она
 * краснеет по фактам, которые добыты с диска (штаб/живость.js):
 *   - в списке работа, а её исполнитель молчит дольше десяти минут или его нет;
 *   - исполнитель работает, а в списке его нет.
 * Сбой самой пересборки — другая беда и своя полоса: список при этом может
 * быть верным, просто его давно не освежали. Путать их нельзя — ревьюер
 * поймал, что сбой пересборки выдавался за «список врёт».
 * Ни того ни другого — тихая строка с часами последней пересборки.
 */
function блокСвежесть(данные) {
  const р = данные.расхождения;
  const п = данные.пересборка;
  const сейчас = данные.собрано ? данные.собрано.getTime() : Date.now();

  const пункты = [];
  for (const х of (р && р.список) || []) {
    пункты.push('<li><b>' + э(х.кто) + '</b> — «' + э(х.что) + '»: ' + э(х.слова) + '</li>');
  }
  const сбои = сбоиПересборки(п, сейчас);

  let полосы = '';
  if (пункты.length) {
    полосы += '<div class="свежесть свежесть--старый">'
      + '<strong>Список расходится с правдой — ему можно не верить</strong>'
      + '<ul class="расхождения">' + пункты.join('') + '</ul>'
      + '<span>Правду знают файлы записей исполнителей, а не список: их время правки добыто с диска.</span>'
      + '</div>';
  }
  if (сбои.length) {
    полосы += '<div class="свежесть свежесть--старый">'
      + '<strong>Пересборка списков не прошла</strong>'
      + '<ul class="расхождения">' + сбои.join('') + '</ul>'
      + '<span>Сами списки при этом могут быть верными — их просто не освежили. '
      + 'Разделы выше и ниже показывают состояние на последнюю удачную пересборку.</span>'
      + '</div>';
  }
  if (полосы) {
    return полосы + '<p class="пересобрано">' + словаПересборки(п) + '</p>';
  }

  // Сверить не с чем — не притворяемся, что всё сходится.
  let хвост = '';
  if (!р || !р.можноСверить) {
    хвост = ' · сверить список с правдой нечем: ' + э((р && р.беда) || 'сведений о живости нет');
  } else if (р.безНомера) {
    хвост = ' · у ' + счётСловом(р.безНомера, 'работы', 'работ', 'работ')
      + ' в списке нет номера задачи — их сверить нечем';
  }
  return '<p class="пересобрано">' + словаПересборки(п) + хвост + '</p>';
}

/**
 * Кто простаивает — строкой наверху, рядом с возрастом списка.
 * Владелец однажды сам заметил, что исполнители молчат по десять часов,
 * раньше штаба. Теперь это видно с первого взгляда и ему, и штабу.
 * Молчание почти всегда значит одно: человек закончил, а работу ему не дали.
 */
function блокПростой(данные) {
  const п = данные.простой;
  if (!п || п.беда || !п.строки.length) return '';

  const молчащие = п.строки.filter(function (с) {
    return с.состояние === 'молчит' || с.состояние === 'нет файла' || с.состояние === 'не начал';
  });

  if (!молчащие.length) {
    return '<div class="свежесть">'
      + '<strong>Все ' + п.строки.length + ' работают</strong>'
      + '<span>у каждого есть запись свежее часа. Простоя нет.</span>'
      + '</div>';
  }

  const перечень = молчащие.map(function (с) {
    return э(с.кто) + ' — ' + э(с.тишина === null ? 'файла нет' : длительностьСловами(с.тишина));
  }).join(' · ');

  return '<div class="свежесть свежесть--старый">'
    + '<strong>' + счётСловом(молчащие.length, 'исполнитель молчит', 'исполнителя молчат', 'исполнителей молчат')
    + ' дольше часа</strong>'
    + '<span>' + перечень + '. Обычно это значит, что человек закончил и ждёт новую задачу — вина не его.</span>'
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
      проЗаписи += ' <b>Работают ещё ' + счётСловом(лишние.length, 'исполнитель', 'исполнителя', 'исполнителей')
        + ', которых нет в списке</b> — штаб их не записал.';
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
 * Раздел «Важное» на главной. Саму разметку собирает штаб/важное-страница.js
 * и кладёт в данные сервер (штаб/дашборд.js). Сделано так нарочно: иначе этот
 * файл и файл «Важного» ссылались бы друг на друга по кругу.
 */
function блокВажное(данные) {
  return данные.важноеРазметка || '';
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
    const подробно = (заметка || подсказка)
      ? '<div class="очередь-подробно">' + заметка + подсказка + '</div>' : '';
    // Ключ для памяти о раскрытом пункте — заголовок задачи: он меняется,
    // только когда задача действительно другая, а не при каждой пересборке.
    строки += '<li' + классСтроки + '>'
      + '<details class="очередь-пункт" data-ключ="' + э(з.что) + '">'
      + '<summary>'
      + '<span class="номер">' + String(номер + 1).padStart(2, '0') + '</span>'
      + '<span class="задача">' + э(з.что) + '</span>'
      + '<span class="метка метка--' + з.уровень + '">' + э(з.уровень) + '</span>'
      + '</summary>'
      + подробно
      + '</details>'
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
    <details class="очередь-легенда" data-ключ="уровни-легенда">
      <summary>Что значат уровни</summary>
      <p class="пояснение"><b>Горит</b> — игрок видит поломку, берём немедленно. <b>Скоро</b> — вы ждёте, спросите на днях. <b>Потом</b> — нужное, но никто не ждёт. <b>Задел</b> — пригодится, когда вырастем. Сделанное вычёркивается программой по следу в коде, а не по памяти штаба.</p>
    </details>
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
    <b>Про верхнюю полосу.</b> Раз в ${ПЕРЕСБОРКА_МИН} минут дашборд сам пересобирает списки задач — теми же программами, что штаб зовёт руками. Поэтому возраст файла больше ничего не говорит: он всегда свежий. Полоса краснеет по другому — когда список «в работе» расходится с фактами: в нём значится работа, а исполнитель молчит дольше десяти минут или его нет вовсе; или исполнитель работает, а в списке его нет; или пересборка не прошла. Нет расхождений — вместо полосы тихая строка с часами последней пересборки.
    <br><br>
    <b>Про время.</b> Обещанных сроков тут нет нарочно: программа не умеет их угадывать, а угаданные однажды уже наврали на три часа. Показано только то, что можно посчитать: сколько задача уже идёт. Если штаб напишет в ЗАДАЧИ.md оценку вида «≈ 40 мин», она появится на карточке.
    <br><br>
    <b>Про «не опубликовано».</b> Коммит — ещё не публикация: игроки видят только отправленное на сайт. Красный блок сверху появляется, когда номера версий на сайте разошлись с домашними или когда записи не отправлены.${беда}
  </p>`;
}

/**
 * Кнопка «Задания для ChatGPT». Разметку собирает штаб/важное-страница.js,
 * а сервер кладёт её в данные — так же, как раздел «Важное».
 */
function блокЗаданий(данные) {
  return данные.кнопкаЗаданий || '';
}

/** Всё содержимое листа — то, что браузер подменяет раз в 15 секунд. */
function внутренности(данные) {
  return блокЗаданий(данные)
    + шапка(данные)
    + блокПростой(данные)
    + блокСвежесть(данные)
    + сводка(данные)
    + блокНеОпубликовано(данные)
    + блокВРаботе(данные)
    + блокВажное(данные)
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

  // Какие пункты («Очередь», «Решено за сутки») зритель раскрыл сам —
  // помним в его браузере. Без этого подмена куска каждые 15 секунд
  // захлопывала бы то, что он только что открыл пальцем.
  var КЛЮЧ_ХРАНЕНИЯ = 'штабРаскрытыеПункты';

  function прочитатьРаскрытые() {
    try {
      var сырое = localStorage.getItem(КЛЮЧ_ХРАНЕНИЯ);
      return сырое ? JSON.parse(сырое) : {};
    } catch (ошибка) {
      return {};
    }
  }

  function записатьРаскрытые(раскрытые) {
    try {
      localStorage.setItem(КЛЮЧ_ХРАНЕНИЯ, JSON.stringify(раскрытые));
    } catch (ошибка) {
      // Приватный режим или хранилище отключено владельцем — просто не помним.
    }
  }

  // Пункт, которого в новой разметке больше нет, сам не мешает: при
  // подмене куска мы просто не найдём для него <details>, и запись
  // рано или поздно перезапишется без него.
  document.addEventListener('toggle', function (событие) {
    var подробности = событие.target;
    if (!подробности || !подробности.hasAttribute || !подробности.hasAttribute('data-ключ')) return;
    var ключ = подробности.getAttribute('data-ключ');
    var раскрытые = прочитатьРаскрытые();
    if (подробности.open) раскрытые[ключ] = true;
    else delete раскрытые[ключ];
    записатьРаскрытые(раскрытые);
  }, true); // на погружении: событие toggle не везде всплывает

  function восстановитьРаскрытые() {
    var раскрытые = прочитатьРаскрытые();
    var лист = document.querySelector('.лист');
    if (!лист) return;
    Array.prototype.forEach.call(лист.querySelectorAll('details[data-ключ]'), function (подробности) {
      if (раскрытые[подробности.getAttribute('data-ключ')]) подробности.open = true;
    });
  }

  async function обновить() {
    try {
      var ответ = await fetch('/кусок', { cache: 'no-store' });
      if (!ответ.ok) return;
      var разметка = await ответ.text();
      document.querySelector('.лист').innerHTML = разметка;
      восстановитьРаскрытые();
    } catch (ошибка) {
      // Сервер моргнул или его перезапускают — молча ждём следующей попытки.
    }
  }

  восстановитьРаскрытые(); // сразу при загрузке страницы
  setInterval(обновить, ШАГ_МС);
  // Вернулись к вкладке — не ждём своей очереди, обновляемся сразу.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) обновить();
  });

  // Раз в ${ПЕРЕСБОРКА_МИН} минут — полная перезагрузка, сверх подмены куска.
  // Кусок приносит только содержимое, а новое оформление и новый скрипт
  // страницы после перезапуска дашборда доходят лишь так. Место прокрутки
  // браузер при перезагрузке возвращает сам.
  //
  // Но сперва спрашиваем, жив ли сервер. Перезагрузись страница в ту
  // секунду, когда туннель моргнул или дашборд перезапускают, — у владельца
  // на телефоне осталась бы страница ошибки браузера, и сама она уже не
  // оживёт: наш скрипт в ней не работает. Не ответил — остаёмся на месте
  // и пробуем в следующий раз; подмена куска тем временем идёт как шла.
  async function перезагрузитьЕслиЖив() {
    try {
      var ответ = await fetch('/жив', { cache: 'no-store' });
      if (!ответ.ok) return;
      // Ответить 200 может и чужая страница (ошибка туннеля, вход в Wi-Fi) —
      // верим только своему слову.
      if ((await ответ.text()).trim() !== 'жив') return;
      location.reload();
    } catch (ошибка) {
      // Сервер недоступен — ждём следующего раза.
    }
  }
  setInterval(перезагрузитьЕслиЖив, ${ПЕРЕСБОРКА_МИН} * 60 * 1000);
</script>
</html>`;
}

module.exports = {
  целаяСтраница: целаяСтраница,
  внутренности: внутренности,
  // наружу для проверки, которая умеет краснеть: полосу рисуют по подставным данным
  блокСвежесть: блокСвежесть,
  ПЕРЕСБОРКА_МИН: ПЕРЕСБОРКА_МИН,
  // Оформление берёт и страница разбора (штаб/разбор-пути.js): вид у штаба
  // один, и заводить ему вторую таблицу цветов незачем.
  ОФОРМЛЕНИЕ: ОФОРМЛЕНИЕ
};
