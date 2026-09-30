/* Техническая подготовка сгенерированных PNG: размер, WebP и контрольный лист маршрутов. */
'use strict';
const fs=require('node:fs'),{chromium}=require('./браузер-робот.js'),R=require('../js/бастион-правила.js');
(async()=>{const server=await require('./бастион-стенд.js')(),browser=await chromium.launch({headless:true});try{
 const p=await browser.newPage();await p.goto(server.url+'/');
 const jobs=Object.keys(R.ENEMIES).map(type=>({source:type+'-stride-'+(type==='crab'?'v6b':'v6')+'.png',target:type+'-stride-v6.webp',w:1600,h:800}));
 jobs.push({source:"boss-ritual-v6.png",target:"boss-ritual-v6.webp",w:1600,h:534});
 for(let i=1;i<=12;i++){const name='island-'+String(i).padStart(2,'0');jobs.push({source:name+'-v6.png',target:name+'-v6.webp',w:1254,h:1254},{source:name+'-v6.png',target:name+'-thumb-v6.webp',w:360,h:360,mirror:i%2===0});}
 let count=0;
 for(const job of jobs){if(!fs.existsSync('img/бастион/'+job.source))continue;const data=await p.evaluate(async j=>{const im=new Image();im.src='img/бастион/'+j.source;await im.decode();const c=document.createElement('canvas');c.width=j.w;c.height=j.h;const ctx=c.getContext('2d');if(j.mirror){ctx.translate(j.w,0);ctx.scale(-1,1);}ctx.drawImage(im,0,0,j.w,j.h);return c.toDataURL('image/webp',.86).split(',')[1];},job);fs.writeFileSync('img/бастион/'+job.target,Buffer.from(data,'base64'));count++;}
 const maps=R.MAPS.filter(m=>fs.existsSync('img/бастион/island-'+String(m.id+1).padStart(2,'0')+'-v6.webp'));
 const image=await p.evaluate(async maps=>{const c=document.createElement('canvas');c.width=1600;c.height=1200;const x=c.getContext('2d');x.fillStyle='#09282d';x.fillRect(0,0,c.width,c.height);for(const m of maps){const im=new Image();im.src='img/бастион/island-'+String(m.id+1).padStart(2,'0')+'-v6.webp';await im.decode();const ox=m.id%4*400,oy=Math.floor(m.id/4)*400;x.save();x.translate(ox,oy);x.scale(.4,.4);if(m.mirror){x.translate(1000,0);x.scale(-1,1);}x.drawImage(im,0,0,1000,1000);x.restore();x.save();x.translate(ox,oy);x.scale(.4,.4);x.strokeStyle='#fa3b9a';x.lineWidth=4;x.beginPath();m.path.forEach((q,i)=>i?x.lineTo(...q):x.moveTo(...q));x.stroke();x.fillStyle='#65ffdf';for(const q of m.pads){x.beginPath();x.arc(q.x,q.y,12,0,Math.PI*2);x.fill();}x.restore();x.fillStyle='#08282ee6';x.fillRect(ox,oy+373,400,27);x.fillStyle='#ffe4a9';x.font='16px Arial';x.fillText((m.id+1)+'. '+m.name,ox+10,oy+392);}return c.toDataURL('image/png').split(',')[1];},maps);
 fs.mkdirSync('tests/снимки',{recursive:true});fs.writeFileSync('tests/снимки/бастион-острова-v6.png',Buffer.from(image,'base64'));
 console.log('WebP: '+count+'; карты с реальным маршрутом: '+maps.length);
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
