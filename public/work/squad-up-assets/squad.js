// Squad Up prototype, r5: one full-size cutout stage and six scroll-synced road stops.
// The overview holds one focal point, match-cuts photographs, then follows six steps with a real-screen phone render.
// GSAP ScrollTrigger scrubs the sequence, so scrolling up rewinds it exactly. Around it: calm one-shot reveals, a reading rail with a double-diamond phase marker,
// warm ambient light that shifts per phase, and independent idle motion on the clay layers.
// ?static and reduced motion: no pin, no bobs, no gate. The whole story is on the page at once.
(() => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const span = (v, a, b) => clamp((v - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => root.classList.contains('no-motion');
  const hasGsap = !!window.gsap;
  if (!(hasGsap && window.ScrollTrigger)) root.classList.remove('pin');
  const desk = () => innerWidth >= 860;
  const barH = () => (desk() ? 0 : 44);
  const listeners = new AbortController();
  const on = (target, type, fn, opts = {}) => target.addEventListener(type, fn, { ...opts, signal: listeners.signal });

  // ---------- The full case opens when the reader asks for it (never gated without motion) ----------
  const caseEl = $('case');
  const isOpen = () => !root.classList.contains('gated');
  function openCase() {
    if (isOpen()) return false;
    root.classList.remove('gated');
    try { sessionStorage.setItem('squad-case-open', '1'); } catch {}
    schedule();
    // The case was display:none, so positions measured before now are wrong.
    requestAnimationFrame(() => { window.ScrollTrigger?.refresh(); sizeAmbient(); window.lenis?.resize(); });
    return true;
  }

  // ---------- Navigation: links into the case open it and land instantly ----------
  function goTo(el, { hash, instant } = {}) {
    if (!el) return;
    const openingCase = el === caseEl;
    const opened = (openingCase || caseEl.contains(el)) && openCase();
    if (openingCase) el = caseEl.querySelector('.ph[data-track]') || caseEl;
    const jump = still() || instant || opened;
    window.lenis?.resize(); // the page may have just grown; Lenis must know before it clamps the target
    if (window.lenis) window.lenis.scrollTo(el, { immediate: jump, duration: 1.2, force: true }); // Lenis honours scroll-margin-top itself
    else el.scrollIntoView({ behavior: jump ? 'instant' : 'smooth', block: 'start' });
    if (!el.hasAttribute('tabindex')) el.tabIndex = -1;
    el.focus({ preventScroll: true });
    if (hash) history.replaceState(null, '', hash);
  }
  const scrollToY = (top) => (window.lenis ? window.lenis.scrollTo(top, { duration: 1, force: true }) : scrollTo({ top, behavior: still() ? 'instant' : 'smooth' }));
  on(document, 'click', (ev) => {
    if (ev.defaultPrevented) return;
    const a = ev.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    ev.preventDefault();
    goTo(target, { hash: a.getAttribute('href') });
  });

  // ---------- One pinned stage: translate / rotate / match-cut, then follow the road ----------
  const intro = $('intro'), view = $('introView'), road = $('introRoad');
  const beats = [...intro.querySelectorAll('.beat')];
  const frames = [...intro.querySelectorAll('.stage-art')];
  const props = [...intro.querySelectorAll('.stage-prop')];
  const caps = beats.map((b) => b.querySelector('.beat-copy'));
  const flowStates = [...intro.querySelectorAll('.flow-state')];
  const flowButtons = [...intro.querySelectorAll('[data-flow]')];
  const phoneLabel = $('phoneLabel');
  const flowPhone = $('flowPhone');
  const flowScreen = $('flowScreen');
  const phoneSources = [
    ['/images/mcd/squad-up/figma/screens-r8/invite-screen.webp', 615, 1242, 'Squad Order invitation with QR code and recent squad members.'],
    ['/images/mcd/squad-up/figma/screens-r8/join-screen.webp', 658, 1765, 'Squad details with the members and their order values.'],
    ['/images/mcd/squad-up/figma/screens-r8/choose-screen.webp', 828, 1664, 'Squad Order menu with five food categories.'],
    ['/images/mcd/squad-up/figma/screens-r8/pay-screen.webp', 469, 633, 'Who are you paying for? Squad payment selection.'],
    ['/images/mcd/squad-up/figma/screens-r8/readiness-screen.webp', 826, 1675, 'My Squad screen waiting for other members to complete their order.'],
    ['/images/mcd/squad-up/figma/screens-r8/pickup-screen.webp', 930, 1900, 'Order Submitted screen with pickup number 3231.'],
  ];
  const END = 6.6;
  const T = { focus: [0.25, 1.25, 2.25, 3.2], hold: 0.25 };
  const CAP_IN = [0, 1, 2, 3];
  const flowAt = (i) => 3.15 + i * 0.55;
  let introTween = null, introST = null, L = null, lastFlow = -1;
  const artSpecs = [
    [frames[0], 0, 0, 0, 1], [frames[1], 1, 0, 0, 1],
    [frames[2], 2, -0.10, 0.03, 0.95], [frames[3], 3, 0, 0, 0.7],
    [props[0], 1, 0.25, -0.28, 0.46], [props[1], 2, 0.25, -0.26, 0.53],
  ];
  function layout() {
    const W = intro.clientWidth, H = intro.clientHeight;
    const left = desk() ? Math.max(48, (W - 1320) / 2 + 48) : 20, right = desk() ? 44 : 20; // same left edge as the hero
    const cw = W - left - right;
    const dpr = Math.max(1, devicePixelRatio || 1);
    const size = Math.min(1000 / dpr * 0.97, desk() ? cw * 0.54 : cw + 16, H * (desk() ? 0.76 : 0.54));
    L = { W, H, left, cw, size, x: desk() ? left + cw * 0.70 : left + cw / 2, y: desk() ? H * 0.49 : 54 + size / 2 };
    const roadLeft = desk() ? left + cw * 0.35 : 20;
    const rw = desk() ? cw * 0.65 : W - 40;
    const roadTop = desk() ? 72 : 144;
    const roadHeight = desk() ? H - 220 : Math.min(H - 350, 430);
    const phoneWidth = Math.min(823 / dpr * 0.96, desk() ? 290 : 212, (roadHeight - 22) * 823 / 1544, rw * 0.72);
    L.road = { x: roadLeft, y: roadTop, w: rw, h: roadHeight, phoneWidth };
    Object.assign(road.style, { width: rw + 'px', height: roadHeight + 'px', left: roadLeft + 'px', top: roadTop + 'px' });
    artSpecs.forEach(([el, i, , , k]) => { el.style.width = (i === 3 ? phoneWidth : size * k) + 'px'; });
  }
  // Hold each beat at full size. At the cut, the outgoing piece rolls away while the next
  // arrives from the opposite direction, occupying the same focal point. No camera shrink-to-map.
  function beatPose(u, i) {
    const enter = i === 0 ? 1 : ease(span(u, i - 0.18, i + 0.18));
    const leave = i === 3 ? 0 : ease(span(u, i + 0.82, i + 1.18));
    return { enter, leave, visible: enter * (1 - leave) };
  }
  function render(u) {
    if (!L) return;
    const flow = clamp((u - flowAt(0)) / (flowAt(5) - flowAt(0)));
    const flowIndex = Math.min(5, Math.max(0, Math.floor((u - 3.15) / 0.55)));
    intro.dataset.beat = String(Math.min(3, Math.max(0, Math.floor(u + 0.05))));
    intro.dataset.flow = String(flowIndex);
    artSpecs.forEach(([el, i, dx, dy, k], n) => {
      const { enter, leave, visible } = beatPose(u, i);
      let x = L.x + dx * L.size, y = L.y + dy * L.size;
      if (i === 3) {
        // One front-facing device stays fully inside the road stage. Only its real screen changes.
        x = L.road.x + L.road.w * (0.46 + 0.08 * flow);
        y = L.road.y + L.road.h / 2;
      }
      const scale = 1 - (1 - enter) * 0.16 - leave * 0.14;
      const size = i === 3 ? L.road.phoneWidth : L.size * k;
      const travelX = (1 - enter) * -90 + leave * 130;
      const travelY = (1 - enter) * (n > 3 ? -100 : 70) - leave * 90;
      const centerOffsetY = i === 3 ? size * 1544 / 823 / 2 : i < 3 ? size / 3 : size / 2;
      el.style.transform = `translate3d(${x - size / 2 + travelX}px, ${y - centerOffsetY + travelY}px, 0) rotate(${(1 - enter) * -9 + leave * 12}deg) scale(${scale})`;
      el.style.opacity = visible.toFixed(3);
      el.style.visibility = visible > 0.001 ? 'visible' : 'hidden';
    });
    caps.forEach((el, i) => {
      const { enter, leave, visible } = beatPose(u, i);
      el.style.opacity = visible.toFixed(3);
      el.style.transform = `translate3d(0, ${(1 - enter) * 30 - leave * 30}px, 0)`;
      el.style.visibility = visible > 0.001 ? 'visible' : 'hidden';
      el.inert = visible < 0.5;
    });
    const arrival = beatPose(u, 3).enter;
    road.style.opacity = arrival.toFixed(3);
    road.style.transform = `translate3d(${(1 - arrival) * 120}px, ${(1 - arrival) * 90}px, 0)`;
    road.style.visibility = arrival > 0.001 ? 'visible' : 'hidden';
    road.querySelector('img').style.objectPosition = `${15 + flow * 70}% 50%`;
    const nav = intro.querySelector('.road-steps');
    nav.style.opacity = arrival.toFixed(3);
    nav.style.visibility = arrival > 0.001 ? 'visible' : 'hidden';
    nav.inert = arrival < 0.5;
    if (flowIndex !== lastFlow) {
      lastFlow = flowIndex;
      flowStates.forEach((el, i) => {
        el.classList.toggle('active', i === flowIndex);
        el.inert = i !== flowIndex;
      });
      flowButtons.forEach((el, i) => {
        el.classList.toggle('active', i === flowIndex);
        if (i === flowIndex) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
      });
      phoneLabel.textContent = flowButtons[flowIndex].textContent.trim().replace(/^\d+\s*/, '');
      const [src, width, height, alt] = phoneSources[flowIndex];
      flowScreen.src = src;
      flowScreen.width = width;
      flowScreen.height = height;
      flowScreen.alt = alt;
      capImages();
    }
  }
  function initIntro() {
    if (!root.classList.contains('pin')) return;
    ScrollTrigger.config({ ignoreMobileResize: true });
    layout();
    render(0);
    const proxy = { u: 0 };
    introTween = gsap.fromTo(proxy, { u: 0 }, {
      u: END, ease: 'none', onUpdate: () => render(proxy.u),
      scrollTrigger: {
        id: 'squad-intro', trigger: intro, pin: true, scrub: 0.35,
        start: () => `top ${barH()}px`, end: () => `+=${Math.round(END * intro.clientHeight)}`,
        onRefresh: () => { layout(); render(proxy.u); schedule(); },
      },
    });
    introST = introTween.scrollTrigger;
  }
  flowButtons.forEach((btn, i) => on(btn, 'click', () => {
    if (introST) scrollToY(introY(flowAt(i) + 0.12));
    else goTo(flowStates[i]);
  }));
  function teardownIntro() {
    introST?.kill(true);
    introTween?.kill();
    introTween = introST = null;
    L = null;
    [...frames, ...props, ...caps, road, intro.querySelector('.road-steps')].forEach((el) => { el.removeAttribute('style'); el.inert = false; });
    flowStates.forEach((el) => { el.classList.remove('active'); el.inert = false; });
    flowButtons.forEach((el) => { el.classList.remove('active'); el.removeAttribute('aria-current'); });
    root.classList.remove('pin');
  }

  // The phase road is the sole case-study progress system.
  const tracker = null, endCard = $('endCard');
  const introY = (u) => introST.start + (u / END) * (introST.end - introST.start);
  let schedule = () => {}, steps = [];
  function buildSteps() { steps = []; }
  function track() {}

  // ---------- Ambient light leans on scroll position; its colour follows the phase (CSS, data-amb) ----------
  let aFrame = 0, ambientRange = 1;
  const ambient = document.querySelector('.ambient');
  const sizeAmbient = () => { ambientRange = Math.max(1, root.scrollHeight - innerHeight); };
  const setAmbient = () => {
    aFrame = 0;
    ambient?.style.setProperty('--ap', clamp(scrollY / ambientRange).toFixed(2));
  };
  on(window, 'scroll', () => { if (!aFrame && !still()) aFrame = requestAnimationFrame(setAmbient); }, { passive: true });
  sizeAmbient();
  setAmbient();

  // ---------- Reveals: small, calm, staggered. Artifacts never move again once they are in. ----------
  const rvAll = [...document.querySelectorAll('[data-rv]')];
  const KIDS = '.mfi, .toc, .flow-rail, [data-rv="phones"]';
  const kidsOf = (el) => (el.matches(KIDS) ? [...el.children] : [el]);
  // Scenes rise and settle; app screens snap in crisply one by one; the ending settles calmly; everything else is a small lift.
  const entrance = (el) => (el.dataset.rv === 'phones' ? { from: { opacity: 0, y: 54, scale: .9 }, to: { duration: .55, ease: 'power4.out', stagger: .08 } }
    : el.dataset.rv === 'calm' ? { from: { opacity: 0, y: 10 }, to: { duration: 1.2, ease: 'power2.out' } }
    : el.classList.contains('scene') ? { from: { opacity: 0, y: 34, scale: .965 }, to: { duration: .95, ease: 'power3.out' } }
    : { from: { opacity: 0, y: 16 }, to: { duration: .8, ease: 'power3.out', stagger: .08 } });
  let io = null;
  function showAll() {
    io?.disconnect();
    if (hasGsap) {
      const all = [...rvAll, ...rvAll.flatMap(kidsOf)];
      gsap.killTweensOf(all);
      gsap.set(all, { clearProps: 'opacity,transform' });
    }
    root.classList.remove('motion');
  }
  function initReveals() {
    if (still() || !hasGsap || !('IntersectionObserver' in window)) { showAll(); return; }
    // Inside the pinned stage the camera owns visibility, so those blocks skip the reveal.
    const items = rvAll.filter((el) => !(introST && intro.contains(el)));
    items.forEach((el) => gsap.set(kidsOf(el), entrance(el).from));
    root.classList.remove('motion');
    const reveal = (els, delay = 0) => els.forEach((el, n) => gsap.to(kidsOf(el), { opacity: 1, y: 0, scale: 1, ...entrance(el).to, delay: delay + n * .08, clearProps: 'opacity,transform' }));
    const heroItems = items.filter((el) => el.closest('.hero'));
    reveal(heroItems, 0.05);
    io = new IntersectionObserver((entries) => {
      const ready = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      if (!ready.length) return;
      ready.forEach((el) => io.unobserve(el));
      reveal(ready);
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.filter((el) => !heroItems.includes(el)).forEach((el) => io.observe(el));
  }

  // Phase numbers underline themselves once, and each thread stop gets its own slow ring.
  const heads = [...document.querySelectorAll('.ph-head')];
  heads.forEach((h, i) => h.querySelector('.stop')?.style.setProperty('--fl', `-${(i * 1.7).toFixed(1)}s`));
  let headIO = null;
  if (!still() && 'IntersectionObserver' in window) {
    headIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      headIO.unobserve(e.target);
    }), { threshold: 0.4 });
    heads.forEach((h) => headIO.observe(h));
  }

  // ---------- Cutouts: each arrives once, then drifts at its own speed as the page scrolls past ----------
  const caseCuts = [...caseEl.querySelectorAll('.cut')];
  const drifts = [];
  let cutIO = null;
  function initCuts() {
    if (still() || !caseCuts.length) return;
    root.classList.add('cuts-armed');
    if ('IntersectionObserver' in window) {
      cutIO = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        cutIO.unobserve(e.target);
      }), { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
      caseCuts.forEach((c) => cutIO.observe(c));
    } else caseCuts.forEach((c) => c.classList.add('in'));
    if (!(hasGsap && window.ScrollTrigger)) return;
    caseCuts.forEach((c) => {
      const k = parseFloat(c.dataset.par || '0.6') * 46; // px of drift each way, 14–42px
      drifts.push(gsap.fromTo(c, { y: k }, { y: -k, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
    });
  }
  function stopCuts() {
    cutIO?.disconnect();
    drifts.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
    drifts.length = 0;
    caseCuts.forEach((c) => { c.classList.add('in'); c.style.removeProperty('transform'); });
    root.classList.remove('cuts-armed');
  }

  // ---------- Hero title: the clay logo drops in and settles with a slight bounce. ----------
  function initLogo() {
    const lg = $('logo');
    if (!lg || still() || !hasGsap || root.classList.contains('flat-title')) return;
    const img = lg.querySelector('img');
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
      if (still()) { gsap.set(lg, { clearProps: 'opacity,transform' }); return; }
      gsap.fromTo(lg, { opacity: 0, y: -34, scale: .94, rotation: -1.5 }, { opacity: 1, y: 0, scale: 1, rotation: 0, duration: .95, ease: 'back.out(1.9)', clearProps: 'opacity,transform' });
    });
  }

  // ---------- Idle: every clay layer moves on its own clock. Off-screen layers rest. ----------
  const idle = new Map();
  let idleIO = null;
  function startIdle() {
    if (still() || !hasGsap) return;
    const targets = [
      ...document.querySelectorAll('.hero-scene > img, .logo .lg-in'),
      ...intro.querySelectorAll('.stage-art:not(.art-phone) > img, .stage-art.art-phone .clay-phone, .stage-prop > img'),
    ];
    targets.forEach((el, i) => {
      const cut = !!el.closest('.intro-cut, .cut'), stop = el.classList.contains('cm-stop'), phone = !!el.closest('.phone');
      const cycle = (cut ? 8.4 : stop ? 6 : 7) + ((i * 37) % 9) * 0.5; // seconds for one full bob, 6–12s
      const amp = cut ? 7 + (i % 2) * 2 : stop ? 2 + (i % 2) : phone ? 3 + (i % 2) : 2.5 + (i % 3);
      const tw = gsap.fromTo(el, { x: 0, y: 0 }, {
        x: (i % 2 ? 1 : -1) * amp * 0.3, y: -amp, duration: cycle / 2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
      });
      tw.totalTime(((i * 0.618) % 1) * cycle);
      idle.set(el, tw);
    });
    idleIO = new IntersectionObserver((entries) => entries.forEach((e) => idle.get(e.target)?.paused(!e.isIntersecting)), { rootMargin: '120px 0px' });
    idle.forEach((tw, el) => idleIO.observe(el));
  }
  function stopIdle() {
    idleIO?.disconnect();
    idle.forEach((tw, el) => { tw.kill(); gsap.set(el, { clearProps: 'transform' }); });
    idle.clear();
  }

  // ---------- Hidden tab: pause every tween and CSS loop, resume from the same moment ----------
  const syncHidden = () => {
    root.classList.toggle('idle-paused', document.hidden);
    if (!hasGsap) return;
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
  };
  on(document, 'visibilitychange', syncHidden);

  // ---------- Reduced motion switched on mid-visit: drop to the full static story ----------
  on(reducedQuery, 'change', () => {
    if (!reducedQuery.matches) return;
    root.classList.add('no-motion');
    root.classList.remove('gated');
    delete root.dataset.amb;
    teardownIntro();
    stopIdle();
    stopCuts();
    showAll();
    buildSteps();
    schedule();
  });

  // Every image respects the real device's pixel ratio; never synthesize detail by CSS scaling.
  const capImages = () => document.querySelectorAll('img').forEach((img) => {
    const cap = (img.naturalWidth || Number(img.getAttribute('width'))) / Math.max(1, devicePixelRatio || 1);
    if (cap) img.style.maxWidth = cap + 'px';
  });
  document.querySelectorAll('img').forEach((img) => on(img, 'load', capImages));
  on(window, 'resize', () => { capImages(); sizeAmbient(); });
  capImages();

  // ---------- Unload: revert GSAP state and listeners. A back/forward cache restore just resumes. ----------
  on(window, 'pagehide', (ev) => {
    if (ev.persisted) { if (hasGsap) gsap.globalTimeline.pause(); return; }
    teardownIntro();
    stopIdle();
    stopCuts();
    io?.disconnect();
    headIO?.disconnect();
    listeners.abort();
  });
  on(window, 'pageshow', (ev) => { if (ev.persisted) syncHidden(); });

  window.Squad = { openCase, isOpen, goTo, still, barH, schedule, caseEl, endCard, tracker: null };

  if (!still() && hasGsap && window.ScrollTrigger) initIntro();
  else root.classList.remove('pin');
  initReveals();
  initCuts();
  initLogo();
  startIdle();
  buildSteps();
  syncHidden();
  track();
  window.__squadReady = true;

  function followHash(instant) {
    const target = location.hash.length > 1 && document.querySelector(location.hash);
    if (target) goTo(target, { instant });
  }
  on(window, 'hashchange', () => followHash(true));
  // Fonts and the pin can shift positions until load, so a deep link lands again then unless the reader has moved.
  let moved = false;
  ['wheel', 'touchstart', 'keydown'].forEach((t) => on(window, t, () => { moved = true; }, { passive: true, once: true }));
  if (location.hash) requestAnimationFrame(() => followHash(true));
  on(window, 'load', () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    sizeAmbient();
    if (location.hash && !moved) followHash(true);
    schedule();
  });
})();
