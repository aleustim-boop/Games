'use strict';
// Тот же список и тот же сетевой вход, что в Дураке; настройки стола — Деберца.
window.НастройкиЭкранаОнлайн = {
  создатьИгру() { document.getElementById('кнопка-с-другом').click(); }
};
document.getElementById('кнопка-создать-игру').addEventListener('click', async e => {
  e.stopImmediatePropagation();
  e.preventDefault();
  const button = e.currentTarget;
  if (button.disabled) return;
  button.disabled = true;
  try { await window.Сеть.создатьКомнату({ открытый: true }); }
  finally { button.disabled = false; }
}, true);
