import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {specs} from './catalog.mjs';
const root=path.resolve(import.meta.dirname,'../../..');
const base=path.resolve(import.meta.dirname,'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const registry=JSON.parse(await fs.readFile(path.join(base,'pipeline/registry.json'),'utf8'));
const snapshot=JSON.parse(await fs.readFile(path.join(base,'pipeline/content-snapshot.json'),'utf8'));
const manifest=[],projects=[];
await fs.mkdir(path.join(base,'public/stickers'),{recursive:true});
for(const [id,title,group,color,,eyebrow] of specs){
 const selected=registry.items.find(i=>i.id===id);const content=snapshot.projects.find(i=>i.id===id);
 if(!selected||!content)throw Error('Missing selection or source content: '+id);
 const original=await fs.readFile(path.join(root,selected.selected));
 if(hash(original)!==selected.selectedSha256)throw Error('Selected sticker changed outside pipeline: '+id);
 if(!(await sharp(original).metadata()).hasAlpha)throw Error('Missing alpha channel: '+id);
 const image=await sharp(original).trim({background:'#00000000',threshold:10}).resize({width:1100,height:850,fit:'inside',withoutEnlargement:true}).webp({quality:90,alphaQuality:100}).toBuffer();
 const web='/stickers/'+id+'.webp';await fs.writeFile(path.join(base,'public',web),image);
 const meta=await sharp(image).metadata();
 manifest.push({id,source:selected.selected,originalSource:selected.originalSelected||selected.selected,sha256:hash(original),web,width:meta.width,height:meta.height,bytes:image.length,generated:true});
 if(content.media)await fs.access(path.join(base,'public',content.media));
 projects.push({...content,id,title,group,color,eyebrow,sticker:web,provenance:selected.selected});
}
await fs.writeFile(path.join(base,'public/content.json'),JSON.stringify({projects,experiences:snapshot.experiences},null,2));
await fs.writeFile(path.join(base,'pipeline/manifest.json'),JSON.stringify({version:1,anchor:registry.anchor,items:manifest,missing:[]},null,2));
console.log(JSON.stringify({projects:projects.length,stickers:manifest.length,experiences:snapshot.experiences.length,missing:[]}));
