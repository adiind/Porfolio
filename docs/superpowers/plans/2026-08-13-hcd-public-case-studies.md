# Public HCD Case Studies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic FamilySync and McDonald’s project details with two evidence-led, recruiter-facing HCD case studies using the 28 already-exported Figma artifacts.

**Architecture:** A shared `HcdCaseStudyShell` renders accessible full-screen case studies from typed JSON story manifests and owns chapter layouts, source links, responsive evidence figures, and a focus-returning lightbox. Thin project-specific React components own the FamilySync and McDonald’s manifests and page identity. `ProjectDetail` dispatches only the two named project IDs to these bespoke pages and preserves the default renderer for every other project.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind utility classes, Framer Motion, Lucide React, Python Pillow for reproducible WebP derivatives, Node static verification, Playwright browser verification.

## Global Constraints

- Figma access and source files remain read-only; implementation uses `review/hcd-figma-selector/` as the evidence source.
- Preserve `/work/familysync-jpmorgan` and `/work/mcdonalds-interaction-design` deep links and all existing full-screen close, Escape, Back, focus, and overlay behavior.
- FamilySync must be described as a Northwestern EDI service-design concept developed with JPMorgan Chase as the project partner, never as a shipped JPMorgan Chase product.
- Squad Up must be described as a Northwestern EDI interaction-design concept, never as an official McDonald’s product launch.
- Use every unique story-relevant artifact; when two artifacts repeat the same idea, prefer the final presentation or latest/highest-fidelity version and keep an older version only when it proves a distinct step, alternative, or decision.
- Every informative visual needs specific alt text, a caption explaining what it proves or changed, and its exact Figma source URL.
- Public assets must be optimized WebP derivatives under `public/images/hcd/<project>/`; source PNGs remain untouched under `review/hcd-figma-selector/assets/`.
- Allowed evidence treatments are `full`, `focus`, and `editorial`; never stretch images or crop through labels, people, phones, decision nodes, or the cause-and-effect relationship discussed in the caption.
- Dense artifacts must remain available in full through the evidence lightbox.
- Maintain WCAG AA contrast, visible focus states, keyboard-operable lightboxes, `prefers-reduced-motion`, and zero horizontal overflow at 390px.
- The visual system is a near-black editorial evidence dossier, not a repeated rounded-card dashboard; Care uses restrained mint/warm-neutral accents and McDonald’s uses cream/yellow/signal-red accents.
- Do not publish, push, modify hosting/DNS, redesign unrelated pages, add unsupported impact metrics, or touch unrelated dirty worktree changes.
- Production behavior changes follow TDD: run the task’s verifier before implementation and record the expected failure, then rerun it after implementation and record the pass.

---

## File map

- `components/hcd/HcdCaseStudy.tsx` — shared shell, chapters, evidence figures, lightbox, accessibility, and responsive presentation.
- `components/hcd/types.ts` — typed public contract for project story JSON.
- `components/hcd/FamilySyncProjectDetail.tsx` — Care wrapper that passes the Care story to the shared shell.
- `components/hcd/McDonaldsProjectDetail.tsx` — McDonald’s wrapper that passes the Squad Up story to the shared shell.
- `data/hcd/familysync-story.json` — Care narrative, evidence ordering, captions, alt text, source links, and image treatment.
- `data/hcd/mcdonalds-story.json` — McDonald’s narrative, evidence ordering, captions, alt text, source links, and image treatment.
- `data/hcd/familysync-assets.json` — reproducible Care source-to-WebP resize/crop manifest.
- `data/hcd/mcdonalds-assets.json` — reproducible McDonald’s source-to-WebP resize/crop manifest.
- `scripts/build-hcd-assets.py` — generic Pillow asset builder used by both project manifests.
- `scripts/verify-hcd-case-studies.mjs` — task-scoped static behavior/content verifier with `shared`, `care`, `mcdonalds`, `integration`, and `all` modes.
- `scripts/smoke-hcd-case-studies.cjs` — final Playwright behavior and responsive smoke test.
- `components/ProjectDetail.tsx` — two-ID dispatch integration only.

---

### Task 1: Shared HCD shell, contract, and asset pipeline

**Files:**
- Create: `components/hcd/types.ts`
- Create: `components/hcd/HcdCaseStudy.tsx`
- Create: `scripts/build-hcd-assets.py`
- Create: `scripts/verify-hcd-case-studies.mjs`

