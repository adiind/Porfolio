// The clay road is the only navigation. Scroll draws it, one small car follows it, and six signs jump to the phases.
// r4: on desktop the road opens with a sweep across the page under the title, the car turns to face where it is going,
// and it pulls up larger, with a pool of light, when it reaches the Outcome scene.
// Reduced motion / ?static: the whole road is drawn, the car is parked at the end, the signs are simply there.
(() => {
  const root = document.documentElement, caseEl = document.getElementById('case'), svg = document.getElementById('journeySvg');
  const car = document.getElementById('journeyCar'), signsBox = document.getElementById('roadSigns'), glow = car.querySelector('b');
  const q = (s) => svg.querySelector(s);
  const drawn = ['.journey-shadow', '.journey-base', '.journey-surface', '.journey-reveal'].map(q);
  const detail = ['.journey-grain', '.journey-centre'].map(q);
  const forkPaths = ['.journey-fork-base', '.journey-branch', '.journey-branch-dash'].map(q);
  const forkReveal = q('.journey-fork-reveal');
  const stops = [...caseEl.querySelectorAll('.ph[data-journey-label]')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => media.matches || root.classList.contains('no-motion');
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (t) => t * t * (3 - 2 * t);
  gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

  const links = stops.map((section, i) => {
    const a = document.createElement('a');
    a.className = 'road-sign';
    a.href = '#' + section.id;
    a.setAttribute('aria-label', `Go to ${section.dataset.journeyLabel}`);
    a.innerHTML = `<span class="road-sign-in"><span class="road-sign-face"><b>0${i + 1}</b>${section.dataset.journeyLabel}</span><span class="road-sign-pole" aria-hidden="true"></span></span>`;
    signsBox.append(a);
    return a;
  });
  const moods = [...car.querySelectorAll('img')];

  // Signs pop in once, as their phase arrives.
  const signIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    signIO.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px' }) : null;
  links.forEach((a) => (signIO ? signIO.observe(a) : a.classList.add('in')));

  const local = (el) => { let x = 0, y = 0; for (let n = el; n && n !== caseEl; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return { x, y }; };
  const state = { p: 0 };
  // ys[i] is the page height at which the car should be ends[i] px along the road. off = 1 when the opening sweep exists.
  let points = [], ys = [], ends = [0], off = 0, total = 1, raw = null, caseTop = 0, forkAt = [0, 0], forkLen = 1;
  let active = -1, mood = -1, flipped = false, measureFrame = 0, trigger = null, glide = null, lastSize = '', lastFork = -1, lastMode = '', lastGlow = -1;

  function measure() {
    measureFrame = 0;
    if (!caseEl.offsetHeight) return;
    const mobile = innerWidth < 860, sweep = innerWidth >= 1000, W = caseEl.clientWidth;
    const xs = mobile ? [29, 29, 26, 31, 26, 29] : [196, 254, 196, 252, 200, 254];
    points = stops.map((section, i) => {
      const head = section.querySelector('.ph-head'), p = local(head);
      return { x: xs[i], y: p.y + Math.max(34, head.offsetHeight * .48), header: p.y };
    });
    const stage = stops.at(-1).querySelector('.out-grid .scene'), sp = stage ? local(stage) : { y: caseEl.offsetHeight - 300 };
    const endY = sp.y + (stage ? stage.offsetHeight * .7 : 260);
    const route = [...points, { x: mobile ? points.at(-1).x + 4 : 216, y: endY }];
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d = '';
    ends = [0];
    ys = [];
    off = sweep ? 1 : 0;
    if (sweep) {
      // Opening: the road comes in from the right, crosses the page in the gap under the title, and settles into its lane.
      const title = caseEl.querySelector('.case-head'), tp = local(title), tb = tp.y + title.offsetHeight, p0 = points[0], g = p0.y - tb;
      const a = { x: W - 190, y: tp.y + 24 };
      d = `M${a.x},${a.y} C${a.x + 30},${tb - 10} ${a.x - 10},${tb + g * .4} ${W * .64},${tb + g * .43} C${W * .4},${tb + g * .47} ${p0.x - 6},${p0.y - g * .62} ${p0.x},${p0.y}`;
      probe.setAttribute('d', d);
      ys.push(a.y);
      ends.push(probe.getTotalLength());
    } else d = `M${route[0].x},${route[0].y}`;
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1], b = route[i], gap = Math.max(90, b.y - a.y), sway = mobile ? 12 : 62;
      if (i === 1) d += ` C${a.x - (mobile ? 10 : 42)},${a.y + gap * .18} ${a.x + (mobile ? 13 : 52)},${a.y + gap * .36} ${a.x + (mobile ? 6 : 28)},${a.y + gap * .5} S${b.x + (mobile ? 10 : 44)},${b.y - gap * .22} ${b.x},${b.y}`;
      else if (i === 3) d += ` C${a.x + sway},${a.y + gap * .28} ${b.x - sway},${b.y - gap * .28} ${b.x},${b.y}`;
      else if (i === 5) { const loop = mobile ? 14 : 84; d += ` C${a.x + loop},${a.y + 70} ${a.x + loop},${a.y + 150} ${a.x},${a.y + 150} C${a.x - loop},${a.y + 150} ${a.x - loop},${a.y + 55} ${a.x},${a.y + 55} C${a.x + loop},${a.y + 55} ${a.x + loop},${a.y + 160} ${a.x},${a.y + 215} C${a.x},${a.y + gap * .48} ${b.x},${b.y - gap * .3} ${b.x},${b.y}`; }
      else { const curve = (i % 2 ? 1 : -1) * (mobile ? 10 : 32); d += ` C${a.x + curve},${a.y + gap * .3} ${b.x - curve},${b.y - gap * .3} ${b.x},${b.y}`; }
      probe.setAttribute('d', d);
      ys.push(a.y);
      ends.push(probe.getTotalLength());
    }
    ys.push(endY);
    total = ends.at(-1);
    svg.setAttribute('viewBox', `0 0 ${W} ${caseEl.offsetHeight}`);
    svg.querySelector('mask').setAttribute('width', W);
    svg.querySelector('mask').setAttribute('height', caseEl.offsetHeight);
    [...drawn, ...detail].forEach((path) => path.setAttribute('d', d));
    drawn.forEach((path) => { path.style.strokeDasharray = `${total} ${total}`; });
    // The synthesis fork: "two ways groups order" leaves the road and rejoins it.
    const a = points[2], side = mobile ? 22 : 74, fy = a.y + 24, merge = a.y + 172;
    const fd = `M${a.x},${fy} C${a.x + 8},${fy + 10} ${a.x + side},${fy + 16} ${a.x + side},${fy + 44} L${a.x + side},${merge - 36} C${a.x + side},${merge - 10} ${a.x + 9},${merge - 8} ${a.x},${merge}`;
    [...forkPaths, forkReveal].forEach((path) => path.setAttribute('d', fd));
    forkLen = forkReveal.getTotalLength();
    forkReveal.style.strokeDasharray = `${forkLen} ${forkLen}`;
    forkAt = [(ends[2 + off] + 20) / total, (ends[2 + off] + 240) / total];
    raw = MotionPathPlugin.getRawPath(d);
    MotionPathPlugin.cacheRawPathMeasurements(raw);
    caseTop = caseEl.getBoundingClientRect().top + scrollY;
    const signW = links[0].offsetWidth || 132;
    links.forEach((link, i) => {
      const p = points[i];
      link.style.left = (mobile ? p.x + 33 : p.x - 50 - signW) + 'px';
      link.style.top = (p.header + (mobile ? -27 : 20)) + 'px';
    });
    if (!glide) glide = gsap.quickTo(state, 'p', { duration: .28, ease: 'power2.out', onUpdate: render });
    if (!trigger) trigger = ScrollTrigger.create({ id: 'squad-road', trigger: caseEl, start: 'top bottom', end: 'bottom top', onUpdate: () => sync(false), onRefresh: schedule });
    lastSize = W + 'x' + caseEl.offsetHeight;
    lastFork = lastGlow = -1;
    sync(true);
  }

  // Where the reading line (35% down the viewport) sits along the road, 0–1. No layout reads.
  function wanted() {
    const reach = scrollY + innerHeight * .35 - caseTop;
    const here = points.reduce((n, p, k) => (reach >= p.header - innerHeight * .25 ? k : n), 0);
    if (here !== active) {
      active = here;
      links.forEach((link, k) => { link.classList.toggle('on', k === here); if (k === here) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    }
    if (reach <= ys[0]) return 0;
    let i = 0;
    while (i < ys.length - 2 && reach >= ys[i + 1]) i++;
    return clamp((ends[i] + (ends[i + 1] - ends[i]) * clamp((reach - ys[i]) / (ys[i + 1] - ys[i]))) / total);
  }
  function sync(now) {
    if (!raw) return;
    const target = wanted();
    if (now || still()) { glide?.tween?.pause(); state.p = still() ? 1 : target; render(); } else glide(target);
  }
  function render() {
    const p = state.p, off0 = total * (1 - p);
    drawn.forEach((path) => { path.style.strokeDashoffset = off0; });
    const forkOff = forkLen * (1 - clamp((p - forkAt[0]) / (forkAt[1] - forkAt[0])));
    if (forkOff !== lastFork) { lastFork = forkOff; forkReveal.style.strokeDashoffset = forkOff; }
    const at = MotionPathPlugin.getPositionOnPath(raw, p, true), rad = at.angle * Math.PI / 180;
    // The car art faces down-right. When the road heads left, it turns around (with a little hysteresis so it never flickers).
    const dx = Math.cos(rad);
    if (!flipped && dx < -.55) { flipped = true; car.classList.add('flip'); } else if (flipped && dx > -.2) { flipped = false; car.classList.remove('flip'); }
    const lean = Math.sin(rad - Math.PI / 2) * -7;
    // Arrival: over the last stretch the car eases up to full size and its light pool comes on.
    const arrive = ease(clamp((p - .972) / .028));
    car.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0) translate(-50%, -72%) rotate(${lean.toFixed(2)}deg) scale(${(1 + arrive * .42).toFixed(3)})`;
    const g = +arrive.toFixed(2);
    if (g !== lastGlow) { lastGlow = g; glow.style.opacity = g; }
    let m = 0;
    const len = p * total;
    for (let k = 1; k < points.length; k++) if (len >= ends[k + off] - 60) m = k;
    if (m !== mood) { mood = m; moods.forEach((img, k) => img.classList.toggle('on', k === m)); }
  }

  const schedule = () => { if (!measureFrame) measureFrame = requestAnimationFrame(measure); };
  addEventListener('resize', schedule, { passive: true });
  media.addEventListener('change', schedule);
  new ResizeObserver(() => { if (caseEl.clientWidth + 'x' + caseEl.offsetHeight !== lastSize) schedule(); }).observe(caseEl);
  // Lenis toggles classes on <html> while scrolling, so only a motion/gate change is worth a re-measure.
  const mode = () => `${root.classList.contains('no-motion')}|${root.classList.contains('gated')}`;
  lastMode = mode();
  new MutationObserver(() => { if (mode() !== lastMode) { lastMode = mode(); schedule(); } }).observe(root, { attributes: true, attributeFilter: ['class'] });
  document.fonts.ready.then(schedule);
  schedule();
  window.SquadJourney = { measure, sync, get points() { return points; }, get progress() { return state.p; }, get total() { return total; } };
})();
