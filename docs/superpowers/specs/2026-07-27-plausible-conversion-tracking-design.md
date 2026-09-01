# Plausible conversion tracking

## Purpose

Measure whether real portfolio visitors take meaningful next steps, without treating bot traffic or micro-interactions as success.

## Scope

- Keep Cloudflare Browser Insights for page-performance telemetry.
- Add Plausible to `adidesign.org` for visitor, source, page, outbound-link, file-download, and goal reporting.
- Record the existing high-intent actions as goals: `resume_viewed`, `linkedin_clicked`, `project_opened`, and `case_study_opened`.
- Do not send names, email addresses, IP addresses, persistent identifiers, or event properties that could identify a visitor.

## Design

1. Load Plausible's tracker once from the document head, configured for `adidesign.org` with outbound-link and file-download measurement enabled.
2. Retain the existing `trackEvent` helper. It already calls `window.plausible` and includes only the route plus supplied scalar properties.
3. Keep Cloudflare/Zaraz, PostHog, and Umami calls optional so the helper remains compatible with those tools, but Plausible is the only configured provider in this change.
4. In Plausible, register the four event names as goals and use its standard dashboard for visitors, sources, pages, goal completions, and goal conversion rate.

## Verification

- Add a focused unit test for the Plausible dispatch path and privacy filtering.
- Build the Vite app.
- In a browser, trigger each tracked goal and confirm exactly one Plausible event request per interaction, with no personally identifiable information in the request payload.
- Confirm the Cloudflare RUM beacon remains present.

## Non-goals

- No custom Worker endpoint, database, or identity tracking.
- No deployment, billing, or Plausible-account changes without separate approval.
