import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'main.js'),
        name: 'MicroMongoNode',
        formats: ['es'],
        fileName: () => isProd ? 'micro-mongo-node.min.js' : 'micro-mongo-node.js'
      },
      outDir: 'build',
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
