/* Строка «Язык» для страниц без общего листа «⋯» (головоломки, покер, бастион).
 *
 * Окна настроек и справки этих страниц не лежат в разметке готовыми:
 * страница сама открывает общий <dialog> и каждый раз заново наполняет его
 * тело (через Telegram — вызовом настроек напрямую, без нажатия кнопки).
 * Поэтому следим за самим документом (MutationObserver): как только есть
 * открытое окно, чей заголовок — из списка ЗАГОЛОВКИ_НАСТРОЕК, и в его теле
 * ещё нет строки, дописываем одну строку «Язык  <название>». Нажатие на
 * строку листает язык по кругу, окно не закрывается.
 *
 * Общего признака «это настройки» в разметке нет (итог партии и подтверждения
 * заполняются тем же modal(), тем же классом), поэтому узнаём окно по заголовку.
 *
 * Нет window.ЯзыкИнтерфейса или подходящего открытого окна — молча ничего не
 * делаем. Вид — только классы «язык-строка…» (style-языки.css).
 */
(function () {
  'use strict';

  // Заголовки окон настроек и справки. Совпадение — по началу заголовка:
  // «Как играть: Косынка» и «Как играть в судоку» тоже подходят.
  const ЗАГОЛОВКИ_НАСТРОЕК = [
    'Настройки', 'Ваш ритм игры', 'Как играть', 'Как читать японский кроссворд',
    'Как защитить маяк', 'Две карты. Лучшие пять.', 'За вашим столом'
  ];
  // Кнопки закрытия, перед которыми встаёт строка, если кнопка в теле последняя.
  const КНОПКИ_ЗАКРЫТИЯ = ['Готово', 'Понятно', 'Закрыть'];
  // Узел заголовка у разных страниц называется по-разному.
  const ID_ЗАГОЛОВКА = ['dialog-title', 'pk-dialog-title'];
  // Где у окна лежит содержимое.
  const ID_ТЕЛА = ['dialog-content', 'dialog-body', 'pk-dialog-body'];
  const МЕТКА = 'data-язык-строка';

  function естьЯзык() {
    return typeof window !== 'undefined' && Boolean(window.ЯзыкИнтерфейса) &&
      typeof window.ЯзыкИнтерфейса.следующий === 'function';
  }

  function названиеЯзыка() {
    return typeof window.ЯзыкИнтерфейса.название === 'function' ? window.ЯзыкИнтерфейса.название() : '';
  }

  /** Слово и его перевод на текущий язык: словарь страницы мог переписать заголовок. */
  function варианты(слово) {
    const список = [слово];
    const я = window.ЯзыкИнтерфейса;
    if (я && typeof я.текст === 'function') {
      const перевод = я.текст(слово);
      if (typeof перевод === 'string' && перевод) список.push(перевод);
    }
    return список;
  }

  function заголовокОкна(окно) {
    for (let i = 0; i < ID_ЗАГОЛОВКА.length; i++) {
      const узел = окно.querySelector('#' + ID_ЗАГОЛОВКА[i]);
      if (узел) return String(узел.textContent).trim();
    }
    return null;
  }

  function этоНастройки(окно) {
    const заголовок = заголовокОкна(окно);
    if (заголовок === null) return false;
    return ЗАГОЛОВКИ_НАСТРОЕК.some(function (эталон) {
      return варианты(эталон).some(function (в) { return заголовок.indexOf(в) === 0; });
    });
  }

  function телоОкна(окно) {
    for (let i = 0; i < ID_ТЕЛА.length; i++) {
      const тело = окно.querySelector('#' + ID_ТЕЛА[i]);
      if (тело) return тело;
    }
    return окно;
  }

  function собратьСтроку() {
    const строка = document.createElement('button');
    строка.className = 'язык-строка';
    строка.setAttribute('type', 'button');
    строка.setAttribute(МЕТКА, '');
    const подпись = document.createElement('span');
    подпись.className = 'язык-строка__подпись';
    подпись.textContent = 'Язык';
    const значение = document.createElement('span');
    значение.className = 'язык-строка__значение';
    // Названия языков не переводятся: «English» не должен стать чужим словом.
    значение.setAttribute('data-no-translate', '');
    значение.textContent = названиеЯзыка();
    строка.appendChild(подпись);
    строка.appendChild(значение);
    строка.addEventListener('click', function () {
      if (естьЯзык()) window.ЯзыкИнтерфейса.следующий();
      значение.textContent = естьЯзык() ? названиеЯзыка() : '';
    });
    return строка;
  }

  /** Последняя кнопка тела, если это «Готово»/«Понятно»; иначе null. */
  function кнопкаЗакрытия(тело) {
    const последний = тело.lastElementChild;
    if (!последний || последний.tagName !== 'BUTTON') return null;
    const текст = String(последний.textContent).trim();
    const подходит = КНОПКИ_ЗАКРЫТИЯ.some(function (с) { return варианты(с).indexOf(текст) !== -1; });
    return подходит ? последний : null;
  }

  function вставитьВОкно(окно) {
    const тело = телоОкна(окно);
    // Проверка «строка уже есть» — до вставки: собственная вставка не зациклит наблюдателя.
    if (тело.querySelector('[' + МЕТКА + ']')) return null;
    const строка = собратьСтроку();
    const закрытие = кнопкаЗакрытия(тело);
    if (закрытие) тело.insertBefore(строка, закрытие);
    else тело.appendChild(строка);
    return строка;
  }

  /** Пройти по открытым окнам и дописать строку там, где это настройки или справка. */
  function вставить() {
    if (!естьЯзык()) return;
    const окна = document.querySelectorAll('dialog[open]');
    for (let i = 0; i < окна.length; i++) {
      if (этоНастройки(окна[i])) вставитьВОкно(окна[i]);
    }
  }

  function подключить() {
    if (typeof MutationObserver !== 'function') return;
    const наблюдатель = new MutationObserver(вставить);
    // open — окно открыли; childList — страница заново наполнила тело окна.
    наблюдатель.observe(document, { attributes: true, attributeFilter: ['open'], childList: true, subtree: true });
  }

  if (typeof document !== 'undefined') подключить();

  if (typeof module !== 'undefined' && module.exports) module.exports = { вставить: вставить };
})();
