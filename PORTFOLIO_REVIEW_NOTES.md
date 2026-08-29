# Portfolio review notes

Living capture of feedback from the visual review. These are observations and directions to preserve before implementation; no fixes have been made from this document yet.

## Main page

### Floating GitHub activity tracker — lower left

- The floating GitHub activity tracker needs a more contrasty background. The current treatment does not have enough contrast or visual separation.
- The “100+ commits to build this site” message does not make sense. Replace it with the exact count of commits actually made for the portfolio.
- The “Build activity” framing also does not make sense and should be reconsidered.
- Add a nice, inviting line that directs people to the GitHub history—something in the spirit of “Check out how this was built,” rather than a generic activity label.
- This should ultimately be part of a broader portfolio improvement: GitHub should help explain the portfolio as a collection of projects and how they were built, not feel like an isolated tracker.
- Add a future task to fix and clarify the GitHub instructions across the whole portfolio so that this relationship is coherent.

### Tool marks above the GitHub tracker

- The three marks for Antigravity, Codex, and Claude need refinement.
- Fix the Codex icon.
- Remove the backgrounds/pill boxes around the marks.
- Remove their names/labels.
- Use bigger, polished, inviting standalone icons instead.

### Right-side discipline narrative

- The glassy effect on the page is almost achieved, but it is not fully resolved.
- Apply the glass treatment more successfully to the right-side bubbles that move up and down and show Narrative, Development, Design, Electronics, and related disciplines.
- The treatment should make this part feel consistent with the rest of the page and generally look nicer.

### Right-side motion and project relationship

- The current motion reads as simple vertical scrolling.
- Explore making it feel more like a wheel instead.
- Explore a larger wheel of projects behind, or integrated with, the discipline wheel.
- Keep the visual hierarchy understandable while pursuing this more dimensional composition.

#### Confirmed project-scroller reference

