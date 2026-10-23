import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {specs} from './catalog.mjs';
const root=path.resolve(import.meta.dirname,'../../..');
const registryPath=path.join(import.meta.dirname,'registry.json');
const registry=JSON.parse(await fs.readFile(registryPath,'utf8'));
const absolute=p=>path.resolve(root,p);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const exists=async p=>fs.access(p).then(()=>true,()=>false);
const frame="Image 1 is the design to render. Image 2 is the style reference only: match its die-cut cream border, thickness, holo or matte finish, wear, glare, and outline. Don't copy Image 2's content.";
async function inspect(file){
 const buffer=await fs.readFile(file);const metadata=await sharp(buffer).metadata();
 const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let transparent=0,opaque=0,edgeOpaque=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*info.channels+info.channels-1];
  if(a<8)transparent++;if(a>240)opaque++;
  if((x===0||y===0||x===info.width-1||y===info.height-1)&&a>32)edgeOpaque++;
 }
 const area=info.width*info.height;
 const checks={alphaChannel:metadata.hasAlpha===true,clearBackground:transparent/area>.08,visibleArtwork:opaque/area>.05,uncroppedBorder:edgeOpaque===0,resolution:Math.max(info.width,info.height)>=700};
 return {file:path.relative(root,file),sha256:hash(buffer),width:info.width,height:info.height,bytes:buffer.length,transparentFraction:Number((transparent/area).toFixed(3)),checks,pass:Object.values(checks).every(Boolean)};
}
async function plan(item){
 for(const file of [item.source,registry.anchor])if(!await exists(absolute(file)))throw Error('Missing required reference: '+absolute(file));
 const previousVersion=(item.selected?.match(/-v(\d+)\.png$/)||item.originalSelected?.match(/-v(\d+)\.png$/))?.[1];
 let version=previousVersion?Number(previousVersion)+1:1,output;do{output=`review/stickers/${item.name}-${item.finish}-v${version++}.png`}while(await exists(absolute(output)));
 return {id:item.id,output,sourceSha256:hash(await fs.readFile(absolute(item.source))),anchorSha256:hash(await fs.readFile(absolute(registry.anchor))),tool:'image_gen.imagegen',arguments:{referenced_image_paths:[absolute(item.source),absolute(registry.anchor)],transparent_background:true,prompt:`${frame}\n\nSubject: ${item.subject}\nFinish: ${item.finish}. For logos, keep the real shapes and letterforms from the official file exactly. Don't redraw type. No text that isn't in the source, and no human faces. Make the background genuinely transparent and preserve the generated alpha channel. Entire sticker visible with margin. Preserve source identity beneath the foil; the anchor's content must not transfer.`}};
}
const [command='validate',id,input,...notes]=process.argv.slice(2);
if(command==='plan'){
 const items=id?registry.items.filter(i=>i.id===id):registry.items.filter(i=>!i.selected);
 if(id&&!items.length)throw Error('Unknown project: '+id);
 const jobs=[];for(const item of items)jobs.push(await plan(item));
 console.log(JSON.stringify({jobs},null,2));
}else if(command==='accept'){
 const item=registry.items.find(i=>i.id===id);if(!item)throw Error('Unknown project');
 const note=notes.join(' ').trim();if(!input||note.length<20)throw Error('Usage: accept <id> <generated PNG> <specific visual review notes>. Inspect source, anchor and candidate first.');
 const check=await inspect(path.resolve(input));if(!check.pass)throw Error('Candidate failed: '+JSON.stringify(check));
 const job=await plan(item);await fs.mkdir(path.dirname(absolute(job.output)),{recursive:true});await fs.copyFile(path.resolve(input),absolute(job.output),fs.constants.COPYFILE_EXCL);
 const record={...job,accepted:job.output,candidateSha256:check.sha256,review:note,date:new Date().toISOString()};
 await fs.appendFile(path.join(import.meta.dirname,'acceptance.jsonl'),JSON.stringify(record)+'\n');
 item.selected=job.output;item.selectedSha256=check.sha256;
 await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n');
 console.log(JSON.stringify({accepted:job.output,next:'Run prepare.mjs, then validate and browser QA.'}));
}else if(command==='validate'){
 const results=[];for(const item of registry.items){
  const check=await inspect(absolute(item.selected));
  check.id=item.id;check.checks.selectedHash=check.sha256===item.selectedSha256;
  check.checks.sourcePresent=await exists(absolute(item.source));
  check.checks.sourceHash=check.checks.sourcePresent&&hash(await fs.readFile(absolute(item.source)))===item.sourceSha256;
  check.checks.anchorPresent=await exists(absolute(registry.anchor));
  check.checks.anchorHash=check.checks.anchorPresent&&hash(await fs.readFile(absolute(registry.anchor)))===registry.anchorSha256;
  check.pass=Object.values(check.checks).every(Boolean);results.push(check);
 }
 const missing=specs.map(s=>s[0]).filter(id=>!registry.items.some(i=>i.id===id));
 const report={date:new Date().toISOString(),pass:results.every(r=>r.pass)&&!missing.length,missing,results,limits:'Automated checks cover files, alpha, border clipping, resolution and hashes. Source fidelity, letterforms and finish require visual inspection.'};
 await fs.writeFile(path.join(import.meta.dirname,'asset-QA.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({pass:report.pass,checked:results.length,missing,failures:results.filter(r=>!r.pass)}));
 if(!report.pass)process.exitCode=1;
}else throw Error('Expected plan, accept or validate');
