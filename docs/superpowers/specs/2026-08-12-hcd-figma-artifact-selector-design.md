# HCD Figma Artifact Selector

## Purpose

Create one private, standalone HTML page that helps Adi review and select the strongest human-centered-design evidence for the FamilySync / Team Care and McDonald's / Squad Up portfolio case studies.

The page is a review aid only. It does not modify Figma, the portfolio application, or any source project data.

## Scope

- Curate approximately 20–30 artifacts across both projects.
- Include four evidence groups where supported:
  - research and synthesis
  - journey maps and service blueprints
  - ideation and system flows
  - final interaction or presentation frames
- Prefer frames that communicate a distinct step in the design process; omit near-duplicates and production debris.
- Use images exported read-only from the already identified Figma sources.
- Store the HTML and its local image assets in a self-contained review-artifact directory outside the portfolio's runtime source tree.

## Interface

The page opens as a compact visual contact sheet with:

- a project filter for All, FamilySync / Care, and McDonald's / Squad Up;
- section headings for the evidence groups;
- large, readable thumbnails that preserve each source artifact's aspect ratio;
- project, evidence type, source-file, and short rationale labels;
- a checkbox on every artifact;
- Select all visible and Clear selection controls;
- a persistent selected-count summary;
- a copyable selected-items list containing artifact titles and Figma links;
- an exact Figma source link for every artifact.

Selection state persists locally in the browser with `localStorage`. No selection data leaves the computer.

## Content Rules

- Describe only what is visibly supported by the Figma artifact.
- Keep team work attributed as team work; do not infer individual authorship from slide ownership or speaker order.
- Mark draft or exploratory artifacts clearly.
- Treat the current 70-slide McDonald's deck as the authoritative presentation source, with the opportunity brief, ideation board, system map, experience board, interaction exploration, and design system as supporting process sources.
- Treat `FINAL - TEAM CARE` as the authoritative FamilySync presentation source and `Service Design - Care Bears` as its primary process board.

## Implementation

- Use plain HTML, CSS, and JavaScript so the artifact can be opened locally without a build step.
- Keep image files local and referenced with relative paths.
- Use semantic buttons, labels, checkboxes, headings, focus styles, and keyboard-operable controls.
- Provide a responsive grid that works at desktop and phone widths.
- Do not add dependencies or modify portfolio application code.

## Verification

- Confirm every referenced local image loads.
- Confirm every Figma link resolves to the intended file or node.
- Test project filtering, Select all visible, Clear selection, individual checkboxes, selected-count updates, copied summary output, and selection persistence after reload.
- Check desktop and narrow viewport layouts for overflow and readable controls.
- Confirm the portfolio worktree changes are limited to this design document and the standalone review artifact, plus the required `AGENTS.md` Codex log entry at session completion.

## Definition of Done

Adi can open one local HTML page, visually compare the curated HCD evidence, select preferred artifacts, reload without losing the selection, and copy a concise list of chosen items with their Figma source links.
