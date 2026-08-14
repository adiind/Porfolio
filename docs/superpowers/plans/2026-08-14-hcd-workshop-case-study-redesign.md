# HCD Workshop Case Studies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public FamilySync and Squad Up pages as concise, story-led HCD case studies that feel native to Adi’s cutting-mat workshop portfolio and expose no Figma or evidence-verification interface.

**Architecture:** Replace the seven-chapter evidence contract with a five-section visual-story contract, then rebuild the shared HCD shell around an HCD-scoped mat surface, warm paper sheets, grouped visuals, and semantic post-its. Keep provenance in the private selector and asset manifests, preserve the existing full-size body portal and accessibility/history behavior, and update static plus Playwright verification to enforce the public-language boundary.

**Tech Stack:** React 19, TypeScript, Tailwind CSS utility classes, Framer Motion, Lucide React, JSON story data, Node verification scripts, Playwright production smoke tests, Vite.

## Global Constraints

- Public HCD routes must render no Figma links, Figma file names, slide numbers, node identifiers, source labels, or visitor-facing “evidence,” “boundary,” “artifact,” “verification,” “proof,” or “provenance” language.
- Use exactly five story sections: `situation`, `learning`, `idea`, `mechanics`, and `reflection`; visible headings are project-specific.
- FamilySync renders nine unique visuals; Squad Up renders eighteen unique visuals; the hero renders once and is not duplicated in a section.
- Keep genuine source-derived research only. Do not invent quotes, findings, outcomes, usability results, adoption, feasibility, or business impact.
- Keep the existing deep-green cutting-mat/workshop language; do not introduce an unrelated magazine, brand-site, or design-system aesthetic.
- Post-its are limited to genuine insights/reframes, use established portfolio typography, remain DOM text, and move into normal flow on mobile.
- Remove numbered chapter navigation, the hero jump control, square bullets, and square/hard-rectangular controls.
- Preserve the body-portaled full-size viewer, two-axis panning, 44-pixel controls, focus trap, Escape behavior, browser-Back behavior, focus return, reduced motion, and body-overflow restoration.
- The only public relationship clarification is one quiet bottom sentence per project, copied exactly from the approved spec.
- Preserve `components/ProjectDetail.tsx` routing, Glyph behavior, the default renderer, the private selector, source PNGs, asset manifests, and all unrelated dirty-worktree changes.
- Do not publish, push, or absorb concurrent work in `AGENTS.md`, `App.tsx`, shared UI files, timeline files, or untracked portfolio-redesign assets.

## File structure

- Modify `components/hcd/types.ts`: define the visitor-oriented visual-story contract.
- Create `components/hcd/HcdWorkshopSurface.tsx`: render the scoped cutting-mat frame and decorative ruler/grid layers.
- Create `components/hcd/PostItNote.tsx`: render accessible, realistic insight notes with constrained tone and rotation.
- Modify `components/hcd/HcdCaseStudy.tsx`: render five paper-sheet sections, grouped visuals, post-its, and the renamed full-size viewer.
- Modify `data/hcd/familysync-story.json`: concise FamilySync story, grouping, notes, and quiet context sentence.
- Modify `data/hcd/mcdonalds-story.json`: concise Squad Up story, grouping, notes, and quiet context sentence.
- Modify `scripts/verify-hcd-case-studies.mjs`: enforce the five-section contract, visual counts, approved note content, and public-language bans.
- Modify `scripts/smoke-hcd-case-studies.cjs`: verify the redesigned DOM, copy boundary, visuals, post-its, controls, responsive behavior, and regressions.
- Modify `AGENTS.md` only at final root handoff: add one newest-first `## Codex` line without staging or committing unrelated concurrent changes.

---

### Task 1: Lock the visual-story contract and static verifier

**Files:**
- Modify: `components/hcd/types.ts`
- Modify: `scripts/verify-hcd-case-studies.mjs`

**Interfaces:**
- Produces: `HcdVisual`, `HcdPostIt`, `HcdVisualGroup`, `HcdStorySection`, and `HcdProjectStory`.
- Produces: five project section keys and exact public-language/static-data invariants consumed by Tasks 2–5.

- [ ] **Step 1: Rewrite the verifier first so the current implementation fails for the intended reasons**

Replace the seven-chapter/evidence assertions with these invariants:

