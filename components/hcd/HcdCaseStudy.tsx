import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, X } from 'lucide-react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';
import { HcdAccent, HcdEvidence, HcdProjectStory } from './types';

const THEMES: Record<HcdAccent, {
  accent: string;
  accentSoft: string;
  accentInk: string;
  paper: string;
  rule: string;
}> = {
  care: {
    accent: '#9de5c7',
    accentSoft: '#17352c',
    accentInk: '#07130f',
    paper: '#e9e4d8',
    rule: 'rgba(157, 229, 199, 0.24)',
  },
  mcdonalds: {
    accent: '#ffc72c',
    accentSoft: '#3a2810',
    accentInk: '#1b1100',
    paper: '#f4ead6',
    rule: 'rgba(255, 199, 44, 0.24)',
  },
};

const chapterGrid: Record<string, string> = {
  single: 'grid-cols-1',
  pair: 'grid-cols-1 lg:grid-cols-2',
  sequence: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  wide: 'grid-cols-1',
};

const LIGHTBOX_FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

const EvidenceFigure: React.FC<{
  evidence: HcdEvidence;
  isHero?: boolean;
  onOpen: (evidence: HcdEvidence, trigger: HTMLButtonElement) => void;
}> = ({ evidence, isHero = false, onOpen }) => {
  const objectFit = evidence.treatment === 'full' ? 'object-contain' : 'object-cover';

  return (
    <figure data-evidence-id={evidence.id} className="group min-w-0 border-t border-[var(--hcd-rule)] pt-3">
      <button
        type="button"
        data-evidence-trigger={evidence.id}
        onClick={(event) => onOpen(evidence, event.currentTarget)}
        aria-label={`Open full evidence: ${evidence.alt}`}
        className="relative block w-full overflow-hidden bg-[#11120f] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#090a08]"
        style={{ aspectRatio: evidence.aspect ?? '16 / 10' }}
      >
        <img
          src={evidence.src}
          alt={evidence.alt}
          loading={isHero ? 'eager' : 'lazy'}
          decoding="async"
          sizes={isHero ? '(min-width: 1200px) 58vw, 100vw' : '(min-width: 1280px) 31vw, (min-width: 768px) 48vw, 100vw'}
          className={`h-full w-full ${objectFit} transition-transform duration-500 group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:transform-none`}
          style={{ objectPosition: evidence.objectPosition ?? 'center' }}
        />
        <span className="absolute bottom-3 right-3 border border-white/20 bg-black/80 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
          Open full evidence
        </span>
      </button>
      <figcaption className="grid gap-3 py-4 text-sm leading-relaxed text-white/65 sm:grid-cols-[1fr_auto] sm:items-start">
        <span>
          <span className="block">{evidence.caption}</span>
          <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-white/60">{evidence.sourceLabel}</span>
        </span>
        <a
          href={evidence.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--hcd-accent)] underline decoration-transparent underline-offset-4 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)]"
        >
          View source in Figma
          <ArrowUpRight aria-hidden="true" size={13} />
        </a>
      </figcaption>
    </figure>
  );
};

