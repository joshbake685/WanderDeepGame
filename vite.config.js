import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  return {
    base: mode === 'production' ? '/WanderDeepGame/' : '/',
    build: {
      outDir: 'docs',
      emptyOutDir: true
    }
  }
})