'use strict';
const A=require('node:assert/strict'),P=require('../js/катан-правила'),{chromium,безTelegram}=require('./браузер-робот');
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();await безTelegram(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.CATAN_TEST_URL||'http://127.0.0.1:8137/катан.html',{waitUntil:'domcontentloaded'});
for(const kind of ['army','road'])for(const [width,height]of [[320,740],[390,844],[844,390],[1440,900]]){
 await p.setViewportSize({width,height});await p.goto(process.env.CATAN_TEST_URL||'http://127.0.0.1:8137/катан.html',{waitUntil:'domcontentloaded'});const v=P.вид(P.создать(3,42,false,3),0);v.names=['Вы','АлександрОченьДлинноеИмяБезПробеловДляПроверкиПереноса','Друг'];v.phase='main';v.actor=1;v.turn=1;
 await p.evaluate(({v,kind,width})=>{const code='award-'+kind+width;ИграПоСети.показатьВид({код:code,версия:1,катан:v});const next=structuredClone(v);next.serial++;next[kind+'Owner']=1;ИграПоСети.показатьВид({код:code,версия:2,катан:next});},{v,kind,width});
 const dialog=p.locator('#кат-диалог[data-kind=award][open]');await dialog.waitFor();
 A(await dialog.evaluate(d=>{const r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&d.scrollWidth<=d.clientWidth+1;}),'Окно помещается по ширине '+width);
 A(await p.locator('#кат-диалог-заголовок').evaluate(e=>{const r=e.getBoundingClientRect(),d=e.closest('dialog').getBoundingClientRect();return r.left>=d.left&&r.right<=d.right&&e.scrollWidth<=e.clientWidth+1;}),'Заголовок не обрезан');
 if(kind==='army')A(await p.locator('img.кат-бонус-рисунок').evaluate(async i=>{await i.decode();return i.complete&&i.naturalWidth>0;}),'Рыцарь загрузился');else A.equal(await p.locator('svg.кат-бонус-рисунок').evaluate(e=>getComputedStyle(e).fill),'none');
 if(width===390)await p.screenshot({path:`tests/снимки/катан-награда-${kind}.png`});
 await p.getByRole('button',{name:'Понятно',exact:true}).click();A.equal(await dialog.count(),0);
}A.deepEqual(errors,[]);console.log('Награды армии и дороги: 4 экрана, длинное имя, изображение рыцаря, золотая дорога, доступное закрытие — OK');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