**Interfaces:**
- Produces: `HcdProjectStory`, `HcdEvidence`, `HcdChapter`, and `HcdCaseStudyShell({ story, onClose })`.
- Produces: `python scripts/build-hcd-assets.py --manifest <asset-json>` where the JSON contains `{ "assets": HcdAssetBuild[] }`.
- Produces: `node scripts/verify-hcd-case-studies.mjs <shared|care|mcdonalds|integration|all>`.
- Consumes: existing `useDialogA11y`, `projectPath`, Framer Motion, Lucide icons, and source PNGs under `review/hcd-figma-selector/assets/`.

- [ ] **Step 1: Write the shared verifier first**

Create `scripts/verify-hcd-case-studies.mjs` so `shared` asserts these files and behavior markers exist:

```js
const sharedRequirements = {
  'components/hcd/types.ts': [
    'export interface HcdEvidence',
    "treatment: 'full' | 'focus' | 'editorial'",
    'export interface HcdProjectStory',
  ],
  'components/hcd/HcdCaseStudy.tsx': [
    'export const HcdCaseStudyShell',
    'useDialogA11y',
    'aria-modal="true"',
    'aria-labelledby=',
    'loading={isHero ? \'eager\' : \'lazy\'}',
    'sizes=',
    'prefers-reduced-motion',
    'View source in Figma',
  ],
  'scripts/build-hcd-assets.py': ['Image.Resampling.LANCZOS', "format='WEBP'"],
};
```

The verifier must also parse story JSON in the project modes, reject duplicate evidence IDs, reject non-Figma source URLs, reject missing alt/caption strings, ensure referenced public images and their full-image counterparts exist, and ensure every chapter key is one of `frame`, `tension`, `opportunity`, `journey`, `decisions`, `interaction`, `outcome`.

Define the canonical page sets in this Task 1 verifier so the later page agents do not edit shared test code:

```js
const canonicalEvidence = {
  care: [
    'care-stakeholders', 'care-trust-takeaways', 'care-crisis-journey',
    'care-schedule-management', 'care-clinical-guardian-flow',
    'care-service-blueprint', 'care-familysync-intro', 'care-three-pillars',
    'care-escalation-flow', 'care-visibility-presence',
  ],
  mcdonalds: [
    'mcd-research-proof', 'mcd-research-insight', 'mcd-capabilities-gap',
    'mcd-problem-landscape', 'mcd-opportunity-brief', 'mcd-kiosk-journey',
    'mcd-app-journey', 'mcd-trigger-setup', 'mcd-join-architecture',
    'mcd-system-map', 'mcd-readiness-engine', 'mcd-invite-touchpoints',
    'mcd-value-props', 'mcd-live-progress', 'mcd-squad-details',
    'mcd-delegated-payment', 'mcd-readiness', 'mcd-order-complete',
  ],
};
```

Define `integration` mode in Task 1 to require imports and branches for both bespoke project components while allowing it to fail until Task 4 changes the dispatcher.

- [ ] **Step 2: Run the shared verifier and record the expected RED result**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs shared
```

Expected: non-zero exit naming at least `components/hcd/types.ts` as missing.

- [ ] **Step 3: Define the exact story contract**

Create `components/hcd/types.ts` with this public surface:

```ts
export type HcdAccent = 'care' | 'mcdonalds';
export type HcdTreatment = 'full' | 'focus' | 'editorial';
export type HcdChapterKey = 'frame' | 'tension' | 'opportunity' | 'journey' | 'decisions' | 'interaction' | 'outcome';

export interface HcdEvidence {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
  caption: string;
  sourceUrl: string;
  sourceLabel: string;
  treatment: HcdTreatment;
  aspect?: string;
  objectPosition?: string;
}

export interface HcdChapter {
  key: HcdChapterKey;
  index: string;
  eyebrow: string;
  title: string;
  intro: string;
  layout: 'single' | 'pair' | 'sequence' | 'wide';
  evidence: HcdEvidence[];
  takeaways?: string[];
}

