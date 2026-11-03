import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { standaloneNavigationPagesPlugin } from './src/standalone-navigation-pages.js';
import { draftReviewPlugin } from './scripts/draft-review-plugin.mjs';
import { aeroforgePrivatePreviewPlugin } from './scripts/aeroforge-private-preview-plugin.mjs';
import { modestFlowPrivatePreviewPlugin } from './scripts/modest-flow-private-preview-plugin.mjs';
import { breezePrivatePreviewPlugin } from './scripts/breeze-private-preview-plugin.mjs';
import { womensCollectionPrivatePreviewPlugin } from './scripts/womens-collection-private-preview-plugin.mjs';
import { hardwareForgePrivatePreviewPlugin } from './scripts/hardware-forge-private-preview-plugin.mjs';
import { prelaunchSignupApiPlugin } from './scripts/prelaunch-signup-api-plugin.mjs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

function staticStoryRoutePlugin() {
  return {
    name: 'fsd-static-story-route',
    apply: 'build',
    async closeBundle() {
      const output = resolve(projectRoot, 'dist');
      const storyDirectory = resolve(output, 'story');
      await mkdir(storyDirectory, { recursive: true });
      await copyFile(resolve(output, 'index.html'), resolve(storyDirectory, 'index.html'));
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    draftReviewPlugin(),
    aeroforgePrivatePreviewPlugin(),
    modestFlowPrivatePreviewPlugin(),
    breezePrivatePreviewPlugin(),
    womensCollectionPrivatePreviewPlugin(),
    hardwareForgePrivatePreviewPlugin(),
    prelaunchSignupApiPlugin(),
    staticStoryRoutePlugin(),
    standaloneNavigationPagesPlugin(projectRoot),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        sizeGuide: resolve(projectRoot, 'size-guide.html'),
        standaloneNavigation: resolve(projectRoot, 'src/standalone-navigation.js'),
      },
    },
    manifest: true,
  },
});
