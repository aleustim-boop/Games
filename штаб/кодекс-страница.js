/* Страница дашборда «Кодекс»: доска задач на отрисовку картинок.

   Что это. Сценарист Джо ставит задачи на графику, Кодекс (отдельное
   приложение владельца) сам их берёт, рисует, кладёт файл и отмечает
   «сдано». Механизм — штаб/план-джо-и-кодекс.md. Доску ведёт программа
   штаб/кодекс.js (файл штаб/кодекс-задачи.json), а эта страница её только
   ПОКАЗЫВАЕТ: кнопок «принять/вернуть» пока нет (этап 2).

   Тексты задач пишет другая программа, поэтому ему не верим: каждое
   значение из файла идёт в разметку только через э(). */

'use strict';

const страница = require('./страница.js');
const сбор = require('./сбор.js');

const ФРАЗА_ДЛЯ_КОДЕКСА = 'Прочитай штаб/кодексу.md и сделай задачи с доски';
const СКОЛЬКО_ПРИНЯТЫХ = 20;

function э(текст) {
  return String(текст === null || текст === undefined ? '' : текст)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Группы в том порядке, в каком владельцу и Джо нужно на них смотреть:
   сначала то, что ждёт приёмки, потом возвращённое, потом остальное. */
const ГРУППЫ = [
  { статус: 'сдано', название: 'Сдано — ждут приёмки', класс: 'кодекс--сдано', свёрнуто: false },
  { статус: 'вернули', название: 'Вернули на доработку', класс: 'кодекс--вернули', свёрнуто: false },
  { статус: 'в работе', название: 'В работе', класс: 'кодекс--работа', свёрнуто: false },
  { статус: 'ждёт', название: 'Ждёт', класс: 'кодекс--ждёт', свёрнуто: false },
  { статус: 'принято', название: 'Принято', класс: 'кодекс--принято', свёрнуто: true }
];

/** «2026-09-30T10:20» → «30.09 10:20»; не разобрали — как есть. */
function времяСловами(значение) {
  if (!значение) return '';
  const н = /^\d{4}-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(значение));
  return н ? н[2] + '.' + н[1] + ' ' + н[3] + ':' + н[4] : String(значение);
}

/** Последнее замечание: в файле оно может быть строкой или записью {когда, кто, текст}. */
function последнееЗамечание(задача) {
  const список = Array.isArray(задача.замечания) ? задача.замечания : [];
  if (!список.length) return null;
  const з = список[список.length - 1];
  if (з && typeof з === 'object') {
    return {
      текст: з.текст || з.слова || '',
      кто: з.кто || з.имя || '',
      когда: времяСловами(з.когда || з.время)
    };
  }
  return { текст: String(з), кто: '', когда: '' };
}

/** Одна строка «подпись: значение»; пустое значение — строки нет. */
function строка(подпись, значение) {
  if (значение === null || значение === undefined || значение === '') return '';
  return '<div class="кодекс-строка"><span class="кодекс-подпись">' + э(подпись) + '</span> '
    + '<span>' + э(значение) + '</span></div>';
}

function карточка(задача, класс) {
  const размер = [задача.размер, задача.формат].filter(Boolean).join(', ');
  const поставил = [задача.поставил, времяСловами(задача.поставлено)].filter(Boolean).join(', ');
  const замечание = задача.статус === 'вернули' ? последнееЗамечание(задача) : null;
  const замечаниеРазметка = замечание
    ? '<div class="кодекс-замечание"><b>Замечание'
      + (замечание.кто || замечание.когда ? ' (' + э([замечание.кто, замечание.когда].filter(Boolean).join(', ')) + ')' : '')
      + ':</b> ' + э(замечание.текст) + '</div>'
    : '';

  return '<li class="кодекс-задача ' + класс + '">'
    + '<div class="кодекс-верх"><span class="кодекс-игра">' + э(задача.игра || 'без игры') + '</span>'
    + '<span class="кодекс-ключ">' + э(задача.ключ || '') + '</span></div>'
    + '<div class="кодекс-что">' + э(задача.что || '(без описания)') + '</div>'
    + строка('Размер и формат:', размер)
    + строка('Куда положить:', задача.куда)
    + строка('Поставил:', поставил)
    + строка('Взято:', времяСловами(задача.взято))
    + строка('Сдано:', времяСловами(задача.сдано))
    + строка('Принято:', времяСловами(задача.принято))
    + замечаниеРазметка
    + '</li>';
}

function группа(описание, задачи) {
  if (!задачи.length) return '';
  let показать = задачи;
  let ещё = '';
  if (описание.статус === 'принято') {
    // Последние принятые: у кого времени нет — в конец. Время в файле — ISO, сравнивается как текст.
    показать = задачи.slice().sort(function (а, б) {
      return String(б.принято || '').localeCompare(String(а.принято || ''));
    });
    if (показать.length > СКОЛЬКО_ПРИНЯТЫХ) {
      ещё = '<p class="пояснение">Показаны последние ' + СКОЛЬКО_ПРИНЯТЫХ + ' из ' + показать.length + '.</p>';
      показать = показать.slice(0, СКОЛЬКО_ПРИНЯТЫХ);
    }
  }
  const список = '<ul class="кодекс-список">'
    + показать.map(function (з) { return карточка(з, описание.класс); }).join('') + '</ul>' + ещё;
  const заголовок = э(описание.название) + ' <span class="счёт">' + задачи.length + '</span>';
  if (описание.свёрнуто) {
    return '<section><details class="кодекс-свёрнуто"><summary><h2>' + заголовок + '</h2></summary>'
      + список + '</details></section>';
  }
  return '<section><h2>' + заголовок + '</h2>' + список + '</section>';
}

