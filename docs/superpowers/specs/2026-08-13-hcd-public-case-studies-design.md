# Public HCD Case Studies: FamilySync and McDonald’s

## Purpose

Replace the generic project-detail treatment for `familysync-jpmorgan` and `mcdonalds-interaction-design` with two recruiter-facing HCD case studies. Both pages should prove how research, synthesis, journeys, system decisions, and final interactions connect, while each retains the character of its project.

The work uses the read-only Figma evidence already collated in `review/hcd-figma-selector/`. It does not modify Figma or publish the portfolio.

## Audience and success criteria

The primary audience is a hiring reviewer scanning for human-centered design judgment. In approximately two minutes, a reviewer should be able to understand:

- the human problem and project context;
- what primary research or observed behavior informed the work;
- how the team translated evidence into a journey, service, or interaction model;
- which decisions the portfolio owner materially contributed to;
- how the final concept responds to the original tension;
- what remains conceptual, incomplete, or unvalidated.

The finished pages must feel like two chapters from the same portfolio, not cloned templates and not unrelated microsites.

## Chosen approach

Build two bespoke React detail components on shared HCD presentation primitives.

- `FamilySyncProjectDetail` owns the Care page and its content manifest.
- `McDonaldsProjectDetail` owns the Squad Up page and its content manifest.
- A shared HCD layer owns repeatable evidence layouts, image treatment, captions, source links, and responsive behavior.
- `ProjectDetail` dispatches these two project IDs to their bespoke renderers while leaving every other project unchanged.

This keeps page ownership independent enough for parallel implementation while centralizing the design rules that must stay consistent.

## Shared narrative structure

Both pages follow the same evidence-led sequence:

1. **Project frame** — title, concise proposition, context, role, status, disciplines, and a strong final-state hero.
2. **Human tension** — research sample, stakeholder evidence, participant behavior, or the clearest problem synthesis.
3. **From evidence to opportunity** — insights, design principles, opportunity framing, and the project’s specific HCD question.
4. **Journey and system** — current-state journey, service blueprint, experience map, or system logic that proves the work extends beyond isolated screens.
5. **Design decisions** — selected concept alternatives, architecture, permissions, readiness, ownership, payment, or handoff logic.
6. **Interaction evidence** — a restrained sequence of final screens or service moments connected back to prior decisions.
7. **Outcome and reflection** — what the concept achieved, what was not validated, and the durable design lesson.

Every visual must have a caption that states what it proves, changed, or enabled. Captions must not merely repeat slide titles.

## Project-specific emphasis

### FamilySync / Care

The Care page emphasizes invisible caregiving labor, shared authority, trust boundaries, permissions, escalation, and service orchestration. Its visual character should be calm, humane, and precise, using the portfolio’s dark editorial base with restrained mint and warm neutral accents.

The story should move from multi-person family needs and the helpful-versus-creepy trust boundary into caregiver journeys, backstage coordination, configurable autonomy, escalation visibility, and presence through updates. It must clearly describe FamilySync as a Northwestern EDI service-design concept developed with JPMorgan Chase as the project partner, without implying a shipped JPMorgan Chase product.

### McDonald’s / Squad Up

The McDonald’s page emphasizes observed teen behavior, group-ordering friction, lightweight invitation, visible ownership, readiness, delegated payment, and fulfillment. Its visual character should be energetic but controlled, using the same dark editorial base with cream, yellow, and signal-red accents derived from the source work.

The story should move from research proof and the coordination/payment gap into opportunity framing, app and kiosk journeys, inclusive join paths, the readiness state model, and final group-order interactions. It must describe the work as a Northwestern EDI interaction-design concept, not an official McDonald’s product launch.

## Evidence selection and deduplication

Use every unique artifact that advances the story; do not force every exported image into the page.

When two artifacts communicate substantially the same point:

1. prefer the final presentation version over an exploratory board version;
2. prefer the latest or highest-fidelity interaction over an earlier rendering;
3. retain an older artifact only when it proves a distinct step, alternative, or decision;
4. never show two near-identical images solely to increase visual volume.

Detailed working boards can support journey or system sections when they contain evidence that the final deck compresses away. Final-deck visuals remain canonical for repeated concept and interface states.

Each page manifest records the artifact ID, local asset, alt text, caption, source URL, visual role, and crop treatment. This makes duplicate decisions explicit and reviewable.

## Image and crop treatment

The PNG exports in `review/hcd-figma-selector/assets/` are source masters. Public page assets are optimized WebP derivatives stored in project-specific directories under `public/images/hcd/`.

Three treatments are allowed:

