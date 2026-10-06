# 2026 resume

September 30 leadership update: Added user-confirmed Camp EDI Camp Lead and Bambu Lab ambassadorship under Leadership & Prototyping, replacing the Snapdeal award while retaining TEDx Stage Design Head and ASEAN Top 10. Camp workshop scope is grounded in `Camp EDI/Camp Calendar/README.md` and its workshop record; Bambu's School Ambassador naming, lab upgrades and training scope are recorded in `Documents/Bambu/data/dashboard.json`. Used 2026 for Camp and no unverified ambassador start date or participant count. Kept font sizes unchanged and adjusted spacing; the local one-page PDF passed visual and two-parser review. Not published.

The public download is `public/Adi_Agarwal_Resume_2026.pdf`. Its editable content is in `data/resume-2026.json`; `scripts/build-resume.py` generates the PDF with ReportLab and Arial fonts. Set `RESUME_FONT_DIR` if the Arial TTF files are elsewhere.

## Content and layout update, September 29, 2026

September 30 follow-up: The user supplied more specific Self internship contributions and requested their inclusion: co-prototyping agent-native privacy and payments products with engineers; agent workflows, context management, evaluations, human checkpoints and progress dashboards; and a system connecting journey mapping, clickstream event handoff and reporting with MCP-generated dashboards. These replace the earlier general-only Self bullets. The rebuilt local PDF remains one page with the same font sizes; rendering and both text parsers passed. This follow-up has not been published.

- Repositioned the headline for product manager roles, with AI product development and analytics as supporting strengths.
- Tightened experience and project bullets to foreground scope, ownership, and evidence while preserving the source-supported metrics and partner wording.
- Reduced inline emphasis and increased type leading and section spacing to make the one-page layout easier to scan.
- Regenerated and checked the local PDF. This update has not been published.

```sh
python3 scripts/build-resume.py
python3 scripts/verify-resume.py
```

After editing, check that the PDF remains one page and inspect a rendered page before publishing. The 2025 PDF is retained for reference. The shared `SOCIAL_LINKS.resume` constant supplies both public resume links.

## Content decisions, September 24, 2026

- The user confirmed self.xyz, AI Product Manager, internship from June through August 2026, coding with developers across multiple agentic products, and multi-step agent pipeline creation. The resume and timeline use general descriptions without product names, use cases, internal architecture, launch claims, or invented outcomes.
- Claude Code, Codex, and RAG were explicitly requested and appear in both the resume and profile toolkit.
- Self Defense Society and Rightbiotic were removed from the resume. Their historical education details elsewhere on the site were outside the resume removal request.
- The user corrected the existing portfolio record: Squad Up was developed WITH McDonald's as a project partner. The earlier "not affiliated" claim was wrong. Partnership and product implementation are separate facts; describe the designed/prototyped experience without asserting a launch or definite non-launch.
- The user clarified FamilySync as an agentic payments service for caregivers. All three academic partner projects should communicate human-centered research, synthesis, design, and prototyping, not merely interface features.
- P&G is given two substantive bullets covering the verified five-person team, 8 in-home visits, 2 central-site rounds, and 10 bottle form studies, plus research synthesis, requirements, and iterative testing. General methods are supported by the prior resume and portfolio; no confidential solution or novel consumer insight is disclosed. P&G uses 2025 instead of the old ongoing date; Northwestern retains the resume's 2025-Present rather than inferring a graduation date from the site's older timeline.
- Existing employment dates and metrics come from the prior resume; the Edge AI award uses the portfolio's corrected ASEAN-wide wording.

## ATS compatibility

- The PDF contains selectable text with embedded Arial fonts, a single-column reading flow, standard section headings including Skills, and no images or text boxes.
- Role titles and dates share one paragraph. This prevents the PDFMiner extraction issue observed with the former right-aligned metadata, where dates appeared inside bullet sentences. Contact details, education, and achievements follow the same linear pattern.
- Bullet glyphs use the embedded font with Unicode mapping. This fixes the previous DEL/control-character extraction from the default bullet font.
- `scripts/verify-resume.py` checks every content block and its sequence using both pypdf and PDFMiner, verifies role/date/bullet associations, and rejects nonprinting characters, extra pages, images, encryption, or an oversized file. These are local compatibility checks, not a claimed test against every employer's ATS.
- The final layout was also rendered and inspected. The file remains one page and approximately 69 KB.
- Formatting was reviewed against [Greenhouse's official parsing guidance](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse).

## Publication, September 24, 2026

Published to the existing Cloudflare Worker `portfolio`, version `8884f8f9-7726-47c3-9edd-6c46e61fd42f`, after production build, 31 analytics tests, HCD/project-paint/project-wheel/Codex-mark guards, startup browser smoke, and Wrangler dry-run.

- Public resume: https://adidesign.org/Adi_Agarwal_Resume_2026.pdf
- Independently verified that both `adidesign.org` and `portfolio.kriitya.workers.dev` serve the current main bundle and the byte-identical final PDF.
- PDF SHA-256: `569b9c9d052b04622e532d2f48e1683e7541d76ef81c6bead8dbd9641c4eeb43`.

## Research for the corrected framing

- [IDEO: Design thinking](https://designthinking.ideo.com/): human needs, technical feasibility, and business viability; iterative making and testing. Used to clarify the design lens, not as evidence of the user's specific actions or an IDEO affiliation.
- [Northwestern: P&G-sponsored Human-Centered Design studio](https://design.northwestern.edu/engineering-design-innovation/inside-our-program/stories/2023/bringing-sustainability-into-human-centered-design.html): confirms the studio's real product-innovation sponsorship and observation, visualization, prototyping, and iteration. The 2023 article is program context, not a record of the user's 2025 project.
- Existing P&G portfolio guidance in the local course materials recommends explaining skills, process, contributions, and abstract research counts while keeping confidential product details out of public artifacts.
