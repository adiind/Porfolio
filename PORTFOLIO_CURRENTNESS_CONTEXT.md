# Portfolio Currentness — Product and Content Context

**Status:** Approved planning context; no product implementation yet
**Prepared:** 2026-07-20
**Primary goal:** Make the portfolio visibly current and recruiter-first without diluting the existing “I make AI tangible” positioning.

## The request

The public portfolio must show that Adi’s work continued beyond the Northwestern program end date currently shown in the timeline. Add three current 2026 signals:

1. Self AI product management internship
2. Camp EDI 2026 leadership
3. Bambu Lab student ambassadorship
4. An updated 2026 résumé

The experience view must also rebalance its hierarchy:

- On mobile, professional experience must appear before education and TinkerVerse.
- On desktop, TinkerVerse must support the professional narrative, not compete with it as an equal third of the screen.

## Why this matters

The portfolio’s design is memorable and its current lead statement is strong: **“I make AI tangible.”** But the public chronology stops at:

- **MS Engineering Design Innovation, Northwestern:** August 2025–March 2026
- **Senior Product Analyst, Zomato:** October 2024–July 2025

That creates an avoidable “what happened next?” gap for a recruiter visiting after March 2026. The linked résumé is also still named `Adi_Agarwal_Resume_2025.pdf`.

The visual review also found a hierarchy mismatch:

- The desktop experience view allocates equal lanes to **Education**, **Experience**, and **TinkerVerse**.
- The mobile experience view introduces the large TinkerVerse card before formal education and employment.

This makes the portfolio feel inventive, but it weakens the immediate professional signal just when the visitor is trying to understand current role, trajectory, and credibility.

## Current implementation facts

| Surface | Current behavior | Source |
| --- | --- | --- |
| Timeline content | The newest structured role is Northwestern, ending 2026-03-31; Zomato ends 2025-07-31. | `data/timeline.ts` |
| Timeline range | `CONFIG.endDate` is `2026-03-31`, so the visual rail itself stops in March 2026. | `constants.ts` |
| Desktop experience view | Three equal grid columns: Education, Experience, TinkerVerse. | `App.tsx` |
| Mobile experience view | TinkerVerse is rendered above the education and career groups. | `components/MobileTimeline.tsx` |
| Résumé link | The profile modal links to `public/Adi_Agarwal_Resume_2025.pdf`. | `constants.ts`, `public/` |
| Navigation | Profile, Experiences, Projects, and conditionally Writings are already keyboard-operable. | `components/VerticalNavbar.tsx` |

## Product decision

The page should communicate the following sequence in one fast scan:

```text
Current role and direction
        ↓
Recent professional experience
        ↓
Education and design training
        ↓
TinkerVerse / community making as supporting proof
```

This is a hierarchy change, not a retreat from the site’s personality. Keep TinkerVerse as evidence of hands-on making, public curiosity, and physical-computing range; reduce its priority only in the career-reading path.

## Content model: source-of-truth requirements

Do **not** invent dates, job scope, affiliations, metrics, company claims, awards, photos, or outcomes. Before implementation, collect and confirm every field marked **Required** below.

### 1. Self AI product management internship

| Field | Requirement |
| --- | --- |
| Official organization name | **Required** — confirm exact capitalization and whether “Self AI” is the public name. |
| Official title | **Required** — use the exact internship title. |
| Start and end dates | **Required** — use month/year; use `Present` only if accurate. |
| Location / work arrangement | Optional; include only if useful and public. |
| One-line headline | **Required** — plain-language statement of product scope. |
| Summary | **Required** — 1–2 factual sentences describing the work. |
| Evidence bullets | **Required** — 3–5 actions or outcomes, each defensible in an interview. |
| Skills | Optional — only skills directly demonstrated by the work. |
| Logo or image | Optional — local, licensed, or company-approved only. |
| Confidentiality | **Required** — explicitly mark what cannot be described publicly. |

### 2. Camp EDI 2026 leadership

| Field | Requirement |
| --- | --- |
| Official program name | **Required** — confirm “Camp EDI” naming and sponsoring organization. |
| Official leadership title | **Required**. |
| Date range | **Required**. |
| Audience / program scope | **Required** — who the program served and what the leadership involved. |
| Evidence bullets | **Required** — facilitation, mentoring, curriculum, operations, or team leadership as applicable. |
| Metrics | Optional — participant or session counts only when verified. |
| Image | Optional — use an approved program image or no image. |

