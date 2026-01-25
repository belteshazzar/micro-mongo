import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'main.js'),
        name: 'BabyMongoBrowser',
        formats: ['es'],
        fileName: () => isProd ? 'babymongo-browser.min.js' : 'babymongo-browser.js'
      },
      outDir: 'dist',
      emptyOutDir: false,
      sourcemap: true,
      minify: isProd ? 'terser' : false,
      rollupOptions: {
        // Exclude Node-only deps from browser bundle
        external: ['worker_threads', 'node-opfs', 'fs', 'path', 'url', 'mongodb'],
        output: {
          globals: {}
        }
      },
      esbuild: {
        minifyIdentifiers: false,
        keepNames: true,
      }
    }
  };
});
