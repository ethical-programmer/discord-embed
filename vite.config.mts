import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Builds the webview into dist/webview with fixed file names, so
// src/extension.ts can reference index.js and index.css directly.
export default defineConfig({
  root: 'webview-ui',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../dist/webview',
    emptyOutDir: true,
    target: 'es2022',
    // Inline the example SVGs as data: URLs, so index.js and index.css stay the only files.
    assetsInlineLimit: 50_000,
    rollupOptions: {
      input: fileURLToPath(new URL('./webview-ui/src/main.tsx', import.meta.url)),
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index[extname]',
      },
    },
  },
});
