/**
 * Signed-distance project-wheel shader adapted from Viscose by Yousuf Soomro.
 * Copyright (c) 2026 Yousuf Soomro. Used under the MIT License.
 * See THIRD_PARTY_NOTICES.md. No upstream artwork or fonts are included.
 * Simplex noise lineage: Ashima Arts and Stefan Gustavson, MIT License.
 */
export const MAX_PROJECT_CARDS = 16;
export const MAX_PROJECT_LINKS = 16;

export const projectWheelVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const projectWheelFragmentShader = /* glsl */ `
  precision highp float;

  #define MAX_CARDS ${MAX_PROJECT_CARDS}
  #define MAX_LINKS ${MAX_PROJECT_LINKS}

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uCount;
  uniform vec2 uPos[MAX_CARDS];
  uniform float uRot[MAX_CARDS];
  uniform vec4 uScale[MAX_CARDS];
  uniform float uLinkCount;
  uniform vec2 uLinkA[MAX_LINKS];
  uniform vec2 uLinkB[MAX_LINKS];
  uniform vec4 uLinkPar[MAX_LINKS];
  uniform float uK;
  uniform float uWobble;
  uniform float uTime;
  uniform sampler2D uAtlas;
  uniform vec2 uGrid;
  uniform float uBlend;
  uniform float uBandTop;
  uniform float uBandBottom;
  uniform vec4 uGlass;
  uniform float uFringe;
  uniform float uSheen;
  uniform vec4 uMouse;
  uniform vec4 uMelt;
  uniform vec3 uPage;

  float sdRoundBox(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
  }

  float smin(float a, float b, float k) {
    if (k <= 0.0001) return min(a, b);
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float sdLink(vec2 p, vec2 a, vec2 b, float rEnd, float rMid, float sag) {
    vec2 axis = b - a;
    float lengthAxis = max(length(axis), 0.001);
    vec2 dir = axis / lengthAxis;
    vec2 normal = vec2(-dir.y, dir.x);
    vec2 local = p - (a + b) * 0.5;
    float along = dot(local, dir);
    float across = dot(local, normal);
    float phase = clamp(along / lengthAxis + 0.5, 0.0, 1.0);
    float bell = sin(3.14159265 * phase);
    across += sag * bell * normal.y;
    float taper = pow(1.0 - bell, 1.7);
    float radius = mix(rMid, rEnd, taper);
    return max(abs(along) - lengthAxis * 0.5, abs(across) - radius);
  }

  float glassBend(vec2 p) {
    float topStart = uResolution.y * 0.5 - uBandTop;
    float bottomStart = -uResolution.y * 0.5 + uBandBottom;
    float top = smoothstep(topStart, uResolution.y * 0.5, p.y);
    float bottom = 1.0 - smoothstep(-uResolution.y * 0.5, bottomStart, p.y);
    return clamp(max(top, bottom), 0.0, 1.0);
  }

  vec2 atlasUv(vec2 localUv, float imageIndex) {
    float column = mod(imageIndex, uGrid.x);
    float row = floor(imageIndex / uGrid.x);
    return (vec2(column, row) + clamp(localUv, 0.004, 0.996)) / uGrid;
  }

  vec3 sampleCard(vec2 localUv, float imageIndex, float fringe, vec2 fringeDir) {
    vec2 uv = atlasUv(localUv, imageIndex);
    vec2 offset = fringeDir * fringe / max(uResolution, vec2(1.0));
    float red = texture2D(uAtlas, uv + offset).r;
    float green = texture2D(uAtlas, uv).g;
    float blue = texture2D(uAtlas, uv - offset).b;
    return vec3(red, green, blue);
  }

  void main() {
    vec2 screen = (vUv - 0.5) * uResolution;
    vec2 p = screen;
    float bend = glassBend(p);
    if (bend > 0.0) {
      float edgeDirection = p.y >= 0.0 ? -1.0 : 1.0;
      float wave = sin(p.x * uGlass.z + uTime * 1.6) * uGlass.w;
      p.y += edgeDirection * (uGlass.x * bend * bend + wave * bend);
      p.x *= 1.0 - uGlass.y * bend;
    }

    float mouseDistance = length(p - uMouse.xy);
    float blendRadius = uK;
    if (uMouse.z > 0.001) {
      float influence = 1.0 - smoothstep(0.0, max(uMelt.x, 1.0), mouseDistance);
      blendRadius += uMouse.w * uMouse.z * influence * influence;
    }

    float field = 1000000.0;
    float nearest = 1000000.0;
    float second = 1000000.0;
    vec2 nearestUv = vec2(0.5);
    vec2 secondUv = vec2(0.5);
    float nearestImage = 0.0;
    float secondImage = 0.0;
    float nearestDim = 1.0;
    float secondDim = 1.0;

    for (int i = 0; i < MAX_CARDS; i++) {
      if (float(i) >= uCount) break;
      vec4 state = uScale[i];
      if (max(state.x, state.y) <= 0.0001) continue;
      vec2 q = p - uPos[i];
      float cosine = cos(uRot[i]);
      float sine = sin(uRot[i]);
      q = vec2(q.x * cosine + q.y * sine, -q.x * sine + q.y * cosine);
      vec2 halfSize = max(uSize * 0.5 * state.xy, vec2(0.001));
      float radius = min(uRadius, min(halfSize.x, halfSize.y));
      float distanceCard = sdRoundBox(q, halfSize, radius);
      if (uMouse.z > 0.001) {
        float wake = 1.0 - smoothstep(0.0, max(uMelt.x, 1.0), mouseDistance);
        distanceCard += sin(q.y * uMelt.z + uTime * uMelt.w) * uWobble * wake;
      }
      field = smin(field, distanceCard, blendRadius);
      vec2 localUv = clamp(q / (2.0 * halfSize) + 0.5, 0.004, 0.996);
      localUv.y = 1.0 - localUv.y;
      if (distanceCard < nearest) {
        second = nearest;
        secondUv = nearestUv;
        secondImage = nearestImage;
        secondDim = nearestDim;
        nearest = distanceCard;
        nearestUv = localUv;
        nearestImage = state.w;
        nearestDim = state.z;
      } else if (distanceCard < second) {
        second = distanceCard;
        secondUv = localUv;
        secondImage = state.w;
        secondDim = state.z;
      }
    }

    for (int i = 0; i < MAX_LINKS; i++) {
      if (float(i) >= uLinkCount) break;
      vec4 parameters = uLinkPar[i];
      if (parameters.x <= -3.0) continue;
      float link = sdLink(p, uLinkA[i], uLinkB[i], parameters.x, parameters.y, parameters.z);
      field = smin(field, link, parameters.w);
    }

    float antialias = max(fwidth(field), 0.8);
    float alpha = 1.0 - smoothstep(-antialias, antialias, field);
    if (alpha <= 0.001) discard;

    float blend = smoothstep(-uBlend, uBlend, second - nearest);
    vec2 fringeDirection = vec2(0.0, p.y >= 0.0 ? 1.0 : -1.0);
    vec3 firstColor = sampleCard(nearestUv, nearestImage, uFringe * bend, fringeDirection) * nearestDim;
    vec3 secondColor = sampleCard(secondUv, secondImage, uFringe * bend, fringeDirection) * secondDim;
    vec3 color = mix(secondColor, firstColor, blend);

    float edge = 1.0 - smoothstep(0.0, 3.0, abs(field));
    color += vec3(0.92, 1.0, 0.58) * edge * 0.08;
    color = mix(color, color + vec3(uSheen * bend), bend * 0.7);
    color = mix(uPage, color, alpha);
    gl_FragColor = vec4(color, alpha);
  }
`;
