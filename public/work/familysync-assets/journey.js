/* Journey map geometry. One thread travels lane by lane (Stacy → FamilySync → Services,
   then back up for the next stage); Stacy's feeling is one solid line coloured from strain
   to calm; the active column is lit in its service colour. motion.js feeds scroll progress;
   with reduced motion the whole map is drawn once, complete. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const board = $('[data-journey-board]');
  if (!board) return;
  const curve = $('[data-journey-curve]', board), thread = $('[data-journey-thread]', board);
  const list = $('.journey-stages', board);
  const stages = $$('.journey-stage', board);
  const clock = $('[data-journey-clock]'), nowLabel = $('[data-journey-now]');
  const journey = board.closest('.journey');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (parent, tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    parent.appendChild(n);
    return n;
  };
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  // Catmull-Rom through the points as cubic Béziers: calm, no overshoot spikes.
  const smooth = (pts) => pts.reduce((d, p, i) => {
    if (!i) return `M${p[0]} ${p[1]}`;
    const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p;
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
    const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
    return `${d} C${c1} ${c2} ${p}`;
  }, '');
  const css = (s, name) => getComputedStyle(s).getPropertyValue(name).trim();
  // Feeling colour: strain (red) → unsettled (amber) → calm (green). Text uses the darker inks.
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => `#${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
  const ramp = (t, low, mid, high) => (t < 0.5 ? mix(low, mid, t * 2) : mix(mid, high, (t - 0.5) * 2));
  const feels = stages.map((s) => +s.dataset.feel);
  const lo = Math.min(...feels), hi = Math.max(...feels);
  const norm = feels.map((f) => (f - lo) / (hi - lo));
  stages.forEach((s, i) => {
    s.style.setProperty('--feel-c', ramp(norm[i], '#d9502e', '#e3a42c', '#1f9a52'));
    s.style.setProperty('--feel-ink', ramp(norm[i], '#a8381b', '#7a4f05', '#17703c'));
  });

  let geo = null, progress = still ? 1 : 0, vertical = false, last = -1;

  function layout() {
    vertical = innerWidth < 1024;
    curve.textContent = ''; thread.textContent = '';
    const B = board.getBoundingClientRect(), C = curve.getBoundingClientRect();
    const cols = stages.map((s) => { const r = s.getBoundingClientRect(); return { x: r.left - B.left, w: r.width }; });
    board.style.setProperty('--col-w', `${cols[0].w}px`);

    // Stacy's feeling line.
    const pts = stages.map((s, i) => {
      if (vertical) {
        const d = $('.journey-dot', s).getBoundingClientRect();
        const x = 12 + norm[i] * 22;
        s.style.setProperty('--dot-x', `${x - 14 - parseFloat(getComputedStyle(list).paddingLeft)}px`);
        return [x, d.top + d.height / 2 - C.top];
      }
      return [cols[i].x + cols[i].w / 2 - (C.left - B.left), 22 + (1 - norm[i]) * 80];
    });
    curve.setAttribute('viewBox', `0 0 ${Math.max(1, C.width)} ${Math.max(1, C.height)}`);
    const defs = el(curve, 'defs');
    const a = vertical ? 1 : 0;
    const grad = el(defs, 'linearGradient', { id: 'fs-feel', gradientUnits: 'userSpaceOnUse',
      x1: a ? 0 : pts[0][0], y1: a ? pts[0][1] : 0, x2: a ? 0 : pts[6][0], y2: a ? pts[6][1] : 0 });
    const span = (pts[6][a] - pts[0][a]) || 1;
    pts.forEach((p, i) => el(grad, 'stop', { offset: clamp((p[a] - pts[0][a]) / span), 'stop-color': css(stages[i], '--feel-c') }));
    const line = smooth(pts);
    if (!vertical) el(curve, 'path', { class: 'c-area', d: `${line} L${pts[6][0]} ${C.height} L${pts[0][0]} ${C.height}Z`, fill: 'url(#fs-feel)' });
    el(curve, 'path', { class: 'c-line', d: line, stroke: 'url(#fs-feel)' });
    if (!vertical) {
      pts.forEach((p, i) => {
        const peak = stages[i].dataset.peak;
        el(curve, 'circle', { class: 'c-dot', cx: p[0], cy: p[1], r: peak ? 8 : 5.5, fill: css(stages[i], '--feel-c') });
        if (!peak) return;
        // Labels sit straight above or below their dot, clear of the travelling thread.
        const t = el(curve, 'text', { class: 'c-peak', x: p[0], y: peak === 'low' ? p[1] + 25 : p[1] - 16,
          'text-anchor': 'middle', fill: css(stages[i], '--feel-ink') });
        t.textContent = peak === 'low' ? 'Low point' : 'High point';
      });
    }
    const here = vertical ? null : el(curve, 'circle', { class: 'c-here', cx: 0, cy: 0, r: 12 });

    // The thread: one smooth line, lane by lane, down through one stage and up through the next.
    // It turns in wide curves below the service labels and above the Stacy lane, never over text,
    // and its colour shifts to each stage's service colour where it passes that column.
    const nodes = [];
    let line2 = null, marks = [];
    if (!vertical) {
      const at = (s, sel) => $(sel, s).getBoundingClientRect().top - B.top;
      // Straight runs through the lanes; each turn is one wide cubic, deep below the service
      // labels and shallow above the Stacy lane.
      let d = '';
      const ends = [];
      stages.forEach((s, i) => {
        const x = cols[i].x + 18;
        const tile = $('.svc-tile', s).getBoundingClientRect();
        const lanes = [[x, at(s, '.stacy') + 21], [x, at(s, '.agent') + 21], [x, tile.top + tile.height / 2 - B.top]];
        const path = i % 2 ? lanes.reverse() : lanes;
        nodes.push(path);
        if (!i) d = `M${path[0]}`;
        else {
          const from = nodes[i - 1][2], turn = i % 2 ? B.height - 10 : at(s, '.stacy') - 14;
          d += ` C${from[0]} ${turn} ${path[0][0]} ${turn} ${path[0]}`;
        }
        d += ` L${path[1]} L${path[2]}`;
        ends.push(d);
      });
      const tgrad = el(el(thread, 'defs'), 'linearGradient', { id: 'fs-thread', gradientUnits: 'userSpaceOnUse', x1: cols[0].x + 18, y1: 0, x2: cols[6].x + 18, y2: 0 });
      stages.forEach((s, i) => el(tgrad, 'stop', { offset: i / 6, 'stop-color': css(s, '--c') }));
      line2 = el(thread, 'path', { class: 't-line', d, stroke: 'url(#fs-thread)' });
      // Length along the line at the end of each stage's lanes, so drawing can stop exactly there.
      const probe = el(thread, 'path', { d: '' });
      marks = ends.map((p) => { probe.setAttribute('d', p); return probe.getTotalLength(); });
      probe.remove();
      const total = line2.getTotalLength();
      line2.setAttribute('stroke-dasharray', `${total} ${total}`);
      line2.dataset.total = total;
      nodes.forEach((path, i) => { nodes[i] = path.map((p) => el(thread, 'circle', { class: 't-node', cx: p[0], cy: p[1], r: 0, fill: css(stages[i], '--c') })); });
    }
    thread.setAttribute('viewBox', `0 0 ${Math.max(1, B.width)} ${Math.max(1, B.height)}`);
    geo = { pts, cols, line2, marks, nodes, here };
    last = -1;
    set(progress);
  }

  function set(p) {
    progress = clamp(p);
    if (!geo) return;
    const { pts, cols, line2, marks, nodes, here } = geo;
    // The thread reaches the last stage a touch before the scroll does.
    const reach = clamp(progress / 0.94), h = reach * 6;
    const active = Math.round(progress * 6);
    if (line2) {
      const k = Math.min(5, Math.floor(h)), len = marks[k] + (marks[k + 1] - marks[k]) * (h - k);
      line2.setAttribute('stroke-dashoffset', +line2.dataset.total - len);
    }
    if (here) {
      const k = Math.min(5, Math.floor(h)), f = h - k;
      const x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
      here.setAttribute('transform', `translate(${x} ${y})`);
    }
    journey.style.setProperty('--ruler', reach.toFixed(3));
    // Only the deck's own times show: 11:00, the three-minute window to 11:03, and 15:00.
    const s = stages[active];
    // Stages without a deck time show no time at all.
    clock.textContent = active <= 1 ? `11:0${Math.min(3, Math.round(h * 1.5))}` : s.dataset.clock || '';
    if (active === last) return;
    last = active;
    stages.forEach((st, i) => {
      st.classList.toggle('reached', i <= active);
      st.classList.toggle('active', i === active);
      $('[data-journey-go]', st).setAttribute('aria-current', i === active ? 'step' : 'false');
      (nodes[i] || []).forEach((n) => n.setAttribute('r', i <= active ? 4.5 : 0));
    });
    board.style.setProperty('--spot-x', `${cols[active].x - cols[0].x}px`);
    journey.style.setProperty('--now-c', css(s, '--c'));
    journey.style.setProperty('--now-ink', css(s, '--c-ink'));
    if (here) here.setAttribute('stroke', css(s, '--c'));
    nowLabel.textContent = `${String(active + 1).padStart(2, '0')} · ${$('h4', s).textContent}`;
  }

  window.fsJourney = { set, layout, stages };
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120); });
  document.fonts?.ready.then(layout);
  addEventListener('load', layout);
  layout();
})();
