import { ref, watch } from 'vue'

export type ColorMode = 'light' | 'dark'

const KEY = 'playground-color-mode'

function initialMode(): ColorMode {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage unavailable; fall back to the system setting.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(mode: ColorMode) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.classList.toggle('light', mode === 'light')
}

/** Current color mode. Applied to <html> right away so the first paint is correct. */
export const colorMode = ref<ColorMode>(initialMode())
apply(colorMode.value)

watch(colorMode, (mode) => {
  apply(mode)
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // Not saved; the choice lasts for this page load only.
  }
})
