'use strict';
const assert=require('node:assert/strict'),R=require('../игры/бастион/бастион-правила.js');
function scenario(type,level=1,branch=null,enemyType='raider'){const s=R.create(6),p=R.pads(6)[0];let best=0,min=Infinity;for(let d=0;d<R.geometry(6).length;d+=5){const q=R.position(6,d),r=Math.hypot(p.x-q.x,p.y-q.y);if(r<min){min=r;best=d;}}s.gold=2000;R.build(s,0,type);if(level>=2)R.upgrade(s,0);if(level===3)R.upgrade(s,0,branch);R.startWave(s);s.queue=[];s.nextId=2;s.enemies=[{id:1,type:enemyType,d:best,hp:10000,maxHp:10000,slow:0,slowPower:0,wet:0,burn:0,burnDamage:0,broken:0,heal:2}];return s;}
let s=scenario('ballista',1,null,'crab');R.tick(s,.01);assert.equal(s.enemies[0].hp,10000-12);
s=scenario('ballista',3,0,'crab');R.tick(s,.01);assert(Math.abs(s.enemies[0].hp-(10000-91.2))<.001);
s=scenario('mortar',3,0,'crab');R.tick(s,.01);assert.equal(s.enemies[0].broken,4);assert.equal(s.enemies[0].hp,10000-144);
s=scenario('tide',3,0);R.tick(s,.01);assert.equal(s.enemies[0].slowPower,.65);assert(s.enemies[0].wet>0);
s=scenario('tide',3,1);s.enemies.push({...s.enemies[0],id:2,d:s.enemies[0].d+10});s.nextId=3;R.tick(s,.01);assert(s.enemies.every(e=>e.wet>0));
s=scenario('storm');s.enemies[0].wet=3;R.tick(s,.01);assert.equal(s.enemies[0].hp,10000-36);
s=scenario('storm',3,0);for(let i=1;i<5;i++)s.enemies.push({...s.enemies[0],id:i+1,d:s.enemies[0].d+i*5});s.nextId=6;R.tick(s,.01);assert.equal(s.enemies.filter(e=>e.hp<10000).length,5);
s=scenario('storm',3,1);s.enemies.push({...s.enemies[0],id:2});s.nextId=3;R.tick(s,.01);assert.equal(s.enemies.filter(e=>e.hp<10000).length,1);
s=scenario('fire',3,0,'crab');R.tick(s,.01);assert.equal(s.enemies[0].burnDamage,60);const hp=s.enemies[0].hp;R.tick(s,.1);assert(Math.abs(hp-s.enemies[0].hp-6)<.001);
s=scenario('signal');const h=s.enemies[0].hp;R.tick(s,.1);assert.equal(s.enemies[0].hp,h);assert.equal(R.stats({type:'signal',level:3,branch:0},s).buff,1.4);
s=scenario('ballista');s.enemies[0].type='healer';s.enemies[0].hp=500;s.enemies[0].heal=.001;R.tick(s,.01);assert(s.enemies[0].hp>500,'Хранитель не лечит');
// Эффект воды истекает, более слабая башня не ослабляет активный прилив.
s=scenario('tide');R.cast(s,'tide');R.tick(s,.01);assert.equal(s.enemies[0].slowPower,.7);
assert.throws(()=>R.create('map'));assert.throws(()=>R.create(0,'constructor'));const invalid=R.create();invalid.difficulty='toString';assert.equal(R.restore(invalid),null);
console.log('Броня, пробитие, снятие брони, массовое замедление, мокрые цели, обе ветви молнии, горение, поддержка и лечение — проверены.');