```js
const allowedSectionKeys = ['situation', 'learning', 'idea', 'mechanics', 'reflection'];

const expectedHeadings = {
  care: [
    'Care coordination is work',
    'The family is the system',
    'Three principles shaped the idea',
    'Designing the handoff',
    'What I took forward',
  ],
  mcdonalds: [
    'The order starts before checkout',
    'One person becomes the coordinator',
    'One order, individual agency',
    'From invite to pickup',
    'What I took forward',
  ],
};

const approvedNotes = {
  care: [
    'Care coordination expands when attention is already scarce.',
    'Proactive help still needs clear permission.',
    'Trust does not erase privacy boundaries.',
  ],
  mcdonalds: [
    'The order is part of the hangout, not a separate task.',
    'One person coordinates the food, or everyone coordinates payment.',
    'Group visibility and payment clarity have to improve together.',
  ],
};

const forbiddenPublicPatterns = [
  /figma\.com/i,
  /view source/i,
  /slide\s*\d+/i,
  /\bevidence\b/i,
  /\bboundary\b/i,
  /\bprovenance\b/i,
  /\bverification\b/i,
];
```

Require `story.sections` to contain the five keys once and in order. Flatten visual IDs from `story.hero` plus `section.groups[].visuals`; require the existing canonical Care and McDonald’s sets with no duplicates. Require each post-it `text` to appear in the relevant `approvedNotes` list, tone to be allowed by the project palette, and numeric rotation to be between -2 and 2. Require every public caption to contain 8–20 whitespace-separated words. Keep asset existence and `/images/hcd/` confinement checks.

Update shared file markers to require `HcdVisual`, `HcdPostIt`, `data-hcd-workshop-surface`, `data-hcd-post-it`, `data-hcd-visual-id`, `View larger`, `Fit to screen`, the body portal, full-size panning, and body-overflow restoration. Forbid `HcdEvidence`, `EvidenceFigure`, `data-evidence`, `Read the evidence`, `View source in Figma`, `ArrowUpRight`, numbered chapter navigation, and `sourceUrl`/`sourceLabel` use in the public renderer.

- [ ] **Step 2: Run the new verifier and confirm RED**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs all
```

Expected: exit 1 naming the old `HcdEvidence` contract, missing `HcdVisual`/workshop/post-it markers, seven old chapters, public Figma/source fields, and forbidden public language.

- [ ] **Step 3: Replace the TypeScript contract**

Replace `components/hcd/types.ts` with this contract:

```ts
export type HcdAccent = 'care' | 'mcdonalds';
export type HcdTreatment = 'full' | 'focus' | 'editorial';
export type HcdSectionKey = 'situation' | 'learning' | 'idea' | 'mechanics' | 'reflection';
export type HcdVisualLayout = 'single' | 'pair' | 'sequence' | 'wide';
export type HcdPostItTone = 'yellow' | 'blue' | 'green' | 'cream' | 'red';

export interface HcdVisual {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
  caption: string;
  treatment: HcdTreatment;
  aspect?: string;
  objectPosition?: string;
}

export interface HcdPostIt {
  id: string;
  text: string;
  tone: HcdPostItTone;
  rotation: number;
}

export interface HcdVisualGroup {
  id: string;
  title?: string;
  layout: HcdVisualLayout;
  visuals: HcdVisual[];
}

export interface HcdStorySection {
  key: HcdSectionKey;
  title: string;
  intro: string;
  notes?: HcdPostIt[];
  takeaways?: string[];
  groups: HcdVisualGroup[];
}

export interface HcdProjectStory {
  projectId: 'familysync-jpmorgan' | 'mcdonalds-interaction-design';
  accent: HcdAccent;
  label: string;
  title: string;
  proposition: string;
  context: string;
  role: string;
  hero: HcdVisual;
  metrics?: Array<{ value: string; label: string }>;
  sections: HcdStorySection[];
  closingContext: string;
}
```

- [ ] **Step 4: Run the shared verifier and TypeScript syntax checks**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs shared
npx esbuild components/hcd/types.ts --bundle --platform=browser --format=esm --outfile=/tmp/hcd-types-redesign.mjs
```

Expected: shared mode remains RED only for missing Task 2 component markers; TypeScript bundles successfully.

- [ ] **Step 5: Commit only the contract and verifier**

