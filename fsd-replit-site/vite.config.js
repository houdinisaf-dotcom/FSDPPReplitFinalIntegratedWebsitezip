import { defineConfig } from 'vite';
import { draftReviewPlugin } from './scripts/draft-review-plugin.mjs';

export default defineConfig({
  plugins: [draftReviewPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
});
