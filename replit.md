# FSD website

## Run on Replit
- The existing app is in `fsd-replit-site/` and uses React + Vite + Tailwind. Preserve the established storefront layout, navigation, catalogue, and styling when continuing the migration; keep existing page modules working until they are intentionally converted.
- Install dependencies from that directory with `npm ci` (or `npm install` when updating dependencies).
- Click **Run** to start the `Start application` workflow, which executes `cd fsd-replit-site && npm run dev`.
- Vite serves the preview on `0.0.0.0:5000` with proxy hosts allowed.
- Build with `cd fsd-replit-site && npm run build`. Output is `fsd-replit-site/dist/`.
- The public catalogue remains static and checkout stays disabled until product readiness is confirmed. A secure members portal requires managed authentication to be provisioned before implementation.
- After task merges, `scripts/post-merge.sh` installs locked dependencies and rebuilds the app. Replit then reconciles the configured workflows.

## Existing content restrictions
- This setup does not publish the site or approve its catalogue content.
- Before publishing, review the existing notes in `fsd-replit-site/README.md` and `handoff/README.md`: the contact email and shield are placeholders, and product images represent concepts. The newer master list distinguishes confirmed list prices from suggestions; do not revert confirmed entries to the older blanket provisional-price labels.
- Preserve the supplied handoff material and do not invent prices, availability, product claims, or approved branding.
