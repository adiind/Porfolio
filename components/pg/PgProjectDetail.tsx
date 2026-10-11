import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowLeft, LockKeyhole, X } from 'lucide-react';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useContentEngagement } from '../../hooks/useContentEngagement';
import { projectPath } from '../../lib/workRoutes';
import { pgLadder, pgMetrics, pgMethods, pgNeeds, pgSections } from '../../data/pgStory';
import PgDoubleDiamond from './PgDoubleDiamond';

import './pg-case.css';

const PgProjectDetail: React.FC<{ project: Project; onClose: () => void; analyticsSource?: string }> = ({ project, onClose }) => {
  const dialogRef = useDialogA11y(onClose, { historyTag: 'project', historyPath: projectPath(project.id), escapePassthroughSelector: '.pg-image-expanded' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState('pg-glance');
  const engagementRef = useContentEngagement<HTMLElement>({ contentType: 'project', contentId: project.id });


  useEffect(() => {
    const nav = tocRef.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current]');
    if (!nav || !current) return;
    const left = current.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft || left + current.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: Math.max(0, left - 22), behavior: 'instant' });
  }, [activeSection]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) setActiveSection(entry.target.id);
    }), { root, rootMargin: '-18% 0px -58% 0px', threshold: 0 });
    root.querySelectorAll('[data-pg-section]').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = scrollRef.current as HTMLDivElement | null;
    const nav = root?.querySelector<HTMLElement>('.pg-toc');
    if (!root || !nav) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      const pinned = nav.getBoundingClientRect().top <= parseFloat(getComputedStyle(nav).top) + 1;
      nav.dataset.pinned = String(pinned);
    };
    const schedule = () => { if (disposed) return; cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    root.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    document.fonts.ready.then(schedule);
    schedule();
    return () => { disposed = true; cancelAnimationFrame(frame); root.removeEventListener('scroll', schedule); observer.disconnect(); };
  }, []);

  const goTo = (id: string) => {
    const target = scrollRef.current?.querySelector<HTMLElement>('#' + id);
    target?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
  };

  return ReactDOM.createPortal(<motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pg-project-title" tabIndex={-1} className="pg-case" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : .15 }}>
    <button type="button" className="pg-close" onClick={onClose} aria-label="Close P&G case study"><X size={18} /> Close</button>
    <div ref={scrollRef} className="pg-scroll"><main ref={engagementRef} className="pg-sheet">
      <header className="pg-header"><button type="button" onClick={onClose}><ArrowLeft size={15} /> Selected Work</button><div className="pg-header-lockup"><img src="/images/pg/pg-logo-official.svg" alt="P&G" /><span>Conditioning product packaging</span></div></header>

      <section id="pg-glance" data-pg-section tabIndex={-1} className="pg-hero pg-wrap" aria-labelledby="pg-project-title">
        <div className="pg-lockup"><img src="/images/pg/pg-logo-official.svg" alt="" /><span>P&G × Northwestern EDI · Fall 2025</span><b>Under NDA</b></div>
        <div className="pg-hero-intro"><div className="pg-hero-copy"><p className="pg-kicker">01 / At a glance</p><h1 id="pg-project-title">Rethinking the bottle.</h1><p className="pg-hero-subline">And the routine around it.</p><p className="pg-deck">A four-sprint consumer research and packaging exploration. Confidential product details and research findings remain under NDA.</p></div><figure className="pg-room pg-hero-room"><img src="/images/pg/rooms/room-hero.webp" alt="Illustrated miniature bathroom with warm wood, plants, and navy and coral accents." width={720} height={720} fetchPriority="high" /><figcaption>Illustrated context · not field documentation</figcaption></figure></div>
        <dl className="pg-meta"><div><dt>Research</dt><dd>{pgMetrics[0].value} {pgMetrics[0].label}</dd></div><div><dt>Approach</dt><dd>Observe → explore → learn</dd></div></dl>
        <button type="button" className="pg-continue" onClick={() => goTo('pg-sprint')}>Follow the process <ArrowDown size={15} /></button>
      </section>

      <nav className="pg-toc" aria-label="P&G case study contents"><div ref={tocRef} className="pg-wrap">{pgSections.map(section => <button key={section.id} type="button" aria-current={activeSection === section.id ? 'step' : undefined} onClick={() => goTo(section.id)}><span>{section.number}</span>{section.label}</button>)}</div></nav>

      <section id="pg-sprint" data-pg-section tabIndex={-1} className="pg-section pg-wrap" aria-labelledby="pg-sprint-title">
        <div className="pg-section-title"><p className="pg-kicker">02 / The sprint</p><h2 id="pg-sprint-title">{pgSections[1].title}</h2><p>{pgSections[1].intro}</p></div>
        <PgDoubleDiamond />
      </section>

      <section id="pg-worked" data-pg-section tabIndex={-1} className="pg-section pg-wrap pg-split" aria-labelledby="pg-worked-title">
        <div className="pg-section-title"><p className="pg-kicker">03 / How we worked</p><h2 id="pg-worked-title">{pgSections[2].title}</h2><img className="pg-accent pg-cards" src="/images/pg/accents/cards.webp" loading="lazy" alt="" aria-hidden="true" /></div>
        <div className="pg-working pg-process-paper"><p className="pg-paper-label">Field notes → themes → questions</p><ol className="pg-steps">{pgSections[2].actions.map((action, i) => <li key={action.title}><span>0{i + 1}</span><div><h3>{action.title}</h3><p>{action.text}</p></div></li>)}</ol><div className="pg-needs">{pgNeeds.map(need => <div key={need.title}><h4>{need.title}</h4><p>{need.text}</p></div>)}</div></div>
      </section>

      <section id="pg-methods" data-pg-section tabIndex={-1} className="pg-section pg-wrap pg-split" aria-labelledby="pg-methods-title">
        <div className="pg-section-title"><p className="pg-kicker">04 / Methods</p><h2 id="pg-methods-title">{pgSections[3].title}</h2><p>{pgSections[3].intro}</p></div>
        <div className="pg-methods">{pgMethods.map(method => <article key={method.number}><span>{method.number}</span><div><h3>{method.title}</h3><p>{method.summary}</p><dl className="pg-method-notes"><div><dt>Task</dt><dd>{method.task}</dd></div><div><dt>Observe</dt><dd>{method.observe}</dd></div></dl></div></article>)}</div>
      </section>

      <section id="pg-prototypes" data-pg-section tabIndex={-1} className="pg-section pg-wrap" aria-labelledby="pg-prototypes-title">
        <div className="pg-prototype-heading"><div className="pg-section-title"><p className="pg-kicker">05 / Prototypes</p><h2 id="pg-prototypes-title">{pgSections[4].title}</h2><p>{pgSections[4].intro}</p></div><img className="pg-accent pg-notebook" src="/images/pg/accents/notebook.webp" loading="lazy" alt="" aria-hidden="true" /></div>
        <div className="pg-iteration-sheet"><p className="pg-paper-label">An exploration loop</p><ol className="pg-prototype-steps">{pgLadder.map((step, i) => <li key={step.label}><span>0{i + 1}</span><h3>{step.label}</h3><p>{step.note}</p></li>)}</ol>
        <p className="pg-nda-note"><LockKeyhole size={14} aria-hidden="true" /> Design details and outcomes remain under NDA.</p></div>
      </section>
      <footer className="pg-footer pg-wrap"><span>Northwestern EDI · Fall 2025</span><button type="button" onClick={onClose}><ArrowLeft size={15} /> Back to Selected Work</button></footer>
    </main></div>
  </motion.div>, document.body);
};

export default PgProjectDetail;
