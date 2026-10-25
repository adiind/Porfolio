import React, { RefObject, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { worldStories, WorldId } from './worldStories';
import { processFrame, processShots, clamp } from './processMotion';
import './process-scroll.css';

gsap.registerPlugin(ScrollTrigger);

export default function ProcessScroll({id,scroller,enlarge}:{id:WorldId;scroller:RefObject<HTMLDivElement|null>;enlarge:(src:string)=>void}) {
  const reduce=useReducedMotion();
  const track=useRef<HTMLDivElement>(null);
  const stage=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(0);
  const shots=processShots[id],story=worldStories[id];

  useEffect(()=>{
    const root=scroller.current,el=track.current,view=stage.current;
    if(reduce||!root||!el||!view)return;
    const images=Array.from(view.querySelectorAll<HTMLElement>('.process-shot'));
    const texts=Array.from(view.querySelectorAll<HTMLElement>('.process-copy'));
    let last=-1;
    const render=(progress:number)=>{
      const next=Math.min(3,Math.floor(clamp(progress)*4));
      view.style.setProperty('--process-progress',String(clamp(progress)));
      view.dataset.beat=String(next);
      images.forEach((image,i)=>{
        const f=processFrame(progress,i,shots[i],root.clientWidth<700);
        image.style.opacity=String(f.opacity);
        image.style.visibility=f.opacity>.001?'visible':'hidden';
        image.style.transform=`translate3d(${f.x}%,${f.y}%,0) scale(${f.scale})`;
      });
      if(next!==last){
        texts.forEach((text,i)=>{text.inert=i!==next;text.setAttribute('aria-hidden',String(i!==next))});
        last=next;setActive(next);
      }
    };
    const trigger=ScrollTrigger.create({trigger:el,scroller:root,start:'top top+=56',end:'bottom bottom',onUpdate:self=>render(self.progress),onRefresh:self=>render(self.progress)});
    const refresh=()=>trigger.refresh();
    const observer=new ResizeObserver(refresh);observer.observe(root);
    const photoImages=Array.from(el.querySelectorAll('img'));
    photoImages.forEach(img=>img.addEventListener('load',refresh));
    render(trigger.progress);
    return()=>{trigger.kill();observer.disconnect();photoImages.forEach(img=>img.removeEventListener('load',refresh))};
  },[id,reduce,scroller,shots]);

  const go=(i:number)=>{
    const root=scroller.current,el=track.current;
    if(!root||!el)return;
    const start=el.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop-56;
    root.scrollTo({top:start+(el.offsetHeight-root.clientHeight+56)*(i+.3)/4,behavior:'smooth'});
  };

  return <section id="world-process" className="world-process-film" tabIndex={-1}>
    <div className="world-section process-heading"><p className="world-eyebrow">03 / {story.chapters[2]}</p><h2>{id==='surya'?'From distance to an object.':id==='jarvis'?'An understandable system.':'From an idea to an artifact.'}</h2></div>
    {reduce?<div className="world-section process-static">{story.steps.map(([title,copy],i)=><article key={title}><div><p className="world-eyebrow">0{i+1}</p><h3>{title}</h3><p>{copy}</p></div><figure><button onClick={()=>enlarge(shots[i].src)} aria-label={`Enlarge ${shots[i].label}`}><img src={shots[i].src} alt={shots[i].label}/></button><figcaption>{shots[i].caption}</figcaption></figure></article>)}</div>:
    <div className="process-scroll-track" ref={track}>
      <div className="process-scroll-stage" ref={stage} data-beat="0">
        <div className="process-picture">
          <button className="process-lens" onClick={()=>enlarge(shots[active].src)} aria-label={`Enlarge ${shots[active].label}`}>
            {shots.map((shot,i)=><div key={i} className={`process-shot process-${id}-${i}`} style={{opacity:i===0?1:0,transformOrigin:shot.origin}} aria-hidden="true"><img src={shot.src} alt="" draggable={false}/></div>)}
          </button>
          <div className="process-photo-caption"><span>{shots[active].label}</span><small>{shots[active].caption}</small></div>
        </div>
        <div className="process-reading">
          <div className="process-copy-stack">{story.steps.map(([title,copy],i)=><article className="process-copy" data-active={active===i} key={title} aria-hidden={active!==i} inert={active!==i}><p className="world-eyebrow">0{i+1} / 04</p><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <nav className="process-beats" aria-label={`${story.name} process steps`}>{story.steps.map((step,i)=><button key={step[0]} aria-current={active===i?'step':undefined} onClick={()=>go(i)}><span>0{i+1}</span>{step[0]}</button>)}</nav>
          <div className="process-progress" aria-hidden="true"><i/></div>
          <span className="process-scroll-note">Scroll to follow the details ↓</span>
        </div>
      </div>
    </div>}
  </section>;
}
