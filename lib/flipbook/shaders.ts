/**
 * GLSL for the flip book.
 *
 * LEAF_VERTEX bends a flat grid into a turning page. It repeats the formulas
 * in curl.ts line for line; change both together. Colours are composited in
 * display (gamma) space, the same way the 2D canvases that feed the textures
 * were drawn, so the page looks the same flat and in 3D.
 */

export const LEAF_VERTEX = /* glsl */ `
uniform float uT;
uniform float uStiff;
uniform float uSkew;
uniform float uLead;
uniform float uLag;
uniform float uPageH;
uniform float uGutterRise;
uniform float uBow;
uniform vec2 uLift;
uniform vec3 uCam;
uniform vec3 uRestCam;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vLocal;
varying vec2 vPar;

const float PI = 3.141592653589793;

float ease(float x) { return x * x * (3.0 - 2.0 * x); }

void main() {
  vUv = uv;
  float t = clamp(uT, 0.0, 1.0);
  float row = clamp(t + uSkew * (0.5 - uv.y) * sin(PI * t), 0.0, 1.0);
  float edge = ease(clamp(row * uLead, 0.0, 1.0));
  float follow = ease(clamp((row - uLag) / (1.0 - uLag), 0.0, 1.0));
  float spine = mix(follow, edge, uStiff);
  float a0 = PI * spine;
  float aW = PI * edge;
  float k = aW - a0;
  float a = a0 + k * uv.x;
  float x;
  float z;
  if (abs(k) < 1.0e-4) {
    x = uv.x * cos(a0);
    z = uv.x * sin(a0);
  } else {
    x = (sin(a) - sin(a0)) / k;
    z = (cos(a0) - cos(a)) / k;
  }

  // every sheet climbs out of the gutter before it lies flat. The climb is the
  // same for all of them at every moment of a turn, so sheets can never cross.
  // ... and bows up gently across its width, the way a sheet of heavy paper does
  float rise = uGutterRise * (1.0 - exp(-uv.x / 0.07)) + uBow * sin(PI * uv.x);
  float slope = (uGutterRise / 0.07) * exp(-uv.x / 0.07) + uBow * PI * cos(PI * uv.x);
  float side = mix(1.0, -1.0, smoothstep(0.3, 0.7, t));
  z += rise;
  float aa = a + atan(slope) * side;

  // keep the stack ordered: later pages lie lower on the right, higher on the left
  z += mix(uLift.x, uLift.y, smoothstep(0.0, 1.0, t)) + 0.004 * sin(PI * t);

  vec3 local = vec3(x, (uv.y - 0.5) * uPageH, z);
  vec3 n = vec3(-sin(aa), 0.0, cos(aa));
  vec3 tangent = vec3(cos(aa), 0.0, sin(aa));
  vec3 bitangent = vec3(0.0, 1.0, 0.0);

  // how far a layer floating above the sheet appears to slide, relative to the resting view
  vec3 viewNow = uCam - local;
  vec3 viewRest = uRestCam - local;
  vec2 parNow = vec2(dot(viewNow, tangent), dot(viewNow, bitangent)) / max(dot(viewNow, n), 0.25);
  vec2 parRest = vec2(dot(viewRest, tangent), dot(viewRest, bitangent)) / max(dot(viewRest, n), 0.25);
  vPar = parNow - parRest;

  vNormal = n;
  vLocal = local;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(local, 1.0);
}
`;

