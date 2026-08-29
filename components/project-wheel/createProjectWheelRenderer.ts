/**
 * Project-wheel renderer adapted from Viscose by Yousuf Soomro.
 * Copyright (c) 2026 Yousuf Soomro. Used under the MIT License.
 * See THIRD_PARTY_NOTICES.md. No upstream artwork or fonts are included.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { buildProjectWheelAtlas } from './projectWheelAtlas';
import {
  MAX_PROJECT_CARDS,
  MAX_PROJECT_LINKS,
  projectWheelFragmentShader,
  projectWheelVertexShader,
} from './projectWheelShader';
import { ProjectWheelRenderer, ProjectWheelRendererOptions } from './projectWheelTypes';

const TAU = Math.PI * 2;
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;

const blankTexture = () => {
  const texture = new THREE.DataTexture(new Uint8Array([18, 36, 30, 255]), 1, 1);
  texture.needsUpdate = true;
  return texture;
};

interface LayoutCard {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  brightness: number;
}

export const createProjectWheelRenderer = (options: ProjectWheelRendererOptions): ProjectWheelRenderer => {
  const { container, items } = options;
  if (!items.length) throw new Error('The project wheel needs at least one project.');
  if (items.length > MAX_PROJECT_CARDS) throw new Error(`The project wheel supports up to ${MAX_PROJECT_CARDS} projects.`);

  let disposed = false;
  let active = true;
  let visible = !document.hidden;
  let frame = 0;
  let viewWidth = Math.max(1, container.clientWidth);
  let viewHeight = Math.max(1, container.clientHeight);
  let cardWidth = 190;
  let cardHeight = cardWidth / 1.5;
  let ringRadius = 320;
  const ringCenter = new THREE.Vector2();
  let frontAngle = Math.PI;
  let frontIndex = 0;
  let interactive = options.reducedMotion;
  let dragging = false;
  let pointerDown = false;
  let pointerTravel = 0;
  let previousPointerAngle = 0;
  let previousPointerTime = 0;
  let spinVelocity = 0;
  let targetSpin: number | null = null;
  let latestLayout: LayoutCard[] = [];
  const state = { spin: 0, entry: options.reducedMotion ? 1 : 0, shift: options.reducedMotion ? 1 : 0 };
  const pointer = { x: 0, y: 0, inside: false, engaged: false };
  const cursor = { x: 0, y: 0, amount: 0, seeded: false };

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    throw new Error(`Unable to create the project-wheel WebGL context: ${error instanceof Error ? error.message : String(error)}`);
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.domElement.className = 'absolute inset-0 h-full w-full touch-none';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
  const uniforms = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uSize: { value: new THREE.Vector2(cardWidth, cardHeight) },
    uRadius: { value: 16 },
    uCount: { value: items.length },
    uPos: { value: Array.from({ length: MAX_PROJECT_CARDS }, () => new THREE.Vector2()) },
    uRot: { value: new Float32Array(MAX_PROJECT_CARDS) },
    uScale: { value: Array.from({ length: MAX_PROJECT_CARDS }, (_, index) => new THREE.Vector4(1, 1, 1, index)) },
    uLinkCount: { value: Math.min(items.length, MAX_PROJECT_LINKS) },
    uLinkA: { value: Array.from({ length: MAX_PROJECT_LINKS }, () => new THREE.Vector2()) },
    uLinkB: { value: Array.from({ length: MAX_PROJECT_LINKS }, () => new THREE.Vector2()) },
    uLinkPar: { value: Array.from({ length: MAX_PROJECT_LINKS }, () => new THREE.Vector4()) },
    uK: { value: 31 },
    uWobble: { value: options.reducedMotion ? 0 : 3.5 },
    uTime: { value: 0 },
    uAtlas: { value: blankTexture() as THREE.Texture },
    uGrid: { value: new THREE.Vector2(1, 1) },
    uBlend: { value: 16 },
    uBandTop: { value: 0 },
    uBandBottom: { value: 0 },
    uGlass: { value: new THREE.Vector4(options.reducedMotion ? 0 : 58, 0.055, 0.018, options.reducedMotion ? 0 : 5) },
    uFringe: { value: options.reducedMotion ? 0 : 1.6 },
    uSheen: { value: options.reducedMotion ? 0 : 0.055 },
    uMouse: { value: new THREE.Vector4() },
    uMelt: { value: new THREE.Vector4(250, 32, 0.048, 6.5) },
    uPage: { value: new THREE.Color('#07110e') },
  };

  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: projectWheelVertexShader,
    fragmentShader: projectWheelFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const atlas = buildProjectWheelAtlas(items);
  uniforms.uAtlas.value.dispose();
  uniforms.uAtlas.value = atlas.texture;
  uniforms.uGrid.value.set(atlas.grid[0], atlas.grid[1]);
  atlas.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const resize = () => {
    viewWidth = Math.max(1, container.clientWidth);
    viewHeight = Math.max(1, container.clientHeight);
    const tight = viewWidth < 520;
    cardWidth = tight ? clamp(viewWidth * 0.42, 132, 158) : clamp(viewWidth * 0.28, 176, 224);
    cardHeight = cardWidth / 1.5;
    ringRadius = tight
      ? Math.min(viewHeight * 0.39, viewWidth * 0.88)
      : Math.min(viewHeight * 0.49, viewWidth * 0.68);
    ringCenter.set(viewWidth * (tight ? 0.61 : 0.64), 0);
    frontAngle = Math.atan2(-ringCenter.y, -ringCenter.x);
    renderer.setSize(viewWidth, viewHeight, false);
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    mesh.scale.set(viewWidth, viewHeight, 1);
    uniforms.uResolution.value.set(viewWidth, viewHeight);
    uniforms.uSize.value.set(cardWidth, cardHeight);
    uniforms.uRadius.value = tight ? 12 : 18;
    uniforms.uBandTop.value = viewHeight * (tight ? 0.065 : 0.085);
    uniforms.uBandBottom.value = viewHeight * (tight ? 0.065 : 0.085);
  };

  const slot = TAU / items.length;
  const nearestSpinForIndex = (index: number) => {
    // Card i is laid out at frontAngle + i * slot + spin, so bringing it to
    // frontAngle requires spin = -i * slot. Keep the nearest full winding.
    const base = -wrapIndex(index, items.length) * slot;
    return base + Math.round((state.spin - base) / TAU) * TAU;
  };

  const calculateFrontIndex = () => {
    const index = wrapIndex(Math.round(-state.spin / slot), items.length);
    if (index !== frontIndex) {
      frontIndex = index;
      options.onFrontIndexChange(index);
    }
    return index;
  };

  const focusIndex = (index: number, immediate = false) => {
    const nextIndex = wrapIndex(index, items.length);
    targetSpin = nearestSpinForIndex(nextIndex);
    spinVelocity = 0;
    gsap.killTweensOf(state, 'spin');
    if (immediate || options.reducedMotion) {
      state.spin = targetSpin;
      targetSpin = null;
      calculateFrontIndex();
      return;
    }
    const distanceInSlots = Math.abs(targetSpin - state.spin) / slot;
    gsap.to(state, {
      spin: targetSpin,
      duration: 0.48 * Math.sqrt(Math.max(1, distanceInSlots)),
      ease: 'power3.inOut',
      onComplete: () => {
        targetSpin = null;
        calculateFrontIndex();
      },
    });
  };

  const step = (delta: number, immediate = false) => focusIndex(calculateFrontIndex() + delta, immediate);

  const worldPointer = (event: PointerEvent) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left - viewWidth / 2,
      y: viewHeight / 2 - (event.clientY - bounds.top),
    };
  };

  const pointerAngle = (event: PointerEvent) => {
    const world = worldPointer(event);
    return Math.atan2(world.y - ringCenter.y, world.x - ringCenter.x);
  };

  const hitTest = (event: PointerEvent) => {
    const world = worldPointer(event);
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    latestLayout.forEach((card, index) => {
      const cosine = Math.cos(card.rotation);
      const sine = Math.sin(card.rotation);
      const dx = world.x - card.x;
      const dy = world.y - card.y;
      const localX = dx * cosine + dy * sine;
      const localY = -dx * sine + dy * cosine;
      const halfWidth = cardWidth * card.scale * 0.56;
      const halfHeight = cardHeight * card.scale * 0.62;
      if (Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight) {
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
    });
    return bestIndex;
  };

  const onWheel = (event: WheelEvent) => {
    const bounds = container.getBoundingClientRect();
    const inside = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom;
    if (!inside) return;
    event.preventDefault();
    event.stopPropagation();
    if (!interactive || options.reducedMotion) return;
    gsap.killTweensOf(state, 'spin');
    targetSpin = null;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    spinVelocity = clamp(spinVelocity - delta * 0.0032, -8, 8);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!interactive) return;
    const world = worldPointer(event);
    pointerDown = true;
    dragging = false;
    pointerTravel = 0;
    pointer.inside = true;
    pointer.engaged = !options.reducedMotion;
    pointer.x = world.x;
    pointer.y = world.y;
    previousPointerAngle = pointerAngle(event);
    previousPointerTime = performance.now();
    spinVelocity = 0;
    targetSpin = null;
    gsap.killTweensOf(state, 'spin');
    renderer.domElement.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    const world = worldPointer(event);
    pointer.inside = true;
    pointer.x = world.x;
    pointer.y = world.y;
    if (!pointerDown || options.reducedMotion) return;
    const angle = pointerAngle(event);
    let delta = angle - previousPointerAngle;
    if (delta > Math.PI) delta -= TAU;
    if (delta < -Math.PI) delta += TAU;
    const now = performance.now();
    const elapsed = Math.max(8, now - previousPointerTime) / 1000;
    state.spin += delta;
    spinVelocity = clamp(delta / elapsed, -8, 8);
    pointerTravel += Math.abs(delta * ringRadius);
    dragging = pointerTravel > 7;
    previousPointerAngle = angle;
    previousPointerTime = now;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!pointerDown) return;
    pointerDown = false;
    pointer.engaged = false;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    if (!dragging) {
      const selected = hitTest(event);
      if (selected >= 0) {
        if (selected === calculateFrontIndex()) options.onActivate(selected);
        else focusIndex(selected);
      }
    }
    dragging = false;
  };

  const onPointerEnter = (event: PointerEvent) => {
    const world = worldPointer(event);
    pointer.inside = true;
    pointer.engaged = event.pointerType !== 'touch' && !options.reducedMotion;
    pointer.x = world.x;
    pointer.y = world.y;
  };
  const onPointerLeave = () => {
    pointer.inside = false;
    if (!pointerDown) pointer.engaged = false;
  };

  const updateLayout = (time: number, deltaSeconds: number) => {
    if (!pointerDown && targetSpin === null && !options.reducedMotion) {
      if (Math.abs(spinVelocity) > 0.018) {
        state.spin += spinVelocity * deltaSeconds;
        spinVelocity *= Math.pow(0.935, deltaSeconds * 60);
      } else if (interactive) {
        spinVelocity = 0;
        const snapTarget = nearestSpinForIndex(calculateFrontIndex());
        const difference = snapTarget - state.spin;
        if (Math.abs(difference) > 0.0008) state.spin += difference * Math.min(1, deltaSeconds * 8.5);
        else state.spin = snapTarget;
      }
    }

    const cursorTarget = pointer.engaged && pointer.inside ? 1 : 0;
    cursor.amount += (cursorTarget - cursor.amount) * Math.min(1, deltaSeconds * (cursorTarget ? 10 : 5));
    if (!cursor.seeded) {
      cursor.x = pointer.x;
      cursor.y = pointer.y;
      cursor.seeded = true;
    }
    cursor.x += (pointer.x - cursor.x) * Math.min(1, deltaSeconds * 13);
    cursor.y += (pointer.y - cursor.y) * Math.min(1, deltaSeconds * 13);

    const shiftCenterX = ringCenter.x * state.shift;
    const effectiveRadius = ringRadius * state.shift;
    const currentFront = calculateFrontIndex();
    latestLayout = items.map((_, index) => {
      const angle = frontAngle + index * slot * state.entry + state.spin;
      let x = shiftCenterX + Math.cos(angle) * effectiveRadius;
      let y = ringCenter.y + Math.sin(angle) * effectiveRadius;
      const dx = cursor.x - x;
      const dy = cursor.y - y;
      const pointerDistance = Math.hypot(dx, dy);
      const influence = cursor.amount * (1 - Math.min(1, pointerDistance / (cardWidth * 1.75)));
      x += dx * 0.12 * influence;
      y += dy * 0.12 * influence;
      const distanceFromFront = Math.abs(Math.atan2(Math.sin(angle - frontAngle), Math.cos(angle - frontAngle)));
      const depth = 1 - Math.min(1, distanceFromFront / Math.PI);
      const scale = (0.82 + depth * 0.23) * (1 + influence * 0.1);
      const brightness = index === currentFront ? 1 : 0.58 + depth * 0.2;
      return { x, y, rotation: angle + Math.PI / 2 + influence * 0.08, scale, brightness };
    });

    latestLayout.forEach((card, index) => {
      uniforms.uPos.value[index].set(card.x, card.y);
      uniforms.uRot.value[index] = card.rotation;
      uniforms.uScale.value[index].set(card.scale, card.scale, card.brightness, index);
    });

    const linkCount = Math.min(items.length, MAX_PROJECT_LINKS);
    uniforms.uLinkCount.value = linkCount;
    for (let index = 0; index < linkCount; index += 1) {
      const first = latestLayout[index];
      const second = latestLayout[(index + 1) % latestLayout.length];
      uniforms.uLinkA.value[index].set(first.x, first.y);
      uniforms.uLinkB.value[index].set(second.x, second.y);
      const gap = Math.max(0, Math.hypot(second.x - first.x, second.y - first.y) - cardWidth * 0.78);
      const middleRadius = 7 - gap * 0.022;
      uniforms.uLinkPar.value[index].set(15, middleRadius, options.reducedMotion ? 0 : 6, 13);
    }

    uniforms.uMouse.value.set(cursor.x, cursor.y, cursor.amount, options.reducedMotion ? 0 : 34);
    uniforms.uTime.value = time;
  };

  let previousTime = performance.now();
  const renderFrame = (now: number) => {
    frame = 0;
    if (disposed || !active || !visible) return;
    const deltaSeconds = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000));
    previousTime = now;
    updateLayout(now / 1000, deltaSeconds);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(renderFrame);
  };

  const start = () => {
    if (disposed || frame || !active || !visible) return;
    previousTime = performance.now();
    frame = requestAnimationFrame(renderFrame);
  };

  const onVisibilityChange = () => {
    visible = !document.hidden;
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else start();
  };

  const onResize = () => resize();
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('pointerenter', onPointerEnter);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibilityChange);

  resize();
  calculateFrontIndex();
  start();

  atlas.first.then(() => {
    if (disposed) return;
    options.onReady();
    interactive = true;
    if (options.reducedMotion) {
      return;
    }
    const timeline = gsap.timeline({
      onComplete: () => undefined,
    });
    timeline.to(state, { entry: 1, duration: 2.6, ease: 'power2.out' });
    timeline.to(state, { shift: 1, duration: 1.7, ease: 'power3.inOut' }, '-=1.15');
  }).catch((error) => options.onFailure(error instanceof Error ? error : new Error(String(error))));

  return {
    focusIndex,
    step,
    getFrontIndex: () => calculateFrontIndex(),
    setActive(nextActive: boolean) {
      active = nextActive;
      if (!active && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else start();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gsap.killTweensOf(state);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('wheel', onWheel, true);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('pointerenter', onPointerEnter);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      geometry.dispose();
      material.dispose();
      atlas.texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
};
