import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';
import CuttingMatSurface from '../ui/CuttingMatSurface';
import { HcdAccent, HcdPostIt, HcdProjectStory, HcdVisual, HcdVisualGroup } from './types';
import { PostItNote } from './PostItNote';

const THEMES: Record<HcdAccent, {
  accent: string;
  accentInk: string;
  accentWash: string;
}> = {
  care: {
    accent: '#76cbae',
    accentInk: '#0c3b30',
    accentWash: '#d8eee5',
  },
  mcdonalds: {
    accent: '#e7b824',
    accentInk: '#4c3107',
    accentWash: '#f4e4ad',
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

function isPortraitAspect(aspect?: string) {
  if (!aspect) return false;
  const [width, height] = aspect.split('/').map((part) => Number(part.trim()));
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width < height;
}

const ProjectVisual: React.FC<{
  visual: HcdVisual;
  isHero?: boolean;
  onOpen: (visual: HcdVisual, trigger: HTMLButtonElement) => void;
}> = ({ visual, isHero = false, onOpen }) => {
  const objectFit = visual.treatment === 'full' ? 'object-contain' : 'object-cover';
  const portrait = isPortraitAspect(visual.aspect);

  return (
    <figure
      data-hcd-visual-id={visual.id}
      className={`group min-w-0 ${portrait ? 'sm:mx-auto sm:w-full sm:max-w-[29rem]' : ''}`}
    >
      <div data-hcd-image-shell className="bg-transparent">
        <button
          type="button"
          data-hcd-visual-trigger={visual.id}
          onClick={(event) => onOpen(visual, event.currentTarget)}
          aria-label={`View ${visual.alt} larger`}
          className="relative block min-h-11 w-full overflow-hidden rounded-[1rem] bg-transparent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]"
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
          <span className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
            View larger
          </span>
        </button>
      </div>
      <figcaption className="px-1 pb-1 pt-3 text-sm leading-relaxed text-white/60">
        {visual.caption}
      </figcaption>
    </figure>
  );
};

const NotesCluster: React.FC<{ notes: HcdPostIt[]; className?: string }> = ({ notes, className = '' }) => (
  <div data-hcd-post-it-list className={`grid grid-cols-2 gap-3 lg:grid-cols-3 ${className}`}>
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
    <div className="mt-8 min-w-0 first:mt-0">
      {group.title ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white/55">
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
    childHistoryTags: ['hcd-visual'],
  });

  useEffect(() => {
    const restoreVisualFromHistory = () => {
      const state = window.history.state;
      if (state?.modal !== 'hcd-visual' || activeVisualRef.current) return;
      const visual = [
        story.hero,
        ...story.sections.flatMap((section) => section.groups.flatMap((group) => group.visuals)),
      ].find((candidate) => candidate.id === state.visualId);
      if (!visual) return;
      setIsLightboxFullSize(false);
      setActiveVisual(visual);
    };
    window.addEventListener('popstate', restoreVisualFromHistory);
    return () => window.removeEventListener('popstate', restoreVisualFromHistory);
  }, [story]);

  useEffect(() => {
    if (!activeVisual) return;

    const historyTag = 'hcd-visual';
    let consumed = false;
    let pushed = window.history.state?.modal === historyTag
      && window.history.state?.visualId === activeVisual.id;
    const handlePopState = () => {
      if (window.history.state?.modal === historyTag || consumed) return;
      consumed = true;
      closeLightbox();
    };
    window.addEventListener('popstate', handlePopState);
    const pushTimer = pushed ? 0 : window.setTimeout(() => {
      pushed = true;
      window.history.pushState(
        { modal: historyTag, visualId: activeVisual.id },
        '',
        projectPath(story.projectId),
      );
    }, 0);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.clearTimeout(pushTimer);
      if (pushed && !consumed && window.history.state?.modal === historyTag) {
        consumed = true;
        window.history.back();
      }
    };
  }, [activeVisual, closeLightbox, story.projectId]);

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
      className="hcd-case fixed inset-0 z-[100] overflow-hidden bg-[#050505] text-white focus:outline-none"
      style={cssVariables}
    >
      <style>{`
        .hcd-case { font-family: "Avenir Next", "Helvetica Neue", sans-serif; }
        .hcd-case ::selection { background: var(--hcd-accent); color: var(--hcd-accent-ink); }
        .hcd-post-it {
          border: 1px solid rgba(53,42,18,.09);
          background-image:
            radial-gradient(circle at 18% 14%, rgba(255,255,255,.2), transparent 34%),
            repeating-linear-gradient(7deg, rgba(74,55,18,.018) 0 1px, transparent 1px 5px);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .hcd-post-it::after {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 19%;
          background: linear-gradient(to top, rgba(73,55,15,.15), transparent);
          content: "";
          clip-path: polygon(0 34%, 79% 22%, 100% 0, 100% 100%, 0 100%);
          pointer-events: none;
        }
        .hcd-post-it:hover { box-shadow: 0 18px 34px rgba(0,0,0,.32); }
        .hcd-hero-title { font-size: clamp(3.5rem, 8vw, 7.5rem); }
        @media (min-width: 600px) and (max-width: 1023px) {
          .hcd-hero-title { font-size: clamp(2.5rem, 6.5vw, 4rem); }
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
          className="relative flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/80 p-0 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] sm:w-auto sm:px-4"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.25} />
          <span className="hidden sm:inline">Close</span>
        </button>,
        closePortalTarget,
      )}

      <div data-hcd-scroll-container className="h-full overflow-y-auto overflow-x-hidden overscroll-contain bg-[#050505]">
        <div className="mx-auto max-w-[1480px] px-3 pb-10 pt-20 sm:px-6 sm:pb-14 sm:pt-24 lg:px-10">
          <header data-hcd-mat-board className="min-h-[44rem] sm:min-h-[48rem]">
            <CuttingMatSurface active={false} density="comfortable">
              <div className="grid min-h-[44rem] items-center gap-7 p-5 pt-14 sm:min-h-[48rem] sm:p-9 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:p-14">
                <div data-hcd-copy-cluster className="min-w-0">
                  <div className="rounded-2xl border border-white/[0.16] bg-[#04110f]/[0.9] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-lg sm:p-7">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">{story.label}</p>
                    <h2 id={titleId} className="hcd-hero-title mt-4 font-semibold leading-[0.84] tracking-[-0.075em] text-white">
                      {story.title}
                    </h2>
                    <p className="mt-6 max-w-2xl text-lg leading-snug tracking-[-0.025em] text-white/85 md:text-xl">
                      {story.proposition}
                    </p>
                    <div className="mt-6 border-t border-white/12 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Role</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">{story.role}</p>
                    </div>
                    {story.metrics?.length ? (
                      <dl aria-label="Project measures" className="mt-5 grid grid-cols-3 gap-2">
                        {story.metrics.map((metric) => (
                          <div key={`${metric.value}-${metric.label}`} className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3">
                            <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/50">{metric.label}</dt>
                            <dd className="mt-1 text-lg font-semibold tracking-[-0.04em] text-white">{metric.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                  <NotesCluster notes={story.heroNotes} className="mt-6" />
                </div>
                <div className="min-w-0 lg:mx-auto lg:w-full lg:max-w-[620px]">
                  <ProjectVisual visual={story.hero} isHero onOpen={openVisual} />
                </div>
              </div>
            </CuttingMatSurface>
          </header>

          <div className="space-y-10 py-10 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">
            {story.sections.map((section, sectionIndex) => (
              <section
                key={section.key}
                data-hcd-section={section.key}
                data-hcd-mat-board
                className="min-h-[35rem]"
              >
                <CuttingMatSurface active={false} density="comfortable">
                  <div className={`grid min-h-[35rem] items-center gap-7 p-5 pt-14 sm:p-9 sm:pt-16 lg:gap-12 lg:p-14 ${section.groups.length ? 'lg:grid-cols-[1.08fr_0.92fr]' : 'lg:grid-cols-1'}`}>
                    <div data-hcd-copy-cluster className={`min-w-0 ${section.groups.length ? '' : 'max-w-5xl'}`}>
                      <div className="max-w-2xl rounded-2xl border border-white/[0.16] bg-[#04110f]/[0.9] p-5 shadow-[0_20px_58px_rgba(0,0,0,0.34)] backdrop-blur-lg sm:p-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{sectionIndex + 1} of 5</p>
                        <h3 className="mt-3 text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-white">
                          {section.title}
                        </h3>
                        <p className="sr-only">{section.intro}</p>
                      </div>
                      <NotesCluster notes={section.storyNotes} className="mt-6" />
                      {section.notes?.length ? (
                        <div className="mt-5 border-t border-[#e5e55a]/25 pt-5">
                          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#eff18a]/70">Key ideas</p>
                          <NotesCluster notes={section.notes} />
                        </div>
                      ) : null}
                      {section.key === 'reflection' ? (
                        <p className="mt-6 max-w-2xl rounded-xl border border-white/12 bg-[#04110f]/80 px-4 py-3 text-xs leading-relaxed text-white/60 backdrop-blur-md">
                          {story.closingContext}
                        </p>
                      ) : null}
                    </div>

                    {section.groups.length ? (
                      <div className="min-w-0">
                        {section.groups.map((group) => (
                          <VisualGroup key={group.id} group={group} onOpen={openVisual} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </CuttingMatSurface>
              </section>
            ))}
          </div>
        </div>
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
                className="flex h-11 min-w-11 items-center gap-2 rounded-full border border-white/25 bg-[#08130f] px-3 text-xs font-semibold text-white transition hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] sm:px-4"
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
                className="flex h-11 min-w-11 shrink-0 items-center gap-2 rounded-full bg-[#f6f0e2] px-3 text-sm font-semibold text-[#17231d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06100d] sm:px-4"
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