```bash
git add components/hcd/types.ts scripts/verify-hcd-case-studies.mjs
git diff --cached --check -- components/hcd/types.ts scripts/verify-hcd-case-studies.mjs
git commit -m "Define workshop HCD story contract"
```

---

### Task 2: Rebuild the shared HCD shell as a workshop project board

**Files:**
- Create: `components/hcd/HcdWorkshopSurface.tsx`
- Create: `components/hcd/PostItNote.tsx`
- Modify: `components/hcd/HcdCaseStudy.tsx`

**Interfaces:**
- Consumes: `HcdVisual`, `HcdPostIt`, `HcdVisualGroup`, and `HcdProjectStory` from Task 1.
- Produces: `HcdCaseStudyShell({ story, onClose })` with mat surface, paper sheets, grouped visuals, post-its, and a body-portaled full-size viewer.

- [ ] **Step 1: Create the HCD-scoped cutting-mat surface**

Create `HcdWorkshopSurface.tsx` with a single responsibility: render the mat frame and pass through children.

```tsx
import React from 'react';

export const HcdWorkshopSurface: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div data-hcd-workshop-surface className="hcd-workshop-surface relative min-h-full overflow-hidden">
    <div aria-hidden="true" className="hcd-mat-grid absolute inset-0" />
    <div aria-hidden="true" className="hcd-mat-frame absolute inset-3 rounded-[1.6rem] sm:inset-5 sm:rounded-[2rem]" />
    <div aria-hidden="true" className="hcd-mat-label absolute bottom-7 left-8 hidden font-mono text-[8px] font-bold tracking-[0.24em] sm:block">
      ADI AGARWAL / WORKSHOP GRID
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);
```

The shared shell’s scoped `<style>` defines:

```css
.hcd-workshop-surface {
  background: radial-gradient(circle at 34% 12%, rgba(255,255,212,.12), transparent 36%),
              linear-gradient(145deg, #064a3c, #00332a 46%, #01241f);
  box-shadow: inset 0 -36px 70px rgba(0,0,0,.34), inset 0 1px 0 rgba(245,255,178,.18);
}
.hcd-mat-grid {
  opacity: .58;
  background-image:
    linear-gradient(rgba(229,229,90,.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(229,229,90,.15) 1px, transparent 1px),
    linear-gradient(rgba(229,229,90,.28) 1px, transparent 1px),
    linear-gradient(90deg, rgba(229,229,90,.28) 1px, transparent 1px);
  background-size: 22px 22px, 22px 22px, 110px 110px, 110px 110px;
}
.hcd-mat-frame { border: 1px solid rgba(229,229,90,.32); box-shadow: inset 0 0 0 16px rgba(0,0,0,.08); }
.hcd-mat-label { color: rgba(237,241,116,.58); }
```

Do not import or edit the concurrent untracked `components/ui/CuttingMatSurface.tsx`.

- [ ] **Step 2: Create the semantic post-it primitive**

Create `PostItNote.tsx`:

```tsx
import React from 'react';
import { HcdPostIt } from './types';

const toneClass: Record<HcdPostIt['tone'], string> = {
  yellow: 'bg-[#f6e68b] text-[#292510]',
  blue: 'bg-[#b9dced] text-[#14252d]',
  green: 'bg-[#bdd9b2] text-[#142516]',
  cream: 'bg-[#f2dfbd] text-[#2c2114]',
  red: 'bg-[#efa7a0] text-[#351411]',
};

export const PostItNote: React.FC<{ note: HcdPostIt }> = ({ note }) => (
  <aside
    data-hcd-post-it={note.id}
    className={`hcd-post-it relative min-h-36 p-5 text-[15px] font-semibold leading-snug shadow-[0_12px_24px_rgba(24,20,10,0.22)] ${toneClass[note.tone]}`}
    style={{ transform: `rotate(${note.rotation}deg)` }}
  >
    <span className="relative z-10">{note.text}</span>
  </aside>
);
```

Use a scoped `::after` gradient for the lifted lower edge, mark that pseudo-decoration via CSS only, and reset transform to `none` below 640px and under reduced motion.

- [ ] **Step 3: Replace `EvidenceFigure` with a visitor-oriented `ProjectVisual`**

In `HcdCaseStudy.tsx`:

