import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read package.json to get version
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'main.js'),
      name: 'MicroMongo',
      formats: ['es', 'umd'],
      fileName: (format) => `micro-mongo-${pkg.version}.${format === 'es' ? 'js' : format + '.js'}`
    },
    outDir: 'build',
    sourcemap: true,
    minify: false, // We'll create separate minified builds
    rollupOptions: {
      external: ['url', 'worker_threads'],  // Mark Node modules as external
      output: {
        // Provide global variables to use in the UMD build
        globals: {}
      }
    }
  }
});
