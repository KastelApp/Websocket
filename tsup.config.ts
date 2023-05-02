import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  external: [],
  noExternal: [],
  platform: 'node',
  format: ['cjs'],
  skipNodeModulesBundle: false,
  target: 'es2022',
  clean: true,
  shims: false,
  minify: true,
  splitting: false,
  keepNames: false,
  dts: false,
  sourcemap: true,
  esbuildPlugins: [],
  bundle: false,
});
