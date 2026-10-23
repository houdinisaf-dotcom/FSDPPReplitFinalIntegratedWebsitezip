---
name: FSD Replit setup quirks
description: Workspace naming and nested-project package-install issues encountered while configuring the FSD storefront
---

Managed Clerk provisioning rejected a filename-like workspace title. Replit's editor renames the project from its header; changing source files does not rename the workspace. The package-management callback also targeted the workspace root instead of the nested storefront directory.

**Why:** Both behaviors are platform-context dependent and are not apparent from the storefront source; repeating either mistake can create unrelated files or block authentication setup.

**How to apply:** Before retrying managed Clerk provisioning, ask the user to rename the workspace through the editor header to a simple app name and confirm it is done. Install nested storefront dependencies from `fsd-replit-site/`, not the workspace root.
