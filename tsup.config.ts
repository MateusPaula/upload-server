import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'], // files to build
  clean: true, // clean the build directory before the new building
  format: 'esm', // ecmascript module (We added type module in the package json)
  outDir: 'dist',
})
