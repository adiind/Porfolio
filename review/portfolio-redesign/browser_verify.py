#!/usr/bin/env python3
"""Task-scoped source and browser verification for the portfolio redesign."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from pathlib import Path
from statistics import median

from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError, sync_playwright


ROOT = Path(__file__).resolve().parents[2]
HERO_PATH = ROOT / "components" / "Hero.tsx"
GLASS_PATH = ROOT / "components" / "ui" / "GlassSurface.tsx"
MAT_PATH = ROOT / "components" / "ui" / "CuttingMatSurface.tsx"
GITHUB_ACTIVITY_PATH = ROOT / "components" / "GitHubActivity.tsx"
VITE_CONFIG_PATH = ROOT / "vite.config.ts"
TIMELINE_DATA_PATH = ROOT / "data" / "timeline.ts"
TYPES_PATH = ROOT / "types.ts"
EXPERIENCE_DETAIL_PATH = ROOT / "components" / "ExperienceDetail.tsx"
TIMELINE_EVENT_PATH = ROOT / "components" / "TimelineEvent.tsx"
MOBILE_TIMELINE_PATH = ROOT / "components" / "MobileTimeline.tsx"
TINKERVERSE_MODAL_PATH = ROOT / "components" / "TinkerVerseModal.tsx"
PROJECTS_SECTION_PATH = ROOT / "components" / "ProjectsSection.tsx"
APP_PATH = ROOT / "App.tsx"
PROFILE_MODAL_PATH = ROOT / "components" / "ProfileModal.tsx"
VERTICAL_NAV_PATH = ROOT / "components" / "VerticalNavbar.tsx"
FOOTER_PATH = ROOT / "components" / "PortfolioFooter.tsx"
DEFAULT_BASE_URL = "http://127.0.0.1:4173/"
FOOTER_STATEMENT = "Made with AI and my own skills—an ongoing experiment, not a final measure of either."


def built_revision_and_count(evidence) -> tuple[str, int]:
    """Resolve the exact count for the immutable revision embedded in a build."""
    revision = evidence.get_attribute("data-built-revision") or ""
    assert re.fullmatch(r"[0-9a-f]{40}", revision), (
        f"GitHub evidence does not expose a full build revision: {revision!r}"
    )
    count = int(
        subprocess.check_output(
            ["git", "rev-list", "--count", revision], cwd=ROOT, text=True
        ).strip()
    )
    return revision, count


def assert_mobile_hero_receipt_spacing(page: Page, label: str) -> dict[str, object]:
    """Keep mobile tool marks/card clear of CTAs, arcs, nav, and bottom cue."""
    page.wait_for_function(
        """() => {
            let node = document.querySelector('[data-github-evidence]');
            if (!node) return false;
            let effectiveOpacity = 1;
            while (node instanceof HTMLElement) {
                const style = getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
                effectiveOpacity *= Number(style.opacity || 1);
                node = node.parentElement;
            }
            return effectiveOpacity >= 0.95;
        }""",
        timeout=4_000,
    )
    marks = page.locator("[data-tool-marks]:visible [data-tool-mark]")
    assert marks.count() == 3
    mark_boxes = [marks.nth(index).bounding_box() for index in range(marks.count())]
    assert all(mark_boxes), f"{label}: a tool mark is not measurable"

    ctas = (
        page.get_by_role("button", name="View selected work", exact=True),
        page.get_by_role("link", name="Resume", exact=True),
        page.get_by_role("link", name="LinkedIn", exact=True),
    )
    cta_boxes = [cta.bounding_box() for cta in ctas]
    assert all(cta_boxes), f"{label}: a hero CTA is not measurable"

    def separated(first: dict[str, float], second: dict[str, float], gap: float) -> bool:
        return (
            first["x"] + first["width"] + gap <= second["x"]
            or second["x"] + second["width"] + gap <= first["x"]
            or first["y"] + first["height"] + gap <= second["y"]
            or second["y"] + second["height"] + gap <= first["y"]
        )

    for mark_box in mark_boxes:
        assert mark_box
        assert all(separated(mark_box, cta_box, 12) for cta_box in cta_boxes if cta_box), (
            f"{label}: tool marks lack a 12px gap from hero CTAs; marks={mark_boxes}, ctas={cta_boxes}"
        )

    evidence = page.locator("[data-github-evidence]:visible")
    evidence_box = evidence.bounding_box()
    cue_box = page.get_by_role("button", name="Explore timeline").bounding_box()
    mat_box = page.locator("[data-cutting-mat-surface]").first.bounding_box()
    assert evidence_box and cue_box and mat_box
    evidence_bottom = evidence_box["y"] + evidence_box["height"]
    mat_bottom = mat_box["y"] + mat_box["height"]
    assert evidence_bottom + 12 <= cue_box["y"], (
        f"{label}: Git evidence crowds the bottom cue; evidence={evidence_box}, cue={cue_box}"
    )
    assert evidence_bottom + 12 <= mat_bottom, (
        f"{label}: Git evidence leaves the mat safe area; evidence={evidence_box}, mat={mat_box}"
    )

    arc_targets = page.locator(
        "[data-discipline-arcs]:visible [data-project-node], "
        "[data-discipline-arcs]:visible [data-discipline-option]"
    )
    protected_boxes = [
        arc_targets.nth(index).bounding_box() for index in range(arc_targets.count())
    ] + [
        page.locator('#profile [role="button"][aria-label="View profile"]').bounding_box(),
        page.locator("nav[aria-label='Sections']:visible").bounding_box(),
    ]
    assert all(protected_boxes)
    for mark_box in mark_boxes:
        assert mark_box
        assert all(separated(mark_box, target_box, 0) for target_box in protected_boxes if target_box), (
            f"{label}: tool marks collide with arcs, avatar, or navigation"
        )

    return {
        "marks": mark_boxes,
        "ctas": cta_boxes,
        "evidence": evidence_box,
        "cue": cue_box,
        "mat": mat_box,
    }


def verify_source_contract() -> None:
    failures: list[str] = []
    hero_source = HERO_PATH.read_text(encoding="utf-8")

    if not GLASS_PATH.is_file():
        failures.append("GlassSurface.tsx is missing")
    if not MAT_PATH.is_file():
        failures.append("CuttingMatSurface.tsx is missing")
    if re.search(r"const\s+CuttingMatSurface\s*[:=]", hero_source):
        failures.append("Hero.tsx still owns a private CuttingMatSurface renderer")
    if "from './ui/CuttingMatSurface'" not in hero_source:
        failures.append("Hero.tsx does not consume the shared CuttingMatSurface")

    if failures:
        raise AssertionError("Source contract failed:\n- " + "\n- ".join(failures))

    print("Source contract verified: shared glass and measured cutting-mat primitives exist.")


def verify_task2_source_contract() -> None:
    failures: list[str] = []
    github_source = GITHUB_ACTIVITY_PATH.read_text(encoding="utf-8")
    hero_source = HERO_PATH.read_text(encoding="utf-8")
    vite_source = VITE_CONFIG_PATH.read_text(encoding="utf-8")

    if "api.github.com" in github_source or "per_page=100" in github_source:
        failures.append("GitHub evidence still infers totals from a capped runtime API response")
    if "Build Activity" in github_source:
        failures.append("GitHub evidence still contains the rejected Build Activity label")
    if re.search(r"\{[^\n}]*totalCommits[^\n}]*\}\+|\d+\+\s+commits", github_source):
        failures.append("GitHub evidence still renders an inexact plus-suffixed count")
    if "__PORTFOLIO_COMMIT_COUNT__" not in github_source:
        failures.append("GitHub evidence does not consume the build-time commit count")
    if "__PORTFOLIO_REVISION__" not in github_source or "data-built-revision" not in github_source:
        failures.append("GitHub evidence does not expose the build revision used by its count and chart")
    if "__PORTFOLIO_GIT_ACTIVITY__" not in github_source:
        failures.append("GitHub evidence does not consume build-time activity buckets")
    if "rev-parse" not in vite_source or "rev-list" not in vite_source or "--count" not in vite_source:
        failures.append("Vite does not pin and count one exact Git build revision")
    if "getPortfolioGitActivity(portfolioRevision)" not in vite_source or "git', ['log', revision" not in vite_source:
        failures.append("Vite does not derive dated activity buckets from the pinned build revision")
    for marker, message in (
        ("data-contribution-chart", "The GitHub contribution-history chart is missing"),
        ("data-contribution-cell", "The GitHub contribution-history cells are missing"),
        ("data-exact-commit-count", "The exact commit number is not exposed as the main evidence"),
    ):
        if marker not in github_source:
            failures.append(message)
    if "data-tool-marks" not in github_source:
        failures.append("The standalone accessible tool-mark group is missing")
    if hero_source.count("data-discipline-arcs") != 1:
        failures.append("Hero must render exactly one shared discipline/project arc composition")
    if "data-arc-path=\"inner\"" not in hero_source or "data-arc-path=\"outer\"" not in hero_source:
        failures.append("Hero must expose exactly two nested partial arc paths")
    if "data-arc-role=\"discipline\"" not in hero_source or "data-arc-role=\"project\"" not in hero_source:
        failures.append("Disciplines and projects are not assigned to separate nested arcs")
    if "data-wheel-layout=\"orbit\"" in hero_source or "data-wheel-layout=\"static\"" in hero_source:
        failures.append("Hero still contains a rejected full-orbit/static-strip layout")
    if "overflow-x-auto" in hero_source:
        failures.append("Hero still contains a rejected horizontal wheel strip")
    if "useReducedMotion" not in hero_source:
        failures.append("Wheel layout is not conditionally rendered from the reduced-motion preference")
    if "data-project-fallback" not in hero_source:
        failures.append("Project nodes do not provide stable local/text fallbacks")
    if "verticalMarquee" in hero_source or "[...skillsTimelineData, ...skillsTimelineData]" in hero_source:
        failures.append("Hero still duplicates focusable controls in a vertical marquee")

    for mark in ("codex.svg", "claude.svg"):
        if not (ROOT / "public" / "images" / "tool-marks" / mark).is_file():
            failures.append(f"Missing standalone tool mark: {mark}")

    codex_mark = (ROOT / "public" / "images" / "tool-marks" / "codex.svg").read_text(encoding="utf-8")
    if 'viewBox="0 0 24 24"' not in codex_mark or 'data-codex-mark="current"' not in codex_mark:
        failures.append("Codex tool mark is not the current square Codex app mark")

    if failures:
        raise AssertionError("Task 2 source contract failed:\n- " + "\n- ".join(failures))

    print("Task 2 source contract verified: exact Git history evidence and one two-arc exploration model.")


def verify_task3_source_contract() -> None:
    """Verify the data and rendering contracts that protect Task 3 behavior."""
    failures: list[str] = []
    timeline_source = TIMELINE_DATA_PATH.read_text(encoding="utf-8")
    types_source = TYPES_PATH.read_text(encoding="utf-8")
    experience_source = EXPERIENCE_DETAIL_PATH.read_text(encoding="utf-8")
    timeline_event_source = TIMELINE_EVENT_PATH.read_text(encoding="utf-8")
    mobile_timeline_source = MOBILE_TIMELINE_PATH.read_text(encoding="utf-8")

    for project_id in ("familysync-jpmorgan", "mcdonalds-interaction-design"):
        if f'projectId: "{project_id}"' not in timeline_source:
            failures.append(f"Northwestern is missing linked project box {project_id}")

    expected_media = (
        "bidet-design-concept.webp",
        "bidet-handle-concept.webp",
    )
    for filename in expected_media:
        if filename not in timeline_source:
            failures.append(f"Modular Water Closet does not reference {filename}")
        if not (ROOT / "public" / "images" / "bits" / filename).is_file():
            failures.append(f"Missing optimized BITS concept render {filename}")

    if "projectId?: string" not in types_source:
        failures.append("FeatureCard does not expose a linked portfolio project ID")
    if "media?: FeatureCardMedia[]" not in types_source:
        failures.append("FeatureCard does not expose a labeled media gallery")
    if "data-linked-project-id" not in experience_source:
        failures.append("Desktop feature cards do not expose linked rich project behavior")
    if "data-feature-media" not in experience_source:
        failures.append("Desktop feature details do not render labeled media")
    if "data-linked-project-id" not in mobile_timeline_source:
        failures.append("Mobile feature cards do not expose linked rich project behavior")
    if "data-feature-media" not in mobile_timeline_source:
        failures.append("Mobile feature details do not render labeled media")
    if "data-full-timeline-title" not in timeline_event_source:
        failures.append("Desktop timeline titles do not expose the full-title wrapping contract")
    if "data-full-feature-title" not in experience_source:
        failures.append("Desktop feature cards do not expose the full-title wrapping contract")

    if failures:
        raise AssertionError("Task 3 source contract failed:\n- " + "\n- ".join(failures))

    print("Task 3 source contract verified: Northwestern links, BITS media, and full-label rendering exist.")


def verify_task5_source_contract() -> None:
    """Protect the image-led TinkerVerse journal and its timeline entry points."""
    failures: list[str] = []
    app_source = APP_PATH.read_text(encoding="utf-8")
    modal_source = TINKERVERSE_MODAL_PATH.read_text(encoding="utf-8")
    timeline_event_source = TIMELINE_EVENT_PATH.read_text(encoding="utf-8")
    mobile_timeline_source = MOBILE_TIMELINE_PATH.read_text(encoding="utf-8")

    required_modal_contracts = {
        "TINKERVERSE_JOURNAL": "The modal does not consume the durable journal manifest",
        "GlassSurface": "The modal does not use the shared glass primitive",
        "CuttingMatSurface": "The modal does not use the shared cutting-mat primitive",
        "data-journal-lead": "The modal is missing one large lead artifact",
        "data-journal-grid": "The modal is missing the curated field-note grid",
        "data-journal-entry": "The modal is missing journal-entry surfaces",
        "data-journal-media": "The modal is missing image-led journal media",
        "data-journal-status": "The modal is missing truthful status labels",
        "data-journal-fallback": "The modal is missing an offline/local fallback state",
        "data-journal-project": "The modal is missing verified project routes",
        "data-follow-instagram": "The modal is missing the restrained Instagram CTA",
    }
    for marker, message in required_modal_contracts.items():
        if marker not in modal_source:
            failures.append(message)

    if "post.likes" in modal_source or "post.comments" in modal_source:
        failures.append("The modal still renders the legacy like/comment meter")
    if "<video" in modal_source or "autoPlay" in modal_source:
        failures.append("The journal must use still thumbnails and never autoplay video")

    for source, label in (
        (timeline_event_source, "Desktop timeline"),
        (mobile_timeline_source, "Mobile timeline"),
    ):
        if "TINKERVERSE_JOURNAL" not in source:
            failures.append(f"{label} does not consume the journal manifest")
        if "data-tinkerverse-preview" not in source:
            failures.append(f"{label} lacks an image-led TinkerVerse preview")

    if 'data-timeline-lanes="education-experience-tinkerverse"' not in app_source:
        failures.append("Desktop timeline does not expose the restored three-lane order")
    for lane in ("education", "experience", "tinkerverse"):
        if f'data-timeline-lane="{lane}"' not in app_source:
            failures.append(f"Desktop timeline is missing its full {lane} lane")
    if "TinkerVerse below" in app_source or "supporting maker/community module" in app_source:
        failures.append("Desktop TinkerVerse is still demoted to a supporting bottom bar")

    tinkerverse_position = mobile_timeline_source.find("{tinkerverse &&")
    education_position = mobile_timeline_source.find("renderSection('Education'")
    experience_position = mobile_timeline_source.find("renderSection('Experience'")
    if not (
        tinkerverse_position >= 0
        and education_position >= 0
        and experience_position >= 0
        and tinkerverse_position < education_position < experience_position
    ):
        failures.append("Mobile timeline does not restore TinkerVerse before Education and Experience")

    if failures:
        raise AssertionError("Task 5 source contract failed:\n- " + "\n- ".join(failures))

    print("Task 5 source contract verified: image-led journal, truthful evidence, and project routes exist.")


def verify_task6_source_contract() -> None:
    """Protect the direct visitor-intent opening and unified work mat."""
    failures: list[str] = []
    source = PROJECTS_SECTION_PATH.read_text(encoding="utf-8")

    if ">\n                            Selected Work\n" in source or "Start with the capability you need to see." in source:
        failures.append("Selected Work still uses the rejected heading/subheading")
    if "I want to see how Adi…" not in source:
        failures.append("The direct visitor-intent opening is missing")
    if "CuttingMatSurface" not in source:
        failures.append("Selected Work does not consume the shared cutting mat")
    if "data-selected-work-mat" not in source:
        failures.append("Filters, cue/count, and grid are not integrated on one mat")
    if "data-project-intent" not in source:
        failures.append("Intent controls do not expose a stable interaction contract")
    if "data-visible-project-count" not in source:
        failures.append("The current project count is not exposed within the mat")

    if failures:
        raise AssertionError("Task 6 source contract failed:\n- " + "\n- ".join(failures))

    print("Task 6 source contract verified: direct intent controls and complete work grid share one measured mat.")


def verify_task7_source_contract() -> None:
    """Protect the approved shell, footer, and public-flow boundaries."""
    failures: list[str] = []
    app_source = APP_PATH.read_text(encoding="utf-8")
    profile_source = PROFILE_MODAL_PATH.read_text(encoding="utf-8")
    nav_source = VERTICAL_NAV_PATH.read_text(encoding="utf-8")

    if not FOOTER_PATH.is_file():
        failures.append("PortfolioFooter.tsx is missing")
    elif FOOTER_STATEMENT not in FOOTER_PATH.read_text(encoding="utf-8"):
        failures.append("PortfolioFooter does not contain the exact approved statement")
    if "PortfolioFooter" not in app_source:
        failures.append("App does not mount the portfolio footer")
    if "data-profile-glass" not in profile_source or "bg-black/90" in profile_source:
        failures.append("Profile overlay still uses the blackout treatment instead of editorial glass")
    if "GlassSurface" not in nav_source or re.search(r"label:\s*['\"]Writings['\"]", nav_source):
        failures.append("Sidebar is not shared glass or still publicly exposes Writings")
    if "data-header-identity" not in app_source or "data-section-indicator" not in app_source:
        failures.append("Scroll header lacks the aligned identity/current-section contract")
    if "positions.writings" in app_source or "currentSection === 'writings'" in app_source:
        failures.append("Public scroll flow still snaps through Writings")

    if failures:
        raise AssertionError("Task 7 source contract failed:\n- " + "\n- ".join(failures))

    print("Task 7 source contract verified: editorial glass, public navigation, footer, header, and flow contracts exist.")


def install_error_capture(page: Page) -> dict[str, list[str]]:
    captured: dict[str, list[str]] = {
        "console_errors": [],
        "page_errors": [],
        "failed_local_requests": [],
        "error_responses": [],
    }
    page.on(
        "console",
        lambda message: captured["console_errors"].append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: captured["page_errors"].append(str(error)))
    page.on(
        "requestfailed",
        lambda request: captured["failed_local_requests"].append(request.url)
        if request.url.startswith(("http://127.0.0.1", "http://localhost"))
        else None,
    )
    page.on(
        "response",
        lambda response: captured["error_responses"].append(f"{response.status} {response.url}")
        if response.status >= 400
        else None,
    )
    return captured


def horizontal_overflow(page: Page) -> dict[str, int]:
    return page.evaluate(
        """() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        })"""
    )


def mat_measurements(page: Page) -> dict[str, object]:
    mat = page.locator("[data-cutting-mat-surface]").first
    if mat.count() == 0:
        mat = page.locator("svg").filter(has_text="SELF-HEALING CUTTING MAT").first.locator("..")

    return mat.evaluate(
        r"""surface => {
          const svg = surface.querySelector('svg');
          const rect = surface.getBoundingClientRect();
          return {
            rect: { width: rect.width, height: rect.height },
            viewBox: svg?.getAttribute('viewBox') || null,
            ariaHidden: svg?.getAttribute('aria-hidden') || null,
            role: svg?.getAttribute('role') || null,
          };
        }"""
    )


def assert_square_grid(page: Page, label: str) -> None:
    result = page.locator("[data-cutting-mat-surface]").first.evaluate(
        r"""surface => {
          const svg = surface.querySelector('svg');
          const [, , width, height] = (svg.getAttribute('viewBox') || '')
            .split(/\s+/).map(Number);
          const lines = [...svg.querySelectorAll('line')].map(line => ({
            x1: Number(line.getAttribute('x1')),
            x2: Number(line.getAttribute('x2')),
            y1: Number(line.getAttribute('y1')),
            y2: Number(line.getAttribute('y2')),
          }));
          const vertical = [...new Set(lines
            .filter(line => line.x1 === line.x2 && Math.abs(line.y2 - line.y1) > height * 0.55)
            .map(line => line.x1))].sort((a, b) => a - b);
          const horizontal = [...new Set(lines
            .filter(line => line.y1 === line.y2 && Math.abs(line.x2 - line.x1) > width * 0.55)
            .map(line => line.y1))].sort((a, b) => a - b);
          const gaps = values => values.slice(1).map((value, index) => value - values[index]);
          return {
            viewBox: { width, height },
            rect: surface.getBoundingClientRect().toJSON(),
            layout: { width: surface.clientWidth, height: surface.clientHeight },
            verticalGaps: gaps(vertical),
            horizontalGaps: gaps(horizontal),
          };
        }"""
    )
    vertical_gaps = result["verticalGaps"]
    horizontal_gaps = result["horizontalGaps"]
    assert vertical_gaps and horizontal_gaps, f"{label}: grid lines were not measurable"
    vertical_unit = median(vertical_gaps)
    horizontal_unit = median(horizontal_gaps)
    assert abs(vertical_unit - horizontal_unit) <= 1, (
        f"{label}: non-square grid {vertical_unit}px × {horizontal_unit}px"
    )
    assert max(vertical_gaps) - min(vertical_gaps) <= 1, f"{label}: uneven vertical grid"
    assert max(horizontal_gaps) - min(horizontal_gaps) <= 1, f"{label}: uneven horizontal grid"
    assert abs(result["viewBox"]["width"] - result["layout"]["width"]) <= 2, (
        f"{label}: SVG width is not measured in rendered pixels"
    )
    assert abs(result["viewBox"]["height"] - result["layout"]["height"]) <= 2, (
        f"{label}: SVG height is not measured in rendered pixels"
    )


def collect_baseline(page: Page, label: str) -> dict[str, object]:
    overflow = horizontal_overflow(page)
    body_text = page.locator("body").inner_text()
    navigation_labels = page.locator("nav[aria-label='Sections'] button").evaluate_all(
        "buttons => buttons.filter(button => getComputedStyle(button).display !== 'none').map(button => button.getAttribute('aria-label'))"
    )
    profile_button = page.get_by_role("button", name="View profile", exact=True).last
    profile_button.wait_for(state="visible")
    profile_button.click(force=True)
    dialog = page.get_by_role("dialog")
    dialog.wait_for(state="visible")
    profile = dialog.evaluate(
        """dialog => {
          const surface = dialog.firstElementChild;
          const title = dialog.querySelector('#profile-modal-title');
          return {
            backdrop: getComputedStyle(dialog).backgroundColor,
            backdropFilter: getComputedStyle(dialog).backdropFilter,
            surface: surface ? getComputedStyle(surface).backgroundColor : null,
            titleSize: title ? getComputedStyle(title).fontSize : null,
            titleWeight: title ? getComputedStyle(title).fontWeight : null,
          };
        }"""
    )
    page.keyboard.press("Escape")
    dialog.wait_for(state="detached")

    return {
        "label": label,
        "overflow": overflow,
        "navigationLabels": navigation_labels,
        "rejectedCopy": {
            "buildActivityVisible": "Build Activity" in body_text,
            "commitPlusVisible": bool(re.search(r"\b\d+\+\s+commits?\b", body_text)),
            "selectedWorkHeadingVisible": "Selected Work" in body_text,
        },
        "writingsNavigationVisible": any(
            label == "Navigate to Writings" for label in navigation_labels
        ),
        "profile": profile,
        "mat": mat_measurements(page),
    }


def run_browser(mode: str, base_url: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        print(f"Launching Chromium for {mode} verification", flush=True)
        browser = playwright.chromium.launch(headless=True)
        for width, height, label in ((1440, 900, "desktop"), (390, 844, "mobile")):
            print(f"Checking {label} at {width}×{height}", flush=True)
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            captured = install_error_capture(page)
            page.goto(base_url, wait_until="domcontentloaded")
            try:
                page.wait_for_load_state("networkidle", timeout=10_000)
            except PlaywrightTimeoutError:
                # The page includes remote portfolio media and GitHub evidence;
                # DOM readiness is the deterministic local regression boundary.
                pass
            page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
            print(f"{label}: hero ready", flush=True)

            if mode == "baseline":
                result = collect_baseline(page, label)
            else:
                mat = page.locator("[data-cutting-mat-surface]").first
                mat.wait_for(state="visible")
                assert mat.locator("svg[role='presentation'][aria-hidden='true']").count() == 1
                assert_square_grid(page, label)
                overflow = horizontal_overflow(page)
                assert overflow["content"] <= overflow["viewport"] + 1, (
                    f"{label}: horizontal overflow {overflow}"
                )
                result = {
                    "label": label,
                    "overflow": overflow,
                    "mat": mat_measurements(page),
                }

            page.screenshot(path=str(output_dir / f"{mode}-{label}.png"), full_page=True)
            print(f"{label}: screenshot captured", flush=True)
            result["errors"] = captured
            results.append(result)

            assert not captured["console_errors"], {
                "console_errors": captured["console_errors"],
                "error_responses": captured["error_responses"],
            }
            assert not captured["page_errors"], captured["page_errors"]
            assert not captured["failed_local_requests"], captured["failed_local_requests"]
            context.close()

        browser.close()

    result_path = output_dir / f"{mode}-measurements.json"
    result_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Browser {mode} verified at 1440×900 and 390×844; evidence: {result_path}")


def run_task2_browser(base_url: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    built_revision: str | None = None
    expected_count: int | None = None
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        cases = (
            (1440, 900, "desktop", "no-preference"),
            (1280, 800, "desktop-compact", "no-preference"),
            (390, 844, "mobile", "no-preference"),
            (320, 700, "mobile-compact", "no-preference"),
            (1280, 800, "reduced-motion", "reduce"),
        )
        for width, height, label, reduced_motion in cases:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                reduced_motion=reduced_motion,
            )
            page = context.new_page()
            captured = install_error_capture(page)
            page.goto(base_url, wait_until="domcontentloaded")
            page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
            # The Git/tool receipt enters after the hero copy; judge the settled
            # hierarchy rather than its intentionally transparent first frame.
            page.wait_for_timeout(1_800)

            visible_arcs = page.locator("[data-discipline-arcs]:visible")
            visible_arcs.first.wait_for()
            assert visible_arcs.count() == 1, f"{label}: expected exactly one visible arc composition"
            arcs = visible_arcs.first
            assert arcs.get_attribute("data-arc-layout") == "nested-side-arcs"
            paths = arcs.locator("[data-arc-path]")
            assert paths.count() == 2, f"{label}: expected exactly two arc paths"
            assert set(paths.evaluate_all("nodes => nodes.map(node => node.dataset.arcPath)")) == {"inner", "outer"}
            path_metrics = paths.evaluate_all(
                """nodes => nodes.map(node => ({
                    kind: node.dataset.arcPath,
                    radius: Number(node.dataset.arcRadius),
                    length: node.getTotalLength(),
                    closed: /z\\s*$/i.test(node.getAttribute('d') || '')
                }))"""
            )
            assert all(not metric["closed"] for metric in path_metrics), f"{label}: arc paths must remain open slices"
            assert all(
                0.15 < metric["length"] / (2 * 3.14159 * metric["radius"]) < 0.55
                for metric in path_metrics
            ), f"{label}: a path reads as a full ring rather than a partial side arc"
            assert arcs.evaluate("node => node.scrollWidth <= node.clientWidth + 1"), f"{label}: arc composition became a linear scroller"

            disciplines = arcs.locator("[data-discipline-option]")
            projects = arcs.locator("[data-project-node]")
            assert disciplines.count() == 5, f"{label}: expected five unique disciplines"
            assert projects.count() >= 10, f"{label}: project arc lost navigable targets"
            assert len(set(projects.evaluate_all("nodes => nodes.map(node => node.dataset.projectTarget)"))) == projects.count()
            assert all(projects.evaluate_all("nodes => nodes.map(node => !node.disabled && node.tabIndex >= 0)"))
            fallbacks = projects.locator("[data-project-fallback]")
            assert fallbacks.count() == projects.count(), f"{label}: every project needs a fallback"
            assert all(
                fallbacks.evaluate_all(
                    "nodes => nodes.map(node => node.textContent.trim().length > 0 && getComputedStyle(node).backgroundColor !== 'rgba(0, 0, 0, 0)')"
                )
            ), f"{label}: project fallbacks must remain nonblank"

            disciplines.nth(1).click()
            assert disciplines.nth(1).get_attribute("aria-pressed") == "true"
            relationship_states = projects.evaluate_all(
                "nodes => nodes.map(node => node.dataset.related)"
            )
            assert "true" in relationship_states
            assert "false" in relationship_states

            all_targets = arcs.locator("[data-discipline-option], [data-project-node]")
            target_rects = all_targets.evaluate_all(
                "nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; })"
            )
            assert all(
                rect["left"] >= -0.5 and rect["top"] >= -0.5
                and rect["right"] <= width + 0.5 and rect["bottom"] <= height + 0.5
                for rect in target_rects
            ), f"{label}: one or more arc targets are clipped by the viewport"
            assert all(rect["width"] >= 44 and rect["height"] >= 44 for rect in target_rects), f"{label}: arc target below 44px"
            overlap_pairs = all_targets.evaluate_all(
                """nodes => {
                    const rects = nodes.map(node => node.getBoundingClientRect());
                    const overlaps = [];
                    for (let i = 0; i < rects.length; i += 1) {
                        for (let j = i + 1; j < rects.length; j += 1) {
                            const width = Math.min(rects[i].right, rects[j].right) - Math.max(rects[i].left, rects[j].left);
                            const height = Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].top, rects[j].top);
                            if (width > 1 && height > 1) overlaps.push([i, j, width, height]);
                        }
                    }
                    return overlaps;
                }"""
            )
            assert not overlap_pairs, f"{label}: arc hit targets overlap {overlap_pairs[:4]}"
            assert all(all_targets.evaluate_all(
                """nodes => nodes.map(node => {
                    const r = node.getBoundingClientRect();
                    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                    return Boolean(hit && (hit === node || node.contains(hit)));
                })"""
            )), f"{label}: an arc target is visually covered and cannot be hit"

            arc_geometry = arcs.evaluate(
                """root => {
                    const measure = (role, pathKind) => {
                        const targets = [...root.querySelectorAll(`[data-arc-role="${role}"] [data-arc-t]`)];
                        const path = root.querySelector(`[data-arc-path="${pathKind}"]`);
                        const matrix = path.getScreenCTM();
                        const length = path.getTotalLength();
                        const samples = Array.from({ length: 401 }, (_, index) => {
                            const point = path.getPointAtLength(length * index / 400);
                            return new DOMPoint(point.x, point.y).matrixTransform(matrix);
                        });
                        const centers = targets.map(target => {
                            const rect = target.getBoundingClientRect();
                            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                        });
                        const distances = centers.map(center => Math.min(...samples.map(sample =>
                            Math.hypot(center.x - sample.x, center.y - sample.y)
                        )));
                        const xs = centers.map(center => center.x);
                        return {
                            xSpan: Math.max(...xs) - Math.min(...xs),
                            maxDistance: Math.max(...distances),
                        };
                    };
                    return {
                        outer: measure('project', 'outer'),
                        inner: measure('discipline', 'inner'),
                    };
                }"""
            )
            assert arc_geometry["outer"]["xSpan"] >= 60, f"{label}: project nodes still read as a vertical list {arc_geometry}"
            assert arc_geometry["inner"]["xSpan"] >= 20, f"{label}: discipline nodes still read as a vertical list {arc_geometry}"
            assert arc_geometry["outer"]["xSpan"] >= arc_geometry["inner"]["xSpan"] * 2, (
                f"{label}: nested arcs lack a clear outer/inner radius relationship {arc_geometry}"
            )
            assert arc_geometry["outer"]["maxDistance"] <= 3 and arc_geometry["inner"]["maxDistance"] <= 3, (
                f"{label}: node centers do not follow their rendered paths {arc_geometry}"
            )

            evidence = page.locator("[data-github-evidence]:visible")
            evidence.wait_for()
            case_revision, case_count = built_revision_and_count(evidence)
            if built_revision is None:
                built_revision, expected_count = case_revision, case_count
            assert case_revision == built_revision and case_count == expected_count, (
                f"{label}: Git evidence changed across one built artifact"
            )
            text_content = evidence.inner_text()
            assert str(expected_count) in text_content
            assert f"{expected_count}+" not in text_content
            assert "Build Activity" not in text_content
            exact_count = evidence.locator("[data-exact-commit-count]")
            assert exact_count.is_visible() and exact_count.inner_text().strip() == str(expected_count)
            chart = evidence.locator("[data-contribution-chart]")
            assert chart.is_visible(), f"{label}: contribution history chart is hidden"
            cells = chart.locator("[data-contribution-cell]")
            assert cells.count() >= 49, f"{label}: contribution history is not a real chart"
            assert any(
                cells.evaluate_all("nodes => nodes.map(node => node.dataset.active === 'true')")
            ), f"{label}: contribution history is empty"
            chart_box = chart.bounding_box()
            assert chart_box and chart_box["width"] >= 100 and chart_box["height"] >= 30
            assert evidence.get_by_role("link", name=re.compile("See how this portfolio was built", re.I)).is_visible()
            marks = page.locator("[data-tool-marks]:visible [data-tool-mark]")
            assert marks.count() == 3
            assert page.locator("[data-tool-marks]:visible").inner_text().strip() == ""
            if width < 768:
                assert_mobile_hero_receipt_spacing(page, label)

            protected_surfaces = [
                ("GitHub evidence", evidence),
                ("View selected work", page.get_by_role("button", name="View selected work", exact=True)),
                ("Resume", page.get_by_role("link", name="Resume", exact=True)),
                ("LinkedIn", page.get_by_role("link", name="LinkedIn", exact=True)),
            ]
            if width >= 1024:
                protected_surfaces.append(("section sidebar", page.locator("nav[aria-label='Sections']:visible").first))
            for surface_name, surface in protected_surfaces:
                surface_box = surface.bounding_box()
                assert surface_box, f"{label}: {surface_name} is not measurable"
                surface_right = surface_box["x"] + surface_box["width"]
                surface_bottom = surface_box["y"] + surface_box["height"]
                overlaps = [
                    rect for rect in target_rects
                    if min(rect["right"], surface_right) - max(rect["left"], surface_box["x"]) > 1
                    and min(rect["bottom"], surface_bottom) - max(rect["top"], surface_box["y"]) > 1
                ]
                assert not overlaps, f"{label}: arc targets overlap {surface_name}"

            if reduced_motion == "reduce":
                animation_names = arcs.locator("[data-arc-motion]").evaluate_all(
                    "nodes => nodes.map(node => getComputedStyle(node).animationName)"
                )
                assert all(name == "none" for name in animation_names)

            overflow = horizontal_overflow(page)
            assert overflow["content"] <= overflow["viewport"] + 1, (
                f"{label}: horizontal overflow {overflow}"
            )
            # Let the delayed GitHub/tool-mark entry reach its judged resting state.
            page.wait_for_timeout(1_800)
            page.screenshot(path=str(output_dir / f"task2-{label}.png"), full_page=True)
            assert not captured["console_errors"], {
                "console_errors": captured["console_errors"],
                "error_responses": captured["error_responses"],
            }
            assert not captured["page_errors"], captured["page_errors"]
            assert not captured["failed_local_requests"], captured["failed_local_requests"]
            results.append({
                "label": label,
                "layout": "nested-side-arcs",
                "arcGeometry": arc_geometry,
                "targetCount": all_targets.count(),
                "builtRevision": built_revision,
                "commitCount": expected_count,
                "overflow": overflow,
                "errors": captured,
            })
            context.close()
        browser.close()

    result_path = output_dir / "task2-measurements.json"
    result_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Task 2 browser verified across desktop, compact desktop, two mobile sizes, and reduced motion: {result_path}")


def enter_timeline(page: Page) -> None:
    explore = page.get_by_role("button", name="Explore timeline")
    explore.wait_for(state="visible")
    assert explore.evaluate(
        """node => {
          const rect = node.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
          return Boolean(hit && (hit === node || node.contains(hit)));
        }"""
    ), "The project-wheel canvas intercepts the timeline entry control"
    # Keyboard activation avoids waiting on the intentional bounce animation
    # while still exercising the actual accessible control and click handler.
    explore.focus()
    explore.press("Enter")
    page.wait_for_timeout(900)


def capture_task3_state(page: Page, output_dir: Path, filename: str, locator=None) -> Path:
    """Capture a reproducible judged state without changing its assertions."""
    page.evaluate("() => document.fonts.ready")
    page.wait_for_timeout(200)
    screenshot_path = output_dir / filename
    target = locator if locator is not None else page
    target.screenshot(
        path=str(screenshot_path),
        animations="disabled",
        caret="hide",
    )
    return screenshot_path


def assert_full_label(locator, label: str) -> None:
    locator.wait_for(state="visible")
    metrics = locator.evaluate(
        """node => {
          const style = getComputedStyle(node);
          return {
            text: node.textContent.trim(),
            clamp: style.webkitLineClamp,
            overflow: style.overflow,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
            scrollHeight: node.scrollHeight,
            clientHeight: node.clientHeight,
          };
        }"""
    )
    assert metrics["text"] == label
    assert metrics["clamp"] in ("none", "0", ""), f"{label}: label is still clamped"
    assert metrics["scrollWidth"] <= metrics["clientWidth"] + 1, f"{label}: horizontal clipping"
    assert metrics["scrollHeight"] <= metrics["clientHeight"] + 1, f"{label}: vertical clipping"


def run_task3_browser(base_url: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for width, height, label in ((1440, 900, "desktop"), (390, 844, "mobile")):
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            captured = install_error_capture(page)
            screenshot_paths: list[str] = []
            page.goto(base_url, wait_until="domcontentloaded")
            page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
            page.wait_for_timeout(1_800)
            enter_timeline(page)

            degree_title = "B.Tech Civil Engineering + M.Sc. Biological Sciences"
            degree_card = page.get_by_role("button", name=f"Open {degree_title}")
            degree_card.scroll_into_view_if_needed()
            assert_full_label(
                degree_card.locator("[data-full-timeline-title]"),
                degree_title,
            )

            if width >= 768:
                northwestern_card = page.get_by_role(
                    "button", name="Open MS Engineering Design Innovation"
                )
                northwestern_card.click()
                experience = page.locator("[data-experience-id='ms-edi']")
                experience.wait_for(state="visible")
                feature_cards = experience.locator("[data-feature-card]")
                assert feature_cards.count() == 4, "Northwestern must show four project boxes"
                screenshot_paths.append(
                    str(
                        capture_task3_state(
                            page,
                            output_dir,
                            "task3-desktop-northwestern-experience.png",
                        )
                    )
                )

                family = experience.locator(
                    "[data-linked-project-id='familysync-jpmorgan']"
                )
                family.click()
                page.wait_for_timeout(500)
                project = page.locator(TASK6_PROJECT_DIALOG_SELECTOR)
                project.wait_for(state="visible")
                screenshot_paths.append(
                    str(
                        capture_task3_state(
                            page,
                            output_dir,
                            "task3-desktop-familysync-detail.png",
                        )
                    )
                )
                page.keyboard.press("Escape")
                project.wait_for(state="detached")
                experience.wait_for(state="visible")
                assert family.evaluate("node => document.activeElement === node"), (
                    "Escape must restore focus to the Northwestern project box"
                )

                mcdonalds = experience.locator(
                    "[data-linked-project-id='mcdonalds-interaction-design']"
                )
                mcdonalds.click()
                project.wait_for(state="visible")
                page.go_back()
                project.wait_for(state="detached")
                experience.wait_for(state="visible")
                assert mcdonalds.evaluate("node => document.activeElement === node"), (
                    "Back must restore focus to the Northwestern project box"
                )

                family.click()
                project.wait_for(state="visible")
                page.get_by_role("button", name="Close FamilySync case study").click()
                project.wait_for(state="detached")
                experience.wait_for(state="visible")
                assert family.evaluate("node => document.activeElement === node"), (
                    "Close must restore focus to the Northwestern project box"
                )

                pg_feature = experience.get_by_role(
                    "button", name="Open project P&G Design Project"
                )
                pg_feature.click()
                feature_detail = page.locator("[data-feature-detail]")
                feature_detail.wait_for(state="visible")
                feature_detail.click(position={"x": 2, "y": 2})
                feature_detail.wait_for(state="detached")
                experience.wait_for(state="visible")
                assert pg_feature.evaluate("node => document.activeElement === node"), (
                    "Backdrop must restore focus to the Northwestern feature box"
                )

                pg_card = experience.locator("[data-feature-card]", has_text="P&G Design Project")
                pg_card.click()
                feature_detail = page.locator("[data-feature-detail]")
                feature_detail.wait_for(state="visible")
                feature_detail.click(position={"x": 2, "y": 2})
                feature_detail.wait_for(state="detached")
                experience.wait_for(state="visible")

                page.get_by_role("button", name="Close", exact=True).click()
                experience.wait_for(state="detached")
                degree_card.click()
                bits_experience = page.locator("[data-experience-id='bits']")
                bits_experience.wait_for(state="visible")
                for project_title in (
                    "Rightbiotic: Antimicrobial Testing Machine",
                    "Modular Water Closet System",
                ):
                    assert_full_label(
                        bits_experience.locator("[data-full-feature-title]", has_text=project_title),
                        project_title,
                    )
                bits_experience.locator(
                    "[data-feature-card]", has_text="Modular Water Closet System"
                ).click()
                feature_detail = page.locator("[data-feature-detail]")
                feature_detail.wait_for(state="visible")
                media_container = feature_detail.locator("[data-feature-media]")
                media = media_container.locator("img")
            else:
                degree_card.click()
                for project_title in (
                    "Rightbiotic: Antimicrobial Testing Machine",
                    "Modular Water Closet System",
                ):
                    assert_full_label(
                        degree_card.locator("[data-mobile-feature-title]", has_text=project_title),
                        project_title,
                    )
                mobile_project_cards = degree_card.locator("[data-feature-card]")
                mobile_projects_section = mobile_project_cards.first.locator("xpath=../..")
                screenshot_paths.append(
                    str(
                        capture_task3_state(
                            page,
                            output_dir,
                            "task3-mobile-btech-expanded.png",
                            mobile_projects_section,
                        )
                    )
                )
                degree_card.locator(
                    "[data-feature-card]", has_text="Modular Water Closet System"
                ).click()
                media_container = degree_card.locator("[data-feature-media]")
                media = media_container.locator("img")

            assert media.count() == 2, "Modular Water Closet must show both concept renders"
            assert all(
                media.evaluate_all(
                    "nodes => nodes.map(node => node.complete && node.naturalWidth > 0 && getComputedStyle(node).objectFit === 'contain')"
                )
            ), "Concept renders must load and use non-destructive containment"

            if width >= 768:
                screenshot_paths.append(
                    str(
                        capture_task3_state(
                            page,
                            output_dir,
                            "task3-desktop-bits-modular-water-closet.png",
                        )
                    )
                )
            else:
                screenshot_paths.append(
                    str(
                        capture_task3_state(
                            page,
                            output_dir,
                            "task3-mobile-modular-water-closet.png",
                            media_container,
                        )
                    )
                )

            if width < 768:
                degree_card.click()
                northwestern_card = page.get_by_role(
                    "button", name="Open MS Engineering Design Innovation"
                )
                northwestern_card.scroll_into_view_if_needed()
                northwestern_card.click()
                family = northwestern_card.locator(
                    "[data-linked-project-id='familysync-jpmorgan']"
                )
                family.click()
                project = page.locator(TASK6_PROJECT_DIALOG_SELECTOR)
                project.wait_for(state="visible")
                screenshot_paths.append(
                    str(
                        capture_task3_state(
                            page,
                            output_dir,
                            "task3-mobile-northwestern-linked-project.png",
                        )
                    )
                )
                page.keyboard.press("Escape")
                project.wait_for(state="detached")
                northwestern_card.wait_for(state="visible")
                assert family.evaluate("node => document.activeElement === node"), (
                    "Mobile Escape must restore focus to the Northwestern project box"
                )

            overflow = horizontal_overflow(page)
            assert overflow["content"] <= overflow["viewport"] + 1, (
                f"{label}: horizontal overflow {overflow}"
            )
            assert not captured["console_errors"], captured["console_errors"]
            assert not captured["page_errors"], captured["page_errors"]
            assert not captured["failed_local_requests"], captured["failed_local_requests"]
            results.append(
                {
                    "label": label,
                    "overflow": overflow,
                    "errors": captured,
                    "screenshots": screenshot_paths,
                }
            )
            context.close()
        browser.close()

    result_path = output_dir / "task3-measurements.json"
    result_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Task 3 browser verified across desktop and mobile: {result_path}")


def open_tinkerverse_journal(page: Page, use_touch: bool = False):
    previews = page.locator("[data-tinkerverse-preview]")
    open_controls = page.get_by_role("button", name="Open TinkerVerse")
    print(
        f"TinkerVerse entry points: previews={previews.count()}, open-controls={open_controls.count()}",
        flush=True,
    )
    assert previews.count() > 0, "The rendered timeline is missing its image-led TinkerVerse preview"
    visible_previews = page.locator("[data-tinkerverse-preview]:visible")
    visible_controls = page.locator("[role='button'][aria-label='Open TinkerVerse']:visible")
    if visible_previews.count() > 0:
        preview = visible_previews.first
        if preview.get_attribute("role") == "button":
            trigger = preview
        else:
            trigger = preview.locator("xpath=ancestor::*[@role='button'][1]")
    elif visible_controls.count() > 0:
        trigger = visible_controls.first
    else:
        # The desktop rail reveals cards with IntersectionObserver. Native DOM
        # scrolling can move its clipped scroller before the card is actionable.
        previews.first.evaluate("node => node.scrollIntoView({block: 'center', inline: 'center'})")
        page.wait_for_timeout(500)
        if visible_previews.count() > 0:
            trigger = visible_previews.first
        else:
            assert visible_controls.count() > 0, "No accessible TinkerVerse entry point is rendered"
            trigger = visible_controls.first
    trigger.evaluate("node => node.scrollIntoView({block: 'center', inline: 'center'})")
    trigger.wait_for(state="visible")
    trigger.focus()
    if use_touch:
        trigger.tap(force=True)
    else:
        trigger.press("Enter")
    dialog = page.locator("[role='dialog'][aria-labelledby='tinkerverse-modal-title']")
    dialog.wait_for(state="visible")
    return trigger, dialog


def assert_tinkerverse_timeline_prominence(page: Page, width: int, label: str) -> dict[str, object]:
    """Keep TinkerVerse in the full timeline composition on desktop and mobile."""
    if width >= 768:
        lanes = page.locator("[data-timeline-lanes='education-experience-tinkerverse']:visible")
        lanes.wait_for(state="visible")
        lane_nodes = lanes.locator(":scope > [data-timeline-lane]")
        assert lane_nodes.count() == 3, f"{label}: expected three full desktop timeline lanes"
        lane_names = lane_nodes.evaluate_all("nodes => nodes.map(node => node.dataset.timelineLane)")
        assert lane_names == ["education", "experience", "tinkerverse"], (
            f"{label}: desktop lane order regressed: {lane_names}"
        )
        lane_boxes = [lane_nodes.nth(index).bounding_box() for index in range(3)]
        assert all(lane_boxes), f"{label}: a desktop timeline lane is not measurable"
        assert lane_boxes[0]["x"] < lane_boxes[1]["x"] < lane_boxes[2]["x"], (
            f"{label}: desktop timeline lanes are no longer side by side"
        )
        widths = [box["width"] for box in lane_boxes]
        assert max(widths) - min(widths) <= 2, f"{label}: timeline lanes are not equal width: {widths}"
        preview = lane_nodes.nth(2).locator("[data-tinkerverse-preview]")
        preview.wait_for(state="visible")
        preview_box = preview.bounding_box()
        assert preview_box and preview_box["height"] >= 500, (
            f"{label}: TinkerVerse was reduced from a full timeline lane: {preview_box}"
        )
        return {"lanes": lane_names, "laneBoxes": lane_boxes, "previewBox": preview_box}

    preview = page.locator("[data-tinkerverse-preview]:visible").first
    preview.wait_for(state="visible")
    education_heading = page.get_by_role("heading", name="Education", exact=True)
    experience_heading = page.get_by_role("heading", name="Experience", exact=True)
    preview_box = preview.bounding_box()
    education_box = education_heading.bounding_box()
    experience_box = experience_heading.bounding_box()
    assert preview_box and preview_box["height"] >= 240, (
        f"{label}: mobile TinkerVerse is no longer a full card: {preview_box}"
    )
    assert education_box and experience_box
    assert preview_box["y"] < education_box["y"] < experience_box["y"], (
        f"{label}: mobile timeline order must be TinkerVerse, Education, Experience"
    )
    return {
        "previewBox": preview_box,
        "educationHeadingBox": education_box,
        "experienceHeadingBox": experience_box,
    }


def verify_journal_structure(page: Page, dialog, label: str) -> None:
    assert dialog.locator("[data-journal-lead]").count() == 1, f"{label}: missing lead artifact"
    assert dialog.locator("[data-journal-grid]").count() == 1, f"{label}: missing field-note grid"
    entries = dialog.locator("[data-journal-entry]")
    assert entries.count() == 5, f"{label}: expected five curated journal entries"
    assert dialog.locator("[data-journal-status]").count() == 5, f"{label}: every entry needs status"
    assert dialog.locator("[data-journal-project]").count() == 5, f"{label}: verified project tags were lost"
    assert dialog.locator("[data-journal-fallback='verified-local']").count() == 5, (
        f"{label}: fallback provenance must remain explicit"
    )
    assert dialog.locator("[data-follow-instagram]").count() == 1, f"{label}: expected one Instagram CTA"
    assert dialog.locator("video").count() == 0, f"{label}: journal must not autoplay or embed video"
    assert "likes" not in dialog.inner_text().lower(), f"{label}: legacy social meter returned"

    for index in range(entries.count()):
        entry = entries.nth(index)
        entry.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
        image = entry.locator("[data-journal-media] img")
        image.wait_for(state="visible")
        page.wait_for_function(
            "image => image.complete && image.naturalWidth > 0",
            arg=image.element_handle(),
        )
        expected_fit = "contain" if index == 0 else "cover"
        assert image.evaluate("(node, expected) => getComputedStyle(node).objectFit === expected", expected_fit), (
            f"{label}: journal media fit is not intentional"
        )

    statuses_are_readable = dialog.locator("[data-journal-status]").evaluate_all(
        """nodes => nodes.map(node => {
          const style = getComputedStyle(node);
          return node.textContent.trim().length > 0
            && parseFloat(style.fontSize) >= 9
            && style.color !== 'rgba(0, 0, 0, 0)';
        })"""
    )
    assert all(statuses_are_readable), f"{label}: status labels are not readable"
    text_containers_fit = dialog.locator("[data-journal-text]").evaluate_all(
        "nodes => nodes.map(node => node.scrollWidth <= node.clientWidth + 1 && getComputedStyle(node).overflowX !== 'hidden')"
    )
    assert len(text_containers_fit) == 5 and all(text_containers_fit), (
        f"{label}: lead/card text clips or hides horizontal overflow"
    )


def capture_task5_state(page: Page, output_dir: Path, filename: str) -> str:
    page.evaluate("() => document.fonts.ready")
    page.wait_for_timeout(200)
    path = output_dir / filename
    page.screenshot(path=str(path), animations="disabled", caret="hide")
    return str(path)


def run_task5_browser(base_url: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        cases = (
            (1440, 900, "desktop", "no-preference", False),
            (390, 844, "mobile-390", "no-preference", True),
            (320, 700, "mobile-320", "no-preference", True),
            (390, 844, "reduced-motion", "reduce", False),
        )
        for width, height, label, reduced_motion, use_touch in cases:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                reduced_motion=reduced_motion,
                has_touch=use_touch,
            )
            page = context.new_page()
            captured = install_error_capture(page)
            screenshots: list[str] = []
            page.goto(base_url, wait_until="domcontentloaded")
            page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
            enter_timeline(page)

            timeline_metrics = assert_tinkerverse_timeline_prominence(page, width, label)
            screenshots.append(capture_task5_state(page, output_dir, f"task5-{label}-timeline.png"))

            trigger, dialog = open_tinkerverse_journal(page, use_touch=use_touch)
            screenshots.append(capture_task5_state(page, output_dir, f"task5-{label}-journal-lead.png"))
            verify_journal_structure(page, dialog, label)

            grid = dialog.locator("[data-journal-grid]")
            grid.evaluate("node => node.scrollIntoView({block: 'start', inline: 'nearest'})")
            screenshots.append(capture_task5_state(page, output_dir, f"task5-{label}-field-notes.png"))

            lead_project = dialog.locator("[data-journal-project]").first
            lead_project.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
            lead_project.click(force=True)
            project = page.locator(
                "[role='dialog'][aria-modal='true']:is([aria-labelledby='project-detail-title'], [aria-labelledby='glyph-project-title']):visible"
            )
            project.wait_for(state="visible")
            if label in ("desktop", "mobile-390"):
                screenshots.append(capture_task5_state(page, output_dir, f"task5-{label}-nested-project.png"))
            page.keyboard.press("Escape")
            project.wait_for(state="detached")
            dialog.wait_for(state="visible")
            assert lead_project.evaluate("node => document.activeElement === node"), (
                f"{label}: Escape did not restore focus to the journal project tag"
            )

            if label == "desktop":
                second_project = dialog.locator("[data-journal-project]").nth(1)
                second_project.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
                second_project.click(force=True)
                project.wait_for(state="visible")
                page.go_back()
                project.wait_for(state="detached")
                dialog.wait_for(state="visible")
                assert second_project.evaluate("node => document.activeElement === node"), (
                    "desktop: Back did not restore focus to the journal project tag"
                )

            if reduced_motion == "reduce":
                infinite_animations = dialog.evaluate(
                    "node => node.getAnimations({subtree: true}).filter(animation => animation.effect.getTiming().iterations === Infinity && animation.playState === 'running').length"
                )
                assert infinite_animations == 0, "reduced-motion: infinite mat motion is still running"

            page.keyboard.press("Escape")
            dialog.wait_for(state="detached")
            assert trigger.evaluate("node => document.activeElement === node"), (
                f"{label}: closing the journal did not restore focus to its timeline trigger"
            )

            northwestern = page.get_by_role("button", name="Open MS Engineering Design Innovation")
            northwestern.scroll_into_view_if_needed()
            northwestern.click()
            if width >= 768:
                experience = page.locator("[data-experience-id='ms-edi']")
                experience.wait_for(state="visible")
                page.keyboard.press("Escape")
                experience.wait_for(state="detached")
            else:
                key_projects = northwestern.get_by_text("Key Projects", exact=True)
                key_projects.wait_for(state="visible")
                northwestern.get_by_role("button", name="Collapse").click()
                key_projects.wait_for(state="detached")

            overflow = horizontal_overflow(page)
            assert overflow["content"] <= overflow["viewport"] + 1, f"{label}: horizontal overflow {overflow}"
            assert not captured["console_errors"], captured["console_errors"]
            assert not captured["page_errors"], captured["page_errors"]
            assert not captured["failed_local_requests"], captured["failed_local_requests"]
            results.append({
                "label": label,
                "timeline": timeline_metrics,
                "overflow": overflow,
                "errors": captured,
                "screenshots": screenshots,
            })
            context.close()

        offline_context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
        offline_page = offline_context.new_page()
        captured = install_error_capture(offline_page)
        offline_page.route(
            "**/images/tinkerverse/**",
            lambda route: route.fulfill(status=200, content_type="image/webp", body=b"not-an-image"),
        )
        offline_page.goto(base_url, wait_until="domcontentloaded")
        offline_page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
        enter_timeline(offline_page)
        _, dialog = open_tinkerverse_journal(offline_page, use_touch=True)
        entries = dialog.locator("[data-journal-entry]")
        for index in range(entries.count()):
            entries.nth(index).evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
        offline_page.wait_for_function(
            "() => document.querySelectorAll('[data-journal-fallback=\"offline\"]').length === 5"
        )
        assert dialog.locator("[data-journal-fallback='offline']").count() == 5
        assert dialog.locator("[data-journal-project]").count() == 5
        offline_screenshot = capture_task5_state(
            offline_page, output_dir, "task5-mobile-390-offline-fallback.png"
        )
        overflow = horizontal_overflow(offline_page)
        assert overflow["content"] <= overflow["viewport"] + 1, f"offline: horizontal overflow {overflow}"
        assert not captured["console_errors"], captured["console_errors"]
        assert not captured["page_errors"], captured["page_errors"]
        assert not captured["failed_local_requests"], captured["failed_local_requests"]
        results.append({
            "label": "offline-mobile-390",
            "overflow": overflow,
            "errors": captured,
            "screenshots": [offline_screenshot],
        })
        offline_context.close()
        browser.close()

    result_path = output_dir / "task5-measurements.json"
    result_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Task 5 browser verified across desktop, 390px, 320px, reduced motion, and offline media: {result_path}")


TASK6_INTENTS = {
    "all": [
        "glyph", "zero-my-ai", "familysync-jpmorgan", "mcdonalds-interaction-design",
        "surya", "solopump", "helios", "jarvis", "plotter", "portfolio-website",
    ],
    "tangible-ai": ["glyph", "zero-my-ai", "jarvis", "portfolio-website"],
    "product-thinking": [
        "familysync-jpmorgan", "mcdonalds-interaction-design", "zero-my-ai", "glyph",
        "portfolio-website",
    ],
    "physical-craft": ["glyph", "surya", "plotter", "jarvis", "helios", "solopump"],
}

TASK6_PROJECT_DIALOG_SELECTOR = (
    "[role='dialog'][aria-modal='true']:is("
    "[aria-labelledby='project-detail-title'], "
    "[aria-labelledby='glyph-project-title'], "
    "[aria-labelledby='hcd-familysync-jpmorgan-title'], "
    "[aria-labelledby='hcd-mcdonalds-interaction-design-title']"
    "):visible"
)


def wait_for_project_order(page: Page, expected: list[str]) -> list[str]:
    page.wait_for_function(
        """expected => {
          const ids = [...document.querySelectorAll('#selected-work-grid [data-project-id]')]
            .filter(node => getComputedStyle(node).opacity !== '0')
            .map(node => node.dataset.projectId);
          return ids.length === expected.length && ids.every((id, index) => id === expected[index]);
        }""",
        arg=expected,
    )
    return page.locator("#selected-work-grid [data-project-id]").evaluate_all(
        "nodes => nodes.filter(node => getComputedStyle(node).opacity !== '0').map(node => node.dataset.projectId)"
    )


def assert_settled_project_cards(page: Page, label: str, intent_id: str, expected: list[str]) -> list[dict[str, object]]:
    # Exercise the same settled state a person sees, beyond the short filter
    # transition and its staggered entrance delays.
    page.wait_for_timeout(1000)
    metrics = page.locator("#selected-work-grid [data-project-id]").evaluate_all(
        """nodes => nodes.map(node => {
          const card = node.querySelector('[data-project-card]');
          const wrapperStyle = getComputedStyle(node);
          const cardStyle = card ? getComputedStyle(card) : null;
          const rect = node.getBoundingClientRect();
          return {
            id: node.dataset.projectId,
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            inViewport: rect.bottom > 72 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth,
            opacity: Number.parseFloat(wrapperStyle.opacity),
            visibility: wrapperStyle.visibility,
            display: wrapperStyle.display,
            cardOpacity: cardStyle ? Number.parseFloat(cardStyle.opacity) : 0,
            cardVisibility: cardStyle ? cardStyle.visibility : 'missing',
          };
        })"""
    )
    assert [metric["id"] for metric in metrics] == expected, (
        f"{label}/{intent_id}: settled wrapper order differs: {metrics}"
    )
    assert all(
        metric["width"] > 0
        and metric["height"] > 0
        and metric["visibility"] == "visible"
        and metric["cardVisibility"] == "visible"
        and metric["display"] != "none"
        for metric in metrics
    ), f"{label}/{intent_id}: a settled project has no renderable box: {metrics}"
    assert all(
        not metric["inViewport"]
        or (metric["opacity"] >= 0.95 and metric["cardOpacity"] >= 0.95)
        for metric in metrics
    ), f"{label}/{intent_id}: an on-screen project is not visibly painted: {metrics}"
    return metrics


def tap_visible_control(page: Page, control, label: str) -> None:
    box = control.bounding_box()
    assert box and box["width"] >= 44 and box["height"] >= 44, f"{label}: touch target has no usable box: {box}"
    point = {"x": box["x"] + box["width"] / 2, "y": box["y"] + box["height"] / 2}
    assert control.evaluate(
        """(node, point) => {
          const hit = document.elementFromPoint(point.x, point.y);
          return hit === node || node.contains(hit);
        }""",
        point,
    ), f"{label}: touch point is intercepted at {point}"
    page.touchscreen.tap(point["x"], point["y"])


def assert_selected_work_mat(page: Page, label: str):
    section = page.locator("#projects")
    section.evaluate("node => node.scrollIntoView({block: 'start', inline: 'nearest'})")
    heading = section.get_by_role("heading", name="I want to see how Adi…", exact=True)
    heading.wait_for(state="visible")
    assert "Selected Work" not in section.inner_text()
    assert "Start with the capability you need to see." not in section.inner_text()

    mat = section.locator("[data-cutting-mat-surface]")
    mat.wait_for(state="visible")
    assert mat.locator("[data-selected-work-mat]").count() == 1
    page.evaluate("() => document.fonts.ready")
    geometry_script = r"""surface => {
          const svg = surface.querySelector('svg');
          const rect = surface.getBoundingClientRect();
          const viewBox = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
          const lines = [...svg.querySelectorAll('line')];
          const vertical = [...new Set(lines
            .filter(line => line.x1.baseVal.value === line.x2.baseVal.value && Math.abs(line.y2.baseVal.value - line.y1.baseVal.value) > viewBox[3] * 0.55)
            .map(line => line.x1.baseVal.value))].sort((a, b) => a - b);
          const horizontal = [...new Set(lines
            .filter(line => line.y1.baseVal.value === line.y2.baseVal.value && Math.abs(line.x2.baseVal.value - line.x1.baseVal.value) > viewBox[2] * 0.55)
            .map(line => line.y1.baseVal.value))].sort((a, b) => a - b);
          const medianGap = values => {
            const gaps = values.slice(1).map((value, index) => value - values[index]).sort((a, b) => a - b);
            return gaps[Math.floor(gaps.length / 2)];
          };
          return {
            rect: {width: rect.width, height: rect.height},
            layout: {width: surface.clientWidth, height: surface.clientHeight},
            scrollHeight: surface.scrollHeight,
            viewBox: {width: viewBox[2], height: viewBox[3]},
            verticalGap: medianGap(vertical),
            horizontalGap: medianGap(horizontal),
            lineCount: lines.length,
            frameStyleHeight: getComputedStyle(surface.parentElement).height,
            contentScrollHeight: surface.querySelector('[data-selected-work-mat]').scrollHeight,
            images: [...surface.querySelectorAll('[data-project-card] img')].map(image => ({complete: image.complete, naturalWidth: image.naturalWidth})),
          };
        }"""
    previous_metrics = mat.evaluate(geometry_script)
    mat_metrics = None
    for _ in range(20):
        page.wait_for_timeout(250)
        current_metrics = mat.evaluate(geometry_script)
        stable_tuple = (
            current_metrics["layout"],
            current_metrics["viewBox"],
            current_metrics["scrollHeight"],
            current_metrics["frameStyleHeight"],
            current_metrics["contentScrollHeight"],
        )
        previous_tuple = (
            previous_metrics["layout"],
            previous_metrics["viewBox"],
            previous_metrics["scrollHeight"],
            previous_metrics["frameStyleHeight"],
            previous_metrics["contentScrollHeight"],
        )
        geometry_matches = (
            abs(current_metrics["viewBox"]["width"] - current_metrics["layout"]["width"]) <= 2
            and abs(current_metrics["viewBox"]["height"] - current_metrics["layout"]["height"]) <= 2
            and current_metrics["scrollHeight"] <= current_metrics["layout"]["height"] + 1
        )
        if stable_tuple == previous_tuple and geometry_matches:
            mat_metrics = current_metrics
            break
        previous_metrics = current_metrics
    if mat_metrics is None:
        raise AssertionError(f"{label}: Selected Work mat geometry did not stabilize: {previous_metrics}")
    assert abs(mat_metrics["verticalGap"] - mat_metrics["horizontalGap"]) <= 1, (
        f"{label}: Selected Work mat cells are not square: {mat_metrics}"
    )
    assert abs(mat_metrics["viewBox"]["width"] - mat_metrics["layout"]["width"]) <= 2
    assert abs(mat_metrics["viewBox"]["height"] - mat_metrics["layout"]["height"]) <= 2
    assert mat_metrics["lineCount"] < 450, f"{label}: decorative mat DOM is unbounded"
    containment = mat.evaluate(
        """surface => {
          const matRect = surface.getBoundingClientRect();
          const cards = [...surface.querySelectorAll('#selected-work-grid [data-project-id]')]
            .filter(node => getComputedStyle(node).opacity !== '0')
            .map(node => {
              const rect = node.getBoundingClientRect();
              return {id: node.dataset.projectId, width: rect.width, height: rect.height, bottom: rect.bottom, center: rect.left + rect.width / 2};
            });
          return {
            scrollHeight: surface.scrollHeight,
            clientHeight: surface.clientHeight,
            matBottom: matRect.bottom,
            matCenter: matRect.left + matRect.width / 2,
            cards,
          };
        }"""
    )
    assert containment["scrollHeight"] <= containment["clientHeight"] + 1, (
        f"{label}: Selected Work children overflow the mat: {containment}"
    )
    assert len(containment["cards"]) == 10, f"{label}: complete ten-card grid is not rendered"
    assert all(card["width"] > 0 and card["height"] > 0 for card in containment["cards"])
    assert max(card["bottom"] for card in containment["cards"]) <= containment["matBottom"] - 16, (
        f"{label}: final project row escapes the lower ruler edge: {containment}"
    )
    if page.viewport_size["width"] >= 1024:
        last_card = containment["cards"][-1]
        assert abs(last_card["center"] - containment["matCenter"]) <= last_card["width"], (
            f"{label}: final all-intent card is stranded away from the mat center: {containment}"
        )

    intents = section.locator("[data-project-intent]")
    assert intents.count() == 4
    label_metrics = intents.evaluate_all(
        """nodes => nodes.map(node => ({
          height: node.getBoundingClientRect().height,
          fits: node.scrollWidth <= node.clientWidth + 1,
          ellipsis: getComputedStyle(node.querySelector('span')).textOverflow === 'ellipsis',
        }))"""
    )
    assert all(metric["height"] >= 44 and metric["fits"] and not metric["ellipsis"] for metric in label_metrics), (
        f"{label}: intent labels are clipped or undersized: {label_metrics}"
    )
    return section, mat


def capture_task6_state(page: Page, output_dir: Path, filename: str, locator=None) -> str:
    page.evaluate("() => document.fonts.ready")
    page.wait_for_timeout(200)
    path = output_dir / filename
    target = locator if locator is not None else page
    target.screenshot(path=str(path), caret="hide")
    return str(path)


def run_task6_browser(base_url: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        cases = (
            (1440, 900, "desktop-1440", "no-preference", False),
            (1280, 800, "desktop-1280", "no-preference", False),
            (390, 844, "mobile-390", "no-preference", True),
            (320, 700, "mobile-320", "no-preference", True),
            (390, 844, "reduced-motion", "reduce", False),
        )
        for width, height, label, reduced_motion, use_touch in cases:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                reduced_motion=reduced_motion,
                has_touch=use_touch,
            )
            page = context.new_page()
            captured = install_error_capture(page)
            screenshots: list[str] = []
            page.goto(base_url, wait_until="domcontentloaded")
            page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
            enter_timeline(page)

            section, mat = assert_selected_work_mat(page, label)
            assert_settled_project_cards(page, label, "all", TASK6_INTENTS["all"])
            screenshots.append(capture_task6_state(page, output_dir, f"task6-{label}-all.png"))
            if label in ("desktop-1440", "mobile-390"):
                last_project = section.locator("[data-project-id]").last
                last_project.evaluate("node => node.scrollIntoView({block: 'end', inline: 'nearest'})")
                screenshots.append(capture_task6_state(page, output_dir, f"task6-{label}-lower-ruler.png"))

            for intent_id, expected in TASK6_INTENTS.items():
                control = section.locator(f"[data-project-intent='{intent_id}']")
                control.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
                control.focus()
                page.wait_for_timeout(750)
                if use_touch:
                    tap_visible_control(page, control, f"{label}/{intent_id}")
                else:
                    control.press("Enter")
                actual = wait_for_project_order(page, expected)
                assert actual == expected, f"{label}/{intent_id}: {actual} != {expected}"
                assert_settled_project_cards(page, label, intent_id, expected)
                if intent_id == "product-thinking":
                    if label in ("mobile-390", "mobile-320"):
                        screenshots.append(capture_task6_state(page, output_dir, f"task6-{label}-product-intent.png"))
                    first_product = section.locator("[data-project-id]").first
                    first_product.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
                    top_metrics = assert_settled_project_cards(page, label, "product-thinking-top-evidence", expected)
                    print(f"Task 6 settled product cards ({label}): {json.dumps(top_metrics)}")
                    if label in ("desktop-1280", "mobile-390", "mobile-320"):
                        first_filename = (
                            f"task6-{label}-product-intent-first.png"
                            if use_touch
                            else f"task6-{label}-product-intent.png"
                        )
                        screenshots.append(capture_task6_state(page, output_dir, first_filename))
                        if use_touch:
                            middle_product = section.locator("[data-project-id]").nth(2)
                            middle_product.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
                            assert_settled_project_cards(page, label, "product-thinking-middle-evidence", expected)
                            screenshots.append(capture_task6_state(page, output_dir, f"task6-{label}-product-intent-middle.png"))
                        last_product = section.locator("[data-project-id]").last
                        last_product.evaluate("node => node.scrollIntoView({block: 'end', inline: 'nearest'})")
                        assert_settled_project_cards(page, label, "product-thinking-lower-evidence", expected)
                        screenshots.append(capture_task6_state(page, output_dir, f"task6-{label}-product-intent-lower.png"))
                assert control.get_attribute("aria-pressed") == "true"
                count = section.locator("[data-visible-project-count]")
                assert count.get_attribute("data-visible-project-count") == str(len(expected))
                assert count.inner_text().startswith(str(len(expected)))

            all_control = section.locator("[data-project-intent='all']")
            all_control.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
            all_control.focus()
            page.wait_for_timeout(750)
            if use_touch:
                tap_visible_control(page, all_control, f"{label}/all-restored")
            else:
                all_control.press("Enter")
            wait_for_project_order(page, TASK6_INTENTS["all"])
            assert_settled_project_cards(page, label, "all-restored", TASK6_INTENTS["all"])
            cards = section.locator("[data-project-card]")
            assert cards.count() == 10
            card_labels_fit = section.locator("[data-project-card-title]").evaluate_all(
                """nodes => nodes.map(node => {
                  const style = getComputedStyle(node);
                  return node.scrollWidth <= node.clientWidth + 1
                    && node.scrollHeight <= node.clientHeight + 1
                    && style.textOverflow !== 'ellipsis'
                    && style.webkitLineClamp === 'none';
                })"""
            )
            assert all(card_labels_fit), f"{label}: project card labels overflow or ellipsize"

            first_card = cards.first
            first_card.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
            first_card.focus()
            if use_touch:
                first_card.tap(force=True)
            else:
                first_card.press("Enter")
            project = page.locator(
                "[role='dialog'][aria-modal='true']:is([aria-labelledby='project-detail-title'], [aria-labelledby='glyph-project-title']):visible"
            )
            project.wait_for(state="visible")
            page.wait_for_function("() => window.location.pathname === '/work/glyph'")
            if label == "desktop-1440":
                screenshots.append(capture_task6_state(page, output_dir, "task6-desktop-1440-project-detail.png"))
            page.keyboard.press("Escape")
            project.wait_for(state="detached")
            page.wait_for_function(
                "() => window.location.pathname === '/' && window.history.state?.modal !== 'project' && !document.querySelector('[role=dialog]')"
            )
            page.wait_for_timeout(100)
            assert first_card.evaluate("node => document.activeElement === node"), f"{label}: Escape focus return failed"

            if reduced_motion == "reduce":
                assert mat.evaluate(
                    "node => node.getAnimations({subtree: true}).filter(animation => animation.effect.getTiming().iterations === Infinity && animation.playState === 'running').length"
                ) == 0, "reduced-motion: Selected Work mat still has infinite motion"

            _, journal = open_tinkerverse_journal(page, use_touch=use_touch)
            journal.wait_for(state="visible")
            page.keyboard.press("Escape")
            journal.wait_for(state="detached")

            overflow = horizontal_overflow(page)
            assert overflow["content"] <= overflow["viewport"] + 1, f"{label}: horizontal overflow {overflow}"
            assert not captured["console_errors"], captured["console_errors"]
            assert not captured["page_errors"], captured["page_errors"]
            assert not captured["failed_local_requests"], captured["failed_local_requests"]
            results.append({
                "label": label,
                "overflow": overflow,
                "errors": captured,
                "screenshots": screenshots,
            })
            context.close()

        for close_mode, card_index, project_id in (
            ("back", 1, "zero-my-ai"),
            ("close-button", 2, "familysync-jpmorgan"),
        ):
            modal_context = browser.new_context(viewport={"width": 1280, "height": 800})
            modal_page = modal_context.new_page()
            captured = install_error_capture(modal_page)
            modal_page.goto(base_url, wait_until="domcontentloaded")
            modal_page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
            enter_timeline(modal_page)
            section = modal_page.locator("#projects")
            section.evaluate("node => node.scrollIntoView({block: 'start', inline: 'nearest'})")
            section.get_by_role("heading", name="I want to see how Adi…", exact=True).wait_for(state="visible")
            card = section.locator("[data-project-card]").nth(card_index)
            card.wait_for(state="visible")
            card.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
            print(f"Task 6 isolated modal check: mode={close_mode}, project={project_id}, card_index={card_index}")
            card.focus()
            card.press("Enter")
            detail = modal_page.locator(TASK6_PROJECT_DIALOG_SELECTOR)
            try:
                detail.wait_for(state="visible")
            except PlaywrightTimeoutError as exc:
                raise AssertionError(
                    f"Task 6 isolated modal did not open: mode={close_mode}, project={project_id}, card_index={card_index}, "
                    f"path={modal_page.evaluate('window.location.pathname')!r}"
                ) from exc
            modal_page.wait_for_function(
                "expected => window.location.pathname === expected",
                arg=f"/work/{project_id}",
            )
            if close_mode == "back":
                modal_page.go_back()
            else:
                detail.get_by_role("button", name=re.compile(r"^Close .+ case study$")).click()
            detail.wait_for(state="detached")
            modal_page.wait_for_function(
                "() => window.location.pathname === '/' && window.history.state?.modal !== 'project' && !document.querySelector('[role=dialog]')"
            )
            assert card.evaluate("node => document.activeElement === node"), f"{close_mode}: focus return failed"
            assert not captured["console_errors"], captured["console_errors"]
            assert not captured["page_errors"], captured["page_errors"]
            assert not captured["failed_local_requests"], captured["failed_local_requests"]
            results.append({"label": f"project-{close_mode}", "project": project_id, "errors": captured})
            modal_context.close()

        deep_context = browser.new_context(viewport={"width": 1280, "height": 800})
        deep_page = deep_context.new_page()
        captured = install_error_capture(deep_page)
        for project_id in TASK6_INTENTS["all"]:
            deep_page.goto(f"{base_url.rstrip('/')}/work/{project_id}", wait_until="domcontentloaded")
            detail = deep_page.locator(TASK6_PROJECT_DIALOG_SELECTOR)
            detail.wait_for(state="visible")
            deep_page.wait_for_function(
                "expected => window.location.pathname === expected",
                arg=f"/work/{project_id}",
            )
            deep_page.keyboard.press("Escape")
            detail.wait_for(state="detached")
            deep_page.wait_for_function("() => window.location.pathname === '/' ")
        assert not captured["console_errors"], captured["console_errors"]
        assert not captured["page_errors"], captured["page_errors"]
        assert not captured["failed_local_requests"], captured["failed_local_requests"]
        results.append({
            "label": "direct-work-paths",
            "projects": TASK6_INTENTS["all"],
            "errors": captured,
        })
        deep_context.close()
        browser.close()

    result_path = output_dir / "task6-measurements.json"
    result_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Task 6 browser verified across all intents, deep links, desktop, mobile, and reduced motion: {result_path}")


def run_task7_browser(base_url: str, output_dir: Path) -> None:
    """Verify the final shell, dialog, public flow, and responsive navigation."""
    output_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []
    built_revision: str | None = None
    expected_count: int | None = None

    def boxes_overlap(first: dict[str, float], second: dict[str, float], gap: float = 0) -> bool:
        return not (
            first["x"] + first["width"] + gap <= second["x"]
            or second["x"] + second["width"] + gap <= first["x"]
            or first["y"] + first["height"] + gap <= second["y"]
            or second["y"] + second["height"] + gap <= first["y"]
        )
    cases = (
        (1440, 900, "desktop", "no-preference"),
        (1280, 800, "desktop-compact", "no-preference"),
        (1024, 768, "tablet", "no-preference"),
        (390, 844, "mobile", "no-preference"),
        (375, 667, "mobile-mid", "no-preference"),
        (320, 700, "mobile-small", "no-preference"),
        (1280, 800, "reduced-motion", "reduce"),
    )

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for width, height, label, reduced_motion in cases:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                reduced_motion=reduced_motion,
                has_touch=width < 768,
                is_mobile=width < 768,
            )
            page = context.new_page()
            captured = install_error_capture(page)
            page.goto(base_url, wait_until="domcontentloaded")
            page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()

            public_nav = page.locator("nav[aria-label='Sections']:visible")
            public_nav.wait_for()
            nav_buttons = public_nav.get_by_role("button")
            assert nav_buttons.count() == 3, f"{label}: public navigation must expose exactly three destinations"
            assert page.get_by_role("button", name=re.compile("Writings", re.I)).count() == 0
            assert page.get_by_role("link", name=re.compile("Writings", re.I)).count() == 0
            assert page.locator("#writings").count() == 0, f"{label}: Writings is discoverable in the public flow"

            nav_glass = public_nav.locator("[data-nav-glass]") if public_nav.get_attribute("data-nav-glass") is None else public_nav
            assert nav_glass.count() == 1
            assert "blur" in nav_glass.evaluate("node => getComputedStyle(node).backdropFilter")

            arcs = page.locator("[data-discipline-arcs]:visible")
            evidence = page.locator("[data-github-evidence]:visible")
            arcs.wait_for()
            evidence.wait_for()
            assert arcs.count() == 1
            case_revision, case_count = built_revision_and_count(evidence)
            if built_revision is None:
                built_revision, expected_count = case_revision, case_count
            assert case_revision == built_revision and case_count == expected_count, (
                f"{label}: Git evidence changed across one built artifact"
            )
            assert evidence.locator("[data-exact-commit-count]").inner_text().strip() == str(expected_count)
            chart = evidence.locator("[data-contribution-chart]")
            assert chart.is_visible()
            assert any(chart.locator("[data-contribution-cell]").evaluate_all(
                "nodes => nodes.map(node => node.dataset.active === 'true')"
            )), f"{label}: shell hides or empties the contribution history"

            nav_box = public_nav.bounding_box()
            evidence_box = evidence.bounding_box()
            assert nav_box and evidence_box and not boxes_overlap(nav_box, evidence_box, 8), (
                f"{label}: public shell navigation collides with GitHub evidence"
            )
            arc_target_boxes = arcs.locator("[data-project-node], [data-discipline-option]").evaluate_all(
                "nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; })"
            )
            assert all(not boxes_overlap(nav_box, target, 4) for target in arc_target_boxes), (
                f"{label}: public shell navigation collides with the accepted two-arc targets"
            )

            if width < 768:
                headline_box = page.get_by_role("heading", name="Adi Agarwal", exact=True).bounding_box()
                assert headline_box and nav_box["y"] + nav_box["height"] + 8 <= headline_box["y"], (
                    f"{label}: mobile identity/navigation collides with the hero headline"
                )

            if width < 768:
                mobile_photo_fallback = page.locator("[data-header-photo-fallback]")
                assert "url(" in mobile_photo_fallback.evaluate(
                    "node => getComputedStyle(node).backgroundImage"
                ), f"{label}: mobile identity has no painted local image fallback"
                assert all(
                    nav_buttons.evaluate_all(
                        "nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })"
                    )
                ), f"{label}: mobile nav targets must be at least 44px"
                assert_mobile_hero_receipt_spacing(page, f"{label}/initial")

            page.screenshot(path=str(output_dir / f"task7-{label}-hero.png"), full_page=True)

            # Keep a DOM-stable handle for focus-return checks. The accessible
            # role locator can temporarily disappear while the dialog's
            # aria-modal subtree is removed and the accessibility tree refreshes,
            # even though the trigger remains mounted and receives focus.
            profile_trigger = page.locator(
                '#profile [role="button"][aria-label="View profile"]'
            )
            assert profile_trigger.count() == 1, f"{label}: hero profile trigger is not unique"
            profile_trigger.focus()
            page.keyboard.press("Enter")
            dialog = page.get_by_role("dialog", name="Hello, I'm Adi.")
            dialog.wait_for()
            page.wait_for_timeout(500)
            assert dialog.get_by_role("link", name="Connect on LinkedIn").count() == 1
            assert dialog.get_by_role("link", name="View Resume").count() == 1
            assert dialog.locator("[data-profile-glass]").count() == 1
            backdrop_alpha = dialog.evaluate(
                "node => { const c = getComputedStyle(node).backgroundColor.match(/[\\d.]+/g)?.map(Number) || []; return c.length > 3 ? c[3] : 1; }"
            )
            assert backdrop_alpha <= 0.65, f"{label}: profile backdrop still blacks out page context"
            assert dialog.get_by_role("button", name="Close profile").evaluate(
                "node => { const r = node.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }"
            )
            main = page.locator("#main-content")
            modal_scroll_top = main.evaluate("node => node.scrollTop")
            page.mouse.wheel(0, 420)
            page.wait_for_timeout(80)
            assert main.evaluate("node => node.scrollTop") == modal_scroll_top
            assert dialog.is_visible(), f"{label}: modal-open wheel escaped the dialog"
            for _ in range(5):
                page.keyboard.press("Tab")
                assert dialog.evaluate("node => node.contains(document.activeElement)"), f"{label}: profile focus trap escaped"
            if label in ("desktop", "mobile", "mobile-small"):
                page.screenshot(path=str(output_dir / f"task7-{label}-profile.png"), full_page=True)
            page.keyboard.press("Escape")
            dialog.wait_for(state="detached")
            page.wait_for_function("() => window.history.state?.modal !== 'profile'")
            assert page.locator("#profile").get_attribute("aria-hidden") == "false"
            assert profile_trigger.evaluate("node => document.activeElement === node")

            # Browser Back is a distinct dialog-close contract.
            profile_trigger.focus()
            page.keyboard.press("Enter")
            dialog.wait_for()
            page.wait_for_function("() => window.history.state?.modal === 'profile'")
            page.go_back()
            dialog.wait_for(state="detached")
            page.wait_for_function("() => window.history.state?.modal !== 'profile'")
            assert profile_trigger.evaluate("node => document.activeElement === node")

            if label in ("desktop", "mobile"):
                profile_trigger.focus()
                page.keyboard.press("Enter")
                dialog.wait_for()
                dialog.click(position={"x": 4, "y": 4})
                dialog.wait_for(state="detached")
                page.wait_for_function("() => window.history.state?.modal !== 'profile'")

            profile_trigger.focus()
            page.keyboard.press("Enter")
            dialog.wait_for()
            dialog.get_by_role("button", name="Close profile").click()
            dialog.wait_for(state="detached")
            page.wait_for_function("() => window.history.state?.modal !== 'profile'")
            assert profile_trigger.evaluate("node => document.activeElement === node")

            page.get_by_role("button", name="Navigate to Experiences").click()
            page.locator("#profile[aria-hidden='true']").wait_for()
            page.wait_for_timeout(80 if reduced_motion == "reduce" else 650)
            main.wait_for()

            if width >= 768:
                header = page.locator("[data-scroll-header]:visible")
                identity = header.locator("[data-header-identity]")
                indicator = header.locator("[data-section-indicator]")
                header.wait_for()
                assert identity.count() == 1 and indicator.count() == 1
                identity_box = identity.bounding_box()
                indicator_box = indicator.bounding_box()
                assert identity_box and indicator_box and identity_box["x"] < indicator_box["x"]
                photo = identity.locator("[data-header-photo]")
            else:
                identity = page.locator("[data-mobile-identity]:visible")
                identity.wait_for()
                photo = identity.locator("[data-header-photo]")
            assert "32%" in photo.evaluate("node => getComputedStyle(node).objectPosition")
            page.screenshot(path=str(output_dir / f"task7-{label}-experience.png"), full_page=True)

            start_top = main.evaluate("node => node.scrollTop")
            page.mouse.move(width // 2, height // 2)
            page.mouse.wheel(0, 420)
            page.wait_for_timeout(180)
            after_wheel = main.evaluate("node => node.scrollTop")
            assert after_wheel > start_top, f"{label}: ordinary wheel does not naturally advance the flow"

            for _ in range(6):
                page.mouse.wheel(0, 180)
            page.wait_for_timeout(180)
            after_burst = main.evaluate("node => node.scrollTop")
            assert after_burst >= after_wheel, f"{label}: rapid wheel burst reverses or stalls the flow"

            page.get_by_role("button", name="Navigate to Projects").click()
            page.locator("#projects").wait_for(state="visible")
            page.wait_for_timeout(250 if reduced_motion == "reduce" else 700)
            assert main.evaluate("node => node.scrollTop") > 0
            page.screenshot(path=str(output_dir / f"task7-{label}-work.png"), full_page=True)

            main.evaluate("node => { node.scrollTop = node.scrollHeight; }")
            footer = page.locator("footer[data-portfolio-footer]")
            footer.wait_for(state="visible")
            page.wait_for_timeout(250)
            assert footer.inner_text().strip() == FOOTER_STATEMENT
            assert footer.locator("a, button").count() == 0
            assert page.locator("footer").count() == 1
            if width >= 768:
                section_indicator = page.locator("[data-section-indicator]:visible")
                assert section_indicator.locator("span").nth(1).inner_text().strip() == "Closing note"
            page.screenshot(path=str(output_dir / f"task7-{label}-footer.png"), full_page=True)

            footer_top = main.evaluate("node => node.scrollTop")
            page.mouse.wheel(0, -420)
            page.wait_for_timeout(180)
            assert main.evaluate("node => node.scrollTop") < footer_top, f"{label}: reverse wheel does not leave footer"

            main.evaluate("node => { node.scrollTop = 0; }")
            page.mouse.wheel(0, -220)
            hero_layer = page.locator("#profile:not([aria-hidden='true'])")
            hero_layer.wait_for()
            timeline_layer = page.locator("#resume")
            page.wait_for_function(
                """() => {
                    const hero = document.querySelector('#profile');
                    const timeline = document.querySelector('#resume');
                    if (!hero || !timeline) return false;
                    const heroStyle = getComputedStyle(hero);
                    const timelineStyle = getComputedStyle(timeline);
                    return heroStyle.opacity === '1'
                        && heroStyle.visibility === 'visible'
                        && timelineStyle.display === 'none';
                }""",
                timeout=3000,
            )

            hero_state = hero_layer.evaluate(
                """node => {
                    const style = getComputedStyle(node);
                    return {
                        opacity: Number(style.opacity),
                        visibility: style.visibility,
                        pointerEvents: style.pointerEvents,
                    };
                }"""
            )
            assert hero_state == {
                "opacity": 1,
                "visibility": "visible",
                "pointerEvents": "auto",
            }, f"{label}: hero return never settles atomically {hero_state}"
            assert timeline_layer.evaluate(
                "node => node.inert && node.getAttribute('aria-hidden') === 'true' && getComputedStyle(node).display === 'none'"
            ), f"{label}: portfolio content remains painted or interactive over the returned hero"
            assert timeline_layer.locator(":visible").count() == 0, (
                f"{label}: stale timeline/work/footer descendants remain visible after hero return"
            )

            active_nav = public_nav.locator('[aria-current="page"]')
            assert active_nav.count() == 1
            assert active_nav.get_attribute("aria-label") == "Navigate to Profile", (
                f"{label}: returned hero and public navigation disagree"
            )
            assert not page.locator("[data-scroll-header]").is_visible(), (
                f"{label}: scroll header remains painted over the returned hero"
            )

            for protected in (
                page.locator("[data-github-evidence]:visible"),
                page.locator('#profile [role="button"][aria-label="View profile"]'),
                page.locator("[data-discipline-arcs]:visible"),
            ):
                protected_box = protected.bounding_box()
                assert protected_box
                stale_at_center = page.evaluate(
                    """({x, y}) => document.elementsFromPoint(x, y)
                        .some(node => node.closest?.('#resume'))""",
                    {
                        "x": protected_box["x"] + protected_box["width"] / 2,
                        "y": protected_box["y"] + protected_box["height"] / 2,
                    },
                )
                assert not stale_at_center, f"{label}: hidden portfolio layer still intercepts hero content"

            if width < 768:
                assert_mobile_hero_receipt_spacing(page, f"{label}/return")

            overflow = horizontal_overflow(page)
            assert overflow["content"] <= overflow["viewport"] + 1, f"{label}: horizontal overflow {overflow}"
            page.screenshot(path=str(output_dir / f"task7-{label}-hero-return.png"), full_page=True)
            assert not captured["console_errors"], captured["console_errors"]
            assert not captured["page_errors"], captured["page_errors"]
            assert not captured["failed_local_requests"], captured["failed_local_requests"]
            assert not captured["error_responses"], captured["error_responses"]
            results.append({
                "label": label,
                "builtRevision": built_revision,
                "commitCount": expected_count,
                "overflow": overflow,
                "errors": captured,
                "screenshots": [
                    str(output_dir / f"task7-{label}-hero.png"),
                    str(output_dir / f"task7-{label}-experience.png"),
                    str(output_dir / f"task7-{label}-work.png"),
                    str(output_dir / f"task7-{label}-footer.png"),
                    str(output_dir / f"task7-{label}-hero-return.png"),
                ],
            })
            context.close()

        direct_context = browser.new_context(viewport={"width": 1280, "height": 800})
        direct_page = direct_context.new_page()
        direct_errors = install_error_capture(direct_page)
        direct_page.goto(f"{base_url.rstrip('/')}#writings", wait_until="domcontentloaded")
        direct_page.locator("#writings").wait_for(state="visible")
        assert direct_page.get_by_role("heading", name="Writings", exact=True).count() == 1
        assert direct_page.get_by_role("button", name=re.compile("Navigate to Writings", re.I)).count() == 0
        assert not direct_errors["console_errors"], direct_errors["console_errors"]
        assert not direct_errors["page_errors"], direct_errors["page_errors"]
        assert not direct_errors["failed_local_requests"], direct_errors["failed_local_requests"]
        direct_context.close()

        # Cross-feature smoke: final shell changes must not break the richer
        # Northwestern case, TinkerVerse journal, or Selected Work dialog.
        smoke_context = browser.new_context(viewport={"width": 1280, "height": 800})
        smoke_page = smoke_context.new_page()
        smoke_errors = install_error_capture(smoke_page)
        smoke_page.goto(base_url, wait_until="domcontentloaded")
        smoke_page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
        enter_timeline(smoke_page)

        northwestern = smoke_page.get_by_role("button", name="Open MS Engineering Design Innovation")
        northwestern.scroll_into_view_if_needed()
        northwestern.click()
        northwestern_detail = smoke_page.locator("[data-experience-id='ms-edi']")
        northwestern_detail.wait_for(state="visible")
        assert northwestern_detail.locator("[data-feature-card]").count() == 4
        assert northwestern_detail.locator("[data-linked-project-id]").count() == 2
        # ExperienceDetail deliberately portals its top-level close control to
        # document.body so it stays above nested feature/project surfaces.
        smoke_page.get_by_role("button", name="Close", exact=True).click()
        northwestern_detail.wait_for(state="detached")

        tinker_trigger, journal = open_tinkerverse_journal(smoke_page)
        assert journal.locator("[data-journal-lead]").count() == 1
        assert journal.locator("[data-journal-entry]").count() == 5
        smoke_page.keyboard.press("Escape")
        journal.wait_for(state="detached")
        assert tinker_trigger.evaluate("node => document.activeElement === node")

        smoke_page.get_by_role("button", name="Navigate to Projects").click()
        work = smoke_page.locator("#projects")
        work.wait_for(state="visible")
        first_project = work.locator("[data-project-card]").first
        first_project.evaluate("node => node.scrollIntoView({block: 'center', inline: 'nearest'})")
        first_project.focus()
        first_project.press("Enter")
        project_detail = smoke_page.locator(TASK6_PROJECT_DIALOG_SELECTOR)
        project_detail.wait_for(state="visible")
        smoke_page.keyboard.press("Escape")
        project_detail.wait_for(state="detached")
        assert first_project.evaluate("node => document.activeElement === node")
        assert not smoke_errors["console_errors"], smoke_errors["console_errors"]
        assert not smoke_errors["page_errors"], smoke_errors["page_errors"]
        assert not smoke_errors["failed_local_requests"], smoke_errors["failed_local_requests"]
        results.append({"label": "shell-cross-feature-smoke", "errors": smoke_errors})
        smoke_context.close()

        deep_context = browser.new_context(viewport={"width": 1280, "height": 800})
        deep_page = deep_context.new_page()
        deep_errors = install_error_capture(deep_page)
        deep_page.goto(f"{base_url.rstrip('/')}/work/glyph", wait_until="domcontentloaded")
        deep_detail = deep_page.locator(TASK6_PROJECT_DIALOG_SELECTOR)
        deep_detail.wait_for(state="visible")
        deep_page.go_back()
        deep_detail.wait_for(state="detached")
        deep_page.wait_for_function("() => window.location.pathname === '/'")
        assert not deep_errors["console_errors"], deep_errors["console_errors"]
        assert not deep_errors["page_errors"], deep_errors["page_errors"]
        assert not deep_errors["failed_local_requests"], deep_errors["failed_local_requests"]
        results.append({"label": "selected-work-deep-link-back", "errors": deep_errors})
        deep_context.close()

        # Real Chromium touch input: swipe the hero into the portfolio, then
        # move the native inner scroller down and back up.
        touch_context = browser.new_context(
            viewport={"width": 390, "height": 844},
            has_touch=True,
            is_mobile=True,
        )
        touch_page = touch_context.new_page()
        touch_errors = install_error_capture(touch_page)
        touch_page.goto(base_url, wait_until="domcontentloaded")
        touch_page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
        client = touch_context.new_cdp_session(touch_page)

        def touch_swipe(start_y: int, end_y: int) -> None:
            client.send("Input.dispatchTouchEvent", {
                "type": "touchStart",
                "touchPoints": [{"x": 190, "y": start_y, "radiusX": 4, "radiusY": 4}],
            })
            for step in range(1, 5):
                next_y = start_y + (end_y - start_y) * step / 4
                client.send("Input.dispatchTouchEvent", {
                    "type": "touchMove",
                    "touchPoints": [{"x": 190, "y": next_y, "radiusX": 4, "radiusY": 4}],
                })
                touch_page.wait_for_timeout(25)
            client.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})

        touch_swipe(690, 430)
        touch_page.locator("#profile[aria-hidden='true']").wait_for()
        touch_page.wait_for_timeout(700)
        touch_main = touch_page.locator("#main-content")
        handoff_top = touch_main.evaluate("node => node.scrollTop")
        touch_swipe(680, 380)
        touch_page.wait_for_timeout(300)
        touch_down = touch_main.evaluate("node => node.scrollTop")
        assert touch_down > handoff_top, "touch: native swipe does not advance the inner portfolio"
        touch_swipe(360, 650)
        touch_page.wait_for_timeout(300)
        touch_up = touch_main.evaluate("node => node.scrollTop")
        assert touch_up < touch_down, "touch: reverse swipe does not move back through the portfolio"
        assert not touch_errors["console_errors"], touch_errors["console_errors"]
        assert not touch_errors["page_errors"], touch_errors["page_errors"]
        assert not touch_errors["failed_local_requests"], touch_errors["failed_local_requests"]
        results.append({
            "label": "touch-bidirectional-flow",
            "scrollTop": {"handoff": handoff_top, "down": touch_down, "up": touch_up},
            "errors": touch_errors,
        })
        touch_context.close()
        browser.close()

    result_path = output_dir / "task7-measurements.json"
    result_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Task 7 browser verified across desktop, tablet, mobile, 320px, reduced motion, and direct Writings: {result_path}")


TASK8_HCD_PROJECTS = (
    {
        "project_id": "familysync-jpmorgan",
        "title": "FamilySync",
        "dialog_id": "hcd-familysync-jpmorgan-title",
        "visual_count": 9,
        "linked_close": "escape",
    },
    {
        "project_id": "mcdonalds-interaction-design",
        "title": "Squad Up",
        "dialog_id": "hcd-mcdonalds-interaction-design-title",
        "visual_count": 18,
        "linked_close": "back",
    },
)


def assert_no_error_boundary(page: Page, captured: dict[str, list[str]], label: str) -> None:
    body_text = page.locator("body").inner_text()
    assert "Something went wrong" not in body_text, f"{label}: error boundary rendered: {body_text[:500]}"
    assert "Cannot read properties of undefined" not in body_text, f"{label}: renderer exception reached the page"
    assert not captured["page_errors"], f"{label}: page errors: {captured['page_errors']}"


def wait_for_hcd_dialog(page: Page, project: dict[str, object], label: str):
    dialog = page.locator(
        f"[role='dialog'][aria-modal='true'][aria-labelledby='{project['dialog_id']}']:visible"
    )
    try:
        dialog.wait_for(state="visible", timeout=5_000)
    except PlaywrightTimeoutError as exc:
        raise AssertionError(
            f"{label}: rich {project['title']} dialog did not render; body={page.locator('body').inner_text()[:500]!r}"
        ) from exc
    dialog.get_by_role("heading", name=str(project["title"]), exact=True).wait_for(state="visible")
    assert dialog.locator("[data-hcd-workshop-surface]").count() == 1, f"{label}: workshop surface missing"
    assert dialog.locator("[data-hcd-section]").count() == 5, f"{label}: five-section story missing"
    assert dialog.locator("[data-hcd-visual-id]").count() == project["visual_count"], (
        f"{label}: wrong rich visual count"
    )
    page.wait_for_function(
        "root => Number.parseFloat(getComputedStyle(root).opacity) >= 0.99",
        arg=dialog.element_handle(),
    )
    paint_order = dialog.evaluate(
        """root => {
          const rect = root.getBoundingClientRect();
          const points = [
            {x: rect.left + rect.width * 0.25, y: rect.top + 110},
            {x: rect.left + rect.width * 0.5, y: rect.top + 190},
            {x: rect.left + rect.width * 0.75, y: rect.top + 300},
          ];
          return points.map(point => {
            const top = document.elementsFromPoint(point.x, point.y)
              .find(node => node !== document.documentElement && node !== document.body);
            return {
              point,
              owned: Boolean(top && (top === root || root.contains(top))),
              topTag: top?.tagName ?? 'none',
              topText: top?.textContent?.trim().slice(0, 80) ?? '',
            };
          });
        }"""
    )
    assert all(sample["owned"] for sample in paint_order), (
        f"{label}: underlying portfolio content paints above the HCD dialog: {paint_order}"
    )
    return dialog


def open_northwestern_detail(page: Page, width: int):
    page.get_by_role("heading", name="Adi Agarwal", exact=True).wait_for()
    enter_timeline(page)
    northwestern = page.get_by_role("button", name="Open MS Engineering Design Innovation")
    northwestern.scroll_into_view_if_needed()
    northwestern.click()
    if width >= 768:
        experience = page.locator("[data-experience-id='ms-edi']")
        experience.wait_for(state="visible")
    else:
        experience = northwestern
        experience.locator("[data-linked-project-id]").first.wait_for(state="visible")
    return experience


def run_task8_browser(base_url: str, output_dir: Path) -> None:
    """Regression for the HCD story contract and Northwestern nested-return path."""
    output_dir.mkdir(parents=True, exist_ok=True)
    failures: list[str] = []
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for width, height, viewport_label in ((1280, 800, "desktop"), (390, 844, "mobile")):
            for project in TASK8_HCD_PROJECTS:
                label = f"{viewport_label}/northwestern/{project['project_id']}"
                context = browser.new_context(viewport={"width": width, "height": height}, has_touch=width < 768)
                page = context.new_page()
                captured = install_error_capture(page)
                try:
                    page.goto(base_url, wait_until="domcontentloaded")
                    experience = open_northwestern_detail(page, width)
                    trigger = experience.locator(f"[data-linked-project-id='{project['project_id']}']")
                    trigger.scroll_into_view_if_needed()
                    if width < 768:
                        trigger.click()
                    else:
                        trigger.focus()
                        trigger.press("Enter")
                    dialog = wait_for_hcd_dialog(page, project, label)
                    assert_no_error_boundary(page, captured, label)
                    page.screenshot(
                        path=str(output_dir / f"task8-{viewport_label}-{project['project_id']}-nested.png"),
                        caret="hide",
                    )

                    if project["linked_close"] == "escape":
                        page.keyboard.press("Escape")
                    else:
                        page.go_back()
                    dialog.wait_for(state="detached")
                    experience.wait_for(state="visible")
                    page.wait_for_function(
                        "() => window.location.pathname === '/' && window.history.state?.modal !== 'project'"
                    )
                    assert trigger.evaluate("node => document.activeElement === node"), f"{label}: focus was not restored"
                    assert_no_error_boundary(page, captured, label)
                    assert not captured["console_errors"], f"{label}: console errors: {captured['console_errors']}"
                    assert not captured["failed_local_requests"], f"{label}: local request failures: {captured['failed_local_requests']}"
                    results.append({"label": label, "close": project["linked_close"], "errors": captured})
                except Exception as exc:
                    failures.append(f"{label}: {type(exc).__name__}: {exc}; page_errors={captured['page_errors']}")
                finally:
                    context.close()

            for project in TASK8_HCD_PROJECTS:
                label = f"{viewport_label}/direct/{project['project_id']}"
                context = browser.new_context(viewport={"width": width, "height": height}, has_touch=width < 768)
                page = context.new_page()
                captured = install_error_capture(page)
                try:
                    page.goto(f"{base_url.rstrip('/')}/work/{project['project_id']}", wait_until="domcontentloaded")
                    dialog = wait_for_hcd_dialog(page, project, label)
                    assert_no_error_boundary(page, captured, label)

                    visual_trigger = dialog.locator("[data-hcd-visual-trigger]").first
                    visual_trigger.scroll_into_view_if_needed()
                    visual_alt = visual_trigger.locator("img").get_attribute("alt")
                    visual_trigger.focus()
                    visual_trigger.press("Enter")
                    lightbox = page.get_by_role("dialog", name=f"Full view: {visual_alt}", exact=True)
                    lightbox.wait_for(state="visible")
                    lightbox.get_by_role("button", name="Close full view", exact=True).click()
                    lightbox.wait_for(state="detached")
                    dialog.wait_for(state="visible")
                    page.wait_for_function(
                        "node => document.activeElement === node",
                        arg=visual_trigger.element_handle(),
                    )
                    assert visual_trigger.evaluate("node => document.activeElement === node"), (
                        f"{label}: lightbox close did not restore visual-trigger focus"
                    )

                    page.get_by_role(
                        "button", name=f"Close {project['title']} case study", exact=True
                    ).click()
                    dialog.wait_for(state="detached")
                    assert_no_error_boundary(page, captured, label)
                    assert not captured["console_errors"], f"{label}: console errors: {captured['console_errors']}"
                    assert not captured["failed_local_requests"], f"{label}: local request failures: {captured['failed_local_requests']}"
                    results.append({"label": label, "lightbox": "named-close", "projectClose": "named-close", "errors": captured})
                except Exception as exc:
                    failures.append(f"{label}: {type(exc).__name__}: {exc}; page_errors={captured['page_errors']}")
                finally:
                    context.close()
        browser.close()

    if failures:
        raise AssertionError("Task 8 HCD regression failed:\n- " + "\n- ".join(failures))

    result_path = output_dir / "task8-measurements.json"
    result_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Task 8 HCD regression passed across Northwestern and direct desktop/mobile paths: {result_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "mode",
        choices=(
            "source-contract",
            "task2-source-contract",
            "task3-source-contract",
            "task5-source-contract",
            "task6-source-contract",
            "task7-source-contract",
            "baseline",
            "regression",
            "task2-regression",
            "task3-regression",
            "task5-regression",
            "task6-regression",
            "task7-regression",
            "task8-regression",
        ),
        nargs="?",
        default="regression",
    )
    parser.add_argument("--base-url", default=os.environ.get("PORTFOLIO_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--output-dir", type=Path, default=ROOT / "review" / "portfolio-redesign" / "artifacts")
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    if arguments.mode == "source-contract":
        verify_source_contract()
    elif arguments.mode == "task2-source-contract":
        verify_task2_source_contract()
    elif arguments.mode == "task3-source-contract":
        verify_task3_source_contract()
    elif arguments.mode == "task5-source-contract":
        verify_task5_source_contract()
    elif arguments.mode == "task6-source-contract":
        verify_task6_source_contract()
    elif arguments.mode == "task7-source-contract":
        verify_task7_source_contract()
    elif arguments.mode == "task2-regression":
        run_task2_browser(arguments.base_url, arguments.output_dir)
    elif arguments.mode == "task3-regression":
        run_task3_browser(arguments.base_url, arguments.output_dir)
    elif arguments.mode == "task5-regression":
        run_task5_browser(arguments.base_url, arguments.output_dir)
    elif arguments.mode == "task6-regression":
        run_task6_browser(arguments.base_url, arguments.output_dir)
    elif arguments.mode == "task7-regression":
        run_task7_browser(arguments.base_url, arguments.output_dir)
    elif arguments.mode == "task8-regression":
        run_task8_browser(arguments.base_url, arguments.output_dir)
    else:
        run_browser(arguments.mode, arguments.base_url, arguments.output_dir)
