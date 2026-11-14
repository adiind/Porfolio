// The six "how it works" scenes. Each one is a small machine built from separate art pieces.
// Everything is drawn from scroll position, so scrolling back rewinds it exactly.
// Layout lives in CSS: ".at" pieces sit at a fixed spot (left/top = their centre), ".mv" pieces are moved from here.
window.ZeroParts = (h) => {
  const { $, $$, clamp, span, ease, lerp, pulse, keyed, STATIC } = h;

  const mv = (el, x, y, o = {}) => {
    const st = el.style;
    st.setProperty('--x', x + 'px'); st.setProperty('--y', y + 'px');
    st.setProperty('--r', (o.r || 0) + 'deg'); st.setProperty('--s', o.s === undefined ? 1 : o.s);
    if (o.o !== undefined) st.opacity = o.o;
  };
  const at = (el, o = {}) => {
    const st = el.style;
    st.setProperty('--dx', (o.dx || 0) + 'px'); st.setProperty('--dy', (o.dy || 0) + 'px');
    st.setProperty('--r', (o.r || 0) + 'deg'); st.setProperty('--s', o.s === undefined ? 1 : o.s);
    if (o.o !== undefined) st.opacity = o.o;
  };
  const ctr = (el) => [el.offsetLeft, el.offsetTop];
  // The numbered steps beside each stage: one is open at a time.
  const stepper = (sec) => {
    const lis = $$('.steps li', sec); let cur = -2;
    return (i) => { if (i === cur) return; cur = i; lis.forEach((li, k) => { li.classList.toggle('on', k === i); li.classList.toggle('done', k < i); }); };
  };
  // Without motion each scene shows one finished picture.
  const poster = (fn, p0) => (STATIC ? () => fn(p0) : fn);

  /* ---------------- Router: slips are stamped, then shot down one of six tubes ---------------- */
  const router = (() => {
    const sec = $('#s-router'), box = $('#rt'), rack = $('.rt-rack', box), tubes = $$('.rt-tube', box), slips = $$('.rt-slip', box);
    const stamp = $('.rt-stamp', box), mag = $('.rt-mag', box), desk = $('.rt-desk', box), ticket = $('#rtTicket'), down = $('#rtDown');
    const btn = $('#failBtn'), step = stepper(sec);
    const NAMES = tubes.map((t) => t.querySelector('b').textContent);
    const WIN = [[0.03, 0.36], [0.36, 0.45], [0.45, 0.54], [0.54, 0.63], [0.63, 0.72], [0.74, 0.97]];
    let failing = false, lastP = 0;
    slips.forEach((s) => { tubes[+s.dataset.to].querySelector('.rt-got').textContent = s.querySelector('p').textContent; });

    const draw = (p) => {
      lastP = p;
      const W = box.clientWidth, H = box.clientHeight, [dx, dy] = ctr(desk);
      let stampO = 0, sx = dx, sy = -H * 0.3, magO = 0, mx = dx, my = dy, ticketO = 0, downO = 0;
      const hit = tubes.map(() => false);
      slips.forEach((s, i) => {
        const [a, b] = WIN[i], t = span(p, a, b), slow = i === 0, byKw = failing || i === 5;
        const tube = tubes[+s.dataset.to], img = tube.querySelector('img');
        const tx = tube.offsetLeft + tube.offsetWidth / 2, ty = rack.offsetTop + tube.offsetTop + img.offsetTop + img.offsetHeight * 0.47;
        const e = slow ? span(t, 0, 0.5) : span(t, 0, 0.62); // arrive + get marked
        const fly = ease(span(t, slow ? 0.76 : 0.64, 1));
        const inn = ease(span(e, 0, 0.3));
        mv(s, lerp(dx, tx, fly), lerp(lerp(-H * 0.22, dy, inn), ty, fly), { s: lerp(1, 0.14, fly), r: (1 - inn) * (i % 2 ? 5 : -5), o: span(e, 0, 0.12) * (1 - span(fly, 0.8, 1)) });
        s.classList.toggle('stamped', e > 0.7);
        s.classList.toggle('kw', byKw && e > 0.5 && fly < 0.5);
        s.querySelector('em').textContent = (byKw ? 'keyword → ' : '') + NAMES[+s.dataset.to];
        if (p >= b) hit[+s.dataset.to] = true;
        if (t > 0 && fly === 0) {
          if (byKw) {
            magO = span(e, 0.25, 0.4) * (1 - span(e, 0.85, 1));
            mx = dx + lerp(-0.13, 0.11, ease(span(e, 0.3, 0.8))) * W; my = dy;
            downO = span(e, 0.1, 0.3);
          } else {
            const press = pulse(e, [0.36, 0.62, 0.7, 0.92]);
            stampO = span(e, 0.3, 0.42) * (1 - span(e, 0.86, 0.98));
            sx = dx + s.offsetWidth * 0.36; sy = dy - stamp.offsetHeight * 0.28 - (1 - ease(press)) * H * 0.2;
          }
          if (slow && !byKw) ticketO = span(t, 0.36, 0.44);
        } else if (t > 0 && t < 1) {
          if (byKw) downO = 1 - fly; else if (slow) ticketO = 1 - span(fly, 0, 0.5);
        }
      });
      mv(stamp, sx, sy, { r: -6, o: stampO });
      mv(mag, mx + mag.offsetWidth * 0.2, my + mag.offsetHeight * 0.17, { o: magO });
      ticket.style.opacity = ticketO; down.style.opacity = downO;
      tubes.forEach((tb, k) => tb.classList.toggle('hit', hit[k]));
      step(failing ? 3 : p < 0.08 ? 0 : p < 0.22 ? 1 : p < 0.73 ? 2 : 3);
    };
    btn.addEventListener('click', () => {
      failing = !failing;
      btn.setAttribute('aria-pressed', failing);
      btn.textContent = failing ? 'Bring the model back' : 'Simulate the model going down';
      draw(lastP);
    });
    return poster(draw, 1);
  })();

  /* ---------------- Memory: file three lines, lay out one briefing, write one change back ---------------- */
  const memory = (() => {
    const sec = $('#s-memory'), box = $('#mm'), step = stepper(sec);
    const drawers = $$('.mm-drawer', box), caps = $$('.mm-cap', box), froms = $$('.mm-from', box), slots = $$('.mm-slot', box);
    const ins = $$('.mm-in', box), outs = $$('.mm-out', box), back = $('#mmBack'), pen = $('#mmPen');
    const desk = $('#mmDesk'), lamp = $('.mm-lamp', box), ask = $('#mmAsk'), meter = $('#mmMeter'), fill = $('#mmFill');
    return poster((p) => {
      const W = box.clientWidth, H = box.clientHeight, small = W / H < 0.95;
      const open = [0, 0, 0];
      const fadeA = 1 - span(p, 0.42, 0.47);
      // 1 · three things I said are filed, one drawer each
      ins.forEach((el, k) => {
        const a = 0.04 + k * 0.12, t = span(p, a, a + 0.12);
        const [fx, fy] = ctr(froms[k]), [tx, ty] = ctr(drawers[k]);
        const inn = ease(span(t, 0, 0.3)), go = ease(span(t, 0.5, 1));
        mv(el, lerp(lerp(fx + W * 0.25, fx, inn), tx, go), lerp(fy, ty, go), { s: lerp(1, 0.28, go), r: (1 - inn) * 4, o: span(t, 0, 0.15) * (1 - span(go, 0.8, 1)) });
        open[k] = Math.max(open[k], pulse(p, [a + 0.065, a + 0.095, a + 0.125, a + 0.15]));
        caps[k].style.opacity = (small && k < 2 ? pulse(p, [a + 0.1, a + 0.115, a + 0.215, a + 0.23]) : span(p, a + 0.1, a + 0.14)) * fadeA;
      });
      // 2 · a question comes in: each drawer hands one card to the desk
      const deskOn = span(p, 0.44, 0.52);
      at(desk, { dy: (1 - ease(deskOn)) * 30, o: deskOn });
      lamp.style.opacity = deskOn;
      ask.style.opacity = span(p, 0.48, 0.53) * (1 - span(p, 0.77, 0.8));
      outs.forEach((el, k) => {
        const a = 0.54 + k * 0.06, go = ease(span(p, a, a + 0.08));
        const [fx, fy] = ctr(drawers[k]), [tx, ty] = ctr(slots[k]);
        mv(el, lerp(fx, tx, go), lerp(fy, ty, go), { s: lerp(0.3, 1, go), r: [-4, 3, -2][k] * go, o: span(go, 0, 0.2) });
        open[k] = Math.max(open[k], pulse(p, [a - 0.02, a + 0.01, a + 0.04, a + 0.07]));
      });
      meter.style.opacity = span(p, 0.6, 0.66);
      fill.style.clipPath = `inset(0 ${100 - lerp(0, 34, ease(span(p, 0.6, 0.76)))}% 0 0)`;
      // 3 · the session ends: one new card is written and filed under Facts
      const [bx, by] = ctr(slots[3]), [dx1, dy1] = ctr(drawers[1]);
      const wr = span(p, 0.8, 0.88), go = ease(span(p, 0.9, 0.97));
      mv(back, lerp(bx, dx1, go), lerp(by, dy1, go), { s: lerp(1, 0.3, go), r: 3 * (1 - go), o: span(wr, 0, 0.25) * (1 - span(go, 0.85, 1)) });
      mv(pen, bx + lerp(-0.07, 0.07, wr) * W + pen.offsetWidth * 0.46, by - pen.offsetHeight * 0.4 + Math.sin(wr * 20) * 3, { o: span(wr, 0, 0.15) * (1 - span(wr, 0.88, 1)) });
      open[1] = Math.max(open[1], pulse(p, [0.92, 0.95, 0.975, 0.995]));
      drawers.forEach((d, k) => { at(d, { dx: open[k] * W * 0.02, s: 1 + open[k] * 0.07 }); d.classList.toggle('open', open[k] > 0.5); });
      step(p < 0.44 ? 0 : p < 0.79 ? 1 : 2);
    }, 0.76);
  })();

  /* ---------------- Voices: the dial swaps two settings, nothing else ---------------- */
  const voices = (() => {
    const sec = $('#s-voices'), box = $('#vc'), step = stepper(sec);
    const faces = $$('.vc-face', box), btns = $$('.pick button', sec), lines = $$('.vc-cord', box), dial = $('#vcDial'), same = $('#vcSame');
    const voiceEl = $('#vcVoice'), mannerEl = $('#vcManner'), textEl = $('#vcText');
    const DATA = [
      ['Charon', 'Dry wit. Three steps ahead. Never wastes words.', "Then we cut scope. Two sections tonight, outline the rest. I'll draft a Thursday writing block for you to confirm."],
      ['Aoede', 'Warm and steady. Kind, but does not soften the truth.', "That's a lot to carry. Let's pick one small piece for tonight, and I'll remind you to take a real break."],
      ['Puck', 'The shortest answer that solves it. Leads with the answer.', 'Section 2 tonight. Rest Thursday.'],
      ['Kore', 'Opens up fresh angles, then turns them into direction.', 'What if you write the ending first tonight? Knowing where it lands makes the middle easier.'],
    ];
    let active = -1, ang = 0, scrollIdx = -1;
    const wire = () => {
      const [dx, dy] = ctr(dial);
      faces.forEach((f, i) => {
        const [fx, fy] = ctr(f), st = lines[i].style;
        st.left = dx + 'px'; st.top = dy + 'px';
        st.width = Math.hypot(fx - dx, fy - dy) + 'px';
        st.transform = `translateY(-50%) rotate(${Math.atan2(fy - dy, fx - dx)}rad)`;
      });
    };
    const pick = (v, force) => {
      if (v === active && !force) return;
      active = v;
      btns.forEach((b, i) => b.setAttribute('aria-pressed', i === v));
      faces.forEach((f, i) => f.classList.toggle('on', i === v));
      lines.forEach((l, i) => l.classList.toggle('on', i === v));
      voiceEl.textContent = DATA[v][0]; mannerEl.textContent = DATA[v][1]; textEl.textContent = DATA[v][2];
      const [dx, dy] = ctr(dial), [fx, fy] = ctr(faces[v]);
      const target = Math.atan2(fx - dx, dy - fy) * 180 / Math.PI;
      ang += ((target - ang + 540) % 360) - 180; // take the short way round
      dial.style.setProperty('--r', ang + 'deg');
    };
    btns.forEach((b, i) => b.addEventListener('click', () => pick(i)));
    faces.forEach((f, i) => f.addEventListener('click', () => pick(i)));
    wire(); pick(0);
    addEventListener('resize', () => { wire(); pick(active, true); });
    addEventListener('load', () => { wire(); pick(active, true); });
    return poster((p) => {
      const idx = Math.min(3, Math.floor(span(p, 0.2, 0.76) * 4));
      if (idx !== scrollIdx) { scrollIdx = idx; wire(); pick(idx); }
      same.classList.toggle('on', p > 0.78);
      step(p < 0.2 ? 0 : p < 0.78 ? 1 : 2);
    }, 0.5);
  })();

  /* ---------------- Council: question, three seats at once, the gavel, the ruling ---------------- */
  const council = (() => {
    const sec = $('#s-council'), box = $('#cn'), step = stepper(sec);
    const table = $('.cn-table', box), q = $('#cnQ'), ctx = $('#cnCtx'), seats = $$('.cn-seat', box), says = $$('.cn-say', box);
    const judge = $('#cnJudge'), gavel = $('#cnGavel'), flash = $('#cnFlash'), verdict = $('#cnVerdict'), seal = $('#cnSeal'), out = $('#cnOut');
    return poster((p) => {
      const W = box.clientWidth, H = box.clientHeight, [cx, cy] = ctr(table);
      // 1 · the question lands, with the project's notes tucked under it
      const qIn = ease(span(p, 0.03, 0.12)), qUp = ease(span(p, 0.6, 0.68));
      at(q, { dy: -(1 - qIn) * H * 0.3 - qUp * H * 0.375, s: lerp(1.25, 1, qIn) * lerp(1, 0.66, qUp), o: span(p, 0.03, 0.08) });
      at(ctx, { dy: (1 - ease(span(p, 0.12, 0.19))) * -H * 0.1, o: span(p, 0.13, 0.18) * (1 - span(p, 0.57, 0.62)) });
      // 2 · three seats answer in the same moment
      const seatIn = ease(span(p, 0.2, 0.28)), think = pulse(p, [0.22, 0.28, 0.5, 0.58]);
      seats.forEach((s, i) => {
        at(s, { s: lerp(0.7, 1, seatIn), o: seatIn });
        s.querySelector('img').style.setProperty('--tr', think * [12, 16, 9][i] * Math.sin(p * 70 + i * 2) + 'deg');
      });
      const gone = ease(span(p, 0.58, 0.67));
      says.forEach((el, i) => {
        const [sx, sy] = ctr(seats[i]), [ex, ey] = ctr(el);
        const o = ease(span(p, 0.3 + i * 0.012, 0.4 + i * 0.012));
        at(el, { dx: (sx - ex) * (1 - o) + (cx - ex) * gone, dy: (sy - ey) * (1 - o) + (cy - ey) * gone, s: lerp(0.2, 1, o) * lerp(1, 0.3, gone), r: [-2, 2, -1][i], o: o * (1 - span(gone, 0.7, 1)) });
      });
      // 3 · the Judge: gavel up, gavel down, ruling sealed
      const lift = ease(span(p, 0.63, 0.7)) * (1 - ease(span(p, 0.8, 0.88))), strike = ease(span(p, 0.7, 0.735));
      at(judge, { dx: -lift * W * 0.15, dy: -lift * H * 0.17, o: span(p, 0.56, 0.62) });
      gavel.style.setProperty('--gr', ease(span(p, 0.63, 0.7)) * 30 * (1 - strike) - strike * 16 * (1 - span(p, 0.76, 0.84)) + 'deg');
      const fl = span(p, 0.733, 0.8);
      at(flash, { s: 1 + fl * 5, o: fl > 0 && fl < 1 ? (1 - fl) * 0.9 : 0 });
      const v = ease(span(p, 0.735, 0.79));
      at(verdict, { s: lerp(0.7, 1, v), o: v });
      const sl = span(p, 0.81, 0.86);
      at(seal, { s: lerp(2.4, 1, ease(sl)), r: -12, o: span(sl, 0, 0.3) });
      // 4 · the ruling turns into work
      const o4 = span(p, 0.89, 0.95);
      at(out, { dy: (1 - o4) * 14, o: o4 });
      step(p < 0.2 ? 0 : p < 0.6 ? 1 : p < 0.88 ? 2 : 3);
    }, 1);
  })();

  /* ---------------- Build loop: a bug card goes round the ring ---------------- */
  const loop = (() => {
    const sec = $('#s-loop'), box = $('#bl'), step = stepper(sec);
    const ring = $('#blRing'), lit = $('#blLit'), labs = $$('.bl-lab', box), gears = $$('.bl-gear', box), evs = $$('.bl-ev', box);
    const card = $('#blCard'), beetle = $('#blBeetle'), seal = $('#blSeal'), cols = $$('#odo span i');
    cols.forEach((c) => { c.textContent = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0'; });
    const HOOP_R = 0.486; // centre line of the brass hoop, as a share of its width
    const KEYS = [[0.18, 0], [0.26, 90], [0.46, 90], [0.54, 180], [0.74, 180], [0.8, 270], [0.92, 270], [0.98, 360]];
    return poster((p) => {
      const H = box.clientHeight, rr = ring.getBoundingClientRect(), bb = box.getBoundingClientRect();
      const cx = rr.left - bb.left + rr.width / 2, cy = rr.top - bb.top + rr.height / 2, R = rr.width * HOOP_R;
      const pos = (deg) => [cx + R * Math.sin(deg * Math.PI / 180), cy - R * Math.cos(deg * Math.PI / 180)];
      const ang = p <= KEYS[0][0] ? 0 : keyed(KEYS, p);
      lit.style.setProperty('--a', ang);
      const [x, y] = pos(ang), cw = card.offsetWidth, ch = card.offsetHeight;
      const end = 1 - span(p, 0.95, 0.99);
      // 1 · the bug lands and gets a card
      const drop = ease(span(p, 0.03, 0.1)), cardOn = span(p, 0.1, 0.15), fixed = span(p, 0.62, 0.72);
      mv(card, x, y, { s: lerp(0.8, 1, cardOn), r: -2, o: cardOn * end });
      card.classList.toggle('fixed', p > 0.68);
      mv(beetle, x + cw * 0.34, lerp(-H * 0.2, y - ch * 0.36, drop), { r: lerp(-50, 14, drop) + Math.sin(p * 260) * 3 * (1 - fixed) * (drop === 1 ? 1 : 0), s: 1 - fixed * 0.5, o: span(p, 0.03, 0.06) * (1 - fixed) });
      // 2 · three pieces of evidence clip on
      evs.forEach((el, i) => {
        const t = ease(span(p, 0.28 + i * 0.05, 0.36 + i * 0.05));
        const tx = x + [-0.34, 0.05, 0.36][i] * cw, ty = y + [0.62, 0.8, 0.6][i] * ch;
        mv(el, lerp(cx, tx, t), lerp(cy, ty, t), { s: lerp(0.4, 1, t), r: [-7, 3, 8][i] * t, o: span(t, 0, 0.3) * end });
      });
      // 3 · the coding agent's gears turn while the card sits between them
      const [gx, gy] = pos(180), gOn = span(p, 0.48, 0.54) * (1 - span(p, 0.75, 0.81)), spin = span(p, 0.5, 0.76) * 620;
      mv(gears[0], gx - cw * 0.78, gy - ch * 0.1, { r: spin, o: gOn });
      mv(gears[1], gx + cw * 0.78, gy + ch * 0.1, { r: -spin + 12, o: gOn });
      // 4 · reviewed: the seal goes on
      const sl = span(p, 0.83, 0.88);
      mv(seal, x - cw * 0.34, y - ch * 0.3, { s: lerp(2.4, 1, ease(sl)), r: -14, o: span(sl, 0, 0.3) * end });
      labs.forEach((el, i) => {
        const [lx, ly] = pos(i * 90);
        mv(el, lx, ly - (ch * 0.5 + 24));
        el.classList.toggle('on', p > 0.02 && Math.round(ang / 90) % 4 === i && p < 0.985);
      });
      // the test counter rolls like an odometer
      const n = 1287 * ease(span(p, 0.03, 0.62)), whole = Math.floor(n);
      [Math.floor(whole / 1000) % 10, Math.floor(whole / 100) % 10, Math.floor(whole / 10) % 10, n % 10].forEach((d, i) => { cols[i].style.transform = `translateY(${-(n >= 1287 ? [1, 2, 8, 7][i] : d)}em)`; });
      step(p < 0.18 ? 0 : p < 0.5 ? 1 : p < 0.78 ? 2 : 3);
    }, 0.9);
  })();

  /* ---------------- Trust: five rules, one small machine each ---------------- */
  const trust = (() => {
    const sec = $('#s-trust'), box = $('#tr'), step = stepper(sec), vs = $$('.tr-v', box);
    const DRAW = [
      // Asks before it writes: the pen only moves after Confirm is pressed.
      (t, v) => {
        const W = v.clientWidth, H = v.clientHeight, draft = $('.tr-draft', v), conf = $('#trConfirm'), pen = $('#trPen'), state = $('#trState');
        const [dx, dy] = ctr(draft), goIn = ease(span(t, 0.44, 0.54)), wr = span(t, 0.54, 0.8);
        conf.classList.toggle('on', t > 0.4);
        const nx = lerp(W * 0.8, dx + lerp(-0.1, 0.1, wr) * W, goIn), ny = lerp(H * 0.2, dy + draft.offsetHeight * 0.3, goIn) + (wr > 0 && wr < 1 ? Math.sin(wr * 24) * 3 : 0);
        mv(pen, nx + pen.offsetWidth * 0.46, ny - pen.offsetHeight * 0.4, { o: span(t, 0.05, 0.15) });
        const saved = t > 0.8;
        state.textContent = saved ? 'Saved to calendar' : 'Draft · waiting for me';
        draft.classList.toggle('saved', saved);
      },
      // Data stays home: three files drop into the box, the lid closes.
      (t, v) => {
        const W = v.clientWidth, H = v.clientHeight, open = $('.tr-box.open', v), shut = $('.tr-box.shut', v);
        const bx = open.offsetLeft, ty = open.offsetTop + open.offsetHeight * 0.66;
        $$('.tr-file', v).forEach((el, i) => {
          const tt = ease(span(t, 0.08 + i * 0.14, 0.3 + i * 0.14));
          mv(el, bx + [-0.2, 0.2, 0][i] * W * (1 - tt), lerp(H * (0.1 + i * 0.03), ty, tt), { s: lerp(1, 0.5, tt), r: [-8, 6, -3][i] * (1 - tt), o: span(tt, 0, 0.15) * (1 - span(tt, 0.78, 1)) });
        });
        const c = span(t, 0.64, 0.74);
        open.style.opacity = 1 - c; shut.style.opacity = c;
        $('.tr-tagline', v).style.opacity = span(t, 0.74, 0.84);
      },
      // Locked outside the house: plain http is refused until it becomes https.
      (t, v) => {
        const W = v.clientWidth, H = v.clientHeight, url = $('.tr-url[data-u="1"]', v), ok0 = $('.tr-ok[data-u="0"]', v), ok1 = $('#trOk1'), lock = $('#trLock'), key = $('#trKey');
        const [ux, uy] = ctr(url), lx = ux + url.offsetWidth * 0.3;
        ok0.style.opacity = span(t, 0.08, 0.16);
        const l = ease(span(t, 0.24, 0.36)), gone = span(t, 0.72, 0.84), https = t > 0.56;
        mv(lock, lx, lerp(-H * 0.2, uy, l) - gone * H * 0.08, { r: (1 - l) * -20 + gone * 18, o: span(t, 0.24, 0.28) * (1 - gone) });
        url.classList.toggle('https', https);
        const k = ease(span(t, 0.58, 0.72));
        mv(key, lerp(W * 1.2, lx + key.offsetWidth * 0.2, k), uy + url.offsetHeight * 0.75, { r: lerp(20, -8, k), o: span(t, 0.58, 0.62) });
        const good = t > 0.8;
        ok1.textContent = good ? 'allowed' : 'refused';
        ok1.classList.toggle('good', good);
        ok1.style.opacity = span(t, 0.36, 0.42);
      },
      // No secrets in the logs: the stamp comes down and the value is inked out.
      (t, v) => {
        const H = v.clientHeight, sec2 = $('.tr-secret', v), stamp = $('#trStamp'), ink = $('#trInk');
        const a = sec2.getBoundingClientRect(), b = v.getBoundingClientRect();
        const sx = a.left - b.left + a.width * 0.75, sy = a.top - b.top + a.height / 2;
        const press = pulse(t, [0.22, 0.38, 0.44, 0.62]);
        mv(stamp, sx, sy - stamp.offsetHeight * 0.48 - (1 - ease(press)) * H * 0.3, { r: 6, o: span(t, 0.18, 0.26) * (1 - span(t, 0.56, 0.66)) });
        ink.style.setProperty('--ink', ease(span(t, 0.38, 0.55)));
      },
      // Every session has a price tag: the tag swings to rest, the rows count in.
      (t, v) => {
        $('#trTag').style.setProperty('--r', Math.sin(t * 10) * 10 * (1 - span(t, 0, 0.8)) + 'deg');
        $$('.tr-rows li', v).forEach((li, i) => li.style.setProperty('--o', span(t, 0.2 + i * 0.15, 0.32 + i * 0.15)));
      },
    ];
    return (p) => {
      const n = vs.length, f = span(p, 0.02, 0.98) * n, idx = Math.min(n - 1, Math.floor(f));
      vs.forEach((v, i) => {
        if (STATIC) { DRAW[i](0.9, v); return; }
        const t = clamp(f - i), on = i === idx ? span(t, 0, 0.08) * (i < n - 1 ? 1 - span(t, 0.93, 1) : 1) : 0;
        v.style.opacity = on;
        if (on) DRAW[i](t, v);
      });
      step(idx);
    };
  })();

  return { router, memory, voices, council, loop, trust };
};
