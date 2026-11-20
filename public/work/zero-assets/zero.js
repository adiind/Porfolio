// Zero scroll story. Every scene is drawn straight from scroll position, so scrolling back rewinds it exactly.
// Small state changes (lane lit, voice picked) use CSS transitions; nothing runs on a timer loop.
(() => {
  const STATIC = document.documentElement.classList.contains('no-motion');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const span = (v, a, b) => clamp((v - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pulse = (v, [a, b, c, d]) => span(v, a, b) * (1 - span(v, c, d));
  const keyed = (keys, u) => {
    let k = 0;
    while (k < keys.length - 2 && u > keys[k + 1][0]) k++;
    return lerp(keys[k][1], keys[k + 1][1], ease(span(u, keys[k][0], keys[k + 1][0])));
  };
  const narrow = () => innerWidth <= 760 || innerWidth / innerHeight < 0.8;

  // Leaving the story: tell the portfolio shell when embedded, otherwise follow the link.
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.parent !== window) window.parent.postMessage({ type: 'zero-case-close' }, location.origin);
  });
  $$('[data-close]').forEach((a) => a.addEventListener('click', (e) => {
    if (window.parent !== window) { e.preventDefault(); window.parent.postMessage({ type: 'zero-case-close' }, location.origin); }
  }));

  /* ---------------- Film: hero → nine apps → one sentence through four stops ---------------- */
  const film = (() => {
    const pin = $('#s-film .pin');
    const hero = $('#hero'), consoleEl = $('#console'), chips = $$('#apps span');
    const lineApps = $('#lineApps'), lineEnd = $('#lineEnd'), say = $('#say'), sayType = $('#sayType');
    const pipe = $('#pipe'), pipeStops = $$('.pipe-st', pipe);
    const fanBlades = $('#fanBlades'), fanTemp = $('#fanTemp'), fanState = $('#fanState');
    const stations = $$('.station'), note = $('#filmNote'), more = $('#more');
    const SENTENCE = 'Monitor the bedroom temperature and turn off the fan below 18 degrees.';
    const ARRIVE = [2.55, 3.35, 4.15, 4.95];
    const STOP_AT = [0.06, 0.35, 0.65, 0.94]; // where each window sits along the pipe (0–1)
    const END = 6.9;
    const outroH = $('.outro-h'), partEls = $$('#parts a');

    if (STATIC) {
      sayType.textContent = SENTENCE;
      fanTemp.textContent = '17\u00b0'; fanState.textContent = 'fan off'; fanTemp.parentNode.classList.add('off');
      return () => {};
    }

    more.addEventListener('click', () => scrollBy({ top: innerHeight * 0.9, behavior: 'smooth' }));

    return (p) => {
      const u = p * END;
      const vw = pin.clientWidth, vh = pin.clientHeight, tall = narrow();

      // Hero copy slides out to the left.
      const out = ease(span(u, 0.12, 0.7));
      hero.style.transform = tall ? `translateY(${-out * 40}px)` : `translate(${-out * 120}px, -50%)`;
      hero.style.opacity = 1 - span(u, 0.12, 0.55);

      // Console: beside the copy → centre → gone.
      const heroW = tall ? Math.min(vw - 40, 520) : Math.min(vw * 0.44, 760);
      const heroTop = tall ? hero.offsetTop + hero.offsetHeight + 18 : 0;
      const heroX = tall ? (vw - heroW) / 2 : vw * 0.72 - heroW / 2;
      const heroY = tall ? Math.min(heroTop, vh - heroW * 0.62 - 20) : vh * 0.5 - (heroW * 0.617) / 2;
      const midW = tall ? Math.min(vw - 60, 420) : Math.min(vw * 0.36, 560);
      const midX = (vw - midW) / 2, midY = vh * (tall ? 0.36 : 0.4) - (midW * 0.617) / 2;
      const m = ease(span(u, 0.15, 0.8));
      const w = lerp(heroW, midW, m);
      consoleEl.style.width = w + 'px';
      consoleEl.style.transform = `translate(${lerp(heroX, midX, m)}px, ${lerp(heroY, midY, m)}px) scale(${1 - 0.12 * span(u, 1.15, 1.45)})`;
      consoleEl.style.opacity = 1 - span(u, 1.35, 1.6);
      consoleEl.querySelector('figcaption').style.opacity = 1 - span(u, 0.1, 0.4);

      // Nine apps ring the console, then get pulled into it.
      const cx = midX + midW / 2, cy = midY + (midW * 0.617) / 2;
      const show = span(u, 0.6, 0.9), pull = ease(span(u, 1.0, 1.38));
      chips.forEach((chip, i) => {
        const a = (i / chips.length) * Math.PI * 2 - Math.PI / 2 + 0.3;
        const rx = tall ? vw * 0.27 : vw * 0.36, ry = tall ? vh * 0.27 : vh * 0.33;
        const sx = cx + Math.cos(a) * rx, sy = cy + Math.sin(a) * ry;
        const x = lerp(sx, cx, pull), y = lerp(sy, cy, pull);
        const appear = span(show, i * 0.06, i * 0.06 + 0.45);
        chip.style.opacity = appear * (1 - span(pull, 0.75, 1));
        chip.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${lerp(0.8, 1, appear) * (1 - 0.6 * pull)})`;
      });
      lineApps.style.opacity = pulse(u, [0.68, 0.88, 1.32, 1.52]);
      lineApps.style.transform = `translateY(${(1 - span(u, 0.68, 0.88)) * 14}px)`;

      // The sentence types itself, then rides up a little to make room for the path.
      say.style.opacity = span(u, 1.5, 1.7) * (1 - span(u, 5.45, 5.65));
      const typed = Math.round(SENTENCE.length * span(u, 1.62, 2.2));
      if (sayType.textContent.length !== typed) sayType.textContent = SENTENCE.slice(0, typed);
      say.style.transform = `translateX(-50%) translateY(${-span(u, 2.15, 2.45) * (tall ? 10 : 22)}px) scale(${1 - 0.18 * span(u, 2.15, 2.45)})`;

      // The brass pipe: a capsule carries the sentence past four windows.
      const pathOn = span(u, 2.15, 2.45) * (1 - span(u, 5.45, 5.65));
      pipe.style.opacity = pathOn;
      const keys = [[2.3, 0]];
      ARRIVE.forEach((a, i) => keys.push([a, STOP_AT[i]], [a + 0.45, STOP_AT[i]]));
      pipe.style.setProperty('--t', keyed(keys, u));
      pipeStops.forEach((el, i) => el.classList.toggle('on', u >= ARRIVE[i] - 0.1));
      stations.forEach((el, i) => {
        const a = ARRIVE[i];
        const o = pulse(u, [a - 0.12, a + 0.05, a + 0.62, a + 0.76]);
        el.style.opacity = o;
        el.style.transform = `translateX(-50%) translateY(${(1 - span(u, a - 0.12, a + 0.05)) * 18}px)`;
      });
      // Last stop: the room cools from 21 to 17 degrees. At 18 the fan winds down and stops.
      const cool = span(u, 4.98, 5.5), temp = lerp(21, 17, cool), u0 = 4.98 + 0.52 * 0.76, d = 0.12, K = 2600;
      const wind = Math.min(Math.max(0, u - u0), d);
      fanBlades.style.setProperty('--rot', K * (Math.min(u, u0) - 4.7) + K * (wind - (wind * wind) / (2 * d)) + 'deg');
      fanTemp.textContent = Math.round(temp) + '\u00b0';
      fanState.textContent = temp < 18 ? 'fan off' : 'fan on';
      fanTemp.parentNode.classList.toggle('off', temp < 18);
      note.style.opacity = pulse(u, [2.4, 2.6, 5.4, 5.6]) * 0.9;
      // Hand-over: the six parts line up on the desk, one by one.
      const oIn = span(u, 5.7, 5.95);
      lineEnd.style.opacity = oIn;
      lineEnd.style.pointerEvents = oIn > 0.9 ? 'auto' : 'none';
      outroH.style.transform = `translateY(${(1 - ease(oIn)) * 18}px)`;
      partEls.forEach((el, i) => {
        const t = ease(span(u, 5.85 + i * 0.1, 6.15 + i * 0.1));
        el.style.opacity = t;
        el.style.transform = `translateY(${(1 - t) * 70}px) rotate(${(1 - t) * (i % 2 ? 7 : -7)}deg) scale(${lerp(0.8, 1, t)})`;
        el.classList.toggle('on', t > 0.92);
      });
      more.style.opacity = 1 - span(u, 6.5, 6.75);
    };
  })();

  /* ---------------- Engine ---------------- */
  const SCENES = Object.assign({ film }, window.ZeroParts({ $, $$, clamp, span, ease, lerp, pulse, keyed, narrow, STATIC }));
  const sections = $$('[data-scene]');
  const railLinks = $$('#railList a'), railFill = $('#railFill'), railBar = $('#railBar'), railCap = $('#railCap');
  let dots = [0];
  // The tracker's studs are evenly spaced but chapters are not, so the capsule's position is worked out chapter by chapter.
  const measureRail = () => {
    dots = railLinks.map((a) => a.parentNode.offsetTop + a.parentNode.offsetHeight / 2);
    railBar.style.top = dots[0] + 'px';
    railBar.style.height = dots[dots.length - 1] - dots[0] + 'px';
  };
  railLinks.forEach((a, i) => a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo({ top: document.getElementById(a.dataset.ch).offsetTop + (i ? 2 : 0), behavior: STATIC ? 'auto' : 'smooth' });
  }));
  $$('#parts a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo({ top: document.querySelector(a.getAttribute('href')).offsetTop + 2, behavior: STATIC ? 'auto' : 'smooth' });
  }));
  const chapters = railLinks.map((a) => document.getElementById(a.dataset.ch));
  let frame = 0;

  function render() {
    frame = 0;
    const vh = innerHeight;
    sections.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const max = sec.offsetHeight - vh;
      const p = max > 0 ? clamp(-r.top / max) : 1;
      SCENES[sec.dataset.scene](p);
    });
    // Chapter rail: the section that holds the middle of the screen is current.
    let cur = 0;
    chapters.forEach((c, i) => { if (c.getBoundingClientRect().top <= vh * 0.5) cur = i; });
    railLinks.forEach((a, i) => { a.classList.toggle('on', i === cur); a.classList.toggle('past', i < cur); });
    const doc = document.documentElement;
    const mid = scrollY + vh * 0.5, last = chapters.length - 1;
    let y = dots[cur] || 0;
    if (cur < last) y = lerp(dots[cur], dots[cur + 1], clamp((mid - chapters[cur].offsetTop) / (chapters[cur + 1].offsetTop - chapters[cur].offsetTop)));
    railFill.style.height = y - dots[0] + 'px';
    railCap.style.top = y - dots[0] + 'px';
    doc.style.setProperty('--prog', clamp(scrollY / (doc.scrollHeight - vh)));
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { measureRail(); schedule(); });
  document.fonts && document.fonts.ready.then(() => { measureRail(); schedule(); });
  addEventListener('load', () => { measureRail(); schedule(); });
  measureRail();
  render();
})();
