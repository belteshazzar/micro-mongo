import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    build: {
      emptyOutDir: false, // preserve main build output
      lib: {
        entry: resolve(__dirname, 'src/server/ServerWorker.js'),
        formats: ['es'],
        // Keep a stable filename; we still minify in prod but don’t change the name
        fileName: () => 'babymongo-server-worker.js'
      },
      outDir: 'build',
      sourcemap: true,
      minify: isProd ? 'terser' : false,
      rollupOptions: {
        // Exclude Node-only modules so the browser worker stays lean; Node resolves builtins at runtime.
        external: ['worker_threads', 'node-opfs', 'fs', 'path', 'url', 'mongodb'],
        output: {
          inlineDynamicImports: true
        }
      }
    }
  };
});
