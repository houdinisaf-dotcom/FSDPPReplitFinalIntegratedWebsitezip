---
name: Browser verification caveats
description: Native dialog timing and low-level Chromium mobile-emulation limitations
---

Wait for native dialog close-handler cleanup before asserting focus restoration or reopening the same panel.

**Why:** Removing the `open` state happens synchronously, but the native `close` event is queued. Checking only `dialog.open` produced false failures and exposed a possible stale-event reopening race.

**How to apply:** Assert the final focus/scroll-lock cleanup state, and ignore a queued old close event if the dialog has already reopened.

Do not infer real mobile page overflow solely from measurements in a Chromium session switched from desktop to mobile.

**Why:** Low-level CDP testing reported a 402px visual viewport alongside 1120px layout measurements, despite no visible element wider than 405px and correct fresh mobile preview screenshots.

**How to apply:** Use a dedicated fresh mobile browser context for future interaction automation. Keep mobile visual review separate from verified automated interactions until that setup is reliable; never report the inconsistent test as passing.
