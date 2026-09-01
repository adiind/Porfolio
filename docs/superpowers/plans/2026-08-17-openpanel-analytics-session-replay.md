# OpenPanel Portfolio Analytics and Session Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track every public project and experience detail open, the active time spent in each, all existing portfolio events, public screen views, outbound links, and privacy-masked session replay through OpenPanel.

**Architecture:** A guarded OpenPanel adapter extends the existing vendor-neutral analytics boundary without exposing a client secret or breaking the site when configuration is absent. Canonical instrumentation lives at `ProjectDetail` and `ExperienceDetail`, so every entry point is covered, while a reusable active-time hook measures visible, focused engagement and pauses parent timing under nested dialogs. A footer preference disables explicit events immediately and reloads into a state where OpenPanel and replay never initialize.

**Tech Stack:** React 19, TypeScript, Vite, `@openpanel/web`, Vitest, IntersectionObserver, Page Visibility API, existing Tailwind utilities, browser request interception.

## Global Constraints

- Every rendered `ProjectDetail` emits exactly one `project_opened` event and starts a `content_engaged` accumulator for its project ID; intervals emit after the five-second minimum.
- Every rendered desktop `ExperienceDetail` and every expanded mobile experience card emits exactly one `experience_opened` event and starts a `content_engaged` accumulator for its experience ID; intervals emit after the five-second minimum.
- Keep all analytics anonymous: never call `identify()` and never send names, emails, visitor input, client secrets, or free-form text properties.
- Initialize only with `VITE_OPENPANEL_CLIENT_ID`, `VITE_OPENPANEL_ENABLED=true`, a production build, a public non-`/studio` path, and no stored opt-out; `VITE_OPENPANEL_TEST_MODE=true` may override the production/enabled gates only for controlled verification.
- Configure replay with `maskAllInputs: true`, `maskAllText: true`, and `unmaskTextSelector: '[data-openpanel-unmask]'`.
- Preserve existing optional Zaraz, PostHog, Plausible, and Umami dispatches.
- Durations under five seconds are discarded, valid durations are rounded to five seconds, and every interval is capped at thirty minutes.
- Do not deploy, create an account, change billing, or activate production collection without separate explicit authorization.
- Preserve all unrelated dirty-worktree changes; never use `git add -A`.

---

### Task 1: Test harness, privacy filter, and guarded OpenPanel client

**Files:**
- Create: `lib/analyticsPrivacy.ts`
- Create: `lib/openpanel.ts`
- Create: `lib/analyticsPrivacy.test.ts`
- Create: `lib/openpanel.test.ts`
- Modify: `lib/analytics.ts`
- Modify: `index.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite-env.d.ts`

**Interfaces:**
- Produces: `sanitizeAnalyticsProperties(properties): Record<string, string | number | boolean>`.
- Produces: `getAnalyticsPreference(): 'allowed' | 'opted_out'` and `setAnalyticsOptOut(value: boolean): void` using `portfolio_analytics_opt_out`.
- Produces: `resolveOpenPanelRuntime(input): OpenPanelRuntimeConfig` as a pure configuration gate.
- Produces: `initializeOpenPanel(): Promise<void>` and `trackOpenPanelEvent(name, properties): void`.
- Consumes: the existing `trackEvent(eventName, properties)` API.

- [ ] **Step 1: Install the SDK and test runner**

Run:

```bash
npm install @openpanel/web
npm install --save-dev vitest
```

Add scripts:

```json
"test:analytics": "vitest run lib",
"verify:analytics": "node scripts/verify-openpanel-analytics.mjs"
```

- [ ] **Step 2: Write failing privacy tests**

Cover scalar retention, null/undefined removal, nested-value removal, case-insensitive rejection of `name`, `first_name`, `last_name`, `full_name`, `email`, `message`, `input`, `text`, `query`, and `search`, safe local-storage failures, and the opt-out key.

```ts
expect(sanitizeAnalyticsProperties({ id: 'glyph', count: 2, email: 'a@b.com', nested: { a: 1 } as never }))
  .toEqual({ id: 'glyph', count: 2 });
expect(getAnalyticsPreference(storageWith('portfolio_analytics_opt_out', 'true'))).toBe('opted_out');
```

- [ ] **Step 3: Run the privacy tests and confirm failure**

Run: `npx vitest run lib/analyticsPrivacy.test.ts`

