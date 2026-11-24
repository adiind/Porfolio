/* The timeline, from one list (window.__TL, written out of data/timeline.ts when the page was built).
   1. A small rail along the bottom of the first screen. Pointing at a block on the wall lights its years on the rail.
   2. The timeline section. Time runs top to bottom, newest at the top, in two lanes: Work and School. It stays in place
      while you scroll. Before you scroll nothing is grown. As you scroll, a marker travels down the date rail and the stop
      it reaches grows and shows what happened there. Every stop is a link to its page; nothing opens in a panel. */
(function () {
  var T = window.__TL, root = document.querySelector('.bx'), sec = document.querySelector('.vt');
  if (!T || !root || !sec) return;
  var today = +new Date(T.today);
  var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var my = function (s) { if (s === 'Present') return 'now'; var d = new Date(s); return M[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  var end = function (it) { return it.end === 'Present' ? today : +new Date(it.end); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var scale = function (a, b) { var t0 = +new Date(a), t1 = +new Date(b); return function (d) { return Math.max(0, Math.min(1, (d - t0) / (t1 - t0))) * 100; }; };
  /* The pictures on the timeline cards sit far below the first screen: each is set only when its card is within about
     two and a half screens of the view, so a first visit does not download them all up front. */
  var bgIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (!e.isIntersecting) return; var n = e.target; n.style.backgroundImage = n.getAttribute('data-bg'); n.removeAttribute('data-bg'); bgIO.unobserve(n); });
  }, { rootMargin: '2500px 0px' }) : null;
  var setBg = function (node, url) { var v = 'url("' + url + '")'; if (!bgIO) { node.style.backgroundImage = v; return; } node.setAttribute('data-bg', v); bgIO.observe(node); };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var smooth = function (a, b, v) { var u = clamp((v - a) / (b - a)); return u * u * (3 - 2 * u); };
  function years(it) {
    var a = new Date(it.start).getUTCFullYear(), b = it.end === 'Present' ? 'now' : new Date(it.end).getUTCFullYear();
    return a === b ? String(a) : a + ' to ' + b;
  }
  /* Where a stop leads. Project pages have real addresses on the live site. Job and school pages only open from inside
     the real site, so in this prototype those links show a note instead of going anywhere. */
  function wire(a, it) {
    if (it.href) { a.href = it.href; } else if (it.id === 'ms-edi' || it.id === 'tinkerverse' || it.id === 'bits') { a.href = '/experience/' + it.id; } else { var name = it.short.toLowerCase(); a.href = ['self','zomato','udaan','schmooze','snapdeal'].indexOf(name) >= 0 ? '#experience-' + name : '#'; a.setAttribute('data-exp', it.short); }
  }

  /* ---------- 1. the rail on the first screen (2020 onward) ---------- */
  var pr = scale(T.start, T.end), rail = root.querySelector('.bx-rail-in'), railBars = {};
  T.items.forEach(function (it) {
    var a = +new Date(it.start), b = el('i', 'bx-rb l' + it.lane);
    b.style.left = pr(a) + '%'; b.style.width = Math.max(pr(end(it)) - pr(a), 0.6) + '%';
    rail.appendChild(b); railBars[it.id] = b;
  });
  for (var y = new Date(T.start).getUTCFullYear(); y <= new Date(T.end).getUTCFullYear(); y++) {
    var p0 = pr(+new Date(y + '-01-01')); if (p0 <= 0 || p0 >= 100) continue;
    var l = el('i', 'bx-ry', y); l.style.left = p0 + '%'; rail.appendChild(l);
  }
  var LINK = { self: 'self-xyz', zomato: 'zomato', rescue: 'zomato', hcd: 'ms-edi', ads: 'snapdeal' };
  var blocks = Array.prototype.slice.call(root.querySelectorAll('.bx-b[data-b]'));
  function syncRail() {
    Object.keys(railBars).forEach(function (k) { railBars[k].classList.remove('is-on'); });
    blocks.forEach(function (b) { if (b.classList.contains('is-hot') || b.matches(':hover')) { var id = LINK[b.getAttribute('data-b')]; if (railBars[id]) railBars[id].classList.add('is-on'); } });
  }
  if ('MutationObserver' in window) blocks.forEach(function (b) { new MutationObserver(syncRail).observe(b, { attributes: true, attributeFilter: ['class'] }); });
  blocks.forEach(function (b) { b.addEventListener('pointerenter', syncRail); b.addEventListener('pointerleave', syncRail); });

  /* ---------- 2. the timeline (vertical) ---------- */
  var work = sec.querySelector('.l-work .vt-cards'), school = sec.querySelector('.l-school .vt-cards'), axis = sec.querySelector('.vt-rail-in');
  var stops = T.items.filter(function (it) { return !it.pin; }).sort(function (p, q) { return +new Date(q.start) - +new Date(p.start); });   // newest first
  var pins = T.items.filter(function (it) { return it.pin; }).sort(function (p, q) { return +new Date(q.start) - +new Date(p.start); });
  var t0 = +new Date(T.all), t1 = +new Date(T.end);
  var pa = function (d) { return clamp((t1 - d) / (t1 - t0)) * 100; };          // how far down the rail a date sits, in percent
  var cards = [], segs = [], mids = [], n = stops.length, schoolSeen = 0;
  sec.style.setProperty('--n', n);

  /* Side builds: a small list in the school lane, between Northwestern and BITS, which is when they happened. */
  var also = el('div', 'vt-also'), alab = el('span', 'vt-also-lab'); alab.appendChild(el('b', '', 'On the side')); alab.appendChild(document.createTextNode(((T.also || []).length ? 'a campus role and ' : '') + pins.length + ' builds')); also.appendChild(alab);
  (T.also || []).forEach(function (it) {
    var a = el('a', 'vt-side'); a.href = it.href;
    a.appendChild(el('b', '', it.short)); a.appendChild(el('span', '', it.pin)); a.appendChild(el('i', '', it.when));
    a.setAttribute('aria-label', it.short + ': ' + it.pin + '. Opens its page.');
    also.appendChild(a);
  });
  pins.forEach(function (it) {
    var a = el('a', 'vt-side'); wire(a, it);
    a.appendChild(el('b', '', it.short)); a.appendChild(el('span', '', it.pin)); a.appendChild(el('i', '', years(it)));
    a.setAttribute('aria-label', it.short + ': ' + it.pin + ', ' + years(it) + '. Opens its page.');
    also.appendChild(a);
    var d = el('a', 'vt-dot'); wire(d, it); d.title = it.short + ' · ' + it.pin; d.setAttribute('aria-hidden', 'true'); d.tabIndex = -1;
    d.style.top = pa(+new Date(it.start)) + '%'; axis.appendChild(d);
  });

  /* How long a job lasted, in plain words. School shows "in progress" while it is still running. */
  function dur(it) {
    if (it.lane === 1) return end(it) > today ? 'in progress' : '';
    var m = Math.round((end(it) - +new Date(it.start)) / 2629800000);
    if (m < 12) return m + ' months';
    var y = Math.floor(m / 12), r = m % 12; return y + (y > 1 ? ' yrs' : ' yr') + (r ? ' ' + r + ' mos' : '');
  }
  stops.forEach(function (it, k) {
    var a = el('a', 'vt-stop'); wire(a, it);
    /* Each bar knows its own colours (cc bar, cf text, ca accent, b brand). The stylesheet decides how much of them shows:
       quiet ink while resting, full colour once the marker reaches it. */
    [['cc', it.c], ['cf', it.f], ['ca', it.acc], ['b', it.b]].forEach(function (kv) { if (kv[1]) a.style.setProperty('--' + kv[0], kv[1]); });
    a.style.setProperty('--k', k);
    a.setAttribute('aria-label', it.short + ': ' + it.title + ', ' + my(it.start) + ' to ' + my(it.end) + '. Opens its page.');
    var pic = el('span', 'vt-pic' + (it.logo ? ' is-logo' : '') + (it.fit ? ' is-fit' : '') + (it.card ? ' is-card' : ''));
    if (it.card) { var im0 = el('img'); im0.loading = 'lazy'; im0.decoding = 'async'; im0.src = it.pic; im0.alt = ''; pic.appendChild(im0); }   // a real object (his staff ID card), shown whole
    else { setBg(pic, it.pic); if (it.pos) pic.style.backgroundPosition = it.pos; }
    if (it.c2) pic.style.setProperty('--c2', it.c2);
    a.appendChild(pic);
    var when = my(it.start) + ' to ' + my(it.end), d = dur(it), proofs = it.proofs || [];

    /* resting: dates and length, name and role, proof */
    var line = el('span', 'vt-line'), meta = el('span', 'vt-meta', when); if (d) meta.appendChild(el('i', '', ' · ' + d)); line.appendChild(meta);
    var name = el('span', 'vt-name'); name.appendChild(el('b', '', it.short)); name.appendChild(el('span', '', it.role || it.title)); line.appendChild(name);
    if (proofs.length) {
      var pr = el('span', 'vt-proofs');
      proofs.forEach(function (p) { var s = el('span', 'vt-pf is-' + p[0]); if (p[0] === 'num') { s.appendChild(el('b', '', p[1])); s.appendChild(document.createTextNode(p[2])); } else s.textContent = p[1]; pr.appendChild(s); });
      line.appendChild(pr);
    }
    var arr = el('span', 'vt-arr', '→'); arr.setAttribute('aria-hidden', 'true'); line.appendChild(arr);
    a.appendChild(line);

    /* grown: the same facts, larger, plus the work itself */
    var more = el('span', 'vt-more'), top = el('span', 'vt-top'), m2 = el('span', 'vt-meta');
    m2.appendChild(el('b', '', it.short)); m2.appendChild(el('u', '', ' · ')); m2.appendChild(document.createTextNode(when)); if (d) m2.appendChild(el('i', '', ' · ' + d)); top.appendChild(m2); top.appendChild(el('span', 'vt-go', 'Open page →')); more.appendChild(top);
    more.appendChild(el('h3', '', it.h3 || it.title));
    if (it.headline) more.appendChild(el('p', 'vt-what', it.headline));
    if (proofs.length) {
      var ul = el('ul', 'vt-stats'), tags = el('li', 'is-tags');                // numbers first, then the word tags as one group
      proofs.forEach(function (p) {
        if (p[0] === 'num') { var li = el('li', 'is-num'); li.appendChild(el('b', '', p[1])); li.appendChild(el('span', '', p[3] || p[2])); ul.appendChild(li); }
        else tags.appendChild(el('span', 'is-tag', p[1]));
      });
      if (tags.firstChild) ul.appendChild(tags);
      more.appendChild(ul);
    }
    if (it.works && it.works.length) {
      var wk = el('span', 'vt-works');
      it.works.forEach(function (w) {
        var c = el('span', 'vt-wk'), im = el('i', w.img ? '' : 'is-text', w.img ? null : w.big);
        if (w.img) { setBg(im, w.img); if (w.pos) im.style.backgroundPosition = w.pos; }
        c.appendChild(im); c.appendChild(el('b', '', w.t)); c.appendChild(el('em', '', w.r)); wk.appendChild(c);
      });
      more.appendChild(wk);
    } else if (it.notes && it.notes.length) {
      var nt = el('ul', 'vt-notes'); it.notes.forEach(function (s) { nt.appendChild(el('li', '', s)); }); more.appendChild(nt);
    }
    a.appendChild(more);
    if (it.lane === 1) { school.appendChild(a); if (!schoolSeen++) school.appendChild(also); } else work.appendChild(a);
    cards.push(a);
    var s = el('i', 'vt-seg r' + (it.lane === 1 ? 1 : 0)); s.style.setProperty('--c', it.b || it.c);
    s.style.top = pa(end(it)) + '%'; s.style.height = Math.max(pa(+new Date(it.start)) - pa(end(it)), 0.9) + '%';
    axis.appendChild(s); segs.push(s);
    mids.push((+new Date(it.start) + end(it)) / 2);
  });
  if (!schoolSeen) school.appendChild(also);
  for (var yy = new Date(T.all).getUTCFullYear() + 1; yy <= new Date(T.end).getUTCFullYear(); yy++) {
    var q = el('i', 'vt-y', yy); q.style.top = pa(+new Date(yy + '-01-01')) + '%'; axis.appendChild(q);
  }
  var mark = el('i', 'vt-mark'); axis.appendChild(mark);

  /* p = which stop the marker is at (0 = newest, n-1 = oldest, can be between two). m = how strongly things grow (0 to 1). */
  var PEAK = 2.8;                                                              // a grown stop is about three and a half times as tall as a resting one
  var state = { p: 0, m: 0 }, focusAt = -1;
  function paint(p, m) {
    state.p = p; state.m = m;
    for (var i = 0; i < n; i++) {
      var g = Math.exp(-Math.pow((i - p) / 0.5, 2)), w = 1 + m * PEAK * g;
      cards[i].style.setProperty('--w', w.toFixed(3));
      cards[i].style.setProperty('--o', clamp((w - 1 - PEAK * 0.5) / (PEAK * 0.35)).toFixed(3));
      cards[i].style.setProperty('--up', (m * g).toFixed(3));
      segs[i].classList.toggle('is-on', m > 0.5 && g > 0.5);
    }
    var i0 = Math.max(0, Math.min(n - 1, Math.floor(p))), i1 = Math.min(n - 1, i0 + 1), f = clamp(p - i0);
    var d = mids[i0] * (1 - f) + mids[i1] * f; d = today * (1 - m) + d * m;      // before you scroll the marker sits on today
    mark.style.top = pa(d) + '%'; mark.setAttribute('data-y', m < 0.05 ? 'Today' : new Date(d).getUTCFullYear());
  }
  var narrow = window.matchMedia('(max-width: 820px), (max-aspect-ratio: 4/5)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var queued = false;
  function onScroll() {
    if (queued) return; queued = true;
    requestAnimationFrame(function () {
      queued = false;
      if (narrow.matches || reduce) { paint(0, 0); return; }
      if (focusAt >= 0) { paint(focusAt, 1); return; }                        // keyboard focus on a stop grows that stop
      var r = sec.getBoundingClientRect(), total = sec.offsetHeight - window.innerHeight;
      var u = total > 0 ? clamp(-r.top / total) : 0;
      var m = smooth(0.03, 0.13, u), t = clamp((u - 0.10) / 0.84);
      var raw = (n - 1) * t, i0 = Math.floor(raw);                             // newest first: the marker travels back in time
      paint(i0 + smooth(0.3, 0.7, raw - i0), m);                               // it rests on each stop and moves quickly between two
    });
  }
  cards.forEach(function (c, i) {
    c.addEventListener('focus', function () { if (c.matches(':focus-visible')) { focusAt = i; onScroll(); } });
    c.addEventListener('blur', function () { focusAt = -1; onScroll(); });
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint(0, 0);

  var show = function () { sec.classList.add('is-in'); setTimeout(function () { sec.classList.add('is-set'); onScroll(); }, 1300); };
  if (reduce || !('IntersectionObserver' in window)) { sec.classList.add('is-in', 'is-set'); }
  else new IntersectionObserver(function (en, io) { if (en[0].isIntersecting) { show(); io.disconnect(); } }, { threshold: 0.12 }).observe(sec.querySelector('.vt-body'));

  /* Prototype only: links to pages that exist only inside the real site say so instead of going nowhere. */
  var note = el('div', 'bx-note'); note.setAttribute('role', 'status'); document.body.appendChild(note); var noteT = 0;
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-exp]') : null; if (!a) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
  });

  sec.__tl = { state: function () {
    var best = 0, bw = 0; cards.forEach(function (c, i) { var w = parseFloat(c.style.getPropertyValue('--w')); if (w > bw) { bw = w; best = i; } });
    return { n: n, p: +state.p.toFixed(2), m: +state.m.toFixed(2), grown: bw > 1.5 ? stops[best].short : 'none', order: stops.map(function (s) { return s.short; }),
      heights: cards.map(function (c) { return Math.round(c.getBoundingClientRect().height); }), mark: mark.getAttribute('data-y'),
      railOn: Object.keys(railBars).filter(function (k) { return railBars[k].classList.contains('is-on'); }) };
  } };
})();
