import { useEffect, useRef } from 'react';
import './work-section.css';
import { PROJECTS as ALL_PROJECTS } from '../../data/projects';
import { projectPath } from '../../lib/workRoutes';
import { layBento } from './workBento';
import { whenQuiet } from '../../lib/flipbook/quiet';

/**
 * Selected work on the mat, as one board of things lying on it: every project the old home page listed, in tiles of
 * different sizes (a bento), each tile a thick print or chip that is put down as the visitor scrolls to it, leans
 * toward the pointer, and opens its own page (the pages themselves are unchanged: /work/<id>).
 * The ids, titles, one-liners, pictures and status all come from data/projects.ts, the same list the old Selected Work
 * section drew.
 */

/**
 * The three human-centered design case studies (FamilySync, Squad Up, P&G). They lie on the mat as three clipboards, and
 * they are on this board too, first (Adi, 2026-11-18: "start adding all of these to the bottom selected ... work as well").
 * (From 2026-11-16 to 2026-11-18 the board left them out, when they were only dealt from the design poster.)
 */
export const REMADE = ['familysync-jpmorgan', 'mcdonalds-interaction-design', 'pg-haircare'];
/** Left out of Selected work (Adi, 2026-11-17: "Surya needs to be removed... DIY Jarvis needs to be removed"): their books are on the mat. */
export const LEFT_OUT = ['surya', 'jarvis', 'lawn'];
const PROJECTS = ALL_PROJECTS.filter((project) => !LEFT_OUT.includes(project.id));
/**
 * A project whose tile shows another picture than its page's hero. P&G: the illustrated room from its public story page,
 * the same picture its clipboard shows (lib/mat/designCards.ts: never the project photographs on a home-page tile).
 */
const PICTURE: Record<string, string> = { 'pg-haircare': '/images/pg/rooms/room-hero.webp' };

/** "Glyph: A Body for AI" becomes the name "Glyph" and the rest "A Body for AI". */
function splitTitle(title: string): { name: string; rest: string } {
  const at = title.search(/\s[–—-]\s|:\s|\s·\s|,\s/);
  if (at < 0) return { name: title, rest: '' };
  const cut = title.slice(at).match(/^(\s[–—-]\s|:\s|\s·\s|,\s)/)?.[0].length ?? 1;
  return { name: title.slice(0, at), rest: title.slice(at + cut) };
}

const STATUS: Record<string, string> = { shipped: 'Shipped', 'in-progress': 'In progress', archived: 'Archived', concept: 'Concept' };

/** (Where each project lies on the board is worked out by layBento, workBento.ts, from the projects that are present.) */
/** A small, steady turn for each tile, so they look laid down by hand and not printed on a grid. */
const TURN = [-0.7, 0.5, -0.3, 0.8, -0.6, 0.4, -0.8, 0.3, -0.4, 0.7, -0.5, 0.6];

export default function WorkSection() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const sec = root.current;
    if (!sec) return undefined;
    const tiles = Array.from(sec.querySelectorAll<HTMLElement>('.wk-card'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) tiles.forEach((tile) => tile.classList.add('is-down'));
    // each tile is put down as it comes into view (the ones beside it a little after)
    const io = reduce || !('IntersectionObserver' in window) ? null : new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-down'); io?.unobserve(entry.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    if (io) tiles.forEach((tile) => io.observe(tile));
    // The pictures are fetched ahead, at the first quiet moment a little after the board is built, and decoded then.
    // Left to "lazy", a fast flick to the bottom reached the board before they had come: blank tiles, then each picture
    // popping in with a slow frame (Adi, 2026-11-20: "jank if I am quickly scrolling to bottom").
    let gone = false;
    const warm = window.setTimeout(() => whenQuiet(() => {
      if (gone) return;
      sec.querySelectorAll<HTMLImageElement>('img.wk-pic').forEach((img) => { img.loading = 'eager'; img.decode?.().catch(() => undefined); });
    }, 8000), 1500);

    // a tile leans toward the pointer, as a thick print lifts at one edge when it is touched (one frame at a time)
    let frame = 0;
    let at: { tile: HTMLElement; x: number; y: number } | null = null;
    const lean = () => {
      frame = 0;
      if (!at) return;
      const r = at.tile.getBoundingClientRect();
      const px = (at.x - r.left) / Math.max(1, r.width) - 0.5;
      const py = (at.y - r.top) / Math.max(1, r.height) - 0.5;
      at.tile.style.setProperty('--rx', `${(-py * 9).toFixed(2)}deg`);
      at.tile.style.setProperty('--ry', `${(px * 11).toFixed(2)}deg`);
    };
    const rest = (tile: HTMLElement) => { tile.style.removeProperty('--rx'); tile.style.removeProperty('--ry'); };
    const canLean = !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onMove = (event: PointerEvent) => {
      const tile = (event.target as Element | null)?.closest<HTMLElement>('.wk-card');
      if (!tile || !tile.classList.contains('is-down')) return;
      if (at && at.tile !== tile) rest(at.tile);
      at = { tile, x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(lean);
    };
    const onLeave = () => { if (at) rest(at.tile); at = null; };
    if (canLean) { sec.addEventListener('pointermove', onMove); sec.addEventListener('pointerleave', onLeave); }
    return () => {
      gone = true;
      window.clearTimeout(warm);
      io?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      sec.removeEventListener('pointermove', onMove);
      sec.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const places = layBento(PROJECTS.map((project) => project.id));
  return (
    <section className="mt-work" id="work" aria-label="Selected work" ref={root}>
      <div className="wk-top">
        <h2>Selected <em>work.</em></h2>
        <p className="wk-sub">{PROJECTS.length} things I made. Click any to open its page.</p>
      </div>
      <ul className="wk-board">
        {PROJECTS.map((project, index) => {
          const { name, rest } = splitTitle(project.hero.title);
          const place = places[project.id];
          const size = place.w * place.h >= 4 ? 'big' : place.w >= 2 ? 'wide' : 'chip';
          return (
            <li key={project.id} className="wk-cell" data-w={place.w} data-h={place.h} style={{ '--c': place.c, '--r': place.r, '--w': place.w, '--h': place.h } as React.CSSProperties}>
              <a className={`wk-card wk-${size}`} href={projectPath(project.id)} style={{ '--t': `${TURN[index % TURN.length]}deg`, '--d': `${(index % 4) * 80}ms` } as React.CSSProperties} aria-label={`${project.hero.title}. ${project.hero.oneLiner} Opens the project.`}>
                {(PICTURE[project.id] ?? project.heroImage) ? <img className="wk-pic" src={PICTURE[project.id] ?? project.heroImage} alt="" loading="lazy" decoding="async" /> : <span className="wk-pic" />}
                <span className="wk-label">
                  <span className="wk-name">{name}</span>
                  {rest && size !== 'chip' && <span className="wk-rest">{rest}</span>}
                  {size === 'big' && <span className="wk-line">{project.hero.oneLiner}</span>}
                </span>
                {size !== 'chip' && <span className="wk-tag">{STATUS[project.outcome.status] ?? ''}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
