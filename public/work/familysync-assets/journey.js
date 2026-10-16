/* Journey map geometry: Stacy's feeling drawn as one curve across the seven stages.
   This file only draws and sets state. motion.js feeds it scroll progress; with reduced
   motion it is drawn once, complete. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const board = $('[data-journey-board]');
  if (!board) return;
  const svg = $('[data-journey-curve]', board);
  const list = $('.journey-stages', board);
  const stages = $$('.journey-stage', board);
  const clock = $('[data-journey-clock]'), nowLabel = $('[data-journey-now]');
  const journey = board.closest('.journey');
  const el = (tag, attrs = {}, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    parent.appendChild(n);
    return n;
  };
  // Catmull-Rom through the points, as cubic Béziers: a calm curve with no overshoot spikes.
  const smooth = (pts) => pts.reduce((d, p, i) => {
    if (!i) return `M${p[0]} ${p[1]}`;
    const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p;
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
    const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
    return `${d} C${c1} ${c2} ${p}`;
  }, '');
  const colour = (s, name) => getComputedStyle(s).getPropertyValue(name).trim();

  let geo = null, progress = 1, vertical = false;
  function layout() {
    vertical = innerWidth < 1024;
    svg.textContent = '';
    const box = svg.getBoundingClientRect();
    const feels = stages.map((s) => +s.dataset.feel), lo = Math.min(...feels), hi = Math.max(...feels);
    const pts = stages.map((s) => {
      const feel = +s.dataset.feel;
      if (vertical) {
        const dot = $('.journey-dot', s), d = dot.getBoundingClientRect();
        const x = 14 + feel * 20;
        // The numbered dot rides on the curve: further right is a better moment for Stacy.
        s.style.setProperty('--dot-x', `${x - 14 - parseFloat(getComputedStyle(list).paddingLeft)}px`);
        return [x, d.top + d.height / 2 - box.top];
      }
      const r = s.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, 22 + (1 - (feel - lo) / (hi - lo)) * 96];
    });
    if (vertical) {
      // Re-measure y after the dots moved sideways (their y does not change, but stay exact).
      stages.forEach((s, i) => { const d = $('.journey-dot', s).getBoundingClientRect(); pts[i][1] = d.top + d.height / 2 - box.top; });
    }
    svg.setAttribute('viewBox', `0 0 ${Math.max(1, box.width)} ${Math.max(1, box.height)}`);
    const defs = el('defs');
    const grad = el('linearGradient', { id: 'fs-feel', gradientUnits: 'userSpaceOnUse',
      x1: vertical ? 0 : pts[0][0], y1: vertical ? pts[0][1] : 0,
      x2: vertical ? 0 : pts[6][0], y2: vertical ? pts[6][1] : 0 }, defs);
    stages.forEach((s, i) => el('stop', { offset: i / 6, 'stop-color': colour(s, '--c') }, grad));
    const line = smooth(pts);
    el('path', { class: 'c-base', d: line });
    // The drawn part is clipped by a rect in the SVG's own coordinates, so it ends exactly at the head.
    const head = el('rect', { x: -40, y: -40, width: 0, height: 0 }, el('clipPath', { id: 'fs-head', clipPathUnits: 'userSpaceOnUse' }, defs));
    const live = el('g', { class: 'c-live', 'clip-path': 'url(#fs-head)' });
    if (!vertical) {
      const floor = box.height - 2;
      el('path', { class: 'c-area', d: `${line} L${pts[6][0]} ${floor} L${pts[0][0]} ${floor}Z`, fill: 'url(#fs-feel)' }, live);
    }
    el('path', { class: 'c-line', d: line, stroke: 'url(#fs-feel)' }, live);
    const dots = pts.map((p, i) => el('circle', { class: 'c-dot', cx: p[0], cy: p[1], r: 0, fill: colour(stages[i], '--c') }));
    const marks = [];
    if (!vertical) stages.forEach((s, i) => {
      if (!s.dataset.peak) return;
      const low = s.dataset.peak === 'low';
      // Low point sits above its dot; the high point reads in from the left, clear of the playhead.
      const t = el('text', { class: 'c-peak c-mark', x: low ? pts[i][0] : pts[i][0] - 14, y: low ? pts[i][1] - 16 : pts[i][1] + 4,
        'text-anchor': low ? 'middle' : 'end', fill: colour(s, '--c-ink') });
      t.textContent = low ? 'Low point' : 'High point';
      marks[i] = t;
    });
    if (vertical) dots.forEach((d) => d.setAttribute('display', 'none'));
    geo = { pts, head, dots, marks, h: box.height, w: box.width };
    set(progress, true);
  }

  let last = -1;
  function set(p, force) {
    progress = Math.min(1, Math.max(0, p));
    if (!geo) return;
    const { pts, dots, marks } = geo;
    const active = Math.round(progress * 6);
    // The line reaches the last stage a touch before the scroll does, so the end never looks unfinished.
    const reach = Math.min(1, progress / 0.94);
    if (vertical) {
      const y = pts[0][1] + (pts[6][1] - pts[0][1]) * reach;
      geo.head.setAttribute('width', geo.w + 80); geo.head.setAttribute('height', y + 40);
    } else {
      const x = pts[0][0] + (pts[6][0] - pts[0][0]) * reach;
      geo.head.setAttribute('width', x + 40); geo.head.setAttribute('height', geo.h + 80);
      board.style.setProperty('--head-px', `${x}px`);
      // The playhead drops from the top of the row onto the curve, never through the words.
      const k = Math.min(5, Math.floor(reach * 6)), f = reach * 6 - k;
      board.style.setProperty('--head-y', `${pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f}px`);
    }
    if (active === last && !force) return;
    last = active;
    stages.forEach((s, i) => {
      s.classList.toggle('reached', i <= active);
      s.classList.toggle('active', i === active);
      $('[data-journey-go]', s).setAttribute('aria-current', i === active ? 'step' : 'false');
      dots[i].setAttribute('r', i <= active ? (i === active ? 7 : 5) : 0);
      if (marks[i]) marks[i].classList.toggle('on', i <= active);
    });
    const s = stages[active];
    board.style.setProperty('--now-c', colour(s, '--c'));
    journey.style.setProperty('--now-ink', colour(s, '--c-ink'));
    clock.textContent = s.dataset.clock;
    nowLabel.textContent = `${String(active + 1).padStart(2, '0')} · ${$('h4', s).textContent}`;
  }

  window.fsJourney = { set, layout, stages, get vertical() { return vertical; } };
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120); });
  document.fonts?.ready.then(layout);
  addEventListener('load', layout);
  layout();
})();
