# P&G Project Clean Merge and Release

## Goal
Restore the selected P&G sponsored project in the portfolio Projects list and publish it with thumbnail direction 02, while retaining the live Muse mark and excluding unrelated local work.

## Scope
- Start from current GitHub `main`, which already includes the selected thumbnail asset.
- Integrate only the P&G project data, Selected Work entry, project detail route, P&G detail component/style/data, and necessary public-safe P&G assets.
- Point the project card to `public/images/pg-design-project.jpg` (selected thumbnail with P&G sponsored badge).
- Preserve NDA-safe wording and only confirmed public metric (8 in-home visits); omit unconfirmed team size, bottle counts, and personal-role claims.
- Preserve existing Muse logo/source files. Exclude Lawn and all unrelated local modifications.

## Steps
1. Create an isolated feature branch from latest `main` in `/private/tmp/pg-thumb-git`.
2. Integrate the P&G data and detail route, bring over required P&G-only components and public-safe assets, and point the thumbnail at the selected asset.
3. Review the exact diff for project listing/lookup, route behavior, branding, confidentiality, and accidental unrelated files.
4. Run `npm run build` and inspect the rendered desktop/mobile portfolio card and P&G detail page; confirm the Muse mark remains present.
5. Commit and push the feature branch, open a focused PR to `main`, inspect its exact diff, and merge it as explicitly requested.
6. Allow GitHub's existing Cloudflare publication path to build the merged `main`; verify live project card, thumbnail, detail route, and Muse mark on `adidesign.org`.
7. Append one newest-first item to the root `## Codex` section documenting the verified result.

## Completion evidence
- Clean scoped Git diff and successful production build.
- Rendered local card/detail and verified no mobile overflow or broken images.
- Merged PR/commit on GitHub `main`.
- Fresh live checks confirm P&G project and Muse mark are both present.
