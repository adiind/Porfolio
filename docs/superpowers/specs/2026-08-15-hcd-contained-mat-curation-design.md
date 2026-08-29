# HCD contained-mat curation design

## Goal

Turn FamilySync and Squad Up into curated portfolio stories that use the portfolio’s existing contained cutting-mat object, literal square post-it notes, and only the few final-presentation visuals needed to understand each project.

## Visual system

- The black portfolio shell remains only as negative space around contained objects. No section places standalone white text directly on a black void.
- The hero and each of the five story beats are separate contained `CuttingMatSurface` objects, matching Selected Work. The mat never becomes the full-page background.
- Each mat contains a compact dark-glass heading plaque, square post-its pasted directly on the mat, and—when needed—one contextualized image. There is no white or cream sheet placed on top of the mat.
- Post-its are literal squares (`aspect-ratio: 1 / 1`). They use the existing project palettes, subtle rotation, a lifted lower edge, paper texture, and grounded shadows. Desktop notes are 184px square; narrower layouts may reduce them to no less than 148px while remaining square.
- Notes contain short phrases, not paragraphs. Type is at least 14px and must not clip.
- Images have no white wrapper. They sit directly on the mat with a restrained radius and shadow. The full-size viewer remains optional for inspection, not necessary for understanding the story.

## Story and curation

The public page is a case study, not a presentation browser. Every retained visual must advance the five-beat narrative and have adjacent context.

### FamilySync — five visuals total

1. Hero: `care-visibility-presence`
2. Situation: `care-crisis-journey`
3. Learning: `care-trust-takeaways`
4. Idea: `care-three-pillars`
5. Mechanics: `care-schedule-management`

Reflection uses notes only. Remove `care-stakeholders`, `care-familysync-intro`, `care-clinical-guardian-flow`, and `care-escalation-flow` from the public story without deleting their stored assets.

### Squad Up — six visuals total

1. Hero: `mcd-live-progress`
2. Situation: `mcd-research-insight`
3. Learning: `mcd-capabilities-gap`
4. Idea: `mcd-value-props`
5. Mechanics: `mcd-squad-details`
6. Mechanics: `mcd-order-complete`

Reflection uses notes only. All other McDonald’s visuals remain stored but leave the public story.

## Content rules

- Five beats remain: situation, learning, idea, mechanics, reflection.
- Each beat uses two to four short square notes plus a clear heading.
- The three FamilySync principles remain three separate highlighted notes.
- Each retained image keeps a concise caption that explains what the visitor is seeing and why it matters.
- No Figma, source, evidence, provenance, verification, slide number, or node language appears publicly.
- Existing student-project and affiliation truth boundaries remain unchanged.

## Responsive and interaction rules

- Desktop and the 629px in-app width keep the mat as a contained object. Copy/notes and image may sit side by side when space allows.
- Mobile stacks the heading, two-column square-note grid, and image within the same contained mat.
- Native wheel scrolling, Escape, Back, focus return, reduced motion, image expansion, full-size panning, and horizontal-overflow protections remain intact.

## Acceptance

- FamilySync renders exactly 5 unique visuals; Squad Up renders exactly 6.
- Each route renders exactly 6 contained mats: one hero plus five story beats.
- Every post-it has a computed 1:1 ratio, at least 148px width, at least 14px type, and no clipped text.
- No retired white story panel, paper-sheet, or full-page mat marker remains.
- Fresh build and browser checks pass at 1440×1000, 629×863, and 390×844.