Expected: FAIL because `analyticsPrivacy.ts` does not exist.

- [ ] **Step 4: Implement the privacy boundary**

Use these exact exports:

```ts
export type AnalyticsScalar = string | number | boolean;
export type SanitizedAnalyticsProperties = Record<string, AnalyticsScalar>;
export const ANALYTICS_OPT_OUT_KEY = 'portfolio_analytics_opt_out';
export function sanitizeAnalyticsProperties(input?: Record<string, unknown>): SanitizedAnalyticsProperties;
export function getAnalyticsPreference(storage?: Pick<Storage, 'getItem'>): 'allowed' | 'opted_out';
export function setAnalyticsOptOut(value: boolean, storage?: Pick<Storage, 'setItem' | 'removeItem'>): void;
```

- [ ] **Step 5: Write failing OpenPanel configuration tests**

Test the full gate matrix and exact replay options without issuing network calls:

```ts
expect(resolveOpenPanelRuntime(baseInput)).toMatchObject({ enabled: true, replayEnabled: true });
expect(resolveOpenPanelRuntime({ ...baseInput, pathname: '/studio' }).enabled).toBe(false);
expect(resolveOpenPanelRuntime({ ...baseInput, optedOut: true }).enabled).toBe(false);
expect(createOpenPanelOptions(baseConfig).sessionReplay).toEqual(expect.objectContaining({
  enabled: true,
  maskAllInputs: true,
  maskAllText: true,
  unmaskTextSelector: '[data-openpanel-unmask]',
}));
```

- [ ] **Step 6: Run the OpenPanel tests and confirm failure**

Run: `npx vitest run lib/openpanel.test.ts`

Expected: FAIL because `openpanel.ts` does not exist.

- [ ] **Step 7: Implement guarded initialization and dispatch**

Define:

```ts
export interface OpenPanelRuntimeInput {
  clientId?: string;
  apiUrl?: string;
  enabledFlag?: string;
  testModeFlag?: string;
  isProd: boolean;
  pathname: string;
  optedOut: boolean;
}

export interface OpenPanelRuntimeConfig {
  enabled: boolean;
  replayEnabled: boolean;
  clientId?: string;
  apiUrl?: string;
}
```

`initializeOpenPanel()` dynamically imports `@openpanel/web`, constructs one client, enables automatic screen views/outbound links, disables attribute tracking, and flushes queued explicit events once. Initialization and dispatch errors log only under Vite development mode or `VITE_ANALYTICS_DEBUG=true`.

- [ ] **Step 8: Connect the vendor-neutral helper and entry point**

Replace `lib/analytics.ts` property cleanup with `sanitizeAnalyticsProperties`, return early after a stored opt-out, preserve the four optional provider calls, and call `trackOpenPanelEvent`. Call `initializeOpenPanel()` in `index.tsx` after `/work/<id>` normalization and before React render.

- [ ] **Step 9: Run focused tests and build**

Run:

```bash
npm run test:analytics
npm run build
```

Expected: all analytics tests pass and the Vite build succeeds without any client ID.

- [ ] **Step 10: Commit the isolated client boundary when the worktree permits**

```bash
git add lib/analyticsPrivacy.ts lib/openpanel.ts lib/analyticsPrivacy.test.ts lib/openpanel.test.ts lib/analytics.ts index.tsx package.json package-lock.json vite-env.d.ts
git commit -m "Add guarded OpenPanel analytics client"
```

If unrelated edits already overlap `package.json` or `package-lock.json`, do not commit automatically; preserve the working tree and report the intended commit message.

---

### Task 2: Active engagement engine and React hook

**Files:**
- Create: `lib/engagement.ts`
- Create: `lib/engagement.test.ts`
- Create: `hooks/useContentEngagement.ts`

**Interfaces:**
- Produces: `normalizeEngagedSeconds(milliseconds): number | null`.
- Produces: `EngagementAccumulator` with `setActive(active, now)` and `flush(now)`.
- Produces: `useContentEngagement(options): RefObject<HTMLElement | null>`.
- Consumes: `trackEvent('content_engaged', payload)`.

- [ ] **Step 1: Write the failing timer tests**

Test disqualification below five seconds, five-second rounding, the thirty-minute cap, pause/resume accumulation, and idempotent flush:

