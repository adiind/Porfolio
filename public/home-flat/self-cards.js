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
    if (!cached[type]) {
      try { var response = await fetch('/data/' + type + '-story.json'); if (!response.ok) throw Error('unavailable'); cached[type] = await response.json(); }
      catch (_) { if (ticket === request) track.textContent = 'The story could not be loaded. Please try again.'; }
    }
    if (ticket !== request) return;
    if (cached[type]) render(cached[type], type);
    track.scrollLeft = 0;
    if (!dialog.open) { if (!restore) history.pushState({ selfStory: true }, '', '#experience-' + type); dialog.showModal(); }
    if (link && link.classList.contains('bx-rescue')) { var rc = track.querySelector('[data-card="rescue"]'); if (rc) rc.scrollIntoView({ inline: 'start', block: 'nearest' }); }
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