export const HcdCaseStudyShell: React.FC<{
  story: HcdProjectStory;
  onClose: () => void;
}> = ({ story, onClose }) => {
  const [activeEvidence, setActiveEvidence] = useState<HcdEvidence | null>(null);
  const activeEvidenceRef = useRef<HcdEvidence | null>(null);
  const evidenceTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [closePortalTarget, setClosePortalTarget] = useState<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const theme = THEMES[story.accent];
  const titleId = `hcd-${story.projectId}-title`;
  activeEvidenceRef.current = activeEvidence;

  const closeLightbox = useCallback(() => {
    setActiveEvidence(null);
    window.requestAnimationFrame(() => evidenceTriggerRef.current?.focus({ preventScroll: true }));
  }, []);

  // This capture listener is registered before useDialogA11y's listener. When
  // the internal lightbox is open it consumes Escape before the parent dialog
  // can interpret the same key as a request to close the whole case study.
  useEffect(() => {
    const handleLightboxKeyDown = (event: KeyboardEvent) => {
      if (!activeEvidenceRef.current) return;
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
    if (activeEvidence) lightboxCloseRef.current?.focus({ preventScroll: true });
  }, [activeEvidence]);

  const openEvidence = useCallback((evidence: HcdEvidence, trigger: HTMLButtonElement) => {
    evidenceTriggerRef.current = trigger;
    setActiveEvidence(evidence);
  }, []);

  const scrollToStory = () => {
    scrollRef.current?.querySelector<HTMLElement>('[data-hcd-chapter]')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const scrollToChapter = (chapterKey: string) => {
    scrollRef.current?.querySelector<HTMLElement>(`[data-hcd-chapter="${chapterKey}"]`)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const cssVariables = {
    '--hcd-accent': theme.accent,
    '--hcd-accent-soft': theme.accentSoft,
    '--hcd-accent-ink': theme.accentInk,
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
      className="hcd-case fixed inset-0 z-[100] overflow-hidden bg-[#090a08] text-white focus:outline-none"
      style={cssVariables}
    >
      <style>{`
        .hcd-case { font-family: "Avenir Next", "Helvetica Neue", sans-serif; }
        .hcd-case ::selection { background: var(--hcd-accent); color: var(--hcd-accent-ink); }
        .hcd-case .hcd-paper-grid {
          background-image: linear-gradient(var(--hcd-rule) 1px, transparent 1px), linear-gradient(90deg, var(--hcd-rule) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        @media (prefers-reduced-motion: reduce) {
          .hcd-case *, .hcd-case *::before, .hcd-case *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div ref={setClosePortalTarget} className="contents" />

      {!activeEvidence && closePortalTarget && ReactDOM.createPortal(
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${story.title} case study`}
          className="fixed right-3 top-3 z-[9999] flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-black/15 bg-[#f3efe5] p-0 text-sm font-semibold text-black shadow-2xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:w-auto sm:px-4 md:right-6 md:top-6"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.25} />
          <span className="hidden sm:inline">Close</span>
        </button>,
        closePortalTarget,
      )}

      <div ref={scrollRef} className="h-full overflow-y-auto overflow-x-hidden overscroll-contain">
        <header className="relative min-h-[100svh] overflow-hidden border-b border-[var(--hcd-rule)]">
          <div className="hcd-paper-grid pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[var(--hcd-accent)] opacity-10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid min-h-[100svh] max-w-[1600px] lg:grid-cols-[0.88fr_1.12fr]">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.05 }}
              className="flex flex-col justify-between px-5 pb-10 pt-20 sm:px-8 md:px-12 md:pt-24 lg:px-16 lg:py-20"
            >
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--hcd-accent)]">{story.label}</p>
                <h2 id={titleId} className="mt-6 text-[clamp(3.3rem,8vw,8.5rem)] font-semibold leading-[0.84] tracking-[-0.075em] text-white">
                  {story.title}
                </h2>
                <p className="mt-8 max-w-2xl text-xl leading-snug tracking-[-0.02em] text-[var(--hcd-paper)] md:text-2xl">
                  {story.proposition}
                </p>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">{story.context}</p>
              </div>

              <div className="mt-12 grid gap-5 border-t border-[var(--hcd-rule)] pt-6 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">Role</p>
                  <p className="mt-2 leading-relaxed text-white/75">{story.role}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">Boundary</p>
                  <p className="mt-2 leading-relaxed text-white/75">{story.status}</p>
                </div>
              </div>
            </motion.div>

            <div className="flex min-w-0 items-center border-t border-[var(--hcd-rule)] px-5 pb-10 pt-6 sm:px-8 md:px-12 lg:border-l lg:border-t-0 lg:px-14 lg:py-20">
              <EvidenceFigure evidence={story.hero} isHero onOpen={openEvidence} />
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToStory}
            className="absolute bottom-4 left-5 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] sm:left-8 lg:left-16"
          >
            Read the evidence <ArrowDown aria-hidden="true" size={14} />
          </button>
        </header>

        <div className="border-b border-[var(--hcd-rule)] bg-[#0d0e0b]">
          <nav aria-label={`${story.title} chapters`} className="mx-auto flex max-w-[1600px] gap-5 overflow-x-auto px-5 py-4 sm:px-8 md:px-12 lg:px-16">
            {story.chapters.map((chapter) => (
              <button
                type="button"
                key={chapter.key}
                onClick={() => scrollToChapter(chapter.key)}
                className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/55 underline decoration-transparent underline-offset-4 hover:text-[var(--hcd-accent)] hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)]"
              >
                {chapter.index} · {chapter.eyebrow}
              </button>
            ))}
          </nav>
        </div>

        <div className="mx-auto max-w-[1600px]">
          {story.metrics && story.metrics.length > 0 && (
            <section aria-label="Project measures" className="grid border-b border-[var(--hcd-rule)] sm:grid-cols-2 lg:grid-cols-4">
              {story.metrics.map((metric) => (
                <div key={`${metric.value}-${metric.label}`} className="border-b border-[var(--hcd-rule)] px-5 py-8 last:border-b-0 sm:border-r sm:px-8 lg:px-12">
                  <p className="text-3xl font-semibold tracking-[-0.05em] text-[var(--hcd-paper)]">{metric.value}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">{metric.label}</p>
                </div>
              ))}
            </section>
          )}

          {story.chapters.map((chapter) => (
            <section
              key={chapter.key}
              id={`${story.projectId}-${chapter.key}`}
              data-hcd-chapter={chapter.key}
              className="scroll-mt-8 border-b border-[var(--hcd-rule)] px-5 py-16 sm:px-8 md:px-12 md:py-24 lg:px-16"
            >
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
                <div className="lg:sticky lg:top-8 lg:self-start">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--hcd-accent)]">
                    {chapter.index} / {chapter.eyebrow}
                  </p>
                  <h3 className="mt-5 text-[clamp(2.25rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-white">
                    {chapter.title}
                  </h3>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">{chapter.intro}</p>
                  {chapter.takeaways && chapter.takeaways.length > 0 && (
                    <ul className="mt-8 space-y-3 border-t border-[var(--hcd-rule)] pt-5 text-sm leading-relaxed text-white/70">
                      {chapter.takeaways.map((takeaway) => (
                        <li key={takeaway} className="grid grid-cols-[auto_1fr] gap-3">
                          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 bg-[var(--hcd-accent)]" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {chapter.evidence.length > 0 && (
                  <div className={`grid min-w-0 gap-x-6 gap-y-10 ${chapterGrid[chapter.layout]}`}>
                    {chapter.evidence.map((evidence) => (
                      <EvidenceFigure key={evidence.id} evidence={evidence} onOpen={openEvidence} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}

          <footer className="grid bg-[var(--hcd-paper)] text-[var(--hcd-accent-ink)] lg:grid-cols-3">
            {[
              ['Outcome', story.outcome],
              ['Limitation', story.limitation],
              ['Reflection', story.reflection],
            ].map(([label, copy]) => (
              <section key={label} className="border-b border-black/15 px-5 py-10 last:border-b-0 sm:px-8 md:px-12 lg:border-b-0 lg:border-r lg:px-10 lg:py-14 lg:last:border-r-0">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] opacity-55">{label}</p>
                <p className="mt-5 text-lg leading-relaxed tracking-[-0.02em]">{copy}</p>
              </section>
            ))}
          </footer>
        </div>
      </div>

      {activeEvidence && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Full evidence: ${activeEvidence.alt}`}
          className="absolute inset-0 z-[10000] flex flex-col bg-black/95 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/15 pb-3">
            <p className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">{activeEvidence.sourceLabel}</p>
            <button
              ref={lightboxCloseRef}
              type="button"
              onClick={closeLightbox}
              className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <X aria-hidden="true" size={18} /> Close evidence
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto py-4">
            <img
              src={activeEvidence.fullSrc}
              alt={activeEvidence.alt}
              className="mx-auto h-auto max-h-full max-w-full object-contain"
              sizes="100vw"
            />
          </div>
          <div className="flex shrink-0 flex-col gap-3 border-t border-white/15 pt-3 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-4xl leading-relaxed">{activeEvidence.caption}</p>
            <a
              href={activeEvidence.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--hcd-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hcd-accent)]"
            >
              View source in Figma <ArrowUpRight aria-hidden="true" size={13} />
            </a>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HcdCaseStudyShell;