export const LEAF_FRAGMENT = /* glsl */ `
uniform float uT;
uniform float uVanish;
uniform sampler2D tFlat;
uniform sampler2D tBase;
uniform sampler2D tWord;
uniform sampler2D tFg;
uniform sampler2D tShadow;
uniform sampler2D tBack;
uniform float uLayered;
uniform float uHasFg;
uniform float uPop;
uniform float uPageH;
uniform float uCorner;
uniform float uResting;
uniform vec2 uDepth;
uniform vec2 uShade;
uniform vec2 uFgCenter;
uniform vec3 uFgClip;
uniform float uThick;
uniform float uReach;
uniform float uWordTint;
uniform vec3 uWordPanel;
uniform vec3 uWordArt;
uniform vec4 uWordFrame;
uniform vec3 uLight;
uniform vec3 uCam;
uniform vec4 uCastSpan;
uniform float uCastAmt;
uniform float uCastSoft;
// on the sunlit mat: the same picture of window light that lies on the mat, laid weakly over the page,
// and layer shadows falling to the left (the sun is up and to the right there)
uniform sampler2D tSun;
uniform vec2 uScreen;
uniform float uSunAmt;
uniform float uFallX;
uniform float uDawn;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vLocal;
varying vec2 vPar;


// the room starts dark, lit only by a dim bulb hanging at the top middle of the window: a small pool of light under it.
// When the bulb is switched on (uDawn goes from 0 to 1) its light reaches the nearest things first, then the whole room.
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  // rounded outer corners; the spine edge stays square
  vec2 p = vec2(vUv.x, (vUv.y - 0.5) * uPageH);
  float d = roundedBox(p, vec2(1.0, uPageH * 0.5), uCorner);
  float coverage = 1.0 - smoothstep(-fwidth(d), fwidth(d), d);
  // single-page books: a sheet dissolves as it finishes its turn, so nothing piles up beside the page
  coverage *= 1.0 - uVanish * smoothstep(0.62, 0.96, uT);
  if (coverage < 0.004) discard;

  vec3 n = normalize(vNormal);
  vec3 col;
  float gloss = 0.07;
  float floorLight = 0.62;

  if (gl_FrontFacing) {
    if (uLayered > 0.5) {
      vec2 aspect = vec2(1.0, 1.0 / uPageH);
      vec2 uvWord = vUv + vPar * uDepth.x * uPop * aspect;
      vec2 uvFg = vUv + vPar * uDepth.y * uPop * aspect;
      uvFg = (uvFg - uFgCenter) / (1.0 + 0.012 * uPop) + uFgCenter;

      // light comes from the upper left, so floating layers shade the sheet down and to the right
      vec2 fall = vec2(0.5 * uFallX, -0.7) * aspect * uReach;
      float wordShade = texture2D(tShadow, vUv - fall * uDepth.x * uPop).g * uPop;
      float fgShade = texture2D(tShadow, vUv - fall * uDepth.y * uPop).r * uPop * uHasFg;

      col = texture2D(tBase, vUv).rgb;
      col *= 1.0 - uShade.x * wordShade;
      vec4 word = texture2D(tWord, uvWord);
      if (uWordTint > 0.5) {
        // colour by where the sheet is, not where the floating word is, so the change stays on the frame edge
        float inPicture = step(uWordFrame.x, vUv.x) * step(vUv.x, uWordFrame.z) * step(uWordFrame.y, vUv.y) * step(vUv.y, uWordFrame.w);
        word.rgb = mix(uWordPanel, uWordArt, inPicture) * word.a;
      }
      if (uThick > 0.5) {
        // the letters are thick: every slice between the sheet and a letter's face that covers this spot is its side wall.
        // Seen straight on the slices hide behind the face; as the sheet bends away they fan out into an edge.
        vec2 rise = vPar * uDepth.x * uPop * aspect;
        for (int i = 1; i < 12; i++) {
          vec4 slice = texture2D(tWord, vUv + rise * (float(i) / 12.0));
          col = col * (1.0 - slice.a) + slice.rgb * vec3(0.68, 0.45, 0.3);
        }
      }
      col = col * (1.0 - word.a) + word.rgb;
      col *= 1.0 - uShade.y * fgShade;
      // the cut-out may rise above its picture frame but never spills past its sides or foot
      float inFrame = step(uFgClip.x, vUv.x) * step(vUv.x, uFgClip.z) * step(uFgClip.y, vUv.y);
      vec4 fg = texture2D(tFg, uvFg) * uHasFg * inFrame;
      col = col * (1.0 - fg.a) + fg.rgb;
    } else {
      col = texture2D(tFlat, vUv).rgb;
    }
  } else {
    col = texture2D(tBack, vec2(1.0 - vUv.x, vUv.y)).rgb;
    n = -n;
    gloss = 0.03;
    // paper lets light through, so the reverse of a sheet never goes as dark as its face
    floorLight = 0.8;
  }

  // one lamp: sheets facing it stay bright, sheets turning away fall off
  vec3 light = normalize(uLight);
  float facing = clamp(dot(n, light) / light.z, 0.0, 1.15);
  col *= floorLight + (1.0 - floorLight) * min(facing, 1.0) + 0.08 * max(facing - 1.0, 0.0);
  vec3 view = normalize(uCam - vLocal);
  float sheen = pow(max(dot(n, normalize(light + view)), 0.0), 26.0);
  col += gloss * sheen;

  // the gutter is darker where the sheets dive into the binding
  col *= 1.0 - 0.3 * exp(-vUv.x / 0.03);

  // a thin bright rim so the sheet reads as having an edge
  float rim = min(1.0 - vUv.x, min(vUv.y, 1.0 - vUv.y) * uPageH);
  col = mix(col, vec3(1.0), 0.16 * (1.0 - smoothstep(0.0012, 0.0042, rim)));

  // shadow of a page turning overhead, only on sheets lying still
  float v = vUv.y;
  float lo = mix(uCastSpan.x, uCastSpan.z, v);
  float hi = mix(uCastSpan.y, uCastSpan.w, v);
  float under = smoothstep(lo - uCastSoft, lo + uCastSoft * 0.5, vLocal.x)
    * (1.0 - smoothstep(hi - uCastSoft * 0.5, hi + uCastSoft, vLocal.x));
  col *= 1.0 - uCastAmt * under * uResting;

  if (uSunAmt > 0.0) {
    // "hard light", as on the home page: mid grey changes nothing, darker shades, lighter lights
    vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
    vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
    col = mix(col, lit, uSunAmt);
  }
  col *= dawnLight();

  gl_FragColor = vec4(col, coverage);
}
`;

