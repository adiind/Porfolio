import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { MatLayer } from '../../lib/flipbook/matLayer';
import { loadFlipbookFonts } from '../../lib/flipbook/pageArt';
import { matStops, stopPictures, type MatStop, type Pictures } from '../../lib/mat/timelineCards';
import { createTimelineLayer, type TimelineLayer, type TimelinePlace } from '../../lib/mat/timelineLayer';
import { holdLength, openingOrder, layoutCards, scrollForStep, type Hold } from '../../lib/mat/timelineScene';
import ExperienceStory from './ExperienceStory';
import { experienceIdFromHash, type ExperienceId } from './experienceStories';
import './timeline-mat.css';

/* The home page's timeline ("Everything, in order."), drawn on the mat itself (Adi's pick, 2026-11-16: prototype G in
   review/home-mat-tape/?c=7). The cards, the tape and its roll are in the 3D scene (lib/mat/timelineLayer.ts); this file
   is the page around them:
   - TimelineMatRoom: the room the timeline takes on the page, in the second screen, before Work. While the page scrolls
     through it the mat holds still and each step opens the next stop (lib/mat/timelineScene.ts matScroll / stepAt).
   - TimelineMat: the HTML lying over the cards, in the order a reader goes through them: the title and its line, one link
     or button per card (the same words as the card) and per print on Tinker Verse. They are clicked and focused like the
     cards they cover; the layer moves them to where each card is drawn, every frame, without reading layout. Five stops
     open their story on the mat (#experience-<id>, components/mat/ExperienceStory.tsx), as the old timeline did. */

/** Shared by the room (which measures where it lies) and the page's scroll handler (which holds the mat still). */
export type HoldRef = MutableRefObject<Hold | null>;

const reduceMotion = (): boolean => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The number of stops that open on scroll (the room needs it before the cards are drawn). */
export const TIMELINE_STEPS = openingOrder(layoutCards(matStops())).length;

/** The room the timeline takes on the page: one window, plus the steps it holds still for. */
export function TimelineMatRoom({ holdRef, steps = TIMELINE_STEPS }: { holdRef: HoldRef; steps?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const measure = () => {
      // where it lies on the page (before the second screen's tilt, which only changes how it is drawn)
      let start = 0;
      for (let el: HTMLElement | null = node; el; el = el.offsetParent as HTMLElement | null) start += el.offsetTop;
      const hold: Hold = { start, view: window.innerHeight, steps };
      holdRef.current = hold;
      setHeight(Math.round(hold.view + holdLength(hold)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); holdRef.current = null; };
  }, [holdRef, steps]);
  return <section ref={ref} id="timeline" className="tm-room" aria-hidden="true" style={height ? { height } : undefined} />;
}


const loadPicture = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => { image.decode().then(() => resolve(image), () => resolve(image)); };
  image.onerror = () => resolve(null);
  image.src = src;
});

interface Props {
  /** the engine, once the stage is up: the layer is added to its scene */
  engine: { addLayer(layer: MatLayer): () => void } | null;
  /** where the stage's wide view frames the mat, and its unit (the stage spec) */
  place: TimelinePlace | null;
  /** CSS pixels to one table unit at the wide view */
  perUnit: number | null;
  holdRef: HoldRef;
  /** the wide view is up (not flown down to a poster or a book) */
  shown: boolean;
}