- The intended reference is [Yousuf Developer's Viscose carousel](https://github.com/Yousuf-developer/Viscose-carousel). Use it as the concrete interaction and composition reference for the homepage project scroller.
- “Project wheel” means a large, mostly off-screen ring of substantial project cards, with one project facing front and neighboring projects sweeping past on a tall arc. It does not mean static thumbnail dots placed along decorative curves.
- The visitor should be able to turn the project wheel directly with the mouse wheel or trackpad, pointer drag, and touch swipe. Movement should carry momentum and settle by snapping a project into the front position.
- Clicking an off-center project should rotate it smoothly into the front position; non-selected projects may be visually de-emphasized, but they must remain visible enough to understand the wheel and remain clickable.
- The front project needs to read as a real portfolio preview, not an icon: image, title, and concise identifying metadata should travel with the card and lead into the existing project destination.
- The reference's viscous card-merging, stretching threads, cursor response, and edge refraction are literal requirements, implemented in the portfolio's existing glass-and-cutting-mat language rather than by copying the reference's artwork or fonts.
- Preserve keyboard stepping, reduced-motion behavior, readable DOM content, touch behavior below 500px, and project-opening behavior as explicit acceptance requirements; the reference repository itself identifies those areas as unfinished.

## Review process

- Continue capturing feedback in this document with the original level of detail.
- Do not begin implementation until the review is complete and the fixes are prioritized together.

## Live PRD framework

As the review continues, turn each approved direction into requirements under these headings:

1. **Visitor outcome and intent** — what a recruiter or collaborator should understand or do.
2. **In-scope surfaces** — the specific homepage areas covered by each decision.
3. **Interaction and hierarchy** — especially the relationship between discipline and project wheels.
4. **Visual language** — resolved glass, contrast, icon treatment, and legibility.
5. **GitHub evidence and CTA** — commit-count definition/source and the portfolio-to-project-story relationship.
6. **Experience guardrails** — accessibility, reduced motion, mobile behavior, and performance.
7. **Acceptance criteria and deferred work** — how we decide it is finished and what is intentionally postponed.

### Open design question 1

Resolved on 2026-08-17: remove the discipline controls entirely. The right-side carousel is one canonical, project-only wheel; it does not filter or branch by discipline.

### Decisions we must not silently assume

- What the exact GitHub commit count represents: all repository commits or only portfolio-authored commits; whether it is live or versioned.
- Mobile and reduced-motion behavior.
- Whether the tool icons are attribution-only or link to tool histories.

## View My Profile overlay

- When opening **View My Profile**, the resulting page/overlay feels entirely wrong in its current form.
- The background becomes entirely dimmed out. Preserve the overall glassy visual language here instead of flattening or overly darkening the page behind it.
- The profile surface itself does not carry the glass look successfully; resolve it so it belongs to the same system as the homepage.
- The font feels weak. Strengthen the typography, including its presence, hierarchy, and overall quality.
- Treat this as a creative redesign rather than a minor reskin: understand the desired visual direction and implement something materially better once the requirements are agreed.

## Scroll-state header — top left

- When scrolling down, the header shows the name and “Tangible AI + Product Systems.”
- The name and “Tangible AI + Product Systems” should be left-aligned so that they align with the profile image.
- The small control that currently resembles a notification light should sit to the right of that text, rather than disrupting the alignment.
- Move the profile image down slightly. Its current crop cuts into the hair and should preserve more of it.

## Northwestern Civic Design Institute experience

- Opening the Northwestern Civic Design Institute experience currently omits the JPMorgan and McDonald’s projects.
- Although those projects appear as larger projects lower on the portfolio, they are also relevant to the Northwestern experience and should appear as project boxes within this experience view.
- Clicking into the P&G design project box and then clicking outside currently returns to the main page.
- The expected return path is back to the Northwestern experience, preserving the visitor’s context rather than ejecting them to the main page.

## BTech Civil Engineering — Modular Water Closet System

- Add the user-downloaded images named **bidet design** and **bidet handle design** to the Modular Water Closet System project.
- Treat these as pending asset insertion during the implementation pass; identify the exact downloaded files then and validate their crop, quality, provenance, and placement.

## Prevent avoidable text truncation

- In the main view covering Education, Experience, and other sections, “BTech Civil Engineering + MSc Biological Sciences” is truncated after “Biological” even though there is enough space to show the full title.
- Ensure the full education title is visible.
- Inside the experience/detail views, the project names “Modular Water Closet …” and “Rick Antimicrobial …” are also unnecessarily truncated with ellipses.
- Where available space allows, show the full project names rather than using ellipses. This is a legibility and content-completeness requirement, not merely a typography preference.

## Scrolling consistency

- The transition/scroll behavior from the first page to the second feels different from the transition from the second page to the third.
- Choose one coherent scrolling/transition model and apply it consistently across the portfolio.

## Selected Work — redesign direction

- The current Selected Work pill boxes are missing the design quality and cohesive treatment present elsewhere.
- Reuse or extend the cutting-mat system that generates the first-page background for the third-page/Selected Work surface as well.
- Place the work filters/pills and projects on a proper, legible mat surface so the section reads as intentionally composed rather than as floating controls.
- Remove the current “Selected Work” / “Start with the capability you need to see” introduction.
- The replacement should begin more directly with the visitor’s intent. The user began a replacement direction as “I want to see how …”; final wording remains open rather than being guessed.
- Then show the pills and the full mat containing the projects.

## Sidebar and Writings access

- The sidebar also needs the resolved glass effect so it belongs to the same visual system as the rest of the portfolio.
- Remove the public gateway/entry point to the Writings section for now. Do **not** delete the writings themselves.
- Add a footer in place of the current Writings gateway.
- The interim requirement is intentionally to provide no obvious public route into Writings while retaining the content for later use.

### Acceptance criteria to define

- Sidebar glass treatment is visually consistent with the resolved site-wide glass system.
- A footer replaces the former Writings gateway.
- Writings content remains retained.
- There is no discoverable public Writings entry point during this interim phase.

### Open design question 2

What should the new footer accomplish besides replacing the Writings gateway—for example, identity, contact, GitHub, résumé, or legal information?

### Decisions we must not silently assume

- Footer content and visual prominence.
- Whether internal/direct Writings URLs remain technically reachable, or should be disabled altogether.

### Decision confirmed in review

- Remove Writings from public navigation only. Do not disable direct URLs or delete the content.

## Instagram / TinkerVerse presentation

- The current Instagram-facing presentation is not successfully showing the Instagram work or TinkerVerse story.
- Request an adversarial review using the actual live portfolio and Instagram context, with visual evidence, before proposing a creative fix.
- The eventual redesign must present Instagram substantially better and clarify its relationship to the portfolio; it should not be a superficial reskin.

### Adversarial review — verified findings

- In the inspected live view, a recruiter has no clear visible Instagram presentation or outbound Instagram link. The TinkerVerse card only exposes three very small project thumbnails and “Founder & Creator,” which is insufficient to assess the work.
- TinkerVerse reads as a dim, compressed timeline tile rather than a creative body of work. It is visually subordinate to the cutting-mat hero and gets lost beside Education and Experience.
- The profile overlay’s heavy black scrim and opaque dark panel break the site’s emerging glass language, making the experience feel like a generic modal instead of part of the portfolio system.
- Too many competing focal points—the hero, GitHub widget, skill rail, project orbit, timeline, and fixed sidebar—mean the strongest tangible-work evidence is not surfaced early enough.
- The cutting-mat metaphor is promising, but Instagram/TinkerVerse needs editorial curation: explain why the work matters and present selected artifacts at a readable scale.

### Creative directions considered

1. **Recommended: TinkerVerse Field Notes** — create a dedicated glass-on-mat feature with one large live project image/video, a concise founder thesis, three project cards, and a curated 3×2 grid of Instagram-derived Field Notes. Tag every post to a project, such as “Jarvis / prototype test,” so Instagram becomes portfolio evidence rather than an embedded feed. Include one restrained “Follow the ongoing work” Instagram link.
2. **Workshop Wall** — treat Instagram posts as pinned process artifacts on the cutting mat: photos, tests, sketches, failures, and build notes. A selected artifact opens in a glass inspection panel tied to a portfolio case study. Strong physical-maker character, but requires strict curation to avoid clutter.
3. **Studio Broadcast** — one large vertical reel-like panel with a small curated strip of recent posts and an explicit work-in-progress label. More polished and editorial, but less useful for browsing breadth.

### Open design question 3

Should Instagram represent a live, informal workshop journal, or a tightly curated proof layer for the strongest portfolio projects?

### Direction selected in review

- **Live workshop journal** is the preferred direction.
- Use real images prominently. The journal should not be text-only, an empty shell, or a generic feed embed.
- Proposed image treatment: one large lead image or video from the active build, followed by a small curated image grid of recent process artifacts. Each artifact should have a short human caption and, where relevant, a project tag that leads to its portfolio story.
- This keeps the informal, ongoing feeling of Instagram while still making the images useful evidence of tangible work.
- Source the imagery automatically from Instagram whenever feasible. Instagram is the preferred source over a manually maintained portfolio-image gallery.

### Decisions confirmed in review

- Keep the project wheel’s current behavior. Other/non-selected projects may be visually hidden, grayed out, or darkened, but must remain clickable.
- Automatic public Instagram sourcing is confirmed as the preferred image-data path.

### Open implementation decision 1

Should Instagram sourcing be limited to publicly available Instagram data, with a curated local fallback only when automatic access is unavailable?

## Footer — author statement

- The footer should include a humble, brief statement that this portfolio was made with AI and is also an experiment in combining AI with the user’s own skills.
- It should explicitly avoid presenting the site as a definitive measure of either the user’s design skill or AI skill; it is a mix and an ongoing test.
- Keep this line short rather than turning it into a long disclaimer.
- This is the footer’s intended content for now; do not add extra links or sections unless requested later.
