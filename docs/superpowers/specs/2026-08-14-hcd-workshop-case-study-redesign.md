# HCD workshop case-study redesign

Date: 2026-08-14

Status: Approved design direction; awaiting written-spec review

Scope: Public FamilySync/Care and McDonald’s/Squad Up case-study pages

## Why this redesign exists

The current public HCD pages expose the language and structure of an internal source-verification workflow. Terms such as “evidence,” “boundary,” slide numbers, and repeated Figma links make the work feel defensive and forensic. The rigid numbered navigation and hard editorial geometry also create a visual system that does not belong to the rest of the portfolio.

The redesign must return the pages to their intended purpose: concise, confident stories about human-centered design work, supported by strong visual representations. Provenance remains useful internally, but it must not become visitor-facing interface.

## Research grounding

The direction follows four recurring principles from current portfolio and HCD case-study guidance:

1. Treat the case study as a design story rather than a list of deliverables.
2. Lead with the human situation and the design payoff, then reveal the decisions that connect them.
3. Use deliberately curated process visuals with short contextual captions.
4. Make the page easy to scan without hiding the designer’s reasoning.

References consulted:

- Interaction Design Foundation, “How to Write UX/UI Design Case Studies That Boost Your Portfolio and Get You Hired”: https://www.interaction-design.org/literature/article/how-to-write-great-case-studies-for-your-ux-design-portfolio
- Smashing Magazine, “Designing Case Studies: Showcasing A Human-Centered Design Process”: https://www.smashingmagazine.com/2015/02/designing-case-studies-human-centered-design-process/
- IDEO, “Transforming a community hospital from the inside out”: https://www.ideo.com/case-study/transforming-a-community-hospital-from-the-inside-out
- Creative Bloq, “15 brilliant design portfolio examples, and why they work”: https://www.creativebloq.com/portfolios/examples-712368

## Core design statement

Each case study should feel like a project board opened inside Adi’s existing workshop portfolio.

The established self-healing cutting mat, ruler marks, workshop grid, rounded framing, and tactile depth remain the visual foundation. Warm paper sheets, printed project visuals, restrained post-its, and small tape-like details sit on that surface. The experience should feel designed and handled, not like a separate magazine template or a digital evidence archive.

The work remains the focal point. Workshop details support the story but never compete with it.

## Public-language rules

The public case studies must not render any of the following:

- “Evidence” as a navigation, button, caption, dialog, or content label
- Figma links or “View source in Figma” actions
- Figma file names, slide numbers, node identifiers, or board names
- “Boundary” as hero metadata
- “Source,” “provenance,” “artifact,” “verification,” or “proof” language
- Repeated disclaimers about authenticity, sponsorship, feasibility, or launch status
- Internal asset IDs or selection rationale

The private selector and source metadata may retain provenance information. The public React experience must not expose it.

Visitor-facing copy should use direct, natural language:

- “The situation” rather than “Frame”
- “What we learned” rather than “Evidence” or “Research proof”
- “The idea” rather than “Opportunity artifact”
- “How it works” rather than “Interaction evidence”
- “What I took forward” rather than a three-column outcome/limitation/reflection audit

Captions should explain what the visitor should notice in one short sentence. They should not explain why the image was included or where it came from.

## Story structure

Both projects use the same five-beat reading rhythm, but their visible headings are project-specific. There is no numbered chapter navigation.

The visible headings are fixed for this redesign:

| Beat | FamilySync | Squad Up |
| --- | --- | --- |
| 1 | Care coordination is work | The order starts before checkout |
| 2 | The family is the system | One person becomes the coordinator |
| 3 | Three principles shaped the idea | One order, individual agency |
| 4 | Designing the handoff | From invite to pickup |
| 5 | What I took forward | What I took forward |

### Beat 1: The situation

Open with the human tension, not the process. Use one concise paragraph and the strongest project visual.

- FamilySync: care creates invisible coordination work across a family network.
- Squad Up: a social food stop turns one person into the group’s administrator.

### Beat 2: What we learned

Show the minimum research needed to understand the design direction. Combine one or two strong visuals with two or three post-its carrying real insights or an existing participant quote.

