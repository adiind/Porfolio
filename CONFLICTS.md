# Merge conflict resolutions

Resolved during the `origin/main` merge on 2026-10-17. For the three FamilySync files, branch `familysync-final` is the base because it contains the newer case-study work. Main's later shared scroll-settle behavior is retained in the standalone page.

## `components/hcd/FamilySyncProjectDetail.tsx` — 2 areas

1. **Imports and dialog wrapper:** Kept the branch's `useEffect` message bridge and iframe layout. The branch's in-story Back/Close controls send messages to the wrapper; main's separate `ArrowLeft` button would duplicate that control.
2. **History and iframe handling:** Kept the branch's `historyBasePath`, origin/source-checked close and focus messages, and iframe sizing. These preserve the branch's dialog navigation and keyboard return behavior; main's simpler wrapper did not include them.

## `public/work/familysync-assets/cc.js` — 10 areas

1. **Opening card handoff:** Kept the branch's measured phone/card handoff and geometry correction, which supports its current motion design.
2. **Response-window state:** Kept the branch's clock element and timing updates, which match its phone UI.
3. **Urgency and request states:** Kept the branch's urgency colors, service swaps, inert states, and status transitions; main's simplified state update omitted these interactions.
4. **Sub-agent stages:** Kept the branch's stage thresholds and confirmation state, which coordinate with the current scroll story.
5. **Payment action target:** Kept the branch's payment-card action target, matching the branch's interactive payment card markup.
6. **Answer event before update:** Kept the branch's pre-answer `fs:answer` event because the branch motion layer listens to it.
7. **Answer event after update:** Kept the matching post-answer event for the branch motion layer's completion behavior.
8. **Answer timing and navigation:** Kept the branch's staged answer animation, focus handling, and Lenis-aware movement to Outcome.
9. **Progress rail behavior:** Kept the branch's page progress, phone-width rail tracking, color/context states, and click handling.
10. **Close, focus, and pickup controls:** Kept the branch's iframe close/focus bridge and interactive pickup acceptance; these connect to the branch wrapper and phone UI.

## `public/work/familysync-assets/story.html` — 18 areas

1. **Head assets and source notes:** Kept the branch's current source notes and consolidated `familysync.css` stylesheet. The branch stylesheet already includes the earlier base styling; main's old `cc.css` link and font preload belong to the superseded page.
2. **Standalone Back and Close controls:** Kept the branch's in-story controls, which are handled by its wrapper message bridge. Main removed them when it used an external wrapper button.
3. **Course metadata:** Kept the branch's detailed course and faculty information, which is the current case-study content.
4. **Opening agent visual:** Kept the branch's live HTML phone/agent treatment and illustration system; main used an older exported image treatment.
5. **Research artwork:** Kept the branch's research and pickup illustrations, part of its restored visual story.
6. **Synthesis lead layout:** Kept the branch's lead-row and illustration layout.
7. **Caregiver contact screen:** Kept the branch's interactive phone UI instead of main's static screenshot.
8. **Pickup acceptance screen:** Kept the branch's live acceptance control instead of main's static image.
9. **Family update screen:** Kept the branch's live update card instead of main's static image.
10. **Tension section:** Kept the branch's meeting/work illustrations.
11. **Exploration lead layout:** Kept the branch's lead-row and illustration layout.
12. **Sub-agent section accents:** Kept the branch's service glows, which are part of its current visual treatment.
13. **Sub-agent and kitchen sequence:** Kept the branch's home/kitchen scenes and animated card stack instead of main's image-only version.
14. **Payment card actions:** Kept the branch's payment-card action markup, which matches its `cc.js` behavior.
15. **Hold panel actions:** Kept the branch's payment/hold layout and action placement; main's alternate hold-action group did not match the branch script's target.
16. **Outcome section:** Kept the branch's illustrated outcome and seven-stage journey map rather than main's plain run list. The journey map is the branch's latest showpiece.
17. **Outcome answers:** Kept the branch's service marks and answer-state target, which support its visual and interactive answer flow.
18. **Navigation and scripts:** Kept the branch's rail, journey, Lenis, `cc.js`, and motion scripts. Also retained main's `/shared/scroll-settle.js?v=3` and `settle-init.js?v=1` scripts because they add the later shared auto-complete scroll behavior and use sections present in the branch story.

## Verification

- `npm run build` — passed (Vite production build completed). Vite reported its existing large-chunk advisory for a chunk over 500 kB.
- Repository-wide search (`rg --hidden`, excluding `.git`) found no merge conflict markers.
- Staging could not complete: `git add` failed to create `.git/index.lock` with `Operation not permitted`. This workspace grants read-only access to `.git`, so the resolved working-tree files remain unstaged and Git still lists the three paths as unmerged in the index.
