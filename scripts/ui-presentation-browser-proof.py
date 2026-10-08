"""Focused Storybook browser proof; uses the existing Python Playwright setup.

Usage: python scripts/ui-presentation-browser-proof.py <storybook-origin> <output-dir>
Requires a built/current Storybook and Chromium. This is not a packed-runtime proof;
run the existing package-smoke command separately. Never substitutes source markup.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import traceback
from playwright.sync_api import expect, sync_playwright

origin = sys.argv[1].rstrip("/")
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
url = origin + "/iframe.html?id=primitives-control-presentation--presentation&viewMode=story"
report = {"url": url, "status": "running", "cases": [], "gaps": ["Native saved-profile autofill UI", "WebKit/Firefox", "Published/live applications"]}
style = r"""e => {
  const s = getComputedStyle(e);
  const resolve = value => {
    const expanded = value.replace(/var\((--[^)]+)\)/g, (_, token) => s.getPropertyValue(token).trim());
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d'); context.fillStyle = expanded;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    return `rgb(${red}, ${green}, ${blue})`;
  };
  return { background: s.backgroundColor, color: s.color, border: s.borderColor,
    height: e.getBoundingClientRect().height, font: s.fontSize,
    duration: s.transitionDuration, property: s.transitionProperty,
    easing: s.transitionTimingFunction, shadow: s.boxShadow, fill: s.webkitTextFillColor,
    well: resolve('var(--bg-input)'), track: resolve('hsl(var(--input))'),
    ink: resolve('hsl(var(--foreground))'), danger: resolve('var(--surface-danger-border)'),
    fast: s.getPropertyValue('--duration-fast').trim() };
}"""
layout = """e => ({
  columns: getComputedStyle(e).gridTemplateColumns.split(/\\s+/).length,
  items: [...e.children].map(n => ({top: n.offsetTop, border: getComputedStyle(n).borderLeftWidth,
    overflow: n.scrollWidth > n.clientWidth + 1,
    textOverflow: [...n.querySelectorAll('dt, dd, dt>span')].some(t => t.scrollWidth > t.clientWidth + 1)
  }))
})"""

def contrast(a, b):
    def luminance(rgb):
        linear = [v / 255 for v in rgb]
        linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in linear]
        return sum(x * y for x, y in zip(linear, [0.2126, 0.7152, 0.0722]))
    high, low = sorted([luminance(a), luminance(b)], reverse=True)
    return (high + 0.05) / (low + 0.05)

def seconds(value):
    if value.endswith("ms"):
        return float(value[:-2]) / 1000
    if value.endswith("s"):
        return float(value[:-1])
    raise AssertionError(f"Not a CSS time: {value}")

def settle(page):
    # Read the final transition state, but never await the pending spinner.
    page.evaluate("async () => { await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))) }")

def check_layout(page, width):
    facts = []
    for columns in [3, 4, 5, 6]:
        result = page.locator(f'[data-columns="{columns}"]').evaluate(layout)
        expected = 2 if width < 640 else min(columns, 3) if width < 1024 and columns > 4 else columns
        assert result["columns"] == expected, (width, columns, result)
        for index, item in enumerate(result["items"]):
            assert item["border"] == ("0px" if index % expected == 0 else "1px"), (width, columns, index, item)
            assert not item["overflow"] and not item["textOverflow"], (width, columns, item)
        facts.append({"preset": columns, **result})
    legacy = page.locator("[data-legacy-summary]").evaluate(layout)
    assert [i["border"] for i in legacy["items"]] == (["0px", "0px", "1px"] if width < 640 else ["0px", "1px", "1px"]), legacy
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
    return facts

try:
    with sync_playwright() as p:
        executable = os.environ.get("CHROMIUM") or shutil.which("chromium") or shutil.which("chromium-browser")
        browser = p.chromium.launch(headless=True, executable_path=executable, args=["--no-sandbox"])
        report["browser"] = browser.version
        for width in [390, 1280]:
            for mode in ["light", "dark"]:
                context = browser.new_context(viewport={"width": width, "height": 900}, has_touch=width < 500, reduced_motion="no-preference")
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(url, wait_until="networkidle")
                page.locator("[data-presentation-contract]").wait_for()
                page.evaluate("mode => { document.documentElement.classList.remove('light','dark'); document.documentElement.dataset.theme=mode; document.querySelector('[data-presentation-contract]').dataset.theme=mode; }", mode)
                settle(page)
                measurements = {}
                coarse = page.evaluate("() => matchMedia('(pointer: coarse)').matches")
                # One control scale: every control at a size shares its height and text size.
                for size, height, font in [("sm", 32, "12px"), ("md", 36, "14px"), ("lg", 44, "16px"), ("compact", 36, "14px"), ("touch", 44, "16px")]:
                    field = page.get_by_role("textbox", name=f"{size} field", exact=True)
                    trigger = page.get_by_role("combobox", name=f"{size} choice", exact=True)
                    button = page.locator(f'[data-size-row="{size}"]').get_by_role("button", name="Save", exact=True)
                    nodes = {"input": field, "select": trigger, "button": button}
                    for name, node in nodes.items():
                        fact = node.evaluate(style)
                        assert fact["height"] == height, (size, name, fact)
                        # Fields never drop below 16px on a coarse pointer (iOS zooms on focus otherwise).
                        assert fact["font"] == ("16px" if coarse and name != "button" else font), (size, name, fact)
                        assert fact["duration"] == "0.15s", fact
                        assert abs(seconds(fact["fast"]) - 0.15) < 0.000001, fact
                        if name != "button":
                            assert fact["background"] == fact["well"] != fact["track"], fact
                            assert fact["color"] == fact["ink"], fact
                        measurements[f"{size}-{name}"] = fact
                    notes = page.get_by_role("textbox", name=f"{size} notes", exact=True).evaluate(style)
                    assert notes["height"] >= (96 if size == "compact" else 120), notes
                    assert notes["background"] == notes["well"], notes
                for label in ["Light island", "Dark island", "Named island", "Email", "Invalid field", "Disabled field"]:
                    fact = page.get_by_role("textbox", name=label, exact=True).evaluate(style)
                    assert fact["background"] == fact["well"] and fact["color"] == fact["ink"], (label, fact)
                    measurements[label] = fact
                assert measurements["Light island"]["well"] != measurements["Dark island"]["well"]
                assert measurements["Invalid field"]["border"] == measurements["Invalid field"]["danger"]
                assert page.get_by_role("textbox", name="Disabled field").is_disabled()
                for node in page.locator("[data-density]").locator("input,button").all():
                    expected = 44 if node.inner_text() == "Touch action" else 32
                    assert node.bounding_box()["height"] == expected

                # Test changed link ink on actual scoped canvas/card colors,
                # not raw hex assumptions.
                action_colors = page.locator("[data-link-action]").evaluate(r"""e => {
                    const c = document.createElement('canvas'); c.width = c.height = 1;
                    const x = c.getContext('2d');
                    const rgb = color => { x.fillStyle=color; x.fillRect(0,0,1,1); return [...x.getImageData(0,0,1,1).data].slice(0,3); };
                    const style = getComputedStyle(e);
                    const resolve = value => rgb(value.replace(/var\((--[^)]+)\)/g, (_, token) => style.getPropertyValue(token).trim()));
                    const result = {ink:rgb(getComputedStyle(e).color), canvas:resolve('hsl(var(--background))'), card:resolve('hsl(var(--card))')};
                    return result;
                }""")
                measurements["linkContrast"] = {plane: contrast(action_colors["ink"], action_colors[plane]) for plane in ["canvas", "card"]}
                assert min(measurements["linkContrast"].values()) >= 4.5, measurements["linkContrast"]

                # Real Radix keyboard and touch paths; all options remain named.
                page.get_by_role("textbox", name="md field", exact=True).focus()
                page.keyboard.press("Tab")
                trigger = page.get_by_role("combobox", name="md choice", exact=True)
                expect(trigger).to_be_focused()
                page.keyboard.press("Space")
                first_option = page.get_by_role("option", name="First account", exact=True)
                first_option.wait_for()
                settle(page)
                expect(first_option).to_be_focused()
                second_option = page.get_by_role("option", name="Second account with a descriptive long name", exact=True)
                # Radix can consume the first arrow while the portalled menu
                # settles; require keyboard focus to reach the named option.
                for _ in range(3):
                    page.keyboard.press("ArrowDown")
                    if second_option.evaluate("e => e === document.activeElement"):
                        break
                expect(second_option).to_be_focused()
                page.keyboard.press("Enter")
                expect(page.locator("[data-choice]")).to_have_text("two")
                expect(trigger).to_be_focused()
                if width < 500:
                    page.get_by_role("combobox", name="touch choice", exact=True).tap()
                    page.get_by_role("option", name="First account", exact=True).tap()
                    expect(page.locator("[data-choice]")).to_have_text("one")
                button = page.locator('[data-size-row="md"]').get_by_role("button", name="Save", exact=True)
                button.focus(); page.keyboard.press("Enter")
                expect(page.locator("[data-action-count]")).to_have_text("1")
                assert page.locator("[data-pending]").is_disabled()
                assert page.locator("[data-pending]").get_attribute("aria-busy") == "true"
                link = page.locator("[data-pending-link]")
                assert link.get_attribute("href") is None
                # Playwright refuses an aria-disabled click. Dispatch one to
                # verify the component guard, then try keyboard activation.
                link.dispatch_event("click"); link.focus(); page.keyboard.press("Enter")
                expect(page.locator("[data-action-count]")).to_have_text("1")
                action = page.locator("[data-long-action]")
                action.tap() if width < 500 else action.click()
                expect(page.locator("[data-action-count]")).to_have_text("2")
                assert action.evaluate("e => e.scrollWidth <= e.clientWidth + 1")

                # A forced pseudo-state is a paint check, not a native autofill receipt.
                cdp = context.new_cdp_session(page)
                cdp.send("DOM.enable"); cdp.send("CSS.enable")
                doc = cdp.send("DOM.getDocument")
                node_id = cdp.send("DOM.querySelector", {"nodeId": doc["root"]["nodeId"], "selector": 'input[name="email"]'})["nodeId"]
                cdp.send("CSS.forcePseudoState", {"nodeId": node_id, "forcedPseudoClasses": ["autofill", "focus"]})
                email = page.get_by_role("textbox", name="Email", exact=True)
                assert email.evaluate("e => e.matches(':autofill')")
                settle(page)
                autofill = email.evaluate(style)
                assert autofill["ink"] == autofill["fill"], autofill
                assert autofill["well"] in autofill["shadow"] and "inset" in autofill["shadow"], autofill
                cdp.send("CSS.forcePseudoState", {"nodeId": node_id, "forcedPseudoClasses": []})
                settle(page)
                grids = check_layout(page, width)
                page.screenshot(path=str(out / f"{width}-{mode}.png"), full_page=True)
                page.emulate_media(reduced_motion="reduce")
                for node in [button, email, trigger]:
                    fact = node.evaluate(style)
                    assert fact["property"] == "none" and fact["duration"] == "0s", fact
                assert page.locator("[data-pending] svg").evaluate("e => getComputedStyle(e).animationName") == "none"
                assert not errors, errors
                report["cases"].append({"width": width, "mode": mode, "measurements": measurements, "grids": grids, "forcedAutofill": autofill, "keyboard": True, "touch": width < 500, "reducedMotion": True, "pageErrors": errors})
                # Edge widths protect disjoint separator ranges, without a second app build.
                if width == 1280 and mode == "light":
                    report["boundaries"] = []
                    for edge in [639, 640, 1023, 1024]:
                        page.set_viewport_size({"width": edge, "height": 900})
                        report["boundaries"].append({"width": edge, "grids": check_layout(page, edge)})
                context.close()
        browser.close()
    report["status"] = "passed"
except Exception:
    report["status"] = "failed"
    report["error"] = traceback.format_exc()
    raise
finally:
    report["screenshots"] = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in out.glob("*.png")}
    (out / "results.json").write_text(json.dumps(report, indent=2) + "\n")
