from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:8765/"


def assert_no_horizontal_overflow(page, label):
    dimensions = page.evaluate(
        """() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        })"""
    )
    assert dimensions["content"] <= dimensions["viewport"] + 1, (
        f"{label} has horizontal overflow: {dimensions}"
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    context.grant_permissions(
        ["clipboard-read", "clipboard-write"], origin="http://127.0.0.1:8765"
    )
    page = context.new_page()
    console_errors = []
    page_errors = []
    failed_requests = []
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("requestfailed", lambda request: failed_requests.append(request.url))

    page.goto(BASE_URL, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")

    assert "HCD" in page.title()
    assert page.locator(".artifact-card").count() == 28
    assert page.locator(".artifact-card:visible").count() == 28
    assert page.locator("#visible-count").inner_text() == "28"
    assert page.locator(".source-link").count() == 28
    assert all(
        href.startswith("https://www.figma.com/")
        for href in page.locator(".source-link").evaluate_all(
            "links => links.map(link => link.href)"
        )
    )
    page.wait_for_function(
        """() => [...document.querySelectorAll('.artifact-card img')]
          .every(image => image.complete && image.naturalWidth > 0)"""
    )
    assert page.locator(".artifact-card img").count() == 28
    assert_no_horizontal_overflow(page, "desktop")

    page.locator("#project-filter").select_option("care")
    assert page.locator(".artifact-card:visible").count() == 10
    assert page.locator("#visible-count").inner_text() == "10"
    page.locator("#category-filter").select_option("journey")
    assert page.locator(".artifact-card:visible").count() == 4
    page.locator("#select-visible").click()
    assert page.locator("#selection-count").inner_text() == "4"
    selected_text = page.locator("#selection-output").input_value()
    assert "A school call creates invisible coordination work" in selected_text
    assert selected_text.count("https://www.figma.com/") == 4

    page.reload(wait_until="networkidle")
    assert page.locator("#selection-count").inner_text() == "4"
    page.locator("#project-filter").select_option("all")
    page.locator("#category-filter").select_option("all")
    page.locator("#select-visible").click()
    assert page.locator("#selection-count").inner_text() == "28"
    page.locator("#clear-selection").click()
    assert page.locator("#selection-count").inner_text() == "0"

    page.locator(".artifact-card .pick").first.click()
    assert page.locator("#selection-count").inner_text() == "1"
    page.locator("#copy-selection").click()
    copied_text = page.evaluate("navigator.clipboard.readText()")
    assert "Family care is a multi-person system" in copied_text
    assert "Family care is a multi-person system" in page.locator(
        "#selection-output"
    ).input_value()

    page.locator(".artifact-card .image-button").first.click()
    assert page.locator("#lightbox").evaluate("dialog => dialog.open")
    assert page.locator("#lightbox-title").inner_text() == (
        "Family care is a multi-person system"
    )
    assert page.locator("#lightbox-image").evaluate("image => image.naturalWidth") > 0
    page.locator(".close-lightbox").click()
    assert not page.locator("#lightbox").evaluate("dialog => dialog.open")

    mobile = context.new_page()
    mobile.set_viewport_size({"width": 390, "height": 844})
    mobile.goto(BASE_URL, wait_until="networkidle")
    assert mobile.locator(".artifact-card").count() == 28
    assert mobile.locator(".artifact-card:visible").count() == 28
    assert mobile.locator("#project-filter").is_visible()
    assert mobile.locator("#copy-selection").is_visible()
    assert_no_horizontal_overflow(mobile, "mobile")

    assert not console_errors, f"console errors: {console_errors}"
    assert not page_errors, f"page errors: {page_errors}"
    assert not failed_requests, f"failed requests: {failed_requests}"

    print(
        "Browser verified: 28 artifacts, 28 images, filters 28/10/4, "
        "selection persistence, copy, lightbox, and 390px layout."
    )
    browser.close()
