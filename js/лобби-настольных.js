'use strict';
/* Общие детали эталонного лобби. Двери игр и их обработчики остаются прежними. */
(function () {
  const game = window.ИграСтраницы, prefix = game === 'домино' ? 'дом' : 'море';
  const ids = ['кнопка-лобби-назад', `${prefix}-рейтинг`, `${prefix}-профиль`];
  document.querySelector('#экран-лобби .нижние-вкладки').innerHTML = window.НижниеВкладки
    .вкладкиНабора('лобби-деберц').map((tab, i) => window.НижниеВкладки.кнопкаHTML({ ...tab, id: ids[i] })).join('');
  const name = document.getElementById('лобби-имя');
  const refresh = () => { name.textContent = window.Телеграм?.имяИгрока?.() || 'Вы'; };
  refresh(); window.addEventListener('load', refresh);
  document.getElementById('лобби-профиль').onclick = () => window.ЭкранПрофиля.открыть(game);
  document.getElementById('лобби-правила').onclick = () => document.getElementById(`${prefix}-правила`).click();
})();
