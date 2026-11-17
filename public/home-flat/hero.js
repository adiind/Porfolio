/* Home v14. No libraries.
   1. Soft moving light on the background (small WebGL program; plain colour if WebGL is missing).
   2. The opening: the greeting slides up, the blocks fly in from far away and lock into a grid, the stickers go onto the tape.
   3. The board turns a little toward the pointer; a sheen follows the pointer across each block.
   4. The narrator: one proof sentence at a time, and the block it talks about lifts and gets an edge light.
   5. Numbers count up, bars and the ring draw themselves, the McDonald's block steps through four real screens. */
(function () {
  var root = document.querySelector('.bx');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 820px), (max-aspect-ratio: 4/5)');
  var canHover = window.matchMedia('(hover: hover)').matches;
  var running = true;

  /* Each sentence is a fact from data/timeline.ts, paired with the block that shows it. */
  var PROOF = [
    ['I worked on agentic AI products at <b class="c-self">Self</b>.', 'self'],
    ['Design with <b class="c-hcd">JPMorgan Chase, McDonald’s</b> and <b class="c-hcd">P&amp;G</b>.', 'hcd'],
    ['Analytics for <b class="c-num">~10M</b> daily users.', 'zomato'],
    ['Food waste cut by <b class="c-zo">about half</b>.', 'rescue'],
    ['Ads revenue up <b class="c-num">14%</b>.', 'ads']
  ];

  /* ---------- 1. Moving light ---------- */
  var canvas = root.querySelector('.bx-light');
  var gl = null, prog = null, uRes, uTime, lightStart = performance.now();
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) {}
  if (gl) {
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;uniform vec2 r;uniform float t;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+17.;a*=.5;}return s;}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/r; vec2 p=(gl_FragCoord.xy-.5*r)/r.y;',
      '  float a=fbm(p*1.15+vec2(t*.030,t*.018));',
      '  float b=fbm(p*1.55+vec2(-t*.022,t*.026)+a*1.4);',
      '  float c=fbm(p*.95+vec2(t*.016,-t*.021)+7.3+b);',
      '  vec3 base=vec3(.957,.953,.937);',
      '  vec3 col=base;',
      '  col=mix(col,vec3(.50,.74,1.0),smoothstep(.36,.62,a)*.90);',
      '  col=mix(col,vec3(.74,.60,1.0),smoothstep(.42,.66,b)*.80);',
      '  col=mix(col,vec3(1.0,.68,.48),smoothstep(.46,.70,c)*.80);',
      '  col=mix(col,vec3(.92,.96,.42),smoothstep(.52,.72,fbm(p*1.3-3.+vec2(t*.02,t*.013)))*.50);',
      '  float d=length((uv-vec2(.665,.49))*vec2(r.x/r.y,1.));',      // distance from the middle of the wall
      '  float halo=smoothstep(1.25,.12,d);',
      '  col=mix(base,col,.05+.95*halo);',                            // calm behind the words, a cloud of light behind the wall
      '  col+=(h(gl_FragCoord.xy+t)-.5)*.012;',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');
    var mk = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    var v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs);
    if (v && f) { prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null; }
    if (prog) {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uRes = gl.getUniformLocation(prog, 'r'); uTime = gl.getUniformLocation(prog, 't');
    }
  }
  if (!prog) canvas.style.display = 'none';
  function sizeLight() {
    if (!prog) return;
    var w = Math.max(2, Math.round(root.clientWidth * 0.5)), h = Math.max(2, Math.round(Math.min(root.clientHeight, 1400) * 0.5));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  function drawLight(now) {
    if (!prog) return;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduce ? 12.0 : (now - lightStart) / 1000 + 12.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- 3. Board tilt and sheen ---------- */
  var blocks = Array.prototype.slice.call(root.querySelectorAll('.bx-b'));
  var tx = 0, ty = 0, cx = 0, cy = 0, hasPointer = false;
  if (!reduce && canHover) {
    root.addEventListener('pointermove', function (e) {
      var r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      hasPointer = true;
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i].getBoundingClientRect();
        blocks[i].style.setProperty('--mx', (((e.clientX - b.left) / b.width) * 100).toFixed(1) + '%');
        blocks[i].style.setProperty('--my', (((e.clientY - b.top) / b.height) * 100).toFixed(1) + '%');
      }
    });
    root.addEventListener('pointerleave', function () { hasPointer = false; });
    var btn = root.querySelector('.bx-btn');
    btn.addEventListener('pointermove', function (e) {
      var b = btn.getBoundingClientRect();
      btn.style.setProperty('--bx', (((e.clientX - b.left) / b.width - 0.5) * 10).toFixed(1) + 'px');
      btn.style.setProperty('--by', (((e.clientY - b.top) / b.height - 0.5) * 8).toFixed(1) + 'px');
    });
    btn.addEventListener('pointerleave', function () { btn.style.setProperty('--bx', '0px'); btn.style.setProperty('--by', '0px'); });
  }
  var last = performance.now();
  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!narrow.matches) {
      var s = now / 1000;                                   // with no pointer, the board drifts slowly by itself
      var gx = hasPointer ? tx : Math.sin(s * 0.4) * 0.35;
      var gy = hasPointer ? ty : Math.sin(s * 0.29 + 1.2) * 0.3;
      var k = 1 - Math.exp(-dt * 4.5);
      cx += (gx - cx) * k; cy += (gy - cy) * k;
      root.style.setProperty('--ry', (cx * 5).toFixed(3));
      root.style.setProperty('--rx', (-cy * 3.2).toFixed(3));
    }
    drawLight(now);
    requestAnimationFrame(frame);
  }

  /* ---------- 4. The narrator ---------- */
  var sayA = root.querySelector('.bx-say-a'), sayB = root.querySelector('.bx-say-b'), pi = 0, userHot = false;
  function hot(id) { for (var i = 0; i < blocks.length; i++) blocks[i].classList.toggle('is-hot', !!id && blocks[i].getAttribute('data-b') === id); }
  function say(i) {
    pi = (i + PROOF.length) % PROOF.length;
    var inEl = sayB, outEl = sayA;
    inEl.innerHTML = PROOF[pi][0];            // fixed strings from the list above, with coloured words
    inEl.classList.add('is-wait'); inEl.classList.remove('is-out');
    void inEl.offsetWidth;                                   // let the browser register the start position
    inEl.classList.remove('is-wait'); outEl.classList.add('is-out');
    inEl.removeAttribute('aria-hidden'); outEl.setAttribute('aria-hidden', 'true');
    sayA = inEl; sayB = outEl;
    if (!userHot) hot(PROOF[pi][1]);
  }
  function nextProof() { if (running && !userHot) say(pi + 1); }
  /* Pointing at a proof block makes the sentence follow the pointer instead of the clock. */
  blocks.forEach(function (b) {
    var id = b.getAttribute('data-b'), idx = -1;
    for (var i = 0; i < PROOF.length; i++) if (PROOF[i][1] === id) idx = i;
    if (idx < 0) return;
    var on = function () { userHot = true; if (pi !== idx && !reduce) say(idx); hot(id); };
    var off = function () { userHot = false; };
    b.addEventListener('pointerenter', on); b.addEventListener('focus', on);
    b.addEventListener('pointerleave', off); b.addEventListener('blur', off);
  });

  /* ---------- 5. Living details ---------- */
  var nums = Array.prototype.slice.call(root.querySelectorAll('.bx-n'));
  function countAll() {
    var t0 = performance.now(), D = 1600;
    (function tick(now) {
      var u = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - u, 4);
      for (var i = 0; i < nums.length; i++) nums[i].textContent = nums[i].getAttribute('data-pre') + Math.round(e * +nums[i].getAttribute('data-to'));
      if (u < 1) requestAnimationFrame(tick);
    })(t0);
  }
  var shots = Array.prototype.slice.call(root.querySelectorAll('.bx-shots img')), si = 0;
  function nextShot() { if (!running || !shots.length) return; shots[si].classList.remove('is-on'); si = (si + 1) % shots.length; shots[si].classList.add('is-on'); }
  /* ---------- 5. more work: his project stickers on a strip of tape ----------
     The strip is plain markup and a CSS animation. Here we only swap the caption above it to name the sticker you point at. */
  var capT = document.querySelector('.tp-tag .bx-cap-t'), capHome = capT ? capT.innerHTML : '';
  (capT ? document.querySelectorAll('.tp-st') : []).forEach(function (a) {
    var c = a.getAttribute('data-c').split(' \u00b7 ');
    var show = function () { capT.innerHTML = ''; var b = document.createElement('b'); b.textContent = c[0]; capT.appendChild(b); capT.appendChild(document.createTextNode(' \u00b7 ' + c.slice(1).join(' \u00b7 '))); };
    var hide = function () { capT.innerHTML = capHome; };
    a.addEventListener('pointerenter', show); a.addEventListener('focus', show); a.addEventListener('pointerleave', hide); a.addEventListener('blur', hide);
  });
  /* the strip moves slowly (about 11 pixels a second) whatever size the window is */
  var trk = document.querySelector('.tp-track'), set0 = trk && trk.querySelector('.tp-set');
  var sets = trk ? trk.querySelectorAll('.tp-set') : [];
  var spd = function () {
    if (!set0) return;
    for (var i = 0; i < sets.length; i++) sets[i].style.paddingRight = '';
    var w = set0.offsetWidth; if (!w) return;
    var extra = (60 - (w % 60)) % 60;                          // ruler ticks repeat every 60 px
    for (i = 0; i < sets.length; i++) sets[i].style.paddingRight = extra + 'px';
    trk.style.setProperty('--tpd', (sets.length / 2 * (w + extra) / 11).toFixed(2) + 's');   // half the track is half the copies; about 11 pixels a second
  };
  /* very wide windows: add copies (two at a time, so both halves of the loop stay the same) until half the strip is wider than
     the window plus one copy, so the tape never runs out on the right */
  var fill = function () {
    var zone = document.querySelector('.tp-zone'); if (!trk || !set0 || !zone) return;
    var guard = 0;
    while (trk.scrollWidth / 2 < zone.clientWidth + set0.offsetWidth && guard++ < 12) {
      for (var i = 0; i < 2; i++) {
        var cl = set0.cloneNode(true); cl.setAttribute('aria-hidden', 'true');
        cl.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
        trk.appendChild(cl);
      }
    }
    sets = trk.querySelectorAll('.tp-set'); spd();
  };
  spd(); fill(); window.addEventListener('resize', fill);
  if (window.ResizeObserver && set0) new ResizeObserver(spd).observe(set0);

  /* The human-centered design deck: every few seconds the top card slides away and goes to the back. */
  var cards = Array.prototype.slice.call(root.querySelectorAll('.bx-card')), deckCap = root.querySelector('.bx-deck-cap');
  cards.forEach(function (cd, i) { cd.setAttribute('data-pos', i); });
  /* The design block leads to the page of the project whose card is on top. */
  var deckLink = root.querySelector('.bx-hcd');
  function linkDeck() {
    var t = cards.filter(function (cd) { return cd.getAttribute('data-pos') === '0'; })[0];
    if (t && deckLink && t.getAttribute('data-href')) deckLink.href = t.getAttribute('data-href');
  }
  linkDeck();
  function shuffle() {
    if (!running || cards.length < 2) return;
    var top = cards.filter(function (cd) { return cd.getAttribute('data-pos') === '0'; })[0];
    top.classList.add('is-out');
    setTimeout(function () {
      cards.forEach(function (cd) { var p = +cd.getAttribute('data-pos'); cd.setAttribute('data-pos', cd === top ? cards.length - 1 : p - 1); });
      top.classList.remove('is-out');
      var now = cards.filter(function (cd) { return cd.getAttribute('data-pos') === '0'; })[0];
      deckCap.textContent = now.getAttribute('data-n');
      linkDeck();
    }, 1050);                 /* waits for the 1 s slide up to finish */
  }

  /* ---------- 2. The opening ---------- */
  function start() {
    sizeLight();
    if (reduce) { root.classList.add('is-in', 'is-set'); hot(null); drawLight(performance.now()); return; }
    for (var i = 0; i < nums.length; i++) nums[i].textContent = nums[i].getAttribute('data-pre') + '0';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      root.classList.add('is-in');
      setTimeout(countAll, 1250);
      /* After the opening, blocks and books answer the pointer quickly instead of with the slow entrance timing. */
      setTimeout(function () { root.classList.add('is-set'); hot(PROOF[0][1]); setInterval(nextProof, 3000); }, 2600);
      setInterval(nextShot, 3200);
      setInterval(shuffle, 4600);
    }); });
    last = performance.now(); requestAnimationFrame(frame);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on && !reduce) { last = performance.now(); requestAnimationFrame(frame); }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { setRunning(en[0].isIntersecting && !document.hidden); }, { threshold: 0.02 }).observe(root);
  document.addEventListener('visibilitychange', function () { setRunning(!document.hidden); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { sizeLight(); if (reduce) drawLight(performance.now()); }).observe(root);

  var go = false, begin = function () { if (!go) { go = true; start(); } };
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('600 64px Geist'), document.fonts.load('700 64px "Bricolage Grotesque"'), document.fonts.load('italic 64px "Instrument Serif"')]).then(begin, begin);
  setTimeout(begin, 1200);

  root.__bx = { state: function () { var h = root.querySelector('.bx-b.is-hot'); return { inn: root.classList.contains('is-in'), set: root.classList.contains('is-set'), webgl: !!prog, rx: root.style.getPropertyValue('--rx'), ry: root.style.getPropertyValue('--ry'), nums: nums.map(function (n) { return n.textContent; }).join(' '), say: sayA.textContent, hot: h ? h.getAttribute('data-b') : '', shot: si, cap: capT.textContent }; } };
})();
