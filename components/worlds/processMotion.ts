import { WorldId } from './worldStories';

export const clamp = (n:number) => Math.max(0, Math.min(1,n));
const ease = (n:number) => {const t=clamp(n);return t*t*(3-2*t)};
type Pose = readonly [number,number,number]; // x%, y%, scale
export type ProcessShot = {src:string;label:string;caption:string;from:Pose;to:Pose;origin?:string};
const original='/images/project-worlds/originals/';
export const processShots:Record<WorldId,ProcessShot[]> = {
  surya:[
    {src:original+'surya.webp',label:'The actual wall timepiece',caption:'Original prototype photograph',from:[0,0,1],to:[-2,0,1.16],origin:'51% 47%'},
    {src:original+'surya.webp',label:'Three printed flower mechanisms',caption:'Detail from the original prototype photograph',from:[0,0,1.45],to:[0,0,2.05],origin:'51% 34%'},
    {src:'/images/project-worlds/surya-engraving.webp',label:'The engraved wooden surface',caption:'Original workshop photograph',from:[0,0,1],to:[-4,-5,1.3],origin:'62% 62%'},
    {src:'/images/project-worlds/surya-layers.webp',label:'The photographed layer stack',caption:'Original workshop photograph',from:[0,0,1.32],to:[0,0,1],origin:'49% 65%'},
  ],
  jarvis:[
    {src:original+'jarvis-assembly.jpg',label:'The actual enclosure and parts',caption:'Frame from the original Jarvis project video',from:[0,0,1],to:[0,0,1.12],origin:'48% 54%'},
    {src:original+'jarvis-build.jpg',label:'Electronics on the workbench',caption:'Frame from the original Jarvis project video',from:[0,0,1],to:[0,0,1.1],origin:'55% 72%'},
    {src:original+'jarvis-assembly.jpg',label:'The assembled interface',caption:'Frame from the original Jarvis project video',from:[0,0,1.18],to:[0,0,1],origin:'49% 55%'},
    {src:original+'jarvis-room.jpg',label:'Jarvis in the room',caption:'Frame from the original Jarvis project video',from:[0,0,1.08],to:[0,0,1],origin:'48% 51%'},
  ],
  plotter:[
    {src:original+'plotter.webp',label:'The actual plotter and its output',caption:'Original prototype photograph',from:[0,0,1],to:[0,0,1.12],origin:'49% 53%'},
    {src:original+'plotter.webp',label:'The drawing on paper',caption:'Detail from the original prototype photograph',from:[0,0,1.05],to:[0,0,1.35],origin:'50% 80%'},
    {src:original+'plotter.webp',label:'The belt and horizontal rails',caption:'Detail from the original prototype photograph',from:[0,0,1.35],to:[0,0,1.7],origin:'51% 60%'},
    {src:original+'plotter.webp',label:'The printed clamp and guide rods',caption:'Detail from the original prototype photograph',from:[0,0,1.4],to:[0,0,1.8],origin:'48% 46%'},
  ],
};

/** A short handoff around each boundary, with a long readable camera move between. */
export function processFrame(progress:number,index:number,shot:ProcessShot,phone=false) {
  const q=clamp(progress)*4;
  const enter=index===0?1:ease((q-index+.16)/.32);
  const leave=index===3?0:ease((q-index-.84)/.32);
  const t=ease((q-index-.12)/.68);
  const pose=shot.from.map((v,i)=>v+(shot.to[i]-v)*t);
  // Phone framing keeps each real object in view; it does not shrink the entire stage.
  const scale=1+(pose[2]-1)*(phone?.78:1);
  return {opacity:enter*(1-leave),x:pose[0],y:pose[1]+(1-enter)*7-leave*7,scale,local:clamp(q-index)};
}
