'use strict';
const assert=require('node:assert/strict');
const {chromium,безTelegram}=require('./браузер-робот.js');
async function main(){
 const server=await require('./бастион-стенд.js')(),browser=await chromium.launch({headless:true}),errors=[];
 try{
  const url=server.url+'/'+encodeURIComponent('бастион')+'.html';
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  await безTelegram(page);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Недоступно','SecurityError');};Storage.prototype.setItem=function(){throw new DOMException('Недоступно','QuotaExceededError');};});
  await page.goto(url);await page.waitForFunction(()=>БастионИгра.готов());
  assert(await page.locator('#storage-warning').isVisible());
  await page.locator('#start').click();await page.locator('[data-pad="1"]').click();await page.locator('[data-build="mortar"]').click();await page.locator('#launch').click();
  await page.waitForFunction(()=>БастионИгра.состояние().time>.1);assert(await page.locator('#storage-warning').isVisible());await page.close();
  const retry=await browser.newPage();await безTelegram(retry);retry.on('pageerror',e=>errors.push(e.message));
  await retry.route('**/island-b-v1.webp',route=>route.abort());await retry.goto(url);await retry.locator('#start').click();
  await retry.locator('#retry-assets').waitFor();assert(await retry.locator('#launch').isDisabled());assert.equal(await retry.evaluate(()=>БастионИгра.состояние().time),0);
  await retry.unroute('**/island-b-v1.webp');await retry.locator('#retry-assets').click();await retry.waitForFunction(()=>БастионИгра.готов());
  await retry.locator('#continue').click();await retry.locator('#resume').click();await retry.locator('[data-pad="1"]').click();await retry.locator('#tower-panel [data-build="mortar"]').click();assert.equal((await retry.evaluate(()=>БастионИгра.состояние())).towers.length,1);
  // Поворот экрана во время выбора не списывает золото и не теряет выбор.
  await retry.setViewportSize({width:844,height:390});await retry.locator('[data-pad="2"]').click();assert(await retry.locator('#build-dialog').isVisible());
  const gold=await retry.evaluate(()=>БастионИгра.состояние().gold);await retry.setViewportSize({width:390,height:844});await retry.locator('#close-build').click();assert.equal(await retry.evaluate(()=>БастионИгра.состояние().gold),gold);
  await retry.screenshot({path:'tests/снимки/бастион-восстановление.png',fullPage:true});assert.deepEqual(errors,[]);
  console.log('Запрет хранения, неудачная загрузка с повтором, поворот экрана при строительстве — пройдены.');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
