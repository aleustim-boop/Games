/* Походка привязана к пути, а не к часам: замедление и пауза сохраняют опорную ногу. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BastionMotion=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STRIDE={raider:36,runner:52,crab:25,shield:34,healer:32,boss:40};
function pose(enemy,from,to,motion=true){
 const dx=to.x-from.x,dy=to.y-from.y;
 const phase=motion?((Math.max(0,enemy.d)/(STRIDE[enemy.type]||36)+(enemy.id%7)/7)%1):0;
 const rear=dy<0,step=Math.floor(phase*4);
 return {frame:(rear?0:4)+step,flip:dx<0?-1:1,phase,rear,lift:motion&&enemy.type!=='crab'?Math.sin(phase*Math.PI*4)*1.1:0};
}
return {pose,STRIDE};
});