```ts
const timer = new EngagementAccumulator();
timer.setActive(true, 0);
timer.setActive(false, 12_400);
expect(timer.flush(12_400)).toBe(10);
expect(timer.flush(12_400)).toBeNull();
```

- [ ] **Step 2: Run the timer tests and confirm failure**

Run: `npx vitest run lib/engagement.test.ts`

Expected: FAIL because `engagement.ts` does not exist.

- [ ] **Step 3: Implement the pure accumulator**

Use constants `MIN_ENGAGEMENT_MS = 5_000`, `ROUND_ENGAGEMENT_MS = 5_000`, and `MAX_ENGAGEMENT_MS = 1_800_000`. `flush()` closes an active interval, returns normalized seconds once, and resets accumulated time for the next interval.

- [ ] **Step 4: Implement the lifecycle hook**

Use this interface:

```ts
export interface ContentEngagementOptions {
  contentType: 'section' | 'project' | 'experience' | 'writing' | 'profile' | 'tinkerverse';
  contentId: string;
  section?: string;
  active?: boolean;
  observeVisibility?: boolean;
  threshold?: number;
}
```

The hook listens to `visibilitychange`, `focus`, `blur`, and `pagehide`. When `observeVisibility` is true it uses an IntersectionObserver at `threshold ?? 0.5`; otherwise a mounted active detail is considered visible. It emits a sanitized `content_engaged` event on deactivation, content identity change, `pagehide`, and unmount. A Strict Mode generation guard prevents a twin effect from double-flushing.

- [ ] **Step 5: Run timer tests and build**

Run:

```bash
npm run test:analytics
npm run build
```

Expected: timer tests pass and the hook type-checks.

- [ ] **Step 6: Commit the isolated timing engine when the worktree permits**

```bash
git add lib/engagement.ts lib/engagement.test.ts hooks/useContentEngagement.ts
git commit -m "Track active portfolio engagement time"
```

---

### Task 3: Canonical project and experience coverage

**Files:**
- Modify: `components/ProjectDetail.tsx`
- Modify: `components/ProjectsSection.tsx`
- Modify: `components/ExperienceDetail.tsx`
- Modify: `components/MobileTimeline.tsx`
- Modify: `components/TinkerVerseModal.tsx`
- Modify: `App.tsx`
- Create: `scripts/verify-openpanel-analytics.mjs`

**Interfaces:**
- Extends `ProjectDetail` props with `analyticsSource?: string`.
- Extends `ExperienceDetail` props with `analyticsSource: string`.
- Produces one canonical `project_opened` event from `ProjectDetail` mount.
- Produces one canonical `experience_opened` event from `ExperienceDetail` mount and from each mobile inline experience expansion.

- [ ] **Step 1: Write the failing source verifier**

The verifier must enumerate every `<ProjectDetail` call site and require an `analyticsSource`, require `ProjectDetail` to call both `trackEvent('project_opened'` and `useContentEngagement`, require `ExperienceDetail` to call both `trackEvent('experience_opened'` and `useContentEngagement`, and require `MobileTimeline` to track the same open/time pair for inline mobile expansions.

Run: `node scripts/verify-openpanel-analytics.mjs`

Expected: FAIL because canonical detail instrumentation is absent.

- [ ] **Step 2: Make `ProjectDetail` authoritative**

At the wrapper level, emit once per project ID:

```ts
trackEvent('project_opened', {
  id: project.id,
  status: project.outcome.status,
  source: analyticsSource ?? 'unknown',
});
```

Start `useContentEngagement({ contentType: 'project', contentId: project.id, section: 'detail' })` before routing to Glyph, FamilySync, McDonald's, or the default renderer. Remove the Selected Work caller-level `project_opened` and deep-link duplicate from `ProjectsSection`.

- [ ] **Step 3: Label every project entry point**

Pass exact sources:

- `selected_work` or `deep_link` from `ProjectsSection`;
- `experience_feature` from `ExperienceDetail`;
- `mobile_feature` from `MobileTimeline`;
- `tinkerverse` from `TinkerVerseModal`.

Keep `hero_project_link_clicked` as a separate acquisition event; the eventual detail open remains canonically counted by `ProjectDetail`.

- [ ] **Step 4: Make `ExperienceDetail` authoritative**

Emit once per experience ID:

