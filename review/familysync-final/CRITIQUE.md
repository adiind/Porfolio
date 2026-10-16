# FamilySync — final pass critique

2026-10-16. Baseline = the local working tree (brand pass + Codex pass 3), captured before any edit in `before/` at 1440, 390 and reduced motion. Benchmarks captured in `bench/` (P&G haircare, Squad Up).

## What the benchmarks do

- **Squad Up:** the left rail floats on the page surface. A thin line, small dots, one live label. Nothing boxes it in. Every section is one idea at full height with one big picture.
- **P&G:** one paper colour from top to bottom, one serif display face, one small-caps label style, and the same gap between every section. Calm because nothing changes that doesn't have to. (Its contents are a horizontal strip, not a left rail; Squad Up is the rail model.)

## Honest critique of the baseline

| # | Problem | Where | Why it matters |
|---|---|---|---|
| 1 | **The rail sits in a white side column.** `body` is white and every section is cream with a 172px left margin, so the rail reads as an admin sidebar, not Squad Up's floating rail. | All of 1440 | First impression is "web app", not case study. |
| 2 | **The journey map is a spreadsheet.** Seven equal columns, 10–12px text, service marks faded to 15% opacity until reached, a hairline emotion curve in a corner row, "Deck 14" tags under every quote, and a disclaimer paragraph under the table. The highs and lows are not visible. | Outcome | It was meant to be the showpiece. It reads as fine print. |
| 3 | **Four of five new illustrations are empty rooms.** Blank paper on a desk (Exploration), coats on hooks (Synthesis), an empty table (Tension), a second soup kitchen (Outcome). They are on-style, but say nothing, and sit as letterbox banners between a heading and its content. The Tension banner sits right under the real Tension picture (`work.webp`); the Outcome banner repeats `kitchen.webp`. | Synthesis, Tension, Exploration, Outcome | Decoration that carries no story is the "AI-slop" feeling Adi named. |
| 4 | **Colour is spent in one place.** Navy + cream everywhere, then all the service colour is packed into My part and Testing. Kickers are clay on clay. Exploration's three directions are white pills on cream (almost invisible). | Research → Exploration | "More colour" is really "colour that means something, everywhere". |
| 5 | **Five stylesheets fight each other.** `cc.css → polish.css → motion.css → brand.css → pass3.css`, each overriding the last (three different kicker colours, two rail systems, `!important` patches). | Code | No single colour, type or spacing system to hold on to. |
| 6 | **Section rhythm is uneven.** Section tops range from 24px (Synthesis) to 140px (Research); h2 sizes vary by section. | All | P&G's calm comes from an even beat. |
| 7 | **The handoff phone overlaps the Context headline** for part of the scroll at 1440 (the phone parallax outruns the hero). | Hero → Context | Visible collision. |

What already works and stays: the hero phone handoff, the 11:00 → 11:03 response window, the relay phone, the four-card sub-agent stack (incl. "Confirming cart with Stacy!"), the "Instacart ingredient list" cart, plain-text "Default Payment: Visa ending 1234", the gold sweep + green check, and the real service marks.

## Three directions

**Safe — "Tidy up".** White column removed, journey table re-typed bigger, banners removed, one stylesheet. Low risk; still reads as a table.

**Bold — "One afternoon, one colour code".** Every colour on the page belongs to a service in the story: school amber, calendar blue, Pinterest red, Instacart green, payment gold, with FamilySync navy as the agent. Each section's kicker, rail dot and accents take the colour of the part of the afternoon it's about. The journey map becomes a pinned stage: a big clock that steps 11:00 → 15:00, three lanes (Stacy, FamilySync, Services) and Stacy's emotional curve drawn across them as you scroll, with the low point and the high point marked and coloured, and real marks popping in at full colour. One motion language: things draw along a line or settle into place, never bounce.

**Wild — "Scroll the afternoon sideways".** Turn the whole page into one horizontal timeline that pins and scrolls sideways from 11:00 to 15:00. Most dramatic; breaks the rail model shared with Squad Up and P&G, is hard on 390, and risks the reduced-motion and overflow rules.

**Pick: Bold.** It answers all four asks (rich, more colour, matching rail, journey as showpiece) without new invented content, keeps every brand-pass beat, and stays inside the one Lenis + ScrollTrigger setup. Safe doesn't fix "weak"; Wild fights the benchmarks.

## Illustrations: replace, not regenerate

None of the nine images is off-style; all share the gouache, amber + navy look of the style reference. The problem is purpose, not style. So the empty banners are **removed** rather than regenerated: the page keeps the five pictures that carry the story (research interview, pickup, parent at work, home, kitchen). This also avoids chaining new generations from old ones. If Adi wants a new picture in Exploration later, it should come fresh from `public/images/familysync/tests/styles/03-editorial-a-hero.png` with a scene that shows real work (sketches of the three directions), not an empty desk.
