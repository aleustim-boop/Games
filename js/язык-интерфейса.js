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
  const исключения = 'script,style,noscript,textarea,code,[contenteditable],.выбор-языка,.рассадка__имя,.знакомые__имя,.профиль__имя,.соперник:not(.соперник--бот) .соперник__имя,[data-no-translate],[data-имя-игрока]';

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
    document.querySelectorAll('.выбор-языка select').forEach(с => { с.value = текущий; });
    наблюдать();
  }
  function выбрать(значение) {
    текущий = словарь.язык(значение);
    выбранный = текущий;
    try { localStorage.setItem(КЛЮЧ, текущий); } catch (_) {}
    обновить();
  }
  function запустить() {
    for (const id of ['экран-витрины', 'экран-лобби']) {
      const экран = document.getElementById(id);
      if (!экран) continue;
      const метка = document.createElement('label');
      метка.className = 'выбор-языка';
      метка.innerHTML = '<span aria-hidden="true">◎</span><select aria-label="Language / Мова / Язык"><option value="ru">Русский</option><option value="uk">Українська</option><option value="en">English</option></select>';
      метка.querySelector('select').addEventListener('change', е => выбрать(е.target.value));
      экран.prepend(метка);
    }
    обновить();
    window.addEventListener('load', () => { if (!выбранный) { текущий = автоматически(); обновить(); } });
  }
  window.ЯзыкИнтерфейса = { выбрать, текущий: () => текущий, текст: с => словарь.текст(с, текущий) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', запустить, { once: true });
  else запустить();
})();
