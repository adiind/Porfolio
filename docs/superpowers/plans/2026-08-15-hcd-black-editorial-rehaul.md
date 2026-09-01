# HCD black editorial rehaul implementation plan

## Global constraints

- Preserve unrelated dirty work and edit only HCD feature files plus the narrow `App.tsx` wheel branch.
- Use the existing five-beat story manifests and exact 9/18 canonical visual sets.
- No cutting-mat DOM or CSS in either HCD page.
- White is limited to the story-copy panels; all visual wrappers are transparent on portfolio black.
- Public UI contains no Figma/source/evidence/provenance/verification language.

## Task 1: Add regression coverage

- Update `scripts/smoke-hcd-case-studies.cjs` to assert the black editorial DOM/geometry contract, compact readable post-its, transparent image wrappers, and actual mouse-wheel movement in the internal scroller.
- Update the static verifier contract to require the new shell markers and forbid the retired workshop/paper markers.
- Run the smoke against the current preview and record the expected RED failures.

## Task 2: Fix overlay scrolling

- Change the global wheel guard in `App.tsx` so an open blocking overlay returns control to its nested native scroller instead of calling `preventDefault()`.
- Preserve the existing animation guard and background scroll lock.

## Task 3: Rebuild the shared HCD renderer

- Replace the workshop surface/paper stack with the black editorial hero and five split story rows.
- Replace forced-aspect post-its with compact content-sized notes.
- Keep the existing accessible lightbox and portrait cap.
- Remove the unused workshop surface component.

## Task 4: Refine project-specific story notes

- Add the three FamilySync concept principles as highlighted post-its.
- Add equivalent concise, source-grounded concept highlights to Squad Up.
- Update approved-note contracts without changing visual assets or truth-boundary copy.

## Task 5: Verify and hand off

- Run static verification, production build, and four-case browser smoke.
- Inspect both pages at desktop, mobile, and the user’s intermediate-width view.
- Update only the newest line under `## Codex` in `AGENTS.md` with the completed correction.
