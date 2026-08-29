# Project Wheel WebGL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's nested discipline arcs with a project-only WebGL wheel that implements liquid card fusion, stretching threads, cursor deformation, edge refraction, physical input, and accessible fallbacks.

**Architecture:** A focused React wrapper owns portfolio data and semantic interaction while a Three.js renderer owns the shader, texture atlas, wheel physics, and lifecycle. The current project-opening event stays authoritative, and a DOM fallback covers reduced-motion and WebGL failure without changing Selected Work or project-detail components.

**Tech Stack:** React 19, TypeScript, Vite, Three.js, GSAP, GLSL ES 1.00, existing Tailwind utilities, Node verification scripts, browser QA.

## Global Constraints

- Remove the homepage discipline subsystem completely; do not preserve a hidden or alternate discipline filter.
- Use only canonical `ProjectsContext` records, portfolio-owned project media, and existing project destinations.
- Preserve the Viscose MIT notice; copy no reference artwork or PP Neue Montreal font.
- Keep normal page scrolling outside the carousel stage.
- Do not stage or overwrite unrelated dirty-worktree changes.
- Do not call the feature complete without real browser evidence of all four named WebGL effects.

---

### Task 1: Renderer contract and static verification

**Files:**
- Create: `components/project-wheel/projectWheelTypes.ts`
- Create: `scripts/verify-project-wheel.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `ProjectWheelItem`, `ProjectWheelRendererOptions`, and `ProjectWheelRenderer` interfaces shared by the React wrapper and renderer.
- Produces: `npm run verify:project-wheel`, a source-level guard for the required shader features, input paths, accessibility hooks, and removed discipline UI.

- [ ] **Step 1: Write the failing verifier**

The verifier reads the carousel source and asserts that the shader includes smooth-min fusion, explicit link fields, mouse/melt uniforms, and glass-band refraction; that the React wrapper provides keyboard and fallback behavior; and that `Hero.tsx` no longer contains discipline-arc selectors.

- [ ] **Step 2: Run the verifier and confirm it fails because the new files do not exist**

Run: `node scripts/verify-project-wheel.mjs`

- [ ] **Step 3: Define the renderer contract and add the verification script command**

The renderer contract must expose:

```ts
export interface ProjectWheelRenderer {
  focusIndex(index: number, immediate?: boolean): void;
  step(delta: number, immediate?: boolean): void;
  getFrontIndex(): number;
  dispose(): void;
}
```

- [ ] **Step 4: Re-run the verifier and retain its expected feature failures until later tasks**

Run: `npm run verify:project-wheel`

### Task 2: Texture atlas and licensed shader

**Files:**
- Create: `components/project-wheel/projectWheelAtlas.ts`
- Create: `components/project-wheel/projectWheelShader.ts`
- Create: `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: `ProjectWheelItem[]`.
- Produces: `buildProjectWheelAtlas(items, onProgress)` returning a Three.js canvas texture, grid dimensions, item count, first-item promise, and all-items promise.
- Produces: `projectWheelVertexShader`, `projectWheelFragmentShader`, `MAX_PROJECT_CARDS`, and `MAX_PROJECT_LINKS`.

- [ ] **Step 1: Implement 3:2 cover-cropped atlas cells using only `item.imageUrl`**

- [ ] **Step 2: Port the MIT-licensed signed-distance shader with four explicit feature groups**

The shader must contain `smin` card fusion, `sdLink` neighbor threads, `uMouse`/`uMelt` cursor deformation, and `glassBend` plus band/fringe/sheen edge refraction.

- [ ] **Step 3: Add the upstream copyright, MIT terms, and excluded-asset statement**

- [ ] **Step 4: Run the verifier and confirm the shader/attribution checks pass**

Run: `npm run verify:project-wheel`

### Task 3: WebGL wheel renderer and physics

