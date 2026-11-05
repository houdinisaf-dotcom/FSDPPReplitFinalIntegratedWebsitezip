---
name: Browser verification caveats
description: Native dialog timing and low-level Chromium mobile-emulation limitations
---

CDP keyboard activation of native buttons and disclosure summaries requires the full Enter key event, including its carriage-return text.

**Why:** A keydown/keyup pair without text focused the controls but did not trigger native activation, while clicking worked. This produced false interaction failures.

**How to apply:** Send Enter with virtual key code 13 and `text: '\r'` / `unmodifiedText: '\r'` on `keyDown`, then `keyUp`. Wait for the storefront runtime before interacting.

Wait for native dialog close-handler cleanup before asserting focus restoration or reopening the same panel.

**Why:** Removing the `open` state happens synchronously, but the native `close` event is queued. An old event can arrive after reopening and clear the new product state or focus target; asynchronous focus restoration can also steal focus from the reopened dialog.

**How to apply:** Assert the final focus/scroll-lock cleanup state, and ignore a queued old close event if the dialog has already reopened.

CDP `Runtime.evaluate` wait predicates must return serializable primitives, not DOM nodes.

**Why:** Returning a matched element with `returnByValue` can fail with “Object reference chain is too long,” which looks like an application error even when the page is healthy.

**How to apply:** Wrap selector checks in `Boolean(...)` and return strings, numbers, or booleans from browser-test expressions.

Do not trust responsive measurements after switching an already-loaded desktop Chromium target to `mobile: true`.

**Why:** In this project, mobile emulation after page load left `innerWidth` at 1120px and scaled the visual viewport, even after reload, making screenshots appear cropped or zoomed.

**How to apply:** For reliable responsive proof capture, use a 402px CSS viewport (`mobile: false`, device scale 1), reload after resizing, and confirm `innerWidth` and `visualViewport.scale`. Use a fresh device-emulation context for true mobile/touch testing.

Run dialog focus checks in separate desktop and mobile Chromium contexts instead of switching one live context between device modes.

**Why:** In this project, focus restoration passed in the isolated mobile popup flow but failed later after the same session switched back to desktop metrics.

**How to apply:** When a focus assertion fails after changing emulation mode, reproduce it in a fresh context at the intended viewport before changing application behavior.

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

Do not assume headless Chromium desktop emulation has a fine pointer or hover support.

**Why:** This project’s headless browser reports both `pointer: fine` and `hover: hover` as false, and CDP media emulation did not change them. Mouse events can still activate `:hover`, but rules inside a hover media query remain inactive.

**How to apply:** In headless checks, validate keyboard `:focus-within` behavior for hover-reveal content and condition media-query assertions on `matchMedia`. Use a real mouse or trackpad to verify the desktop hover state; do not weaken production hover rules to accommodate headless limitations.

Force off-screen lazy images to load when deliberately testing broken-image fallbacks.

**Why:** The homepage fallback test waited for errors on lazy images outside the viewport; no request meant no error event, producing a false timeout.

**How to apply:** In the test only, set the target image's loading mode to eager before assigning a deliberately missing source. Keep production lazy loading intact.

Exclude interactive zoom-surface geometry from generic layout transitions, and verify actual scroll bounds rather than only inline dimensions.

**Why:** Existing transitions temporarily kept a photo plane at its old computed width despite a larger inline width. This masked whether magnification and panning worked, particularly in mobile/reduced-motion checks.

**How to apply:** Keep zoom dimensions unanimated, check computed size and real pan movement, and test swiping again after closing a magnified viewer so viewer state cannot disable the underlying gallery.

Retry temporary Chromium-profile cleanup after shutdown rather than treating an `ENOTEMPTY` removal error as an application failure.

**Why:** Chromium child processes can finish writing profile/cache files just after the parent exit, even when every browser assertion passed.

**How to apply:** Use bounded retries for recursive temporary-profile removal; distinguish cleanup errors from failed application assertions.

Use the layout viewport's content width for page-edge alignment checks, not the width including a classic scrollbar.

**Why:** Headless Chromium reported a 1440px inner width but 1425px content width with a native scrollbar. A correctly full-width banner ended at the content edge, creating a false alignment failure against inner width.

**How to apply:** Compare content-edge geometry with `document.documentElement.clientWidth`, retaining a small subpixel tolerance. Keep separate overflow checks.

Do not stack a second native dialog over the shopping bag for checkout notices.

**Why:** In Chromium, Escape dismissed both the checkout notice and the underlying bag dialog, making the return-to-bag flow unreliable.

**How to apply:** Keep the bag as the single native modal and render the offline notice as an accessible overlay inside it. Trap Escape and Tab in the overlay, then restore focus to the Checkout button.
