# Scroll auto-complete across case studies and home (2026-10-16)

**Problem:** people stopped scrolling halfway through pinned/animated scenes (mostly Mac Safari, hidden scrollbars) and never realised there was more before the "Explore more" button.

**Fix (one shared engine, `public/shared/scroll-settle.js`):**
- When a scroll loses steam between two finished scenes, a soft spring (damping 0.74, small settle) carries it to the nearest one. It starts from the scroll's own speed, eases in, and never fights the reader: any new push cancels it; decaying trackpad momentum is swallowed while landing; steady mouse-wheel notches are never mistaken for momentum; off for reduced motion.
- Target is decided from the projected landing point, not where the scroll is at that instant.
- Pinned/animated stretches always complete; reading stretches only settle when already within ~28% of a viewport of a heading, so normal reading is untouched.
- "Keep scrolling" pill with a progress bar (P&G story, Squad Up, FamilySync); Squad Up's first screen also gets a "Scroll to explore" cue. Home already had one.

**Applied to:** P&G story + full case (second section), Squad Up (pinned intro, storyboard, phases), FamilySync (scene, climax, section tops), home page (section tops).

**Also:** Squad Up lag fix (CSS smooth scroll fought Lenis; Lenis `lerp` .11→.25; intro scrub no longer stacked on Lenis); P&G wording "conditioning product" → "hair care product".

**Tested** (headless Chromium, simulated trackpad flicks at 60 Hz, steady wheel at 20/70/160 ms, touch swipes, interruption mid-landing): every flick lands on a finished scene, overshoot ≤ ~10 px, settles in 0.4–1.0 s, steady wheel reaches the end on every page, 0 console errors, `npm run build` passes.
**Not tested:** real Safari / real trackpad momentum. If it feels off, tune `ZETA`, `RAMP`, `HANDOFF` at the top of `scroll-settle.js`.
