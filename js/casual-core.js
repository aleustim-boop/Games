'use strict';
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.CasualCore=f();})(globalThis,()=>{
 function random(seed){let x=(seed>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
 function shuffle(a,rng){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 const clone=s=>JSON.parse(JSON.stringify(s));
 function base(mode,seed){return {version:1,mode,seed:seed>>>0,score:0,moves:0,seconds:0,aids:0,won:false,lost:false};}
 const ints=(a,length,min,max)=>Array.isArray(a)&&a.length===length&&a.every(v=>Number.isInteger(v)&&v>=min&&v<=max);
 return {random,shuffle,clone,base,ints};
});
