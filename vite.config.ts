import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// Library build. Vue stays external; Tailwind runs in the consumer's app,
// which scans dist/ via the @source in theme.css.
export default defineConfig({
  plugins: [vue(), dts({ include: ['src'], tsconfigPath: './tsconfig.json' })],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
})
