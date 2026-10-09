/* =====================================================================
   МОСТ В TELEGRAM — карточка «Играйте в Telegram» для гостя из браузера.

   Зачем. Игры открываются и в обычном браузере (страницы есть в
   поисковиках). Вне Telegram игрок безымянный: нет рейтинга, друзей и
   писем от бота. Карточка зовёт его в бот; ссылка несёт метку src_site,
   по ней бот считает, сколько гостей пришло с сайта (bot/бот.js,
   «меткаИсточника»: метка — строчные латиница, цифры, «_», «-»).

   Где стоит.
   • Витрина (index.html): над списком игр, после фильтров.
   • Страницы игр: в #экран-лобби прямо перед нижней полосой вкладок —
     то есть после карточек входов, но не под полосой. Каркас лобби не
     трогаем: у каждой игры он свой, а полоса есть у всех. Нет полосы —
     карточка уходит в конец лобби.
   • Лобби дурака на index.html не трогаем: на этой странице карточка
     уже стоит на витрине, второй не нужно.

   Внутри Telegram карточки нет совсем: мы её даже не создаём.

   Вид — только классами из style.css (мост-в-телеграм*). Размеров и
   цветов из js не задаём.
   ===================================================================== */
(function () {
  'use strict';

  var АДРЕС_БОТА = 'https://t.me/BoardingGames_bot?start=src_site';
  var КЛАСС = 'мост-в-телеграм';

  /** Игра открыта внутри Telegram, а не просто в браузере.
      Решаем тем же способом, что общее/js/telegram.js (открытоВTelegram):
      скрипт Telegram создаёт WebApp и в обычном браузере, поэтому
      одного его наличия мало — нужна подпись initData или площадка
      не «unknown»; запасные признаки — адрес и память вкладки. */
  function открытоВTelegram() {
    try {
      var приложение = window.Telegram && window.Telegram.WebApp;
      if (приложение) {
        if (приложение.initData) return true;
        var площадка = String(приложение.platform || '');
        if (площадка && площадка !== 'unknown') return true;
      }
    } catch (ошибка) { /* спросить не вышло — смотрим в адрес */ }
    try {
      if (/tgWebApp(Data|Platform)=/.test(String(window.location.hash || ''))) return true;
    } catch (ошибка) { /* адреса нет — смотрим в память вкладки */ }
    try {
      var сохранено = JSON.parse(window.sessionStorage.getItem('__telegram__initParams') || 'null');
      if (сохранено && (сохранено.tgWebAppData ||
          (сохранено.tgWebAppPlatform && сохранено.tgWebAppPlatform !== 'unknown'))) return true;
    } catch (ошибка) { /* памяти вкладки нет или в ней мусор — значит не знаем */ }
    return false;
  }

  /** Сама карточка: заголовок, подпись и кнопка-ссылка. */
  function собратьКарточку() {
    var карточка = document.createElement('div');
    карточка.className = КЛАСС;
    карточка.setAttribute('data-мост-в-телеграм', '');
    карточка.innerHTML =
      '<span class="' + КЛАСС + '__текст">' +
        '<span class="' + КЛАСС + '__название">Играйте в Telegram</span>' +
        '<span class="' + КЛАСС + '__подпись">Рейтинг, друзья и приглашения — всё сохранится</span>' +
      '</span>' +
      '<a class="' + КЛАСС + '__кнопка" href="' + АДРЕС_БОТА + '" target="_blank" rel="noopener">Открыть в Telegram</a>';
    return карточка;
  }

  /** Куда вставить: перед списком игр на витрине или перед нижней
      полосой в лобби игры. Возвращает true, если вставили. */
  function вставить(карточка) {
    var плитки = document.querySelector('.витрина__плитки');
    if (плитки && плитки.parentNode) {
      плитки.parentNode.insertBefore(карточка, плитки);
      return true;
    }
    if (document.getElementById('экран-витрины')) return false;
    var лобби = document.getElementById('экран-лобби');
    if (!лобби) return false;
    var полоса = null;
    for (var i = 0; i < лобби.children.length; i++) {
      if (лобби.children[i].classList.contains('нижние-вкладки')) { полоса = лобби.children[i]; break; }
    }
    if (полоса) лобби.insertBefore(карточка, полоса);
    else лобби.appendChild(карточка);
    return true;
  }

  function показатьКарточку() {
    if (открытоВTelegram()) return;
    if (document.querySelector('.' + КЛАСС)) return;
    вставить(собратьКарточку());
  }

  /* Скрипт Telegram подключён с defer и выполняется до DOMContentLoaded,
     поэтому решать надо после него — иначе гость и «свой» неотличимы. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', показатьКарточку);
  } else {
    показатьКарточку();
  }
})();
