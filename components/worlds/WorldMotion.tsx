import React from 'react';
import { WorldId } from './worldStories';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const plotPoints=Array.from({length:101},(_,i)=>({x:90+i*4.2,y:225-Math.sin(i/100*Math.PI*4)*65}));
const plotDistances=plotPoints.map((point,i)=>i?Math.hypot(point.x-plotPoints[i-1].x,point.y-plotPoints[i-1].y):0);
const plotLength=plotDistances.reduce((sum,length)=>sum+length,0);
const plotPath=plotPoints.map((point,i)=>`${i?'L':'M'}${point.x} ${point.y}`).join(' ');
export function penAtProgress(progress:number) {
  let distance=clamp(progress)*plotLength;
  for(let i=1;i<plotPoints.length;i++){
    if(distance<=plotDistances[i]){
      const t=distance/plotDistances[i];
      return {x:plotPoints[i-1].x+(plotPoints[i].x-plotPoints[i-1].x)*t,y:plotPoints[i-1].y+(plotPoints[i].y-plotPoints[i-1].y)*t};
    }
    distance-=plotDistances[i];
  }
  return plotPoints[plotPoints.length-1];
}

/** Scroll position is the only clock: every pose is reproducible in reverse. */
export function openingPose(progress:number,phone:boolean) {
  const p=clamp(progress);
  const reveal=clamp((p-.33)/.25);
  return {reveal,detail:clamp((p-.52)/.48),scale:1+Math.sin(p*Math.PI)*(phone?.13:.32),copyOpacity:1-clamp((p-.18)/.18)};
}

export default function WorldMotion({id,progress}:{id:WorldId;progress:number}) {
  const {reveal,detail}=openingPose(progress,false);

  return <div className="world-motion" aria-hidden="true" style={{opacity:reveal,transform:`translate3d(0,${(1-reveal)*60}px,0) scale(${.86+reveal*.14})`}}>
    <div className="world-motion-copy"><span className="world-eyebrow">{id==='surya'?'A rhythm you can see':id==='jarvis'?'Intent travels through the system':'An idea takes shape'}</span><h2>{id==='surya'?<>A day opens.<br/><em>A night closes.</em></>:id==='jarvis'?<>Voice becomes<br/><em>physical action.</em></>:<>A passing thought.<br/><em>A lasting line.</em></>}</h2><p>{id==='surya'?'A flower carries the idea of someone’s day.':id==='jarvis'?'Recognize locally. Route the message. Respond.':'Voice → text → vector → motion.'}</p></div>
    <img className="world-motion-object" src={id==='jarvis'?'/images/project-worlds/originals/jarvis-assembly.jpg':`/images/project-worlds/originals/${id}.webp`} alt=""/>
    <span className="world-motion-caption">{id==='jarvis'?'Frame from the original project video':'Original prototype photograph'}</span>
  </div>;
}
