'use strict';
const names={road:'Дорога',settlement:'Поселение',city:'Город',development:'Развитие',knight:'Рыцарь',roads:'Строительство дорог',plenty:'Изобилие',monopoly:'Монополия'};
const resources=['Дерево','Глина','Шерсть','Зерно','Руда'];
async function ход(page,v,a){
  if(await page.locator('#кат-бросок').isVisible()){
    try{await page.clock.fastForward(3000);}catch(_){}
    await page.locator('#кат-бросок').waitFor({state:'hidden'});
  }
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
  }else if(a.type==='robber')await page.locator(`#кат-поле [data-hex="${a.hex}"][role=button]`).click();
  else if(a.type==='development'){await page.locator('#кат-карты').click();await dialog.getByRole('button',{name:'Купить карту развития',exact:true}).click();await page.locator('#кат-закрыть').click();}
  else if(a.type==='bank'){
    await page.locator('#кат-обмен').click();await dialog.getByRole('combobox',{name:'Отдать банку'}).selectOption(String(a.give));await dialog.getByRole('combobox',{name:'Получить из банка'}).selectOption(String(a.want));await dialog.getByRole('button',{name:'Обменять',exact:true}).click();await page.locator('#кат-закрыть').click();
  }else if(a.type==='dev'){
    await page.locator('#кат-карты').click();await dialog.getByRole('button',{name:new RegExp('^'+names[a.card]+' ×')}).click();
    if(a.card==='plenty'){for(let r=0;r<5;r++)await dialog.getByRole('spinbutton',{name:resources[r],exact:true}).fill(String(a.resources[r]));await dialog.getByRole('button',{name:'Подтвердить'}).click();}
    if(a.card==='monopoly')await dialog.getByRole('button',{name:resources[a.resource],exact:true}).click();
  }else if(a.type==='accept'){await page.locator('#кат-предложение button').click();await dialog.getByRole('button',{name:'Принять'}).click();}
  else throw Error('Нет браузерного действия '+JSON.stringify(a));
}
module.exports={ход};
