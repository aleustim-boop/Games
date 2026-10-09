/* Только представление. Значения radio/select, команды сервера, карты,
   пользовательские имена и сохранения игры остаются исходными. */
(function () {
  'use strict';
  const словарь = window.Языки;
  if (!словарь) return;
  const КЛЮЧ = 'games_language';
  let выбранный = '';
  try { выбранный = localStorage.getItem(КЛЮЧ) || ''; } catch (_) {}
  function автоматически() {
    return словарь.язык(window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || navigator.language);
  }
  let текущий = выбранный ? словарь.язык(выбранный) : автоматически();
  const исходники = new WeakMap();
  const атрибуты = new WeakMap();
  const исключения = 'script,style,noscript,textarea,code,[contenteditable],.рассадка__имя,.знакомые__имя,.профиль__имя,.соперник:not(.соперник--бот) .соперник__имя,[data-no-translate],[data-имя-игрока]';

  function перевестиУзел(узел) {
    if (узел.nodeType === 3) {
      if (!узел.parentElement || узел.parentElement.closest(исключения)) return;
      const раньше = исходники.get(узел);
      const исходник = раньше && раньше.показан === узел.nodeValue ? раньше.исходник : узел.nodeValue;
      const показан = словарь.текст(исходник, текущий);
      исходники.set(узел, { исходник, показан });
      if (узел.nodeValue !== показан) узел.nodeValue = показан;
      return;
    }
    if (узел.nodeType !== 1 || узел.matches(исключения)) return;
    for (const имя of ['aria-label', 'title', 'placeholder', 'alt']) {
      if (!узел.hasAttribute(имя)) continue;
      let память = атрибуты.get(узел);
      if (!память) { память = {}; атрибуты.set(узел, память); }
      const сейчас = узел.getAttribute(имя);
      const исходник = память[имя]?.показан === сейчас ? память[имя].исходник : сейчас;
      const показан = словарь.текст(исходник, текущий);
      память[имя] = { исходник, показан };
      if (сейчас !== показан) узел.setAttribute(имя, показан);
    }
    for (const ребёнок of Array.from(узел.childNodes)) перевестиУзел(ребёнок);
  }

  const наблюдатель = new MutationObserver(изменения => {
    наблюдатель.disconnect();
    for (const изменение of изменения) {
      if (изменение.type === 'characterData' || изменение.type === 'attributes') перевестиУзел(изменение.target);
      else for (const узел of изменение.addedNodes) перевестиУзел(узел);
    }
    наблюдать();
  });
  function наблюдать() {
    наблюдатель.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title', 'placeholder', 'alt'] });
  }
  function обновить() {
    наблюдатель.disconnect();
    document.documentElement.lang = текущий;
    перевестиУзел(document.body);
    обновитьСтрокуВитрины();
    наблюдать();
  }
  const НАЗВАНИЯ = { ru: 'Русский', uk: 'Українська', en: 'English' };
  const КРУГ = ['ru', 'uk', 'en'];
  function название() { return НАЗВАНИЯ[текущий]; }
  /* Названия языков не переводятся (узел помечен data-no-translate в разметке). */
  function обновитьСтрокуВитрины() {
    const значение = document.getElementById('лист-язык-состояние');
    if (значение && значение.textContent !== название()) значение.textContent = название();
  }
  function выбрать(значение) {
    текущий = словарь.язык(значение);
    выбранный = текущий;
    try { localStorage.setItem(КЛЮЧ, текущий); } catch (_) {}
    обновить();
  }
  /* Переключить по кругу ru → uk → en → ru; возвращает код нового языка. */
  function следующий() {
    выбрать(КРУГ[(КРУГ.indexOf(текущий) + 1) % КРУГ.length]);
    return текущий;
  }
  function запустить() {
    // Строка «Язык» листа витрины лежит в index.html; оживляем её здесь же.
    // Лист не закрываем — как переключатель звука.
    const строкаВитрины = document.getElementById('кнопка-лист-язык');
    if (строкаВитрины) строкаВитрины.addEventListener('click', следующий);
    обновить();
    window.addEventListener('load', () => { if (!выбранный) { текущий = автоматически(); обновить(); } });
  }
  window.ЯзыкИнтерфейса = { выбрать, следующий, название, текущий: () => текущий, текст: с => словарь.текст(с, текущий) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', запустить, { once: true });
  else запустить();
})();
