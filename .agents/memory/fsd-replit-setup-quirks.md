---
name: FSD Replit setup quirks
description: Platform-specific workspace naming, nested package installation, and managed artifact preview routing
---

Managed Clerk provisioning rejected a filename-like workspace title. Replit's editor renames the project from its header; changing source files does not rename the workspace. The package-management callback also targeted the workspace root instead of the nested storefront directory.

**Why:** Both behaviors are platform-context dependent and are not apparent from the storefront source; repeating either mistake can create unrelated files or block authentication setup.

**How to apply:** Before retrying managed Clerk provisioning, ask the user to rename the workspace through the editor header to a simple app name and confirm it is done. Install nested storefront dependencies from `fsd-replit-site/`, not the workspace root.

Managed artifact previews must be captured using the running artifact workflow's actual port and base path, not a guessed Vite port or the storefront's port.

**Why:** The sandbox can receive a nonstandard managed port. The storefront's catch-all may return its homepage for a sandbox URL, creating a misleadingly successful screenshot.

**How to apply:** Inspect the active workflow configuration, logs, or only the process's `PORT` and `BASE_PATH` entries. Pass that exact port and preview path to the app-preview screenshot tool.

In this Vite storefront, legacy `.html` routes handled only through a `configureServer` middleware can still fall through to the app's 404 page in the development preview when no matching public file exists. Keep a physical `public/<route>.html` source and ensure the production build includes the same route behavior.

**Why:** The custom middleware was present but the Replit preview still returned the branded 404; the public HTML route loaded and its production build output was verifiable.

**How to apply:** For public legacy `.html` routes, test the physical public source in dev and the generated `dist` file after a production build instead of relying on middleware interception alone.
