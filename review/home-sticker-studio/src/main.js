import {fitHitShape} from './hit-shapes.js';
const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {projects,experiences}=await fetch('/content.json').then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()});
const byId=new Map(projects.map(p=>[p.id,p]));
const grid=document.querySelector('#project-grid');
const dialog=document.querySelector('#project-dialog');
const statusLabels={shipped:'Built',concept:'Concept','in-progress':'In development',experience:'Experience',prototype:'Prototype',completed:'Completed'};
grid.innerHTML=projects.map((p,i)=>`<article class="project-card" data-group="${p.group}" data-project="${p.id}" data-slot="${i%6}" style="--card-color:${p.color};--angle:${[-7,5,-5,5,-7,4][i%6]}deg"><button class="card-open" data-open="${p.id}" aria-label="Explore ${escape(p.title)}"><span class="sticker-hit" aria-hidden="true"></span><div class="sticker-stage" data-sticker="${p.id}"><img src="${p.sticker}" alt="${escape(p.title)} project sticker" loading="lazy" decoding="async"></div><div class="card-caption"><div><h3>${escape(p.title)} <span aria-hidden="true">↗</span></h3></div><span>${escape(p.group==='physical'?'Object & system':p.group==='ai'?'AI & engineering':'Product & service')}</span></div></button></article>`).join('');

// Art-directed coordinates keep the collection irregular without random layout shifts.
// Each entry is x, y, width, height, rotation, and stacking order.
const desktopScatter=[
 [45,30,500,380,-13,2],[450,0,530,245,8,1],[350,200,355,300,17,5],
 [650,310,420,285,-12,3],[30,495,300,430,11,2],[200,650,335,220,-9,4],
 [540,720,545,300,7,1],[420,955,350,380,-16,3],[170,1090,330,350,13,4],
 [860,1115,255,340,-19,2],[480,1390,450,330,9,3],[120,1470,280,330,-12,5],
 [755,1575,430,320,16,1],[365,1790,350,250,-7,4]
];
const phoneScatter=[
 [0,40,250,210,-14,2],[140,0,220,140,9,1],[110,160,220,185,18,4],
 [0,350,270,185,-12,3],[220,365,135,240,12,2],[20,500,190,145,-8,4],
 [100,675,260,170,7,1],[0,770,205,225,-17,3],[155,910,205,215,12,4],
 [5,1030,185,240,-18,2],[125,1190,235,200,9,3],[0,1350,185,230,-12,5],
 [140,1500,220,205,15,1],[15,1635,235,185,-8,4]
];
function layoutCollection(){
 const phone=innerWidth<=600, pattern=phone?phoneScatter:desktopScatter;
 const scale=grid.clientWidth/(phone?360:1200);let bottom=0;
 [...grid.querySelectorAll('.project-card')].filter(el=>!el.hidden).forEach((el,i)=>{
  const [x,y,w,h,angle,layer]=pattern[i];
  Object.assign(el.style,{left:`${x*scale}px`,top:`${y*scale}px`,width:`${w*scale}px`,height:`${h*scale}px`});
  el.style.setProperty('--angle',`${angle}deg`);el.dataset.angle=angle;el.dataset.layer=layer;el.style.setProperty('--layer',layer+3);
  fitHitShape(el.querySelector('button'),byId.get(el.dataset.project).sticker,angle);
  bottom=Math.max(bottom,(y+h)*scale);
 });
 grid.style.height=`${bottom+60}px`;
 window.dispatchEvent(new Event('sticker-layout'));
}
layoutCollection();addEventListener('resize',layoutCollection);
const dateYear=d=>d==='Present'?'Present':d?.slice(0,4)||'';
document.querySelector('#experience-list').innerHTML=experiences.sort((a,b)=>b.start.localeCompare(a.start)).map(t=>`<details class="experience-item"><summary><span class="dates mono">${dateYear(t.start)} — ${dateYear(t.end)}</span><span class="company">${escape(t.company.split(' | ')[0])}</span><span class="role">${escape(t.title)}</span><span class="expand" aria-hidden="true">+</span></summary><p>${escape(t.summary)}</p></details>`).join('');
const experience=document.querySelector('#experience');
document.querySelector('a[href="#experience"]').addEventListener('click',()=>{experience.open=true});
function revealExperience(){if(location.hash==='#experience')experience.open=true}
revealExperience();addEventListener('hashchange',revealExperience);
const filters=[...document.querySelectorAll('[data-filter]')];
filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});let count=0;document.querySelectorAll('.project-card').forEach(c=>{c.hidden=btn.dataset.filter!=='all'&&c.dataset.group!==btn.dataset.filter;if(!c.hidden){c.dataset.slot=String(count%6);count++}});document.querySelector('#result-count').textContent=`${count} OBJECT${count===1?'':'S'}`;layoutCollection();}));

