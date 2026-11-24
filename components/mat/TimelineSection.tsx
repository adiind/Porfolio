import { useCallback, useEffect, useRef, useState } from 'react';
import ExperienceStory from './ExperienceStory';
import { EXPERIENCE_STORIES, experienceIdFromHash, type ExperienceId } from './experienceStories';
import './timeline-section.css';
import { shipStopHref } from '../../lib/ship/links';
import data from '../../lib/mat/timelineData.json';

/* The approved home-page timeline ("Everything, in order."), ported from review/home-cc-timeline.
   The stops, dates, facts and picture names are the prototype's window.__TL list, kept in lib/mat/timelineData.json
   (picture paths now point at /images/mat/timeline/), the one file the mat's timeline reads too. The behaviour is the
   prototype's timeline.js, run inside one useEffect against the section's ref and fully undone when the component
   unmounts. */

type Proof = [string, string, string?, string?];
interface TLWork { t: string; r: string; img?: string; pos?: string; big?: string }
interface TLItem {
  id: string; short: string; title: string; company?: string; headline?: string; start: string; end: string; lane: number;
  c: string; f?: string; chip?: string; pic: string; logo?: number; c2?: string; alt?: string; subs?: unknown[]; role?: string;
  acc?: string; b?: string; h3?: string; fit?: unknown; pos?: string; pin?: string; href?: string;
  proofs?: Proof[]; notes?: string[]; works?: TLWork[];
}
interface TLData { start: string; all: string; end: string; today: string; first: string; items: TLItem[]; also?: { short: string; pin: string; href: string; when: string }[] }

const TL = data.tl as unknown as TLData;