```ts
trackEvent('experience_opened', {
  id: item.id,
  type: item.type,
  source: analyticsSource,
  surface: 'dialog',
});
```

Track active time with:

```ts
useContentEngagement({
  contentType: 'experience',
  contentId: item.id,
  section: 'detail',
  active: !selectedFeatureCard && !activeLinkedProject,
});
```

This pauses the parent experience while a nested feature or Selected Work project is topmost.

- [ ] **Step 5: Preserve source through App state**

Store the latest source alongside `activeProject`; set it in `handleOpenTimelineProject`, and pass it to `ExperienceDetail`. Retain `timeline_item_opened` as the trigger event and use `experience_opened` as the rendered-detail count.

- [ ] **Step 6: Cover mobile inline experience details**

When `MobileTimeline.handleCardTap` changes a card from collapsed to expanded, emit `experience_opened` with `source: 'mobile_timeline'` and `surface: 'inline'`. Derive the active item from `expandedId` and run one root-level `useContentEngagement` instance with that item ID; pause it while `activeLinkedProject` is topmost and flush it when the card collapses or changes.

- [ ] **Step 7: Run the coverage verifier and build**

Run:

```bash
npm run verify:analytics
npm run test:analytics
npm run build
```

Expected: the verifier proves all current project call sites have a source and both canonical detail boundaries track open plus time.

- [ ] **Step 8: Commit canonical coverage when the worktree permits**

```bash
git add components/ProjectDetail.tsx components/ProjectsSection.tsx components/ExperienceDetail.tsx components/MobileTimeline.tsx components/TinkerVerseModal.tsx App.tsx scripts/verify-openpanel-analytics.mjs
git commit -m "Track every project and experience detail"
```

---

### Task 4: Remaining content and public-section timing

**Files:**
- Modify: `components/CaseStudyModal.tsx`
- Modify: `components/BlogDetail.tsx`
- Modify: `components/ProfileModal.tsx`
- Modify: `components/TinkerVerseModal.tsx`
- Modify: `components/Hero.tsx`
- Modify: `components/ProjectsSection.tsx`
- Modify: `components/BlogSection.tsx`
- Modify: `components/PortfolioFooter.tsx`
- Modify: `scripts/verify-openpanel-analytics.mjs`

**Interfaces:**
- Consumes: `useContentEngagement`.
- Produces: active-time coverage for case studies, writings, profile, TinkerVerse, and top-level public sections.

- [ ] **Step 1: Add detail timing outside projects and experiences**

Instrument mounted dialogs with stable identities:

- case study: `contentType: 'project'`, `contentId: caseStudy.id ?? caseStudy.title`, `section: 'case_study'`;
- writing: `contentType: 'writing'`, `contentId: post.id`, `section: 'article'`;
- profile: `contentType: 'profile'`, `contentId: 'profile'`, `section: 'profile'`;
- TinkerVerse: `contentType: 'tinkerverse'`, `contentId: 'tinkerverse'`, `section: 'journal'`, paused while a nested project is open.

- [ ] **Step 2: Add IntersectionObserver timing to public sections**

Attach the returned ref to hero, selected work, writings, and footer roots with `observeVisibility: true`, `threshold: 0.5`, and stable IDs `intro`, `projects`, `writings`, and `footer`.

- [ ] **Step 3: Mark only safe structural text for replay**

Add `data-openpanel-unmask` only to stable navigation/section labels and analytics preference copy. Do not apply it to biography text, articles, arbitrary project copy, inputs, or Portfolio Studio.

- [ ] **Step 4: Extend and run the verifier**

Require all six non-detail surfaces above to call `useContentEngagement`, then run:

```bash
npm run verify:analytics
npm run test:analytics
npm run build
```

- [ ] **Step 5: Commit remaining timing coverage when the worktree permits**

```bash
git add components/CaseStudyModal.tsx components/BlogDetail.tsx components/ProfileModal.tsx components/TinkerVerseModal.tsx components/Hero.tsx components/ProjectsSection.tsx components/BlogSection.tsx components/PortfolioFooter.tsx scripts/verify-openpanel-analytics.mjs
git commit -m "Measure engagement across public portfolio content"
```

---

### Task 5: Disclosure and persistent opt-out

**Files:**
- Create: `components/AnalyticsPreferences.tsx`
- Modify: `components/PortfolioFooter.tsx`
- Modify: `scripts/verify-openpanel-analytics.mjs`

