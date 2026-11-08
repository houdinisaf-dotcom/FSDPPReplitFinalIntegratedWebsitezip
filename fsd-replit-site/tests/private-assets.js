import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Supplied image archives live in ../attached_assets on Replit only; they are not in the GitHub repo.
export const privateAssetsSkip = existsSync(fileURLToPath(new URL('../../attached_assets', import.meta.url)))
  ? false
  : 'attached_assets/ (Replit-only supplied image archives) is not present in this checkout';
