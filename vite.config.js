// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/WanderDeepGame/', // ensures relative paths work for GitHub Pages
  build: {
    outDir: 'docs', // output will go into "docs" folder
    emptyOutDir: true
  }
})
