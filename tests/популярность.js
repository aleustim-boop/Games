'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
// Путь к модулю можно подменить доводом: ломающий запуск даёт копию во временной папке.
const модульПуть=process.argv[2]&&process.argv[2]!=='--сломать'?process.argv[2]:'../server/популярность';
const {создать}=require(модульПуть);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-stats-')),file=path.join(dir,'data.json');
const stats=создать(file),start=Date.now(),event=(n,seconds)=>({сеанс:'session-123',номер:n,секунд:seconds});
assert(stats.учесть('123','катан',event(0,0),start));
assert(stats.учесть('123','катан',event(1,30),start+30000));
assert(!stats.учесть('123','катан',event(1,30),start+31000),'duplicate must not count');
assert(stats.учесть('123','монополия',event(0,30),start+30000));
assert.equal(stats.сводка(start+30000).find(r=>r.game==='монополия').seconds,0,'parallel tabs cannot add time');
assert(stats.учесть('123','катан',event(2,0),start+600000));
assert.equal(stats.сводка(start+600000).find(r=>r.game==='катан').seconds,30,'hidden time does not count');
assert.equal(stats.сводка(start+600000).find(r=>r.game==='катан').launches,1,'reloads/resumes do not inflate visits');
stats.учесть('123','катан',event(3,0),start+2400000);
assert.equal(stats.сводка(start+2400000)[0].launches,2);
assert(!stats.учесть('123','unknown',event(0,0),start));
assert(!stats.учесть('123','катан',event(5,999999),start));
assert(stats.учесть('456','2048',event(0,0),start+2400000));
assert.equal(stats.сводка(start+2400000).find(r=>r.game==='2048').launches,1);
assert(stats.учесть('789','судоку',event(0,0),start+2400000));
assert.equal(stats.сводка(start+2400000).find(r=>r.game==='судоку').launches,1);
assert(stats.учесть('987','японский-кроссворд',event(0,0),start+2400000));
assert.equal(stats.сводка(start+2400000).find(r=>r.game==='японский-кроссворд').launches,1);
stats.дописать();assert.deepEqual(создать(file).сводка(start+2400000),stats.сводка(start+2400000));
assert(stats.сводка(start+32*86400000).every(r=>r.seconds===0&&r.launches===0));

// Этап А1: список игр — из реестра, покер и бастион больше не теряются.
const реестр=require('../js/игры-реестр.js').все().map(з=>з.ключ);
assert(реестр.includes('покер')&&реестр.includes('бастион'),'в реестре должны быть покер и бастион (ноль найденного — провал)');
const общая=создать(),t0=start+3*86400000;
for(const ключ of реестр){
  assert(общая.учесть('555',ключ,{сеанс:'session-all-'+ключ.length,номер:0,секунд:0},t0),'пульс игры «'+ключ+'» из реестра должен приниматься');
}
assert(общая.сводка(t0).find(r=>r.game==='покер'),'покер есть в сводке популярности');
assert(общая.сводка(t0).find(r=>r.game==='бастион'),'бастион есть в сводке популярности');
assert.equal(общая.сводка(t0).length,реестр.length,'в сводке популярности ровно игры реестра');

// Гостей сюда не пускаем: ид гостя (латиница) отбрасывается, как и всё, что не число Telegram.
const ид='abcdef0123456789abcd';
assert(!общая.учесть(ид,'катан',{сеанс:'session-guest-1',номер:0,секунд:0},t0+1000),'гость не должен попадать в популярность');
assert.equal(общая.сводка(t0+1000).find(r=>r.game==='катан').launches,1,'запуск гостя не накрутил витрину');

fs.rmSync(dir,{recursive:true});
console.log('Итого проверок: прошли все (утверждения assert), провалов: 0');
console.log('Popularity: deduplication, visible time, multi-tab cap, persistence, 30-day window, registry games and no guests OK');