**Interfaces:**
- Consumes: `getAnalyticsPreference()` and `setAnalyticsOptOut(value)`.
- Produces: accessible `Allow anonymous analytics` control and reload behavior.

- [ ] **Step 1: Build the preference control**

Render restrained copy explaining anonymous interaction analytics and privacy-masked replay. Use a native checkbox with an explicit label and status copy. On change, store the inverse opt-out value and call `window.location.reload()` immediately.

- [ ] **Step 2: Integrate it into the footer**

Place the control below the existing footer statement without changing the footer's primary message or overwhelming the layout. Add `data-openpanel-unmask` only to the disclosure and setting label.

- [ ] **Step 3: Verify accessibility and source guards**

The verifier must require the exact label, storage key, reload call, and footer integration. Run:

```bash
npm run verify:analytics
npm run build
```

- [ ] **Step 4: Commit the preference UI when the worktree permits**

```bash
git add components/AnalyticsPreferences.tsx components/PortfolioFooter.tsx scripts/verify-openpanel-analytics.mjs
git commit -m "Add portfolio analytics opt out"
```

---

### Task 6: Controlled browser verification and activation handoff

**Files:**
- Modify: `scripts/verify-openpanel-analytics.mjs` only if runtime findings expose a missing static guard.
- Modify: `AGENTS.md` after all local evidence passes.

**Interfaces:**
- Produces: verified local analytics behavior without real visitor collection.
- Produces: an exact activation handoff for `VITE_OPENPANEL_CLIENT_ID` and `VITE_OPENPANEL_ENABLED=true`.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm run test:analytics
npm run verify:analytics
npm run verify:project-wheel
npm run build
```

Expected: all commands exit zero.

- [ ] **Step 2: Start a production preview in test mode against intercepted OpenPanel requests**

Use non-secret test values:

```bash
VITE_OPENPANEL_TEST_MODE=true VITE_OPENPANEL_CLIENT_ID=portfolio-local-test npm run build
npm run preview -- --host 127.0.0.1
```

Intercept the OpenPanel API and replay-script destinations so no event reaches a real OpenPanel project.

- [ ] **Step 3: Verify every project destination**

Programmatically enumerate the canonical ProjectsContext records, open each from Selected Work or its available nested source, and assert exactly one `project_opened` payload with the correct `id`. Repeat one project through `/work/<id>` and verify the canonical event still occurs exactly once.

- [ ] **Step 4: Verify every experience destination**

Programmatically enumerate every timeline item rendered as an experience/education/foundational detail, open each desktop dialog entry and each mobile inline entry, and assert exactly one `experience_opened` payload per opening with the correct `id`, source, and surface.

- [ ] **Step 5: Verify active timing behavior**

Keep one project and one experience visible for at least twelve seconds, close them, and assert rounded `content_engaged` values of ten or fifteen seconds. Repeat while backgrounding the page for at least ten seconds and assert hidden time is excluded. Open a nested project from an experience and assert the experience timer pauses while the project timer runs.

- [ ] **Step 6: Verify replay and opt-out privacy**

Assert replay requests are present only while allowed, contain masking configuration, and stop after opting out and reloading. Assert `/studio` and a build without client configuration send zero OpenPanel requests and do not load the replay module.

- [ ] **Step 7: Run desktop/mobile regression**

At 1440px and 390px verify the preference control, keyboard focus, project wheel, Selected Work, experience dialogs, deep links, nested dialogs, scrolling, no horizontal overflow, and zero console/page/request errors other than intentionally intercepted analytics requests.

- [ ] **Step 8: Update only the Codex section**

Add one newest-first `2026-08-17` line to `AGENTS.md` describing the exact analytics coverage, privacy controls, local verification, and explicit statement that no deployment or production data collection occurred.

- [ ] **Step 9: Prepare activation values without applying them**

Handoff the exact production variable names: set `VITE_OPENPANEL_CLIENT_ID` to the public client ID copied from the approved OpenPanel project, set `VITE_OPENPANEL_ENABLED` to `true`, and leave `VITE_OPENPANEL_API_URL` unset for OpenPanel Cloud or set it to the separately approved self-hosted endpoint.

After separate production authorization, deploy the variables, send one named smoke event, confirm it in the OpenPanel dashboard, verify one masked replay, and then declare collection active.
