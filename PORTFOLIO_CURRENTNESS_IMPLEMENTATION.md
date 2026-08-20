# Portfolio Currentness — Implementation Brief

Use this document with `PORTFOLIO_CURRENTNESS_CONTEXT.md`. It converts the approved currentness direction into an implementation sequence without assuming unverified role details.

## Objective

Update the portfolio’s timeline and résumé so a recruiter can immediately identify Adi’s current 2026 work, while preserving the existing tangible-AI visual language and accessibility behavior.

## Required inputs before coding

Implementation is blocked only on factual content, not design decisions. Obtain one fact sheet for each item:

- **Self AI product management internship:** official company name, exact title, dates, public scope, 3–5 defensible bullets, public image/logo permission, confidentiality boundaries.
- **Camp EDI 2026 leadership:** official program/title, dates, audience/scope, responsibilities, 3–5 defensible bullets, image permission if used.
- **Bambu Lab student ambassadorship:** official title/program, dates, publicly attributable responsibilities, disclosure language, 3–5 defensible bullets, image permission if used.
- **Résumé:** final fact-checked 2026 PDF.

If a detail is unavailable, omit it. Do not write placeholder achievements into the public UI.

## Implementation sequence

### 1. Normalize the source content

Update `data/timeline.ts` with new, clearly typed timeline entries.

- Use stable IDs such as `self-ai`, `camp-edi-2026`, and `bambu-lab-ambassador`.
- Use exact month-level dates in the same ISO format as the current entries.
- Set an accurate `end: "Present"` only when the role is active.
- Use `headline`, `summary`, `bullets`, `skills`, and optional images consistently with the existing timeline contract.
- Write descriptions in plain first person only when the surrounding timeline pattern supports it; otherwise retain the current concise third-person role format.
- Keep confidential work at a truthful level of abstraction.

Extend `CONFIG.endDate` in `constants.ts` to the furthest verified current or planned public date. Never extend it with a guessed date.

### 2. Rebalance desktop experience hierarchy

Update the desktop grouping in `App.tsx`.

Target behavior:

- A current/recent professional group is the most prominent lane.
- Education is clearly secondary.
- TinkerVerse is a supporting module, not an equal third of the professional grid.

Preferred implementation approaches, in order:

1. Use a two-column primary grid: professional experience wide, education narrower; place TinkerVerse below as a full-width supporting module.
2. If retaining three columns, make professional experience visually dominant and compact TinkerVerse substantially.

Do not duplicate a new role across multiple groups unless the duplication has a clear user-facing purpose.

### 3. Reorder mobile content

Update `components/MobileTimeline.tsx`.

Target order:

1. Current/recent professional work
2. Education
3. Leadership/community where it best fits the truth of the role
4. TinkerVerse

The large TinkerVerse card must no longer be the first content a user sees after opening Experiences.

Use the existing card component and keyboard patterns. Preserve section headings and accessible card names when reordering.

### 4. Replace the résumé asset and shared link

After receiving the authoritative PDF:

1. Add it as `public/Adi_Agarwal_Resume_2026.pdf`.
2. Update `SOCIAL_LINKS.resume` in `constants.ts`.
3. Confirm the profile modal points to the shared constant rather than a hard-coded file.
4. Verify the old 2025 PDF is no longer linked publicly. Do not delete it unless explicitly requested; retaining it is a safe rollback.

### 5. Review visual copy and media

- Add local imagery only when it is authentic, approved, and supports the role.
- Use logos sparingly; a role card should still communicate clearly when no logo is available.
- Ensure date chips, company names, and role titles remain readable at 390px.
- Ensure “student ambassador” and “leadership” language is specific enough not to imply employment, sponsorship, or ownership beyond the confirmed relationship.

## Expected file touchpoints

| File | Expected change |
| --- | --- |
| `data/timeline.ts` | New current role/leadership entries and confirmed copy/media references. |
| `constants.ts` | Extend timeline end date and point the shared résumé link at the new PDF. |
| `App.tsx` | Desktop grouping and visual weighting of professional experience, education, and TinkerVerse. |
| `components/MobileTimeline.tsx` | Mobile group order: professional work before education and TinkerVerse. |
| `public/Adi_Agarwal_Resume_2026.pdf` | Authoritative user-supplied résumé asset. |
| `AGENTS.md` | One-line Codex session record after implementation and verification. |

No other files should change unless the chosen layout requires a narrowly scoped supporting component edit.

## Acceptance criteria

### Content

- [ ] Self AI, Camp EDI, and Bambu Lab are present only with approved factual details.
- [ ] Timeline date range extends beyond 2026-03-31 using a verified value.
- [ ] New dates/titles/claims match the final 2026 résumé exactly.
- [ ] No logo, image, label, or copy implies an unconfirmed relationship.

### Desktop, 1440px-wide viewport

- [ ] Professional experience is visually dominant at first view of the experience section.
- [ ] Education remains easy to find.
- [ ] TinkerVerse is visible but no longer competes with the career narrative.
- [ ] Current role cards can be opened and closed with mouse, keyboard, Escape, and browser Back as applicable.

### Mobile, 390px-wide viewport

- [ ] Current professional work appears before TinkerVerse.
- [ ] Employment and leadership cards are readable without tiny, overloaded metadata.
- [ ] Top navigation remains usable and does not obscure content.
- [ ] No horizontal overflow exists.

### Technical regression

- [ ] `npm run build` succeeds.
- [ ] Production preview loads with no page errors, console errors, failed local assets, or broken images.
- [ ] Timeline cards remain keyboard-operable.
- [ ] Dialog focus management, Escape close, focus return, and reduced-motion support continue to work.
- [ ] Existing Selected Work, Glyph, profile, and writings flows still open and close correctly.

## Suggested verification route

1. Load the homepage at 1440×900 and 390×844.
2. Dismiss the intro with keyboard and pointer/touch paths.
3. Open Experiences from both desktop and mobile navigation.
4. Confirm the new current role is first in the professional reading path.
5. Open each new entry, then close it with Escape and browser Back.
6. Open the Profile dialog and confirm the résumé link resolves to the new 2026 asset.
7. Check images, overflow, console errors, and asset failures.

## Explicit non-goals

- Do not redesign the homepage hero in this change.
- Do not add the new roles to Selected Work unless a separate, evidence-backed case study is approved.
- Do not turn ambassador or leadership positions into project case studies without real project evidence.
- Do not rewrite Glyph, Zero, FamilySync, or the accessibility system.
- Do not remove the previous résumé PDF without explicit approval.

## Handoff note

When the role fact sheets and final PDF arrive, this brief is sufficient to implement the entire currentness pass without another portfolio discovery cycle.
