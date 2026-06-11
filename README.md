# Adi Agarwal - Portfolio

This is the source for my personal portfolio: [adiagarwal.com](https://adiagarwal.com).

I designed and built this site to show my technical range across product analytics, frontend engineering, AI systems, interaction design, service design, embedded systems, and physical prototyping. It is not a starter template or a generic project README. The portfolio itself is part of the work: a live, interactive proof of how I think, build, test, and explain complex systems.

## What This Portfolio Shows

- Product analytics and experimentation across growth, revenue, supply-chain, marketplace, and consumer-product contexts.
- Frontend engineering through a responsive React and TypeScript interface with animated timelines, layered modals, custom scroll behavior, reusable UI primitives, and polished interaction states.
- AI and agentic systems through Zero, a second-brain assistant with voice/chat UX, structured memory, tool routing, Home Assistant integration, image generation, coding loops, and prompt-injection guardrails.
- Service and interaction design through Northwestern EDI work, including FamilySync for JPMorgan Chase and a McDonald's group-ordering concept.
- Hardware and making through embedded systems, ESP32/Arduino, MQTT, CAD, 3D printing, kinetic mechanisms, local voice recognition, and physical prototypes.
- Human-AI development workflow through agent-assisted coding, browser verification, content iteration, and asset generation.

## Featured Work

| Area | Work | What it demonstrates |
| --- | --- | --- |
| AI systems | Zero - Second Brain AI Assistant | Voice/chat UX, memory design, tool routing, Home Assistant integration, image generation, and guarded agent behavior. |
| Service design | FamilySync - JPMorgan Chase | Agentic caregiver service design, permissions, privacy framing, shared authority, and scenario testing. |
| Interaction design | McDonald's Group Ordering | Shared cart ownership, invite flows, review readiness, split-oriented checkout, and coordination UX. |
| Embedded AI + IoT | Jarvis | Local voice recognition, MQTT, embedded C++, Home Assistant automation, and physical feedback design. |
| Physical computing | Surya, Helios, SoloPump, Plotter | CAD, 3D printing, mechanical systems, electronics, calibration logic, and kinetic product prototyping. |
| Portfolio build | This site | React, TypeScript, Vite, Framer Motion, Tailwind utility styling, analytics instrumentation, and agentic build workflows. |

## Technical Stack

- Frontend: React 19, TypeScript, Vite, Framer Motion, Radix UI primitives, lucide-react, class-variance-authority, Tailwind CDN utilities, and custom component patterns.
- Interaction systems: Responsive timeline layouts, project detail modals, writing modals, keyboard-accessible cards, hover previews, scroll-state hooks, and mobile gesture handling.
- Content model: JSON-driven project, timeline, writing, and Instagram data that keeps case studies structured and easy to update.
- Analytics: A vendor-neutral tracking wrapper for Zaraz, PostHog, Plausible, and Umami.
- Workflow tooling: Notion sync scripts, Vite build/preview commands, local browser checks, and an agent-maintained session log in `AGENTS.md`.

## Repository Map

- `App.tsx` - Main application shell, section state, intro flow, and global modal coordination.
- `components/` - Portfolio UI, including hero, timeline, project cards, project details, writings, profile, navigation, and shared UI primitives.
- `data/` - Structured portfolio content for timeline items, selected work, posts, project case studies, and synced external data.
- `writing/posts/` - Long-form writing shown in the Writings section.
- `lib/analytics.ts` - Custom analytics event helper.
- `scripts/notion-sync.cjs` - Notion task/content sync workflow used during development.
- `public/images/` - Portfolio imagery, case-study assets, screenshots, and prototype visuals.

## Running Locally

```sh
npm install
npm run dev
```

`npm run dev` pulls fresh Notion data first, then starts the Vite dev server on `localhost:3000`.

Useful commands:

- `npm run build` - Create a production build.
- `npm run preview` - Preview the production build locally.
- `npm run sync:pull` - Pull fresh Notion data.
- `npm run sync:push` - Push local task changes back to Notion.
- `npm run sync:list` - List cached Notion tasks.
- `npm run sync:status` - Check pending Notion sync state.

## Contact

- Website: [adiagarwal.com](https://adiagarwal.com)
- LinkedIn: [linkedin.com/in/adiagarwal](https://linkedin.com/in/adiagarwal)