**Files:**
- Create: `components/project-wheel/createProjectWheelRenderer.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `ProjectWheelRendererOptions` with container, items, reduced-motion flag, front-index callback, ready callback, and failure callback.
- Produces: `createProjectWheelRenderer(options): ProjectWheelRenderer`.

- [ ] **Step 1: Add `three` and `gsap` dependencies**

Run: `npm install three gsap`

- [ ] **Step 2: Build a single orthographic full-quad renderer and wire every shader uniform**

- [ ] **Step 3: Implement ring layout, neighbor-link generation, closest-card hit testing, and front-index calculation**

- [ ] **Step 4: Implement wheel momentum/damping/snap, drag/swipe angular input, shortest-path focus, click-to-front, and front-card activation callback**

- [ ] **Step 5: Implement pointer melt/pull/side displacement, glass uniforms, reduced-motion switches, visibility pausing, resize handling, and strict disposal**

- [ ] **Step 6: Run TypeScript/build and fix renderer or GLSL integration errors**

Run: `npm run build`

### Task 4: Accessible React carousel

**Files:**
- Create: `components/project-wheel/ProjectWheel.tsx`
- Create: `components/project-wheel/ProjectWheelFallback.tsx`
- Modify: `scripts/verify-project-wheel.mjs`

**Interfaces:**
- Consumes: `items: ProjectWheelItem[]`, `active: boolean`, and `onOpen(item)`.
- Produces: a focusable WebGL stage, synchronized front-project metadata, keyboard controls, semantic project list, and failure/reduced-motion fallback.

- [ ] **Step 1: Mount and dispose the renderer from a strict-safe React effect**

- [ ] **Step 2: Add current-project title/status/index, usage instructions, previous/next buttons, and an `Open project` action**

- [ ] **Step 3: Add Arrow-key stepping and Enter/Space activation**

- [ ] **Step 4: Add HTML fallback cards for WebGL failure and reduced motion**

- [ ] **Step 5: Run the verifier and production build**

Run: `npm run verify:project-wheel && npm run build`

### Task 5: Hero integration and discipline removal

**Files:**
- Modify: `components/Hero.tsx`
- Modify: `App.tsx`
- Modify: `scripts/verify-project-wheel.mjs`

**Interfaces:**
- Consumes: canonical projects from `useProjects()`.
- Produces: project-only `ProjectWheel` items and the unchanged `openProject` event contract.

- [ ] **Step 1: Replace the skill mapping, arc geometry, SVG paths, discipline state, and dot nodes with canonical project-wheel items**

- [ ] **Step 2: Preserve existing project opening by dispatching `{ id, type: 'project' }`**

- [ ] **Step 3: Keep the global intro keyboard handoff from consuming keys owned by the focused carousel**

- [ ] **Step 4: Tune the stage around the hero headline, avatar, GitHub receipt, and mobile viewport without obscuring primary actions**

- [ ] **Step 5: Run source verification and the production build**

Run: `npm run verify:project-wheel && npm run build`

### Task 6: Browser acceptance and regression

**Files:**
- Modify: `scripts/verify-project-wheel.mjs` only if browser evidence reveals a missing static guard.
- Modify: `AGENTS.md` after all evidence passes.

**Interfaces:**
- Produces: runtime evidence for the seven design acceptance criteria.

- [ ] **Step 1: Verify at 1440px that wheel/drag/click/snap/open work and that goo, threads, cursor deformation, and edge refraction are visible**

- [ ] **Step 2: Verify 629px and 390px touch/mobile layouts, swipe input, no overflow, and unobscured hero controls**

- [ ] **Step 3: Verify keyboard stepping/open, focus visibility, live metadata, and every project destination**

- [ ] **Step 4: Verify reduced motion and forced WebGL failure remain readable and navigable**

- [ ] **Step 5: Verify scrolling outside the carousel still exits the hero and no browser console/request/shader errors occur**

- [ ] **Step 6: Run final commands and update the Codex log**

Run: `npm run verify:project-wheel && npm run build`
