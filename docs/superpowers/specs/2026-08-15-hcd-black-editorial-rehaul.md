# HCD black editorial rehaul

## Goal

Rebuild the FamilySync and Squad Up case studies so they belong to the existing black portfolio, remain story-led, and use the HCD imagery as the visual narrative rather than as framed evidence.

## Shared visual system

- The full case-study canvas is the portfolio black (`#050505`). There is no cutting-mat grid, ruler, frame, paper stack, or full-page warm-paper background.
- The hero is a black two-column editorial composition: project story and compact colored notes on the left; a smaller, unboxed hero image on the right. The image wrapper is transparent and has no white paper frame.
- Each of the five story beats is a two-column composition on desktop. The left column is the only white surface and contains the beat count, heading, and short copy broken into compact post-it notes. The right column presents the project imagery directly on black.
- On mobile, the white story panel stacks above the imagery. No horizontal overflow is allowed.
- Post-its are content-sized, readable, and restrained: approximately 13–15px type, 80–150px tall, 180–230px wide on desktop, no forced 4:3 aspect, and no clipped text. Rotation is subtle and removed on mobile/reduced motion.
- Images remain clickable to the existing accessible fit/full-size viewer. Captions remain concise and are rendered on black, never inside evidence/source chrome.

## Story treatment

- Preserve the current five beats and the exact canonical image sets: 9 unique FamilySync visuals and 18 unique Squad Up visuals.
- Preserve project truth boundaries and keep public Figma, source, evidence, provenance, verification, and slide/node language absent.
- FamilySync beat 1 remains titled `Care coordination is work`.
- The three FamilySync concept principles become three visibly highlighted post-its: coordinate the work; communicate what is happening; preserve the human connection.
- Both projects use the same structural system, with their existing project-specific note colors and content.

## Interaction correction

- A project overlay must allow native wheel scrolling inside its own case-study scroller. The portfolio background remains locked while the overlay is open.
- Escape, Back, focus return, image viewer, full-size panning, reduced motion, and responsive behavior remain intact.

## Acceptance

- Fresh production build passes.
- Static HCD verification passes for shared, FamilySync, McDonald’s, and integration modes.
- Browser smoke passes both routes at desktop and mobile, including a real wheel gesture that increases the internal case-study scroll position.
- Browser geometry confirms black case-study canvas, no cutting-mat marker, white only on story-copy panels, transparent image wrappers, readable unclipped compact notes, no horizontal overflow, and correct image counts.
