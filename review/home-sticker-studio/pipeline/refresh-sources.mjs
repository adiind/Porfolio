import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'../../..');
const base=path.resolve(import.meta.dirname,'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
import {specs} from './catalog.mjs';
const registry=JSON.parse(await fs.readFile(path.join(base,'pipeline/registry.json'),'utf8'));
for(const dir of ['stickers','media','fonts'])await fs.mkdir(path.join(base,'public',dir),{recursive:true});

let timelineSource=await fs.readFile(path.join(root,'data/timeline.ts'),'utf8');
timelineSource=timelineSource.replace(/^import .*$/gm,'').replace('export const TIMELINE_DATA','const TIMELINE_DATA');
const js=ts.transpileModule(timelineSource+'\nreturn TIMELINE_DATA;', {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const timeline=new Function('TINKERVERSE_LOGO',js)('/images/tinkerverse-logo.svg');
const manifest=[]; const projects=[];
for(const [id,title,group,color,sticker,eyebrow,media] of specs){
 let data;
 if(id==='self-xyz'){const t=timeline.find(t=>t.id===id);data={id,hero:{title,oneLiner:t.headline},context:{text:t.summary},build:{bullets:t.bullets},outcome:{status:'experience'},decisions:[],skills:t.skills};}
 else if(id==='food-rescue'){const t=timeline.find(t=>t.company==='Zomato');const feature=t.featureCards.find(f=>f.title.startsWith('Food Rescue'));data={id,hero:{title,oneLiner:t.caseStudy.summary},context:{text:feature.expandedSummary},build:{bullets:feature.skills.map(s=>s.description)},outcome:{status:'experience'},decisions:[],skills:t?.skills||[]};}
 else data=JSON.parse(await fs.readFile(path.join(root,'data/projects',id+'.json'),'utf8'));
 const selected=registry.items.find(i=>i.id===id);
 if(!selected)throw Error('Project missing from sticker registry: '+id);
 const source=path.join(root,selected.selected);
 if(hash(await fs.readFile(source))!==selected.selectedSha256)throw Error('Selected sticker changed outside pipeline: '+id);
 let hasSticker=true;try{await fs.access(source)}catch{hasSticker=false;}
 let stickerUrl=null;
 if(hasSticker){const buf=await fs.readFile(source);const meta=await sharp(buf).metadata();if(!meta.hasAlpha)throw Error('Sticker missing alpha: '+id);const output=id+'.webp';const image=await sharp(buf).trim({background:'#00000000',threshold:10}).resize({width:1100,height:850,fit:'inside',withoutEnlargement:true}).webp({quality:90,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(base,'public/stickers',output),image);stickerUrl='/stickers/'+output;const outMeta=await sharp(image).metadata();manifest.push({id,source:path.relative(root,source),sha256:hash(buf),web:stickerUrl,width:outMeta.width,height:outMeta.height,bytes:image.length,generated:true});}
 const mediaSrc=path.join(root,'public',media);let mediaUrl=null;
 try{await fs.access(mediaSrc);if(media.endsWith('.svg')){const file=id+'.svg';await fs.copyFile(mediaSrc,path.join(base,'public/media',file));mediaUrl='/media/'+file;}else{const file=id+'.webp';await sharp(mediaSrc).resize({width:1400,withoutEnlargement:true}).webp({quality:84}).toFile(path.join(base,'public/media',file));mediaUrl='/media/'+file;}}catch(e){throw Error('Missing supplied project media '+media+' '+e.message)}
 projects.push({...data,title,group,color,sticker:stickerUrl,eyebrow,media:mediaUrl,canonical:id==='self-xyz'||id==='food-rescue'?null:'https://adidesign.org/work/'+id,provenance:hasSticker?path.relative(root,source):null});
}
const experiences=timeline.filter(t=>['self-xyz','ms-edi','zomato','udaan','snapdeal','bits','tinkerverse','schmooze'].includes(t.id)).map(t=>({id:t.id,title:t.title,company:t.company,summary:t.summary,start:t.start,end:t.end,lane:t.lane}));
await fs.writeFile(path.join(base,'public/content.json'),JSON.stringify({projects,experiences},null,2));
await fs.writeFile(path.join(base,'pipeline/content-snapshot.json'),JSON.stringify({projects,experiences},null,2));
await fs.writeFile(path.join(base,'pipeline/manifest.json'),JSON.stringify({version:1,anchor:'.agents/skills/sticker/assets/anchors/holo.png',items:manifest,missing:projects.filter(p=>!p.sticker).map(p=>p.id)},null,2));
for(const weight of [400,500,600,700,800]){const src=path.join(root,'review/home-desk-v1/fonts/Bricolage-'+weight+'.ttf');const dst=path.join(base,'public/fonts/Bricolage-'+weight+'.ttf');try{await fs.access(src);await fs.copyFile(src,dst)}catch{await fs.access(dst)}}
const geist=path.join(root,'public/work/squad-up-assets/Geist-Variable.ttf');try{await fs.access(geist);await fs.copyFile(geist,path.join(base,'public/fonts/Geist.ttf'))}catch{await fs.access(path.join(base,'public/fonts/Geist.ttf'))}
const files=await fs.readdir(path.join(root,'public'));
const resume=files.find(f=>f==='Adi_Agarwal_Resume_2026.pdf');if(resume)await fs.copyFile(path.join(root,'public',resume),path.join(base,'public',resume));
console.log(JSON.stringify({projects:projects.length,stickers:manifest.length,experiences:experiences.length,missing:projects.filter(p=>!p.sticker).map(p=>p.id)}));
