import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  target: 'es2020',
  bundle: true,
  minify: true,
  // Bundle Three.js and html2canvas-pro instead of treating them as external
  noExternal: ['three', 'html2canvas-pro'],
})
