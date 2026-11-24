import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const single = process.env.SINGLE_FILE === '1';

export default defineConfig({
  base: './',
  plugins: single ? [viteSingleFile()] : [],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: single
      ? {}
      : {
          output: {
            // Keep the big libraries in their own files so they cache and load separately.
            manualChunks(id) {
              if (id.includes('node_modules/three')) return 'three';
              if (id.includes('node_modules/gsap')) return 'gsap';
            },
          },
        },
  },
});
