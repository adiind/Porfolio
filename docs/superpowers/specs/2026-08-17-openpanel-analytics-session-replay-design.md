# OpenPanel portfolio analytics and session replay design

## Purpose

Measure how visitors move through the public portfolio, which work holds active attention, and where interactions become confusing. The integration must remain anonymous, avoid personally identifying properties, and make session replay visible and optional for visitors.

## Approved scope

- Cover every public portfolio route, section, project detail, experience detail, writing, profile surface, and outbound call to action.
- Use OpenPanel's browser session duration for overall visit time.
- Add active engaged-time events for individual content and sections.
- Enable privacy-masked session replay on the public production site.
- Provide a visible analytics disclosure and a persistent opt-out.
- Preserve the existing vendor-neutral `trackEvent()` API and its current events.
- Never call `identify()` or attach names, email addresses, free-form visitor input, or persistent profile IDs.

## Architecture

### OpenPanel client

Create one shared browser client using `@openpanel/web`. Configuration comes from public Vite variables:

- `VITE_OPENPANEL_CLIENT_ID` enables a real OpenPanel project.
- `VITE_OPENPANEL_API_URL` optionally selects an approved cloud or self-hosted endpoint.
- `VITE_OPENPANEL_ENABLED=true` explicitly enables collection for an approved deployment.
- `VITE_OPENPANEL_TEST_MODE=true` is the only way to initialize outside a production build.

The client initializes only when all of these are true:

1. A client ID is present.
2. Collection is explicitly enabled, unless test mode was explicitly enabled.
3. The build is production, unless test mode was explicitly enabled.
4. The current path is not `/studio`.
5. The visitor has not stored the local analytics opt-out.

Missing or invalid configuration disables OpenPanel without breaking the portfolio. The client secret is never present in browser code.

### Existing analytics boundary

`lib/analytics.ts` remains the only imperative event entry point. It continues to remove `null` and `undefined` values, adds the current path, and supports the existing optional provider globals. It also forwards the same sanitized payload to OpenPanel when the shared client is enabled.

Automatic OpenPanel screen-view and outgoing-link tracking are enabled. Declarative `data-track` collection is disabled so the event inventory stays explicit and reviewable.

### Public-site lifecycle

OpenPanel loads after the portfolio has normalized its initial deep-link path. Screen views therefore represent the visitor-visible route rather than the temporary route used while a project overlay is being restored. Existing history-backed `/work/<id>` transitions must produce one screen view per visible route change.

## Event model

### Existing interaction events

Retain the existing event names and scalar properties for:

- profile, project, case-study, experience, writing, and TinkerVerse opens;
- selected-work intent filters;
- résumé, LinkedIn, hero, navigation, and outbound calls to action;
- timeline mode, zoom, item expansion, and mobile feature expansion;
- scroll-depth milestones.

The project wheel uses the same `project_opened` event as other Selected Work entry points, with a `source` property that distinguishes WebGL, fallback, keyboard, and project-grid activation where available. Wheel rotation and decorative motion are not tracked as analytics events.

### Screen views and sessions

OpenPanel automatically records screen views, entry and exit paths, referral context, device context, and overall session duration. The portfolio does not create its own parallel session identifier.

### Active engaged time

Emit `content_engaged` when a measurable public content surface loses visibility or closes. The payload contains:

- `content_type`: `section`, `project`, `experience`, `writing`, `profile`, or `tinkerverse`;
- `content_id`: a stable project, experience, post, modal, or section identifier;
- `section`: the visible subsection when one exists;
- `engaged_seconds`: active time rounded to the nearest five seconds;
- `device_mode`: `mobile`, `tablet`, or `desktop`.

Time accumulates only while:

1. The document is visible.
2. The portfolio window is focused.
3. At least half of the tracked surface is visible, or the surface is the active full-screen dialog.

