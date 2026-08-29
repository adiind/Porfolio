import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import ProjectWheelFallback from './ProjectWheelFallback';
import type { ProjectWheelItem, ProjectWheelRenderer } from './projectWheelTypes';

interface Props {
  items: ProjectWheelItem[];
  active: boolean;
  onOpen: (item: ProjectWheelItem) => void;
}

const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;
const COMPACT_MAX_WIDTH = 1023;

const ProjectWheel: React.FC<Props> = ({ items, active, onOpen }) => {
  const stageRef = useRef<HTMLElement>(null);
  const rendererRef = useRef<ProjectWheelRenderer | null>(null);
  const instructionId = useId();
  const prefersReducedMotion = useReducedMotion() === true;
  const [isCompact, setIsCompact] = useState(() => (
    typeof window !== 'undefined' && window.innerWidth <= COMPACT_MAX_WIDTH
  ));
  const webglRequested = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).has('projectWheelWebgl');
  const [frontIndex, setFrontIndex] = useState(0);
  const [ready, setReady] = useState(prefersReducedMotion);
  const [failed, setFailed] = useState(false);
  const frontProject = items[frontIndex] ?? items[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${COMPACT_MAX_WIDTH}px)`);
    const updateCompactState = () => setIsCompact(mediaQuery.matches);
    updateCompactState();
    mediaQuery.addEventListener?.('change', updateCompactState);
    return () => mediaQuery.removeEventListener?.('change', updateCompactState);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !items.length || prefersReducedMotion || isCompact || !webglRequested) return;
    const forceFallback = new URLSearchParams(window.location.search).has('projectWheelFallback');
    if (forceFallback) {
      setFailed(true);
      return;
    }

    setFailed(false);
    setReady(false);
    let cancelled = false;
    let renderer: ProjectWheelRenderer | null = null;
    void import('./createProjectWheelRenderer').then(({ createProjectWheelRenderer }) => {
      if (cancelled) return;
      try {
        renderer = createProjectWheelRenderer({
          container: stage,
          items,
          reducedMotion: false,
          onFrontIndexChange: setFrontIndex,
          onActivate: (index) => onOpen(items[index]),
          onReady: () => setReady(true),
          onFailure: (error) => {
            console.error('[project-wheel]', error);
            setFailed(true);
          },
        });
        renderer.setActive(active);
        rendererRef.current = renderer;
      } catch (error) {
        console.error('[project-wheel]', error);
        setFailed(true);
      }
    }).catch((error) => {
      if (!cancelled) {
          console.error('[project-wheel]', error);
          setFailed(true);
      }
    });

    return () => {
      cancelled = true;
      renderer?.dispose();
      if (rendererRef.current === renderer) rendererRef.current = null;
    };
  }, [items, onOpen, prefersReducedMotion, isCompact, webglRequested]);

  useEffect(() => {
    rendererRef.current?.setActive(active);
  }, [active]);

  if (!items.length || !frontProject) return null;

  const select = (index: number) => {
    const nextIndex = wrapIndex(index, items.length);
    setFrontIndex(nextIndex);
    rendererRef.current?.focusIndex(nextIndex, prefersReducedMotion);
  };

  const step = (delta: number) => {
    const nextIndex = wrapIndex(frontIndex + delta, items.length);
    setFrontIndex(nextIndex);
    rendererRef.current?.step(delta, prefersReducedMotion);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(frontProject);
    }
  };

  // The HTML treatment is the stable public startup. Keep WebGL available for
  // focused renderer work without making the first impression depend on it.
  const showFallback = !webglRequested || isCompact || prefersReducedMotion || failed;

  return (
    <section
      ref={stageRef}
      data-project-wheel
      data-project-wheel-ready={ready ? 'true' : 'false'}
      data-project-wheel-mode={showFallback ? 'fallback' : 'webgl'}
      aria-label="Selected project carousel"
      aria-describedby={instructionId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="pointer-events-auto absolute inset-y-0 right-0 z-[40] w-[64%] min-w-[300px] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E5E55A] sm:w-[58%] lg:right-[70px] lg:w-[54%] xl:right-[96px]"
    >
      <p id={instructionId} className="sr-only">
        Rotate projects with the mouse wheel, trackpad, drag, or swipe. Use arrow keys to step between projects and Enter to open the current project.
      </p>

      {showFallback && (
        <ProjectWheelFallback
          items={items}
          activeIndex={frontIndex}
          onSelect={select}
          onOpen={(index) => onOpen(items[index])}
        />
      )}

      {!ready && !showFallback && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/65 backdrop-blur-md">
          Drawing projects
        </div>
      )}

      <div className="absolute right-2 top-[58%] z-20 w-[min(220px,78%)] rounded-2xl border border-white/20 bg-[#04110f]/88 p-2.5 text-right shadow-[0_22px_65px_rgba(0,0,0,0.46)] backdrop-blur-xl sm:bottom-[4.6rem] sm:right-4 sm:top-auto sm:w-[min(250px,78%)] sm:p-4 lg:bottom-8">
        <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/55">
          <span>{String(frontIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
          <span>{frontProject.status}</span>
        </div>
        <div aria-live="polite" className="mt-2">
          <h2 className="text-sm font-semibold leading-tight text-white sm:text-lg">{frontProject.title}</h2>
          <p className="mt-1 hidden line-clamp-2 text-[11px] leading-relaxed text-white/66 sm:block sm:text-xs">{frontProject.oneLiner}</p>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous project"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-white/[0.06] text-white/75 transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
          >
            <ChevronUp size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next project"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-white/[0.06] text-white/75 transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onOpen(frontProject)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#E5E55A] px-2.5 text-[10px] font-semibold text-[#101500] transition hover:bg-[#f0f570] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-3 sm:text-[11px]"
          >
            Open project <ExternalLink size={12} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul className="sr-only" aria-label="All projects in this carousel">
        {items.map((item, index) => (
          <li key={item.id}>
            <button type="button" onClick={() => select(index)} aria-current={index === frontIndex ? 'true' : undefined}>
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProjectWheel;
