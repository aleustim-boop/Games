'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,безTelegram}=require('./браузер-робот');
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});await безTelegram(page);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:8137/'+encodeURIComponent('катан.html'));await page.locator('#кат-боты').click();
    await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
    await page.screenshot({path:'tests/снимки/катан-настройки.png'});
    await page.locator('#кат-начать').click();
    await page.waitForFunction(()=>document.querySelector('#кат-поле [role=button]')!==null,{},{timeout:15000});
    await page.locator('#кат-поле [role=button]').first().click();
    await page.waitForFunction(()=>document.querySelector('#кат-поле [data-edge][role=button]')!==null);
    await page.locator('#кат-поле [data-edge][role=button]').first().click();
    await page.waitForTimeout(150);
    const saved=await page.evaluate(()=>localStorage.getItem('catan-match-v1'));assert(saved);
    await page.screenshot({path:'tests/снимки/катан-поле-1280.png'});
    await page.reload();await page.locator('#кат-продолжить').click();
    assert.equal(await page.locator('#экран-игры').getAttribute('class'),'экран экран--виден');
    for(const [w,h]of [[390,844],[320,640],[844,390],[768,1024]]){
      await page.setViewportSize({width:w,height:h});await page.waitForTimeout(150);
      const bounds=await page.locator('#экран-игры').evaluate(e=>({scroll:document.documentElement.scrollWidth,width:innerWidth,bottom:e.getBoundingClientRect().bottom,control:document.getElementById('кат-главное').getBoundingClientRect().bottom,height:innerHeight,right:Math.max(...[...e.querySelectorAll('.кат-ресурс,.кат-действия button,.кат-стройки button')].map(x=>x.getBoundingClientRect().right))}));
      assert(bounds.scroll<=bounds.width+1,JSON.stringify(bounds));assert(bounds.control<=bounds.height+1,JSON.stringify(bounds));
      assert(bounds.right<=bounds.width+1,JSON.stringify(bounds));
      await page.screenshot({path:`tests/снимки/катан-поле-${w}.png`});
    }
    assert.deepEqual(errors,[]);console.log('Катан: запуск, расстановка, сохранение, возврат и 4 размера экрана — OK');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