- Remove `ArrowDown`, `ArrowUpRight`, chapter scrolling, source links, source labels, and every evidence-named identifier.
- Import `HcdWorkshopSurface`, `PostItNote`, `HcdVisual`, and `HcdProjectStory`.
- Render `<figure data-hcd-visual-id={visual.id}>`.
- Use a rounded full-width trigger with `aria-label={`View ${visual.alt} larger`}` and a soft pill reading `View larger`.
- Render only the one-line caption in `<figcaption>`.
- Keep full/focus object-fit behavior and eager-load only the hero.

The public figure must have this interaction signature:

```tsx
<button
  type="button"
  data-hcd-visual-trigger={visual.id}
  onClick={(event) => onOpen(visual, event.currentTarget)}
  aria-label={`View ${visual.alt} larger`}
>
  <img src={visual.src} alt={visual.alt} />
  <span className="rounded-full bg-[#f6f0e2]/95 px-4 py-2 text-xs font-semibold text-[#17231d] shadow-lg">
    View larger
  </span>
</button>
```

- [ ] **Step 4: Recompose the page as mat plus paper sheets**

Wrap the scroll content in `HcdWorkshopSurface`. Use a centered `max-w-[1500px]` stack with `px-3 py-3 sm:px-6 sm:py-6` so the mat remains visible.

Hero requirements:

- one large warm-paper sheet;
- label, title, proposition, concise context, and `Role` only;
- no `Boundary`, status, numbered nav, or hero jump control;
- hero visual appears as a print within the same sheet;
- modest paper radius (`rounded-[1.25rem]`) and tactile shadow;
- no full-viewport dark editorial split.

Section requirements:

```tsx
{story.sections.map((section, sectionIndex) => (
  <section
    key={section.key}
    data-hcd-section={section.key}
    className="hcd-paper-sheet relative my-5 rounded-[1.25rem] bg-[#f4eedf] px-5 py-10 text-[#18231e] shadow-[0_22px_58px_rgba(0,0,0,0.28)] sm:px-9 md:my-8 md:px-12 md:py-16"
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#496057]">{sectionIndex + 1} of 5</p>
    <h3>{section.title}</h3>
    <p>{section.intro}</p>
    {section.notes?.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">...</div> : null}
    {section.groups.map(group => <VisualGroup key={group.id} group={group} />)}
  </section>
))}
```

The `1 of 5` line is reading progress, not a button or navigation control. Use group-specific layouts so Squad Up can present journeys as a pair, entry points as a sequence, system diagrams as a pair, and final interaction screens as a sequence.

Render `story.closingContext` once below the final section in a quiet mat-side footer. Do not render the old outcome/limitation/reflection triptych.

- [ ] **Step 5: Rename and preserve the full-size viewer**

Keep the current document-body portal, z-index 20000, focus cycle, Escape interception, focus return, scroll reset, and body-overflow lock. Rename state and refs from evidence to visual. Public labels become:

```tsx
aria-label={`Full view: ${activeVisual.alt}`}
aria-label={isLightboxFullSize ? 'Fit image to screen' : 'View image at full size'}
```

The top control reads `Full size`/`Fit`, the viewport live text reads `Full size · scroll in any direction`/`Fit to screen`, and the bottom contains only the visual caption. There is no source link or source label.

