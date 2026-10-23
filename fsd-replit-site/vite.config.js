import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { draftReviewPlugin } from './scripts/draft-review-plugin.mjs';
import { aeroforgePrivatePreviewPlugin } from './scripts/aeroforge-private-preview-plugin.mjs';
import { modestFlowPrivatePreviewPlugin } from './scripts/modest-flow-private-preview-plugin.mjs';
import { breezePrivatePreviewPlugin } from './scripts/breeze-private-preview-plugin.mjs';
import { womensCollectionPrivatePreviewPlugin } from './scripts/womens-collection-private-preview-plugin.mjs';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    draftReviewPlugin(),
    aeroforgePrivatePreviewPlugin(),
    modestFlowPrivatePreviewPlugin(),
    breezePrivatePreviewPlugin(),
    womensCollectionPrivatePreviewPlugin(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
});