export default function TimelineMat({ engine, place, perUnit, holdRef, shown }: Props) {
  const stops = useMemo<MatStop[]>(() => matStops(), []);
  const steps = useMemo(() => openingOrder(layoutCards(matStops())).map((card) => card.stop.id), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const thumbRefs = useRef<HTMLElement[]>([]);
  const perUnitRef = useRef(perUnit);
  perUnitRef.current = perUnit;
  const [layer, setLayer] = useState<TimelineLayer | null>(null);

  // the stories on the mat, exactly as the old timeline opened them (TimelineSection.tsx)
  const [experience, setExperience] = useState<ExperienceId | null>(() => experienceIdFromHash(window.location.hash));
  const openExperience = useCallback((id: ExperienceId) => {
    window.history.pushState({ ...window.history.state, matExperience: true }, '', `#experience-${id}`);
    setExperience(id);
  }, []);
  const closeExperience = useCallback(() => {
    if (window.history.state?.matExperience) window.history.back();
    else { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search); setExperience(null); }
  }, []);
  useEffect(() => {
    const sync = () => setExperience(experienceIdFromHash(window.location.hash));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);


  // the cards, the tape and the roll, in the engine's scene
  useEffect(() => {
    if (!engine || !place) return undefined;
    let live = true;
    let remove: (() => void) | null = null;
    Promise.all([loadFlipbookFonts('first'), ...stopPictures(stops).map(loadPicture)]).then((loaded) => {
      if (!live) return;
      const pictures: Pictures = new Map();
      stopPictures(stops).forEach((src, i) => { const image = loaded[i + 1] as HTMLImageElement | null; if (image) pictures.set(src, image); });
      const made = createTimelineLayer({
        stops, pictures, place, reduced: reduceMotion(),
        page: { hold: () => holdRef.current, perUnit: () => perUnitRef.current },
      });
      remove = engine.addLayer(made);
      setLayer(made);
      if (import.meta.env.DEV) { const w = window as unknown as { __timeline?: TimelineLayer; __timelines?: unknown[] }; w.__timeline = made; (w.__timelines ??= []).push({ place, at: performance.now() }); }
    }).catch((error) => console.error('Timeline on the mat failed', error));
    return () => { live = false; remove?.(); setLayer(null); };
  }, [engine, place, stops, holdRef]);

  // the links follow the cards
  useEffect(() => {
    const root = rootRef.current;
    if (!layer || !root) return undefined;
    layer.bindOverlay({ cards: cardRefs.current, thumbs: thumbRefs.current, words: [...root.querySelectorAll<HTMLElement>('[data-mx]')], root });
    return () => layer.bindOverlay(null);
  }, [layer, shown]);

  // (links to #timeline are handled by the page, FlipBookApp: it scrolls to this timeline's room, id="timeline", by where
  // it lies, and leaves the address alone)

  /** Reached with the keyboard: the page goes to where that stop is open (or to the timeline, for Tinker Verse). */
  const onFocus = (stop: MatStop) => (event: React.FocusEvent<HTMLElement>) => {
    const hold = holdRef.current;
    if (!hold || !event.currentTarget.matches(':focus-visible')) return;
    const top = scrollForStep(steps.indexOf(stop.id), hold);
    if (Math.abs(window.scrollY - top) > 2) window.scrollTo({ top, behavior: 'auto' });
  };
  const onCard = (stop: MatStop) => (event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (stop.story) { event.preventDefault(); openExperience(stop.story as ExperienceId); }
  };

  thumbRefs.current.length = 0;
  return <>
    <div ref={rootRef} className="tm-layer" data-shown={shown ? 'true' : 'false'} inert={!shown}>
      <h2 className="tm-title" data-mx="128" data-my="92">Timeline</h2>
      <p className="tm-sub" data-mx="130" data-my="122">Newest at the top. <b>Scroll</b> to travel back through the years. <b>Click</b> any stop to open its page.</p>
      <p className="tm-lab tm-lab-work" data-mx="680" data-my="172"><b>Work</b> 5 roles · 2020 to 2026</p>
      <p className="tm-lab" data-mx="760" data-my="172"><b>School</b> 2 universities · 2016 to 2027</p>
      <ol className="tm-cards" aria-label="Timeline, newest first">
        {stops.map((stop) => {
          const words = <span className="tm-sr">{stop.label}</span>;
          const common = {
            ref: (el: HTMLElement | null) => { if (el) cardRefs.current.set(stop.id, el); else cardRefs.current.delete(stop.id); },
            className: 'tm-card', onFocus: onFocus(stop), tabIndex: shown ? 0 : -1,
          };
          return <li key={stop.id}>
            {stop.story
              ? <button type="button" {...common} onClick={onCard(stop)}>{words}</button>
              : <a {...common} href={stop.href ?? undefined}>{words}</a>}
            {stop.thumbs && <ul className="tm-thumbs" aria-label={`${stop.item.short}: what I built there`}>
              {stop.thumbs.map((thumb) => <li key={thumb.cap + thumb.href}>
                <a ref={(el) => { if (el) thumbRefs.current.push(el); }} className="tm-thumb" href={thumb.href} onFocus={onFocus(stop)} tabIndex={shown ? 0 : -1}>
                  <span className="tm-sr">{thumb.cap}</span>
                </a>
              </li>)}
            </ul>}
          </li>;
        })}
      </ol>
    </div>
    <ExperienceStory id={experience} onClose={closeExperience} />
  </>;
}
