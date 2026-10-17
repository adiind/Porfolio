// The one-shot reveal is separate from the reversible scroll camera.
// About 1.5s: the end card splits, the six-room building rises, then it settles into the case header.
(() => {
  const caseEl = document.querySelector('#case');
  const dialog = document.querySelector('#unlock-stage');
  const controls = [...document.querySelectorAll('[data-open-case]')];
  const building = dialog.querySelector('.unlock-building');
  const reduced = () => document.documentElement.classList.contains('no-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timeline, settleTween, running = false, settling = false, finishing = false, previousOverflow = '';

  function remember() {
    try { sessionStorage.setItem('pg-case-unlocked', '1'); } catch {}
    document.dispatchEvent(new Event('pg:reveal-case'));
    controls.forEach((el) => el.setAttribute('aria-expanded', 'true'));
  }
  function destScroll() {
    const caseTop = document.querySelector('#case').getBoundingClientRect().top + scrollY;
    const phaseTop = document.querySelector('#p-context').getBoundingClientRect().top + scrollY;
    const buildingTop = document.querySelector('.case-building').getBoundingClientRect().top + scrollY;
    const showPhase = phaseTop - Math.min(220, innerHeight * 0.28);
    if (showPhase - caseTop < innerHeight * 0.55) return Math.max(0, caseTop);
    return Math.max(0, buildingTop - 24);
  }
  function restoreBuilding() {
    building.classList.remove('flying-building');
    if (window.gsap) gsap.set(building, { clearProps: 'all' });
    const thread = dialog.querySelector('.unlock-thread');
    if (building.parentElement !== dialog) dialog.insertBefore(building, thread);
  }
  function finish(snap) {
    if (finishing) return;
    finishing = true;
    timeline?.kill();
    settleTween?.kill();
    remember();
    restoreBuilding();
    const headerImg = document.querySelector('.case-building img');
    if (headerImg) headerImg.style.opacity = '';
    const thread = document.querySelector('.case-thread');
    if (thread) thread.style.transform = '';
    document.querySelectorAll('.ph-head .stop, #trO2 li').forEach((el) => {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
    });
    document.querySelector('#tracker').classList.remove('revealing');
    if (dialog.open) dialog.close();
    running = false;
    settling = false;
    document.documentElement.style.overflow = previousOverflow;
    document.body.classList.remove('unlocking');
    if (snap) scrollTo({ top: destScroll(), behavior: 'instant' });
    const target = document.querySelector('#p-context');
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    document.dispatchEvent(new Event('pg:unlock-complete'));
    finishing = false;
  }
  function releaseAndSettle() {
    document.documentElement.style.overflow = previousOverflow;
    document.body.classList.remove('unlocking');
    remember();
    const from = building.getBoundingClientRect();
    building.classList.add('flying-building');
    document.body.append(building);
    gsap.killTweensOf(building);
    gsap.set(building, { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, rotate: 0 });
    building.style.transform = 'none';
    building.style.translate = 'none';
    building.style.position = 'fixed';
    building.style.left = from.left + 'px';
    building.style.top = from.top + 'px';
    building.style.width = from.width + 'px';
    building.style.height = from.height + 'px';
    building.style.margin = '0';
    building.style.opacity = '1';
    building.style.zIndex = '80';
    if (dialog.open) dialog.close();
    running = false;
    settling = true;
    const headerImg = document.querySelector('.case-building img');
    gsap.set(headerImg, { opacity: 0 });
    const dest = destScroll();
    const delta = dest - scrollY;
    const to = headerImg.getBoundingClientRect();
    const thread = document.querySelector('.case-thread');
    gsap.set(thread, { scaleY: 0, transformOrigin: 'top center' });
    document.querySelector('#tracker').classList.add('revealing');
    gsap.set('#trO2 li', { opacity: 0, scale: 0.4 });
    const proxy = { y: scrollY };
    settleTween = gsap.timeline({
      defaults: { duration: 0.6, ease: 'power3.out' },
      onComplete: () => finish(false),
    });
    settleTween.to(proxy, { y: dest, onUpdate() { scrollTo(0, proxy.y); } }, 0);
    settleTween.to(building, {
      left: to.left,
      top: to.top - delta,
      width: Math.max(to.width, 48),
      height: Math.max(to.height, 48),
    }, 0);
    settleTween.to(thread, { scaleY: 1, duration: 0.5, ease: 'expo.out' }, 0);
    settleTween.to('#trO2 li', { opacity: 1, scale: 1, stagger: 0.04, duration: 0.5, ease: 'expo.out' }, 0);
    settleTween.set(headerImg, { opacity: 1 }, 0.52);
  }
  function onSkip(ev) {
    if (!running && !settling) return;
    if (ev?.cancelable) ev.preventDefault();
    finish(true);
  }
  function fadeInCase() {
    caseEl.style.opacity = '0';
    remember();
    const target = document.querySelector('#p-context');
    target.tabIndex = -1;
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    requestAnimationFrame(() => {
      caseEl.style.transition = 'opacity 200ms linear';
      caseEl.style.opacity = '1';
      caseEl.addEventListener('transitionend', () => {
        caseEl.style.transition = '';
        caseEl.style.opacity = '';
      }, { once: true });
    });
    target.focus({ preventScroll: true });
  }
  function unlock(ev) {
    ev.preventDefault();
    if (running || settling) return;
    if (!caseEl.hidden) {
      document.querySelector('#p-context').scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth' });
      return;
    }
    if (reduced() || !window.gsap || !dialog.showModal) {
      fadeInCase();
      return;
    }
    running = true;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('unlocking');
    dialog.showModal();
    const plinth = dialog.querySelector('.unlock-plinth');
    const thread = dialog.querySelector('.unlock-thread path');
    const dim = dialog.querySelector('.unlock-dim');
    const burst = dialog.querySelector('.clay-burst');
    dialog.querySelector('.unlock-dots')?.remove();
    const dots = document.createElement('div');
    dots.className = 'unlock-dots';
    dots.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement('i');
      if (i >= 4) dot.className = 'new-dot';
      dots.append(dot);
    }
    dialog.append(dots);
    burst.replaceChildren();
    const particles = Array.from({ length: 7 }, (_, i) => {
      const img = document.createElement('img');
      img.src = `/images/pg/artifacts/icon-${['sticky-note', 'swatch', 'bottle'][i % 3]}.webp`;
      img.alt = '';
      burst.append(img);
      return img;
    });
    gsap.set(dialog, { backgroundColor: '#f4eee3' });
    gsap.set(dim, { opacity: 0 });
    gsap.set(plinth, { scale: 1, opacity: 1 });
    gsap.set('.split', { x: 0, y: 0, rotation: 0 });
    gsap.set(building, { opacity: 0, scale: 0.94, xPercent: -50, yPercent: -50, y: 64 });
    gsap.set(thread, { strokeDashoffset: 1, opacity: 0 });
    gsap.set(particles, { x: 0, y: 16, scale: 0.2, opacity: 0 });
    gsap.set('.unlock-dots .new-dot', { opacity: 0, scale: 0.2 });
    timeline = gsap.timeline();
    timeline
      .to(dim, { opacity: 0.07, duration: 0.35, ease: 'power3.out' }, 0)
      .to('.split.left', { x: '-48%', duration: 0.5, ease: 'power3.out' }, 0)
      .to('.split.right', { x: '48%', duration: 0.5, ease: 'power3.out' }, 0)
      .to(plinth, { opacity: 0, duration: 0.4, ease: 'power3.out' }, 0.45)
      .to(building, { opacity: 1, scale: 1, y: 0, xPercent: -50, yPercent: -50, duration: 0.6, ease: 'power3.out' }, 0.25)
      .to(thread, { opacity: 1, strokeDashoffset: 0, duration: 0.5, ease: 'expo.out' }, 0.35)
      .to('.unlock-dots .new-dot', { opacity: 1, scale: 1, stagger: 0.04, duration: 0.5, ease: 'expo.out' }, 0.35)
      .to(particles, {
        opacity: 0.9, scale: 1, duration: 0.45, stagger: 0.03, ease: 'power3.out',
        x: (i) => Math.cos(i * 1.3) * 72,
        y: (i) => 34 + (i % 3) * 16,
      }, 0.28)
      .to(particles, { opacity: 0, y: '+=16', duration: 0.28, ease: 'power3.out' }, 0.7)
      .to(dim, { opacity: 0, duration: 0.3, ease: 'power3.out' }, 0.55)
      .call(releaseAndSettle, [], 0.85);
  }
  controls.forEach((el) => el.addEventListener('click', unlock));
  dialog.querySelector('.unlock-skip').addEventListener('click', () => finish(true));
  dialog.addEventListener('cancel', (ev) => { ev.preventDefault(); finish(true); });
  dialog.addEventListener('wheel', onSkip, { passive: false });
  dialog.addEventListener('touchmove', onSkip, { passive: false });
  addEventListener('wheel', (ev) => { if (running || settling) onSkip(ev); }, { passive: false });
  addEventListener('touchmove', (ev) => { if (running || settling) onSkip(ev); }, { passive: false });
  addEventListener('keydown', (ev) => {
    if (!running && !settling) return;
    if (['Escape', ' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(ev.key)) onSkip(ev);
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    if ((running || settling) && reduced()) finish(true);
  });
  document.addEventListener('visibilitychange', () => {
    if ((running || settling) && document.hidden) finish(true);
  });
  document.querySelector('.back-short').addEventListener('click', (ev) => {
    ev.preventDefault();
    if (reduced()) document.querySelector('#static-end').scrollIntoView({ behavior: 'instant' });
    else scrollTo({ top: document.querySelector('#track').offsetHeight - innerHeight, behavior: 'smooth' });
    const button = document.querySelector(reduced() ? '#static-end button' : '#outro button');
    button.focus({ preventScroll: true });
  });
  function followHash() {
    if (!/^#(case|p-)/.test(location.hash)) return;
    if (running || settling) finish(true);
    remember();
    requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'instant' }));
  }
  addEventListener('hashchange', followHash);
  followHash();
})();
