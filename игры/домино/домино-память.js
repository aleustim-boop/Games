'use strict';
(function () {
  const П = typeof module !== 'undefined' && module.exports ? require('./домино-правила') : window.ДоминоПравила;
  function восстановить(data) {
    if (!data || data.версия !== 1 || !['лёгкий', 'обычный', 'сложный'].includes(data.уровень) || !Array.isArray(data.колода) || !Array.isArray(data.журнал) || data.журнал.length > 20000) throw Error('Сохранение повреждено');
    const g = П.создать(data.мест, data.цель, data.колода);
    for (const e of data.журнал) {
      if (e.действие === 'раунд') { if (!Array.isArray(e.колода)) throw Error('Сохранение повреждено'); П.следующий(g, e.колода); }
      else П.действие(g, e.кто, e);
    }
    return g;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { восстановить };
  if (typeof window !== 'undefined') window.ДоминоПамять = { восстановить };
})();
