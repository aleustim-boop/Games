// Кнопка с публичных правил ведёт сразу в выбранную игру.
// Приглашение за стол имеет приоритет над обычным переходом в лобби.
(function () {
  function открыть() {
    const параметры = new URLSearchParams(location.search);
    if (параметры.get('game') !== 'durak') return;
    if (параметры.has('code') || параметры.has('код') || параметры.has('tgWebAppStartParam') || window.Telegram?.WebApp?.initDataUnsafe?.start_param) return;
    if (typeof показатьЛоббиДурака === 'function') показатьЛоббиДурака();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', открыть, { once: true });
  else открыть();
})();