- [ ] **Step 6: Run shared verification and build the shell in isolation**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs shared
npx esbuild components/hcd/HcdCaseStudy.tsx --bundle --platform=browser --format=esm --external:react --external:react-dom --external:framer-motion --external:lucide-react --outfile=/tmp/hcd-workshop-shell.mjs
```

Expected: both exit 0. Care and McDonald’s modes remain RED until their story files move to the new contract.

- [ ] **Step 7: Commit only the shared visual system**

```bash
git add components/hcd/HcdWorkshopSurface.tsx components/hcd/PostItNote.tsx components/hcd/HcdCaseStudy.tsx
git diff --cached --check -- components/hcd/HcdWorkshopSurface.tsx components/hcd/PostItNote.tsx components/hcd/HcdCaseStudy.tsx
git commit -m "Rebuild HCD pages as workshop stories"
```

---

### Task 3: Rewrite and regroup the FamilySync story

**Files:**
- Modify: `data/hcd/familysync-story.json`

**Interfaces:**
- Consumes: Task 1 `HcdProjectStory` contract and Task 2 grouped-visual renderer.
- Produces: five FamilySync sections, three approved notes, nine unique visuals, and one quiet context sentence.

- [ ] **Step 1: Convert the top-level FamilySync data**

Use these exact public strings:

```json
{
  "projectId": "familysync-jpmorgan",
  "accent": "care",
  "label": "Northwestern EDI · Team project",
  "title": "FamilySync",
  "proposition": "A family-care service concept that coordinates urgent handoffs without hiding consent or responsibility.",
  "context": "When a child needs help, care is only part of the work. Families also juggle calendars, permissions, pickup, medical context, and constant updates.",
  "role": "Service design · Research synthesis · Agentic interaction design",
  "closingContext": "Student team project created at Northwestern EDI with JPMorgan Chase as project partner; not a shipped product."
}
```

Keep `care-visibility-presence` as the hero. Remove its `sourceUrl` and `sourceLabel`. Rewrite its caption to 8–20 words:

```json
"Automatic handoff updates keep absent caregivers connected without taking control from the person providing care."
```

- [ ] **Step 2: Build the five FamilySync sections with this exact visual mapping**

| Key | Heading | Visual groups |
| --- | --- | --- |
| `situation` | Care coordination is work | `care-crisis-journey` as one `single` group |
| `learning` | The family is the system | `care-stakeholders` + `care-trust-takeaways` as one `pair` group |
| `idea` | Three principles shaped the idea | `care-familysync-intro` + `care-three-pillars` as one `pair` group |
| `mechanics` | Designing the handoff | `care-schedule-management` as `wide`; `care-clinical-guardian-flow` as `wide`; `care-escalation-flow` as `single` |
| `reflection` | What I took forward | no visual groups |

Use these exact section introductions:

```json
[
  "When a child gets sick at school, a parent is not solving one problem. Work, pickup, food, medical decisions, and family communication all arrive at once. We focused on the invisible coordination layer that becomes hardest when attention is already stretched.",
  "Care does not belong to one user. Parents, nearby relatives, schools, and clinicians hold different information and different authority. The concept had to make those roles visible without turning support into surveillance.",
  "We organized the concept around three responsibilities: coordinate the work, communicate what is happening, and preserve the human connection behind the logistics.",
  "The service is built around explicit handoffs. It checks availability, escalates through trusted caregivers, carries the right context forward, and shows the primary caregiver where they can step in.",
  "FamilySync changed how I think about agentic services. The useful part is not invisible automation; it is making intent, permission, uncertainty, and escalation understandable at the moment someone needs to trust or interrupt the system."
]
```

- [ ] **Step 3: Add only the three approved FamilySync post-its**

Place all three in the `learning` section:

```json
"notes": [
  { "id": "care-note-attention", "text": "Care coordination expands when attention is already scarce.", "tone": "yellow", "rotation": -1.2 },
  { "id": "care-note-permission", "text": "Proactive help still needs clear permission.", "tone": "blue", "rotation": 0.8 },
  { "id": "care-note-trust", "text": "Trust does not erase privacy boundaries.", "tone": "green", "rotation": -0.5 }
]
```

Remove every source/provenance field. Use these exact captions and omit `takeaways` from every FamilySync section; the introductions, notes, and captions carry the story without square bullet lists:

| Visual ID | Caption |
| --- | --- |
| `care-crisis-journey` | Work, pickup, food, medical decisions, and family updates collide in the same urgent moment. |
| `care-stakeholders` | Three family roles reveal how responsibility and information move across the care network. |
| `care-trust-takeaways` | The research reframed proactive support around permission, privacy, and visible human control. |
| `care-familysync-intro` | FamilySync gives the coordinated care service one calm, recognizable identity. |
| `care-three-pillars` | Coordination, communication, and connection became the three responsibilities guiding the concept. |
| `care-schedule-management` | The pickup journey shows availability checks, escalation, confirmation, updates, and recap as one handoff. |
| `care-clinical-guardian-flow` | The clinical journey carries permissions, missing context, and milestone updates across temporary guardianship. |
| `care-escalation-flow` | Caregivers can see who is being contacted, why, and when to step in. |

- [ ] **Step 4: Run Care verification and inspect JSON**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs care
node -e "const s=require('./data/hcd/familysync-story.json'); const v=[s.hero,...s.sections.flatMap(x=>x.groups.flatMap(g=>g.visuals))]; console.log(s.sections.map(x=>x.title)); console.log(v.length,new Set(v.map(x=>x.id)).size);"
```

