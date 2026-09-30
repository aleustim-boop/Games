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
  if(weapon){
   c.save();c.translate(p.x,p.y-HEIGHT);c.scale(1,DEPTH);c.rotate(u.angle);c.translate(-u.recoil,0);
   c.shadowColor='#06141bc0';c.shadowBlur=7;c.shadowOffsetY=9;
   c.drawImage(weapon,-s/2,-s/2,s,s);c.restore();
  }
  const muzzle=pose(t.type,p,u.angle,u.recoil);
  if(u.flash>0&&motion){const r=(t.type==='mortar'?34:15)*u.flash/.13,g=c.createRadialGradient(muzzle.x,muzzle.y,0,muzzle.x,muzzle.y,r);g.addColorStop(0,'#fffadb');g.addColorStop(.3,'#ffe4a0d0');g.addColorStop(1,'#f78b1700');c.fillStyle=g;c.fillRect(muzzle.x-r,muzzle.y-r,r*2,r*2);}
  c.restore();return muzzle;
 }
}
root.BastionWeapons={Weapons,angleTo,delta,pose};if(typeof module==='object'&&module.exports)module.exports=root.BastionWeapons;
})(typeof globalThis!=='undefined'?globalThis:this);