export const TABLE_VERTEX = /* glsl */ `
varying vec2 vPos;
void main() {
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const TABLE_FRAGMENT = /* glsl */ `
uniform vec3 uStage;
uniform vec3 uStageLight;
uniform float uPageH;
uniform float uLeftAmt;
uniform vec2 uBookOffset;
uniform vec4 uCastSpan;
uniform float uCastAmt;
uniform float uCastSoft;
// a real surface under the book (a photographed table top), and how much of it shows
uniform sampler2D tSurface;
uniform float uSurfaceAmt;
// where the lamp's pool of light falls, and how wide it spreads
uniform vec2 uPool;
uniform vec2 uPoolSize;
// a bound book's cover boards, peeping out around the pages
uniform vec3 uBoard;
uniform float uBoardAmt;
uniform float uCorner;
// the home page's cutting mat, printed in the same place and at the same scale the reader left it
uniform float uMat;
uniform float uCell;        // table units to one grid square (24 px on the home page)
uniform vec2 uMatOrigin;    // which grid square lies under the middle of the closed book
uniform vec4 uMatRect;      // the mat's edges in grid squares (left, top, right, bottom); right < left: no edges
uniform float uBookTurn;    // the closed book may lie at a small angle, as it does on the home page
uniform float uMatEdge;     // 1 while the view is the home page's; the mat is endless once the view has come down to the book
uniform sampler2D tSun;
uniform vec2 uScreen;
uniform float uDawn;

varying vec2 vPos;