- **Full evidence:** preserve the complete frame for dense journeys, blueprints, system maps, and diagrams. Display with `object-fit: contain` on a quiet surface.
- **Focus crop:** create a derived WebP crop around the meaningful region for narrative pacing. The caption and alt text must describe the cropped content accurately.
- **Editorial overview:** use a broad crop for a hero or chapter opener only when the key message remains understandable without tiny text.

Do not crop through labels, people, phones, decision nodes, or the cause-and-effect relationship being discussed. Do not stretch an image to fit a fixed aspect ratio. Dense artifacts may open into a full-image lightbox so the page crop never becomes the only available evidence.

The build should use responsive `sizes`, explicit image dimensions or stable aspect-ratio containers, and lazy loading below the hero. It should not add large original PNGs to the initial page payload when optimized derivatives are available.

## Shared visual system

The aesthetic is an editorial evidence dossier rather than a card dashboard.

- Continue the portfolio’s near-black full-screen detail surface and existing close/deep-link behavior.
- Use one expressive serif or display treatment for chapter statements and the existing restrained sans-serif language for explanatory copy.
- Use generous vertical pacing, asymmetric evidence layouts, and occasional full-width diagrams.
- Avoid repeated rounded cards, decorative gradients behind every section, excessive badges, and tiny slide thumbnails.
- Keep Care and McDonald’s differentiated through accent color, image rhythm, and project-specific chapter labels—not different navigation or interaction models.
- Respect `prefers-reduced-motion`; motion is limited to subtle section and image reveals already compatible with the portfolio’s Framer Motion setup.

## Interaction and accessibility

- Preserve the existing full-screen dialog semantics, focus management, close control, Escape behavior, browser-Back behavior, and focus restoration.
- Preserve `/work/familysync-jpmorgan` and `/work/mcdonalds-interaction-design` deep links.
- All informative images require specific alt text; decorative treatments use empty alt text.
- Figma source links open in a new tab with safe `rel` attributes.
- Lightboxes must be keyboard operable, have a visible close control, trap focus through the existing dialog approach, and return focus to the triggering image.
- Text and controls must retain WCAG AA contrast and visible focus states.
- Pages must have no horizontal overflow at 390px and must keep dense diagrams inspectable on mobile.

## Data and component boundaries

Shared primitives accept declarative evidence manifests rather than embedding project-specific copy in generic components. Expected primitives include:

- page shell and chapter heading;
- evidence figure with full, crop, and editorial modes;
- research metric or insight strip;
- journey/system figure;
- interaction sequence;
- outcome/reflection block;
- evidence lightbox.

Project components own ordering, copy, accent tokens, and their manifest. Shared primitives own layout, responsive behavior, image mechanics, and accessibility. Existing project JSON remains the source for project-card summaries; bespoke page copy may live beside each page when its richer structure does not fit the generic schema.

## Agent ownership and integration

The primary agent establishes the shared component contract and performs final integration.

- The Care agent edits only the Care component, Care manifest/content, and Care asset directory.
- The McDonald’s agent edits only the McDonald’s component, McDonald’s manifest/content, and McDonald’s asset directory.
- Neither page agent edits `ProjectDetail.tsx`, shared primitives, the other project, or unrelated portfolio code.
- After both implementations, the primary agent integrates routing and resolves only shared-system issues.
- A separate review pass checks story consistency, duplicate handling, crop quality, accessibility, and regressions across both pages.

This ownership prevents parallel agents from overwriting the same files.

## Testing and verification

Behavioral tests are written before production changes and prove:

- the two project IDs dispatch to their bespoke components;
- each page renders its required narrative chapters and canonical artifact set;
- deduplicated artifacts do not appear twice;
- evidence figures expose accurate alt text and exact Figma links;
- crop modes and full-image expansion remain available as specified;
- the existing default renderer still handles other projects.

Final verification includes:

- the repository’s full production build;
- automated desktop and 390px browser passes for both deep links;
- all public evidence assets loading successfully;
- no console, page, or failed-request errors;
- no horizontal overflow;
- close, Escape, Back, lightbox, source-link, and focus-return checks;
- visual inspection of every crop at desktop and mobile sizes;
- confirmation that unrelated dirty worktree changes remain untouched.

## Out of scope

- Publishing, pushing, or changing hosting/DNS configuration.
- Modifying Figma files or source boards.
- Rebuilding unrelated project pages.
- Claiming either concept shipped or reporting unsupported impact metrics.
- Redesigning the Selected Work grid beyond any minimal hero/copy update required to accurately introduce these case studies.
