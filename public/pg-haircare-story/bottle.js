// P&G packaging research story. Everything is driven straight from scroll position
// (no rAF loop, no animation library), so scrolling back up rewinds it exactly.
(() => {
  const SRC_W = 709, SRC_H = 800;
  // Where the pump bottle sits on the sink in room-hero.webp, as a fraction of the image.
  const BOTTLE = { cx: 295.5 / SRC_W, cy: 335.5 / SRC_H };
  // Double diamond in its own units. "Along" is the direction of travel (0 → 8),
  // "across" is the spread (−PEAK → PEAK). One room sits in the middle of each half-diamond.
  const LEN = 8, PEAK = 1.5, PAD = 0.6, HOME_H = 0.6, CELL_W = 1.2, CELL_H = 1.32;
  const ROOM_AT = [1, 3, 5, 7];
  // All timing lives here, in screen heights of scroll. Tune pacing by editing these numbers only.
  const T = {
    intro: [0.04, 0.6],    // hero text slides off, camera moves onto the bathroom
    line2: [0.45, 0.6, 0.85, 1.0],
    night: [0.85, 1.35],
    leave: [0.9, 1.7],     // bathroom → whole diamond pull-back
    draw: [0.95, 1.9],     // diamond lines grow out of the bottle on the sink
    line3: [1.3, 1.5, 2.2, 2.4],
    walk: 2.0,             // camera leaves the overview
    arrive: [2.6, 3.4, 4.2, 5.0], // each room centred
    hold: 0.4,
    back: [5.4, 5.85, 6.05], // zoom back out, hold, then head for the end point
    line4: [5.7, 5.85, 6.1, 6.25],
    wipe: [6.15, 6.7],     // the end point opens up into the closing page
    end: 7.0,
  };
  const ARRIVE = T.arrive, END = T.end;
  // Rooms are ~710px wide files, so on a 2x screen they stay sharp only up to ~355 CSS px. Cap, don't upscale.
  const dprCap = () => Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const maxRoomW = () => SRC_W / dprCap();

  const $ = (id) => document.getElementById(id);
  const track = $('track'), stage = $('stage'), world = $('world'), room = $('room');
  const dd = $('dd'), svg = $('ddSvg'), cells = [...dd.querySelectorAll('.cell')], phases = [...dd.querySelectorAll('.phase')];
  const nodes = [...dd.querySelectorAll('.dd-node')];
  const caps = [...stage.querySelectorAll('.cap')];
  const hero = $('hero'), line2 = $('line2'), line3 = $('line3'), line4 = $('line4');
  const cue = $('cue'), outro = $('outro'), scrim = $('scrim');

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const span = (v, a, b) => clamp((v - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pulse = (v, [a, b, c, d]) => span(v, a, b) * (1 - span(v, c, d));
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
  const CREAM = [244, 238, 227], NIGHT = [15, 24, 48], NAVY = [27, 42, 74];
  // Eased interpolation through [scroll, value] keyframes.
  const keyed = (keys, u) => {
    let k = 0;
    while (k < keys.length - 2 && u > keys[k + 1][0]) k++;
    return lerp(keys[k][1], keys[k + 1][1], ease(span(u, keys[k][0], keys[k + 1][0])));
  };

  let tall = null;
  // Map (along, across) to x/y inside the diamond box, whose top-left is (−PAD, −PEAK−PAD) in those terms.
  const pt = (along, across) => (tall ? [across + PEAK + PAD, along + PAD] : [along + PAD, across + PEAK + PAD]);
  const boxW = () => (tall ? 2 * (PEAK + PAD) : LEN + 2 * PAD);
  const boxH = () => (tall ? LEN + 2 * PAD : 2 * (PEAK + PAD));

  function layout(isTall) {
    if (tall === isTall) return;
    tall = isTall;
    const W = boxW(), H = boxH();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const edge = (sign) => 'M' + [[0, 0], [2, sign * PEAK], [4, 0], [6, sign * PEAK], [8, 0]].map(([a, c]) => pt(a, c).join(' ')).join(' L');
    ['baseA', 'threadA'].forEach((id) => $(id).setAttribute('d', edge(-1)));
    ['baseB', 'threadB'].forEach((id) => $(id).setAttribute('d', edge(1)));
    $('ddFill').setAttribute('d', edge(-1) + ' L' + [[6, PEAK], [4, 0], [2, PEAK], [0, 0]].map(([a, c]) => pt(a, c).join(' ')).join(' L') + 'Z');
    nodes.forEach((n, i) => { const [x, y] = pt(i * 4, 0); n.setAttribute('cx', x); n.setAttribute('cy', y); });
    cells.forEach((cell, i) => {
      const [x, y] = pt(ROOM_AT[i], 0);
      Object.assign(cell.style, { left: ((x - CELL_W / 2) / W) * 100 + '%', top: ((y - CELL_H / 2) / H) * 100 + '%', width: (CELL_W / W) * 100 + '%', height: (CELL_H / H) * 100 + '%' });
    });
    phases.forEach((el, i) => {
      // Above the room on wide screens; to its left (right-aligned) on tall ones.
      const [x, y] = pt(ROOM_AT[i], tall ? -(CELL_W / 2 + 0.12) : -(PEAK / 2 + 0.66));
      Object.assign(el.style, { left: (x / W) * 100 + '%', top: (y / H) * 100 + '%', transform: tall ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)' });
    });
  }

  function render() {
    const vw = stage.clientWidth, vh = stage.clientHeight;
    const max = track.offsetHeight - vh;
    if (max <= 0) return; // static (reduced-motion) mode: the track is hidden
    const u = clamp(-track.getBoundingClientRect().top / max) * END;
    layout(vw < vh * 0.8);
    const midY = vh * 0.43;
    const wide = vw >= 680;

    // Camera over the diamond: whole view, then room to room, whole view again, then toward the end point.
    const wholeS = Math.min((vw * 0.94) / boxW(), (vh * 0.66) / boxH());
    const roomS = Math.min((vw * 0.9) / CELL_W, (vh * 0.5) / CELL_H, maxRoomW() / (CELL_H * (SRC_W / SRC_H)));
    const alongKeys = [[T.walk, LEN / 2]], zoomKeys = [[T.walk, 0]], threadKeys = [[T.walk, 0]];
    ARRIVE.forEach((a, i) => {
      alongKeys.push([a, ROOM_AT[i]], [a + T.hold, ROOM_AT[i]]);
      zoomKeys.push([a, 1], [a + T.hold, 1]);
      threadKeys.push([a, ROOM_AT[i] / LEN], [a + T.hold, ROOM_AT[i] / LEN]);
    });
    alongKeys.push([T.back[1], LEN / 2], [T.back[2], LEN / 2], [T.wipe[1], LEN - 1.2]);
    zoomKeys.push([T.back[1], 0], [T.back[2], 0], [T.wipe[1], 0.35]);
    threadKeys.push([T.back[1], 1]);
    const zoom = keyed(zoomKeys, u);
    let s = wholeS * Math.pow(roomS / wholeS, zoom);
    const [camX, camY] = pt(keyed(alongKeys, u), 0);
    // (ox, oy) is where the diamond box's top-left corner lands on screen.
    let ox = vw / 2 - camX * s, oy = midY - camY * s;

    // Hero → bathroom. The room starts beside the text (below it on narrow screens) and glides to centre
    // while the text slides off the other way, so the opening is one camera move, not a fade.
    const e = ease(span(u, T.intro[0], T.intro[1]));
    const capH = (maxRoomW() * SRC_H) / SRC_W;
    let heroH = Math.min(capH, wide ? Math.min(vh * 0.74, (vw * 0.5 * SRC_H) / SRC_W) : Math.min(vh * 0.36, (vw * 0.86 * SRC_H) / SRC_W));
    // On the small stage the room sits below the text, so size and place it from where the text actually ends.
    const textEnd = wide ? 0 : hero.offsetTop + hero.offsetHeight + 8;
    if (!wide) heroH = Math.max(110, Math.min(heroH, vh - 96 - textEnd));
    const heroX = wide ? vw * 0.73 : vw / 2, heroY = wide ? vh * 0.52 : textEnd + heroH / 2;
    const endH = Math.min(capH, vh * 0.7, (vw * 0.9 * SRC_H) / SRC_W);
    let h = heroH * Math.pow(endH / heroH, e);
    let w = (h * SRC_W) / SRC_H;
    let left = lerp(heroX, vw / 2, e) - w / 2;
    let top = lerp(heroY, vh * 0.45, e) - h / 2;
    hero.style.setProperty('--sx', (wide ? -e * vw * 0.62 : 0) + 'px');
    hero.style.setProperty('--sy', (wide ? 0 : -e * vh * 0.62) + 'px');
    hero.style.visibility = e === 1 ? 'hidden' : 'visible';
    cue.style.opacity = 1 - span(u, 0.02, 0.12);
    line2.style.opacity = pulse(u, T.line2);
    line2.style.transform = `translateY(${(1 - span(u, T.line2[0], T.line2[1])) * 16}px)`;

    // The diamond's start point is pinned to the bottle on the sink, so the bathroom and the diamond move
    // as one object: the camera backs away and the two lines grow out of the bottle. The bathroom ends up
    // as the small lit room at the start of the diamond.
    const [p0x, p0y] = pt(0, 0);
    const leave = ease(span(u, T.leave[0], T.leave[1]));
    if (leave < 1) {
      const s0 = h / HOME_H;
      const nodeX = lerp(left + BOTTLE.cx * w, ox + p0x * s, leave);
      const nodeY = lerp(top + BOTTLE.cy * h, oy + p0y * s, leave);
      s = s0 * Math.pow(s / s0, leave);
      ox = nodeX - p0x * s;
      oy = nodeY - p0y * s;
    }
    h = HOME_H * s;
    w = (h * SRC_W) / SRC_H;
    left = ox + p0x * s - BOTTLE.cx * w;
    top = oy + p0y * s - BOTTLE.cy * h;
    world.style.width = w + 'px';
    world.style.height = h + 'px';
    world.style.transform = `translate(${left}px, ${top}px)`;
    room.style.filter = zoom > 0 && leave === 1 ? `brightness(${lerp(1, 0.5, clamp(zoom))})` : 'none';

    // Night falls for the journey.
    const wipe = ease(span(u, T.wipe[0], T.wipe[1]));
    const night = span(u, T.night[0], T.night[1]);
    stage.style.background = mix(CREAM, NIGHT, night);
    stage.style.color = mix(NAVY, CREAM, night * (1 - span(wipe, 0.35, 0.6)));

    // The double diamond draws itself, then we travel it sprint by sprint.
    dd.style.width = boxW() * s + 'px';
    dd.style.height = boxH() * s + 'px';
    dd.style.transform = `translate(${ox}px, ${oy}px)`;
    // Stroke widths are set in diamond units so they stay a constant thickness on screen at any zoom.
    $('baseA').style.strokeWidth = $('baseB').style.strokeWidth = 1.5 / s;
    $('threadA').style.strokeWidth = $('threadB').style.strokeWidth = 2.5 / s;
    nodes.forEach((n) => n.setAttribute('r', 6 / s));
    const drawn = span(u, T.draw[0], T.draw[1]);
    const thread = keyed(threadKeys, u);
    $('baseA').style.strokeDashoffset = $('baseB').style.strokeDashoffset = 1 - drawn;
    $('threadA').style.strokeDashoffset = $('threadB').style.strokeDashoffset = 1 - thread;
    $('baseA').style.opacity = $('baseB').style.opacity = drawn > 0 ? 1 : 0;
    $('threadA').style.opacity = $('threadB').style.opacity = thread > 0 ? 1 : 0;
    $('ddFill').style.opacity = span(u, T.draw[1] - 0.2, T.draw[1] + 0.1);
    nodes.forEach((n, i) => { n.style.opacity = i === 0 ? 1 : span(drawn, i / 2 - 0.04, i / 2); });
    const overview = 1 - span(zoom, 0, 0.35);
    phases.forEach((el, i) => { el.style.opacity = span(drawn, ROOM_AT[i] / LEN - 0.05, ROOM_AT[i] / LEN + 0.05) * overview; });
    cells.forEach((cell, i) => {
      // Each room pops in tiny and unlit as the line draws past it, then grows to full size as the camera reaches it.
      const shown = span(drawn, ROOM_AT[i] / LEN - 0.04, ROOM_AT[i] / LEN + 0.06);
      const grown = ease(span(u, ARRIVE[i] - 0.6, ARRIVE[i] - 0.05));
      const lit = span(u, ARRIVE[i] - 0.3, ARRIVE[i]);
      cell.style.opacity = shown;
      const sc = lerp(0.42, 1, grown) * lerp(0.5, 1, ease(shown));
      cell.style.transform = sc >= 0.999 ? 'none' : `scale(${sc})`;
      cell.querySelector('img').style.filter = lit === 1 ? 'none' : `brightness(${lerp(0.28, 1, lit)}) saturate(${lerp(0.4, 1, lit)})`;
      cell.querySelector('.glow').style.opacity = lit;
      caps[i].style.opacity = span(u, ARRIVE[i] - 0.2, ARRIVE[i]) * (1 - span(u, ARRIVE[i] + T.hold, ARRIVE[i] + T.hold + 0.2));
      caps[i].style.transform = `translateY(${(1 - span(u, ARRIVE[i] - 0.2, ARRIVE[i])) * 16}px)`;
    });
    scrim.style.opacity = span(u, T.walk + 0.1, ARRIVE[0] - 0.2) * (1 - span(u, T.back[0], T.back[0] + 0.3));
    line3.style.opacity = pulse(u, T.line3);
    line4.style.opacity = pulse(u, T.line4);

    // Ending: the diamond's end point opens up like an iris into the closing page.
    const endX = ox + pt(LEN, 0)[0] * s, endY = oy + pt(LEN, 0)[1] * s;
    outro.style.visibility = wipe === 0 ? 'hidden' : 'visible';
    outro.style.clipPath = `circle(${lerp(6, Math.hypot(vw, vh), wipe)}px at ${endX}px ${endY}px)`;
    outro.style.pointerEvents = wipe > 0.9 ? 'auto' : 'none';
  }

  // ---------- The full case study opens only when the reader asks for it ----------
  const caseEl = $('case');
  const animated = getComputedStyle(track).display !== 'none';
  let trackerReady = false;
  function openCase(scroll = true) {
    document.querySelectorAll('[data-open-case]').forEach((el) => el.setAttribute('aria-expanded', 'true'));
    if (caseEl.hidden) {
      caseEl.hidden = false;
      if (trackerReady) { tracker.classList.add('unlocked'); retrack(); }
    }
    if (scroll) scrollTo({ top: caseEl.getBoundingClientRect().top + scrollY });
  }
  document.addEventListener('pg:reveal-case', () => openCase(false));
  let remembered = false;
  try { remembered = sessionStorage.getItem('pg-case-unlocked') === '1'; } catch {}
  if (remembered || /^#(case|p-)/.test(location.hash)) caseEl.hidden = false;

  // ---------- Reading rail ----------
  // Top: project name. Middle: a slim bar that fills as you read, with the current step beside its head.
  // Bottom: one big gate circle. Reaching it (end of the short story) shows the six phase circles as ghosts;
  // opening the full case lights them up. Inside the case the bar tracks the six phases instead.
  const tracker = $('tracker'), trLive = $('trLive'), trBar = $('trBar'), trStep = $('trStep'), trGate = $('trGate');
  const staticEl = document.querySelector('.static'), staticEnd = $('static-end');
  const steps = [];
  if (animated) {
    steps.push({ part: 1, name: 'Start', short: 'Start', from: 0, to: ARRIVE[0] - 0.5, at: 0 });
    ['Discover', 'Define', 'Develop', 'Deliver'].forEach((name, i) => steps.push({
      part: 1, big: true, name: `Sprint ${i + 1} · ${name}`, short: `${i + 1} ${name}`, from: ARRIVE[i] - 0.5, to: i < 3 ? ARRIVE[i + 1] - 0.5 : T.back[0], at: ARRIVE[i] + 0.1,
    }));
    steps.push({ part: 1, name: 'The short version, in one picture', short: 'Short version', from: T.back[0], to: END, at: END });
  } else {
    steps.push({ part: 1, big: true, name: 'Summary', short: 'Summary', el: staticEl });
  }
  const phaseEls = [...document.querySelectorAll('.case .ph')];
  phaseEls.forEach((el, i) => steps.push({ part: 2, big: true, name: `0${i + 1} · ${el.dataset.name}`, short: `0${i + 1} ${el.dataset.name}`, el }));
  steps.forEach((step) => {
    const li = document.createElement('li'), btn = document.createElement('button'), label = document.createElement('span');
    btn.type = 'button';
    btn.setAttribute('aria-label', step.name);
    label.textContent = step.short || step.name;
    label.setAttribute('aria-hidden', 'true');
    btn.append(label);
    btn.addEventListener('click', () => {
      if (step.part === 2) openCase(false);
      const y = step.el ? step.el.getBoundingClientRect().top + scrollY - 24
        : track.offsetTop + (step.at / END) * (track.offsetHeight - stage.clientHeight);
      scrollTo({ top: y });
    });
    li.append(btn);
    if (step.part === 1 && step.big && step.at != null) {
      li.style.setProperty('--i', $('trO1').children.length);
      li.style.setProperty('--at', String(step.at / END));
      $('trO1').append(li);
    }
    if (step.part === 2) {
      step.idx = $('trO2').children.length;
      li.style.setProperty('--i', step.idx);
      li.style.setProperty('--at', step.idx / Math.max(1, phaseEls.length - 1));
      $('trO2').append(li);
    }
    step.li = li;
  });
  const phaseCount = phaseEls.length;
  trackerReady = true;
  const syncUnlocked = () => tracker.classList.toggle('unlocked', !caseEl.hidden);
  syncUnlocked();
  let lastName = '';

  function track2() {
    const line = innerHeight * 0.4;
    const max = track.offsetHeight - stage.clientHeight;
    const u = animated ? clamp(-track.getBoundingClientRect().top / max) * END : 0;
    const pastStory = animated && track.getBoundingClientRect().bottom <= line;
    let current = steps[0];
    steps.forEach((step) => {
      let f = 0;
      if (step.el) { if (step.el.offsetParent) { const r = step.el.getBoundingClientRect(); f = clamp((line - r.top) / r.height); } }
      else f = pastStory ? 1 : span(u, step.from, step.to);
      step.f = f;
      if (f > 0) current = step;
    });
    steps.forEach((step) => {
      step.li.classList.toggle('done', step.f === 1 && step !== current);
      step.li.classList.toggle('on', step === current);
      step.li.firstChild[step === current ? 'setAttribute' : 'removeAttribute']('aria-current', 'step');
    });
    // Story progress: the scroll story, or in the no-motion version the page down to its closing card.
    let story;
    if (animated) story = pastStory ? 1 : clamp(u / T.wipe[1]);
    else {
      const endBottom = staticEnd.getBoundingClientRect().top + scrollY + staticEnd.offsetHeight * 0.6 - innerHeight;
      story = clamp(scrollY / Math.max(1, endBottom));
    }
    const inCase = !caseEl.hidden && caseEl.getBoundingClientRect().top < innerHeight * 0.6;
    const phase = current.part === 2 ? current : null;
    let p = story;
    if (inCase) p = phase ? clamp((phase.idx + phase.f) / Math.max(1, phaseCount - 1)) : 0;
    tracker.classList.toggle('is-case', inCase);
    tracker.classList.toggle('gate-ready', story >= 0.97 && !inCase);
    tracker.style.setProperty('--p', p.toFixed(4));
    trBar.setAttribute('aria-valuenow', Math.round(p * 100));
    const label = inCase && !phase ? 'Full case' : (current.short || current.name);
    if (trStep.textContent !== label) trStep.textContent = label;
    // The rail sits over the page itself, so it takes the ink colour of whatever is behind it.
    const overNight = animated && !pastStory && u > T.night[0] + 0.2 && u < T.wipe[0] + 0.35;
    tracker.style.color = overNight ? 'rgb(244, 238, 227)' : '';
    tracker.classList.toggle('over-night', overNight);
    if (current.name !== lastName) { lastName = current.name; trLive.textContent = `${current.part === 1 ? 'Overview' : 'Full case study'}: ${current.name}`; }
    paintMap(current);
  }

  // Fixed double diamond. Same shape as the scroll drawing, used as a map: four segments, a middle node, an end node.
  const dmap = $('dmap'), dmapTip = $('dmapTip');
  const segOrder = ['a', 'b', 'mid', 'c', 'd', 'end'];
  const overviewLabel = { start: 'Start', a: '1 Discover', b: '2 Define', mid: 'Define to Develop', c: '3 Develop', d: '4 Deliver', end: 'Short version' };
  const caseLabel = { start: '01 Context', a: '01 Context', b: '02 Research', mid: '03 Synthesis', c: '04 Exploration', d: '05 Testing', end: '06 Outcome' };
  const caseTarget = { start: 'p-context', a: 'p-context', b: 'p-research', mid: 'p-synthesis', c: 'p-exploration', d: 'p-testing', end: 'p-outcome' };
  function scrollToStep(step) {
    if (!step) return;
    if (step.part === 2) openCase(false);
    const y = step.el ? step.el.getBoundingClientRect().top + scrollY - 24
      : track.offsetTop + (step.at / END) * (track.offsetHeight - stage.clientHeight);
    scrollTo({ top: y });
  }
  function activeSeg(step) {
    if (!step || step.part !== 2 && step.name === 'Start') return 'start';
    if (step.part === 2) return segOrder[[...document.querySelectorAll('.case .ph')].indexOf(step.el)] || 'a';
    if (step.name.includes('Discover')) return 'a';
    if (step.name.includes('Define')) return 'b';
    if (step.name.includes('Develop')) return 'c';
    if (step.name.includes('Deliver')) return 'd';
    if (step.name.startsWith('The short')) return 'end';
    return 'start';
  }
  function paintMap(step) {
    const key = activeSeg(step);
    const labels = step && step.part === 2 ? caseLabel : overviewLabel;
    const idx = segOrder.indexOf(key);
    dmap.querySelectorAll('[data-seg]').forEach((el) => {
      const k = el.dataset.seg;
      const ki = k === 'start' ? -1 : segOrder.indexOf(k);
      el.classList.toggle('on', k === key);
      el.classList.toggle('done', (k === 'start' && idx >= 0) || (ki >= 0 && ki < idx));
      el.setAttribute('aria-label', labels[k] || k);
      if (k === key) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    dmap.classList.toggle('on-night', tracker.style.color !== '');
  }
  dmap.querySelectorAll('[data-seg]').forEach((el) => {
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    const labelsFor = () => (steps.some((s) => s.part === 2 && s.li.classList.contains('on')) ? caseLabel : overviewLabel);
    const show = () => { dmapTip.hidden = false; dmapTip.textContent = labelsFor()[el.dataset.seg] || ''; };
    const hide = () => { dmapTip.hidden = true; };
    el.addEventListener('pointerenter', show);
    el.addEventListener('focus', show);
    el.addEventListener('pointerleave', hide);
    el.addEventListener('blur', hide);
    const go = () => {
      const key = el.dataset.seg;
      const inCase = steps.some((s) => s.part === 2 && s.li.classList.contains('on'));
      if (inCase) {
        openCase(false);
        document.getElementById(caseTarget[key])?.scrollIntoView();
        return;
      }
      const match = { start: 'Start', a: 'Discover', b: 'Define', mid: 'Develop', c: 'Develop', d: 'Deliver', end: 'The short' }[key];
      const step = steps.find((s) => s.part === 1 && s.name.includes(match));
      if (step) scrollToStep(step);
      else if (!caseEl.hidden) document.getElementById(caseTarget[key])?.scrollIntoView();
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
    });
  });
  const retrack = () => { track2(); };
  addEventListener('scroll', track2, { passive: true });
  addEventListener('resize', retrack);
  addEventListener('load', retrack);
  retrack();


  // ---------- Auto-complete: a scroll that loses steam mid-scene is carried on to the nearest finished scene ----------
  // Engine lives in /shared/scroll-settle.js (shared with the other case studies and the home page).
  const REST = [0, 0.72, 1.85, ARRIVE[0], ARRIVE[1], ARRIVE[2], ARRIVE[3], 6.0, END];   // screen heights where the picture is fully settled
  const settle = window.ScrollSettle && animated ? window.ScrollSettle.init({
    rests: () => {
      const per = (track.offsetHeight - stage.clientHeight) / END;
      const list = REST.map((r) => ({ y: Math.round(r * per), strong: true }));
      // Below the story, the full case: settle on a phase heading only when it is already close.
      if (!caseEl.hidden) phaseEls.forEach((el) => list.push({ y: Math.round(el.getBoundingClientRect().top + scrollY - 24) }));
      return list;
    },
  }) : null;
  const advance = () => (settle ? settle.advance() : scrollBy({ top: Math.round(innerHeight * 0.9), behavior: 'instant' }));

  // ---------- "Keep scrolling" pill: the story is one long scroll, so say so, and show how far along it is ----------
  const more = $('more');
  if (more && animated) {
    const fill = more.querySelector('i');
    let nudge = 0;
    const sync = () => {
      const per = (track.offsetHeight - stage.clientHeight) / END, u = clamp(scrollY / per / END) * END;
      more.classList.toggle('on', u > 0.3 && u < END - 0.5);   // the hero has its own cue; the closing page has the Explore button
      fill.style.transform = `scaleX(${(u / END).toFixed(3)})`;
      more.classList.remove('nudge');
      clearTimeout(nudge);
      nudge = setTimeout(() => more.classList.add('nudge'), 1400);   // bob the arrow once the reader has paused
    };
    more.addEventListener('click', advance);
    addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  }
  if (!caseEl.hidden) openCase(false);
  addEventListener('scroll', render, { passive: true });
  addEventListener('resize', render);
  render();
})();
