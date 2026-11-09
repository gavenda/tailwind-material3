<script setup lang="ts">
/**
 * Material 3 Expressive circular progress indicator.
 * Spec: https://m3.material.io/components/progress-indicators/specs
 * Tokens: md.comp.circular-progress-indicator, md.comp.progress-indicator
 *
 * - Indeterminate by default; set `progress` (0–1) for determinate.
 * - `wavy` draws the active indicator as a travelling wave (48dp instead of 40dp).
 *   Determinate waves flatten below 10% and above 95%.
 *
 * Give it an accessible name with aria-label (or aria-labelledby).
 * Motion follows Compose Material 3. With reduced motion the wave stops travelling.
 */
import { computed } from 'vue'
import { circularIndeterminate, useProgressMotion } from './motion'

const props = withDefaults(
  defineProps<{
    /** 0–1 for a determinate indicator; leave unset for indeterminate. */
    progress?: number
    wavy?: boolean
  }>(),
  {
    progress: undefined,
    wavy: false,
  },
)

const STROKE = 4 // active and track thickness
const CAP = STROKE / 2
const GAP = 4 // between active indicator and track
const AMPLITUDE = 1.6 // wave depth, half of peak to trough
const WAVELENGTH = 15

const size = computed(() => (props.wavy ? 48 : 40))
const radius = computed(() => size.value / 2 - STROKE / 2)
// Whole waves around the circle (at least 5); they travel one wavelength per second.
const waves = computed(() => Math.max(5, Math.round((2 * Math.PI * radius.value) / WAVELENGTH)))

const { indeterminate, progress, amplitude, phase, elapsed } = useProgressMotion(
  props,
  () => waves.value * 1000,
)

const f = (n: number) => n.toFixed(2)

const geometry = computed(() => {
  const c = size.value / 2
  const R = radius.value
  const L = 2 * Math.PI * R
  const amp = amplitude.value
  const n = waves.value

  // Determinate starts at 12 o'clock; indeterminate spins from 3 o'clock.
  let end: number
  let start: number
  if (indeterminate.value) {
    const { sweep, rotation } = circularIndeterminate(elapsed.value)
    end = sweep
    start = (rotation * Math.PI) / 180
  } else {
    end = progress.value
    start = -Math.PI / 2
  }

  const point = (a: number, r: number) => `${f(c + r * Math.cos(a))} ${f(c + r * Math.sin(a))}`

  // Active indicator: a circle, or a wave whose peaks touch the track's radius.
  let active = ''
  if (end > 0) {
    const sweep = end * 2 * Math.PI
    const steps = Math.max(2, Math.ceil(sweep * R))
    for (let i = 0; i <= steps; i++) {
      const t = (sweep * i) / steps
      const r = R - AMPLITUDE * amp * (1 - Math.cos(n * (t + 2 * Math.PI * phase.value)))
      active += `${i ? 'L' : 'M'}${point(start + t, r)}`
    }
  }

  // Track: the rest of the circle, leaving a gap (plus round caps) at both ends.
  let track = ''
  const showTrack = !indeterminate.value || props.wavy
  const stop = end * L
  const spacing = Math.min(stop, CAP) * 2 + Math.min(stop, GAP)
  const from = stop + spacing
  const to = L - spacing
  if (showTrack && to > from) {
    const large = (to - from) / R > Math.PI ? 1 : 0
    track = `M${point(start + from / R, R)}A${f(R)} ${f(R)} 0 ${large} 1 ${point(start + to / R, R)}`
  }

  return { active, track }
})
</script>

<template>
  <span
    role="progressbar"
    :aria-valuemin="indeterminate ? undefined : 0"
    :aria-valuemax="indeterminate ? undefined : 100"
    :aria-valuenow="indeterminate ? undefined : Math.round(Math.min(1, Math.max(0, props.progress ?? 0)) * 100)"
    :class="['inline-flex shrink-0', wavy ? 'size-12' : 'size-10']"
  >
    <svg
      class="size-full"
      :viewBox="`0 0 ${size} ${size}`"
      fill="none"
      :stroke-width="STROKE"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path v-if="geometry.track" :d="geometry.track" class="stroke-secondary-container" />
      <path v-if="geometry.active" :d="geometry.active" class="stroke-primary" />
    </svg>
  </span>
</template>
