/* The mat's printed detail, like a real cutting mat: ruler ticks and numbers along the top and left edges,
   lined up with the grid, plus 45° and 60° angle lines printed from the bottom-left corner of the first screen.
   Built here because the numbers change along the edge; the grid itself is a CSS background (hero.css). */
(function () {
  var mat = document.querySelector('.mat');
  if (!mat) return;
  var CELL = 24, MAJOR = 120, FIRST = 60;      // must match the grid tile in hero.css: big lines at 60, 180, 300...
  var box = document.createElement('div');
  box.className = 'mat-print';
  box.setAttribute('aria-hidden', 'true');
  mat.insertBefore(box, mat.firstChild);

  function build() {
    var w = mat.clientWidth, h = mat.clientHeight, s = '';
    s += '<div class="mp-top"></div><div class="mp-left"></div>';
    for (var x = FIRST, n = 1; x < w - 30; x += MAJOR, n++) s += '<i class="mp-n mp-nx" style="left:' + x + 'px">' + n * 5 + '</i>';
    for (var y = FIRST, m = 1; y < h - 30; y += MAJOR, m++) s += '<i class="mp-n mp-ny" style="top:' + y + 'px">' + m * 5 + '</i>';
    // angle lines, from the bottom-left corner of the first screen
    var hero = document.querySelector('.bx'), hh = hero ? hero.offsetTop + hero.offsetHeight : innerHeight   /* v30: the strip sits above the first screen */;
    s += '<span class="mp-ang" style="top:' + (hh - 1) + 'px;--a:-45deg"><b>45°</b></span>';
    s += '<span class="mp-ang mp-dash" style="top:' + (hh - 1) + 'px;--a:-30deg"><b>30°</b></span>';
    s += '<span class="mp-ang mp-dash" style="top:' + (hh - 1) + 'px;--a:-60deg"><b>60°</b></span>';
    // Protractor: two arcs with degree ticks round the corner where the angle lines start.
    var R1 = 110, R2 = 190, svg = '<svg class="mp-pro" width="' + (R2 + 20) + '" height="' + (R2 + 20) + '" style="top:' + (h - R2 - 20) + 'px" viewBox="0 ' + (-R2 - 20) + ' ' + (R2 + 20) + ' ' + (R2 + 20) + '">';
    svg += '<path d="M' + R1 + ' 0A' + R1 + ' ' + R1 + ' 0 0 0 0 ' + (-R1) + '" stroke-opacity=".3"/><path d="M' + R2 + ' 0A' + R2 + ' ' + R2 + ' 0 0 0 0 ' + (-R2) + '" stroke-opacity=".35"/>';
    for (var d = 0; d <= 90; d += 5) {
      var r = d * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), L = d % 15 ? 7 : 14;
      svg += '<line x1="' + (R2 * c).toFixed(1) + '" y1="' + (-R2 * sn).toFixed(1) + '" x2="' + ((R2 - L) * c).toFixed(1) + '" y2="' + (-(R2 - L) * sn).toFixed(1) + '" stroke-opacity="' + (d % 15 ? .35 : .6) + '"/>';
      svg += '<line x1="' + (R1 * c).toFixed(1) + '" y1="' + (-R1 * sn).toFixed(1) + '" x2="' + ((R1 + 5) * c).toFixed(1) + '" y2="' + (-(R1 + 5) * sn).toFixed(1) + '" stroke-opacity=".3"/>';
      if (!(d % 15) && d && d < 90) svg += '<text x="' + ((R2 + 6) * c).toFixed(1) + '" y="' + (-(R2 + 6) * sn + 3).toFixed(1) + '">' + d + '</text>';
    }
    s += svg + '</svg>';
    // Circle templates, the kind printed on real mats, in the open margins of the timeline.
    var circles = [[w - 70, hh + 150, 64], [w - 70, hh + 150, 34], [w - 90, h - 110, 70], [w - 90, h - 110, 40], [w - 90, h - 110, 14]];
    circles.forEach(function (k) { if (k[1] < h - 10) s += '<span class="mp-circ" style="left:' + k[0] + 'px;top:' + k[1] + 'px;width:' + 2 * k[2] + 'px;height:' + 2 * k[2] + 'px"></span>'; });
    box.innerHTML = s;
  }
  build();
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 150); });
  if (window.ResizeObserver) new ResizeObserver(function () { clearTimeout(t); t = setTimeout(build, 150); }).observe(mat);
})();
