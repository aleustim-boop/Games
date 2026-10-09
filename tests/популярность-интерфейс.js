'use strict';
/* Проверка общее/js/популярность.js.
   Часть 1 (песочница vm, без браузера): пульс гостя из браузера — тело с `гость` и без `initData`,
   ид стабилен между запусками, в Telegram `гость` не уходит.
   Часть 2 (браузер, нужен сервер страниц на 8137): сортировка витрины, запуск, фоновое время.
   Запуск:
     node tests/популярность-интерфейс.js                    — обе части
     node tests/популярность-интерфейс.js --без-браузера     — только песочница
     node tests/популярность-интерфейс.js --сломать          — портит КОПИИ файла во временной папке, каждая обязана покраснеть
     node tests/популярность-интерфейс.js --файл=<путь>      — песочница против указанной копии (довод для ломающего запуска) */
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {webcrypto}=require('node:crypto');

const ПРОЕКТ=path.join(__dirname,'..');
const НАСТОЯЩИЙ_ФАЙЛ=path.join(ПРОЕКТ,'общее','js','популярность.js');
const аргФайл=process.argv.find(а=>а.startsWith('--файл='));
const ФАЙЛ=аргФайл?аргФайл.slice('--файл='.length):НАСТОЯЩИЙ_ФАЙЛ;

/* Запуск страницы игры в песочнице: лобби видно, вкладка активна — первый пульс уходит сразу.
   память: Map — «localStorage»; бросает: true — память кидает исключение на любое обращение.
   Возвращает отправленные запросы и функцию «прошла минута» (для второго пульса в той же странице). */
function запуститьСтраницу(файл,{телеграм=false,память=new Map(),бросает=false}={}){
  const запросы=[];let сейчас=0,тик=null;
  const хранилище={
    getItem(к){if(бросает)throw new Error('память недоступна');return память.has(к)?память.get(к):null;},
    setItem(к,з){if(бросает)throw new Error('память недоступна');память.set(к,String(з));}
  };
  const документ={
    currentScript:{dataset:{game:'дурак'}},
    visibilityState:'visible',activeElement:null,
    querySelector(селектор){return селектор==='#экран-лобби.экран--виден'?{}:null;},
    addEventListener(){}
  };
  const окружение={
    document:документ,localStorage:хранилище,location:{search:'',origin:'http://проверка.local'},
    crypto:{randomUUID:()=>'сеанс-проверки',getRandomValues:webcrypto.getRandomValues.bind(webcrypto)},
    performance:{now:()=>сейчас},
    setInterval(функция){тик=функция;return 1;},
    addEventListener(){},
    fetch(адрес,настройки){запросы.push({адрес:decodeURI(String(адрес)),тело:JSON.parse(настройки.body)});return Promise.resolve({});},
    URLSearchParams
  };
  окружение.window=окружение;
  if(телеграм)окружение.Telegram={WebApp:{initData:'query_id=AAA&hash=бумажная-подпись',onEvent(){}}};
  vm.runInNewContext(fs.readFileSync(файл,'utf8'),окружение,{filename:файл});
  return {запросы,прошлаМинута(){сейчас+=61000;тик();}};
}

/* Все проверки песочницы против одного файла. Возвращает список провалов (пустой — всё зелёное). */
function проверитьФайл(файл){
  const провалы=[];let проверок=0;
  function проверить(условие,что){проверок++;if(!условие){провалы.push(что);console.log('  ✗ '+что);}else console.log('  ✓ '+что);}
  const похожНаИд=и=>typeof и==='string'&&/^[a-z0-9]{16}$/.test(и);

  // 1. Без Telegram — тело гостя.
  const память=new Map();
  const первый=запуститьСтраницу(файл,{память});
  проверить(первый.запросы.length===1,'без Telegram уходит один пульс (ушло: '+первый.запросы.length+') — ноль был бы провалом');
  const тело=первый.запросы[0]?.тело||{};
  проверить(first_ok(первый.запросы[0],'/пульс'),'пульс идёт на /пульс');
  проверить(похожНаИд(тело.гость),'в теле есть «гость» из 16 знаков [a-z0-9] (было: '+JSON.stringify(тело.гость)+')');
  проверить(!('initData' in тело),'в теле гостя нет initData');
  проверить(тело.игра==='дурак','в теле гостя есть «игра» (было: '+JSON.stringify(тело.игра)+')');
  проверить(память.get('guest_id')===тело.гость,'ид гостя сохранён в памяти браузера под ключом guest_id');

  // 2. Тот же ид между двумя запусками с одной памятью.
  const второй=запуститьСтраницу(файл,{память});
  проверить(второй.запросы[0]?.тело?.гость===тело.гость&&!!тело.гость,'ид стабилен между двумя запусками с одной памятью');
  const другая=запуститьСтраницу(файл,{память:new Map()});
  проверить(похожНаИд(другая.запросы[0]?.тело?.гость)&&другая.запросы[0].тело.гость!==тело.гость,'в пустой памяти рождается новый ид, не прежний');

  // 3. Испорченное значение в памяти заменяется настоящим идом.
  const мусор=запуститьСтраницу(файл,{память:new Map([['guest_id','не ид!']])});
  проверить(похожНаИд(мусор.запросы[0]?.тело?.гость),'мусор в guest_id заменён нормальным идом');

  // 4. Память бросает исключение — страница не падает, ид живёт в переменной.
  let сбой=null,сломаннаяПамять=null;
  try{сломаннаяПамять=запуститьСтраницу(файл,{бросает:true});сломаннаяПамять.прошлаМинута();}catch(е){сбой=е;}
  проверить(!сбой,'память бросает исключение — страница не падает'+(сбой?' ('+сбой.message+')':''));
  const пульсы=(сломаннаяПамять?.запросы||[]).map(з=>з.тело.гость);
  проверить(пульсы.length===2&&похожНаИд(пульсы[0])&&пульсы[0]===пульсы[1],'без памяти ид один и тот же в двух пульсах одной страницы (было: '+JSON.stringify(пульсы)+')');

  // 5. В Telegram всё как раньше: initData есть, гостя нет.
  const вТелеграме=запуститьСтраницу(файл,{телеграм:true,память:new Map()});
  const тт=вТелеграме.запросы[0]?.тело||{};
  проверить(вТелеграме.запросы.length===1&&typeof тт.initData==='string'&&тт.initData.length>0,'с Telegram уходит initData');
  проверить(!('гость' in тт),'с Telegram поле «гость» не уходит');
  проверить(!!тт.каталог&&тт.каталог.сеанс==='сеанс-проверки','с Telegram прежний каталог (сеанс, номер, секунд) на месте');

  console.log('Итого проверок: '+проверок+', провалов: '+провалы.length);
  return провалы;
}
function first_ok(запрос,путь){return !!запрос&&запрос.адрес.endsWith(путь);}