- Research counts remain visible for Squad Up because they provide useful scale.
- Research methods appear as ordinary project context, not as credibility proof.
- No quote or finding may be invented to make a post-it look realistic.

### Beat 3: The idea

State the concept in one memorable sentence and show how it answers the earlier tension.

- FamilySync: coordinate handoffs while keeping responsibility and consent visible.
- Squad Up: one shared order with individual choice and clearer group progress.

### Beat 4: How it works

Use the service journeys, system maps, and interface sequences as the main content. Copy should explain the key decisions, not narrate every frame.

Dense maps retain the existing full-size inspection mode, relabeled in plain language as “View larger” and “Fit to screen.”

### Beat 5: What I took forward

End with a short reflection about the designer’s learning. Do not manufacture product impact.

One quiet context sentence follows the reflection:

- FamilySync: “Student team project created at Northwestern EDI with JPMorgan Chase as project partner; not a shipped product.”
- Squad Up: “Student team project created at Northwestern EDI using McDonald’s ordering as the design context; not affiliated with or shipped by McDonald’s.”

This sentence appears once, at the bottom, in readable but visually secondary text.

## Visual system

### Cutting-mat foundation

- Reuse the portfolio’s established deep-green self-healing mat palette, measured grid, ruler ticks, guide lines, rounded perimeter, and tactile shadow language.
- The mat fills the case-study canvas, with content arranged as a sequence of paper sheets and prints.
- Do not create a second unrelated grid, color system, or editorial shell.
- If the shared `CuttingMatSurface` component is not part of the tracked implementation base when work begins, reproduce only the required mat treatment inside the HCD scope rather than modifying or absorbing concurrent uncommitted work.

### Paper sheets and prints

- Primary text sits on warm off-white paper with charcoal type.
- Paper uses restrained grain, a subtle edge, and realistic layered shadows.
- Project images read like high-quality prints placed on the working surface.
- Small rotations are allowed, generally within 0.4–1.2 degrees; content must never become difficult to scan.
- Corner radii remain modest and material-like rather than generic oversized cards.
- Layout alternates large single visuals, diptychs, and occasional full-width maps. It must not collapse into a uniform card grid.

### Realistic post-its

Post-its are semantic research objects, not decoration.

- Use them only for real research findings, real participant language already present in the source material, open design questions, or decisive reframes.
- Limit most research sections to two or three visible notes.
- Use familiar note proportions, slight curl or lifted edge, subtle paper grain, soft contact shadow, and rotations within approximately two degrees.
- Do not scatter notes randomly, overlap important visuals, or imitate a chaotic workshop board.
- FamilySync notes use pale yellow, soft blue, and muted green.
- Squad Up notes use pale yellow, warm cream, and restrained red accents.
- Main narrative and post-it copy stay in the portfolio’s established type system. Post-it text uses a slightly heavier, more informal typographic treatment without introducing a new handwriting font.
- On mobile, notes join the document flow; they do not overlap or require horizontal panning.
- Color is never the only way a note communicates meaning.

### Project differentiation

The shared workshop system keeps both pages related. Each project gets a restrained personality within it:

- FamilySync: calmer spacing, blue-green accents, softer note palette, emphasis on family roles and handoffs.
- Squad Up: more energetic sequencing, McDonald’s-adjacent yellow and red used sparingly, emphasis on group momentum and shared state.

Neither page should mimic a corporate brand site or imply an official product relationship.

## Controls and interaction

- Remove the numbered chapter-navigation strip entirely.
- Keep the existing round close control, visually integrated with the paper/mat system.
- Remove the hero jump control; the first paper sheet begins within the natural scroll path.
- Image expansion uses a rounded paper tab or pill labeled “View larger.”
- Do not use square icon buttons, square bullets, hard rectangular chapter chips, or audit-style controls.
- Preserve 44-pixel minimum interactive targets, visible focus, reduced-motion behavior, Escape handling, browser-Back handling, and focus return.
- Keep full-size two-axis panning for dense maps.
- Motion is restrained: paper may settle by a few pixels and post-its may lift slightly on hover. No looping decorative motion inside the case study.

## Content curation

