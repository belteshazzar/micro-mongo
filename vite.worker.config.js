import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    emptyOutDir: false, // preserve main build output
    lib: {
      entry: resolve(__dirname, 'src/ServerWorker.js'),
      formats: ['es'],
      fileName: () => 'server-worker.js'
    },
    outDir: 'build',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['worker_threads'], // Mark as external so it uses the Node builtin
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