/* Ломающий запуск: каждая копия во временной папке обязана покраснеть. */
function сломать(){
  const варианты=[
    {имя:'без-ветки-гостя',замены:[['const initData=window.Telegram?.WebApp?.initData;','const initData=window.Telegram?.WebApp?.initData;if(!initData)return;']]},
    {имя:'ид-не-сохраняется',замены:[['try{localStorage.setItem(guestKey,guestMemo);}catch{}','']]},
    {имя:'гость-и-в-телеграме',замены:[['{initData,игра:game,каталог:','{initData,гость:guestId(),игра:game,каталог:']]}
  ];
  let код=0;
  for(const в of варианты){
    let текст=fs.readFileSync(НАСТОЯЩИЙ_ФАЙЛ,'utf8');
    for(const [откуда,куда] of в.замены){
      if(!текст.includes(откуда)){console.log('✗ поломка «'+в.имя+'» не применилась: не найден фрагмент');код=1;continue;}
      текст=текст.split(откуда).join(куда);
    }
    const папка=fs.mkdtempSync(path.join(os.tmpdir(),'популярность-'+в.имя+'-'));
    const копия=path.join(папка,'популярность.js');
    fs.writeFileSync(копия,текст,'utf8');
    console.log('\n--- Вариант «'+в.имя+'»: копия '+копия+' ---');
    const провалы=проверитьФайл(копия);
    if(провалы.length===0){console.log('ПРОВЕРКА СЛЕПАЯ: «'+в.имя+'» не покраснела');код=1;}
    else console.log('«'+в.имя+'» покраснела ('+провалы.length+' провалов) — проверка рабочая');
    fs.rmSync(папка,{recursive:true,force:true});
  }
  return код;
}

/* Часть 2: браузер по остатку (сортировка витрины, запуск, фоновое время). */
async function браузернаяЧасть(){
  const {chromium,подготовитьПодделку}=require('./браузер-робот');
  const browser=await chromium.launch();try{
   const p=await browser.newPage({viewport:{width:390,height:844}}),events=[];
   await подготовитьПодделку(p,{версия:'8.0',подпись:'test-signature'});await p.clock.install();
   await p.route('**/*',async route=>{
    const url=decodeURI(route.request().url());
    if(url.endsWith('/статистика'))return route.fulfill({json:{популярность:[{game:'катан'},{game:'монополия'},{game:'дурак'}]}});
    if(url.endsWith('/пульс')){const data=route.request().postDataJSON();if(data.каталог)events.push(data);return route.fulfill({json:{ок:true}});}
    return route.fallback();
   });
   await p.goto('http://127.0.0.1:8137/index.html');
   await p.waitForFunction(()=>document.querySelector('.витрина__плитки').firstElementChild.dataset.игра==='катан');
   assert.equal(events.length,0,'catalogue is not a Durak launch');
   await p.locator('[data-фильтр="карточные"]').click();assert.equal(await p.locator('.плитка-игры:visible').count(),6);
   await p.goto('http://127.0.0.1:8137/монополия.html');await p.clock.runFor(1100);assert(events.some(e=>e.игра==='монополия'));
   await p.evaluate(()=>{document.querySelector('#экран-лобби').classList.remove('экран--виден');document.querySelector('#экран-игры').classList.add('экран--виден');});
   await p.clock.runFor(32000);assert(events.some(e=>e.каталог.секунд>=29));
   const before=events.reduce((n,e)=>n+e.каталог.секунд,0);
   await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
   await p.clock.runFor(120000);const after=events.reduce((n,e)=>n+e.каталог.секунд,0);assert(after-before<2,'background time must not count');
   console.log('Popularity UI: sorted catalogue, filters, launch and hidden-time exclusion OK');
  }finally{await browser.close()}
}

(async()=>{
  if(process.argv.includes('--сломать')){process.exitCode=сломать();return;}
  const провалы=проверитьФайл(ФАЙЛ);
  if(провалы.length){process.exitCode=1;return;}
  if(аргФайл||process.argv.includes('--без-браузера'))return;
  await браузернаяЧасть();
})().catch(e=>{console.error(e);process.exitCode=1});