Expected: verifier passes; headings match the five approved headings; counts print `9 9`.

- [ ] **Step 5: Commit only the FamilySync story**

```bash
git add data/hcd/familysync-story.json
git diff --cached --check -- data/hcd/familysync-story.json
git commit -m "Rewrite FamilySync as a workshop story"
```

---

### Task 4: Rewrite and regroup the Squad Up story

**Files:**
- Modify: `data/hcd/mcdonalds-story.json`

**Interfaces:**
- Consumes: Task 1 `HcdProjectStory` contract and Task 2 grouped-visual renderer.
- Produces: five Squad Up sections, three approved notes, eighteen unique visuals, and one quiet context sentence.

- [ ] **Step 1: Convert the top-level Squad Up data**

Use these exact public strings:

```json
{
  "projectId": "mcdonalds-interaction-design",
  "accent": "mcdonalds",
  "label": "Northwestern EDI · Team project",
  "title": "Squad Up",
  "proposition": "A shared ordering concept that lets a group join, choose, pay, and get ready without one person managing everyone.",
  "context": "A group order starts before checkout. People are still arriving, changing plans, choosing food, and figuring out who owes what.",
  "role": "User research · Journey design · Interaction architecture · Prototyping",
  "closingContext": "Student team project created at Northwestern EDI using McDonald’s ordering as the design context; not affiliated with or shipped by McDonald’s."
}
```

Keep the existing three metrics and `mcd-live-progress` as the hero. Remove hero `sourceUrl`/`sourceLabel`; use this caption:

```json
"Live bag states show who has joined, who is choosing, and when the group is ready."
```

- [ ] **Step 2: Build the five Squad Up sections with this exact visual mapping**

| Key | Heading | Visual groups |
| --- | --- | --- |
| `situation` | The order starts before checkout | `mcd-research-proof` + `mcd-research-insight` as one `pair` group |
| `learning` | One person becomes the coordinator | `mcd-capabilities-gap` + `mcd-problem-landscape` as one `pair` group |
| `idea` | One order, individual agency | `mcd-opportunity-brief` + `mcd-value-props` as one `pair` group |
| `mechanics` | From invite to pickup | journeys: `mcd-kiosk-journey` + `mcd-app-journey` as `pair`; entry: `mcd-trigger-setup` + `mcd-join-architecture` + `mcd-invite-touchpoints` as `sequence`; system: `mcd-system-map` + `mcd-readiness-engine` as `pair`; interaction: `mcd-squad-details` + `mcd-delegated-payment` + `mcd-readiness` + `mcd-order-complete` as `sequence` |
| `reflection` | What I took forward | no visual groups |

Use these exact section introductions:

```json
[
  "Across 4 observations, 8 interviews, and 22 survey responses, we saw McDonald’s as a stop between other activities. The order had to preserve social momentum, not become a separate administrative task.",
  "Existing paths create an awkward tradeoff: one person collects everyone’s choices and chases payment, or people pay separately and lose a shared view of the order.",
  "We reframed the opportunity as synchronized participation: one shared order, while each person keeps ownership of their choices and payment.",
  "The concept connects invitation, joining, individual bags, payment, readiness, and pickup as one visible group state. Kiosk, app, web, and assisted entry points all converge on the same order.",
  "Squad Up reinforced that group experiences need more than collaboration features. The product has to show ownership, progress, and intervention clearly enough that coordination feels lighter instead of merely moving into a new interface."
]
```

- [ ] **Step 3: Add only the three approved Squad Up post-its**

Place one note in `situation` and two in `learning`:

```json
{ "id": "mcd-note-hangout", "text": "The order is part of the hangout, not a separate task.", "tone": "yellow", "rotation": -1.1 }
{ "id": "mcd-note-coordinator", "text": "One person coordinates the food, or everyone coordinates payment.", "tone": "cream", "rotation": 0.7 }
{ "id": "mcd-note-clarity", "text": "Group visibility and payment clarity have to improve together.", "tone": "red", "rotation": -0.6 }
```

Remove every source/provenance field. Use these exact captions and omit `takeaways` from every Squad Up section; the introductions, notes, group titles, and captions carry the story without square bullet lists:

