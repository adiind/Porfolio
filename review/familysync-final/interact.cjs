const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/Users/adi/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const out={};
for (const [W,red] of [[1440,false],[390,false],[1440,true]]){
const p=await b.newPage({viewport:{width:W,height:W<500?844:900},reducedMotion:red?'reduce':'no-preference'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://127.0.0.1:3000/work/familysync-jpmorgan');let f;
for(let i=0;i<40&&!f;i++){f=p.frames().find(x=>x.url().includes('story.html'));await p.waitForTimeout(150)}
await p.waitForTimeout(1800);
const r={};
// journey buttons
await f.evaluate(()=>{const e=document.querySelector('.journey');(window.fsLenis||{scrollTo:(y)=>scrollTo(0,y)}).scrollTo(e.getBoundingClientRect().top+scrollY-60,{immediate:true,force:true})});await p.waitForTimeout(900);
await f.click('[data-journey-go="3"]',{force:true});await p.waitForTimeout(1600);
r.journeyActive=await f.evaluate(()=>[...document.querySelectorAll('.journey-stage')].findIndex(s=>s.classList.contains('active')));
r.clock=await f.evaluate(()=>document.querySelector('[data-journey-clock]').textContent);
// payment
await f.evaluate(()=>{const e=document.querySelector('.pay');(window.fsLenis||{scrollTo:(y)=>scrollTo(0,y)}).scrollTo(e.getBoundingClientRect().top+scrollY-200,{immediate:true,force:true})});await p.waitForTimeout(900);
await f.click('[data-answer="confirmed"]');await p.waitForTimeout(2600);
r.approval=await f.evaluate(()=>document.documentElement.dataset.approval);
r.cartAnswer=await f.evaluate(()=>document.querySelector('[data-cart-answer]').textContent);
r.visaText=await f.evaluate(()=>document.querySelector('.payment-method').textContent.replace(/\s+/g,' ').trim());
r.overflow=await f.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
await f.focus('body').catch(()=>{});await f.press('body','Escape');await p.waitForTimeout(800);
r.closed=!(await p.$('iframe'));r.url=p.url();r.errs=errs;out[W+(red?'-reduced':'')]=r;await p.close();}
console.log(JSON.stringify(out,null,1));require('fs').writeFileSync(__dirname+'/interaction-qa.json',JSON.stringify(out,null,2));await b.close()})();
