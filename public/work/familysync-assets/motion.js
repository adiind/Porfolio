/* FamilySync motion layer: "the page is the agent".
   One Lenis instance feeds one ScrollTrigger setup. cc.js owns the story state
   (stages, answers, rail); this file only makes those states move. */
(() => {
  const root = document.documentElement;
  const { gsap, ScrollTrigger, Lenis } = window;
  if (root.classList.contains('still') || !gsap || !ScrollTrigger || !Lenis) return;
  root.classList.add('moving');
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const mm = gsap.matchMedia();
  const DESK = '(min-width: 861px)', PHONE = '(max-width: 860px)';
  const STICKY = '(min-width: 861px), (min-height: 761px)';

  /* One smooth-scroll setup. Wheel is lightly smoothed; touch stays native. */
  const lenis = new Lenis({ lerp: 0.16, smoothWheel: true, syncTouch: false });
  window.fsLenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ── Opening: the school agent's message lands on Stacy's phone ── */
  const phone = $('.hero-agent');
  const intro = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.1 } })
    .from('.hero .eyebrow', { y: 14, autoAlpha: 0 })
    .from('.hero h1', { y: 40, autoAlpha: 0, duration: 1.3 }, '<0.06')
    .from('.hero .lede', { y: 22, autoAlpha: 0 }, '<0.1')
    .from('.hero .meta > div', { y: 16, autoAlpha: 0, stagger: 0.07 }, '<0.12')
    .from(phone, { y: 90, rotationX: 16, transformPerspective: 1200, autoAlpha: 0, duration: 1.5 }, 0.05)
    .from('.hero .clock', { y: 12, autoAlpha: 0 }, 0.45)
    .from('.hero [data-agent] .school-ui', { y: -46, scale: 0.9, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.7)' }, 0.95)
    .from('.hero .agent-next', { y: 8, autoAlpha: 0, duration: 0.7 }, 1.35);

  // The phone leans toward the pointer while it is the subject, and settles once the card leaves.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    gsap.set(phone, { transformPerspective: 1200 });
    const rx = gsap.quickTo(phone, 'rotationX', { duration: 0.9, ease: 'power3' });
    const ry = gsap.quickTo(phone, 'rotationY', { duration: 0.9, ease: 'power3' });
    const hero = $('.hero');
    intro.eventCallback('onComplete', () => {
      hero.addEventListener('pointermove', e => {
        if (scrollY > 30) return;
        ry((e.clientX / innerWidth - 0.5) * 12);
        rx((0.5 - e.clientY / innerHeight) * 8);
      });
      hero.addEventListener('pointerleave', () => { rx(0); ry(0); });
      lenis.on('scroll', ({ scroll }) => { if (scroll > 30) { rx(0); ry(0); } });
    });
  }
  // As the card flies to the response window, the phone's own screen empties.
  gsap.fromTo(['.hero .clock', '.hero .agent-next'], { autoAlpha: 1, y: 0 }, {
    autoAlpha: 0, y: -24, ease: 'none', immediateRender: false,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% top', scrub: true },
  });
  mm.add(DESK, () => {
    gsap.to('.hero-copy', { y: -80, autoAlpha: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ── 01 The pickup request arrives as a notification ── */
  gsap.from(['.scene .swap', '.scene .meter'], {
    y: -46, scale: 0.94, autoAlpha: 0, rotationX: -18, transformPerspective: 1200, transformOrigin: '50% 0',
    stagger: 0.12, ease: 'none',
    scrollTrigger: { trigger: '.scene', start: 'top 70%', end: 'top 8%', scrub: 0.6 },
  });
  gsap.from('.scene-copy > *', {
    y: 40, autoAlpha: 0, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: '.scene', start: 'top 80%', end: 'top 15%', scrub: 0.6 },
  });

  /* ── Illustrations: unmask on entry, drift slower than the page ── */
  $$('.story-art').filter(f => !f.closest('.beat-scenes')).forEach(fig => {
    gsap.fromTo(fig, { clipPath: 'inset(12% 8% 12% 8% round 24px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top 98%', end: 'top 40%', scrub: true },
    });
    gsap.fromTo($('img', fig), { yPercent: -7, scale: 1.16 }, {
      yPercent: 7, scale: 1.16, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* ── 03 Synthesis: the relay phone turns to face the reader ── */
  const relayPhone = $('.relay-phone');
  gsap.fromTo(relayPhone, { rotationY: -18, rotationX: 10, y: 60, transformPerspective: 1300 }, {
    rotationY: 0, rotationX: 0, y: 0, ease: 'none',
    scrollTrigger: { trigger: relayPhone, start: 'top bottom', end: 'center 55%', scrub: 0.8 },
  });
  // Slide-to-accept shows how it moves, once, without accepting for anyone.
  const slider = $('[data-slide-accept]');
  ScrollTrigger.create({
    trigger: slider, start: 'top 75%', once: true,
    onEnter: () => gsap.timeline({ delay: 0.7 })
      .to(slider, { value: 78, duration: 0.55, ease: 'power2.inOut' })
      .to(slider, { value: 100, duration: 0.7, ease: 'elastic.out(1, .5)' })
      .to(slider, { value: 84, duration: 0.4, ease: 'power2.inOut' }, '+=0.35')
      .to(slider, { value: 100, duration: 0.6, ease: 'elastic.out(1, .5)' }),
  });

  /* ── The tension line reads itself in as you scroll ── */
  const line = $('.tension-line');
  line.innerHTML = line.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.to($$('.w', line), {
    opacity: 1, stagger: 0.15, ease: 'none',
    scrollTrigger: { trigger: line, start: 'top 82%', end: 'top 38%', scrub: true },
  });

  /* ── 04 Exploration: three directions narrow to one service ── */
  mm.add(DESK, () => {
    gsap.timeline({ scrollTrigger: { trigger: '.funnel', start: 'top 78%', end: 'bottom 62%', scrub: 0.6 } })
      .from('.f-a li', { x: -24, autoAlpha: 0, stagger: 0.12, duration: 0.4 })
      .fromTo('.f-j1', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.5 })
      .from(['.f-h2', '.f-b li'], { x: -24, autoAlpha: 0, stagger: 0.12, duration: 0.4 })
      .fromTo('.f-j2', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.5 })
      .from(['.f-h3', '.funnel-1'], { scale: 0.88, x: -20, autoAlpha: 0, stagger: 0.1, duration: 0.55, transformOrigin: '0 50%' });
  });
  mm.add(PHONE, () => {
    gsap.from('.funnel > *', { y: 18, autoAlpha: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out',
      scrollTrigger: { trigger: '.funnel', start: 'top 85%', once: true } });
  });

  /* ── Light to dark and back: the night panel opens to full bleed, then closes ── */
  const night = $('.night');
  let into = 0, out = 0, lastClip = '';
  const side = () => (innerWidth > 860 ? 5 : 3);
  const clipNight = () => {
    const x = (side() * (1 - into) + side() * out).toFixed(2);
    const r = innerWidth > 860 ? 44 : 28;
    const clip = x === '0.00' ? 'none' : `inset(0 ${x}% 0 ${x}% round ${r}px)`;
    if (clip !== lastClip) night.style.clipPath = lastClip = clip;
  };
  ScrollTrigger.create({ trigger: night, start: 'top bottom', end: 'top 15%', scrub: true,
    onUpdate: s => { into = s.progress; clipNight(); } });
  ScrollTrigger.create({ trigger: night, start: 'bottom 85%', end: 'bottom 20%', scrub: true,
    onUpdate: s => { out = s.progress; clipNight(); } });
  gsap.from('.climax-copy > :not(.beats)', {
    y: 50, autoAlpha: 0, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: '.climax', start: 'top 85%', end: 'top 20%', scrub: 0.6 },
  });

  /* ── 05 My part: the sub-agent spawns, finds, fills, then asks ── */
  const climax = $('[data-climax]');
  const stack = $('[data-stack]');
  const cart = $('.c-cart');
  stack.insertAdjacentHTML('afterbegin', '<i class="thread" aria-hidden="true"></i>');
  cart.insertAdjacentHTML('beforeend', '<i class="fill" aria-hidden="true"></i>');
  const recipeButtons = $$('.c-recipe .ui-button');
  const exits = $$('.exits li');
  const hint = (i, on) => { recipeButtons[i]?.classList.toggle('hint', on); exits[i]?.classList.toggle('hint', on); };
  let asked = false;
  mm.add(STICKY, () => {
    // The scene illustration slowly settles across the whole segment.
    gsap.fromTo('.beat-scenes img', { scale: 1.14, yPercent: -3 }, {
      scale: 1, yPercent: 3, ease: 'none',
      scrollTrigger: { trigger: climax, start: 'top top', end: 'bottom bottom', scrub: true },
    });
    // The cart fills with the scroll, between the cart beat and the ask (cc.js stage 3).
    ScrollTrigger.create({
      trigger: climax, start: 'top top', end: 'bottom bottom',
      onUpdate: s => {
        const f = clamp((s.progress - 0.5) / 0.1);
        cart.style.setProperty('--fill', f.toFixed(3));
        cart.classList.toggle('filled', f >= 1);
      },
    });
    // When the ask arrives (cc.js stage 4), walk through the three ways out once.
    const watch = new MutationObserver(() => {
      if (asked || !climax.classList.contains('s4')) return;
      asked = true; watch.disconnect();
      [0, 1, 2].forEach(i => {
        gsap.delayedCall(0.55 + i * 0.55, () => hint(i, true));
        gsap.delayedCall(1.0 + i * 0.55, () => hint(i, false));
      });
    });
    watch.observe(climax, { attributes: true, attributeFilter: ['class'] });
    return () => watch.disconnect();
  });
  exits.forEach((li, i) => {
    li.addEventListener('pointerenter', () => hint(i, true));
    li.addEventListener('pointerleave', () => hint(i, false));
  });
  recipeButtons.forEach((b, i) => {
    b.addEventListener('pointerenter', () => hint(i, true));
    b.addEventListener('pointerleave', () => hint(i, false));
  });

  /* ── 06 Testing: the payment card rises and waits on Stacy ── */
  const pay = $('.pay');
  gsap.from(pay, {
    y: 80, rotationX: 14, scale: 0.95, transformPerspective: 1400, transformOrigin: '50% 100%', ease: 'none',
    scrollTrigger: { trigger: '.hold', start: 'top 92%', end: 'top 40%', scrub: 0.6 },
  });
  // Text arrives once and stays fully legible; only objects are tied to the scrollbar.
  const arrive = (targets, trigger, from) => gsap.from(targets, {
    ...from, autoAlpha: 0, stagger: 0.09, duration: 0.8, ease: 'expo.out',
    scrollTrigger: { trigger, start: 'top 88%', once: true },
  });
  arrive('.why div', '.why', { x: -20 });
  arrive('.parts li', '.parts', { y: 16 });

  const payCard = $('.ui-card', pay);
  payCard.insertAdjacentHTML('beforeend',
    '<svg class="stamp" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" stroke="currentColor" pathLength="1"/>' +
    '<path class="yes" d="M13 22.5l6 6 12-13" stroke="currentColor" pathLength="1"/>' +
    '<path class="no" d="M15 15l14 14M29 15L15 29" stroke="currentColor" pathLength="1"/></svg>');
  $$('[data-answer]', pay).forEach(b => b.addEventListener('pointerdown', e => {
    const r = b.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.left = `${e.clientX - r.left}px`; dot.style.top = `${e.clientY - r.top}px`;
    b.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }));
  $$('[data-answer]', pay).forEach(b => b.addEventListener('click', () => {
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 260);
  }));
  // Answers change the card's height (the buttons leave or return): ease it instead of jumping.
  let before = 0;
  const retick = el => { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); };
  document.addEventListener('fs:answer', ({ detail }) => {
    if (detail.phase === 'before') { before = payCard.offsetHeight; return; }
    const after = payCard.offsetHeight;
    if (before && after !== before) {
      // Clip only while growing, so the stamp can sit over the card's corner.
      const grow = after > before;
      gsap.fromTo(payCard, { height: before, overflow: grow ? 'hidden' : 'visible' },
        { height: after, duration: 0.6, ease: 'expo.out', clearProps: 'height,overflow' });
    }
    retick($('[data-hold-title]')); retick($('[data-hold-line]'));
    // Approval/undo changes the card height above the map; remeasure once it settles.
    gsap.delayedCall(0.65, () => ScrollTrigger.refresh());
  });

  /* ── Journey map: one scroll clock runs Stacy's afternoon from 11:00 to 15:00 ── */
  const journey = $('.journey'), J = window.fsJourney;
  mm.add('(min-width: 1024px) and (min-height: 740px)', () => {
    J.layout(); J.set(0);
    const st = ScrollTrigger.create({
      trigger: journey, start: 'top 44px', end: 'bottom bottom', scrub: 0.4,
      // Settle on a stage once the reader stops, never mid-way between two.
      snap: { snapTo: 1 / 6, delay: 0.25, duration: { min: 0.2, max: 0.45 }, ease: 'power2.inOut', inertia: false },
      onUpdate: (s) => J.set(s.progress),
      onRefresh: () => J.layout(),
    });
    const go = (i) => lenis.scrollTo(st.start + (st.end - st.start) * i / 6, { duration: 0.7 });
    const buttons = $$('[data-journey-go]');
    const handlers = buttons.map((b, i) => { const h = () => go(i); b.addEventListener('click', h); return h; });
    return () => buttons.forEach((b, i) => b.removeEventListener('click', handlers[i]));
  });
  mm.add('(max-width: 1023px), (min-width: 1024px) and (max-height: 739px)', () => {
    J.layout(); J.set(0);
    const stages = J.stages;
    const first = stages[0], lastStage = stages[stages.length - 1];
    const st = ScrollTrigger.create({
      trigger: first, start: 'top 35%', endTrigger: lastStage, end: 'top 35%',
      onUpdate: (s) => J.set(s.progress),
      onRefresh: () => J.layout(),
    });
    const buttons = $$('[data-journey-go]');
    const handlers = buttons.map((b, i) => {
      const h = () => lenis.scrollTo(stages[i].getBoundingClientRect().top + scrollY - 110, { duration: 0.6 });
      b.addEventListener('click', h); return h;
    });
    return () => { st.kill(); buttons.forEach((b, i) => b.removeEventListener('click', handlers[i])); };
  });
  // Service marks settle into their tiles as the stage is reached (CSS owns the move).
  gsap.from('.journey-heading > *', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out',
    scrollTrigger: { trigger: journey, start: 'top 80%', once: true } });
  arrive('.answers li', '.answers', { y: 20 });

  const refreshAssets = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
  document.images && [...document.images].forEach(img => {
    if (!img.complete) img.addEventListener('load', () => refreshAssets.restart(true), {once:true});
  });
  document.fonts?.ready.then(() => refreshAssets.restart(true));
  addEventListener('load', () => ScrollTrigger.refresh());
})();
