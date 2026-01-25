import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'main.js'),
        name: 'BabyMongoNode',
        formats: ['es'],
        fileName: () => isProd ? 'babymongo-node.min.js' : 'babymongo-node.js'
      },
      outDir: 'dist',
      emptyOutDir: false,
      sourcemap: true,
      minify: isProd ? 'terser' : false,
      target: 'node18',
      rollupOptions: {
        external: ['worker_threads', 'node-opfs', 'fs', 'path', 'url', 'mongodb'],
        output: {
          globals: {}
        }
      }
    }
  };
});