export interface HcdProjectStory {
  projectId: 'familysync-jpmorgan' | 'mcdonalds-interaction-design';
  accent: HcdAccent;
  label: string;
  title: string;
  proposition: string;
  context: string;
  role: string;
  status: string;
  disciplines: string[];
  hero: HcdEvidence;
  metrics?: Array<{ value: string; label: string }>;
  chapters: HcdChapter[];
  outcome: string;
  limitation: string;
  reflection: string;
}
```

- [ ] **Step 4: Implement the shared shell**

Create `components/hcd/HcdCaseStudy.tsx` with:

```tsx
export const HcdCaseStudyShell: React.FC<{
  story: HcdProjectStory;
  onClose: () => void;
}> = ({ story, onClose }) => {
  const dialogRef = useDialogA11y(onClose, {
    historyTag: 'project',
    historyPath: projectPath(story.projectId),
  });
  // Render the full-screen dossier, close portal, chapter navigation,
  // evidence layouts, and focus-returning lightbox from `story`.
};
```

Required behavior:

- top-level `role="dialog"`, `aria-modal="true"`, labeled title, and the existing `useDialogA11y` history path;
- portal-based fixed Close button matching existing project behavior;
- one visible chapter index and narrative title per chapter;
- `<figure>`/`<figcaption>` evidence semantics with exact source links;
- stable aspect-ratio surfaces using `story` metadata, `object-fit: contain` for `full`, and `object-fit: cover` only for `focus`/`editorial`;
- hero eager loading and all later images lazy loading with explicit `sizes`;
- evidence buttons opening `fullSrc` in an internal lightbox;
- lightbox Escape handling that stops propagation before the parent dialog handler, focuses its Close button on open, and returns focus to the triggering evidence button on close;
- motion reduced or removed when `window.matchMedia('(prefers-reduced-motion: reduce)')` matches;
- Care and McDonald’s theme tokens selected only from `story.accent`.

- [ ] **Step 5: Implement the reproducible WebP builder**

Create `scripts/build-hcd-assets.py` to accept entries shaped exactly as:

```json
{
  "source": "review/hcd-figma-selector/assets/care-stakeholders.png",
  "output": "public/images/hcd/care/care-stakeholders.webp",
  "maxWidth": 1920,
  "quality": 84,
  "crop": [0, 0, 1920, 1080]
}
```

Implementation rules:

```python
with Image.open(source_path) as image:
    image = image.convert('RGB')
    if crop is not None:
        image = image.crop(tuple(crop))
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)
    image.save(output_path, format='WEBP', quality=quality, method=6)
```

Validate that source paths remain inside `review/hcd-figma-selector/assets`, outputs remain inside `public/images/hcd`, crop boxes have positive area and remain within the source image, and output directories are created automatically.

- [ ] **Step 6: Run the shared verifier and production build**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs shared
npm run build
```

Expected: both exit 0.

- [ ] **Step 7: Self-review and commit Task 1 only**

Run `git diff --check` on the four Task 1 files, then commit only those files with:

```bash
git add components/hcd/types.ts components/hcd/HcdCaseStudy.tsx scripts/build-hcd-assets.py scripts/verify-hcd-case-studies.mjs
git commit -m "Build shared HCD case study shell"
```

---

### Task 2: FamilySync / Care public case study

**Files:**
- Create: `components/hcd/FamilySyncProjectDetail.tsx`
- Create: `data/hcd/familysync-story.json`
- Create: `data/hcd/familysync-assets.json`
- Create: `public/images/hcd/care/*.webp`

**Interfaces:**
- Consumes: `HcdCaseStudyShell`, `HcdProjectStory`, and `build-hcd-assets.py` from Task 1.
- Produces: default export `FamilySyncProjectDetail({ project, onClose })` compatible with `ProjectDetail` props.
- Produces: a Care story manifest with unique evidence IDs and seven chapter keys.

- [ ] **Step 1: Run the prewritten Care verifier first**

Task 1 already defined this exact canonical Care set in `scripts/verify-hcd-case-studies.mjs`:

```js
const careRequiredIds = [
  'care-stakeholders',
  'care-trust-takeaways',
  'care-crisis-journey',
  'care-schedule-management',
  'care-clinical-guardian-flow',
  'care-service-blueprint',
  'care-familysync-intro',
  'care-three-pillars',
  'care-escalation-flow',
  'care-visibility-presence',
];
```

Run:

```bash
node scripts/verify-hcd-case-studies.mjs care
```

Expected: non-zero exit naming `data/hcd/familysync-story.json` as missing.

- [ ] **Step 2: Inspect all ten Care masters and choose crop variants**

Open every `review/hcd-figma-selector/assets/care-*.png` at full size. Keep all ten because each proves a distinct part of the story. Record one full WebP entry for every artifact. Add a second `-focus.webp` output only when a clear narrative crop improves legibility; the full WebP remains `fullSrc`.

