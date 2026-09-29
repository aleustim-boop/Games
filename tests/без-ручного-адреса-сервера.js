'use strict';
const assert=require('node:assert/strict'),{chromium,безTelegram}=require('./браузер-робот');
(async()=>{const b=await chromium.launch();try{for(const file of ['index','шахматы','шашки','нарды','деберц','домино','морской-бой','катан','монополия']){
 const p=await b.newPage({viewport:{width:390,height:844}});await безTelegram(p);await p.route(url=>url.port==='18799',r=>r.abort());const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.GAMES_TEST_SITE||'http://127.0.0.1:8137/')+encodeURIComponent(file)+'.html?сервер='+encodeURIComponent('http://127.0.0.1:18799'));
 assert.equal(await p.getByRole('button',{name:'Указать адрес сервера',exact:true,includeHidden:true}).count(),0);assert.equal(await p.locator('#поле-адреса,#кнопка-проверить-адрес,#кнопка-сохранить-адрес').count(),0);
 await p.evaluate(()=>Сеть.создатьКомнату({открытый:true}));
 assert.equal(await p.getByRole('button',{name:'Указать адрес сервера',exact:true,includeHidden:true}).count(),0);assert(!(await p.locator('#кнопка-адрес-сервера').isVisible()));assert(!(await p.locator('#кнопка-адрес-из-входа').isVisible()));
 const body=await p.locator('body').innerText();assert(!/впишите адрес|адрес.*кнопкой ниже/i.test(body));assert.deepEqual(errors,[],file);await p.close();console.log(file+': no manual server form, including connection failure — OK');
 }}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
