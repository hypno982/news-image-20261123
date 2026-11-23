#!/usr/bin/env python3
"""Render card.html to a deterministic 1024x1024 entry.png.

The page is a fixed 1024x1024 newspaper front page, so the frame is the page:
the script measures that nothing spills past the box, that every headline is
fully inside it, and that the browser raised no error, before it screenshots a
single explicit clip.  No randomness, no timers, no network.
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
CARD = HERE / "card.html"
OUT = HERE / "entry.png"
SIZE = 1024

# How many .hl elements sit wholly inside the frame, and where the page ends.
PROBE = """
() => {
  const vw = 1024, vh = 1024;
  const els = Array.from(document.querySelectorAll('.hl'));
  let inside = 0, worst = null;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const ok = r.width > 0 && r.height > 0 &&
               r.top >= -0.5 && r.left >= -0.5 &&
               r.bottom <= vh + 0.5 && r.right <= vw + 0.5;
    if (ok) inside++;
    else if (!worst) worst = el.textContent.trim().slice(0, 64);
  }
  const b = document.body, d = document.documentElement;
  return {
    inside, total: els.length, worst,
    scrollH: b.scrollHeight, scrollW: b.scrollWidth,
    docH: d.scrollHeight, docW: d.scrollWidth,
    dateSize: parseFloat(getComputedStyle(document.querySelector('.dmy')).fontSize),
  };
}
"""


def main() -> int:
    errors = []

    def on_console(msg):
        if msg.type in ("error", "warning"):
            errors.append("console.%s: %s" % (msg.type, msg.text))

    with sync_playwright() as p:
        browser = p.chromium.launch(
            args=["--force-color-profile=srgb", "--disable-lcd-text"])
        page = browser.new_page(
            viewport={"width": SIZE, "height": SIZE},
            device_scale_factor=1,
        )
        page.on("pageerror", lambda e: errors.append("pageerror: %s" % e))
        page.on("console", on_console)

        page.goto(CARD.as_uri(), wait_until="load")
        page.wait_for_timeout(600)

        probe = page.evaluate(PROBE)
        print("headlines inside frame: %s/%s" % (probe["inside"], probe["total"]))
        print("body  %sx%s   doc %sx%s" % (probe["scrollW"], probe["scrollH"],
                                           probe["docW"], probe["docH"]))
        print("date type size: %spx" % probe["dateSize"])

        if probe["total"] < 30:
            raise RuntimeError("only %s headlines in the DOM" % probe["total"])
        if probe["inside"] != probe["total"]:
            raise RuntimeError(
                "%s headline(s) cut off; first: %s"
                % (probe["total"] - probe["inside"], probe["worst"]))
        if max(probe["scrollH"], probe["scrollW"],
               probe["docH"], probe["docW"]) > SIZE:
            raise RuntimeError(
                "page overflows %sx%s: %sx%s"
                % (SIZE, SIZE, probe["docW"], probe["docH"]))

        page.screenshot(path=str(OUT), clip={"x": 0, "y": 0,
                                            "width": SIZE, "height": SIZE})
        browser.close()

    if errors:
        raise RuntimeError("page reported errors:\n  " + "\n  ".join(errors))

    data = OUT.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError("output is not a PNG")
    w = int.from_bytes(data[16:20], "big")
    h = int.from_bytes(data[20:24], "big")
    if (w, h) != (SIZE, SIZE):
        raise RuntimeError("output is %sx%s, expected %sx%s" % (w, h, SIZE, SIZE))
    if len(data) > 1048576:
        raise RuntimeError("output is %s bytes, over the 1 MiB cap" % len(data))

    print("wrote %s" % OUT)
    print("bytes: %d  pixels: %dx%d" % (len(data), w, h))
    return 0


if __name__ == "__main__":
    sys.exit(main())
