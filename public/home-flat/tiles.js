/* The wall keeps re-tiling, like a sliding puzzle: every few seconds one block glides into the one open slot.
   Adi: "make the tiling a bit more dynamic, so it keeps on changing ... maybe the self one becomes smaller and moves around".
   Blocks never change size, so nothing stretches; they only slide, on the 'translate' property so their own hover lift and
   entrance keep working. It stops while you point at or tab into the wall, when the tab is hidden, with reduced motion, and on
   phones (where the wall is a plain column and the CSS places the blocks).
   The grid: 6 columns and two bands, each 2 rows tall (rows 1-2 and 3-4). The printer stands fixed in columns 4-6 of the bottom
   band, so the bottom band has 3 usable columns and the top band 6. Blocks are 1 or 2 columns wide and always a full band tall.
   Their widths add up to 7 of the 9 usable columns, which leaves two open slots to move into. */
(function () {
  var board = document.querySelector('.bx-board'), bx = document.querySelector('.bx');
  if (!board || !bx) return;
  var W = { self: 1, zo: 2, hcd: 2, fr: 1, sd: 1 };
  var EL = { self: '.bx-self', zo: '.bx-zo', hcd: '.bx-hcd', fr: '.bx-rescue', sd: '.bx-ads' };
  for (var k in EL) { EL[k] = board.querySelector(EL[k]); if (!EL[k]) return; }
  var USABLE = [6, 3];
  /* where each block starts: [first column (0 = left), band (0 = top, 1 = bottom)] — the same as the CSS */
  var pos = { self: [0, 0], zo: [1, 0], hcd: [3, 0], fr: [5, 0], sd: [0, 1] };
  var narrow = window.matchMedia('(max-width: 820px), (max-aspect-ratio: 4/5)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]tiles=off/.test(location.search);
  var last = null, timer = 0, stopped = false;   // last = the previous move [block, from column, from band]

  function place(id) {
    var p = pos[id], e = EL[id];
    e.style.gridColumn = (p[0] + 1) + ' / span ' + W[id];
    e.style.gridRow = p[1] ? '3 / 5' : '1 / 3';
  }
  function clear() { for (var id in EL) { EL[id].style.gridColumn = ''; EL[id].style.gridRow = ''; EL[id].style.translate = ''; } }
  function taken(band, col, skip) {
    for (var id in pos) { if (id === skip) continue; var p = pos[id]; if (p[1] === band && col >= p[0] && col < p[0] + W[id]) return true; }
    return false;
  }
  function moves() {
    var out = [];
    for (var id in pos) {
      var c = pos[id][0], b = pos[id][1], w = W[id];
      if (c - 1 >= 0 && !taken(b, c - 1, id)) out.push([id, c - 1, b]);                       // slide left one column
      if (c + w < USABLE[b] && !taken(b, c + w, id)) out.push([id, c + 1, b]);                  // slide right one column
      var o = 1 - b;                                                                            // a 1-wide block can change band
      if (w === 1 && c < USABLE[o] && !taken(o, c, id)) out.push([id, c, o]);
    }
    return out;
  }
  function step() {
    if (stopped || still || narrow.matches || document.hidden) return;
    if (!bx.classList.contains('is-set')) return;
    var stage = board.parentElement;
    if (stage.matches(':hover') || board.matches(':focus-within')) return;   // never move what someone is aiming at (gaps included)
    var all = moves();
    /* never the exact undo of the previous move (a block sliding out and straight back reads as twitching) */
    var m = all.filter(function (mv) { return !last || !(mv[0] === last[0] && mv[1] === last[1] && mv[2] === last[2]); });
    if (!m.length) m = all;
    if (!m.length) return;
    /* prefer a move after which other blocks can still move, so the open slots never get stuck in a corner */
    var good = m.filter(function (mv) {
      var keep = pos[mv[0]]; pos[mv[0]] = [mv[1], mv[2]];
      var n = moves().filter(function (x) { return x[0] !== mv[0]; }).length;
      pos[mv[0]] = keep; return n > 1;
    });
    if (good.length) m = good;
    var mv = m[Math.floor(Math.random() * m.length)], id = mv[0], e = EL[id];
    var x0 = e.offsetLeft, y0 = e.offsetTop, from = pos[id].slice();
    pos[id] = [mv[1], mv[2]]; place(id);
    var dx = x0 - e.offsetLeft, dy = y0 - e.offsetTop;            // layout positions in the board's own plane (the board is tilted)
    e.classList.remove('is-sliding'); e.style.translate = dx + 'px ' + dy + 'px';
    void e.offsetWidth;
    e.classList.add('is-sliding'); e.style.translate = '0px 0px';
    last = [id, from[0], from[1]];
    setTimeout(function () { e.classList.remove('is-sliding'); e.style.translate = ''; }, 1500);
  }
  function apply() { if (narrow.matches) clear(); else for (var id in EL) place(id); }
  apply();
  if (narrow.addEventListener) narrow.addEventListener('change', apply);
  timer = setInterval(step, 4800);
  bx.__tiles = {
    state: function () { var s = {}; for (var id in pos) s[id] = pos[id].slice(); return s; },
    stop: function () { stopped = true; }, go: function () { stopped = false; },
    step: function () { var s = stopped; stopped = false; step(); stopped = s; },
    set: function (p) { for (var id in p) pos[id] = p[id].slice(); apply(); }
  };
})();
