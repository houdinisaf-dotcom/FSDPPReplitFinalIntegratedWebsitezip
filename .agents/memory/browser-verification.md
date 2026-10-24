---
name: Browser verification caveats
description: Native dialog timing and low-level Chromium mobile-emulation limitations
---

Wait for native dialog close-handler cleanup before asserting focus restoration or reopening the same panel.

**Why:** Removing the `open` state happens synchronously, but the native `close` event is queued. Checking only `dialog.open` produced false failures and exposed a possible stale-event reopening race.

**How to apply:** Assert the final focus/scroll-lock cleanup state, and ignore a queued old close event if the dialog has already reopened.

Do not trust responsive measurements after switching an already-loaded desktop Chromium target to `mobile: true`.

**Why:** In this project, mobile emulation after page load left `innerWidth` at 1120px and scaled the visual viewport, even after reload, making screenshots appear cropped or zoomed.

**How to apply:** For reliable responsive proof capture, use a 402px CSS viewport (`mobile: false`, device scale 1), reload after resizing, and confirm `innerWidth` and `visualViewport.scale`. Use a fresh device-emulation context for true mobile/touch testing.

For navigation panels that rerender their rows, use real pointer movement—not `pointerover`—to update the hover selection.

**Why:** Replacing the row under a stationary mouse can synthesize another `pointerover` and overwrite a keyboard-focused selection.

**How to apply:** Preserve the selected row during subtree updates, and let keyboard focus remain active until the pointer actually moves.

For browser tests of proxied development routes, check required `X-Robots-Tag` directives rather than exact header equality.

**Why:** The preview proxy can append its own robots directives to the application's noindex header.

**How to apply:** Assert that `noindex` and `nofollow` are present, and separately verify cache and method restrictions.

When a browser test intentionally triggers full-page navigation, tolerate Chromium’s transient “Inspected target navigated or closed” response.

**Why:** A `location.assign()` can replace the execution context before the initiating CDP `Runtime.evaluate` returns, even when the destination navigation is working correctly.

**How to apply:** Retry only that specific transient error in click/wait helpers; let destination checks time out if the new route never loads.

For cold deep links, use an instant initial scroll even when the storefront uses smooth in-page navigation.

**Why:** The global smooth-scroll rule left direct routes far down a long page mid-animation during browser capture and initial review.

**How to apply:** Keep instant scrolling limited to initial route restoration; retain the site’s smooth or reduced-motion behavior for deliberate in-page navigation.

Do not assume headless Chromium desktop emulation has a fine pointer.

**Why:** This project’s headless browser reports `pointer: fine` as false, and CDP media emulation did not change it. A fine-pointer-only cursor rule therefore computes to the native fallback in that environment.

**How to apply:** In headless checks, validate the injected fine-pointer CSS and the native fallback, and condition computed-cursor assertions on `matchMedia('(pointer: fine)').matches`. Use a real mouse or trackpad to verify the rendered cursor.
