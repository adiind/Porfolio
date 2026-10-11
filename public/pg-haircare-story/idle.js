// Calm idle motion. Transform and opacity only. Stops when the tab is hidden or motion is reduced.
(() => {
  const root = document.documentElement;
  const reduced = root.classList.contains('no-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const thread = document.querySelector('.case-thread');
  const setTravel = () => {
    if (thread) thread.style.setProperty('--travel', `${thread.clientHeight + 80}px`);
  };
  setTravel();
  addEventListener('resize', setTravel);
  const syncPaused = () => root.classList.toggle('idle-paused', document.hidden);
  document.addEventListener('visibilitychange', syncPaused);
  syncPaused();
  if (reduced) return;

  // One shared idle system: every still image gets its own slow bob (7–13s), offset and height,
  // so nothing moves in sync. CSS (.idle-float) does the motion; this only hands out the numbers.
  const floaters = document.querySelectorAll('.callouts .artifact img, .explore-art img, .tests .artifact img, .context-brief .anchor img, .ph-synthesis > .artifact img, .proof .evidence, .pair .evidence, .instructors img');
  floaters.forEach((el, i) => {
    el.style.setProperty('--fd', `${7 + ((i * 37) % 7)}s`);
    el.style.setProperty('--fl', `-${(i * 53) % 13}s`);
    el.style.setProperty('--fa', `${2 + (i % 3)}px`);
    if (!el.closest('.instructors')) el.classList.add('idle-float');
  });
  document.querySelectorAll('.ph-head .stop').forEach((el, i) => el.style.setProperty('--fl', `-${i * 1.7}s`));

  // Light that drifts down the page: a 0..1 scroll position the ambient glows lean on.
  let sFrame = 0;
  const setAmbient = () => {
    sFrame = 0;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    root.style.setProperty('--ap', Math.min(1, scrollY / max).toFixed(3));
  };
  addEventListener('scroll', () => { if (!sFrame) sFrame = requestAnimationFrame(setAmbient); }, { passive: true });
  setAmbient();

  const heads = document.querySelectorAll('.ph-head');
  if (heads.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    heads.forEach((head) => io.observe(head));
  }

  const flow = document.querySelector('.flow');
  const items = flow ? [...flow.querySelectorAll('.col li')] : [];
  if (items.length) {
    let index = 0;
    let timer = 0;
    const step = () => {
      items.forEach((el, n) => el.classList.toggle('hot', n === index));
      flow.classList.add('cycling');
      index = (index + 1) % items.length;
    };
    const arm = () => {
      clearInterval(timer);
      if (document.hidden) return;
      step();
      timer = setInterval(step, 2600);
    };
    document.addEventListener('visibilitychange', arm);
    arm();
  }

})();