| Visual ID | Caption |
| --- | --- |
| `mcd-research-proof` | The project began with four observations, eight interviews, and twenty-two survey responses. |
| `mcd-research-insight` | An after-class routine showed how ordering competes with time, travel, and social momentum. |
| `mcd-capabilities-gap` | Current options split coordination and payment instead of solving both for the group. |
| `mcd-problem-landscape` | Teen needs connected easy ordering with social reinforcement, financial clarity, and familiar behavior. |
| `mcd-opportunity-brief` | The first concept tested synchronized carts, clearer coordination, and the risk of added setup. |
| `mcd-value-props` | Customization, payment, and pickup became the three value checks for the shared order. |
| `mcd-kiosk-journey` | At the kiosk, personal carts and payment methods converge into one coordinated order. |
| `mcd-app-journey` | On mobile, invitations and cart building begin before arrival and reconnect at pickup. |
| `mcd-trigger-setup` | Hosts can start the shared order, choose a mode, and recognize who has joined. |
| `mcd-join-architecture` | Guests can enter through app, web, or assisted paths without sharing the same setup. |
| `mcd-invite-touchpoints` | QR, link, and proximity invitations bring different entry points into the same order. |
| `mcd-system-map` | One shared state connects invitation, joining, bags, payment, readiness, and fulfillment. |
| `mcd-readiness-engine` | Readiness logic shows when the host can intervene, delegate payment, or submit. |
| `mcd-squad-details` | The squad view makes each participant, bag, and payment responsibility visible. |
| `mcd-delegated-payment` | A participant can ask the host to cover payment without surrendering bag ownership. |
| `mcd-readiness` | The order becomes submittable only when every required bag and payment state is ready. |
| `mcd-order-complete` | Completion keeps individual bag identities visible through pickup and handoff. |

- [ ] **Step 4: Run Squad Up verification and inspect JSON**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs mcdonalds
node -e "const s=require('./data/hcd/mcdonalds-story.json'); const v=[s.hero,...s.sections.flatMap(x=>x.groups.flatMap(g=>g.visuals))]; console.log(s.sections.map(x=>x.title)); console.log(v.length,new Set(v.map(x=>x.id)).size);"
```

Expected: verifier passes; headings match the five approved headings; counts print `18 18`.

- [ ] **Step 5: Commit only the Squad Up story**

```bash
git add data/hcd/mcdonalds-story.json
git diff --cached --check -- data/hcd/mcdonalds-story.json
git commit -m "Rewrite Squad Up as a workshop story"
```

---

### Task 5: Update production browser coverage and verify the complete redesign

**Files:**
- Modify: `scripts/smoke-hcd-case-studies.cjs`
- Modify: `AGENTS.md` only during final root handoff, newest-first under `## Codex`

**Interfaces:**
- Consumes: Task 1 verifier, Task 2 shared shell, and Tasks 3–4 story data.
- Produces: `node scripts/smoke-hcd-case-studies.cjs <base-url>` coverage for the approved workshop redesign.

- [ ] **Step 1: Rewrite smoke-test project expectations**

Use these exact expectations:

```js
const sectionKeys = ['situation', 'learning', 'idea', 'mechanics', 'reflection'];
const forbiddenPublicText = /\b(evidence|boundary|provenance|verification)\b|view source|figma/i;

const projects = [
  {
    path: '/work/familysync-jpmorgan',
    title: 'FamilySync',
    visualCount: 9,
    postItCount: 3,
    closingContext: 'Student team project created at Northwestern EDI with JPMorgan Chase as project partner; not a shipped product.',
    sectionTitles: ['Care coordination is work', 'The family is the system', 'Three principles shaped the idea', 'Designing the handoff', 'What I took forward'],
    story: require(path.join(__dirname, '..', 'data', 'hcd', 'familysync-story.json')),
  },
  {
    path: '/work/mcdonalds-interaction-design',
    title: 'Squad Up',
    visualCount: 18,
    postItCount: 3,
    closingContext: 'Student team project created at Northwestern EDI using McDonald’s ordering as the design context; not affiliated with or shipped by McDonald’s.',
    sectionTitles: ['The order starts before checkout', 'One person becomes the coordinator', 'One order, individual agency', 'From invite to pickup', 'What I took forward'],
    story: require(path.join(__dirname, '..', 'data', 'hcd', 'mcdonalds-story.json')),
  },
];
```

Replace `retainedEvidence()` with:

