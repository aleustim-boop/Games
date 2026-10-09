'use strict';
const assert=require('node:assert/strict');
const R=require(process.argv[2]?require('node:path').resolve(process.argv[2]):'../игры/бастион/бастион-правила.js');
const enemy=(id,type,d,hp=100,route='main')=>({id,type,d,hp,maxHp:hp,route,slow:0,slowPower:0,wet:0,burn:0,burnDamage:0,broken:0,heal:2});
{
 const s=R.create(7);R.build(s,0,'ballista');R.startWave(s);const t=s.towers[0];
 s.enemies=[enemy(1,'raider',500,100),enemy(2,'boss',100,500),enemy(3,'crab',300,140)];
 assert.equal(R.targets(s,t,2000)[0].id,1);
 assert(R.priority(s,0,'strong'));assert.equal(R.targets(s,t,2000)[0].id,2);
 assert(R.priority(s,0,'armor'));assert.equal(R.targets(s,t,2000)[0].id,3);
 assert(!R.priority(s,0,'random'));assert(R.restore(R.snapshot({...s,nextId:4})));
 R.priority(s,0,'first');s.enemies=[enemy(1,'raider',500),enemy(2,'raider',300,100,'tide')];
 assert.equal(R.targets(s,t,2000)[0].id,2,'До маяка по новому входу ближе, несмотря на меньшее пройденное расстояние');
 s.phase='lost';assert(!R.priority(s,0,'strong'));
}
{
 const s=R.create(3);R.startWave(s);s.queue=[];s.nextId=2;s.enemies=[enemy(1,'boss',100,1000)];
 for(let i=0;i<200;i++)R.tick(s);
 assert(s.enemies[0].charge>0,'Предупреждение до щита');assert.equal(s.enemies[0].shield,0);
 for(let i=0;i<42;i++)R.tick(s);
 const e=s.enemies[0];assert(e.shield>2.8,'Щит включён после предупреждения');
 const before=e.hp;R.cast(s,'meteor',R.position(s.map,e.d));assert(Math.abs(before-e.hp-150*1.27*.5)<1e-6,'Щит снижает урон способности вдвое');
 const copy=R.restore(R.snapshot(s));assert(copy);for(let i=0;i<95;i++){R.tick(s);R.tick(copy);}assert.equal(s.enemies[0].shield,0);assert.equal(R.snapshot(s),R.snapshot(copy));
}
{
 for(let wave=1;wave<=8;wave++)assert.equal(R.routeFor(7,wave),wave>=4&&wave%2===0?'tide':'main');
 const main=R.geometry(7),tide=R.geometry(7,'tide');assert(tide.length<main.length);
 assert.deepEqual(R.position(7,main.length),R.position(7,tide.length,'tide'),'Оба входа ведут к одному маяку');
 const s=R.create(7);s.wave=3;R.startWave(s);R.tick(s);assert.equal(s.enemies[0].route,'tide');
 const e=s.enemies[0],before=e.hp;R.cast(s,'meteor',R.position(7,e.d,e.route));assert(e.hp<before,'Касание альтернативного пути действительно наносит урон');
 assert(R.restore(R.snapshot(s)),'Альтернативный путь сохраняется');
 s.enemies[0].route='bad';assert.equal(R.restore(s),null);
}
{
 for(const map of [7,10,11]){const entry=R.routeEntry(map),g=R.geometry(map,entry.key);assert.deepEqual(R.position(map,g.length,entry.key),R.position(map,R.geometry(map).length));const points=R.routePath(map,entry.key);assert(points.every(p=>p.every(Number.isFinite)));for(let i=1;i<points.length;i++)assert(Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1])<40,'Маршрут непрерывный');}
 assert.deepEqual(R.routesForWave(11,3),['main','flank']);assert.equal(R.routeFor(10,3),'flank');assert.equal(R.routeFor(10,4),'main');
 const final=R.create(11);final.wave=2;R.startWave(final);for(let i=0;i<40;i++)R.tick(final);assert(new Set(final.enemies.map(e=>e.route)).size===2,'Финал действительно атакует с двух входов');assert(R.restore(R.snapshot(final)));
}
{
 const s=R.create();s.phase='wave';s.wave=1;s.nextId=2;s.enemies=[enemy(1,'crab',R.geometry(0).length-.01)];R.tick(s);
 assert.equal(s.metrics.leaks.crab,1);assert.equal(s.hp,18);
 const old=R.create();delete old.metrics;assert(R.restore(old),'Старое сохранение без метрик');
 old.draft=[{pad:1,type:'mortar'},{pad:3,type:'ballista'}];assert(R.restore(old));
 old.draft.push({pad:1,type:'tide'});assert.equal(R.restore(old),null,'Дублирующаяся площадка в расстановке');
 const invalid=R.create();invalid.metrics.leaks.unknown=1;assert.equal(R.restore(invalid),null);
}
console.log('Тактика: три приоритета, два маршрута, урон по новому пути, щит и предупреждение, сохранение, диагностика и старые партии — пройдены.');
