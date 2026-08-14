import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';
import { HcdAccent, HcdPostIt, HcdProjectStory, HcdVisual, HcdVisualGroup } from './types';
import { HcdWorkshopSurface } from './HcdWorkshopSurface';
import { PostItNote } from './PostItNote';

const THEMES: Record<HcdAccent, {
  accent: string;
  accentInk: string;
  accentWash: string;
  paper: string;
  rule: string;
}> = {
  care: {
    accent: '#76cbae',
    accentInk: '#0c3b30',
    accentWash: '#d8eee5',
    paper: '#f4eedf',
    rule: 'rgba(20, 73, 59, 0.18)',
  },
  mcdonalds: {
    accent: '#e7b824',
    accentInk: '#4c3107',
    accentWash: '#f4e4ad',
    paper: '#f5eddb',
    rule: 'rgba(112, 69, 5, 0.17)',
  },
};

const groupGrid: Record<HcdVisualGroup['layout'], string> = {
  single: 'grid-cols-1',
  pair: 'grid-cols-1 lg:grid-cols-2',
  sequence: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  wide: 'grid-cols-1',
};

const LIGHTBOX_FOCUSABLE = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  return prefersReducedMotion;
}

const ProjectVisual: React.FC<{
  visual: HcdVisual;
  isHero?: boolean;
  onOpen: (visual: HcdVisual, trigger: HTMLButtonElement) => void;
}> = ({ visual, isHero = false, onOpen }) => {
  const objectFit = visual.treatment === 'full' ? 'object-contain' : 'object-cover';

  return (
    <figure data-hcd-visual-id={visual.id} className="group min-w-0">
      <div className="hcd-project-print rounded-[0.9rem] bg-[#fffaf0] p-2 shadow-[0_15px_32px_rgba(39,31,17,0.16)] sm:p-3">
        <button
          type="button"
          data-hcd-visual-trigger={visual.id}
          onClick={(event) => onOpen(visual, event.currentTarget)}
          aria-label={`View ${visual.alt} larger`}
          className="relative block min-h-11 w-full overflow-hidden rounded-[0.65rem] bg-[#18211d] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent-ink)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fffaf0]"
          style={{ aspectRatio: visual.aspect ?? '16 / 10' }}
        >
          <img
            src={visual.src}
            alt={visual.alt}
            loading={isHero ? 'eager' : 'lazy'}
            decoding="async"
            sizes={isHero ? '(min-width: 1024px) 48vw, 100vw' : '(min-width: 1280px) 36vw, (min-width: 768px) 48vw, 100vw'}
            className={`h-full w-full ${objectFit} transition-transform duration-300 group-hover:scale-[1.008] motion-reduce:transition-none motion-reduce:transform-none`}
            style={{ objectPosition: visual.objectPosition ?? 'center' }}
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-[#f6f0e2]/95 px-4 py-2 text-xs font-semibold text-[#17231d] shadow-lg">
            View larger
          </span>
        </button>
      </div>
      <figcaption className="px-1 pb-1 pt-4 text-sm leading-relaxed text-[#526158]">
        {visual.caption}
      </figcaption>
    </figure>
  );
};

const NotesCluster: React.FC<{ notes: HcdPostIt[] }> = ({ notes }) => (
  <div data-hcd-post-it-list className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {notes.map((note) => <PostItNote key={note.id} note={note} />)}
  </div>
);

const VisualGroup: React.FC<{
  group: HcdVisualGroup;
  onOpen: (visual: HcdVisual, trigger: HTMLButtonElement) => void;
}> = ({ group, onOpen }) => {
  const layoutClass = group.layout === 'sequence' && group.visuals.length === 4
    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
    : groupGrid[group.layout];

  return (
    <div className="mt-10 min-w-0 first:mt-0">
      {group.title ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--hcd-accent-ink)]/75">
          {group.title}
        </p>
      ) : null}
      <div className={`grid min-w-0 gap-x-5 gap-y-8 ${layoutClass}`}>
        {group.visuals.map((visual) => (
          <ProjectVisual key={visual.id} visual={visual} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
};

export const HcdCaseStudyShell: React.FC<{
  story: HcdProjectStory;
  onClose: () => void;
}> = ({ story, onClose }) => {
  const [activeVisual, setActiveVisual] = useState<HcdVisual | null>(null);
  const [isLightboxFullSize, setIsLightboxFullSize] = useState(false);
  const activeVisualRef = useRef<HcdVisual | null>(null);
  const visualTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const lightboxViewportRef = useRef<HTMLDivElement | null>(null);
  const [closePortalTarget, setClosePortalTarget] = useState<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const theme = THEMES[story.accent];
  const titleId = `hcd-${story.projectId}-title`;
  activeVisualRef.current = activeVisual;

  const closeLightbox = useCallback(() => {
    setIsLightboxFullSize(false);
    setActiveVisual(null);
    window.requestAnimationFrame(() => visualTriggerRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const handleLightboxKeyDown = (event: KeyboardEvent) => {
      if (!activeVisualRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeLightbox();
      } else if (event.key === 'Tab') {
        const focusable = [...(lightboxRef.current?.querySelectorAll<HTMLElement>(LIGHTBOX_FOCUSABLE) ?? [])]
          .filter((element) => element.offsetParent !== null || element === document.activeElement);
        if (!focusable.length) return;
        const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
        const nextIndex = event.shiftKey
          ? (activeIndex <= 0 ? focusable.length - 1 : activeIndex - 1)
          : (activeIndex < 0 || activeIndex === focusable.length - 1 ? 0 : activeIndex + 1);
        event.preventDefault();
        event.stopImmediatePropagation();
        focusable[nextIndex].focus();
      }
    };
    window.addEventListener('keydown', handleLightboxKeyDown, true);
    return () => window.removeEventListener('keydown', handleLightboxKeyDown, true);
  }, [closeLightbox]);

  const dialogRef = useDialogA11y(onClose, {
    historyTag: 'project',
    historyPath: projectPath(story.projectId),
  });

  useEffect(() => {
    if (!activeVisual) return;
    setIsLightboxFullSize(false);
    window.requestAnimationFrame(() => {
      lightboxViewportRef.current?.scrollTo({ top: 0, left: 0 });
      lightboxCloseRef.current?.focus({ preventScroll: true });
    });
  }, [activeVisual]);

  useEffect(() => {
    if (!activeVisual) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [activeVisual]);

  const openVisual = useCallback((visual: HcdVisual, trigger: HTMLButtonElement) => {
    visualTriggerRef.current = trigger;
    setIsLightboxFullSize(false);
    setActiveVisual(visual);
  }, []);

  const toggleLightboxSize = () => {
    setIsLightboxFullSize((current) => !current);
    window.requestAnimationFrame(() => lightboxViewportRef.current?.scrollTo({ top: 0, left: 0 }));
  };

  const cssVariables = {
    '--hcd-accent': theme.accent,
    '--hcd-accent-ink': theme.accentInk,
    '--hcd-accent-wash': theme.accentWash,
    '--hcd-paper': theme.paper,
    '--hcd-rule': theme.rule,
  } as React.CSSProperties;

  return (
    <motion.div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
      className="hcd-case fixed inset-0 z-[100] overflow-hidden bg-[#01241f] text-[#18231e] focus:outline-none"
      style={cssVariables}
    >
      <style>{`
        .hcd-case { font-family: "Avenir Next", "Helvetica Neue", sans-serif; }
        .hcd-case ::selection { background: var(--hcd-accent); color: var(--hcd-accent-ink); }
        .hcd-workshop-surface {
          background: radial-gradient(circle at 34% 12%, rgba(255,255,212,.12), transparent 36%),
                      linear-gradient(145deg, #064a3c, #00332a 46%, #01241f);
          box-shadow: inset 0 -36px 70px rgba(0,0,0,.34), inset 0 1px 0 rgba(245,255,178,.18);
        }
        .hcd-mat-grid {
          opacity: .58;
          background-image:
            linear-gradient(rgba(229,229,90,.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(229,229,90,.15) 1px, transparent 1px),
            linear-gradient(rgba(229,229,90,.28) 1px, transparent 1px),
            linear-gradient(90deg, rgba(229,229,90,.28) 1px, transparent 1px);
          background-size: 22px 22px, 22px 22px, 110px 110px, 110px 110px;
        }
        .hcd-mat-frame {
          border: 1px solid rgba(229,229,90,.32);
          box-shadow: inset 0 0 0 16px rgba(0,0,0,.08);
        }
        .hcd-mat-frame::before,
        .hcd-mat-frame::after {
          position: absolute;
          content: "";
          opacity: .62;
        }
        .hcd-mat-frame::before {
          top: 9px;
          right: 22px;
          left: 22px;
          height: 8px;
          background: repeating-linear-gradient(90deg, rgba(237,241,116,.62) 0 1px, transparent 1px 11px);
        }
        .hcd-mat-frame::after {
          top: 22px;
          bottom: 22px;
          left: 9px;
          width: 8px;
          background: repeating-linear-gradient(180deg, rgba(237,241,116,.62) 0 1px, transparent 1px 11px);
        }
        .hcd-mat-label { color: rgba(237,241,116,.58); }
        .hcd-paper-sheet {
          isolation: isolate;
          background-color: var(--hcd-paper);
          background-image:
            radial-gradient(circle at 16% 12%, rgba(255,255,255,.68), transparent 31%),
            repeating-linear-gradient(8deg, rgba(55,42,24,.018) 0 1px, transparent 1px 5px);
          border: 1px solid rgba(87,68,39,.16);
        }
        .hcd-paper-sheet::before {
          position: absolute;
          inset: 0;
          z-index: -1;
          border-radius: inherit;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.72), inset 0 -1px 0 rgba(71,53,25,.08);
          content: "";
          pointer-events: none;
        }
        .hcd-project-print { transform: rotate(-.12deg); }
        .hcd-post-it {
          border: 1px solid rgba(53,42,18,.09);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .hcd-post-it::after {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 22%;
          background: linear-gradient(to top, rgba(73,55,15,.12), transparent);
          content: "";
          clip-path: polygon(0 34%, 79% 22%, 100% 0, 100% 100%, 0 100%);
          pointer-events: none;
        }
        .hcd-post-it:hover { box-shadow: 0 16px 30px rgba(24,20,10,.24); }
        @media (min-width: 768px) {
          .hcd-paper-drift-1 { transform: rotate(.32deg) translateX(6px); }
          .hcd-paper-drift-2 { transform: rotate(-.28deg) translateX(-5px); }
          .hcd-paper-drift-3 { transform: rotate(.2deg) translateX(4px); }
        }
        @media (max-width: 639px) {
          .hcd-post-it { transform: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hcd-case *, .hcd-case *::before, .hcd-case *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .hcd-post-it { transform: none !important; }
        }
      `}</style>

      <div ref={setClosePortalTarget} className="fixed right-3 top-3 z-[9999] md:right-6 md:top-6" />

      {!activeVisual && closePortalTarget && ReactDOM.createPortal(
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${story.title} case study`}
          className="relative flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-black/15 bg-[#f6f0e2] p-0 text-sm font-semibold text-[#17231d] shadow-2xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6f0e2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#01352c] sm:w-auto sm:px-4"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.25} />
          <span className="hidden sm:inline">Close</span>
        </button>,
        closePortalTarget,
      )}

      <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain">
        {/* HcdWorkshopSurface supplies the data-hcd-workshop-surface DOM contract. */}
        <HcdWorkshopSurface>
          <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-6 sm:py-6 md:px-10 md:py-10">
            <header className="hcd-paper-sheet relative rounded-[1.25rem] px-5 pb-6 pt-16 shadow-[0_26px_68px_rgba(0,0,0,0.32)] sm:px-9 sm:pb-9 sm:pt-20 md:px-12 lg:grid lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:px-14 lg:py-14">
              <div className="flex min-w-0 flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--hcd-accent-ink)]/75">{story.label}</p>
                <h2 id={titleId} className="mt-5 text-[clamp(3rem,8vw,7.4rem)] font-semibold leading-[0.86] tracking-[-0.07em] text-[#14231d]">
                  {story.title}
                </h2>
                <p className="mt-7 max-w-2xl text-xl leading-snug tracking-[-0.025em] text-[#26362f] md:text-2xl">
                  {story.proposition}
                </p>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#536158] md:text-base">{story.context}</p>
                <div className="mt-8 border-t border-[var(--hcd-rule)] pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hcd-accent-ink)]/65">Role</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#3f5148]">{story.role}</p>
                </div>
                {story.metrics?.length ? (
                  <dl aria-label="Project measures" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {story.metrics.map((metric) => (
                      <div key={`${metric.value}-${metric.label}`} className="rounded-[0.8rem] bg-[var(--hcd-accent-wash)] px-4 py-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hcd-accent-ink)]/70">{metric.label}</dt>
                        <dd className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--hcd-accent-ink)]">{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
              <div className="mt-9 min-w-0 lg:mt-0 lg:self-center">
                <ProjectVisual visual={story.hero} isHero onOpen={openVisual} />
              </div>
            </header>

            {story.sections.map((section, sectionIndex) => (
              <section
                key={section.key}
                data-hcd-section={section.key}
                className={`hcd-paper-sheet hcd-paper-drift-${(sectionIndex % 3) + 1} relative my-5 rounded-[1.25rem] px-5 py-10 text-[#18231e] shadow-[0_22px_58px_rgba(0,0,0,0.28)] sm:px-9 md:my-8 md:px-12 md:py-16`}
              >
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#496057]">{sectionIndex + 1} of 5</p>
                  <h3 className="mt-4 text-[clamp(2.25rem,5vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-[#14231d]">
                    {section.title}
                  </h3>
                  <p className="mt-6 text-base leading-relaxed text-[#4d5d54] md:text-lg">{section.intro}</p>
                </div>

                {section.notes?.length ? <NotesCluster notes={section.notes} /> : null}

                {section.groups.length ? (
                  <div className="mt-11 border-t border-[var(--hcd-rule)] pt-8">
                    {section.groups.map((group) => (
                      <VisualGroup key={group.id} group={group} onOpen={openVisual} />
                    ))}
                  </div>
                ) : null}
              </section>
            ))}

            <footer className="px-5 pb-16 pt-4 text-sm leading-relaxed text-[#d8e6d7]/75 sm:px-9 md:px-12 md:pb-20">
              <p className="max-w-3xl border-l-2 border-[#e5e55a]/40 pl-4">{story.closingContext}</p>
            </footer>
          </div>
        </HcdWorkshopSurface>
      </div>

      {activeVisual && ReactDOM.createPortal(
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Full view: ${activeVisual.alt}`}
          className="hcd-case fixed inset-0 z-[20000] pointer-events-auto flex flex-col overflow-hidden overscroll-contain bg-[#06100d]/[0.97] p-3 sm:p-5"
          style={cssVariables}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 rounded-t-[1rem] border-b border-white/15 bg-[#13251f] px-3 py-3 sm:px-4">
            <p aria-live="polite" className="min-w-0 truncate text-xs font-semibold text-white/70">
              {isLightboxFullSize ? 'Full size · scroll in any direction' : 'Fit to screen'}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleLightboxSize}
                aria-pressed={isLightboxFullSize}
                aria-label={isLightboxFullSize ? 'Fit image to screen' : 'View image at full size'}
                className="flex h-11 items-center gap-2 rounded-full border border-white/25 bg-[#08130f] px-3 text-xs font-semibold text-white transition hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] sm:px-4"
              >
                {isLightboxFullSize
                  ? <Minimize2 aria-hidden="true" size={17} />
                  : <Maximize2 aria-hidden="true" size={17} />}
                <span className="hidden sm:inline">{isLightboxFullSize ? 'Fit' : 'Full size'}</span>
              </button>
              <button
                ref={lightboxCloseRef}
                type="button"
                onClick={closeLightbox}
                aria-label="Close full view"
                className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#f6f0e2] px-3 text-sm font-semibold text-[#17231d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06100d] sm:px-4"
              >
                <X aria-hidden="true" size={18} /> <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
          <div
            ref={lightboxViewportRef}
            tabIndex={0}
            role="region"
            aria-label={`${activeVisual.alt} image — ${isLightboxFullSize ? 'full size; scroll in any direction' : 'fit to screen'}`}
            className={`min-h-0 flex-1 touch-pan-x touch-pan-y overflow-auto bg-[#0c1713] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--hcd-accent)] sm:p-5 ${isLightboxFullSize ? '' : 'flex items-center justify-center'}`}
          >
            <img
              src={activeVisual.fullSrc}
              alt={activeVisual.alt}
              draggable={false}
              className={isLightboxFullSize ? 'mx-auto block h-auto max-w-none select-none' : 'mx-auto block h-auto max-h-full max-w-full object-contain'}
              sizes="100vw"
            />
          </div>
          <div className="shrink-0 rounded-b-[1rem] border-t border-white/15 bg-[#13251f] px-4 py-3 text-sm text-white/70">
            <p className="max-w-4xl leading-relaxed">{activeVisual.caption}</p>
          </div>
        </div>,
        document.body,
      )}
    </motion.div>
  );
};

export default HcdCaseStudyShell;
