/* Scroll auto-complete. A scroll that loses steam between two finished scenes is carried on to the nearest one by a soft spring,
   so nobody is left stranded halfway through a transition they did not know was a transition.

   ScrollSettle.init({
     scroller: window | element        // what scrolls (default window)
     rests: () => [{ y, strong?, g?, r? }]  // finished positions in scroll px. strong: the gap to the next strong rest is a
                                        // pinned/animated stretch (same g group), so it always completes. Otherwise it only settles when
                                        // within r px (default 28% of the viewport) of a rest, leaving normal reading alone.
     enabled: () => boolean             // optional gate (e.g. an overlay is open)
     getScroll / setScroll              // optional, for scrollers with their own driver (Lenis)
   }) -> { advance(), destroy() }

   Behaviour (all measured with a simulated trackpad rig, see REPORT.md):
   - nothing happens while the reader is still pushing; it takes over only as momentum fades, or after ~130 ms of stillness
   - a critically-damped-ish spring (ZETA .74) chases a target that eases off the start, so it never lurches, and settles with a
     small soft overshoot
   - decaying trackpad momentum events are swallowed while landing; any new deliberate push cancels it at once
   - steady mouse-wheel notches are never mistaken for momentum
   - off for reduced motion */
(function () {
  const ZETA = 0.74, RAMP = 0.26, HANDOFF = 520;

  function init(opts) {
    const o = opts || {};
    const scroller = o.scroller || window;
    const isWin = scroller === window;
    const evt = isWin ? window : scroller;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const getScroll = o.getScroll || (() => (isWin ? window.scrollY : scroller.scrollTop));
    const rawSet = o.setScroll || ((y) => (isWin ? window.scrollTo({ top: y, behavior: 'instant' }) : (scroller.scrollTop = y)));
    const viewH = () => (isWin ? window.innerHeight : scroller.clientHeight);
    const dpr = () => window.devicePixelRatio || 1;
    const px = (v) => Math.round(v * dpr()) / dpr();
    const log = (e) => { if (window.__pgDebug) (window.__pgLog = window.__pgLog || []).push(e); };
    const on = () => !reduced.matches && (!o.enabled || o.enabled());

    let lastInput = 0, touching = false, from = null, spring = null, watching = 0, samples = [], gestureAt = 0, lastT = 0;
    let lastDy = 0, lastWheelAt = 0, fade = 0, destroyed = false;
    const cleanups = [];
    const listen = (t, fn, op) => { evt.addEventListener(t, fn, op); cleanups.push(() => evt.removeEventListener(t, fn, op)); };

    const input = () => { lastInput = performance.now(); spring = null; };
    // Capture phase: a momentum event we swallow must never reach a smooth-scroll library (Lenis) listening further down.
    listen('wheel', (ev) => {
      const now = performance.now(), dy = ev.deltaY;
      fade = Math.sign(dy) === Math.sign(lastDy) && Math.abs(dy) < Math.abs(lastDy) ? fade + 1 : 0;
      const tail = spring && now - lastWheelAt < 220 && Math.sign(dy) === Math.sign(lastDy) && Math.abs(dy) < Math.abs(lastDy) && Math.abs(dy) < 60;
      lastDy = dy; lastWheelAt = now;
      if (tail) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
      log({ t: Math.round(now), cancel: 1, dy, spring: !!spring });
      input();
    }, { passive: false, capture: true });
    ['keydown', 'pointerdown'].forEach((t) => listen(t, input, { passive: true }));
    listen('touchstart', () => { touching = true; input(); }, { passive: true });
    ['touchend', 'touchcancel'].forEach((t) => listen(t, () => { touching = false; }, { passive: true }));

    const speed = (now, y) => {
      samples.push([now, y]);
      while (samples.length > 2 && now - samples[0][0] > 90) samples.shift();
      const [t0, y0] = samples[0];
      return now > t0 ? ((y - y0) / (now - t0)) * 1000 : 0;
    };

    // Where should a scroll that has stopped at y go? null = leave it where it is.
    const target = (y0, v) => {
      const y = y0 + v * 0.25;   // where the momentum still left in the scroll would carry it: decide on that, not on where it is now
      const list = (o.rests ? o.rests() : []).slice().sort((a, b) => a.y - b.y);
      if (list.length < 2) return null;
      let k = -1;
      for (let i = 0; i < list.length; i++) if (list[i].y <= y + 0.5) k = i;
      if (k < 0 || k >= list.length - 1) return null;
      const lo = list[k], hi = list[k + 1], f = (y - lo.y) / (hi.y - lo.y);
      const down = from === null ? v >= 0 : y0 >= from;
      if (lo.strong && hi.strong && lo.g === hi.g) return Math.round((down ? f > 0.33 : f > 0.67) ? hi.y : lo.y);
      const near = f < 0.5 ? lo : hi, radius = near.r != null ? near.r : viewH() * 0.28;
      return Math.abs(near.y - y) <= radius ? Math.round(near.y) : null;
    };

    const startSpring = (now, y, v, t) => {
      const dist = Math.abs(t - y), T = Math.min(0.85, 0.42 + dist / 2200);
      spring = { x: y, y0: y, v, t, at: now, w: 4.2 / (ZETA * T) };
      log({ t: Math.round(now), start: 1, y, v, target: t, w: spring.w });
    };

    const frame = (now) => {
      if (destroyed) return;
      const dt = Math.min(0.032, Math.max(0.001, (now - (lastT || now - 16)) / 1000));
      lastT = now;
      const y = getScroll();
      if (!on()) { spring = null; from = null; samples = []; }
      if (spring) {
        const w = spring.w, e = Math.min(1, (now - spring.at) / 1000 / RAMP), te = spring.y0 + (spring.t - spring.y0) * e * e * (3 - 2 * e);
        for (let i = 0, n = Math.ceil(dt / 0.004); i < n; i++) {
          const h = dt / n, acc = -w * w * (spring.x - te) - 2 * ZETA * w * spring.v;
          spring.v += acc * h; spring.x += spring.v * h;
        }
        const done = e >= 1 && Math.abs(spring.x - spring.t) < 0.4 && Math.abs(spring.v) < 6;
        rawSet(px(done ? spring.t : spring.x));
        log({ t: Math.round(now), y: spring.x, v: spring.v, s: 1 });
        if (done) { spring = null; from = null; samples = []; }
        watching = requestAnimationFrame(frame); return;
      }
      const v = speed(now, y);
      if (from === null && samples.length > 1 && Math.abs(samples[0][1] - y) > 0.5) from = samples[0][1];
      if (from === null) gestureAt = now;
      const recent = now - lastInput < 1500;
      log({ t: Math.round(now), y, v, s: 0 });
      const dying = Math.abs(v) < HANDOFF && ((fade >= 3 && now - lastWheelAt < 100) || now - lastInput > 130) && now - gestureAt > 90;
      const committed = from !== null && (Math.abs(y - from) >= 24 || now - lastInput > 400);
      if (from !== null && recent && !touching && dying && committed && on()) {
        const t = target(y, v);
        if (t !== null && Math.abs(t - y) >= 3) startSpring(now, y, v, t); else from = null;
      } else if (from !== null && !recent) from = null;
      if (from === null && now - lastInput > 2000) { watching = 0; samples = []; return; }
      watching = requestAnimationFrame(frame);
    };
    const wake = () => { if (!watching && !destroyed) { lastT = 0; samples = []; watching = requestAnimationFrame(frame); } };
    ['wheel', 'touchstart', 'keydown', 'pointerdown', 'scroll'].forEach((t) => listen(t, wake, { passive: true }));
    wake();

    const advance = () => {
      const y = getScroll();
      const next = (o.rests ? o.rests() : []).filter((r) => r.y > y + viewH() * 0.05).sort((a, b) => a.y - b.y)[0];
      if (!next) return;
      if (!on()) { rawSet(Math.round(next.y)); return; }
      lastInput = performance.now(); from = y; samples = [];
      startSpring(performance.now(), y, 0, Math.round(next.y));
      wake();
    };
    return { advance, destroy() { destroyed = true; cancelAnimationFrame(watching); cleanups.forEach((f) => f()); } };
  }

  /* "Keep scrolling" pill: says there is more, and how far along you are.
     ScrollSettle.pill({ progress: () => 0..1, show: () => bool, onClick, label, scroller }) */
  function pill(opts) {
    const o = opts || {};
    if (!document.getElementById('ss-pill-css')) {
      const st = document.createElement('style');
      st.id = 'ss-pill-css';
      st.textContent = `.ss-pill{position:fixed;left:50%;bottom:20px;z-index:2147483000;transform:translate(-50%,12px);display:grid;grid-template-columns:auto auto;align-items:center;column-gap:8px;row-gap:6px;min-height:44px;padding:10px 18px 8px;border:0;border-radius:22px;background:var(--ss-bg,#1b2a4a);color:var(--ss-fg,#f4eee3);font:600 13px/1 var(--ss-font,system-ui,sans-serif);cursor:pointer;opacity:0;visibility:hidden;transition:opacity .35s,transform .35s,visibility .35s;box-shadow:0 0 0 1px rgba(255,255,255,.22)}.ss-pill.on{opacity:1;visibility:visible;transform:translate(-50%,0)}.ss-pill b{grid-column:1/-1;display:block;height:2px;border-radius:2px;background:rgba(255,255,255,.25);overflow:hidden}.ss-pill i{display:block;height:100%;background:var(--ss-accent,#e0684a);transform-origin:left;transform:scaleX(0)}.ss-pill.nudge svg{animation:ss-bob 1.3s ease-in-out infinite}.ss-pill:focus-visible{outline:2px solid var(--ss-accent,#e0684a);outline-offset:3px}@keyframes ss-bob{50%{transform:translateY(3px)}}@media(max-width:600px){.ss-pill{bottom:calc(12px + var(--ss-lift,0px));min-height:40px;padding:9px 14px 7px;font-size:12px}}@media(min-width:601px){.ss-pill{bottom:calc(20px + var(--ss-lift,0px))}}@media(prefers-reduced-motion:reduce){.ss-pill.nudge svg{animation:none}.ss-pill{transition:none}}`;
      document.head.appendChild(st);
    }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ss-pill'; b.setAttribute('aria-label', o.aria || 'Keep scrolling to the next scene');
    b.innerHTML = `<span>${o.label || 'Keep scrolling'}</span><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v9m0 0L3 7m4 4l4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><b aria-hidden="true"><i></i></b>`;
    (o.host || document.body).appendChild(b);
    const fill = b.querySelector('i');
    let nudge = 0;
    const sync = () => {
      b.classList.toggle('on', !!(o.show ? o.show() : true));
      fill.style.transform = `scaleX(${Math.max(0, Math.min(1, o.progress ? o.progress() : 0)).toFixed(3)})`;
      b.classList.remove('nudge'); clearTimeout(nudge); nudge = setTimeout(() => b.classList.add('nudge'), 1400);
    };
    b.addEventListener('click', () => o.onClick && o.onClick());
    const src = o.scroller || window;
    src.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
    return { sync, el: b, destroy() { src.removeEventListener('scroll', sync); removeEventListener('resize', sync); b.remove(); } };
  }

  window.ScrollSettle = { init, pill };
})();