let opener=null;let openedThroughUI=false;
function storyBlock(title,html){return html?`<section class="story-block"><h3>${title}</h3><div>${html}</div></section>`:'';}
function showProject(id,push=true){const p=byId.get(id);if(!p)return;opener=document.activeElement;openedThroughUI=push||Boolean(history.state?.stickerProject);
 document.querySelector('#dialog-number').textContent=`${String(projects.indexOf(p)+1).padStart(2,'0')} / ${projects.length} — ${p.eyebrow.toUpperCase()}`;
 document.querySelector('#dialog-content').innerHTML=`<header class="dialog-hero"><div><p class="mono">${escape(p.eyebrow.toUpperCase())} · ${escape(statusLabels[p.outcome?.status]||'PROJECT')}</p><h2 id="dialog-title">${escape(p.title)}</h2><p class="lead">${escape(p.hero?.oneLiner)}</p></div><div class="dialog-sticker" style="--card-color:${p.color}"><img src="${p.sticker}" alt="${escape(p.title)} — illustrated project sticker"></div></header>${p.media?`<figure class="dialog-image"><img src="${p.media}" alt="Existing ${escape(p.title)} project reference"></figure>`:''}<div class="dialog-body">${storyBlock('The context',p.context?.text?`<p>${escape(p.context.text)}</p>`:'')}${storyBlock('The work',p.build?.bullets?.length?`<ul>${p.build.bullets.map(b=>`<li>${escape(b)}</li>`).join('')}</ul>`:'')}${storyBlock('Decisions & trade-offs',p.decisions?.length?p.decisions.map(d=>`<div class="decision"><h4>${escape(d.decision)}</h4><p>${escape(d.why)}</p><p class="tradeoff">Trade-off: ${escape(d.tradeoff)}</p></div>`).join(''):'')}${storyBlock('Where it landed',p.outcome?.text?`<p>${escape(p.outcome.text)}</p>`:'')}${storyBlock('What I took forward',p.reflection?.text?`<p>${escape(p.reflection.text)}</p>`:'')}${p.canonical?`<a class="text-link story-link" href="${p.canonical}" target="_blank" rel="noopener">Open the full case study <span>↗</span></a>`:''}<p class="source-note">Sticker illustration based on original project artwork.</p></div>`;
 if(push){const u=new URL(location.href);u.searchParams.set('project',id);history.pushState({stickerProject:id},'',u)}
 document.body.classList.add('modal-open');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.querySelector('#close-dialog').focus({preventScroll:true});window.dispatchEvent(new Event('sticker-layout'));
}
function hideProject(){if(dialog.open)dialog.close();document.body.classList.remove('modal-open');if(opener?.isConnected)opener.focus({preventScroll:true});window.dispatchEvent(new Event('sticker-layout'));}
function requestClose(){if(openedThroughUI&&new URL(location.href).searchParams.has('project'))history.back();else{const u=new URL(location.href);u.searchParams.delete('project');history.replaceState(null,'',u);hideProject()}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b&&!b.dataset.dragging)showProject(b.dataset.open)});
document.querySelector('#close-dialog').addEventListener('click',requestClose);document.querySelector('#close-x').addEventListener('click',requestClose);
dialog.addEventListener('cancel',e=>{e.preventDefault();requestClose()});dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)requestClose()}});
addEventListener('popstate',()=>{const id=new URL(location.href).searchParams.get('project');if(id&&byId.has(id))showProject(id,false);else hideProject()});
const incoming=new URL(location.href).searchParams.get('project');if(incoming&&byId.has(incoming))showProject(incoming,false);

let reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion=document.querySelector('#motion-toggle');
function setMotion(value){reduce=value;document.body.classList.toggle('motion-off',reduce);document.documentElement.classList.toggle('motion-off',reduce);motion.textContent=reduce?'Motion off':'Motion on';motion.setAttribute('aria-pressed',String(reduce));window.dispatchEvent(new CustomEvent('sticker-motion',{detail:{reduce}}));}
setMotion(reduce);motion.addEventListener('click',()=>setMotion(!reduce));matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>setMotion(e.matches));

// Keep the document, links, and all project stories usable if graphics are unavailable.
if(!new URL(location.href).searchParams.has('no3d'))import('./scene.js').then(({initScenes})=>initScenes({projects,reduced:()=>reduce})).catch(error=>{console.warn('Using the static project collection:',error.message);document.body.dataset.renderMode='static'});
window.__portfolioReview={projects:projects.map(p=>p.id),showProject,hideProject,version:'sticker-studio-2'};