The tracker pauses on `visibilitychange`, window blur, surface exit, or dialog deactivation. It flushes on content change, dialog close, route change, and `pagehide`. Durations below five seconds are discarded. Each emitted duration is capped at thirty minutes so abandoned tabs and lifecycle edge cases cannot dominate reports.

The tracker emits one aggregate event per completed engagement interval, not a recurring heartbeat.

## Session replay privacy

Replay is enabled only when the OpenPanel client is enabled. Configuration uses:

- `maskAllInputs: true`;
- `maskAllText: true`;
- the default replay block attribute for any explicitly excluded element;
- explicit unmasking only for reviewed, non-sensitive navigation and structural labels.

The recorder must never initialize on `/studio`, development builds, automated tests without test mode, or when the opt-out is stored. No portfolio form input is unmasked. Replay is structured interaction data, not video, and its script remains asynchronously loaded from the approved OpenPanel source.

## Disclosure and opt-out

Add a restrained analytics disclosure to the existing portfolio footer. It explains that anonymous interaction analytics and privacy-masked session replay are used to improve the portfolio and links to the analytics preference control.

The control exposes one setting: `Allow anonymous analytics`. It is on by default under the approved opt-out model. Turning it off:

1. Stores the preference locally under a portfolio-owned key.
2. Stops new explicit events immediately through the analytics boundary.
3. Reloads the public page so OpenPanel and replay restart in a fully disabled state.

Turning it on removes the opt-out and reloads the page so the client initializes normally. The control never claims to delete events that were already received by OpenPanel.

The setting must be keyboard accessible, have a visible focus state, and state whether a reload will occur.

## Failure behavior

- Analytics and replay failures are non-fatal and never block rendering or interaction.
- A missing client ID leaves all OpenPanel calls as no-ops.
- Event properties that are not scalar or whose keys case-insensitively match `name`, `first_name`, `last_name`, `full_name`, `email`, `message`, `input`, `text`, `query`, or `search` are dropped before dispatch.
- Initialization or dispatch errors appear only in development or explicit analytics debug mode.
- Duplicate screen views and duplicate engagement flushes are prevented across React Strict Mode effects and history-backed dialog transitions.
- `pagehide` uses the SDK lifecycle rather than custom synchronous requests.

## Verification

### Automated checks

- Unit-test property sanitation, disallowed-property filtering, no-op configuration, and opt-out behavior.
- Unit-test engaged-time accumulation, rounding, minimum duration, maximum duration, visibility/focus pauses, and single flush behavior.
- Verify source-level guards for production, `/studio`, missing client ID, and replay masking.
- Run the production build and existing project-wheel/HCD verification scripts affected by touched surfaces.

### Browser checks

Use a production preview with explicit test mode and a controlled test endpoint or request interception. Verify:

- one screen view for `/` and each visible `/work/<id>` transition;
- existing high-intent events dispatch once with the correct `path` and `source`;
- `content_engaged` excludes hidden or background-tab time;
- replay loads only when enabled and uses input/text masking;
- opting out stops event requests and prevents the replay module from loading after reload;
- `/studio` never initializes OpenPanel;
- no event payload includes names, email addresses, visitor-entered text, or client secrets;
- the site has no new console errors, failed first-party requests, overflow, or accessibility regressions at desktop and mobile widths.

### Real OpenPanel activation

After local verification, activation requires a real OpenPanel project client ID and an approved production environment configuration. Send a named smoke event from an approved preview or production deployment, confirm it in the OpenPanel dashboard, then verify one masked replay. Real visitor collection is not considered active until the deployed site is browser-verified.

## Non-goals

- No user identification, lead capture, authentication, revenue tracking, experimentation, or cross-device profiles.
- No custom analytics backend, database, Worker proxy, or self-hosted OpenPanel deployment in this change.
- No session replay on Portfolio Studio or other private/internal tools.
- No deployment, DNS, billing, account creation, or production-environment mutation without separate explicit authorization.
- No removal of the existing optional analytics-provider compatibility calls unless separately approved.
