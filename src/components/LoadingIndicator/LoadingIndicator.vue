<script setup lang="ts">
/**
 * Material 3 Expressive loading indicator.
 * Spec: https://m3.material.io/components/loading-indicator/specs
 * Tokens: md.comp.loading-indicator
 *
 * A 38dp shape inside a 48dp container that morphs through the Material shapes.
 * - Indeterminate by default: soft burst → cookie 9 → pentagon → pill → sunny → cookie 4 → oval, looping.
 * - Set `progress` (0–1) for a determinate indicator: a circle that morphs into a soft burst.
 * - `contained` puts it on a primary-container circle.
 *
 * Give it an accessible name with aria-label (or aria-labelledby).
 * Motion follows Compose's LoadingIndicator: a new morph every 650ms on a spring
 * (damping 0.6, stiffness 200) that also turns the shape 90°, plus one full turn every 4666ms.
 * With reduced motion it still morphs, but doesn't spin.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  DETERMINATE,
  DETERMINATE_SCALE,
  INDETERMINATE,
  INDETERMINATE_SCALE,
  SAMPLES,
} from './shapes'

const props = withDefaults(
  defineProps<{
    /** 0–1 for a determinate indicator; leave unset for indeterminate. */
    progress?: number
    contained?: boolean
  }>(),
  {
    progress: undefined,
    contained: false,
  },
)

const determinate = computed(() => props.progress !== undefined)
const value = computed(() => Math.min(1, Math.max(0, props.progress ?? 0)))

// The 48dp container is the 48-unit viewBox; the shape's largest size is 38dp.
const CENTER = 24
const ACTIVE_SIZE = 38

/** Draws `from` morphed toward `to` by `t`, turned by `turn` degrees. */
function shapePath(from: number[], to: number[], t: number, scale: number, turn: number) {
  const size = ACTIVE_SIZE * scale
  const offset = (turn * Math.PI) / 180
  let d = ''
  for (let i = 0; i < SAMPLES; i++) {
    const r = (from[i] + (to[i] - from[i]) * t) * size
    const a = (2 * Math.PI * i) / SAMPLES + offset
    d += `${i ? 'L' : 'M'}${(CENTER + r * Math.cos(a)).toFixed(2)} ${(CENTER + r * Math.sin(a)).toFixed(2)}`
  }
  return d + 'Z'
}

// Underdamped spring from 0 to 1 (damping 0.6, stiffness 200), as Compose's spring().
const ZETA = 0.6
const OMEGA = Math.sqrt(200)
const DECAY = ZETA * OMEGA
const OMEGA_D = OMEGA * Math.sqrt(1 - ZETA * ZETA)
function spring(seconds: number) {
  return (
    1 -
    Math.exp(-DECAY * seconds) *
      (Math.cos(OMEGA_D * seconds) + (DECAY / OMEGA_D) * Math.sin(OMEGA_D * seconds))
  )
}
// How long Compose runs that spring with a 0.1 visibility threshold (it then snaps to 1).
const SPRING_MS = (() => {
  const c1 = -1 / 0.1
  const c2 = (DECAY * c1) / OMEGA_D
  return (Math.log(1 / Math.hypot(c1, c2)) / -DECAY) * 1000
})()

const MORPH_INTERVAL_MS = 650
const ROTATION_MS = 4666

const reducedMotion =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined

function indeterminateFrame(ms: number) {
  const step = Math.floor(ms / MORPH_INTERVAL_MS)
  const into = ms - step * MORPH_INTERVAL_MS
  const t = into < SPRING_MS ? spring(into / 1000) : 1
  const from = INDETERMINATE[step % INDETERMINATE.length]
  const to = INDETERMINATE[(step + 1) % INDETERMINATE.length]
  const turn = reducedMotion?.matches
    ? 0
    : 90 * (step + 1) + 90 * t + ((ms % ROTATION_MS) / ROTATION_MS) * 360
  return shapePath(from, to, t, INDETERMINATE_SCALE, turn)
}

const frame = ref(indeterminateFrame(0))
const d = computed(() =>
  determinate.value
    ? shapePath(DETERMINATE[0], DETERMINATE[1], value.value, DETERMINATE_SCALE, -180 * value.value)
    : frame.value,
)

let raf = 0
function stop() {
  cancelAnimationFrame(raf)
  raf = 0
}
function start() {
  if (raf) return
  const t0 = performance.now()
  const tick = (now: number) => {
    // A frame's timestamp can be slightly earlier than t0.
    frame.value = indeterminateFrame(Math.max(0, now - t0))
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  watch(determinate, (on) => (on ? stop() : start()), { immediate: true })
})
onBeforeUnmount(stop)
</script>

<template>
  <span
    role="progressbar"
    :aria-valuemin="determinate ? 0 : undefined"
    :aria-valuemax="determinate ? 100 : undefined"
    :aria-valuenow="determinate ? Math.round(value * 100) : undefined"
    :class="[
      'inline-flex size-12 shrink-0 rounded-full',
      contained ? 'bg-primary-container text-on-primary-container' : 'text-primary',
    ]"
  >
    <svg viewBox="0 0 48 48" class="size-full" fill="currentColor" aria-hidden="true">
      <path :d="d" />
    </svg>
  </span>
</template>
