import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=path.resolve(import.meta.dirname,'..');
const url=process.env.STICKER_PREVIEW_URL||'http://127.0.0.1:4466/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const report={url,started:new Date().toISOString(),viewports:[],journeys:[],errors:[]};
const images=path.join(base,'shots');await fs.mkdir(images,{recursive:true});
async function waitClosed(page){await page.waitForFunction(()=>!document.querySelector('dialog').open)}
try{
 for(const width of [320,390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:width<600?844:1000},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
  const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
  await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.body.dataset.renderMode==='webgl');
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);
  assert.equal(await page.locator('.project-card').count(),14);
  for(const section of ['#top','#work','#experience','#contact']){
   await page.locator(section).scrollIntoViewIfNeeded();await page.waitForTimeout(180);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width} ${section}`);
  }
  for(const [group,n] of [['product',4],['ai',4],['physical',6],['all',14]]){
   await page.locator(`[data-filter="${group}"]`).click();
   assert.equal(await page.locator('.project-card:visible').count(),n);
  }
  const ids=await page.evaluate(()=>window.__portfolioReview.projects);
  for(const id of ids){
   const button=page.locator(`.card-open[data-open="${id}"]`);await button.scrollIntoViewIfNeeded();await button.click();
   await page.waitForFunction(()=>document.querySelector('dialog').open);
   assert(new URL(page.url()).searchParams.get('project')===id);
   assert(await page.locator('#dialog-title').textContent());
   assert.equal(await page.locator('dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false,`dialog overflow ${width} ${id}`);
   await page.locator('.dialog-image img').evaluate(img=>img.decode());
   if(id==='glyph'&&(width===1440||width===390))await page.screenshot({path:path.join(images,`detail-${width}.png`)});
   await page.keyboard.press('Escape');await waitClosed(page);
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset.open),id,'focus return');
  }
  await page.locator('.experience-item summary').first().click();assert.equal(await page.locator('.experience-item[open]').count(),1);
  if(width===1440){
   await page.locator('[data-hero="glyph"]').scrollIntoViewIfNeeded();await page.locator('[data-hero="glyph"]').click();await page.goBack();await waitClosed(page);await page.goForward();await page.waitForFunction(()=>document.querySelector('dialog').open);await page.locator('#close-dialog').click();await waitClosed(page);assert(!new URL(page.url()).searchParams.has('project'));
   report.journeys.push('All 14 project stories, focus return, browser Back/Forward/close');
   await page.locator('#top').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
   const b=await page.locator('[data-hero="glyph"]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+70,b.y+b.height/2+30,{steps:12});await page.waitForTimeout(250);
   const dragState=await page.evaluate(()=>{const o=window.__stickerGraphics.scenes[0].objects.find(o=>o.layout.id==='glyph');const b=o.button.getBoundingClientRect();return {x:o.settleX,drag:o.dragging,dx:o.dragX,visible:window.__stickerGraphics.scenes[0].visible,box:[b.x,b.y,b.width,b.height],hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.outerHTML.slice(0,220),scrollY}});assert(dragState.x>20,JSON.stringify(dragState));
   await page.mouse.up();await page.mouse.move(0,0);await page.waitForTimeout(1200);assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
   assert(Math.abs(await page.evaluate(()=>window.__stickerGraphics.scenes[0].objects.find(o=>o.layout.id==='glyph').settleX))<1);
   report.journeys.push('Mouse sticker drag bends and returns without opening a project');
   await page.screenshot({path:path.join(images,'final-desktop-hero.png')});
   await page.evaluate(()=>scrollTo({top:document.querySelector('#work').offsetTop,behavior:'instant'}));await page.waitForTimeout(400);await page.screenshot({path:path.join(images,'final-desktop-work.png')});
   await page.evaluate(()=>scrollTo({top:document.querySelector('.project-card:nth-child(7)').getBoundingClientRect().top+scrollY-60,behavior:'instant'}));await page.waitForTimeout(600);await page.screenshot({path:path.join(images,'final-desktop-collection.png')});
  }
  if(width===390){await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(400);await page.screenshot({path:path.join(images,'final-phone-hero.png')});}
  report.viewports.push({width,projectCount:14,filters:true,overflow:false,dialogOverflow:false});await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await ctx.newPage();
 await page.goto(url+'?project=helios',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('dialog').open);await page.locator('#close-x').click();await waitClosed(page);await page.waitForFunction(()=>document.body.dataset.renderMode==='webgl');
 assert.equal(await page.locator('#motion-toggle').textContent(),'Motion off');assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).scrollBehavior),'auto');await page.locator('[data-hero="glyph"]').hover();await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>window.__stickerGraphics.scenes[0].objects.find(o=>o.layout.id==='glyph').lift),0);
 const idle1=await page.evaluate(()=>window.__stickerGraphics.renderer.info.render.frame);await page.waitForTimeout(700);const idle2=await page.evaluate(()=>window.__stickerGraphics.renderer.info.render.frame);assert.equal(idle1,idle2,'reduced motion must settle');
 report.journeys.push('Direct project link closes in place; reduced motion stays still and stops rendering');
 await page.evaluate(()=>window.__stickerGraphics.renderer.forceContextLoss());await page.waitForFunction(()=>document.body.dataset.renderMode==='static');assert.equal(await page.locator('.rendered').count(),0);await page.locator('[data-hero="glyph"]').click();await page.keyboard.press('Escape');await waitClosed(page);report.journeys.push('WebGL context loss restores usable static artwork');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(url+'?no3d',{waitUntil:'networkidle'});await page.locator('#motion-toggle').click();assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).scrollBehavior),'auto');const fallbackImage=page.locator('.project-card').first().locator('img');const transformBefore=await fallbackImage.evaluate(el=>getComputedStyle(el).transform);await page.locator('.card-open').first().hover();assert.equal(await fallbackImage.evaluate(el=>getComputedStyle(el).transform),transformBefore);report.journeys.push('Manual Motion off disables root smooth scrolling and fallback hover movement');assert.equal(await page.locator('canvas').count(),0);await page.locator('[data-hero="glyph"]').click();await page.keyboard.press('Escape');await waitClosed(page);await page.screenshot({path:path.join(images,'fallback-desktop.png')});report.journeys.push('No-WebGL static mode opens projects normally');
 await ctx.close();assert.equal(report.errors.length,0);report.pass=true;
}catch(e){report.pass=false;report.failure=e.stack;process.exitCode=1}finally{await browser.close();report.finished=new Date().toISOString();await fs.writeFile(path.join(base,'pipeline/browser-QA.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