Use these canonical roles:

```text
frame:       care-visibility-presence (hero), care-familysync-intro
tension:     care-stakeholders, care-trust-takeaways, care-crisis-journey
opportunity: care-three-pillars
journey:     care-schedule-management, care-clinical-guardian-flow, care-service-blueprint
decisions:   care-escalation-flow
interaction: care-visibility-presence
outcome:     no duplicate image; use outcome copy and refer back to the hero
```

The hero and interaction reference the same canonical artifact once in the evidence list: render it as hero and do not repeat it as a second chapter figure.

- [ ] **Step 3: Build the Care asset manifest and WebPs**

Create `data/hcd/familysync-assets.json` with `quality: 84`, `maxWidth: 1920` for slides, `maxWidth: 2400` for the schedule map, and valid crop coordinates for focus derivatives chosen in Step 2. Then run:

```bash
/Users/adi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/build-hcd-assets.py --manifest data/hcd/familysync-assets.json
```

Expected: every declared WebP exists under `public/images/hcd/care/`, is non-empty, and is smaller than its source PNG unless the source is already smaller than 250 KB.

- [ ] **Step 4: Write the Care story manifest**

Create `data/hcd/familysync-story.json` using these exact page facts:

```json
{
  "projectId": "familysync-jpmorgan",
  "accent": "care",
  "label": "Northwestern EDI · Service design concept",
  "title": "FamilySync",
  "proposition": "Reducing the invisible coordination work of family care without erasing control, consent, or human judgment.",
  "role": "Service design · Research synthesis · Agentic interaction design",
  "status": "Concept developed with JPMorgan Chase as the project partner"
}
```

Use the exact Figma URLs, source labels, artifact assessments, and accurate alt text already recorded in `review/hcd-figma-selector/index.html`. Write concise chapter intros and captions in first-person portfolio voice without claiming solo ownership of team work. State the project boundary explicitly in the context and limitation copy.

- [ ] **Step 5: Create the Care wrapper**

Create `components/hcd/FamilySyncProjectDetail.tsx`:

```tsx
import React from 'react';
import { Project } from '../../types/Project';
import storyData from '../../data/hcd/familysync-story.json';
import { HcdCaseStudyShell } from './HcdCaseStudy';
import { HcdProjectStory } from './types';

const FamilySyncProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ onClose }) => (
  <HcdCaseStudyShell story={storyData as HcdProjectStory} onClose={onClose} />
);

export default FamilySyncProjectDetail;
```

