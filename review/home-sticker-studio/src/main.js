const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {projects,experiences}=await fetch('/content.json').then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()});
const byId=new Map(projects.map(p=>[p.id,p]));
const grid=document.querySelector('#project-grid');
const dialog=document.querySelector('#project-dialog');
const statusLabels={shipped:'Built',concept:'Concept','in-progress':'In development',experience:'Experience',prototype:'Prototype',completed:'Completed'};
const compact={glyph:'Wearable AI, with a physical interface.', 'familysync-jpmorgan':'Shared care. Clear authority. Thoughtful payments.', 'food-rescue':'Product analytics behind a second chance for food.', 'mcdonalds-interaction-design':'Making a group order feel like a group effort.', helios:'A mechanism that turns motion into light.', 'self-xyz':'Agentic products built around trust and control.', 'zero-my-ai':'An assistant with memory, tools, and boundaries.', surya:'Making distant daily rhythms visible.', 'pg-haircare':'Research, packaging, and physical prototype studies.', jarvis:'Local voice meets the connected home.', plotter:'A spoken idea becomes a physical drawing.', solopump:'Measured dispensing, with software in control.', lawn:'A garden that grows between visits.', 'portfolio-website':'An ongoing experiment in human–AI making.'};
grid.innerHTML=projects.map((p,i)=>`<article class="project-card" data-group="${p.group}" data-project="${p.id}" style="--card-color:${p.color};--angle:${[-7,5,-5,5,-7,4][i%6]}deg"><button class="card-open" data-open="${p.id}" aria-label="Explore ${escape(p.title)}"><div class="sticker-stage" data-sticker="${p.id}"><span class="card-index mono">${String(i+1).padStart(2,'0')}</span><span class="card-tag">${escape(p.eyebrow)}</span><img src="${p.sticker}" alt="${escape(p.title)} project sticker" loading="lazy" decoding="async"><div class="card-bottom"><span class="mono">${escape(statusLabels[p.outcome?.status]||'PROJECT')}</span><span class="card-arrow" aria-hidden="true">↗</span></div></div><div class="card-caption"><div><h3>${escape(p.title)}</h3><p>${escape(compact[p.id])}</p></div><span>${escape(p.group==='physical'?'Object & system':p.group==='ai'?'AI & engineering':'Product & service')}</span></div></button></article>`).join('');

export const heroPositions=[
 {id:'glyph',x:17,y:27,w:245,h:182,rot:-14,mx:18,my:26,mw:126,mh:94},
 {id:'familysync-jpmorgan',x:76,y:19,w:275,h:130,rot:12,mx:75,my:17,mw:145,mh:75},
 {id:'helios',x:10,y:72,w:155,h:205,rot:11,mx:10,my:71,mw:78,mh:110},
 {id:'mcdonalds-interaction-design',x:83,y:68,w:285,h:165,rot:-12,mx:78,my:78,mw:135,mh:86},
 {id:'food-rescue',x:37,y:84,w:205,h:140,rot:9,mx:42,my:86,mw:113,mh:78},
 {id:'self-xyz',x:54,y:12,w:175,h:100,rot:-8,mx:48,my:9,mw:103,mh:60},
];
const heroLinks=document.querySelector('#hero-links');
heroLinks.innerHTML=heroPositions.map(o=>{const p=byId.get(o.id);return `<button class="hero-sticker" data-open="${p.id}" data-hero="${p.id}" aria-label="Explore ${escape(p.title)}" style="--rotation:${o.rot}deg"><img src="${p.sticker}" alt="" draggable="false" decoding="async"><span class="hero-label">${escape(p.title)} ↗</span></button>`}).join('');
function layoutHero(){const mobile=innerWidth<=600;heroPositions.forEach(o=>{const el=document.querySelector(`[data-hero="${o.id}"]`);const scale=mobile?Math.min(1,(innerWidth-20)/390):Math.min(1.15,(innerWidth-100)/1340);el.style.left=(mobile?o.mx:o.x)+'%';el.style.top=(mobile?o.my:o.y)+'%';el.style.setProperty('--w',(mobile?o.mw:o.w)*scale+'px');el.style.setProperty('--h',(mobile?o.mh:o.h)*scale+'px');});}
layoutHero();addEventListener('resize',layoutHero);
const dateYear=d=>d==='Present'?'Present':d?.slice(0,4)||'';
document.querySelector('#experience-list').innerHTML=experiences.sort((a,b)=>b.start.localeCompare(a.start)).map(t=>`<details class="experience-item"><summary><span class="dates mono">${dateYear(t.start)} — ${dateYear(t.end)}</span><span class="company">${escape(t.company.split(' | ')[0])}</span><span class="role">${escape(t.title)}</span><span class="expand" aria-hidden="true">+</span></summary><p>${escape(t.summary)}</p></details>`).join('');
const filters=[...document.querySelectorAll('[data-filter]')];
filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});let count=0;document.querySelectorAll('.project-card').forEach(c=>{c.hidden=btn.dataset.filter!=='all'&&c.dataset.group!==btn.dataset.filter;if(!c.hidden)count++});document.querySelector('#result-count').textContent=`${count} OBJECT${count===1?'':'S'}`;window.dispatchEvent(new Event('sticker-layout'));}));

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
if(!new URL(location.href).searchParams.has('no3d'))import('./scene.js').then(({initScenes})=>initScenes({projects,heroPositions,reduced:()=>reduce})).catch(error=>{console.warn('Using the static project collection:',error.message);document.body.dataset.renderMode='static'});
window.__portfolioReview={projects:projects.map(p=>p.id),showProject,hideProject,version:'sticker-studio-1'};
