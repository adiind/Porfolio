import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ArrowDown, ArrowLeft, ArrowUpRight, X } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';
import { worldStories, WorldId } from './worldStories';
import { JarvisDemo, PlotterDemo, SuryaDemo } from './WorldDemos';
import WorldMotion, { openingPose } from './WorldMotion';
import ProcessScroll from './ProcessScroll';
import './worlds.css';

export default function WorldProjectDetail({project,onClose}:{project:Project;onClose:()=>void}) {
  const id=project.id as WorldId;
  const story=worldStories[id];
  const reduce=useReducedMotion();
  const dialogRef=useDialogA11y(onClose,{historyTag:'project',historyPath:projectPath(id),escapePassthroughSelector:'.world-lightbox'});
  const scrollRef=useRef<HTMLDivElement>(null);
  const stageRef=useRef<HTMLElement>(null);
  const cameraRef=useRef<HTMLDivElement>(null);
  const [travel,setTravel]=useState(0);
  const [chapter,setChapter]=useState(0);
  const [expanded,setExpanded]=useState<string|null>(null);
  const previousFocus=useRef<HTMLElement|null>(null);
  const lightboxClose=useRef<HTMLButtonElement>(null);
  const sections=['world-context','world-interaction','world-process','world-reflection'];

  useEffect(()=>{
    const root=scrollRef.current, stage=stageRef.current;
    if(!root||!stage)return;
    let frame=0;
    const update=()=>{
      const p=Math.max(0,Math.min(1,root.scrollTop/Math.max(1,stage.offsetHeight-root.clientHeight)));
      setTravel(reduce?0:Math.round(p*1000)/1000);
      if(cameraRef.current){
        const phone=root.clientWidth<700;
        const pose=openingPose(p,phone);
        const scale=reduce?1:pose.scale;
        const x=reduce?0:Math.sin(p*Math.PI*2)*(phone?2:5)*(id==='plotter'?-1:1);
        cameraRef.current.style.transform=`translate3d(${x}%,${reduce?0:-p*4}%,0) scale(${scale})`;
        cameraRef.current.style.opacity=String(reduce?1:1-pose.reveal);
      }
      let current=0;sections.forEach((section,i)=>{const el=root.querySelector('#'+section);if(el&&el.getBoundingClientRect().top<root.clientHeight*.45)current=i;});setChapter(current);
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update)};
    root.addEventListener('scroll',schedule,{passive:true});
    const observer=new ResizeObserver(schedule);observer.observe(root);observer.observe(stage);update();
    return()=>{root.removeEventListener('scroll',schedule);observer.disconnect();cancelAnimationFrame(frame)};
  },[reduce,id]);
  useEffect(()=>{if(expanded)lightboxClose.current?.focus();else previousFocus.current?.focus({preventScroll:true})},[expanded]);
  const jump=(target:string)=>{const el=scrollRef.current?.querySelector<HTMLElement>('#'+target);el?.scrollIntoView({behavior:reduce?'instant':'smooth',block:'start'});el?.focus({preventScroll:true})};
  const enlarge=(src:string)=>{previousFocus.current=document.activeElement as HTMLElement;setExpanded(src)};
  const decisions=id==='surya'?project.decisions.filter(d=>!d.decision.includes('Motor')):project.decisions;
  return ReactDOM.createPortal(<div ref={dialogRef} className={`world-case world-${id}`} role="dialog" aria-modal="true" aria-label={project.hero.title} tabIndex={-1}>
    <header className="world-topbar"><button onClick={onClose} aria-label="Back to portfolio"><ArrowLeft size={17}/><span>Portfolio</span></button><span className="world-wordmark">{story.name}</span><button onClick={onClose} aria-label={`Close ${story.name} case study`}><X size={19}/></button></header>
    <div className="world-scroll" ref={scrollRef}>
      <main>
        <section className="world-opening" ref={stageRef}>
          <div className="world-stage">
            <div className="world-camera" ref={cameraRef}><img src={`/images/project-worlds/${id}-hero-alpha.webp`} alt={id==='surya'?'Illustrated miniature rooms connect a sunlit day and a moonlit night.':id==='jarvis'?'Illustrated sound wave connects a processor to a softly lit room.':'Illustrated paper ribbon connects a sound wave to a technical pen.'} fetchPriority="high"/></div>
            <div className="world-stage-shade"/>
            <div className="world-hero-copy" inert={openingPose(travel,false).copyOpacity===0} style={{opacity:openingPose(travel,false).copyOpacity,transform:`translateY(${-Math.min(travel/.4,1)*30}px)`}}><p className="world-eyebrow">{story.category}</p><h1 id="world-title">{story.name}<span>{story.title[0]}<br/><em>{story.title[1]}</em></span></h1><p className="world-intro">{story.intro}</p></div>
            {!reduce&&<WorldMotion id={id} progress={travel}/>}
            <div className="world-scene-footer"><span style={{opacity:1-openingPose(travel,false).reveal}}>AI-generated concept illustration</span><span className="world-scroll-cue">Scroll to explore ↓</span></div>
          </div>
        </section>
        <nav className="world-chapters" aria-label={`${story.name} chapters`}>{story.chapters.map((c,i)=><button key={c} aria-current={chapter===i?'step':undefined} onClick={()=>jump(sections[i])}><span>0{i+1}</span>{c}</button>)}</nav>
        <section id="world-context" className="world-section world-context" tabIndex={-1}><div><p className="world-eyebrow">01 / {story.chapters[0]}</p><h2>{story.question}</h2></div><div className="world-context-copy"><p>{project.context.text}</p></div></section>
        <section id="world-interaction" className="world-section world-interaction" tabIndex={-1}><div className="world-section-heading"><p className="world-eyebrow">02 / {story.chapters[1]}</p><h2>{story.demoTitle}</h2><p>{story.demoIntro}</p></div>{id==='surya'?<SuryaDemo/>:id==='jarvis'?<JarvisDemo/>:<PlotterDemo/>}</section>
        <ProcessScroll id={id} scroller={scrollRef} enlarge={enlarge}/>
        <section className="world-evidence world-section"><div className="world-section-heading"><p className="world-eyebrow">The actual project</p><h2>{id==='surya'?'Made by hand. Layer by layer.':id==='jarvis'?'On the workbench.':'Beyond the illustration.'}</h2></div><div className={`world-evidence-grid ${id==='surya'?'has-gallery':''}`}><figure><button className="world-image-button" onClick={()=>enlarge(id==='jarvis'?'/images/project-worlds/originals/jarvis-assembly.jpg':`/images/project-worlds/originals/${id}.webp`)} aria-label={`Enlarge original ${story.name} project image`}><img src={id==='jarvis'?'/images/project-worlds/originals/jarvis-assembly.jpg':`/images/project-worlds/originals/${id}.webp`} alt={`Original ${story.name} project image from the existing portfolio`} width={id==='jarvis'?1280:id==='surya'?640:480} height={id==='jarvis'?720:id==='surya'?480:640} loading="lazy"/></button><figcaption>{id==='jarvis'?'Frame from the original project video':'Original project photograph'}</figcaption></figure>{id==='surya'?<div className="world-source-pair">{[['surya-engraving','Engraved mandala detail'],['surya-layers','Stacked mandala layers']].map(([file,caption])=><figure key={file}><button className="world-image-button" aria-label={`Enlarge ${caption}`} onClick={()=>enlarge(`/images/project-worlds/${file}.webp`)}><img loading="lazy" src={`/images/project-worlds/${file}.webp`} alt={caption}/></button><figcaption>{caption} · workshop photograph</figcaption></figure>)}</div>:<div className="world-build-list"><p className="world-eyebrow">What I built</p><ul>{project.build.bullets.map(b=><li key={b}>{b}</li>)}</ul></div>}</div></section>
        <section className="world-section world-decisions"><div className="world-section-heading"><p className="world-eyebrow">The tradeoffs</p><h2>Decisions & tradeoffs.</h2></div>{decisions.map((d,i)=><details key={d.decision} open={i===0}><summary><span>0{i+1}</span><h3>{d.decision}</h3><b aria-hidden="true">+</b></summary><div><p><span>The reason</span>{d.why}</p><p><span>The tradeoff</span>{d.tradeoff}</p></div></details>)}</section>
        <section id="world-reflection" className="world-section world-reflection" tabIndex={-1}><div className="world-section-heading"><p className="world-eyebrow">04 / {story.chapters[3]}</p><h2>{story.takeaway}</h2><p>{story.outcome}</p></div><div className="world-lessons"><article><span>Keep</span><h3>What carried through</h3>{project.review.worked.map(t=><p key={t}>{t}</p>)}</article><article><span>Revisit</span><h3>Where it got difficult</h3>{project.review.didnt.map(t=><p key={t}>{t}</p>)}</article></div>{project.outcome.proof&&<a className="world-pill" href={project.outcome.proof} target="_blank" rel="noreferrer">See the original project post <ArrowUpRight size={16}/></a>}</section>
        <footer className="world-end"><button className="world-pill" onClick={onClose}><ArrowLeft size={16}/> Back to portfolio</button><button className="world-to-top" onClick={()=>{scrollRef.current?.scrollTo({top:0,behavior:reduce?'instant':'smooth'});dialogRef.current?.focus({preventScroll:true})}}>Back to the opening ↑</button></footer>
      </main>
    </div>
    {expanded&&<div className="world-lightbox" role="dialog" aria-modal="true" aria-label="Project image" onClick={()=>setExpanded(null)} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setExpanded(null)}if(e.key==='Tab'){e.preventDefault();lightboxClose.current?.focus()}}}><button ref={lightboxClose} aria-label="Close enlarged image" onClick={()=>setExpanded(null)}><X/> Close image</button><img src={expanded} alt="Enlarged project visual" onClick={e=>e.stopPropagation()}/></div>}
  </div>,document.body);
}
