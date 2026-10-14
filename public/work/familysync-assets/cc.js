(() => {
  const root = document.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) root.classList.add('still');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const docTop = el => el.getBoundingClientRect().top + scrollY;

  /* Reveal on entry */
  const reveals = $$('.reveal');
  if (still || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* Opening → Context: the live agent card hands itself into the stage */
  const scene = $('.scene');
  const card = $('[data-agent]'), slot = $('[data-slot]');
  let rest = null;
  function measure() {
    card.style.transform = '';
    const c = card.getBoundingClientRect(), s = slot.getBoundingClientRect(), sc = scene.getBoundingClientRect();
    rest = { x: c.left, y: c.top + scrollY, w: c.width, sx: s.left, sOff: s.top - sc.top, sw: s.width, end: docTop(scene) };
  }
  function handoff() {
    if (!rest) return;
    const t = ease(clamp(scrollY / Math.max(1, rest.end)));
    const sceneTop = Math.max(scene.getBoundingClientRect().top, 0);
    const fromY = rest.y - scrollY, toY = sceneTop + rest.sOff;
    const k = 1 + (rest.sw / rest.w - 1) * t;
    card.style.transform = `translate(${(rest.sx - rest.x) * t}px, ${(toY - fromY) * t}px) scale(${k})`;
    root.classList.toggle('handed', t >= 0.999);
  }

  /* 01 · The response window drains as the reader scrolls past it */
  const bar = $('[data-bar]'), time = $('[data-time]'), status = $('[data-status]');
  const worries = $$('.worries li');
  const CLOSE = 0.6;
  const fmt = s => `0${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function runScene() {
    const r = scene.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    const w = clamp(p / CLOSE);
    bar.style.transform = `scaleX(${1 - w})`;
    time.textContent = fmt(Math.round(180 * (1 - w)));
    worries.forEach((li, i) => li.classList.toggle('on', p > 0.05 + i * 0.085));
    const closed = p >= CLOSE;
    scene.classList.toggle('closed', closed);
    status.textContent = !closed ? 'Notify Stacy' : p < 0.8 ? 'Checking Calendar...' : 'Contacting Secondary Caregivers';
  }

  /* 05 · My part: the sub-agent stack builds one card at a time */
  const climax = $('[data-climax]');
  const beats = $$('[data-beat]');
  let stage = -2;
  function setStage(s) {
    if (s === stage) return;
    stage = s;
    climax.classList.remove('s-1', 's0', 's1', 's2', 's3', 's4');
    climax.classList.add('s' + s);
    const b = s === 1 ? 0 : s;
    beats.forEach(el => el.classList.toggle('on', +el.dataset.beat === b));
  }
  function runClimax() {
    const r = climax.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    if (r.top > innerHeight * 0.35) return setStage(-1);
    setStage(p < 0.14 ? 0 : p < 0.3 ? 1 : p < 0.48 ? 2 : p < 0.66 ? 3 : 4);
  }

  /* 06 · Soft gate: a person can answer; if nobody does, the agent holds the cart */
  const outcome = $('[data-outcome]'), hold = $('[data-hold]');
  const holdTitle = $('[data-hold-title]'), holdLine = $('[data-hold-line]');
  const actions = $('[data-hold-actions]'), undo = $('[data-undo]');
  const lede = $('[data-outcome-lede]'), cartAnswer = $('[data-cart-answer]');
  const WAIT = 8000;
  const copy = {
    waiting: ['Waiting on you', holdLine.textContent, lede.textContent, cartAnswer.textContent],
    holding: ['Holding the cart', 'No answer yet. FamilySync holds the cart and charges nothing without a yes.', lede.textContent, 'Cart created, held until someone says yes'],
    confirmed: ['Approved by you', 'Payment confirmed. The run resolves.', lede.textContent, 'Cart created and paid, with your yes'],
    declined: ['Declined by you', 'Nothing is charged. The run stops here, and that is a complete ending too.',
      'From the school’s alert to a cart Stacy chose not to buy, in one thread. The agent did the legwork; a person answered at every handoff.',
      'Cart created, then declined'],
  };
  let timer = 0;
  function setAnswer(a) {
    const [t, l, o, c] = copy[a || 'waiting'];
    holdTitle.textContent = t; holdLine.textContent = l; lede.textContent = o; cartAnswer.textContent = c;
    if (a) root.dataset.approval = a; else delete root.dataset.approval;
    const chosen = a === 'confirmed' || a === 'declined';
    actions.hidden = chosen; undo.hidden = !chosen;
    if (a) reveal();
    track();
  }
  function reveal() {
    outcome.classList.add('revealed');
    clearTimeout(timer); hold.classList.remove('counting');
  }
  function autoHold() { if (!root.dataset.approval) setAnswer('holding'); }
  $$('[data-answer]').forEach(b => b.addEventListener('click', () => {
    setAnswer(b.dataset.answer);
    outcome.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    outcome.focus({ preventScroll: true });
  }));
  undo.addEventListener('click', () => { setAnswer('holding'); $('[data-answer]').focus(); });

  if (still || !('IntersectionObserver' in window)) outcome.classList.add('revealed');
  else {
    hold.style.setProperty('--wait', WAIT + 'ms');
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || root.dataset.approval || timer) return;
      hold.classList.add('counting');
      timer = setTimeout(autoHold, WAIT);
    }, { threshold: 0.6 }).observe(hold);
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !root.dataset.approval) autoHold();
      if (e.isIntersecting) reveal();
    }, { rootMargin: '0px 0px -15% 0px' }).observe(outcome);
  }

  /* The rail: one navigation, and the run's state */
  const steps = $$('[data-step]');
  const links = $$('.rail a');
  const railList = $('.rail ol');
  const railN = $('[data-rail-n]'), railLabel = $('[data-rail-label]');
  function track() {
    const answered = !!root.dataset.approval;
    let now = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.45) now = i; });
    links.forEach((a, i) => {
      const gate = i === links.length - 2;
      a.classList.toggle('done', i < now);
      a.classList.toggle('now', i === now);
      a.classList.toggle('waiting', gate && !answered && now === i);
      if (i === now) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    railList.style.setProperty('--run', clamp(now / (links.length - 1)));
    railN.textContent = String(now + 1).padStart(2, '0');
    railLabel.textContent = steps[now].dataset.label;
  }
  $('[data-rail-outcome]').addEventListener('click', () => { if (!root.dataset.approval) autoHold(); reveal(); });

  function onScroll() {
    if (!still) { handoff(); runScene(); runClimax(); }
    track();
  }
  function onResize() { if (!still) measure(); onScroll(); }
  if (still) { root.classList.add('handed'); setStage(4); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('load', onResize);
  onResize();
})();