/* How each stop is drawn (from the prototype). pic swaps in a better frame of the same place. */
const LOOK: Record<string, { c: string; tab: string; tc: string; on: string; ton: string; num: string; dp: string; pic?: string; alt?: string }> = data.look;
const ARROW = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Builds the stops and runs the scroll behaviour on `sec`. Returns the function that undoes all of it. */
function runTimeline(sec: HTMLElement, openExperience: (id: ExperienceId) => void): () => void {
  const T = TL;
  const undo: Array<() => void> = [];
  let dead = false;
  const on = (target: EventTarget, type: string, fn: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions) => {
    target.addEventListener(type, fn, opts);
    undo.push(() => target.removeEventListener(type, fn, opts));
  };

  const today = +new Date(T.today), YEAR = 31557600000;
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const my = (s: string) => { if (s === 'Present') return 'now'; const d = new Date(s); return M[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const glue = (s: string) => s.replace(/ /g, ' ');                       // keeps "Oct 2024" on one line
  const end = (it: { end: string }) => it.end === 'Present' ? today : +new Date(it.end);
  const el = (tag: string, cls?: string, txt?: string | number | null) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; };
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const smooth = (a: number, b: number, v: number) => { const u = clamp((v - a) / (b - a)); return u * u * (3 - 2 * u); };
  /* Where a stop leads. Stops without an address show a note instead of going anywhere (as in the prototype). */
  function wire(a: HTMLAnchorElement, it: { href?: string; short: string }) {
    // (stops with their own story on the mat, EXPERIENCE_STORIES, keep it: the ship table is only for the rest)
    const shipped = shipStopHref((it as { id?: string }).id); if (shipped && !Object.hasOwn(EXPERIENCE_STORIES, it.short.toLowerCase())) { a.href = shipped; return; }
    if (it.href) { a.href = it.href; } else {
      const id = it.short.toLowerCase();
      a.href = Object.hasOwn(EXPERIENCE_STORIES, id) ? `#experience-${id}` : '#';
      a.setAttribute('data-exp', it.short);
    }
  }

  const q = <E extends Element>(sel: string) => sec.querySelector(sel) as E;
  const work = q<HTMLElement>('.l-work .t2-cards'), school = q<HTMLElement>('.l-school .t2-cards'), axis = q<HTMLElement>('.t2-rule-in');
  const newest = (p: TLItem, r: TLItem) => +new Date(r.start) - +new Date(p.start);
  const stops = T.items.filter((it) => !it.pin).sort(newest);
  const pins = T.items.filter((it) => it.pin).sort(newest);
  const t0 = +new Date(T.all), t1 = +new Date(T.end);
  const pa = (d: number) => clamp((t1 - d) / (t1 - t0)) * 100;                   // how far down the ruler a date sits, in percent
  const cards: HTMLAnchorElement[] = [], segs: HTMLElement[] = [], mids: number[] = [];
  const n = stops.length;
  let schoolSeen = 0;
  sec.style.setProperty('--n', String(n));

  /* Years for a tab: "2026", or "2024" with "–25" under it. */
  function yearTab(node: HTMLElement, it: { start: string; end: string }, nowWord: string) {
    const a = new Date(it.start).getUTCFullYear(), open = it.end === 'Present', b = open ? 0 : new Date(it.end).getUTCFullYear();
    node.appendChild(document.createTextNode(String(a)));
    if (open) node.appendChild(el('i', '', '–' + nowWord)); else if (b !== a) node.appendChild(el('i', '', '–' + String(b).slice(2)));
  }
  /* How long a job lasted, in plain words. School shows "in progress" while it is still running. */
  function dur(it: TLItem) {
    if (it.lane === 1) return end(it) > today ? 'in progress' : '';
    const m = Math.round((end(it) - +new Date(it.start)) / 2629800000);
    if (m < 12) return m + ' months';
    const y = Math.floor(m / 12), r = m % 12; return y + (y > 1 ? ' yrs' : ' yr') + (r ? ' ' + r + ' mos' : '');
  }
  function span(list: TLItem[]) {                                               // "2020 to 2026" for a lane label
    const a = Math.min(...list.map((it) => new Date(it.start).getUTCFullYear()));
    const b = Math.max(...list.map((it) => new Date(end(it)).getUTCFullYear()));
    return a + ' to ' + b;
  }
  const jobs = stops.filter((it) => it.lane !== 1), schools = stops.filter((it) => it.lane === 1);
  const lw = sec.querySelector('.l-work .t2-lab span'), ls = sec.querySelector('.l-school .t2-lab span');
  if (lw) lw.textContent = jobs.length + ' roles · ' + span(jobs);
  if (ls) ls.textContent = schools.length + ' universities · ' + span(schools);

  /* On the side: a campus role and the builds, as one card between the two schools, which is when they happened. */
  const side = el('div', 't2-side'), sh = el('p', 't2-side-h');
  const sl = el('span', 't2-side-l'); sl.appendChild(el('b', '', 'On the side'));
  sl.appendChild(el('span', '', ((T.also || []).length ? 'a campus role and ' : '') + pins.length + ' builds'));
  sh.appendChild(sl); side.appendChild(sh);
  function sideRow(it: { short: string; pin?: string; href?: string; pinHref?: string }, whenNode: HTMLElement, label: string) {
    const a = el('a', 't2-sd') as HTMLAnchorElement; if (it.pinHref) a.href = it.pinHref; else wire(a, it);
    a.appendChild(whenNode);
    const p = el('p'); p.appendChild(el('b', '', it.short)); p.appendChild(el('span', '', it.pin)); a.appendChild(p);
    a.setAttribute('aria-label', it.short + ': ' + it.pin + (label ? ', ' + label : '') + '. Opens its page.');
    side.appendChild(a);
  }
  function whenCell(fill: (d: HTMLElement) => void) { const c = el('span', 't2-sw'), d = el('span'); fill(d); c.appendChild(d); return c; }
  (T.also || []).forEach((it) => sideRow({ short: it.short, pin: it.pin, pinHref: it.href }, whenCell((d) => { d.textContent = it.when; }), it.when));
  pins.forEach((it) => {
    sideRow(it, whenCell((d) => yearTab(d, it, 'now')), my(it.start) + ' to ' + my(it.end));
  });

  stops.forEach((it, k) => {
    const L: Partial<(typeof LOOK)[string]> = LOOK[it.id] || {}, isSchool = it.lane === 1;
    const a = el('a', 't2-stop') as HTMLAnchorElement; wire(a, it);
    ([['c', L.c || it.c], ['tab', L.tab || L.c || it.c], ['tc', L.tc || L.c || it.c], ['on', L.on || it.f || '#fff'], ['ton', L.ton || L.on || '#fff'], ['num', L.num || L.on || '#fff'], ['dp', L.dp || L.c || it.c]] as [string, string][])
      .forEach((kv) => a.style.setProperty('--' + kv[0], kv[1]));
    a.style.setProperty('--k', String(k));
    const range = glue(my(it.start)) + ' – ' + glue(my(it.end)), d = dur(it), proofs = it.proofs || [];   // may break only after the dash
    a.setAttribute('aria-label', it.short + ': ' + (it.role || it.title) + ', ' + my(it.start) + ' to ' + my(it.end) + '. Opens its page.');

    /* the year tab */
    const tab = el('div', 't2-tab'), yr = el('div', 't2-yr'); yearTab(yr, it, 'now');
    const go = el('div', 't2-go'); go.innerHTML = ARROW;
    tab.appendChild(yr); tab.appendChild(go); a.appendChild(tab);

    /* the header: always there, never moves while the stop grows */
    const main = el('div', 't2-main'), hd = el('div', 't2-hd');
    const pic = el('div', 't2-pic' + (it.logo ? ' is-logo' : '')), im = el('img') as HTMLImageElement; im.loading = 'lazy'; im.src = L.pic || it.pic; im.alt = L.alt || it.alt || ''; im.decoding = 'async'; pic.appendChild(im);
    const name = el('h3', 't2-name', it.short), role = el('div', 't2-role', it.role || it.title);
    const when = el('div', 't2-when'); when.appendChild(el('span', '', range)); if (d) when.appendChild(el('span', '', d));
    let proof: HTMLElement | null = null;
    if (proofs.length) {
      proof = el('div', 't2-proof');
      proofs.forEach((p) => {
        const s = el('span', 't2-pf is-' + p[0]);
        if (p[0] === 'num') { s.appendChild(el('b', '', p[1])); s.appendChild(document.createTextNode(p[2] || '')); } else s.textContent = p[1];
        proof!.appendChild(s);
      });
    }
    if (isSchool) {                                                             // print and name on one row, the long degree name under them
      const id = el('div', 't2-id'), nm = el('div', 't2-nm');
      nm.appendChild(name); nm.appendChild(when); id.appendChild(pic); id.appendChild(nm);
      hd.appendChild(id); hd.appendChild(role); if (proof) hd.appendChild(proof);
    } else {                                                                    // print on the left, words beside it, most important first
      const txt = el('div', 't2-txt');
      txt.appendChild(name); txt.appendChild(role); txt.appendChild(when); if (proof) txt.appendChild(proof);
      hd.appendChild(pic); hd.appendChild(txt);
    }
    main.appendChild(hd);

    /* grown: one sentence, the numbers, then the work itself */
    const more = el('div', 't2-more');
    if (it.headline) more.appendChild(el('p', 't2-what', it.headline));
    const nums = proofs.filter((p) => p[0] === 'num'), tags = proofs.filter((p) => p[0] !== 'num');
    if (nums.length) {
      const ul = el('ul', 't2-stats');
      nums.forEach((p) => { const li = el('li', 't2-st'); li.appendChild(el('b', '', p[1])); li.appendChild(el('span', '', p[3] || p[2])); ul.appendChild(li); });
      more.appendChild(ul);
    }
    if (tags.length && !(it.notes && it.notes.length)) {                        // where there are notes, the notes already say it
      const tg = el('div', 't2-tags'); tags.forEach((p) => tg.appendChild(el('span', '', p[1]))); more.appendChild(tg);
    }
    if (it.works && it.works.length) {
      const wk = el('div', 't2-works');
      it.works.forEach((w) => {
        const c = el('div', 't2-wk'), th = el('i', w.img ? '' : 'is-text', w.img ? null : w.big);
        if (w.img) { th.style.backgroundImage = 'url("' + w.img + '")'; if (w.pos) th.style.backgroundPosition = w.pos; }
        c.appendChild(th); c.appendChild(el('b', '', w.t)); c.appendChild(el('em', '', w.r)); wk.appendChild(c);
      });
      more.appendChild(wk);
    } else if (it.notes && it.notes.length) {
      const nt = el('ul', 't2-notes'); it.notes.forEach((s) => nt.appendChild(el('li', '', s))); more.appendChild(nt);
    }
    main.appendChild(more); a.appendChild(main);

    if (isSchool) { school.appendChild(a); if (!schoolSeen++) school.appendChild(side); } else work.appendChild(a);
    cards.push(a);

    /* its bar on the ruler, at its true dates */
    const s = el('i', 't2-seg r' + (isSchool ? 1 : 0)); s.style.setProperty('--c', L.tc || L.c || it.c);
    s.style.top = pa(end(it)) + '%'; s.style.height = Math.max(pa(+new Date(it.start)) - pa(end(it)), 0.9) + '%';
    axis.appendChild(s); segs.push(s);
    mids.push((+new Date(it.start) + end(it)) / 2);
    on(a, 'pointerenter', () => { s.classList.add('is-on'); });
    on(a, 'pointerleave', () => { s.classList.toggle('is-on', s.hasAttribute('data-at')); });
  });
  if (!schoolSeen) school.appendChild(side);

  /* the ruler: a line where each year starts, and the year written in the middle of its band */
  for (let yy = new Date(T.all).getUTCFullYear(); yy <= new Date(T.end).getUTCFullYear(); yy++) {
    const j0 = +new Date(yy + '-01-01'), j1 = +new Date((yy + 1) + '-01-01');
    if (j0 > t0 && j0 < t1) { const ln = el('i', 't2-yl'); ln.style.top = pa(j0) + '%'; axis.appendChild(ln); }
    const b0 = Math.max(t0, j0), b1 = Math.min(t1, j1);
    if (b1 - b0 > 0.4 * YEAR) { const yn = el('i', 't2-yn', yy); yn.style.top = pa((b0 + b1) / 2) + '%'; axis.appendChild(yn); }
  }
  const mark = el('i', 't2-mark'); axis.appendChild(mark);

  /* p = which stop the marker is at (0 = newest, n-1 = oldest, can be between two). m = how strongly things grow (0 to 1).
     peaks[i] = how much stop i grows: each one grows just enough to hold its own details (worked out in fit() below). */
  const peaks = stops.map(() => 3.6), folds = stops.map(() => 0), needs: number[] = [], rooms: number[] = [];
  const state = { p: 0, m: 0 };
  let focusAt = -1;
  function paint(p: number, m: number) {
    state.p = p; state.m = m;
    let sq = 0;
    for (let i = 0; i < n; i++) {
      let g = Math.exp(-Math.pow((i - p) / 0.5, 2)); g = g < 0.03 ? 0 : (g - 0.03) / 0.97;   // a stop one step away stays exactly at rest
      const pk = peaks[i], w = 1 + m * pk * g, at = m > 0.5 && g > 0.5;
      cards[i].style.setProperty('--w', w.toFixed(3));
      cards[i].style.setProperty('--o', clamp((w - 1 - pk * 0.55) / (pk * 0.35)).toFixed(3));
      cards[i].style.setProperty('--up', (m * g).toFixed(3));
      if (at) segs[i].setAttribute('data-at', ''); else segs[i].removeAttribute('data-at');
      segs[i].classList.toggle('is-on', at || cards[i].matches(':hover'));
      if (folds[i]) sq = Math.max(sq, m * g);
    }
    side.style.setProperty('--sq', sq.toFixed(3));                              // an open school stop may ask the side list to fold
    const i0 = Math.max(0, Math.min(n - 1, Math.floor(p))), i1 = Math.min(n - 1, i0 + 1), f = clamp(p - i0);
    let d = mids[i0] * (1 - f) + mids[i1] * f; d = today * (1 - m) + d * m;      // before you scroll the marker sits on today
    mark.style.top = pa(d) + '%'; mark.setAttribute('data-y', m < 0.05 ? 'Today' : String(new Date(d).getUTCFullYear()));
  }
  /* The prototype also has a phone layout below 820 px. That layout is not part of this port (the page is not shown
     that narrow), so the desktop behaviour always runs. */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* How tall should a grown stop be? Exactly as tall as its own details need (see the prototype's comments). */
  const MIN_STRIP = 58, MIN_SCHOOL = 72, SIDE_ROWS = 150, SIDE_TITLE = 36;      // SIDE_*: the side list with its rows, and folded to its title line (same numbers as timeline-section.css)
  function trial(i: number, w: number, fold: number) {
    cards.forEach((o, j) => { o.style.setProperty('--w', j === i ? w.toFixed(3) : '1'); o.style.setProperty('--o', j === i ? '1' : '0'); o.style.setProperty('--up', j === i ? '1' : '0'); });
    side.style.setProperty('--sq', fold ? '1' : '0');
  }
  function fit() {
    if (dead) return;
    cards.forEach((c) => { c.removeAttribute('data-drop'); });
    if (reduce) { paint(0, 0); return; }
    const px = (node: Element, prop: string) => parseFloat((getComputedStyle(node) as unknown as Record<string, string>)[prop]) || 0;
    sec.classList.add('is-fitting');                                            // nothing may be mid-animation while it is measured
    cards.forEach((c, i) => {
      const lane = c.parentNode as HTMLElement, main = c.querySelector('.t2-main') as HTMLElement, hd = c.querySelector('.t2-hd') as HTMLElement, more = c.querySelector('.t2-more') as HTMLElement;
      const mates = cards.filter((o) => o.parentNode === lane), k = mates.length - 1, inSchool = lane === school;
      const avail = lane.clientHeight - px(lane, 'rowGap') * (lane.children.length - 1);
      /* The tallest this stop may get. In the school lane there are two answers: with the side list keeping its rows,
         and with the side list folded to its title. Folding is tried before any part of the stop is left out. */
      const roomA = inSchool ? avail - SIDE_ROWS - k * MIN_SCHOOL : avail - k * MIN_STRIP;
      const roomB = inSchool ? avail - SIDE_TITLE - k * MIN_SCHOOL : roomA;
      const grow = (Tt: number, fold: number) => {                              // the flex weight that makes this stop Tt tall
        if (!inSchool) return Tt * k / Math.max(1, avail - Tt);
        if (fold) return Tt * k / Math.max(1, avail - SIDE_TITLE - Tt);
        const w = Tt * (k + 1.25) / Math.max(1, avail - Tt);
        return 1.25 / (w + k + 1.25) * avail < SIDE_ROWS ? Tt * k / Math.max(1, avail - SIDE_ROWS - Tt) : w;
      };
      for (let lvl = 0; lvl <= 3; lvl++) {
        c.setAttribute('data-drop', String(lvl));
        sec.classList.add('is-sizing'); trial(i, 40, 0);
        const need = px(main, 'paddingTop') + px(main, 'paddingBottom') + hd.offsetHeight + px(more, 'marginTop') + more.offsetHeight + 2;
        sec.classList.remove('is-sizing');
        folds[i] = need > roomA && roomB > roomA ? 1 : 0;
        const room = folds[i] ? roomB : roomA;
        if (lvl === 0) { needs[i] = Math.round(need); rooms[i] = Math.round(roomB); }
        if (need <= room || lvl === 3) { peaks[i] = Math.max(0.5, grow(Math.min(need, room), folds[i]) - 1); break; }
      }
      trial(i, 1 + peaks[i], folds[i]);                                         // check the real thing; step down once more if a line still does not fit
      while (more.scrollHeight > more.clientHeight + 1 && +(c.getAttribute('data-drop') || 0) < 3) c.setAttribute('data-drop', String(+(c.getAttribute('data-drop') || 0) + 1));
    });
    paint(state.p, state.m);
    void sec.offsetHeight;                                                      // settle on the real state before animations are allowed again
    sec.classList.remove('is-fitting');
  }

  let queued = false, raf = 0;
  function onScroll() {
    if (queued) return; queued = true;
    raf = requestAnimationFrame(() => {
      queued = false;
      if (dead) return;
      if (reduce) { paint(0, 0); return; }
      if (focusAt >= 0) { paint(focusAt, 1); return; }                        // keyboard focus on a stop grows that stop
      const r = sec.getBoundingClientRect(), total = sec.offsetHeight - window.innerHeight;
      const u = total > 0 ? clamp(-r.top / total) : 0;
      const m = smooth(0.03, 0.13, u), t = clamp((u - 0.10) / 0.84);
      const raw = (n - 1) * t, i0 = Math.floor(raw);                           // newest first: the marker travels back in time
      paint(i0 + smooth(0.3, 0.7, raw - i0), m);                               // it rests on each stop and moves quickly between two
    });
  }
  cards.forEach((c, i) => {
    on(c, 'focus', () => { if (c.matches(':focus-visible')) { focusAt = i; onScroll(); } });
    on(c, 'blur', () => { focusAt = -1; onScroll(); });
  });
  let rt = 0;
  const refit = () => { clearTimeout(rt); rt = window.setTimeout(() => { fit(); onScroll(); }, 140); };
  on(window, 'scroll', onScroll, { passive: true });
  on(window, 'resize', () => { onScroll(); refit(); });
  paint(0, 0);
  fit();
  // letter widths change once the real typefaces load (when they already have, measuring again would change nothing)
  if (document.fonts && document.fonts.ready && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { if (!dead) { fit(); onScroll(); } });
  if (document.readyState !== 'complete') on(window, 'load', () => { fit(); onScroll(); });

  let showT = 0, io: IntersectionObserver | null = null;
  const show = () => { sec.classList.add('is-in'); showT = window.setTimeout(() => { sec.classList.add('is-set'); onScroll(); }, 1300); };
  if (reduce || !('IntersectionObserver' in window)) { sec.classList.add('is-in', 'is-set'); }
  else {
    io = new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { show(); o.disconnect(); } }, { threshold: 0.12 });
    io.observe(q('.t2-body'));
  }

  /* Stops with no address yet say so instead of going nowhere (the prototype's note). */
  const note = el('div', 'mt-note'); note.setAttribute('role', 'status'); sec.appendChild(note); let noteT = 0;
  on(sec, 'click', (e) => {
    const a = (e.target as Element).closest ? (e.target as Element).closest('[data-exp]') : null; if (!a) return;
    if (e instanceof MouseEvent && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    e.preventDefault();
    const name = (a.getAttribute('data-exp') || '').toLowerCase();
    if (Object.hasOwn(EXPERIENCE_STORIES, name)) { openExperience(name as ExperienceId); return; }
    note.textContent = 'This goes to the ' + a.getAttribute('data-exp') + ' page. That page only opens from inside the real site, so the link works once it is built into it.';
    note.classList.add('is-on'); clearTimeout(noteT); noteT = window.setTimeout(() => { note.classList.remove('is-on'); }, 4200);
  });

  /* For checking the page from a test: what is grown and how tall each stop is. */
  (sec as unknown as { __tl: unknown }).__tl = {
    fit,
    state: () => {
      let best = 0, bw = 0; cards.forEach((c, i) => { const w = parseFloat(c.style.getPropertyValue('--w')); if (w > bw) { bw = w; best = i; } });
      return { n, p: +state.p.toFixed(2), m: +state.m.toFixed(2), grown: bw > 1.5 ? stops[best].short : 'none', order: stops.map((s) => s.short),
        heights: cards.map((c) => Math.round(c.getBoundingClientRect().height)), peaks: peaks.map((v) => +v.toFixed(2)), needs, rooms, folds, drop: cards.map((c) => c.getAttribute('data-drop')), mark: mark.getAttribute('data-y') };
    }
  };

  return () => {
    dead = true;
    undo.forEach((f) => f());
    clearTimeout(rt); clearTimeout(showT); clearTimeout(noteT);
    cancelAnimationFrame(raf);
    if (io) io.disconnect();
    delete (sec as unknown as { __tl?: unknown }).__tl;
    /* put the empty shell back, so a second run (React StrictMode) starts clean */
    work.innerHTML = ''; school.innerHTML = ''; axis.innerHTML = ''; note.remove();
    if (lw) lw.textContent = ''; if (ls) ls.textContent = '';
    sec.classList.remove('is-in', 'is-set', 'is-fitting', 'is-sizing');
    sec.style.removeProperty('--n');
  };
}

/**
 * `armed` says the first screen has finished arriving and nothing is in motion (on the 3D home: the room is lit and the
 * wide view is up, not a fly-in, a poster or an open book). Building the timeline measures
 * every stop, which holds the page for a moment, so it waits for a quiet moment after that, or for the first sign the
 * visitor is heading down (a scroll, a key, a touch, a click on a link to it), whichever comes first.
 */
export default function TimelineSection({ armed = true }: { armed?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const build = useRef<() => void>(() => undefined);
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
  // the signs, for as long as the section is on the page
  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    let undo: (() => void) | undefined;
    const signs = ['scroll', 'wheel', 'touchstart', 'keydown'] as const;
    const onSign = () => build.current();
    const onClick = (event: Event) => { if ((event.target as Element | null)?.closest?.('a[href$="#timeline"]')) build.current(); };
    const stopWaiting = () => {
      signs.forEach((name) => window.removeEventListener(name, onSign));
      document.removeEventListener('click', onClick, true);
    };
    build.current = () => {
      if (undo) return;
      stopWaiting();
      undo = runTimeline(sec, openExperience);
    };
    signs.forEach((name) => window.addEventListener(name, onSign, { passive: true }));
    document.addEventListener('click', onClick, true);
    if (window.scrollY > 0 || window.location.hash === '#timeline') build.current();
    return () => { stopWaiting(); build.current = () => undefined; undo?.(); };
  }, [openExperience]);
  // the quiet moment, once the first screen's own arrival (the words rising in) is over
  useEffect(() => {
    if (!armed) return undefined;
    let idle = 0;
    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => build.current(), { timeout: 2000 });
      else build.current();
    }, 1600);
    return () => { window.clearTimeout(timer); if (idle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle); };
  }, [armed]);
  return <>
    <section className="mt-timeline" id="timeline" aria-label="Timeline" ref={ref}>
      <div className="t2-pin">
        <div className="t2-top">
          <h2>Timeline</h2>
          <p className="t2-sub">Newest at the top.<span className="t2-s"> <b>Scroll</b> to travel back through the years.</span><span className="t2-d"> <b>Click</b> any stop to open its page.</span><span className="t2-p"> <b>Tap</b> any stop to open its page.</span></p>
        </div>
        <div className="t2-body">
          <div className="t2-lane l-work"><p className="t2-lab"><b>Work</b><span></span></p><div className="t2-cards"></div></div>
          <div className="t2-rule" aria-hidden="true"><div className="t2-rule-in"></div></div>
          <div className="t2-lane l-school"><p className="t2-lab"><b>School</b><span></span></p><div className="t2-cards"></div></div>
        </div>
      </div>
    </section>
    <ExperienceStory id={experience} onClose={closeExperience} />
  </>;
}
