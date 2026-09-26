'use strict';
const names={road:'Дорога',settlement:'Поселение',city:'Город',development:'Развитие',knight:'Рыцарь',roads:'Строительство дорог',plenty:'Изобилие',monopoly:'Монополия'};
const resources=['Дерево','Глина','Шерсть','Зерно','Руда'];
async function ход(page,v,a){
  if(await page.locator('#кат-бросок').isVisible()){
    try{await page.clock.fastForward(3000);}catch(_){}
    await page.locator('#кат-бросок').waitFor({state:'hidden'});
  }
  // #кат-бросок прячется раньше, чем в катан-экран.js снимается внутренний флаг
  // «presenting» (после кубиков ещё доигрывает разлёт ресурсов по игрокам) — всё
  // это время act() молча возвращает false и клик проваливается без ошибки.
  // «#кат-обмен» одновременно отражает и «busy», и «presenting» без привязки к
  // тому, чей сейчас ход — ждём его разблокировки перед любым действием.
  await page.waitForFunction(()=>!document.getElementById('кат-обмен')?.disabled,null,{timeout:6000}).catch(()=>{});
  const dialog=page.locator('#кат-диалог');
  if(await dialog.isVisible())await page.locator('#кат-закрыть').click();
  if(['road','settlement','city'].includes(a.type)){
    if(v.phase==='main'){await page.locator('#кат-строить').click();await page.locator('#кат-стройки').getByRole('button',{name:new RegExp('^'+names[a.type]+'$')}).click();}
    const selector=a.type==='road'?`[data-edge="${a.edge}"][role=button]`:`[data-vertex="${a.vertex}"][role=button]`;
    await page.locator('#кат-поле '+selector).click();
    await page.locator('#кат-главное').click();
  }else if(['roll','end','discard','steal'].includes(a.type)){
    await page.locator('#кат-главное').click();
    if(a.type==='discard'){for(let r=0;r<5;r++)await dialog.getByRole('spinbutton',{name:resources[r],exact:true}).fill(String(a.resources[r]));await dialog.getByRole('button',{name:'Подтвердить'}).click();}
    if(a.type==='steal')await dialog.getByRole('button',{name:new RegExp((v.names?.[a.victim]||'Бот '+a.victim)+' ·')}).click();
  }else if(a.type==='robber'){await page.locator(`#кат-поле [data-hex="${a.hex}"][role=button]`).click();await page.locator('#кат-главное').click();}
  else if(a.type==='development'){await page.locator('#кат-карты').click();await dialog.getByRole('button',{name:'Купить карту развития',exact:true}).click();await page.locator('#кат-закрыть').click();}
  else if(a.type==='bank'){
    await page.locator('#кат-обмен').click();await dialog.locator(`[data-bank-give="${a.give}"]`).click();await dialog.locator(`[data-bank-want="${a.want}"]`).click();await dialog.getByRole('button',{name:'Обменять',exact:true}).click();await page.locator('#кат-закрыть').click();
  }else if(a.type==='dev'){
    await page.locator('#кат-карты').click();await dialog.getByRole('button',{name:new RegExp('^'+names[a.card]+' ×')}).click();
    if(a.card==='plenty'){for(let r=0;r<5;r++)await dialog.getByRole('spinbutton',{name:resources[r],exact:true}).fill(String(a.resources[r]));await dialog.getByRole('button',{name:'Подтвердить'}).click();}
    if(a.card==='monopoly')await dialog.getByRole('button',{name:resources[a.resource],exact:true}).click();
  }else if(['accept','reject','cancelOffer'].includes(a.type)){
    // Пока бот считал ответ на предложение, другой игрок (или серверный бот на третьем
    // месте — он ходит своим таймером мимо браузера) мог уже принять/отклонить/отменить
    // тот же обмен: наш view() у решающего игрока устарел. Это нормальная гонка живой
    // партии, а не поломка — банер #кат-предложение уже пуст, действие просто пропускаем.
    if(await page.evaluate(id=>window.__publicView?.offer?.id!==id,a.offer))return true;
    if(a.type==='accept'){await page.locator('#кат-предложение button').click();await dialog.getByRole('button',{name:'Принять'}).click();}
    else if(a.type==='reject'){await page.locator('#кат-предложение button').click();await dialog.getByRole('button',{name:'Отказаться',exact:true}).click();}
    else{await page.locator('#кат-предложение button').click();await dialog.getByRole('button',{name:'Отменить предложение',exact:true}).click();}
  }
  else if(a.type==='offer'){
    // Своё предложение обмена: #кат-обмен → вкладка «С игроками» → кому → сколько отдаю/получаю → «Предложить обмен».
    const giveIndex=a.give.findIndex(n=>n>0),wantIndex=a.want.findIndex(n=>n>0);
    if(giveIndex<0||wantIndex<0)throw Error('Предложение обмена без ресурсов: '+JSON.stringify(a));
    await page.locator('#кат-обмен').click();
    await dialog.getByRole('button',{name:'С игроками',exact:true}).click();
    await dialog.getByRole('combobox',{name:'Кому предложить обмен'}).selectOption(String(a.to));
    await dialog.getByRole('spinbutton',{name:`Отдаю: ${resources[giveIndex]}`,exact:true}).fill(String(a.give[giveIndex]));
    await dialog.getByRole('spinbutton',{name:`Получаю: ${resources[wantIndex]}`,exact:true}).fill(String(a.want[wantIndex]));
    await dialog.getByRole('button',{name:'Предложить обмен',exact:true}).click();
  }else throw Error('Нет браузерного действия '+JSON.stringify(a));
}
module.exports={ход};
