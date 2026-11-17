/** Bambu book. Studio photographs come from the existing Bambu page; the guide
 * and workshop description are from Adi's 7 Nov 2026 workshop follow-up email.
 * The idea pages are illustrations, not photographs of the studio. */
import type { LiveScene } from './types';
import { createStage, loopPage } from './stage';
import { smoothstep } from './motion';
import { SANS, SERIF, wrap } from './suryaStory';

const DIR = '/images/flipbook/bambu/';
const studio = DIR + '01-printer-wall.jpg';
const lights = DIR + '05-nozzle-light.jpg';
const filament = DIR + '06-filament-wall.jpg';
const workshop = DIR + '13-adi-presenting.jpg';
const slice = DIR + '17-supports-preview.jpg';

function imageCover(c: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s, sh = h / s;
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 10); c.clip();
  c.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h); c.restore();
}

interface Story { id: string; kicker: string; title: string; body: string; note: string; photos: string[]; accent: string; }
const stories: Story[] = [
  { id: 'studio', kicker: '01 · THE STUDIO', title: 'A room for making', body: 'I help run the print lab at Northwestern, with printers, filament and tools ready for making.', note: 'The printer wall and the lights above it.', photos: [studio, lights, filament], accent: '#347353' },
  { id: 'workshops', kicker: '02 · THE WORKSHOPS', title: 'Learning together', body: 'I run workshops with Corner Makery, helping people prepare a model in Bambu Studio and get started with 3D printing.', note: 'Walking a group through Bambu Studio.', photos: [workshop, slice], accent: '#ad5833' },
  { id: 'resources', kicker: '03 · THE GUIDE', title: 'Something to take home', body: 'After the 3D Print Anything workshops, I shared a condensed guide to the workshop, with my recommendations for an AI-assisted workflow.', note: 'Open the guide to take the workshop with you.', photos: [slice, filament], accent: '#3b698a' },
];

function storyScene(s: Story): LiveScene {
  return { id: `bambu-${s.id}`, sources: s.photos, create(images, width, height) {
    const stage = createStage(width, height), { base, k } = stage;
    return loopPage(stage, { loop: 2, rest: 2, once: true, step() {}, draw(t) {
      base.fillStyle = '#f7f4e8'; base.fillRect(0, 0, width, height);
      base.fillStyle = s.accent; base.globalAlpha = .12;
      for (let x = 80; x < 1050; x += 75) for (let y = 80; y < 880; y += 75) { base.beginPath(); base.arc(x*k,y*k,2*k,0,Math.PI*2); base.fill(); }
      base.globalAlpha = 1;
      const pics = s.photos.map(src => images.get(src));
      const p = smoothstep(.08, .9, t);
      base.save(); base.translate(0,(1-p)*35*k); base.globalAlpha = p;
      if (pics[0]) { base.fillStyle = '#fff'; base.fillRect(65*k, 100*k, 970*k, 630*k); imageCover(base,pics[0],80*k,115*k,940*k,600*k); }
      if (pics[1]) { base.save(); base.translate(710*k,625*k); base.rotate(.045); base.shadowColor='rgba(30,40,30,.25)'; base.shadowBlur=25*k; base.fillStyle='#fff'; base.fillRect(0,0,300*k,220*k); base.shadowColor='transparent'; imageCover(base,pics[1],10*k,10*k,280*k,190*k); base.restore(); }
      base.restore();
      base.fillStyle = s.accent; base.font = `700 ${29*k}px ${SANS}`; base.fillText(s.kicker, 1140*k, 150*k);
      base.fillStyle = '#23352c'; base.font = `600 ${87*k}px ${SERIF}`;
      let y = 270; for (const line of wrap(base,s.title,760*k)) { base.fillText(line,1140*k,y*k); y += 98; }
      base.font = `450 ${43*k}px ${SANS}`; base.fillStyle = '#405147'; y += 28;
      for (const line of wrap(base,s.body,760*k)) { base.fillText(line,1140*k,y*k); y += 61; }
      base.fillStyle = s.accent; base.fillRect(80*k, 950*k, 940*k, 2*k);
      base.font = `500 ${36*k}px ${SANS}`; base.fillStyle = '#52645a';
      for (const [i,line] of wrap(base,s.note,900*k).entries()) base.fillText(line,80*k,(1010+i*48)*k);
      stage.tooth(.035);
    }});
  }};
}

function cover(): LiveScene { const src=DIR+'cover.svg'; return { id:'bambu-cover', sources:[src], create(images,width,height) {
  const stage=createStage(width,height), photo=images.get(src);
  return loopPage(stage,{loop:2,rest:2,once:true,step(){},draw(){
    stage.base.fillStyle='#00a942'; stage.base.fillRect(0,0,width,height);
    if(photo) stage.base.drawImage(photo,0,0,width,height);
  }});
}}; }

function illustration(id:string):LiveScene { const src=DIR+id+'.png'; return {id:`bambu-${id}`,sources:[src],create(images,width,height) {
  const stage=createStage(width,height), {base}=stage, img=images.get(src);
  return loopPage(stage,{loop:2,rest:2,once:true,step(){},draw(t){
    base.fillStyle= id === 'make' ? '#153d20' : id === 'learn' ? '#a63b19' : '#35546b'; base.fillRect(0,0,width,height);
    if(img){ const p=smoothstep(0,1.5,t), scale=.98+.02*p; const w=width*scale, h=w*img.naturalHeight/img.naturalWidth; base.drawImage(img,(width-w)/2,(height-h)/2,w,h); }
  }});
}}; }
export const BAMBU_SCENES: LiveScene[] = [cover(), ...stories.map(storyScene), ...['make','learn','share'].map(illustration)];