- [ ] **Step 6: Run Care verification and build**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs care
npm run build
```

Expected: both exit 0; verifier reports ten unique Care artifacts, all public/full assets, and ten exact Figma URLs.

- [ ] **Step 7: Self-review and commit Task 2 only**

Confirm every crop preserves the evidence described by its caption, then commit only the Care wrapper, manifests, and asset directory:

```bash
git add components/hcd/FamilySyncProjectDetail.tsx data/hcd/familysync-story.json data/hcd/familysync-assets.json public/images/hcd/care
git commit -m "Build FamilySync HCD case study"
```

---

### Task 3: McDonald’s / Squad Up public case study

**Files:**
- Create: `components/hcd/McDonaldsProjectDetail.tsx`
- Create: `data/hcd/mcdonalds-story.json`
- Create: `data/hcd/mcdonalds-assets.json`
- Create: `public/images/hcd/mcdonalds/*.webp`

**Interfaces:**
- Consumes: `HcdCaseStudyShell`, `HcdProjectStory`, and `build-hcd-assets.py` from Task 1.
- Produces: default export `McDonaldsProjectDetail({ project, onClose })` compatible with `ProjectDetail` props.
- Produces: a McDonald’s story manifest with unique evidence IDs and seven chapter keys.

- [ ] **Step 1: Run the prewritten McDonald’s verifier first**

Task 1 already defined this exact canonical McDonald’s set in `scripts/verify-hcd-case-studies.mjs`:

```js
const mcdonaldsRequiredIds = [
  'mcd-research-proof',
  'mcd-research-insight',
  'mcd-capabilities-gap',
  'mcd-problem-landscape',
  'mcd-opportunity-brief',
  'mcd-kiosk-journey',
  'mcd-app-journey',
  'mcd-trigger-setup',
  'mcd-join-architecture',
  'mcd-system-map',
  'mcd-readiness-engine',
  'mcd-invite-touchpoints',
  'mcd-value-props',
  'mcd-live-progress',
  'mcd-squad-details',
  'mcd-delegated-payment',
  'mcd-readiness',
  'mcd-order-complete',
];
```

Run:

```bash
node scripts/verify-hcd-case-studies.mjs mcdonalds
```

Expected: non-zero exit naming `data/hcd/mcdonalds-story.json` as missing.

- [ ] **Step 2: Inspect all eighteen McDonald’s masters and resolve semantic duplication**

Open every `review/hcd-figma-selector/assets/mcd-*.png` at full size. The kiosk and app journeys are distinct alternatives and both remain. The readiness engine explains system logic while the readiness screen proves the final interaction, so both remain. The trigger, join architecture, and system map prove different layers and remain. If inspection finds any other pair communicating the same point, keep the final-deck or highest-fidelity version and document the omitted ID in the implementer report.

Use these canonical roles:

```text
frame:       mcd-live-progress (hero)
tension:     mcd-research-proof, mcd-research-insight, mcd-capabilities-gap, mcd-problem-landscape
opportunity: mcd-opportunity-brief, mcd-value-props
journey:     mcd-kiosk-journey, mcd-app-journey, mcd-trigger-setup, mcd-join-architecture
decisions:   mcd-system-map, mcd-readiness-engine, mcd-invite-touchpoints
interaction: mcd-squad-details, mcd-delegated-payment, mcd-readiness, mcd-order-complete
outcome:     no duplicate image; use outcome copy and refer back to the hero
```

The hero image is not repeated as a second interaction figure.

- [ ] **Step 3: Build the McDonald’s asset manifest and WebPs**

Create `data/hcd/mcdonalds-assets.json` with `quality: 84`, `maxWidth: 1920` for slides, and `maxWidth: 2400` for wide system maps. Add focus derivatives only where visual inspection proves a crop improves comprehension. Then run:

```bash
/Users/adi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/build-hcd-assets.py --manifest data/hcd/mcdonalds-assets.json
```

Expected: every declared WebP exists under `public/images/hcd/mcdonalds/`, is non-empty, and is smaller than its source PNG unless the source is already smaller than 250 KB.

- [ ] **Step 4: Write the McDonald’s story manifest**

Create `data/hcd/mcdonalds-story.json` using these exact page facts:

```json
{
  "projectId": "mcdonalds-interaction-design",
  "accent": "mcdonalds",
  "label": "Northwestern EDI · Interaction design concept",
  "title": "Squad Up",
  "proposition": "Turning a messy group order into a shared, visible sequence of joining, choosing, paying, and getting ready.",
  "role": "User research · Journey design · Interaction architecture · Prototyping",
  "status": "Concept exploration using McDonald’s ordering context"
}
```

Use the exact research count `4 observations · 8 interviews · 22 survey responses`. Use exact Figma URLs, source labels, artifact assessments, and accurate alt text from `review/hcd-figma-selector/index.html`. Write concise first-person portfolio copy without implying that McDonald’s sponsored, approved, shipped, or participated in the concept.

- [ ] **Step 5: Create the McDonald’s wrapper**

Create `components/hcd/McDonaldsProjectDetail.tsx`:

```tsx
import React from 'react';
import { Project } from '../../types/Project';
import storyData from '../../data/hcd/mcdonalds-story.json';
import { HcdCaseStudyShell } from './HcdCaseStudy';
import { HcdProjectStory } from './types';

const McDonaldsProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ onClose }) => (
  <HcdCaseStudyShell story={storyData as HcdProjectStory} onClose={onClose} />
);

export default McDonaldsProjectDetail;
```

- [ ] **Step 6: Run McDonald’s verification and build**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs mcdonalds
npm run build
```

Expected: both exit 0; verifier reports every retained McDonald’s artifact once, all public/full assets, and one exact Figma URL per retained artifact.

- [ ] **Step 7: Self-review and commit Task 3 only**

Confirm crops preserve the evidence described by captions, then commit only the McDonald’s wrapper, manifests, and asset directory:

```bash
git add components/hcd/McDonaldsProjectDetail.tsx data/hcd/mcdonalds-story.json data/hcd/mcdonalds-assets.json public/images/hcd/mcdonalds
git commit -m "Build McDonald’s HCD case study"
```

---

### Task 4: Route integration and end-to-end public-page verification

**Files:**
- Modify: `components/ProjectDetail.tsx`
- Create: `scripts/smoke-hcd-case-studies.cjs`
- Modify: `AGENTS.md` only after all verification passes

**Interfaces:**
- Consumes: both project-specific default exports and the unchanged `DefaultProjectDetail`.
- Produces: deterministic dispatch for exactly `glyph`, `familysync-jpmorgan`, `mcdonalds-interaction-design`, and default project paths.
- Produces: `node scripts/smoke-hcd-case-studies.cjs <base-url>`.

- [ ] **Step 1: Run the prewritten integration assertions before routing changes**

Task 1 already defined `integration` mode to require these imports and branches in `components/ProjectDetail.tsx`:

```ts
import FamilySyncProjectDetail from './hcd/FamilySyncProjectDetail';
import McDonaldsProjectDetail from './hcd/McDonaldsProjectDetail';

if (props.project.id === 'glyph') return <GlyphProjectDetail {...props} />;
if (props.project.id === 'familysync-jpmorgan') return <FamilySyncProjectDetail {...props} />;
if (props.project.id === 'mcdonalds-interaction-design') return <McDonaldsProjectDetail {...props} />;
return <DefaultProjectDetail {...props} />;
```

Run:

```bash
node scripts/verify-hcd-case-studies.mjs integration
```

Expected: non-zero exit naming the missing FamilySync import or branch.

- [ ] **Step 2: Integrate the two bespoke routes**

Modify only the imports and final dispatcher in `components/ProjectDetail.tsx`. Do not alter `DefaultProjectDetail` or Glyph behavior.

- [ ] **Step 3: Write the browser smoke test before running it**

Create `scripts/smoke-hcd-case-studies.cjs` using Playwright. For each deep link, it must:

```js
const projects = [
  { path: '/work/familysync-jpmorgan', title: 'FamilySync', evidenceCount: 10 },
  { path: '/work/mcdonalds-interaction-design', title: 'Squad Up', evidenceCount: 18 },
];
```

Assert at 1440×1000 and 390×844:

- the expected project title, all seven chapter keys, and project boundary copy render;
- every retained evidence figure loads with `naturalWidth > 0`, specific alt text, caption, and Figma link;
- evidence IDs are unique;
- lightbox opens, shows the full asset, closes with Escape, and returns focus to its trigger;
- the project closes with Escape when no lightbox is open;
- direct navigation can be restored for the next test;
- `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`;
- no console errors, page errors, failed requests, or missing assets occur.

Also open one non-HCD project and assert it still renders `The Story`, proving the default renderer remains active.

- [ ] **Step 4: Run static verification and production build**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs all
npm run build
```

Expected: both exit 0.

- [ ] **Step 5: Run the browser test through the managed server helper**

First run the helper’s required help command:

```bash
/Users/adi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/adi/.codex/skills/webapp-testing/scripts/with_server.py --help
```

Then run the production preview and smoke test:

```bash
/Users/adi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 /Users/adi/.codex/skills/webapp-testing/scripts/with_server.py \
  --server "npm run preview -- --host 127.0.0.1 --port 4173" \
  --port 4173 \
  -- node scripts/smoke-hcd-case-studies.cjs http://127.0.0.1:4173
```

Expected: exit 0 with both project names, desktop/mobile widths, evidence counts, lightbox/focus checks, and zero errors reported.

- [ ] **Step 6: Visually inspect every evidence treatment**

At desktop and 390px, inspect all crops and full diagrams. Confirm:

- no focus crop cuts through the subject described by its caption;
- full maps remain legible through the lightbox;
- neither page degenerates into a uniform card grid;
- Care and McDonald’s feel related but project-specific;
- section pacing makes the research-to-outcome story scannable in approximately two minutes.

Any failed crop returns to the owning page agent with the exact artifact ID and viewport.

- [ ] **Step 7: Run final repository checks**

Run:

```bash
node scripts/verify-hcd-case-studies.mjs all
npm run build
git diff --check
git status --short
```

Expected: verifiers/build exit 0, no whitespace errors, and only this plan’s files plus pre-existing unrelated changes appear.

- [ ] **Step 8: Update the Codex log and commit integration only**

Insert one newest-first line under `## Codex` in `AGENTS.md` describing the two bespoke public HCD case studies, evidence/crop handling, and verification. Commit only integration, smoke test, and the Codex line:

```bash
git add components/ProjectDetail.tsx scripts/smoke-hcd-case-studies.cjs AGENTS.md
git commit -m "Integrate public HCD case studies"
```

Do not stage or commit unrelated files.
