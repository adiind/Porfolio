# HCD Figma Artifact Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one populated local HTML contact sheet for assessing and selecting Care and McDonald's HCD evidence.

**Architecture:** A standalone review directory contains `index.html`, local image assets, and a Node verification script. Artifact metadata is embedded in the HTML so it opens without a server or build step; selection state is stored in `localStorage`.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js verification, read-only Figma exports.

## Global Constraints

- Do not change Figma or portfolio runtime code.
- Keep all images local and all Figma sources directly linked.
- Attribute team work as team work.
- Support desktop and phone layouts, keyboard operation, persistent selection, filters, and copied selection output.

---

### Task 1: Verification contract

**Files:**
- Create: `review/hcd-figma-selector/verify.mjs`

**Interfaces:**
- Consumes: `review/hcd-figma-selector/index.html` and `review/hcd-figma-selector/assets/*`
- Produces: exit code 0 only when required content, controls, source links, and local assets exist

- [ ] Write checks for both projects, four evidence categories, at least 20 artifacts, local assets, Figma URLs, filters, selection controls, persistence, and copied output.
- [ ] Run `node review/hcd-figma-selector/verify.mjs` and confirm it fails because the page is absent.

### Task 2: Curated source assets

**Files:**
- Create: `review/hcd-figma-selector/assets/*`

**Interfaces:**
- Consumes: exact Figma file keys and node IDs from the read-only discovery pass
- Produces: stable local PNG/JPG exports referenced by the gallery

- [ ] Export distinct research, journey, ideation, system-flow, and final-interface evidence from the authoritative and supporting Care and McDonald's files.
- [ ] Confirm each file is a valid non-empty image.

### Task 3: Standalone selector page

**Files:**
- Create: `review/hcd-figma-selector/index.html`

**Interfaces:**
- Consumes: local assets and embedded artifact metadata
- Produces: filters, checkbox selection, selection count, persistent state, direct source links, and copied assessment list

- [ ] Implement semantic structure and the editorial research-wall visual system.
- [ ] Implement project/category filtering, Select visible, Clear, local persistence, and clipboard/fallback export.
- [ ] Run `node review/hcd-figma-selector/verify.mjs` and confirm it passes.

### Task 4: Browser verification

**Files:**
- Verify: `review/hcd-figma-selector/index.html`

**Interfaces:**
- Consumes: final local page
- Produces: evidence for desktop/mobile layout and functional interaction completion

- [ ] Serve the directory locally and test initial load, filters, individual selection, select visible, clear, copied output, persistence after reload, image loading, and console errors.
- [ ] Repeat the layout and overflow check at a phone viewport.
- [ ] Run the verifier once more after browser testing.
