import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from '../../types/Project';
import { ArrowLeft } from 'lucide-react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';

const sections = [
  { id: 'start', label: 'Start' },
  { id: 'overview', label: 'The short version' },
  { id: 'p-context', label: 'Context' },
  { id: 'p-research', label: 'Research' },
  { id: 'p-synthesis', label: 'Synthesis' },
  { id: 'p-exploration', label: 'Exploration' },
  { id: 'p-testing', label: 'Testing' },
  { id: 'p-outcome', label: 'Outcome' },
];

const McDonaldsProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const dialogRef = useDialogA11y(onClose, {
    historyTag: 'project',
    historyPath: projectPath(project.id),
  });

  const goToSection = useCallback((id: string) => {
    const frameWindow = iframeRef.current?.contentWindow;
    const frameDocument = iframeRef.current?.contentDocument;
    const target = frameDocument?.getElementById(id);
    if (!frameWindow || !target) return;
    if (!target.getClientRects().length) {
      frameDocument?.querySelector<HTMLAnchorElement>('#endCard [data-unlock]')?.click();
      return;
    }
    const top = target.getBoundingClientRect().top + frameWindow.scrollY - 72;
    frameWindow.scrollTo({
      top,
      behavior: frameWindow.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    frameWindow.history.replaceState(null, '', `#${id}`);
  }, []);

  useEffect(() => {
    const frame = iframeRef.current;
    const sync = () => {
      const frameWindow = frame?.contentWindow;
      const frameDocument = frame?.contentDocument;
      const documentRoot = frameDocument?.documentElement;
      if (!frameWindow || !documentRoot) return;
      const maxScroll = Math.max(1, documentRoot.scrollHeight - frameWindow.innerHeight);
      const nextProgress = Math.min(100, Math.max(0, Math.round(frameWindow.scrollY / maxScroll * 100)));
      const triggerY = frameWindow.innerHeight * 0.4;
      let nextSection = 0;
      sections.forEach((section, index) => {
        const element = frameDocument.getElementById(section.id);
        if (element?.getClientRects().length && element.getBoundingClientRect().top <= triggerY) nextSection = index;
      });
      setProgress(nextProgress);
      setActiveSection(nextSection);
    };
    const attach = () => {
      const frameWindow = frame?.contentWindow;
      const frameDocument = frame?.contentDocument;
      if (frameDocument?.head && !frameDocument.getElementById('portfolio-tracker-clearance')) {
        const style = frameDocument.createElement('style');
        style.id = 'portfolio-tracker-clearance';
        style.textContent = '@media (min-width: 1024px) { #main { padding-inline-start: clamp(170px, 15vw, 220px); padding-top: 56px; } }';
        frameDocument.head.appendChild(style);
      }
      frameWindow?.addEventListener('scroll', sync, { passive: true });
      sync();
      return frameWindow;
    };
    let frameWindow = attach();
    const onLoad = () => { frameWindow?.removeEventListener('scroll', sync); frameWindow = attach(); };
    frame?.addEventListener('load', onLoad);
    return () => {
      frame?.removeEventListener('load', onLoad);
      frameWindow?.removeEventListener('scroll', sync);
    };
  }, []);

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={project.hero.title} className="fixed inset-0 z-[100] bg-[#050505] focus:outline-none">
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to portfolio"
        className="absolute right-3 top-3 z-10 flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/80 px-4 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] sm:left-6 sm:right-auto sm:justify-start sm:top-6 max-sm:w-11 max-sm:px-0"
      >
        <ArrowLeft aria-hidden="true" size={18} strokeWidth={2.25} />
        <span className="max-sm:hidden">Back to portfolio</span>
      </button>
      <nav aria-label="Case study progress" className="fixed bottom-8 left-[22px] top-20 z-[101] hidden w-[150px] flex-col items-start gap-3 text-[#2b2119] lg:flex">
        <p className="m-0 text-[13px] font-semibold tracking-tight">Squad Up</p>
        <svg className="h-[42px] w-[92px] shrink-0" viewBox="0 0 168 78" aria-hidden="true">
          <path d="M8 39 L46 10 L84 39 L46 68 Z M84 39 L122 10 L160 39 L122 68 Z" fill="none" stroke="#2b2119" strokeOpacity=".4" strokeWidth="1.5" />
          <path d="M8 39 L46 10 L46 68 Z M84 39 L122 10 L122 68 Z" fill="#f6efe3" stroke="#2b2119" strokeOpacity=".22" strokeWidth="1" />
          <circle cx="8" cy="39" r="4" fill="#c23b2c" />
          <circle cx="84" cy="39" r="3.5" fill="#f6efe3" stroke="#2b2119" strokeOpacity=".55" strokeWidth="1.5" />
          <circle cx="160" cy="39" r="4" fill="#f6efe3" stroke="#2b2119" strokeOpacity=".55" strokeWidth="1.5" />
        </svg>
        <div className="relative min-h-0 w-full flex-1">
          <div role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="absolute bottom-0 left-[9px] top-0 w-[2px] rounded-full bg-[#2b2119]/20">
            <span aria-hidden="true" className="absolute left-0 top-0 block h-full w-full origin-top rounded-full bg-[#c23b2c]" style={{ transform: `scaleY(${progress / 100})` }} />
          </div>
          <p className="absolute left-[27px] m-0 -translate-y-1/2 rounded-md bg-[#f6efe3]/95 px-2 py-[3px] text-[11px] font-medium leading-tight" style={{ top: `${progress}%` }} aria-live="polite">
            {sections[activeSection]?.label}
          </p>
          <ol className="absolute inset-0 m-0 list-none p-0">
            {sections.map((section, index) => (
              <li key={section.id} className="absolute left-[10px] h-0 w-0" style={{ top: `${index / (sections.length - 1) * 100}%` }}>
                <button
                  type="button"
                  onClick={() => goToSection(section.id)}
                  aria-label={`Go to ${section.label}`}
                  aria-current={activeSection === index ? 'step' : undefined}
                  className="group absolute -left-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c23b2c]"
                >
                  <span className={`h-[10px] w-[10px] rounded-full border-[1.5px] border-[#2b2119] transition-colors ${activeSection === index ? 'scale-125 border-[#c23b2c] bg-[#c23b2c]' : index < activeSection ? 'bg-[#2b2119]' : 'bg-[#f6efe3]'}`} />
                  <span className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#2b2119] px-2 py-1 text-[11px] text-[#f6efe3] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{section.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <button type="button" onClick={() => goToSection('p-context')} className="flex shrink-0 items-center gap-2 text-left text-[#2b2119] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c23b2c]">
          <span aria-hidden="true" className="grid h-[38px] w-[38px] place-items-center rounded-full border-[1.5px] border-current text-[20px] leading-none">↓</span>
          <span className="max-w-[5em] text-[11px] font-medium leading-tight opacity-75">Full case study</span>
        </button>
      </nav>
      <iframe
        ref={iframeRef}
        src="/work/squad-up-assets/story.html"
        title={project.hero.title}
        className="h-full w-full border-0"
      />
    </div>
  );
};

export default McDonaldsProjectDetail;