// the room starts dark, lit only by a dim bulb hanging at the top middle of the window: a small pool of light under it.
// When the bulb is switched on (uDawn goes from 0 to 1) its light reaches the nearest things first, then the whole room.
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float boxDistance(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

float roundBoxDistance(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float nearestLine(float c) { return abs(fract(c + 0.5) - 0.5); }

// one printed line of the mat: c counts lines (a line at every whole number), wide is its width in the same units
float printed(float c, float wide) {
  float w = max(wide, fwidth(c) * 1.1);
  return 1.0 - smoothstep(w * 0.5 - fwidth(c) * 0.6, w * 0.5 + fwidth(c) * 0.6, nearestLine(c));
}

vec3 cuttingMat(vec2 p) {
  // grid squares, counted from the mat's top left corner, y down as on the page
  vec2 g = vec2(p.x, -p.y) / uCell + uMatOrigin;
  float px = 1.0 / 24.0;                       // one home-page pixel, in grid squares
  vec3 col = vec3(0.106, 0.384, 0.831);        // #1b62d4
  // a little tooth in the print
  col *= 1.0 + (hash(floor(g * 24.0)) - 0.5) * 0.035;
  // thin lines every square; brighter lines every fifth; both sit half a square in, as the page's tile has them
  float thin = max(printed(g.x - 0.5, px), printed(g.y - 0.5, px));
  vec2 big = (g - 2.5) / 5.0;
  float major = max(printed(big.x, px / 5.0), printed(big.y, px / 5.0));
  // seen close up, a mat shows its finer ruling too
  float close = smoothstep(46.0, 86.0, 1.0 / max(fwidth(g.x), 1e-5));
  float fine = max(printed((g.x - 0.5) * 4.0, px * 2.0), printed((g.y - 0.5) * 4.0, px * 2.0)) * close;
  col = mix(col, vec3(1.0), fine * 0.05);
  col = mix(col, vec3(1.0), thin * 0.13);
  col = mix(col, vec3(1.0), major * 0.3);
  // a small bright cross, with a soft glow, where the big lines meet
  vec2 c = (fract(big + 0.5) - 0.5) * 5.0;     // grid squares from the nearest crossing
  float glow = 0.35 * (1.0 - smoothstep(0.0, 7.0 * px, length(c)));
  float aa = fwidth(g.x);
  float armX = (1.0 - smoothstep(0.65 * px, 0.65 * px + aa, abs(c.y))) * (1.0 - smoothstep(5.5 * px, 5.5 * px + aa, abs(c.x)));
  float armY = (1.0 - smoothstep(0.65 * px, 0.65 * px + aa, abs(c.x))) * (1.0 - smoothstep(5.5 * px, 5.5 * px + aa, abs(c.y)));
  col = mix(col, vec3(1.0), glow);
  col = mix(col, vec3(1.0), max(armX, armY) * 0.75);
  return col;
}

void main() {
  if (uMat > 0.5) {
    vec3 col = cuttingMat(vPos);
    // window light on the mat, full strength
    vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
    col = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));

    if (uMatRect.z > uMatRect.x && uMatEdge > 0.001) {
      // the mat has edges: the dark desk shows round it, as on the home page
      vec2 g = vec2(vPos.x, -vPos.y) / uCell + uMatOrigin;
      vec2 mid = (uMatRect.xy + uMatRect.zw) * 0.5;
      float edge = roundBoxDistance(g - mid, (uMatRect.zw - uMatRect.xy) * 0.5, 1.0);
      float aa = fwidth(g.x);
      vec3 desk = vec3(0.031, 0.043, 0.102);
      vec2 dot = fract(g * (24.0 / 9.0)) - 0.5;
      desk = mix(desk, vec3(0.894, 0.91, 0.31), 0.3 * (1.0 - smoothstep(0.07, 0.11, length(dot))));
      desk *= 1.0 - 0.55 * (1.0 - smoothstep(0.0, 2.2, edge));
      col = mix(col, vec3(1.0), uMatEdge * 0.22 * (1.0 - smoothstep(0.0, 0.07, abs(edge + 0.04))));
      col = mix(col, desk, uMatEdge * smoothstep(-aa, aa, edge));
    }

    // the book, as it lies: turned a little while it is still where the home page had it
    float ct = cos(uBookTurn);
    float st = sin(uBookTurn);
    vec2 q = vPos - uBookOffset;
    q = vec2(ct * q.x + st * q.y, -st * q.x + ct * q.y);
    float edge = uBoardAmt * 0.017;
    vec2 slab = vec2(1.0 + edge, uPageH * 0.5 + edge);
    float u = uCell / 24.0;                     // one home-page pixel, in table units

    // three shadows, as every card on the home page has: tight, middle, and a long soft one, down and to the left
    vec3 navy = vec3(0.008, 0.039, 0.173);
    for (int i = 0; i < 3; i++) {
      vec2 off = i == 0 ? vec2(-1.5, -2.0) : i == 1 ? vec2(-7.0, -9.0) : vec2(-24.0, -30.0);
      float blur = i == 0 ? 2.0 : i == 1 ? 12.0 : 36.0;
      float shrink = i == 0 ? 0.0 : i == 1 ? 2.0 : 9.0;
      float dark = i == 0 ? 0.42 : i == 1 ? 0.36 : 0.5;
      vec2 f = off * u;
      vec2 qs = vPos - uBookOffset - f;
      qs = vec2(ct * qs.x + st * qs.y, -st * qs.x + ct * qs.y);
      float whole = roundBoxDistance(qs, slab, uCorner + edge);
      float d = mix(max(whole, -(qs.x + edge)), whole, uLeftAmt) + shrink * u;
      col = mix(col, navy, dark * (1.0 - smoothstep(-blur * u * 0.5, blur * u * 0.5, d)));
    }

    if (uBoardAmt > 0.0) {
      float whole = roundBoxDistance(q, slab, uCorner + edge);
      float rightBox = max(whole, -(q.x + edge));
      float leftBox = max(whole, q.x - edge);
      float px = fwidth(q.x);
      float cover = max(1.0 - smoothstep(-px, px, rightBox), (1.0 - smoothstep(-px, px, leftBox)) * uLeftAmt);
      float weave = hash(floor(vPos * 760.0)) * 0.5 + hash(floor(vPos * vec2(190.0, 760.0))) * 0.5;
      vec3 cloth = uBoard * (0.9 + 0.2 * weave);
      col = mix(col, cloth, cover * uBoardAmt);
    }

    // a page in the air
    float v = clamp(q.y / uPageH + 0.5, 0.0, 1.0);
    float inY = 1.0 - smoothstep(uPageH * 0.5 - 0.02, uPageH * 0.5 + 0.06, abs(q.y + 0.03));
    float lo = mix(uCastSpan.x, uCastSpan.z, v);
    float hi = mix(uCastSpan.y, uCastSpan.w, v);
    float under = smoothstep(lo - uCastSoft, lo + uCastSoft * 0.5, q.x) * (1.0 - smoothstep(hi - uCastSoft * 0.5, hi + uCastSoft, q.x));
    col = mix(col, navy, uCastAmt * 0.62 * under * inY);
    col *= dawnLight();

    gl_FragColor = vec4(col, 1.0);
    return;
  }

  // a pool of lamplight on a coloured table, darker toward the edges
  float r = length((vPos - uPool) / uPoolSize);
  vec3 col = mix(uStageLight, uStage, smoothstep(0.0, 1.0, r));
  col *= 1.0 - 0.22 * smoothstep(0.9, 2.2, r);
  // tooth, so the colour reads as a surface
  float grain = hash(floor(vPos * 520.0)) * 0.6 + hash(floor(vPos * 173.0)) * 0.4;
  col *= 1.0 + (grain - 0.5) * 0.045;

  if (uSurfaceAmt > 0.0) {
    // the table top itself, lit by the same lamp, with a little of the open page's colour spilling onto it
    vec3 wood = texture2D(tSurface, vPos * vec2(0.3, 0.45) + 0.5).rgb;
    float lamp = mix(1.22, 0.42, smoothstep(0.0, 1.0, r)) * (1.0 - 0.4 * smoothstep(0.9, 2.2, r));
    vec3 hue = uStageLight / max(max(uStageLight.r, uStageLight.g), max(uStageLight.b, 0.001));
    vec3 lit = wood * lamp;
    lit = mix(lit, lit * (hue * 0.9 + 0.25), 0.17);
    col = mix(col, lit, uSurfaceAmt);
  }

  vec2 q = vPos - uBookOffset;
  // the cover boards: a little larger than the sheets that lie on them
  float edge = uBoardAmt * 0.017;
  // (one rounded slab two pages wide, split at the spine, so only the outer corners are round)
  vec2 slab = vec2(1.0 + edge, uPageH * 0.5 + edge);
  float open = roundBoxDistance(q, slab, uCorner + edge);
  float rightBox = max(open, -(q.x + edge));
  float leftBox = max(open, q.x - edge);

  // the book's own shadow, thrown down and to the right
  vec2 fall = vec2(0.016, -0.024);
  float thrown = roundBoxDistance(q - fall, slab, uCorner + edge);
  float right = max(thrown, -(q.x - fall.x + edge));
  float left = max(thrown, q.x - fall.x - edge);
  float reach = mix(0.085, 0.13, uSurfaceAmt);
  float contact = max(1.0 - smoothstep(-0.012, reach, right), (1.0 - smoothstep(-0.012, reach, left)) * uLeftAmt);
  col *= 1.0 - mix(0.3, 0.52, uSurfaceAmt) * contact;

  if (uBoardAmt > 0.0) {
    float px = 0.0022;
    float cover = max(1.0 - smoothstep(-px, px, rightBox), (1.0 - smoothstep(-px, px, leftBox)) * uLeftAmt);
    // book cloth: a fine weave, a little lighter along the top edge where the lamp catches it
    float weave = hash(floor(vPos * 760.0)) * 0.5 + hash(floor(vPos * vec2(190.0, 760.0))) * 0.5;
    vec3 cloth = uBoard * (0.86 + 0.28 * weave) * (1.0 + 0.25 * smoothstep(0.0, uPageH * 0.5 + edge, q.y));
    col = mix(col, cloth, cover * uBoardAmt);
  }

  // a page in the air
  float v = clamp(q.y / uPageH + 0.5, 0.0, 1.0);
  float inY = 1.0 - smoothstep(uPageH * 0.5 - 0.02, uPageH * 0.5 + 0.06, abs(q.y + 0.03));
  float lo = mix(uCastSpan.x, uCastSpan.z, v);
  float hi = mix(uCastSpan.y, uCastSpan.w, v);
  float under = smoothstep(lo - uCastSoft, lo + uCastSoft * 0.5, q.x) * (1.0 - smoothstep(hi - uCastSoft * 0.5, hi + uCastSoft, q.x));
  col *= 1.0 - uCastAmt * 0.8 * under * inY;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Sunlight through a window, falling on the mat. This is the home page's own
 * picture of light and shade (review/home-cc-v30/sun.js, its shader copied
 * unchanged): grey 0.5 changes nothing, darker greys shade what is under them,
 * lighter greys light it. Drawn small into its own picture each frame, then
 * laid over the mat at full strength and over the pages weakly.
 */
export const SUN_VERTEX = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
export const SUN_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform vec2 uM;
float h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float sdLeaf(vec2 p,float w){float r=.5*(w+1./w),d=.5*(1./w-w);p=abs(p);
  return ((p.y-1.)*d>p.x)?length(p-vec2(0.,1.)):length(p-vec2(-d,0.))-r;}
float leaves(vec2 q,float blur,float seed,float t,float g){
  vec2 gi=floor(q),f=fract(q);float c=0.;
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j)),id=gi+o+seed;
    float dens=smoothstep(.3,.62,n(id*.23+seed));
    if(h(id*1.37)>dens*.95)continue;
    float ph=h(id+2.3)*6.283;
    vec2 ctr=o+.5+(vec2(h(id+.7),h(id+5.1))-.5)*.7;
    ctr+=(.04+.14*g)*vec2(sin(t*.9+ph),cos(t*.7+ph*1.3));
    float an=h(id+9.2)*6.283+(.18+.45*g)*sin(t*.8+ph);
    float sz=mix(.4,.62,h(id+4.1));
    vec2 l=rot(an)*(f-ctr)/sz;l.x+=.13*(l.y*l.y-1.);
    c=max(c,1.-smoothstep(-blur,blur,sdLeaf(l,.34)*sz));
  }return c;}
