import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MatLayer } from '../../lib/flipbook/matLayer';
import { loadFlipbookFonts } from '../../lib/flipbook/pageArt';
import { TINKER_FOLLOWERS, matStops, stopBeats, stopPictures, tinkerLinks, type MatStop, type Pictures } from '../../lib/mat/timelineCards';
import { createTimelineLayer, type TimelineLayer, type TimelinePlace } from '../../lib/mat/timelineLayer';
import { holdLength, openingOrder, layoutCards, scrollForStep, type Hold } from '../../lib/mat/timelineScene';
import ExperienceStory from './ExperienceStory';
import { experienceIdFromHash, type ExperienceId } from './experienceStories';
import './timeline-mat.css';

/* The home page's timeline ("Timeline"), drawn on the mat itself (Adi's pick, 2026-11-16: prototype G in
   review/home-mat-tape/?c=7). The cards, the tape and its roll are in the 3D scene (lib/mat/timelineLayer.ts); this file
   is the page around them:
   - TimelineMatRoom: the room the timeline takes on the page, in the second screen, before Work. While the page scrolls
     through it the mat holds still and each step opens the next stop (lib/mat/timelineScene.ts matScroll / stepAt).
   - TimelineMat: the HTML lying over the cards, in the order a reader goes through them: the title and its line, one
     button per card (the same words as the card), Tinker Verse's pile of prints included. They are clicked and focused
     like the cards they cover; the layer moves them to where each card is drawn, every frame, without reading layout.
     Five stops open their story on the mat (#experience-<id>, components/mat/ExperienceStory.tsx) when the page is
     opened at that address.
   - The pen (Adi's pick, 2026-11-17, from review/home-mat-pen): a marker lies across the tape and rolls down the years
     with the scroll, opening each stop as it reaches its year. Every pointer move is handed to the layer, which opens the
     stop under it once the pointer rests (latched, no flicker). Clicking a stop picks it up and turns it over in the
     middle of the mat (its story on its back), with the house's dark "Back to the timeline" pill top left; Esc, a click
     beside it or a scroll put it back. The back's rows that have a page (Northwestern's three studio projects) are links.
   - Tinker Verse (2026-11-17) is picked up the same way; its back is a contact sheet whose prints link to each build's
     page here (same tab), with the matching Instagram posts and his Instagram itself opening in a new tab. */

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
  const perUnitRef = useRef(perUnit);
  perUnitRef.current = perUnit;
  const [layer, setLayer] = useState<TimelineLayer | null>(null);
  const [picked, setPicked] = useState<{ id: string; settled: boolean } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<HTMLElement[]>([]);

  // the stories on the mat, exactly as the old timeline opened them (TimelineSection.tsx)
  const [experience, setExperience] = useState<ExperienceId | null>(() => experienceIdFromHash(window.location.hash));
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
    layer.bindOverlay({
      cards: cardRefs.current, words: [...root.querySelectorAll<HTMLElement>('[data-mx]')], root,
      sheet: { box: sheetRef.current, rows: rowRefs.current },
    });
    return () => layer.bindOverlay(null);
  }, [layer, shown, picked]);

  // the pointer: every move goes to the layer, which decides what is under it (it opens that stop once the pointer rests)
  useEffect(() => {
    if (!layer || !shown) return undefined;
    const move = (event: PointerEvent) => { if (event.pointerType !== 'touch') layer.pointer(event.clientX, event.clientY); };
    const leave = () => layer.pointerLeft();
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave); layer.pointerLeft(); };
  }, [layer, shown]);

  // picking a stop up: the pills follow the layer; Esc, a click beside the sheet or a scroll put it back
  useEffect(() => {
    if (!layer) return undefined;
    layer.onPick = (id, settled) => setPicked(id ? { id, settled } : null);
    return () => { layer.onPick = null; };
  }, [layer]);
  useEffect(() => {
    if (!layer || !picked) return undefined;
    const y0 = window.scrollY;
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); layer.pick(null); } };
    const scroll = () => { if (Math.abs(window.scrollY - y0) > 24) layer.pick(null); };
    window.addEventListener('keydown', key);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('scroll', scroll); };
  }, [layer, picked]);
  const pickedStop = picked ? stops.find((s) => s.id === picked.id) ?? null : null;
  const pickedRows = pickedStop && !pickedStop.fill ? stopBeats(pickedStop) : [];
  // (measured with the sheet's fonts, which are loaded before any stop can be picked)
  const pickedLinks = pickedStop?.fill ? tinkerLinks() : [];

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
    // every stop is picked up and turned over on the mat (no jump to another page), Tinker Verse's pile too
    if (layer) { event.preventDefault(); layer.pick(stop.id); }
  };

  rowRefs.current.length = 0;
  return <>
    <div ref={rootRef} className="tm-layer" data-shown={shown ? 'true' : 'false'} data-picked={picked ? 'true' : undefined} inert={!shown}>
      <h2 className="tm-title" data-mx="128" data-my="92">Timeline</h2>
      <p className="tm-sub" data-mx="130" data-my="122">Newest at the top. <b>Scroll</b> and the pen rolls back through the years. <b>Click</b> a stop to turn it over.</p>
      <p className="tm-lab tm-lab-work" data-mx="634" data-my="172"><b>Work</b> 5 roles · 2020 to 2026</p>
      <p className="tm-lab" data-mx="806" data-my="172"><b>School</b> 2 universities · 2016 to 2027</p>
      <ol className="tm-cards" aria-label="Timeline, newest first">
        {stops.map((stop) => {
          const words = <span className="tm-sr">{stop.label}</span>;
          const common = {
            ref: (el: HTMLElement | null) => { if (el) cardRefs.current.set(stop.id, el); else cardRefs.current.delete(stop.id); },
            className: 'tm-card', onFocus: onFocus(stop), tabIndex: shown && !picked ? 0 : -1, 'data-stop': stop.id,
          };
          return <li key={stop.id}>
            <button type="button" {...common} onClick={onCard(stop)} aria-haspopup="dialog">{words}</button>
          </li>;
        })}
      </ol>
      {picked && <div className="tm-catch" onClick={() => layer?.pick(null)} aria-hidden="true" />}
      {picked && pickedStop && <div ref={sheetRef} className="tm-sheet" data-settled={picked.settled ? 'true' : 'false'} aria-hidden="true" />}
      {picked && pickedStop && !pickedStop.fill && <div className="tm-sheet-words" role="dialog" aria-label={`${pickedStop.item.short}: its story`} data-settled={picked.settled ? 'true' : 'false'}>
        <ul className="tm-rows">
          {pickedRows.slice(0, 4).map((row, i) => <li key={row.title}>
            {row.href
              ? <a ref={(el) => { if (el) rowRefs.current[i] = el; }} className="tm-row" href={row.href}><span className="tm-sr">{row.title}: {row.lines.join(' ')}</span></a>
              : <span ref={(el) => { if (el) rowRefs.current[i] = el; }} className="tm-row is-text"><span className="tm-sr">{row.kicker}. {row.title}. {row.lines.join(' ')}</span></span>}
          </li>)}
        </ul>
      </div>}
      {/* Tinker Verse's back: his latest posts as prints, each opening on Instagram, and his Instagram (all new tabs) */}
      {picked && pickedStop?.fill && <div className="tm-sheet-words" role="dialog" aria-label={`${pickedStop.item.short}: its prints`} data-settled={picked.settled ? 'true' : 'false'}>
        <p className="tm-sr">{pickedStop.item.short}. {pickedStop.item.pin}. {new Date(pickedStop.item.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })} to now. My latest builds, as I posted them. {TINKER_FOLLOWERS} followers on Instagram.</p>
        <ul className="tm-rows">
          {pickedLinks.map((link, i) => <li key={`${link.href}-${i}`}>
            <a ref={(el) => { if (el) rowRefs.current[i] = el; }} className={link.newTab ? 'tm-row tm-row--out' : 'tm-row tm-row--print'} href={link.href}
              {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <span className="tm-sr">{link.text}</span>
            </a>
          </li>)}
        </ul>
      </div>}
    </div>
    {picked && <button type="button" className="fb-pill fb-pill--back tm-back" data-shown={picked.settled ? 'true' : 'false'} onClick={() => layer?.pick(null)}>
      <ArrowLeft size={16} aria-hidden="true" /><span>Back to the timeline</span></button>}
    <ExperienceStory id={experience} onClose={closeExperience} />
  </>;
}
