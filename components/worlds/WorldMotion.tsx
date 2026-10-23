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
  const pen=penAtProgress(detail);
  return <div className="world-motion" aria-hidden="true" style={{opacity:reveal,transform:`translate3d(0,${(1-reveal)*60}px,0) scale(${.86+reveal*.14})`}}>
    <div className="world-motion-copy"><span className="world-eyebrow">{id==='surya'?'A rhythm you can see':id==='jarvis'?'Intent travels through the system':'An idea takes shape'}</span><h2>{id==='surya'?<>A day opens.<br/><em>A night closes.</em></>:id==='jarvis'?<>Voice becomes<br/><em>physical action.</em></>:<>A passing thought.<br/><em>A lasting line.</em></>}</h2><p>{id==='surya'?'A flower carries the idea of someone’s day.':id==='jarvis'?'Recognize locally. Route the message. Respond.':'Voice → text → vector → motion.'}</p></div>
    <svg viewBox="0 0 600 430" className="world-motion-object">
      <defs><radialGradient id={`motion-light-${id}`}><stop stopColor={id==='jarvis'?'#a981ec':'#e9b274'} stopOpacity=".2"/><stop offset="1" stopColor="#000" stopOpacity="0"/></radialGradient><linearGradient id={`motion-metal-${id}`}><stop stopColor="#e3c29d"/><stop offset=".5" stopColor="#90603f"/><stop offset="1" stopColor="#eacba9"/></linearGradient></defs>
      <ellipse cx="300" cy="235" rx="300" ry="195" fill={`url(#motion-light-${id})`}/>
      {id==='surya'?<>
        <ellipse cx="300" cy="220" rx="235" ry="140" fill="none" stroke="#d5aa7b" strokeOpacity=".3"/>
        <ellipse cx="300" cy="220" rx="200" ry="115" fill="none" stroke="#d5aa7b" strokeOpacity=".15" strokeDasharray="3 8"/>
        {[{x:170,y:165,phase:0},{x:430,y:165,phase:Math.PI},{x:300,y:310,phase:Math.PI/2}].map((f,j)=>{const bloom=.25+.75*(.5+.5*Math.sin(detail*Math.PI*2+f.phase));return <g key={j} transform={`translate(${f.x} ${f.y})`}>{Array.from({length:10},(_,i)=><g key={i} transform={`rotate(${i*36})`}><path d="M0 0 C-45 -30 -35 -78 0 -105 C35 -78 45 -30 0 0" fill={`url(#motion-metal-${id})`} stroke="#e8c8a6" strokeWidth=".4" transform={`scale(${bloom})`}/></g>)}<circle r="19" fill="#352318" stroke="#e2ba86"/><circle r="7" fill="#e2ba86"/></g>})}
        <circle cx={300+235*Math.cos(detail*Math.PI*2)} cy={220+140*Math.sin(detail*Math.PI*2)} r="8" fill="#ffe3af"/>
        <text x="65" y="395">DAY / NIGHT</text><text x="430" y="395">SHARED RHYTHMS</text>
      </>:id==='jarvis'?<>
        <path d="M65 225 C150 225 125 130 240 130 S350 310 435 225 L535 225" stroke="#8c6cb7" strokeOpacity=".35" fill="none" strokeWidth="2"/>
        <path d="M65 225 C150 225 125 130 240 130 S350 310 435 225 L535 225" stroke="#d9bcff" fill="none" strokeWidth="3" pathLength="100" strokeDasharray="100" strokeDashoffset={100-detail*100}/>
        {[[65,225],[240,130],[370,248],[535,225]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`} opacity={detail>=i/3?1:.35}><rect x="-30" y="-30" width="60" height="60" rx={i===0?30:10} fill="#2c2537" stroke="#cbb0ef"/><circle r={i===3?13:7} fill={detail>=i/3?'#e4c998':'#9f81bc'}/><text textAnchor="middle" y="65">{['VOICE','RECOGNIZE','MQTT','RESPOND'][i]}</text></g>)}
        {Array.from({length:21},(_,i)=><rect key={i} x={175+i*12} y={340-Math.abs(Math.sin(i*.7+detail*7))*20} width="3" height={8+Math.abs(Math.sin(i*.7+detail*7))*40} rx="2" fill="#bb9ade" opacity={1-detail*.6}/>)}
      </>:<>
        <g transform={`translate(300 220) rotate(${-8+detail*8}) translate(-300 -220)`}>
          <path d="M45 65 H555 V355 Q300 335 45 365 Z" fill="#f6eddb"/>
          {Array.from({length:9},(_,i)=><path key={i} d={`M65 ${100+i*28} H535`} stroke="#bb9e7c" strokeOpacity=".15"/>)}
          <path d={plotPath} fill="none" stroke="#be4434" strokeWidth="3" pathLength="100" strokeDasharray="100" strokeDashoffset={100-detail*100}/>
          <g className="world-motion-pen" transform={`translate(${pen.x} ${pen.y}) rotate(22)`}><path d="M0 0 L-9 -22 V-115 H9 V-22 Z" fill="#665c51"/><path d="M0 0 L-9 -22 H9 Z" fill="#c8a272"/><path d="M-5 -115 H-1 V-23 H-5 Z" fill="#d5cec0"/></g>
          <text x="70" y="100" style={{fill:'#7e6550'}}>A VOICE BECOMES A PATH</text>
        </g>
        <text x="65" y="405">SAMPLE VECTOR</text><text x="445" y="405">{Math.round(detail*100)}% DRAWN</text>
      </>}
    </svg>
    <span className="world-motion-caption">{id==='surya'?'Illustrative rhythm · not a mechanical model':id==='jarvis'?'Architecture illustration · no live device connection':'Illustrative path · not recorded machine output'}</span>
  </div>;
}