float seg(vec2 p,vec2 a,vec2 b,float w,float bl){vec2 pa=p-a,ba=b-a;float k=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
  return 1.-smoothstep(-bl,bl,length(pa-ba*k)-w*(1.-.55*k));}
void main(){
  vec2 q=gl_FragCoord.xy/uRes;q.y=1.-q.y;
  float S=max(uRes.x,uRes.y);
  vec2 p=q*uRes/S;
  p+=uM*.02;
  float t=uT;
  float g=.55*pow(.5+.5*sin(t*.23),10.)+.25*pow(.5+.5*sin(t*.37+1.),14.);
  vec2 dir=normalize(vec2(1.,-.58));vec2 nr=vec2(-dir.y,dir.x);
  float u=dot(p-vec2(.5,.5*uRes.y/S),nr);
  float v=dot(p,dir);
  float pane=fract((u+t*.0011)*2.25+.3);
  float win=smoothstep(.0,.15,pane)*(1.-smoothstep(.52,.69,pane));
  float mull=.55+.45*smoothstep(.008,.04,abs(pane-.33));
  float bar=.6+.4*smoothstep(.01,.045,abs(fract(v*1.55+.2+t*.0006)-.5)*.62);
  float pool=exp(-pow((u+.04)/.42,2.));
  float sun=pool*win*mull*bar;
  vec2 an=vec2(1.08,-.08);
  vec2 bp=an+rot(.035*sin(t*.4)+.06*g*sin(t*1.7))*(p-an);
  float br=seg(bp,an,vec2(.62,.26),.011,.006);
  br=max(br,seg(bp,vec2(.86,.06),vec2(.74,-.04),.005,.004));
  br=max(br,seg(bp,vec2(.72,.18),vec2(.6,.13),.004,.004));
  br=max(br,seg(bp,vec2(.66,.23),vec2(.6,.34),.004,.005));
  float tree=smoothstep(.15,.85,q.x+(1.-q.y)*.55-.35);
  float near=0.,far=0.;
  if(sun>.01){
    if(tree>.02)near=leaves(bp*vec2(21.,21.),.06,0.,t,g);
    far=leaves(p*vec2(8.5,8.5)+vec2(t*.01,0.),.2,17.,t*.8,g);
  }
  float cover=max(max(near*.5*tree,far*.32*(.4+.6*tree)),br*.5);
  sun*=1.-cover;
  sun*=.8+.45*exp(-dot(q-vec2(.5,.82),q-vec2(.5,.82))*5.);
  vec2 tq=(q-vec2(.18,.62))/vec2(.24,.3);sun*=1.-.6*exp(-dot(tq,tq));
  vec2 e=q-.5;float vig=smoothstep(.95,.25,length(e*vec2(1.05,1.25)));
  float shade=(1.-vig)*.6+(1.-smoothstep(0.,.45,sun))*.28;
  vec3 lit=vec3(.62,.9,1.)*clamp(sun,0.,1.3)*.38;
  vec3 dk=vec3(.75,.6,.32)*clamp(shade,0.,1.)*.62;
  vec3 c=vec3(.5)+lit*.5-dk*.5;
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}
`;

/**
 * A poster lying on the mat: one picture on a card with round corners (or a
 * cut-out, which keeps the picture's own outline), in the same window light as
 * the pages. Its shadow is a second, larger sheet under it.
 */
export const PROP_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const PROP_FRAGMENT = /* glsl */ `
uniform sampler2D tMap;
uniform sampler2D tSun;
uniform vec2 uScreen;
uniform vec2 uSize;
uniform float uRadius;
uniform float uCutout;
uniform float uAlpha;
uniform float uDawn;
varying vec2 vUv;

