
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json'

export default {
  input: 'main.js',
  output: [{
    file: `build/micro-mongo-${pkg.version}.js`,
    name: 'micro-mongo',
    format: 'es',
    sourcemap: true
  }, {
    file: `build/micro-mongo-${pkg.version}.min.js`,
    format: 'es',
    name: 'micro-mongo',
    plugins: [terser()],
    sourcemap: true
  }],
plugins: [json(),nodeResolve(),commonjs()]
};