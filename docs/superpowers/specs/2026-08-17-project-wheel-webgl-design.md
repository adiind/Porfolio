# Project Wheel WebGL Design

## Status

Approved by the user on 2026-08-17: remove the discipline controls, make the homepage carousel purely project-based, and implement the Viscose reference's WebGL goo, stretching threads, cursor deformation, and edge refraction.

## Visitor outcome

The right side of the homepage should feel like a physical wheel of Adi's work rather than a decorative diagram. A visitor can rotate substantial project cards with a wheel, trackpad, drag, or touch swipe; motion carries momentum and settles with one card facing front. Clicking an off-centre card brings it forward. Clicking the front card or its visible action opens the existing portfolio destination.

## Scope

- Replace the two static discipline/project SVG arcs in `components/Hero.tsx`.
- Remove the homepage discipline selector, skill-to-project mapping, and discipline filtering behavior.
- Feed the wheel from the canonical `ProjectsContext` project records so the wheel and Selected Work cannot silently diverge.
- Keep the existing project-opening event/deep-link behavior.
- Do not change the post-scroll Selected Work grid or project-detail renderers.

## Visual and interaction design

- Render one mostly off-screen circular ring on the right side of the hero.
- Draw every project card, the liquid union between close cards, the stretching neighbor threads, cursor-local melting, cursor pull/tilt, and top/bottom refracted glass lip in one fragment-shader pass.
- Use each project's own hero image in a generated texture atlas. Do not copy the reference repository's artwork or bundled fonts.
- Keep project title, position, status, and an `Open project` action in semantic HTML synchronized with the shader's front card.
- Wheel/trackpad input rotates the carousel only while the pointer is over its stage. Drag and touch swipe rotate it directly. Input outside the stage retains the portfolio's normal hero-to-page scroll behavior.
- An off-centre click rotates the shortest path to that card. Clicking the already-front card opens it.
- Arrow Left/Right and Arrow Up/Down step the wheel. Enter/Space opens the front project.

## Architecture

`components/project-wheel/ProjectWheel.tsx` owns React lifecycle, semantic controls, accessibility state, and fallback selection. `components/project-wheel/createProjectWheelRenderer.ts` owns Three.js setup, animation state, input physics, uniform updates, visibility pausing, cleanup, and hit testing. `components/project-wheel/projectWheelShader.ts` owns the licensed GLSL shader source. `components/project-wheel/projectWheelAtlas.ts` packs portfolio images into a single canvas texture. `components/project-wheel/projectWheelTypes.ts` defines the small interface shared between React and WebGL.

The renderer exposes `step`, `focusIndex`, and `dispose`; it emits the current front index and readiness/failure changes. React remains authoritative for opening project destinations and for all readable labels.

## Accessibility and fallbacks

- The stage is keyboard focusable and has an explicit carousel label and usage instructions.
- The current project metadata is real DOM text with an `aria-live="polite"` update.
- Every project remains available in a compact semantic project list, even though the WebGL canvas is the visual surface.
- `prefers-reduced-motion` removes the long entry, momentum, cursor melt, wobble, and animated refraction. Stepping becomes an immediate or short opacity-only change.
- If WebGL creation, shader compilation, or atlas setup fails, render a project-card arc/stack in HTML instead of leaving a blank hero.
- The canvas is decorative to assistive technology; semantic controls carry the interaction.

## Performance and lifecycle

- Use one full-stage quad and one fragment-shader draw call.
- Cap renderer pixel ratio at `1.5` and use ten canonical Selected Work projects rather than the reference's eighteen placeholders.
- Pause `requestAnimationFrame` when the hero is inactive or the document is hidden.
- Release geometry, materials, textures, event listeners, animation frames, and the WebGL context on cleanup so React StrictMode cannot leak contexts.
- Generate a maximum 512px-wide atlas cell per project and preserve 3:2 cover cropping.

## Licensing

The shader and renderer are adapted from Yousuf Soomro's MIT-licensed Viscose carousel. Preserve the MIT notice in `THIRD_PARTY_NOTICES.md` and source headers. Do not copy the reference's unlicensed project images or PP Neue Montreal font.

## Acceptance criteria

1. No discipline controls, discipline labels, or nested discipline SVG arc remain in the homepage hero.
2. The wheel contains only canonical portfolio projects and opens the correct existing destination.
3. Goo fusion, neighbor threads, cursor-local deformation, and edge refraction are visibly present in a WebGL-capable browser.
4. Wheel, trackpad, pointer drag, touch swipe, click-to-front, front-card open, and keyboard stepping work.
5. The page can still leave the intro by scrolling outside the carousel stage.
6. Reduced motion and forced WebGL failure remain readable and fully navigable.
7. The production build succeeds with no shader/runtime, console, asset, or horizontal-overflow errors at 1440px, 629px, and 390px widths.