- FamilySync retains the nine public visuals already selected. The contaminated service-blueprint source remains excluded from the public story.
- Squad Up retains the eighteen unique public visuals, but the page may group related visuals into sequences so the visitor does not encounter eighteen equivalent cards.
- The existing hero should not reappear later as a duplicate.
- Use the latest or highest-fidelity visual when two assets communicate the same idea.
- All currently approved unique visuals remain available in the public story; related visuals are grouped into purposeful sequences rather than omitted or rendered as equivalent cards.
- Full source and Figma provenance remain available only in private repository metadata and the private selector.

## Copy constraints

- Hero proposition: one sentence.
- Hero context: at most two short sentences, with no disclaimer block.
- Section introduction: generally 35–65 words.
- Takeaways: no more than two when the visual already communicates the point.
- Image caption: generally 8–20 words.
- Reflection: approximately 50–90 words.
- Avoid portfolio jargon, abstract claims, repetitive “our team” openings, and unsupported impact language.
- Use “we” for team decisions and “I” only for Adi’s own role or reflection.

## Data and component direction

The public data contract should use visitor-oriented names. The implementation plan should evaluate renaming `evidence` to `visuals` and `EvidenceFigure` to a neutral visual-story component so internal terminology cannot leak back into rendered copy.

Source URL and source-label metadata may remain in a private manifest if required for reproducibility, but the public story renderer must neither require nor render those fields.

The shared shell remains responsible for:

- the mat/paper composition;
- five story beats;
- visual sequences and captions;
- realistic post-it presentation;
- image expansion and dense-map panning;
- modal focus, Escape, Back, and close behavior.

Project data remains responsible for:

- project-specific headings and concise story copy;
- visual order and grouping;
- genuine insight/quote text for post-its;
- project accent and note palette;
- the single bottom context sentence.

## Responsive behavior

### Desktop

- Mat perimeter and ruler language remain visible.
- Paper sheets can overlap the mat slightly and alternate alignment.
- Post-its may sit at sheet edges without covering text or images.
- Large maps use wide paper sheets and the existing full-size viewer.

### Mobile

- Preserve the mat as a visible framing texture without sacrificing reading width.
- Paper sheets become nearly full-width with consistent margins.
- Post-its move into the content flow.
- No decorative rotation may create horizontal overflow.
- Controls remain rounded, readable, and at least 44 pixels.
- Dense diagrams remain inspectable through full-size two-axis panning.

## Accessibility and performance

- Keep semantic heading order and the existing dialog labels.
- Post-its remain ordinary readable text in the DOM, not text baked into decorative images.
- Paper and note colors must meet readable contrast requirements.
- Decorative tape, curl, grain, and mat marks are hidden from assistive technology.
- Reduced-motion users receive no settling, lift, or smooth-scroll animation.
- Reuse existing optimized WebP assets; do not add generated decorative raster backgrounds.
- Avoid loading new web fonts solely for a handwriting effect unless the implementation proves the cost and readability are acceptable.

## Verification requirements

Static and browser verification must prove:

1. Neither public HCD route contains a Figma link, slide number, source label, or the word “evidence.”
2. Both routes use five story beats with project-specific visible headings.
3. FamilySync renders nine intended visuals and Squad Up renders the curated unique visual set without duplicate IDs.
4. Post-it text is derived from the approved story/source content and introduces no invented quote or finding.
5. Desktop and 390-pixel layouts have no horizontal overflow.
6. Close, Escape, browser Back, focus return, image expansion, fit/full-size toggle, and two-axis map panning still work.
7. The default project renderer and Glyph route remain unchanged.
8. No console, page, request, or asset-loading errors occur.
9. Production build and HCD verification scripts pass.

## Out of scope

- Redesigning the homepage, Selected Work cards, Glyph, or default project pages
- Changing the private Figma selector or deleting provenance metadata
- Inventing new research, quotes, outcomes, usability results, or business impact
- Publishing or pushing the redesign
- Absorbing unrelated dirty-worktree changes

## Definition of done

The redesign is complete when both public HCD pages feel native to the existing workshop/cutting-mat portfolio, read as concise human-centered design stories, use project visuals rather than provenance as the primary communication, and contain no visitor-facing Figma or evidence language. The pages must remain accessible, responsive, reproducible, and independently verified without altering unrelated portfolio work.