### 3. Bambu Lab student ambassadorship

| Field | Requirement |
| --- | --- |
| Official program/title | **Required** — confirm exact public title and whether the relationship is active. |
| Date range | **Required**. |
| Public responsibilities | **Required** — describe only work that can be publicly attributed. |
| Evidence bullets | **Required** — workshops, prototypes, community work, testing, or educational content as applicable. |
| Disclosure | **Required** — clarify any product, compensation, or partnership disclosure needed for public presentation. |
| Images | Optional — prefer Adi’s own prototype/process photos with explicit permission. |

### 4. Updated résumé

| Field | Requirement |
| --- | --- |
| Authoritative PDF | **Required** — user-supplied, final, fact-checked PDF. |
| Target filename | Recommended: `public/Adi_Agarwal_Resume_2026.pdf`. |
| Content parity | Include the same current roles, dates, titles, and claims used on the site. |
| Link target | Update the shared résumé link rather than adding a second public résumé link. |

## Information architecture specification

### Desktop (≥768px)

**Recommended order and weight**

1. **Current / professional experience — primary**
   - Put Self AI first if it is current and public.
   - Follow with the most relevant recent roles, then Zomato and prior experience.
   - Give this lane the greatest visual width or visual priority.

2. **Education — secondary**
   - Northwestern remains near the top as context for the current work.
   - Earlier education remains available but does not visually outrank recent professional experience.

3. **TinkerVerse — supporting**
   - Keep it discoverable as an “Independent making / community work” module.
   - Reduce the oversized feature-card treatment or move it below the primary grid.
   - Do not remove it; it supports the tangible-AI story.

### Mobile (<768px)

Render grouped content in this order:

1. Current professional experience: Self AI, Bambu Lab where appropriate, then recent roles.
2. Education: Northwestern and prior education.
3. Leadership / community: Camp EDI when it is not presented as professional work; otherwise it can sit in the current professional group with a clear leadership label.
4. TinkerVerse: after the formal narrative as a compact entry point.

The mobile top navigation and existing accessibility patterns remain; the change is content order and visual hierarchy, not a new navigation paradigm.

## Visual direction

- Preserve the black, glass, indigo, rose, amber visual language already used in the timeline.
- Make current professional entries easiest to recognize through order, heading, and readable metadata—not exaggerated animation.
- Use a neutral or professional color treatment for employment and leadership entries. Reserve the amber TinkerVerse treatment for the supporting maker/community module.
- Keep the newest role card’s one-line headline and date range legible at a glance on a 390px viewport.
- Avoid increasing the density of tiny all-caps labels; the experience view already uses many small labels.
- Do not allow a current logo, badge, or image to imply endorsement or employment details that have not been confirmed.

## Scope boundaries

### In scope

- Timeline data for the three current signals
- Timeline range extension beyond March 2026
- Desktop and mobile ordering / layout weighting
- Resume asset and link update
- Copy, images, and accessible labels directly related to these entries
- Regression verification of navigation, dialogs, scrolling, and reflow

### Out of scope for this change

- Rebuilding the hero
- Recurating Selected Work
- Rewriting existing case studies
- Building shareable project URLs
- Portfolio Studio architecture
- Broad Tailwind, bundle-size, or image-optimization work

Those are valid follow-up priorities, but separating them keeps this release focused on freshness and professional comprehension.

## Existing quality requirements to preserve

- Keyboard access for timeline cards and desktop/mobile navigation
- Dialog focus trap, Escape close, and focus restoration
- Reduced-motion support
- No meaningful contrast regressions
- No horizontal overflow at 390px, 640px, 768px, or 1440px
- No public claim that cannot be defended with the supplied source material

## Completion definition

This work is complete only when:

1. The current public timeline visibly extends beyond March 2026.
2. Self AI, Camp EDI, and Bambu Lab appear with fact-checked titles, dates, and scope.
3. Mobile visitors encounter current professional work before TinkerVerse.
4. Desktop visitors can understand current professional work without reading across an equal-weight TinkerVerse lane.
5. The profile résumé action downloads or opens the authoritative 2026 PDF.
6. All updated content is consistent across timeline, profile, and résumé.
7. Production build and desktop/mobile regression checks pass.
