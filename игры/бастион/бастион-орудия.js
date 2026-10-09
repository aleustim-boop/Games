/* Отдельные слои основания и механизма. Поворот в плоскости острова,
   единая геометрия для изображения ствола и точки вылета снаряда. */
(function(root){'use strict';
const DEPTH=.62,HEIGHT=49;
const angleTo=(p,q)=>Math.atan2((q.y-p.y)/DEPTH,q.x-p.x);
const delta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const size=type=>type==='mortar'?134:148;
function pose(type,p,angle,recoil=0){const length=size(type)*.445-recoil;return {x:p.x+Math.cos(angle)*length,y:p.y+Math.sin(angle)*length*DEPTH-HEIGHT};}
class Weapons{
 constructor(){this.units=new Map();this.images={};}
 reset(){this.units.clear();}
 unit(t){let u=this.units.get(t.pad);if(!u||u.type!==t.type){u={type:t.type,angle:-Math.PI/3,target:-Math.PI/3,recoil:0,flash:0};this.units.set(t.pad,u);}return u;}
 aim(t,p,q,dt,motion=true){const u=this.unit(t);if(q)u.target=angleTo(p,q);const step=motion?Math.min(1,dt*12):1;u.angle+=delta(u.angle,u.target)*step;u.recoil=Math.max(0,u.recoil-dt*30);u.flash=Math.max(0,u.flash-dt);return u;}
 fire(t,p,q,motion=true){const u=this.unit(t);u.target=angleTo(p,q);u.angle=u.target;u.recoil=motion?8:0;u.flash=motion?.13:0;return pose(t.type,p,u.angle,0);}
 draw(c,t,p,motion){const u=this.unit(t),base=this.images['weapon-plinth'],weapon=this.images[t.type+'-overhead'],s=size(t.type);
  c.save();
  // Каменное основание никогда не поворачивается вместе со стволом.
  if(base)c.drawImage(base,p.x-70,p.y-101,140,140);
  // Дополнительный броневой венец остаётся неподвижным, уровень читается по силуэту.
  if(t.level>=2){c.strokeStyle=t.level===3?'#f3d590':'#b39a67';c.lineWidth=t.level===3?6:4;c.beginPath();c.ellipse(p.x,p.y+4,54,27,0,0,Math.PI*2);c.stroke();for(const side of [-1,1]){c.fillStyle='#29434b';c.strokeStyle='#d8b777';c.lineWidth=2;c.beginPath();c.moveTo(p.x+side*43,p.y-10);c.lineTo(p.x+side*59,p.y-17);c.lineTo(p.x+side*64,p.y+17);c.lineTo(p.x+side*43,p.y+20);c.closePath();c.fill();c.stroke();}}
  if(weapon){
   c.save();c.translate(p.x,p.y-HEIGHT);c.scale(1,DEPTH);c.rotate(u.angle);c.translate(-u.recoil,0);
   c.shadowColor='#06141bc0';c.shadowBlur=7;c.shadowOffsetY=9;
   if(t.level===3&&t.branch===1&&t.type==='ballista'){for(const y of [-24,24])c.drawImage(weapon,-s*.45,y-s*.35,s*.7,s*.7);}else c.drawImage(weapon,-s/2,-s/2,s,s);
   const rate=(t.type==='ballista'?.8:2.1)*(t.level===3&&t.branch===1&&t.type==='ballista'?.5:1),loaded=1-Math.min(1,Math.max(0,t.cooldown||0)/rate);
   c.shadowBlur=0;
   if(t.type==='ballista'){
    // Тетива натягивается, стрела появляется в ложе перед следующим выстрелом.
    const back=-15-loaded*24;c.strokeStyle='#e5d2a0';c.lineWidth=2;c.beginPath();c.moveTo(17,-s*.28);c.lineTo(back,0);c.lineTo(17,s*.28);c.stroke();
    if(loaded>.35){c.globalAlpha=Math.min(1,(loaded-.35)*2);c.strokeStyle='#f2dfad';c.lineWidth=t.level===3&&t.branch===0?5:3;c.beginPath();c.moveTo(back,0);c.lineTo(s*.39,0);c.stroke();c.fillStyle='#e8e8d8';c.beginPath();c.moveTo(s*.46,0);c.lineTo(s*.35,-6);c.lineTo(s*.35,6);c.closePath();c.fill();c.globalAlpha=1;}
   }else{
    // Казённый затвор отходит после выстрела, ядро входит перед закрытием.
    const open=loaded<.8?Math.sin(loaded/.8*Math.PI)*9:0;c.fillStyle='#4c4437';c.fillRect(-33,-9,21,18);c.strokeStyle='#d6b776';c.lineWidth=3;c.strokeRect(-33-open,-9,12,18);
    if(loaded>.18&&loaded<.65){const x=-43+(loaded-.18)/.47*24,g=c.createRadialGradient(x-3,-3,1,x,0,9);g.addColorStop(0,'#b3b7ac');g.addColorStop(1,'#293330');c.fillStyle=g;c.beginPath();c.arc(x,0,8,0,Math.PI*2);c.fill();}
    if(t.level===3){c.strokeStyle='#f5d68a';c.lineWidth=t.branch===0?7:3;c.beginPath();c.moveTo(-12,-22);c.lineTo(s*.3,-22);c.moveTo(-12,22);c.lineTo(s*.3,22);c.stroke();if(t.branch===1){for(const y of [-13,13]){c.fillStyle='#3c4542';c.beginPath();c.arc(s*.39,y,7,0,Math.PI*2);c.fill();c.strokeStyle='#e2bd6d';c.lineWidth=2;c.stroke();}}}
   }
   c.restore();
  }
  const muzzle=pose(t.type,p,u.angle,u.recoil);
  if(u.flash>0&&motion){const r=(t.type==='mortar'?34:15)*u.flash/.13,g=c.createRadialGradient(muzzle.x,muzzle.y,0,muzzle.x,muzzle.y,r);g.addColorStop(0,'#fffadb');g.addColorStop(.3,'#ffe4a0d0');g.addColorStop(1,'#f78b1700');c.fillStyle=g;c.fillRect(muzzle.x-r,muzzle.y-r,r*2,r*2);}
  c.restore();return muzzle;
 }
}
root.BastionWeapons={Weapons,angleTo,delta,pose};if(typeof module==='object'&&module.exports)module.exports=root.BastionWeapons;
})(typeof globalThis!=='undefined'?globalThis:this);
