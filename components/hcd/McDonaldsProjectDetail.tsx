import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from '../../types/Project';
import { ArrowLeft } from 'lucide-react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';

const sections = [
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
      <nav aria-label="Case study progress" className="fixed left-2 top-1/2 z-[101] hidden -translate-y-1/2 rounded-2xl border border-white/10 bg-black/45 px-2 py-4 shadow-xl backdrop-blur-md lg:block">
        <div className="absolute bottom-4 left-[1.2rem] top-4 w-px bg-white/15" aria-hidden="true" />
        <div className="absolute left-[1.2rem] top-4 w-px origin-top bg-amber-400/80" style={{ height: `${progress * 0.76}%` }} aria-hidden="true" />
        <ol className="relative flex flex-col gap-4">
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => goToSection(section.id)}
                aria-label={`Go to ${section.label}`}
                aria-current={activeSection === index ? 'step' : undefined}
                className={`flex min-h-6 items-center gap-2 rounded pr-1 text-left text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${activeSection === index ? 'text-amber-300' : index < activeSection ? 'text-white/75' : 'text-white/55 hover:text-white'}`}
              >
                <span className={`relative z-[1] h-2.5 w-2.5 shrink-0 rounded-full border border-[#15110b] ${activeSection === index ? 'bg-amber-400' : index < activeSection ? 'bg-amber-400/70' : 'bg-white/35'}`} />
                <span>{section.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-3 pl-3 text-[9px] font-mono text-amber-300/80">{progress}%</p>
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
