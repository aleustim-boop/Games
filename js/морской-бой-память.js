'use strict';
(function () {
  const П = typeof module !== 'undefined' && module.exports ? require('./морской-бой-правила') : window.МорскойБойПравила;
  function восстановить(data) {
    if (!data || data.версия !== 1 || !Array.isArray(data.журнал) || data.журнал.length > 205 || !['лёгкий', 'обычный', 'сложный'].includes(data.уровень)) throw Error('Сохранение повреждено');
    const игра = П.создать(data.первый);
    for (const e of data.журнал) {
      if (e.тип === 'готов') П.готов(игра, e.кто, e.флот);
      else if (e.тип === 'выстрел') П.стрелять(игра, e.кто, e.клетка);
      else if (e.тип === 'сдаться') П.сдаться(игра, e.кто);
      else throw Error('Неизвестное действие');
    }
    if (П.проверитьФлот(data.черновик, false)) throw Error('Неверная расстановка');
    return игра;
  }
  const api = { восстановить };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.МорскойБойПамять = api;
})();
