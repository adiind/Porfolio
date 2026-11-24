/* Project books on the mat (see books.css). The list comes from books-data.js, which is written from the site's own
   list of flip books (scripts/flipbook/make-home-books.mjs), so a new book appears here without touching this page.

   Clicking a booklet goes to its page, /book/<slug>. That page opens on this same mat: before leaving, this script lays
   the wall flat, fades everything except the mat and the booklet, and tells the book page where the booklet lies, where
   the mat is and what the sunlight looks like, so the first thing the book page draws is exactly what is on screen here.
   The book page's "Portfolio" link comes back with ?back=<slug>: the booklet is then already in place and the rest of
   the page fades in round it. */
(function () {
  var board = document.querySelector('.bx-board'), bx = document.querySelector('.bx'), mat = document.querySelector('.mat');
  var books = window.__BOOKS || [];
  if (!board || !bx || !mat || !books.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var query = new URLSearchParams(location.search);
  var back = query.get('back');
  var base = window.__BOOK_BASE || '';          // where the site's /book pages live, when this page is served from somewhere else

  var zone = document.createElement('div');
  zone.className = 'bk-zone';
  zone.setAttribute('aria-label', 'Project books');
  var prt = board.querySelector('.bx-prt');
  board.insertBefore(zone, prt || null);

  // one booklet lies in the middle; more lie one below the other down the open mat, each whole and each at its own small
  // angle, so every one can be seen and picked up
  var wide = window.matchMedia('(min-width:821px) and (min-aspect-ratio:4/5)').matches;
  var cols = books.length > 2 && wide ? 2 : 1;                // many books on a wide window: two to a row, on the room the printer used to have
  if (cols === 2) zone.dataset.cols = '2';
  var rows = Math.ceil(books.length / cols);
  if (books.length > 1) zone.style.setProperty('--bk-h', ((cols === 2 ? 84 : 88) / rows).toFixed(1) + 'cqh');
  // on a phone the pile needs more room than one booklet: one more row of the wall for every further booklet
  if (books.length > 1) zone.style.setProperty('--bk-rows', String(books.length + 1));
  var TURN = [-4, 3, -2, 4, -3];
  books.forEach(function (book, i) {
    var a = document.createElement('a');
    a.className = 'bk' + (book.slug === back ? ' is-home' : '');
    a.href = base + '/book/' + book.slug;
    a.dataset.slug = book.slug;
    a.setAttribute('aria-label', book.title + ', a flip book. ' + book.line + '. Opens the book.');
    a.style.setProperty('--bk-board', book.board);
    a.style.setProperty('--bt', TURN[i % TURN.length] + 'deg');
    if (cols === 2) {
      a.style.setProperty('--by', ((Math.floor(i / 2) - (rows - 1) / 2) * 112) + '%');   // per cent of the booklet's own height
      a.style.setProperty('--bx', (i % 2 ? 25 : -25) + 'cqw');
      a.style.zIndex = String(i + 1);
    } else if (books.length > 1) {
      a.style.setProperty('--by', ((i - (books.length - 1) / 2) * 112) + '%');
      a.style.setProperty('--bx', ((i % 2 ? 1 : -1) * 4) + '%');
      a.style.zIndex = String(i + 1);
    }
    a.innerHTML = '<span class="bk-in"><img src="' + book.cover + '" alt="" loading="lazy" decoding="async"></span><span class="bk-tag"><b>' + book.title + '</b> · flip book</span>';
    zone.appendChild(a);
  });

  /* Everything that is not the mat itself or on the way down to the booklets: these fade when a book is opened. */
  function others() {
    var out = [], node = zone;
    while (node && node !== mat) {
      var parent = node.parentElement;
      Array.prototype.forEach.call(parent.children, function (el) {
        if (el !== node && !/(^| )(sun|mat-print)( |$)/.test(el.className || '') && el.tagName !== 'SCRIPT') out.push(el);
      });
      node = parent;
    }
    return out;
  }
  others().forEach(function (el) { el.classList.add('bk-fade'); });

  function reset() {
    mat.classList.remove('is-booking');
    Array.prototype.forEach.call(zone.querySelectorAll('.is-going'), function (el) { el.classList.remove('is-going'); });
    Array.prototype.forEach.call(zone.children, function (el) { el.style.opacity = ''; });
    if (bx.__tiles) bx.__tiles.go();
  }
  // the browser's Back button can bring this page back just as it was left: put it right again
  window.addEventListener('pageshow', function (e) { if (e.persisted) reset(); });

  function open(a) {
    var slug = a.dataset.slug, inner = a.querySelector('.bk-in');
    var turn = parseFloat(getComputedStyle(inner).rotate) || parseFloat(a.style.getPropertyValue('--bt')) || 0;
    function go() {
      var r = a.getBoundingClientRect(), m = mat.getBoundingClientRect();
      // the sunlight as it is right now, so the book page can show the very same light before its own is ready
      try {
        var sun = document.querySelector('.sun-c');
        if (sun && sun.width > 8) sessionStorage.setItem('book-sun', sun.toDataURL('image/jpeg', 0.72));
      } catch (err) { /* private windows may refuse storage: the book page then starts without the light */ }
      var p = new URLSearchParams({
        from: location.pathname,
        bx: (r.left + r.width / 2).toFixed(1), by: (r.top + r.height / 2).toFixed(1), bw: r.width.toFixed(1), bt: String(turn),
        mx: m.left.toFixed(1), my: m.top.toFixed(1), mw: m.width.toFixed(1), mh: m.height.toFixed(1),
        sun: (performance.now() / 1000 + 40).toFixed(1),
        // the cover picture this page already has in hand, and the colour of the boards, so the book page can draw the booklet at once
        cv: new URL(a.querySelector('img').src, location.href).pathname, bc: a.style.getPropertyValue('--bk-board').trim(),
        sy: String(Math.round(window.scrollY))          // how far down the page this was, to come back to the same place
      });
      location.assign(a.href + '?' + p.toString());
    }
    if (bx.__tiles) bx.__tiles.stop();
    if (reduce) { go(); return; }
    a.classList.add('is-going');
    Array.prototype.forEach.call(zone.children, function (el) { if (el !== a) el.style.opacity = '0'; });
    mat.classList.add('is-booking');
    // on a timer, not on the transition's end: a hidden window starves frames
    setTimeout(go, 400);
  }
  zone.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.bk');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    open(a);
  });

  if (back) {
    // back where the reader was on the page, so the booklet is where the book page last showed it
    if (window.__BK_SY) window.scrollTo(0, window.__BK_SY);
    // tidy the address, so a reload is a plain visit
    try { history.replaceState(history.state, '', location.pathname + location.hash); } catch (err) { /* keep the address as it is */ }
    setTimeout(function () { document.documentElement.classList.remove('bk-back'); }, 2600);
  }
})();