// the room starts dark, lit only by a dim bulb hanging at the top middle of the window: a small pool of light under it.
// When the bulb is switched on (uDawn goes from 0 to 1) its light reaches the nearest things first, then the whole room.
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}

float roundBoxDistance(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec4 tex = texture2D(tMap, vUv);
  vec2 p = (vUv - 0.5) * uSize;
  float d = roundBoxDistance(p, uSize * 0.5, uRadius);
  float aa = fwidth(d);
  float inside = 1.0 - smoothstep(-aa, aa, d);
  float alpha = mix(inside, tex.a, uCutout);
  if (alpha * uAlpha < 0.004) discard;
  vec3 col = tex.rgb;
  // a thin bright edge, so the card reads as having thickness
  col = mix(col, vec3(1.0), (1.0 - uCutout) * 0.2 * (1.0 - smoothstep(0.0, aa * 2.5, abs(d + aa * 1.5))));
  vec3 sun = texture2D(tSun, gl_FragCoord.xy / uScreen).rgb;
  vec3 lit = mix(2.0 * col * sun, 1.0 - 2.0 * (1.0 - col) * (1.0 - sun), step(0.5, sun));
  col = mix(col, lit, 0.2) * dawnLight();
  gl_FragColor = vec4(col, alpha * uAlpha);
}
`;
export const PROP_SHADOW_FRAGMENT = /* glsl */ `
uniform vec2 uSize;      // the card's size
uniform vec2 uSheet;     // this sheet's size (larger: room for the shadow to fall)
uniform float uRadius;
uniform float uLift;     // 0 lying on the mat, 1 lifted toward the eye
uniform float uUnit;     // one home-page pixel, in table units
uniform float uAlpha;
uniform float uDawn;
uniform vec2 uScreen;
varying vec2 vUv;

