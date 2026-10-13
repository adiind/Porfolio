// Scroll feel and section motion for the case study. Everything here is transform/opacity only.
// Reduced motion / ?static: none of this runs; the page is static and fully readable.
(() => {
  const S = window.Squad;
  if (!S || !window.gsap || !window.ScrollTrigger) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  // ---------- Lenis: smooth wheel scrolling on desktop. Touch devices keep native scrolling. ----------
  let lenis = null;
  const tick = (t) => lenis?.raf(t * 1000);
  function startLenis() {
    if (lenis || S.still() || !window.Lenis || !fine.matches) return;
    lenis = window.lenis = new Lenis({ lerp: .11, autoRaf: false, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  function stopLenis() {
    if (!lenis) return;
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = null;
    delete window.lenis;
  }
  startLenis();
  // A modal owns the wheel while it is open.
  document.querySelectorAll('dialog').forEach((d) => new MutationObserver(() => (d.open ? lenis?.stop() : lenis?.start())).observe(d, { attributes: true, attributeFilter: ['open'] }));
  reduce.addEventListener('change', () => { if (reduce.matches) stopLenis(); });

  if (S.still()) return;
  const mm = gsap.matchMedia();

  // ---------- Storyboard: pinned on desktop, the eight frames scrub sideways with vertical scroll ----------
  // (Created first: a pin has to exist before the scroll triggers that sit below it.)
  mm.add('(min-width: 860px) and (prefers-reduced-motion: no-preference)', () => {
    // The scene and the strip hold together as one stage, sitting on the bottom of the viewport.
    const box = document.getElementById('storyStage');
    const win = box.querySelector('.storyboard-window'), strip = box.querySelector('.storyboard-strip');
    strip.scrollLeft = 0;
    box.classList.add('pinned');
    const travel = () => Math.max(0, strip.offsetWidth - win.clientWidth);
    // One frame at a time holds full strength as the strip passes, so eight small frames read as a sequence.
    const frames = [...strip.children];
    const focus = (self) => {
      const f = self.progress * (frames.length - 1);
      frames.forEach((li, k) => { li.style.opacity = (1 - .58 * Math.min(1, Math.max(0, (Math.abs(k - f) - .6) / 1.3))).toFixed(2); });
    };
    gsap.to(strip, {
      x: () => -travel(), ease: 'none',
      scrollTrigger: { id: 'squad-story', trigger: box, start: () => (box.offsetHeight + 96 < innerHeight ? 'center center' : 'bottom bottom-=48'), end: () => `+=${travel()}`, pin: true, scrub: true, invalidateOnRefresh: true, onUpdate: focus, onRefresh: focus },
    });
    return () => { box.classList.remove('pinned'); frames.forEach((li) => li.style.removeProperty('opacity')); };
  });

  mm.add({ desk: '(min-width: 860px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { desk, motion } = ctx.conditions;
    if (!motion) return;
    const scrub = desk ? true : .5; // native touch scroll gets a little smoothing

    // ---------- Hero: the dusk scene sits closer than the page, its light pool further away ----------
    const hero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub };
    gsap.to('.hero-scene', { y: desk ? -44 : -14, ease: 'none', scrollTrigger: hero });
    gsap.to('.hero-scene .glow', { y: desk ? 60 : 24, ease: 'none', scrollTrigger: { ...hero } });

    // ---------- Phase scenes: picture, light pool and text move at three slightly different rates ----------
    gsap.utils.toArray('.case .scene').forEach((fig) => {
      const img = fig.querySelector('img'), glow = fig.querySelector('.glow'), k = desk ? 20 : 8;
      const at = { trigger: fig, start: 'top bottom', end: 'bottom top', scrub };
      gsap.fromTo(img, { y: k }, { y: -k, ease: 'none', scrollTrigger: at });
      if (glow) gsap.fromTo(glow, { y: -k * 1.5 }, { y: k * 1.5, ease: 'none', scrollTrigger: { ...at } });
    });
  });

  // ---------- Warm-up: run every scroll trigger once while the page is idle, so the first real scroll frame has no first-time work ----------
  const warm = () => { ScrollTrigger.update(); window.SquadJourney?.sync(true); };
  addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 1200 }) : setTimeout(warm, 300)), { once: true });

  // ---------- Research counts: 4 / 8 / 22 count up once, as they come into view ----------
  const counts = [...document.querySelectorAll('#counts [data-count]')];
  if (counts.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (S.still()) return;
      counts.forEach((el, i) => {
        const end = Number(el.dataset.count), n = { v: 0 };
        el.textContent = '0';
        gsap.to(n, { v: end, duration: .9 + i * .25, delay: .15 + i * .12, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(n.v); }, onComplete: () => { el.textContent = end; } });
      });
    }, { threshold: .5 });
    io.observe(document.getElementById('counts'));
  }
})();
