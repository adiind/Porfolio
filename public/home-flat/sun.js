/* v24: sunlight through a window falling on the mat.
   One small WebGL picture of light and shade, drawn over the whole mat with "hard-light" blending:
   grey 0.5 changes nothing, darker greys shade what is under them, lighter greys light it up.
   So the cards, the photo and the grid all sit under the same light.
   The picture is pinned to the screen (the window does not move); the mat slides under it as you scroll.
   It is drawn at a third of screen resolution: the light is soft anyway, and it keeps the cost tiny. */
(function () {
  var canvas = document.querySelector('.sun-c');
  if (!canvas) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = null;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true }); } catch (e) {}
  if (!gl) { canvas.style.display = 'none'; return; }

  var vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var fs = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uT;uniform vec2 uM;',
    'float h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);',
    '  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    // An almond-shaped leaf, pointing along y: half-length 1, half-width w.
    'float sdLeaf(vec2 p,float w){float r=.5*(w+1./w),d=.5*(1./w-w);p=abs(p);',
    '  return ((p.y-1.)*d>p.x)?length(p-vec2(0.,1.)):length(p-vec2(-d,0.))-r;}',
    // A field of leaves: at most one per cell, bunched into clumps, each swaying on its own.
    'float leaves(vec2 q,float blur,float seed,float t,float g){',
    '  vec2 gi=floor(q),f=fract(q);float c=0.;',
    '  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){',
    '    vec2 o=vec2(float(i),float(j)),id=gi+o+seed;',
    '    float dens=smoothstep(.3,.62,n(id*.23+seed));',           // clumps of leaves with gaps between
    '    if(h(id*1.37)>dens*.95)continue;',
    '    float ph=h(id+2.3)*6.283;',
    '    vec2 ctr=o+.5+(vec2(h(id+.7),h(id+5.1))-.5)*.7;',
    '    ctr+=(.04+.14*g)*vec2(sin(t*.9+ph),cos(t*.7+ph*1.3));',
    '    float an=h(id+9.2)*6.283+(.18+.45*g)*sin(t*.8+ph);',
    '    float sz=mix(.4,.62,h(id+4.1));',
    '    vec2 l=rot(an)*(f-ctr)/sz;l.x+=.13*(l.y*l.y-1.);',
    '    c=max(c,1.-smoothstep(-blur,blur,sdLeaf(l,.34)*sz));',
    '  }return c;}',
    'float seg(vec2 p,vec2 a,vec2 b,float w,float bl){vec2 pa=p-a,ba=b-a;float k=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);',
    '  return 1.-smoothstep(-bl,bl,length(pa-ba*k)-w*(1.-.55*k));}',
    'void main(){',
    '  vec2 q=gl_FragCoord.xy/uRes;q.y=1.-q.y;',                 // 0..1 across the screen, y down
    '  float S=max(uRes.x,uRes.y);',
    '  vec2 p=q*uRes/S;',                                         // square units, 1 = long side
    '  p+=uM*.02;',                                               // the light leans a touch with the pointer
    '  float t=uT;',
    '  float g=.55*pow(.5+.5*sin(t*.23),10.)+.25*pow(.5+.5*sin(t*.37+1.),14.);', // a gust of wind every so often
    // The window: sun from the upper right, so its light lies in long bands running up to the right.
    '  vec2 dir=normalize(vec2(1.,-.58));vec2 nr=vec2(-dir.y,dir.x);',
    '  float u=dot(p-vec2(.5,.5*uRes.y/S),nr);',                  // across the bands
    '  float v=dot(p,dir);',                                      // along the bands
    '  float pane=fract((u+t*.0011)*2.25+.3);',                   // the sun moves: bands slide slowly across the mat
    '  float win=smoothstep(.0,.15,pane)*(1.-smoothstep(.52,.69,pane));',   // window openings, soft edges
    '  float mull=.55+.45*smoothstep(.008,.04,abs(pane-.33));',           // the thin upright between two panes
    '  float bar=.6+.4*smoothstep(.01,.045,abs(fract(v*1.55+.2+t*.0006)-.5)*.62);', // the cross bars
    '  float pool=exp(-pow((u+.04)/.42,2.));',                    // the patch the window reaches
    '  float sun=pool*win*mull*bar;',
    // The tree outside: one branch from the top right corner with twigs, and two layers of leaves.
    '  vec2 an=vec2(1.08,-.08);',
    '  vec2 bp=an+rot(.035*sin(t*.4)+.06*g*sin(t*1.7))*(p-an);',
    '  float br=seg(bp,an,vec2(.62,.26),.011,.006);',
    '  br=max(br,seg(bp,vec2(.86,.06),vec2(.74,-.04),.005,.004));',
    '  br=max(br,seg(bp,vec2(.72,.18),vec2(.6,.13),.004,.004));',
    '  br=max(br,seg(bp,vec2(.66,.23),vec2(.6,.34),.004,.005));',
    '  float tree=smoothstep(.15,.85,q.x+(1.-q.y)*.55-.35);',     // leaves crowd toward the top right
    '  float near=0.,far=0.;',
    '  if(sun>.01){',                                             // no leaf maths where no sun falls anyway
    '    if(tree>.02)near=leaves(bp*vec2(21.,21.),.06,0.,t,g);',  // close to the window: crisp small leaves
    '    far=leaves(p*vec2(8.5,8.5)+vec2(t*.01,0.),.2,17.,t*.8,g);',  // further out: big soft leaves
    '  }',
    '  float cover=max(max(near*.5*tree,far*.32*(.4+.6*tree)),br*.5);',
    '  sun*=1.-cover;',
    '  sun*=.8+.45*exp(-dot(q-vec2(.5,.82),q-vec2(.5,.82))*5.);', // a brighter patch low in the middle
    '  vec2 tq=(q-vec2(.18,.62))/vec2(.24,.3);sun*=1.-.6*exp(-dot(tq,tq));', // the wall beside the window keeps the words in softer light
    // Edges of the screen fall into shade.
    '  vec2 e=q-.5;float vig=smoothstep(.95,.25,length(e*vec2(1.05,1.25)));',
    '  float shade=(1.-vig)*.6+(1.-smoothstep(0.,.45,sun))*.28;',
    '  vec3 lit=vec3(.62,.9,1.)*clamp(sun,0.,1.3)*.38;',
    '  vec3 dk=vec3(.75,.6,.32)*clamp(shade,0.,1.)*.62;',          // shade takes away more red than blue: cool shadows
    '  vec3 c=vec3(.5)+lit*.5-dk*.5;',
    '  gl_FragColor=vec4(clamp(c,0.,1.),1.);',
    '}'
  ].join('\n');

  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; } return o; }
  var prog = gl.createProgram(), a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
  if (!a || !b) { canvas.style.display = 'none'; return; }
  gl.attachShader(prog, a); gl.attachShader(prog, b); gl.linkProgram(prog); gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(prog, 'uRes'), uT = gl.getUniformLocation(prog, 'uT'), uM = gl.getUniformLocation(prog, 'uM');

  var over = document.querySelector('.sun-oc'), octx = over && over.getContext('2d');
  var SCALE = 0.38, mx = 0, my = 0, tx = 0, ty = 0;
  function size() {
    var r = canvas.getBoundingClientRect();
    var w = Math.max(2, Math.round(r.width * SCALE)), hh = Math.max(2, Math.round(r.height * SCALE));
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
    gl.viewport(0, 0, w, hh); gl.uniform2f(uRes, w, hh);
    if (over && (over.width !== w || over.height !== hh)) { over.width = w; over.height = hh; }
  }
  window.addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
  window.addEventListener('resize', function () { size(); if (reduce) draw(40); });

  // Card shadows follow the same light: they swing a little with the pointer and the slow sway of the sun.
  var mat = document.querySelector('.mat'), lastVar = 0, sdx = 1, sdy = 1;
  function shadows(now, t) {
    if (!mat || now - lastVar < 90) return; lastVar = now;
    var x = 1 + mx * .35 + .05 * Math.sin(t * .15), y = 1 + my * .25 + .04 * Math.cos(t * .12);
    if (Math.abs(x - sdx) + Math.abs(y - sdy) < .008) return;
    sdx = x; sdy = y;
    mat.style.setProperty('--sdx', x.toFixed(3)); mat.style.setProperty('--sdy', y.toFixed(3));
  }
  var t0 = performance.now() - Math.max(0, (window.__SUN_AT || 40) - 40) * 1000, last = 0;   /* books: carry the clock on */
  function draw(t) { mx += (tx - mx) * .04; my += (ty - my) * .04; gl.uniform2f(uM, mx, my); gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (octx) { octx.clearRect(0, 0, over.width, over.height); octx.drawImage(canvas, 0, 0); } }
  size();
  if (reduce) { draw(40); canvas.classList.add('is-on'); if (over) over.classList.add('is-on'); return; }
  function loop(now) {
    requestAnimationFrame(loop);
    if (now - last < 32) return;            // about 30 frames a second is plenty for drifting leaves
    last = now; var tt = (now - t0) / 1000 + 40; draw(tt); shadows(now, tt);
  }
  requestAnimationFrame(loop);
  canvas.classList.add('is-on'); if (over) over.classList.add('is-on');
})();
