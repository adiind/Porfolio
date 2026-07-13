# Glyph portfolio asset provenance

This case-study implementation intentionally uses no raster product imagery.

## Quarantined — not rendered

| Portfolio asset | Source classification | Publication status |
| --- | --- | --- |
| `public/images/glyph_hero.png` | Unverified synthetic/concept marketing image | Do not use as build evidence |
| `public/images/glyph_sleeve.png` | Unverified synthetic/concept product image | Do not use as build evidence |
| `public/images/glyph_body_angled.png` | Unverified synthetic/concept product image | Do not use as build evidence |
| `public/images/glyph_side_module.png` | Unverified synthetic/concept product image | Do not use as build evidence |

The files remain in place for Adi to review; the portfolio data and renderers no longer reference them.

## Rendered visuals

| Visual | Classification | Source |
| --- | --- | --- |
| Two-model hero sketch | Diagram | Inline SVG in `components/GlyphProjectDetail.tsx`; explicitly labeled as not product evidence |
| Selected-work card sketch | Diagram | Inline SVG in `components/ProjectCard.tsx` |
| Gesture sequence | Diagram | Current `firmware/glyph-lights-demo/README.md` behavior, rendered with HTML/CSS |
| System path | Diagram | Verified canonical hardware + current firmware/dashboard architecture, rendered with HTML/CSS |

Authentic looks-like and works-like photos remain required before the case study is publish-ready.
