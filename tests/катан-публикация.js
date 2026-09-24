'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Б=require('../js/катан-бот');
const base=process.env.CATAN_BASE||'https://igra.medart.com.ua';
const players=[];
const req=async(p,body)=>{const r=await fetch(base+'/'+encodeURIComponent(p),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;};
(async()=>{
  for(const file of ['катан.html','style-катан.css','js/катан-правила.js','js/катан-бот.js','js/катан-поле.js','js/катан-память.js','js/катан-экран.js','img/катан/обложка-v2.webp','img/катан/земли-v2.webp','img/катан/развитие-v2.webp','img/катан/ресурсы-v2.webp','img/катан/постройки-v2.webp']){
    const response=await fetch(base+'/'+file.split('/').map(encodeURIComponent).join('/')+'?check='+Date.now());assert.equal(response.status,200,file);
    const actual=Buffer.from(await response.arrayBuffer()),expected=fs.readFileSync(path.join(__dirname,'..',file));
    if(/\.(jpg|webp)$/.test(file))assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),crypto.createHash('sha256').update(expected).digest('hex'),file);
    else assert.equal(actual.toString('utf8').replace(/\r\n/g,'\n').trimEnd(),expected.toString('utf8').replace(/\r\n/g,'\n').trimEnd(),file);
  }
  console.log('Опубликованные код, стили и пять изображений совпадают с проверенными файлами.');
  try{
    const a=await req('создать',{игра:'катан',мест:3,открытый:false,имя:'Проверка Катана 1'});players.push({код:a.код,пропуск:a.пропуск});
    for(let i=1;i<3;i++){const p=await req('войти',{код:a.код,имя:'Проверка Катана '+(i+1)});players.push({код:a.код,пропуск:p.пропуск});}
    assert.equal((await req('ход',{...players[0],действие:'начать'})).принято,true);
    let steps=0;
    while(steps++<2000){
      const states=await Promise.all(players.map(p=>req('состояние',p))),views=states.map(s=>(s.состояние||s).катан),v=views[0];assert(v);
      if(v.phase==='finished'){console.log('Живой сервер: полная партия завершилась за '+steps+' действий.');break;}
      const who=v.actor,move=Б.ход(views[who],'сложный');const reply=await req('ход',{...players[who],действие:'катан',move});assert.equal(reply.принято,true,JSON.stringify(reply));
      if(steps%100===0)console.log('Живой сервер: '+steps+' действий');
    }
    assert(steps<2000);console.log('Проверка опубликованного Катана — OK');
  }finally{for(const p of players)await req('выйти',p);}
})().catch(e=>{console.error(e);process.exitCode=1;});
