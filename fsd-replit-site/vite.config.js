import { defineConfig } from 'vite';
import { draftReviewPlugin } from './scripts/draft-review-plugin.mjs';
import { aeroforgePrivatePreviewPlugin } from './scripts/aeroforge-private-preview-plugin.mjs';

export default defineConfig({
  plugins: [draftReviewPlugin(), aeroforgePrivatePreviewPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
});
