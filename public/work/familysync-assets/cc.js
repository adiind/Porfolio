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
  const phone = card.closest('.phone-frame');
  let rest = null;
  function measure() {
    card.style.transform = '';
    // Measure the card at rest: the phone's parallax and tilt are motion-only offsets.
    const pt = phone.style.translate, pr = phone.style.transform;
    phone.style.translate = 'none'; phone.style.transform = 'none';
    const c = card.getBoundingClientRect(), s = slot.getBoundingClientRect(), sc = scene.getBoundingClientRect();
    rest = { x: c.left, y: c.top + scrollY, w: c.width, sx: s.left, sOff: s.top - sc.top, sw: s.width, end: docTop(scene) };
    phone.style.translate = pt; phone.style.transform = pr;
  }
  function handoff() {
    if (!rest) return;
    const raw = clamp(scrollY / Math.max(1, rest.end)), t = ease(raw);
    // The phone scrolls with the opening, so its empty shell never slides over the next headline.
    const py = 0;
    phone.style.translate = `0 ${py}px`;
    const sceneTop = Math.max(scene.getBoundingClientRect().top, 0);
    const fromY = rest.y - scrollY + py, toY = sceneTop + rest.sOff;
    const lift = Math.sin(Math.PI * t) * 0.06;
    const k = 1 + (rest.sw / rest.w - 1) * t + lift;
    card.style.transform = `translate(${(rest.sx - rest.x) * t}px, ${(toY - fromY) * t}px) scale(${k})`;
    card.style.setProperty('--lift', (Math.sin(Math.PI * t)).toFixed(3));
    root.classList.toggle('handed', t >= 0.999);
  }

  /* 01 · The response window drains as the reader scrolls past it */
  const bar = $('[data-bar]'), time = $('[data-time]'), status = $('[data-status]'), clock = $('[data-clock]');
  const worries = $$('.worries li');
  const CLOSE = 0.6;
  const fmt = s => `0${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function runScene() {
    const r = scene.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    const w = clamp(p / CLOSE);
    bar.style.transform = `scaleX(${1 - w})`;
    // Navy while there is time, amber in the last minute, red at the close.
    const hue = w < 0.66 ? [23, 59, 121] : w < 0.9 ? [176, 112, 22] : [196, 58, 50];
    bar.style.backgroundColor = `rgb(${hue})`;
    time.textContent = fmt(Math.round(180 * (1 - w)));
    // Stacy's phone clock runs with the window: 11:00 when the school calls, 11:03 when it closes.
    clock.textContent = `11:0${Math.min(3, Math.floor(3 * w))}`;
    time.parentNode.classList.toggle('urgent', w >= 0.83 && w < 1);
    worries.forEach((li, i) => li.classList.toggle('on', p > 0.05 + i * 0.085));
    const closed = p >= CLOSE;
    scene.classList.toggle('closed', closed);
    scene.dataset.svc = closed ? 'calendar' : 'school';
    $('.swap-a').inert = closed; $('.swap-b').inert = !closed;
    const next = !closed ? 'Notify Stacy' : p < 0.8 ? 'Checking Calendar...' : 'Contacting Secondary Caregivers';
    if (status.textContent !== next) {
      status.textContent = next;
      status.classList.remove('tick'); void status.offsetWidth; status.classList.add('tick');
    }
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
    setStage(p < 0.14 ? 0 : p < 0.3 ? 1 : p < 0.48 ? 2 : p < 0.7 ? 3 : 4);
    // Frame 58: after the cart, the sub-agent confirms it with Stacy before asking.
    climax.classList.toggle('sc', p >= 0.6);
  }

  /* 06 · Soft gate: a person can answer; if nobody does, the agent holds the cart */
  const outcome = $('[data-outcome]'), hold = $('[data-hold]');
  const holdTitle = $('[data-hold-title]'), holdLine = $('[data-hold-line]');
  const actions = $('.pay .ui-actions'), undo = $('[data-undo]');
  const lede = $('[data-outcome-lede]'), cartAnswer = $('[data-cart-answer]');
  const WAIT = 8000;
  const go = el => window.fsLenis
    ? window.fsLenis.scrollTo(el, { offset: -64, duration: 1.2 })
    : el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  const copy = {
    waiting: ['Waiting on you', holdLine.textContent, lede.textContent, cartAnswer.textContent],
    holding: ['Holding the cart', 'No answer yet. FamilySync holds the cart and charges nothing without a yes.', lede.textContent, 'Cart created, held until someone says yes'],
    confirmed: ['Approved by you', 'Payment confirmed. The run resolves.', lede.textContent, 'Cart created and paid, with your yes'],
    declined: ['Declined by you', 'Nothing is charged. The run stops here, and that is a complete ending too.',
      'From the school’s alert to a cart Stacy chose not to buy, in one thread. The agent did the legwork; a person answered at every handoff.',
      'Cart created, then declined'],
  };
  let timer = 0;
  const announce = (a, phase) => document.dispatchEvent(new CustomEvent('fs:answer', { detail: { answer: a, phase } }));
  function setAnswer(a) {
    announce(a, 'before');
    const [t, l, o, c] = copy[a || 'waiting'];
    holdTitle.textContent = t; holdLine.textContent = l; lede.textContent = o; cartAnswer.textContent = c;
    if (a) root.dataset.approval = a; else delete root.dataset.approval;
    const chosen = a === 'confirmed' || a === 'declined';
    actions.hidden = chosen; undo.hidden = !chosen;
    if (a) reveal();
    track();
    announce(a, 'after');
  }
  function reveal() {
    outcome.classList.add('revealed');
    clearTimeout(timer); hold.classList.remove('counting');
  }
  function autoHold() { if (!root.dataset.approval) setAnswer('holding'); }
  $$('[data-answer]').forEach(b => b.addEventListener('click', () => {
    // The press shows, the card stamps the answer, then the page moves on.
    setTimeout(() => {
      setAnswer(b.dataset.answer);
      outcome.focus({ preventScroll: true });
      setTimeout(() => go(outcome), still ? 0 : 1100);
    }, still ? 0 : 220);
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
    const pageProgress = clamp(scrollY / Math.max(1, root.scrollHeight - innerHeight));
    $('.rail').style.setProperty('--page', pageProgress);
    $('.reading-line').setAttribute('aria-valuenow', Math.round(pageProgress * 100));
    if (innerWidth < 1024) {
      const current = links[now];
      if (current.parentElement.offsetLeft < railList.scrollLeft || current.parentElement.offsetLeft + current.offsetWidth > railList.scrollLeft + railList.clientWidth)
        railList.scrollTo({left: Math.max(0, current.parentElement.offsetLeft - 22), behavior: 'instant'});
    }
    railN.textContent = String(now + 1).padStart(2, '0');
    railLabel.textContent = steps[now].dataset.label;
    $('.rail').classList.toggle('on-dark', now === 4 || now === 5);
    $('.rail').dataset.svc = ['school', '', '', '', 'instacart', 'pay', ''][now];
    $('.rail').style.setProperty('--rail-c', `var(--${['school', 'clay', 'calendar', 'fs', 'pin', 'pay', 'cart'][now]})`);
  }
  // Scroll navigation must not add iframe entries to the browser's history.
  // The portfolio dialog owns the single Back/Forward entry for this story.
  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    go($(link.getAttribute('href')));
  }));
  $('[data-rail-outcome]').addEventListener('click', () => { if (!root.dataset.approval) autoHold(); reveal(); });

  $$('[data-back]').forEach(b => b.addEventListener('click', () => parent.postMessage({type:'familysync-close'},location.origin)));
  const slider = $('[data-slide-accept]');
  function acceptPickup() {
    slider.closest('.ui-card').querySelector('h4').textContent = 'Pickup request for Leo accepted';
    slider.closest('label').hidden = true;
    slider.closest('.ui-card').classList.add('accepted');
  }
  slider.addEventListener('input', () => { if (+slider.value <= 5) acceptPickup(); });
  // Escape must also work after focus enters the standalone document.
  addEventListener('keydown', e => {
    if (e.key === 'Escape') parent.postMessage({type:'familysync-close'},location.origin);
    if (e.key !== 'Tab' || parent === window) return;
    const focusable = $$('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')
      .filter(el => el.getClientRects().length && !el.closest('[inert]'));
    if ((e.shiftKey && document.activeElement === focusable[0])
      || (!e.shiftKey && document.activeElement === focusable[focusable.length - 1])) {
      e.preventDefault();
      parent.postMessage({type:'familysync-focus-back'},location.origin);
    }
  });
  function onScroll() {
    if (!still) { handoff(); runScene(); runClimax(); }
    track();
  }
  function onResize() { if (!still) measure(); onScroll(); }
  if (still) { root.classList.add('handed'); setStage(4); climax.classList.add('sc'); clock.textContent = '11:03'; }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('load', onResize);
  onResize();
})();