function счётчики(доска) {
  const части = [
    ['ждёт', доска.ждёт], ['в работе', доска.вРаботе], ['сдано', доска.сдано],
    ['вернули', доска.вернули], ['принято', доска.принято]
  ];
  return '<div class="кодекс-счётчики">' + части.map(function (ч) {
    return '<span class="кодекс-счётчик"><b>' + ч[1] + '</b> ' + э(ч[0]) + '</span>';
  }).join('') + '</div>';
}

const РАМКА = '<div class="кодекс-рамка">'
  + '<h2>Что сказать Кодексу</h2>'
  + '<pre class="кодекс-фраза">' + э(ФРАЗА_ДЛЯ_КОДЕКСА) + '</pre>'
  + '<p class="пояснение">Кодекс сам берёт задачи, рисует, кладёт файл и отмечает «сдано».</p>'
  + '</div>';

const ОФОРМЛЕНИЕ_КОДЕКСА = `
  .кодекс-рамка {
    margin: 0 0 24px; padding: 16px 18px; border: 1px solid var(--line);
    border-left: 4px solid var(--sukno); border-radius: var(--radius); background: var(--surface);
  }
  .кодекс-рамка h2 { margin-top: 0; }
  .кодекс-рамка .пояснение { margin: 8px 0 0; }
  .кодекс-фраза {
    margin: 8px 0 0; padding: 10px 12px; white-space: pre-wrap; word-break: break-word;
    border-radius: 10px; background: var(--surface-2); color: var(--ink);
    font-family: "JetBrains Mono", monospace; font-size: 14px; user-select: all;
  }
  .кодекс-счётчики { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 28px; }
  .кодекс-счётчик {
    padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px;
    background: var(--surface); color: var(--ink-soft); font-size: 14.5px;
  }
  .кодекс-счётчик b { color: var(--ink); }
  .кодекс-список { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .кодекс-задача {
    padding: 12px 16px; border: 1px solid var(--line); border-left: 4px solid var(--line);
    border-radius: var(--radius); background: var(--surface);
  }
  .кодекс--сдано { border-left-color: var(--sukno); }
  .кодекс--вернули { border-left-color: var(--yantar); }
  .кодекс--принято { opacity: .75; }
  .кодекс-верх { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 4px; }
  .кодекс-игра {
    padding: 2px 8px; border-radius: 6px; background: var(--surface-2);
    color: var(--ink-soft); font-size: 12.5px; font-weight: 700;
  }
  .кодекс-ключ { margin-left: auto; font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--muted); }
  .кодекс-что { font-family: "Alegreya Sans", sans-serif; font-size: 17px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
  .кодекс-строка { font-size: 14.5px; color: var(--ink-soft); line-height: 1.5; word-break: break-word; }
  .кодекс-подпись { color: var(--muted); }
  .кодекс-замечание {
    margin-top: 8px; padding: 8px 10px; border-radius: 8px;
    background: var(--yantar-soft); color: var(--ink); font-size: 14.5px;
  }
  .кодекс-свёрнуто > summary { cursor: pointer; list-style: none; }
  .кодекс-свёрнуто > summary::-webkit-details-marker { display: none; }
  .кодекс-свёрнуто > summary h2 { display: inline-block; }
  .кодекс-свёрнуто > summary h2::before { content: '▸ '; }
  .кодекс-свёрнуто[open] > summary h2::before { content: '▾ '; }
`;

/**
 * Целая страница /кодекс. Довод «доска» — только для проверок: готовая доска
 * вместо чтения файла.
 */
function страницаКодекса(доска) {
  const д = доска || сбор.собратьКодекс();
  let нутро;
  if (д.беда) {
    нутро = '<p class="пояснение">' + э(д.беда) + '. Доска показана пустой.</p>';
  } else {
    нутро = '';
  }
  if (!д.всего) {
    нутро += '<p><b>Задач Кодексу пока нет.</b> Их ставит Джо, когда дойдёт до графики игры.</p>';
  } else {
    нутро += счётчики(д) + ГРУППЫ.map(function (г) {
      return группа(г, д.задачи.filter(function (з) { return з.статус === г.статус; }));
    }).join('');
  }

  return '<!doctype html><html lang="ru"><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Кодекс — дашборд</title>'
    + '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:wght@500;700;800&family=Alegreya+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap">'
    + '<style>' + страница.ОФОРМЛЕНИЕ + ОФОРМЛЕНИЕ_КОДЕКСА + '</style>'
    + '<div class="лист запись-лист">'
    + '<a class="назад" href="/">← к дашборду</a>'
    + '<h1>Задачи Кодексу</h1>'
    + РАМКА + нутро
    + '</div></html>';
}

module.exports = {
  страница: страницаКодекса,
  ФРАЗА_ДЛЯ_КОДЕКСА: ФРАЗА_ДЛЯ_КОДЕКСА
};
