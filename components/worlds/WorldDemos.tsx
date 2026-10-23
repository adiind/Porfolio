import React, { useRef, useState } from 'react';

export function SuryaDemo() {
  const [hour, setHour] = useState(10);
  const openness = Math.max(.08, Math.sin((hour - 6) / 12 * Math.PI));
  return <div className="world-demo surya-demo" style={{ '--bloom': openness } as React.CSSProperties}>
    <div className="sun-orbit" aria-hidden="true"><i style={{ transform: `rotate(${hour / 24 * 360}deg)` }}><b /></i></div>
    <svg viewBox="0 0 500 400" aria-hidden="true" className="bloom-diagram">
      <circle cx="250" cy="200" r="138" fill="none" stroke="currentColor" strokeOpacity=".18" />
      {Array.from({length:12}, (_, i) => <g key={i} transform={`translate(250 200) rotate(${i * 30})`}><path d="M0 0 C-58 -35 -45 -105 0 -132 C45 -105 58 -35 0 0" fill={i % 2 ? '#cf8853' : '#e7b27c'} stroke="#583624" strokeWidth="1" style={{transform:`scale(${.28 + openness * .72})`,transition:'transform .25s ease'}} /></g>)}
      <circle cx="250" cy="200" r="26" fill="#5b372b" /><circle cx="250" cy="200" r="17" fill="#e9c39a" />
    </svg>
    <div className="world-demo-readout"><span>Illustrative local time</span><strong>{String(hour).padStart(2,'0')}:00</strong><span>{hour >= 7 && hour <= 18 ? 'A flower opens into the day' : 'A flower folds toward rest'}</span></div>
    <label className="world-slider">Move through the day<input aria-label="Illustrative hour of day" type="range" min="0" max="23" value={hour} onChange={e=>setHour(Number(e.target.value))} /><span><b>Midnight</b><b>Noon</b><b>Night</b></span></label>
  </div>;
}

const signalSteps = ['Wake word', 'Local recognition', 'MQTT message', 'Home Assistant'];
const signalNotes = ['A wake word opens the interaction.', 'A command model interprets the requested action.', 'A message carries intent to the automation layer.', 'The automation acts; LEDs provide visible feedback.'];
export function JarvisDemo() {
  const [step, setStep] = useState(0);
  return <div className="world-demo jarvis-demo">
    <div className="signal-wave" aria-hidden="true">{Array.from({length:35},(_,i)=><i key={i} style={{height:`${12+Math.abs(Math.sin(i*.7))*Math.sin(i/35*Math.PI)*100}px`,opacity:step===0?1:.28}} />)}</div>
    <div className="signal-circuit" role="group" aria-label="Signal stages">{signalSteps.map((label,i)=><button key={label} aria-pressed={i===step} onClick={()=>setStep(i)} className={i<=step?'lit':''}><span>0{i+1}</span><b>{label}</b><i aria-hidden="true" /></button>)}</div>
    <div className={`signal-room ${step===3?'on':''}`} aria-hidden="true"><div className="lamp-shade"/><div className="lamp-stem"/><div className="lamp-pool"/><span>Voice → physical feedback</span></div>
    <p className="signal-note" aria-live="polite">{signalNotes[step]}</p>
    <button className="world-pill" onClick={()=>setStep((step+1)%4)}>{step===3?'Start again':'Next stage'} <span aria-hidden="true">→</span></button>
  </div>;
}

export function PlotterDemo() {
  const [progress,setProgress] = useState(65);
  const pathRef=useRef<SVGPathElement>(null);
  const path='M80 240 C110 65 185 60 240 135 C300 220 200 300 155 210 C115 115 270 70 320 170 C385 300 450 280 465 170 C475 90 390 60 370 135 C350 220 480 300 530 195';
  const point=pathRef.current?.getPointAtLength(pathRef.current.getTotalLength()*progress/100);
  return <div className="world-demo plotter-demo">
    <div className="plot-paper"><div className="plot-registration">X / Y <span>Sample path · {progress}%</span></div><svg viewBox="0 0 600 350" aria-label={`Illustrative vector path ${progress} percent drawn`} role="img"><path d={path} fill="none" stroke="#c9bdb0" strokeWidth="1.5" strokeDasharray="4 7"/><path ref={pathRef} d={path} fill="none" stroke="#a63230" strokeWidth="3" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100-progress}/>{point&&<g transform={`translate(${point.x} ${point.y})`}><path d="M0 0 L-8 -20 L-8 -95 L8 -95 L8 -20 Z" fill="#343331"/><path d="M0 0 L-8 -20 L8 -20 Z" fill="#bb8b60"/><circle r="5" fill="#a63230"/></g>}</svg><div className="plot-registration"><span>Bounded canvas</span><span>Pen down → pen up</span></div></div>
    <label className="world-slider">Follow the pen<input type="range" min="0" max="100" value={progress} aria-label="Drawing progress" onChange={e=>setProgress(Number(e.target.value))}/><span><b>Voice</b><b>Vector</b><b>Paper</b></span></label>
  </div>;
}