// the room starts dark, lit only by a dim bulb hanging at the top middle of the window: a small pool of light under it.
// When the bulb is switched on (uDawn goes from 0 to 1) its light reaches the nearest things first, then the whole room.
float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}

float roundBoxDistance(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 p = (vUv - 0.5) * uSheet;
  float u = uUnit * (1.0 + uLift * 1.6);
  float dark = 0.0;
  // the three shadows every block on the home page has: tight, middle, and a long soft one, down and to the left
  for (int i = 0; i < 3; i++) {
    vec2 off = i == 0 ? vec2(-1.5, -2.0) : i == 1 ? vec2(-8.0, -10.0) : vec2(-30.0, -38.0);
    float blur = i == 0 ? 2.0 : i == 1 ? 12.0 : 40.0;
    float shrink = i == 0 ? 0.0 : i == 1 ? 2.0 : 10.0;
    float amount = i == 0 ? 0.42 : i == 1 ? 0.36 : 0.55;
    float d = roundBoxDistance(p - off * u, uSize * 0.5, uRadius) + shrink * u;
    float a = amount * (1.0 - smoothstep(-blur * u * 0.5, blur * u * 0.5, d));
    dark = dark + a * (1.0 - dark);
  }
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), dark * uAlpha);
}
`;

/** How far the near right corner of a sheet is lifted, at a point of the sheet (uv): 1 at the corner, 0 well inside. */
const CURL_LIFT = /* glsl */ `
float curlLift(vec2 uv) {
  float s = clamp(((1.0 - uv.x) + uv.y * 0.72) / 0.36, 0.0, 1.0);
  float k = 1.0 - s;
  return k * k * k;
}
`;

/** A sheet whose near right corner lifts off the mat (uCurl: how far, in table units). Used with PROP_FRAGMENT. */
export const PROP_CURL_VERTEX = /* glsl */ `
uniform float uCurl;
varying vec2 vUv;
${CURL_LIFT}
void main() {
  vUv = uv;
  vec3 p = position;
  float lift = curlLift(uv);
  p.z += uCurl * lift;
  // the paper keeps its length: as the corner rises it draws in a little
  p.x -= uCurl * lift * 0.35;
  p.y += uCurl * lift * 0.25;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

/**
 * The home page's three shadows (as PROP_SHADOW_FRAGMENT: tight, middle, long and soft, down and to the left), taken from
 * the picture's own outline (its alpha) instead of a rounded box, for cut-outs that are not boxes: a tag with clipped
 * corners, a sheet held by a strip of tape. A lifted corner (uCurl) throws its shadow further. Each tap reads a smaller,
 * already blurred copy of the picture (a mip bias), so the 13 taps never show as steps.
 */
export const PROP_ALPHA_SHADOW_FRAGMENT = /* glsl */ `
uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uSheet;
uniform float uLift;
uniform float uUnit;
uniform float uAlpha;
uniform float uDawn;
uniform float uCurl;
uniform vec2 uScreen;
varying vec2 vUv;

float dawnLight() {
  vec2 d = (gl_FragCoord.xy / uScreen - vec2(0.5, 0.74)) * vec2(uScreen.x / uScreen.y, 1.0);
  float away = length(d);
  float k = clamp(uDawn * 2.1 - away, 0.0, 1.0);
  float pool = 0.2 * exp(-away * away * 7.0);
  return mix(0.06 + pool, 1.0, k * k * (3.0 - 2.0 * k));
}
${CURL_LIFT}
float cover(vec2 p, float r, float bias) {
  float sum = 0.0;
  for (int j = 0; j < 13; j++) {
    float fj = float(j);
    float ang = fj * 2.39996;
    float rad = j == 0 ? 0.0 : (j < 7 ? 0.5 : 1.0) * r;
    vec2 uv = (p + vec2(cos(ang), sin(ang)) * rad) / uSize + 0.5;
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    sum += texture2D(tMap, clamp(uv, 0.0, 1.0), bias).a * inside;
  }
  return sum / 13.0;
}
void main() {
  vec2 p = (vUv - 0.5) * uSheet;
  float u = uUnit * (1.0 + uLift * 1.6);
  float dark = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 off = i == 0 ? vec2(-1.5, -2.0) : i == 1 ? vec2(-8.0, -10.0) : vec2(-30.0, -38.0);
    float blur = i == 0 ? 2.0 : i == 1 ? 12.0 : 40.0;
    float amount = i == 0 ? 0.42 : i == 1 ? 0.36 : 0.55;
    vec2 q = p - off * u;
    float lift = uCurl > 0.0 ? curlLift(q / uSize + 0.5) * uCurl : 0.0;
    q += vec2(1.0, 1.25) * lift * 0.9;
    float c = cover(q, blur * u * 0.5 + lift * 0.35, i == 0 ? 1.0 : i == 1 ? 3.5 : 5.0);
    float a = amount * smoothstep(0.08, 0.92, c) * (i == 0 ? 1.0 - clamp(lift / max(uCurl, 1e-4), 0.0, 1.0) * 0.8 : 1.0);
    dark = dark + a * (1.0 - dark);
  }
  gl_FragColor = vec4(vec3(0.008, 0.039, 0.173) * dawnLight(), dark * uAlpha);
}
`;
