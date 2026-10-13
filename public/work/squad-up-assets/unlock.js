// Optional, skippable transition from the short version into the full case (a reveal, not a lock).
// About 1.4s: the process title splits, the clay road draws, a few props arrive, then the case is there.
// Reduced motion, ?static, a case that is already open, or any link to a section: no animation, straight there.
(() => {
  const S = window.Squad;
  const dialog = document.getElementById('unlockStage');
  if (!S || !dialog || !dialog.showModal) return;
  const controls = [...document.querySelectorAll('[data-unlock]')];
  const PROPS = [
    '/images/mcd/squad-up/props/prop-kraft-bag-m.webp',
    '/images/mcd/squad-up/props/prop-fry-carton.webp',
    '/images/mcd/squad-up/props/prop-drink-cup.webp',
    '/images/mcd/squad-up/props/prop-nugget-box.webp',
    '/images/mcd/squad-up/props/prop-notebook.webp',
    '/images/mcd/squad-up/props/prop-sticky-note.webp',
  ];
  const card = dialog.querySelector('.unlock-card');
  const mapBox = dialog.querySelector('.unlock-map');
  const burst = dialog.querySelector('.transition-assets');
  const dim = dialog.querySelector('.unlock-dim');
  let timeline = null, running = false, prevOverflow = '';

  // The two halves of the card are the same face, each clipped to one side.
  card.querySelectorAll('.split').forEach((half) => {
    half.innerHTML = '<p class="uc-k">Context · Research · Synthesis</p><p class="uc-t">The full case study</p>';
  });
  mapBox.innerHTML = '<svg viewBox="0 0 800 300" aria-hidden="true">'
    + '<path class="um-base" d="M40 150 L220 30 L400 150 L220 270 Z M400 150 L580 30 L760 150 L580 270 Z"/>'
    + '<path class="um-thread" pathLength="1" d="M40 150 L220 30 L400 150 L580 30 L580 270 L760 150"/></svg>';
  const thread = mapBox.querySelector('.um-thread');

  function finish() {
    if (!running) return;
    running = false;
    timeline?.kill();
    timeline = null;
    S.openCase();
    document.documentElement.style.overflow = prevOverflow;
    if (dialog.open) dialog.close();
    gsap.set([dialog, dim, card, mapBox, thread, ...card.querySelectorAll('.split')], { clearProps: 'all' });
    burst.replaceChildren();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    S.goTo(document.getElementById('p-context'), { hash: '#case', instant: true });
    S.schedule();
  }

  function unlock(ev) {
    if (S.still() || S.isOpen() || !window.gsap || running) return; // squad.js handles the plain jump
    ev.preventDefault();
    running = true;
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('.unlock-skip').focus({ preventScroll: true });
    burst.replaceChildren();
    const bits = PROPS.map((src) => {
      const img = document.createElement('img');
      img.alt = '';
      img.src = src;
      img.addEventListener('error', () => img.remove(), { once: true });
      burst.append(img);
      return img;
    });
    gsap.set(dialog, { opacity: 1 });
    gsap.set(dim, { opacity: 0 });
    gsap.set(card.querySelectorAll('.split'), { x: 0 });
    gsap.set(card, { opacity: 1 });
    gsap.set(thread, { strokeDashoffset: 1 });
    gsap.set(mapBox, { opacity: 0, y: 14 });
    gsap.set(bits, { x: 0, y: 10, scale: 0.3, opacity: 0, xPercent: -50, yPercent: -50 });
    timeline = gsap.timeline({ onComplete: finish });
    timeline
      .to(card.querySelector('.split.left'), { x: '-38%', duration: 0.5, ease: 'power3.out' }, 0.05)
      .to(card.querySelector('.split.right'), { x: '38%', duration: 0.5, ease: 'power3.out' }, 0.05)
      .to(card, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.4)
      .to(mapBox, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.2)
      .to(thread, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 0.3)
      .to(bits, {
        opacity: 1, scale: 1, duration: 0.45, stagger: 0.04, ease: 'power3.out',
        x: (i) => Math.cos(i * 1.15 - 0.4) * 130, y: (i) => Math.sin(i * 1.15 - 0.4) * 64,
      }, 0.3)
      .to(bits, { opacity: 0, y: '-=14', duration: 0.3, ease: 'power2.in' }, 0.95)
      .to(dialog, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.15);
  }

  controls.forEach((el) => el.addEventListener('click', unlock));
  const skip = (ev) => { if (!running) return; if (ev?.cancelable) ev.preventDefault(); finish(); };
  dialog.querySelector('.unlock-skip').addEventListener('click', skip);
  dialog.addEventListener('cancel', skip);
  dialog.addEventListener('wheel', skip, { passive: false });
  dialog.addEventListener('touchmove', skip, { passive: false });
  addEventListener('keydown', (ev) => { if (running && ['Escape', ' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(ev.key)) skip(ev); });
  document.addEventListener('visibilitychange', () => { if (running && document.hidden) finish(); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { if (running) finish(); });
  addEventListener('pagehide', () => { timeline?.kill(); });
})();