```js
function retainedVisuals(story) {
  return [story.hero, ...story.sections.flatMap((section) => section.groups.flatMap((group) => group.visuals))];
}
```

- [ ] **Step 2: Assert the new public DOM and absence of old interface**

For each route and viewport, assert:

```js
assert.equal(await projectDialog.locator('[data-hcd-workshop-surface]').count(), 1);
assert.deepEqual(
  await projectDialog.locator('[data-hcd-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-hcd-section'))),
  sectionKeys,
);
assert.equal(await projectDialog.locator('[data-hcd-post-it]').count(), project.postItCount);
assert.equal(await projectDialog.locator('a[href*="figma.com"]').count(), 0);
assert.equal(await projectDialog.locator('nav').count(), 0);
assert.doesNotMatch(await projectDialog.innerText(), forbiddenPublicText);
```

Assert exact section headings, exact closing context, exact note texts from story data, visual ID uniqueness/count, image alt/caption/load state, and no `sourceLabel` or `sourceUrl` keys in the public story objects.

- [ ] **Step 3: Update full-size-viewer interaction assertions**

Open the hero using `[data-hcd-visual-trigger]`. Assert the body-portaled dialog name is `Full view: ${visual.alt}`, its initial control label is `View image at full size`, desktop uses `elementFromPoint` plus a real pointer click, mobile uses focus plus Enter, the pressed state changes, the pan region obtains horizontal and vertical scroll ranges, Escape closes only the viewer, and focus returns to `[data-hcd-visual-trigger]`.

Keep project Escape, browser Back, default-renderer, zero-overflow, zero-console/page/request/HTTP-error, and loaded-asset assertions.

- [ ] **Step 4: Run script syntax and full static verification**

```bash
node --check scripts/smoke-hcd-case-studies.cjs
node scripts/verify-hcd-case-studies.mjs all
node review/hcd-figma-selector/verify.mjs
npm run build
git diff --check
```

Expected: all exit 0; private selector remains 28 artifacts/images/Figma links; production build succeeds.

- [ ] **Step 5: Run the managed production smoke**

First run:

```bash
/Users/adi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/adi/.codex/skills/webapp-testing/scripts/with_server.py --help
```

Then run:

```bash
/Users/adi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  /Users/adi/.codex/skills/webapp-testing/scripts/with_server.py \
  --server "npm run preview -- --host 127.0.0.1 --port 4173" \
  --port 4173 \
  -- node scripts/smoke-hcd-case-studies.cjs http://127.0.0.1:4173
```

Expected: FamilySync and Squad Up pass at 1440×1000 and 390×844 with exact visual/post-it/section counts, pointer and keyboard full-size activation, two-axis panning, Escape/focus return, Back, no overflow, no forbidden public language, and zero errors. The default project still renders `The Story`.

- [ ] **Step 6: Perform focused visual inspection without screenshots**

Inspect both routes at desktop and 390px in the local browser. Confirm:

- mat, ruler, grid, paper, and shadows feel continuous with the main portfolio;
- post-its look tactile but do not overlap content or imitate random decoration;
- post-it text remains legible and source-derived;
- no square button or chapter strip remains;
- FamilySync feels calm and Squad Up feels energetic within the same workshop system;
- all visuals read as project illustrations/flows rather than proof objects;
- dense maps are readable after `View larger` → `Full size`;
- copy is scannable and no section is a process dump.

- [ ] **Step 7: Commit the durable browser coverage**

```bash
git add scripts/smoke-hcd-case-studies.cjs
git diff --cached --check -- scripts/smoke-hcd-case-studies.cjs
git commit -m "Verify workshop HCD case studies"
```

- [ ] **Step 8: Final root handoff and Codex log**

Run fresh:

```bash
node scripts/verify-hcd-case-studies.mjs all
node review/hcd-figma-selector/verify.mjs
npm run build
git diff --check
git status --short
```

Add one newest-first line under `## Codex` in `AGENTS.md` describing the removal of public provenance/evidence UI, the cutting-mat/paper/post-it redesign, concise five-beat stories, and desktop/mobile verification. Because `AGENTS.md` already contains concurrent staged and unstaged work, do not stage or commit it unless root can prove the commit contains only the new Codex line.

Start a verified production preview and provide direct links to:

```text
/work/familysync-jpmorgan
/work/mcdonalds-interaction-design
```

Do not push or publish.
