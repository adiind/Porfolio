/* Self story for the flat, narrow-screen mat. Copy is shared with the 3D cards. */
(function () {
  var dialog = document.createElement('dialog');
  dialog.className = 'self-story-dialog';
  dialog.setAttribute('aria-label', 'Self story');
  dialog.innerHTML = '<div class="self-story-head"><button type="button" class="self-story-back" aria-label="Back from Self story">← Back</button><strong>Self</strong><a class="self-story-full" href="/experience/self-xyz">Full page ↗</a></div><div class="self-story-track" role="region" tabindex="0" aria-label="Self story cards"></div><p class="self-story-hint">Swipe to read the cards</p>';
  document.body.appendChild(dialog);
  var track = dialog.querySelector('.self-story-track');
  var returnTo = null;
  var cached = {};
  var request = 0;
  function close() { request++; if (!dialog.open) { returnTo = null; return; } dialog.close(); if (returnTo) returnTo.focus(); returnTo = null; }
  function make(tag, cls, text) { var el = document.createElement(tag); el.className = cls; el.textContent = text; return el; }
  function render(cards, type) {
    track.replaceChildren();
    cards.forEach(function (card, index) {
      var article = make('article', 'self-story-card', '');
      article.dataset.card = card.id;
      article.dataset.kind = type;
      article.appendChild(make('p', 'self-story-kicker', card.kicker));
      var art = type === 'self' ? (card.id === 'vault' ? 'AGENT → CHECKOUT' : card.id === 'protect' ? 'STAND-IN → ENCLAVE → CHECKOUT' : card.id === 'role' ? 'DIRECTION · TESTING · WORKFLOWS' : 'Self × DeleteMe') : type === 'snapdeal' ? (card.id === 'ads' ? 'CPC · TRANSACTION · BANNERS' : card.id === 'result' ? '14% SELLER AD REVENUE' : card.id === 'warehouse' ? 'WAREHOUSE · INVENTORY · PROCUREMENT' : 'DATA · ANALYSIS · FINANCE') : card.kicker.split(' · ').pop().toUpperCase();
      if (['self', 'udaan', 'snapdeal', 'schmooze'].indexOf(type) >= 0) {
        var visual = make('div', 'self-story-art self-story-illustration illustration-' + index, '');
        visual.style.backgroundImage = 'url(/images/mat/story-art/' + type + '.webp)';
        visual.setAttribute('role', 'img'); visual.setAttribute('aria-label', 'AI-generated conceptual illustration');
        visual.appendChild(make('small', '', 'AI illustration')); article.appendChild(visual);
      } else article.appendChild(make('div', 'self-story-art self-story-art-' + card.id, art));
      article.appendChild(make('h2', '', card.title));
      card.lines.forEach(function (line) { article.appendChild(make('p', 'self-story-copy', line)); });
      if (type === 'self' && card.id === 'vault') {
        var link = make('a', 'self-story-link', 'Visit Agent Vault ↗');
        link.href = 'https://agentvault.io/'; link.target = '_blank'; link.rel = 'noopener noreferrer'; article.appendChild(link);
      }
      var signatures = { self:'Self · 2026', snapdeal:'Snapdeal · 2020–2022', zomato:'Zomato · 2024–2025', udaan:'Udaan · 2023–2024', schmooze:'Schmooze · 2022' };
      article.appendChild(make('div', 'self-story-signature', signatures[type]));
      track.appendChild(article);
    });
  }
  /* Zomato: not cards but one scroll of the papers from his rider's bag, the same pictures and words as the 3D bag
     (zomato-scroll.json and assets/zomato/, written by scripts/phone/make-zomato.mjs). Asked for only when opened. */
  var scroll = null;
  function pic(p, alt, cls, now) { var el = document.createElement('img'); el.src = p.src; el.width = p.w; el.height = p.h; el.alt = alt; if (cls) el.className = cls; el.decoding = 'async'; if (!now) el.loading = 'lazy'; return el; }
  function renderScroll(d) {
    var w = d.words, p = d.pictures, r = w.rescue;
    track.replaceChildren();
    var top = make('header', 'zs-top', '');
    top.appendChild(make('p', 'zs-role', w.role + ' \u00b7 ' + w.when));
    top.appendChild(pic(p.bag, 'His Zomato rider\u2019s bag, open on the mat', 'zs-bag', true));
    track.appendChild(top);
    var bill = make('section', 'zs-thing zs-bill', '');
    bill.appendChild(pic(p.bill, 'The bill from the bag. ' + w.role + ', ' + w.team + ', ' + w.when + '. ' + w.lines.join(' ') + ' ' + w.skillsHeading + ': ' + w.skills.join(', ') + '. ' + w.closing));
    track.appendChild(bill);
    w.projects.forEach(function (pr) {
      var box = make('section', 'zs-thing zs-box zs-box-' + pr.id, '');
      box.appendChild(pic(p[pr.id], pr.title + ', ' + pr.role + '. ' + pr.lines.join(' ') + (pr.foot ? ' ' + pr.foot : '')));
      var shot = make('div', 'zs-shot', '');
      shot.appendChild(pic(p[pr.id + 'Shot'], pr.id === 'home' ? 'The Zomato home screen' : 'Recommendations from Friends, as Zomato announced it'));
      box.appendChild(shot); track.appendChild(box);
    });
    /* Food Rescue: the seven events, the result and his part, as text */
    var fr = make('section', 'zs-thing zs-rescue', ''); fr.dataset.card = 'rescue';
    var head = make('div', 'zs-rescue-head', '');
    head.appendChild(pic(p.paperBag, '', 'zs-paperbag'));
    var ht = make('div', '', ''); ht.appendChild(make('h2', '', r.title)); ht.appendChild(make('p', 'zs-sub', w.company + ' \u00b7 ' + r.role + ' \u00b7 ' + r.years)); head.appendChild(ht); fr.appendChild(head);
    var kick = make('p', 'zs-kicker', r.kicker + ' '); kick.appendChild(make('span', '', r.example)); fr.appendChild(kick);
    var list = make('ol', 'zs-steps', '');
    r.steps.forEach(function (st, i) {
      var li = make('li', '', ''); li.dataset.tone = st.tone;
      li.appendChild(make('b', 'zs-n', st.n));
      var body = make('div', '', '');
      var h = make('h3', '', st.title + ' '); h.appendChild(make('time', '', st.clock)); body.appendChild(h);
      body.appendChild(make('p', '', st.line));
      if (st.why) body.appendChild(make('p', /^Rule:/.test(st.why) ? 'zs-why zs-rule' : 'zs-why', st.why));
      if (i === 2) { var loss = make('ul', 'zs-loss', ''); r.losses.forEach(function (l) { var x = make('li', '', ''); x.appendChild(make('b', '', l.who)); x.appendChild(document.createTextNode(' ' + l.text)); loss.appendChild(x); }); body.appendChild(loss); }
      if (i === 4) { var fig = make('figure', 'zs-offer', ''); fig.appendChild(pic(p.offer, 'The offer in the Zomato app: an order was just cancelled, claim it at ' + r.offer.priceTag)); fig.appendChild(make('figcaption', '', r.offer.caption)); body.appendChild(fig); }
      li.appendChild(body); list.appendChild(li);
    });
    fr.appendChild(list);
    var res = make('div', 'zs-result', '');
    res.appendChild(make('p', 'zs-lead', r.result.lead));
    var big = make('p', 'zs-fig', ''); big.appendChild(make('b', '', r.result.figure)); big.appendChild(document.createTextNode(' ' + r.result.caption)); res.appendChild(big);
    res.appendChild(make('h3', '', r.result.gainsTitle));
    var dl = make('dl', '', ''); r.gains.forEach(function (g) { dl.appendChild(make('dt', '', g.who)); dl.appendChild(make('dd', '', g.text)); }); res.appendChild(dl);
    res.appendChild(make('p', 'zs-press-line', r.result.press)); fr.appendChild(res);
    var part = make('div', 'zs-part', ''); part.appendChild(make('h3', '', r.myPart.title)); part.appendChild(make('p', 'zs-sub', r.myPart.role));
    var pl = make('ol', '', ''); r.myPart.lines.forEach(function (t) { pl.appendChild(make('li', '', t)); }); part.appendChild(pl); fr.appendChild(part);
    track.appendChild(fr);
    /* the press clipping: the picture, with a real link over each headline that has one */
    var press = make('section', 'zs-thing zs-press', '');
    var said = w.press.sections.map(function (s) { return s.project + ': ' + s.articles.map(function (a) { return a.title + ' (' + a.source + ')'; }).join('; '); }).join('. ');
    var wrap = make('div', 'zs-press-paper', ''); wrap.appendChild(pic(p.press, w.press.heading + '. ' + said));
    (p.press.regions || []).forEach(function (g) { var a = make('a', 'zs-hit', ''); a.href = g.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', g.source + ': opens in a new tab'); a.style.cssText = 'left:' + g.x0 * 100 + '%;top:' + g.y0 * 100 + '%;width:' + (g.x1 - g.x0) * 100 + '%;height:' + (g.y1 - g.y0) * 100 + '%'; wrap.appendChild(a); });
    press.appendChild(wrap); track.appendChild(press);
    var photo = make('section', 'zs-thing zs-photo', ''); photo.appendChild(pic(p.photo, 'Adi at the Zomato office')); track.appendChild(photo);
  }
  async function open(link, type, restore) {
    var ticket = ++request;
    returnTo = link;
    var names = {self:'Self', snapdeal:'Snapdeal', zomato:'Zomato', udaan:'Udaan', schmooze:'Schmooze'};
    dialog.setAttribute('aria-label', names[type] + ' story');
    track.setAttribute('aria-label', names[type] + ' story cards');
    dialog.querySelector('strong').textContent = names[type];
    dialog.querySelector('button').setAttribute('aria-label', 'Back from ' + names[type] + ' story');
    /* the stop's full page (Adi, 2026-11-24: a link for now) */
    var full = dialog.querySelector('.self-story-full');
    full.href = '/experience/' + (type === 'self' ? 'self-xyz' : type); full.setAttribute('aria-label', names[type] + ': open the full page');
    if (type === 'zomato' && !scroll) {
      try { var papers = await fetch('/home-flat/zomato-scroll.json'); if (papers.ok) scroll = await papers.json(); } catch (_) { /* the cards below stand in */ }
      if (ticket !== request) return;
    }
    var asScroll = type === 'zomato' && !!scroll;
    if (asScroll) { dialog.dataset.scroll = 'true'; track.dataset.scroll = 'true'; } else { delete dialog.dataset.scroll; delete track.dataset.scroll; }
    track.setAttribute('aria-label', names[type] + (asScroll ? ' work, from his rider\u2019s bag' : ' story cards'));
    if (!asScroll && !cached[type]) {
      try { var response = await fetch('/data/' + type + '-story.json'); if (!response.ok) throw Error('unavailable'); cached[type] = await response.json(); }
      catch (_) { if (ticket === request) track.textContent = 'The story could not be loaded. Please try again.'; }
    }
    if (ticket !== request) return;
    if (asScroll) renderScroll(scroll); else if (cached[type]) render(cached[type], type);
    track.scrollLeft = 0; track.scrollTop = 0;
    if (!dialog.open) { if (!restore) history.pushState({ selfStory: true }, '', '#experience-' + type); dialog.showModal(); }
    if (link && link.classList.contains('bx-rescue')) { var rc = track.querySelector('[data-card="rescue"]'); if (rc) rc.scrollIntoView({ inline: 'start', block: asScroll ? 'start' : 'nearest' }); }
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('.bx-self, .bx-ads, .bx-zo, .bx-rescue, .vt-cards [data-exp="Self"], .vt-cards [data-exp="Snapdeal"], .vt-cards [data-exp="Zomato"], .vt-cards [data-exp="Udaan"], .vt-cards [data-exp="Schmooze"]');
    if (!link) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var type = link.classList.contains('bx-self') ? 'self' : link.classList.contains('bx-ads') ? 'snapdeal' : (link.classList.contains('bx-zo') || link.classList.contains('bx-rescue')) ? 'zomato' : (link.getAttribute('data-exp') || '').toLowerCase();
    event.preventDefault(); event.stopImmediatePropagation(); void open(link, type);
  }, true);
  function leave() { if (history.state && history.state.selfStory) history.back(); else { history.replaceState(history.state, '', location.pathname + location.search); close(); } }
  dialog.querySelector('button').addEventListener('click', leave);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); leave(); });
  function sync() {
    var match = location.hash.match(/^#experience-(self|snapdeal|zomato|udaan|schmooze)$/);
    if (match) void open(null, match[1], true); else close();
  }
  window.addEventListener('popstate', sync);
  sync();
})();
