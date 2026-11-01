---
name: Nested preview Escape behavior
description: Keep Escape scoped to the top product proof when it opens over a collection dialog
---

When modal layers are nested, Escape must close only the active inner layer and restore focus while preserving its parent dialog.

**Why:** Chromium can dispatch native cancel events for more than one open dialog after a single Escape keypress, so an inner dialog's cancel handler alone may not protect its parent.

**How to apply:** Intercept Escape at the document capture phase when a nested modal is active, prevent the native cancellation, close only that layer, and verify focus restoration in the browser.
