# Source to sticker to portfolio

The existing repo-local sticker skill is authoritative: `.agents/skills/sticker/SKILL.md` from the repository root. Use the built-in image generator. This pipeline does not silently switch providers, use paid APIs, or generate unattended.

## Routine

1. Read `registry.json` and `catalog.mjs`. Existing selected artwork is reused. Byte-identical source and selected-PNG copies are bundled in inputs/; original paths and source hashes remain in the registry. New projects need a real supplied source, a descriptive subject, and a catalog record. Never invent hardware, metrics, a logo or a face.
2. Run `node review/home-sticker-studio/pipeline/stickers.mjs plan <project-id>` from the repository root. This resolves source and retained finish anchor, records their hashes, provides the exact image-tool call, and chooses the next unused version. Inspect both references before generation.
3. Call the built-in image tool with the returned arguments: **exactly source first, anchor second**, transparent background. If either file is missing, resolve that source; do not substitute an imagined asset. Do not send all portfolio content to the generator.
4. Inspect the actual generated PNG at full size and at card size against source and anchor. Check recognizable source geometry, readable original lettering, restrained foil, complete cream border, no transferred Self content, no added faces/text, and clear background. Reject and regenerate with a precise correction if needed. Automated checks cannot decide these visual requirements.
5. Run `node review/home-sticker-studio/pipeline/stickers.mjs accept <project-id> <absolute-generated-PNG> '<specific visual findings>'`. It rejects alpha, border, resolution failures, copies exclusively to a new numbered PNG, records prompt/references/hashes/review, and selects that revision. Previous versions remain untouched.
6. Run `node review/home-sticker-studio/pipeline/prepare.mjs`. This uses the registry selection, checks the selected hash, uses the source-qualified content snapshot, crops only empty alpha margins, and exports optimized WebPs. It never generates artwork or alters the original PNG.
7. Run `node review/home-sticker-studio/pipeline/stickers.mjs validate`, then the browser QA and capture scripts. Inspect desktop, phone, project detail, and the complete sticker collection. Source fidelity and finish remain a visual check.

When intentionally refreshing project content, run refresh-sources.mjs against the full current portfolio workspace and review the snapshot diff. Routine artwork preparation uses content-snapshot.json so unrelated source edits cannot silently change the stories.

The registry, generator log and acceptance log are provenance. `manifest.json` and `asset-QA.json` are reproducible outputs. A successful alpha check does not establish logo fidelity or physical product validation. Generation, publication and hardware operation are separate actions.

## This iteration

Eight existing selected stickers reused; six new stickers generated from existing sources and the retained holo anchor. The interactive lettering is real extruded geometry. Stickers are subdivided meshes with modest bend, tilt and lighting; their artwork is source-derived generated illustration. The project reference images inside stories are existing portfolio media.
