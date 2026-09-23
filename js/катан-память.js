'use strict';
(function(root){
  const П=typeof module!=='undefined'?require('./катан-правила'):root.КатанПравила;
  function восстановить(data){
    if(!data||data.version!==1||!Number.isInteger(data.seed)||data.seed<1||data.seed>4294967295||![3,4].includes(data.n)||!['лёгкий','обычный','сложный'].includes(data.level)||!Array.isArray(data.actions)||data.actions.length>20000)throw Error('Сохранение повреждено');
    const g=П.создать(data.n,data.seed);
    for(const item of data.actions)П.действие(g,item.player,item.action);
    return g;
  }
  const api={восстановить};if(typeof module!=='undefined')module.exports=api;else root.КатанПамять=api;
})(typeof window!=='undefined'?window:globalThis);
