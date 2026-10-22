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
