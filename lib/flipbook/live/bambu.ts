/** Bambu book. Studio photographs come from the existing Bambu page; the guide
 * and workshop description are from Adi's 7 Nov 2026 workshop follow-up email.
 * The three story pages are drawn in bambuStory.ts.
 * The idea pages are illustrations, not photographs of the studio. */
import type { LiveScene } from './types';
import { createStage, loopPage } from './stage';
import { smoothstep } from './motion';
import { BAMBU_STORIES } from './bambuStory';

const DIR = '/images/flipbook/bambu/';

function cover(): LiveScene { const src=DIR+'cover.svg'; return { id:'bambu-cover', sources:[src], create(images,width,height) {
  const stage=createStage(width,height), photo=images.get(src);
  return loopPage(stage,{loop:2,rest:2,once:true,step(){},draw(){
    stage.base.fillStyle='#00a942'; stage.base.fillRect(0,0,width,height);
    if(photo) stage.base.drawImage(photo,0,0,width,height);
  }});
}}; }

// (the same file is the page's own picture in data/flipbooks.ts, bambuIdea, so it is fetched once)
function illustration(id:string):LiveScene { const src=DIR+id+'.webp'; return {id:`bambu-${id}`,sources:[src],create(images,width,height) {
  const stage=createStage(width,height), {base}=stage, img=images.get(src);
  return loopPage(stage,{loop:2,rest:2,once:true,step(){},draw(t){
    base.fillStyle= id === 'make' ? '#153d20' : id === 'learn' ? '#a63b19' : '#35546b'; base.fillRect(0,0,width,height);
    if(img){ const p=smoothstep(0,1.5,t), scale=.98+.02*p; const w=width*scale, h=w*img.naturalHeight/img.naturalWidth; base.drawImage(img,(width-w)/2,(height-h)/2,w,h); }
  }});
}}; }
export const BAMBU_SCENES: LiveScene[] = [cover(), ...BAMBU_STORIES, ...['make','learn','share'].map(illustration)];
