import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    watch: {
      // Vite's file watcher drops repeated change events for a file within 50ms, so
      // several quick saves (format-on-save, multi-edit tools) leave the playground
      // serving stale code and CSS. Polling checks files on an interval instead, so
      // the latest save always wins and save-by-rename is handled too. Only the
      // playground and library sources are watched (not node_modules), so it's cheap.
      // (awaitWriteFinish isn't used: it stops watching files that are saved by rename.)
      usePolling: true,
      interval: 100,
    },
  },
})
