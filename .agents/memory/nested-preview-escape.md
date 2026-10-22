---
name: Nested preview Escape behavior
description: Keep Escape scoped to the top product proof when it opens over a collection dialog
---

When a private product proof opens above an existing collection dialog, Escape must close only the proof and return focus to its opener while leaving the collection viewer open.

**Why:** Browser verification showed that Escape can reach the site's global keyboard handler and dismiss the underlying collection viewer along with the nested proof.

**How to apply:** Scope Escape handling to the active proof layer, prevent global handlers from dismissing the underlying dialog, and verify focus restoration in the browser without changing the navigation.
