import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { standaloneNavigationPagesPlugin } from './src/standalone-navigation-pages.js';
import { HOUSE_DRAFT_BUILD_FILES } from './src/data/house-page-readiness.js';
import { draftReviewPlugin } from './scripts/draft-review-plugin.mjs';
import { aeroforgePrivatePreviewPlugin } from './scripts/aeroforge-private-preview-plugin.mjs';
import { modestFlowPrivatePreviewPlugin } from './scripts/modest-flow-private-preview-plugin.mjs';
import { breezePrivatePreviewPlugin } from './scripts/breeze-private-preview-plugin.mjs';
import { womensCollectionPrivatePreviewPlugin } from './scripts/womens-collection-private-preview-plugin.mjs';
import { hardwareForgePrivatePreviewPlugin } from './scripts/hardware-forge-private-preview-plugin.mjs';
import { prelaunchSignupApiPlugin } from './scripts/prelaunch-signup-api-plugin.mjs';
import { siteSeoPlugin } from './scripts/site-seo-plugin.mjs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

function blockedHouseRoutePlugin() {
  return {
    name: 'fsd-blocked-house-draft-routes',
    apply: 'build',
    closeBundle: {
      order: 'post',
      async handler() {
      const output = resolve(projectRoot, 'dist');
        const notFoundPage = resolve(output, '404.html');
        for (const fileName of HOUSE_DRAFT_BUILD_FILES) {
          const destination = resolve(output, fileName);
          await mkdir(dirname(destination), { recursive: true });
          await copyFile(notFoundPage, destination);
        }
      },
    },
  };
}

function developmentNoIndexPlugin() {
  return {
    name: 'fsd-development-noindex',
    apply: 'serve',
    transformIndexHtml(html) {
      if (/<meta\s+name=["']robots["']/iu.test(html)) return html;
      return html.replace(
        /<\/head>/iu,
        '    <meta name="robots" content="noindex, nofollow, noarchive"/>\n  </head>',
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    developmentNoIndexPlugin(),
    draftReviewPlugin(),
    aeroforgePrivatePreviewPlugin(),
    modestFlowPrivatePreviewPlugin(),
    breezePrivatePreviewPlugin(),
    womensCollectionPrivatePreviewPlugin(),
    hardwareForgePrivatePreviewPlugin(),
    prelaunchSignupApiPlugin(),
    blockedHouseRoutePlugin(),
    standaloneNavigationPagesPlugin(projectRoot),
    siteSeoPlugin(projectRoot),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/\/node_modules\/(?:react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
        },
      },
      input: {
        main: resolve(projectRoot, 'index.html'),
        sizeGuide: resolve(projectRoot, 'size-guide.html'),
        standaloneNavigation: resolve(projectRoot, 'src/standalone-navigation.js'),
      },
    },
    manifest: true,
  },
});
