'use strict';
window.CasualSnakeScene=(s)=>{
 const point=i=>[i%16*20+10,Math.floor(i/16)*20+10];let path='';
 s.body.forEach((v,n)=>{const [x,y]=point(v),p=s.body[n-1],connected=n&&Math.abs(v%16-p%16)+Math.abs(Math.floor(v/16)-Math.floor(p/16))===1;path+=(connected?'L':'M')+x+' '+y+' ';});
 const sprite=(kind,size)=>`<svg x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" viewBox="0 0 100 100" overflow="hidden"><image href="img/casual/studio/snake-pieces.webp" x="${-100*kind}" y="0" width="300" height="100" preserveAspectRatio="none" style="mix-blend-mode:screen"/></svg>`;
 const segments=s.body.map((v,n)=>{const [x,y]=point(v),size=n===s.body.length-1?23:n===0?28:27;return `<g data-segment="${n}" transform="translate(${x} ${y})"><g transform="rotate(${n===0?s.dir*90:0})">${sprite(n===0?1:0,size)}</g></g>`;}).reverse().join('');
 const [fx,fy]=s.food>=0?point(s.food):[-50,-50];
 return `<svg class="snake-scene" viewBox="0 0 320 320" aria-hidden="true"><defs><pattern id="jade-board-lines" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#d5b76e55" stroke-width=".45"/></pattern><radialGradient id="apple-halo"><stop stop-color="#ffc95655"/><stop offset="1" stop-color="#ffc95600"/></radialGradient></defs><path d="M0 0H320V320H0Z" fill="url(#jade-board-lines)"/><path d="${path}" stroke="#07190ddd" stroke-width="19" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(1 2)"/><path d="${path}" stroke="#315b39" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>${segments}<g class="jade-apple" transform="translate(${fx} ${fy})"><circle r="21" fill="url(#apple-halo)"/>${sprite(2,29)}</g></svg>`;
};
