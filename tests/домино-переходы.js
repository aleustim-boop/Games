'use strict';
const assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');process.env.ДАННЫЕ_ИГРЫ=path.join(os.tmpdir(),'domino-links-'+process.pid);const server=require('../server/сервер').создатьСервер();const {chromium,безTelegram}=require('./браузер-робот');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true});try{
const p=await b.newPage({viewport:{width:390,height:844}});await безTelegram(p);const base='http://127.0.0.1:8137/',query='?server=http://127.0.0.1:'+server.address().port;
await p.goto(base+'index.html'+query);await p.locator('a[data-игра="домино"]').click();await p.waitForURL(u=>decodeURIComponent(u.pathname).endsWith('/домино.html'));
await p.locator('#дом-профиль').click();assert.equal(await p.locator('.экран--виден').getAttribute('id'),'экран-профиля-игрока');
await p.goto(base+'домино.html'+query);await p.locator('#дом-рейтинг').click();assert.equal(await p.locator('.экран--виден').getAttribute('id'),'экран-рейтинга-игроков');
const room=await(await fetch('http://127.0.0.1:'+server.address().port+'/создать',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({игра:'домино',имя:'Анна'})})).json();
await p.goto(base+'index.html'+query+'#tgWebAppStartParam=domino_'+room.код);await p.waitForURL(u=>decodeURIComponent(u.pathname).endsWith('/домино.html'));await p.locator('#экран-игры').waitFor();assert.equal(await p.locator('.дом-игрок').count(),2);
console.log('Витрина, профиль, рейтинг и приглашение с переходом на нужную игру — OK');
}finally{await b.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
