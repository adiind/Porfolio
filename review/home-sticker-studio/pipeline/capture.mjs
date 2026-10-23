import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const dir=path.join(root,'shots');await fs.mkdir(dir,{recursive:true});
const results=[];
for(const [name,width,height] of [['desktop',1440,1000],['phone',390,844]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:name==='phone',isMobile:name==='phone'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4466/',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.body.dataset.renderMode==='webgl');await page.waitForTimeout(600);
 await page.screenshot({path:path.join(dir,`current-${name}-hero.png`)});
 await page.evaluate(()=>scrollTo({top:document.querySelector('.work-toolbar').getBoundingClientRect().top+scrollY-24,behavior:'instant'}));await page.waitForTimeout(600);await page.screenshot({path:path.join(dir,`current-${name}-work.png`)});
 results.push({name,width,height,actual:await page.evaluate(()=>[innerWidth,innerHeight,devicePixelRatio]),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors});await context.close();
}
await browser.close();await fs.writeFile(path.join(dir,'capture.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
