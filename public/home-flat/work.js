/* Selected work on the flat home page: builds <section id="work"> from window.__WORK (work-data.js) and puts it before the
   timeline. Each tile is a plain link to the project's own page (/work/<id>); the tiles are put down as they scroll into view. */
(function () {
  'use strict';
  var list = window.__WORK;
  var timeline = document.getElementById('timeline');
  if (!list || !list.length || !timeline || document.getElementById('work')) return;

  /* where each project sits on the two-column board: w = columns across, h = rows down. A project with no place takes one
     cell at the end. The order is the order on the page (the grid fills in dense, so the big ones do not leave holes). */
  var PLACE = {
    glyph: [2, 2], 'pg-haircare': [2, 1], 'familysync-jpmorgan': [1, 1], 'mcdonalds-interaction-design': [1, 1],
    /* Surya and Jarvis show their flip book's cover, which is a wide picture with words on it: a wide tile, so it is not cut */
    surya: [2, 1], jarvis: [2, 1], lawn: [1, 1], 'zero-my-ai': [1, 1], helios: [1, 1], plotter: [1, 1], solopump: [1, 1],
    'portfolio-website': [1, 1]
  };
  var ORDER = ['glyph', 'pg-haircare', 'familysync-jpmorgan', 'mcdonalds-interaction-design', 'surya', 'jarvis', 'lawn', 'zero-my-ai', 'helios', 'plotter', 'solopump', 'portfolio-website'];
  var STATUS = { shipped: 'Shipped', 'in-progress': 'In progress', archived: 'Archived', concept: 'Concept' };
  var TURN = [-0.6, 0.5, -0.3, 0.7, -0.5, 0.4, -0.7, 0.3, -0.4, 0.6, -0.5, 0.5];

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  /* not listed here: the three human-centered design case studies (dealt as cards from the design poster on the mat; Adi: "in projects remove the ones i remade") and, at his next ask (2026-11-17), Surya and Jarvis, which are the booklets above */
  var REMADE = ['familysync-jpmorgan', 'mcdonalds-interaction-design', 'pg-haircare', 'surya', 'jarvis', 'lawn'];
  var items = list.filter(function (it) { return REMADE.indexOf(it.id) < 0; }).sort(function (a, b) {
    var ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  /* two columns: when the tiles' cells add up to an odd number the last tile is made wide, so the board ends with no gap */
  var area = 0;
  items.forEach(function (it) { var pl = PLACE[it.id] || [1, 1]; area += pl[0] * pl[1]; });
  var lastWide = area % 2 === 1 ? items[items.length - 1].id : '';

  var sec = el('section', 'wf');
  sec.id = 'work';
  sec.setAttribute('aria-label', 'Selected work');
  var h = el('h2'); h.appendChild(document.createTextNode('Selected ')); h.appendChild(el('em', '', 'work.'));
  sec.appendChild(h);
  sec.appendChild(el('p', 'wf-sub', items.length + ' things I made. Tap any to open its page.'));
  var board = el('ul', 'wf-board');
  items.forEach(function (item, i) {
    var place = item.id === lastWide ? [2, 1] : (PLACE[item.id] || [1, 1]);
    var big = place[0] * place[1] >= 4, wide = place[0] >= 2;
    var li = el('li', 'wf-cell');
    li.setAttribute('data-w', place[0]); li.setAttribute('data-h', place[1]);
    var a = el('a', 'wf-tile');
    a.href = '/work/' + item.id;
    a.style.setProperty('--t', TURN[i % TURN.length] + 'deg');
    a.style.setProperty('--d', (i % 2) * 70 + 'ms');
    a.setAttribute('aria-label', item.name + (item.rest ? ': ' + item.rest : ''));
    if (item.pic) { var img = el('img', 'wf-pic'); img.src = item.pic; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; a.appendChild(img); }
    else a.appendChild(el('span', 'wf-pic'));
    // a flip book's cover already has its name, line and status on it: the tile is the cover, with no label over it
    if (item.pic && item.pic.indexOf('assets/books/') === 0) { a.classList.add('wf-cover'); li.appendChild(a); board.appendChild(li); return; }
    if ((big || wide) && STATUS[item.status]) { var tag = el('span', 'wf-tag', STATUS[item.status]); tag.setAttribute('data-s', item.status); a.appendChild(tag); }
    var label = el('span', 'wf-label');
    label.appendChild(el('span', 'wf-name', item.name));
    if (item.rest && (big || wide)) label.appendChild(el('span', 'wf-rest', item.rest));
    if (big && item.line) label.appendChild(el('span', 'wf-line', item.line));
    a.appendChild(label);
    li.appendChild(a); board.appendChild(li);
  });
  sec.appendChild(board);
  timeline.parentNode.insertBefore(sec, timeline);

  // each tile is put down as it comes into view
  var tiles = Array.prototype.slice.call(board.querySelectorAll('.wf-tile'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { tiles.forEach(function (t) { t.classList.add('is-down'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-down'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  tiles.forEach(function (t) { io.observe(t); });
})();
