<script setup lang="ts">
/**
 * Material 3 Expressive linear progress indicator.
 * Spec: https://m3.material.io/components/progress-indicators/specs
 * Tokens: md.comp.linear-progress-indicator, md.comp.progress-indicator
 *
 * - Indeterminate by default; set `progress` (0–1) for determinate.
 * - `wavy` draws the active indicator as a travelling wave (10dp tall instead of 4dp).
 *   Determinate waves flatten below 10% and above 95%.
 * - Fills its container's width; set a width with a class.
 *
 * Give it an accessible name with aria-label (or aria-labelledby).
 * Motion follows Compose Material 3. With reduced motion the wave stops travelling.
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { linearIndeterminate, useProgressMotion } from './motion'

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
const CAP = STROKE / 2 // round caps sit inside the ends
const GAP = 4 // between active indicator and track
const STOP = 4 // stop indicator at the end of the track
const AMPLITUDE = 3 // wave peak, from the centre line

const height = computed(() => (props.wavy ? 10 : 4))
// Determinate waves are 40dp long, indeterminate 20dp; both travel one wavelength per second.
const wavelength = computed(() => (props.progress === undefined ? 20 : 40))

const { indeterminate, progress, amplitude, phase, elapsed } = useProgressMotion(props, () => 1000)

// Measure the width so the wave, gap and caps keep their size in dp.
const root = useTemplateRef<HTMLElement>('root')
const width = ref(240)
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!root.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => (width.value = entry.contentRect.width || 240))
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const f = (n: number) => n.toFixed(2)

/** The wave's distance from the centre line at x, before scaling by amplitude. */
function waveY(x: number) {
  const half = wavelength.value / 2
  const u = (x + phase.value * wavelength.value) / half
  const k = Math.floor(u)
  const t = u - k
  // Quadratic curves between half-wave anchors, alternating up and down.
  return (k % 2 === 0 ? 1 : -1) * 2 * t * (1 - t) * AMPLITUDE * 2
}

const geometry = computed(() => {
  const W = width.value
  const mid = height.value / 2
  const amp = amplitude.value
  const fractions = indeterminate.value
    ? linearIndeterminate(elapsed.value)
    : [0, progress.value]

  const active: string[] = []
  let track = ''
  let gap = GAP
  let nextEnd = W - CAP
  let trackOpen = `M${f(nextEnd)} ${f(mid)}`
  const clamp = (x: number) => Math.min(W - CAP, Math.max(CAP, x))

  for (let i = 0; i < fractions.length; i += 2) {
    const tail = fractions[i] * W
    const head = fractions[i + 1] * W
    if (i === 0) gap = head < CAP ? 0 : Math.min(head - CAP, GAP)
    const visible = fractions[1] * W >= CAP
    const from = clamp(tail)
    const to = clamp(head)

    if (head - tail > 0) {
      if (amp === 0) {
        active.push(`M${f(from)} ${f(mid)}H${f(to)}`)
      } else {
        let d = ''
        for (let x = from; ; x = Math.min(to, x + 1)) {
          d += `${d ? 'L' : 'M'}${f(x)} ${f(mid + amp * waveY(x))}`
          if (x >= to) break
        }
        active.push(d)
      }
    }

    // Track runs from the right, stopping short of each active line.
    const spacing = visible ? gap + CAP * 2 : gap
    if (nextEnd > to + spacing) track += `${trackOpen}H${f(Math.max(CAP, to + spacing))}`
    if (head > tail) {
      nextEnd = Math.max(CAP, from - spacing)
      trackOpen = `M${f(nextEnd)} ${f(mid)}`
    }
  }
  if (nextEnd > CAP) track += `${trackOpen}H${f(CAP)}`

  // Stop indicator: shrinks away as the active indicator reaches it.
  let stop: { cx: number; r: number } | undefined
  if (!indeterminate.value) {
    let size = STOP
    let x = W - size
    const progressX = W * fractions[1] + CAP
    if (x <= progressX) {
      size = Math.max(0, size - (progressX - x))
      x = progressX
    }
    if (size > 0) stop = { cx: x + size / 2, r: size / 2 }
  }

  return { active, track, stop, mid }
})
</script>

<template>
  <div
    ref="root"
    role="progressbar"
    :aria-valuemin="indeterminate ? undefined : 0"
    :aria-valuemax="indeterminate ? undefined : 100"
    :aria-valuenow="indeterminate ? undefined : Math.round(Math.min(1, Math.max(0, props.progress ?? 0)) * 100)"
    class="block w-full"
    :style="{ height: `${height}px` }"
  >
    <svg
      class="block size-full overflow-visible rtl:-scale-x-100"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      fill="none"
      :stroke-width="STROKE"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path v-if="geometry.track" :d="geometry.track" class="stroke-secondary-container" />
      <path v-for="(d, i) in geometry.active" :key="i" :d="d" class="stroke-primary" />
      <circle
        v-if="geometry.stop"
        :cx="geometry.stop.cx"
        :cy="geometry.mid"
        :r="geometry.stop.r"
        class="fill-primary"
        stroke="none"
      />
    </svg>
  </div>
</template>
