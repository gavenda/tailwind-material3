/**
 * Shared timing for the linear and circular progress indicators.
 * Values come from Compose Material 3 (ProgressIndicator.kt, WavyProgressIndicator.kt).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/** CSS-style cubic-bezier easing. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bez = (t: number, a: number, b: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2
      if (bez(mid, x1, x2) < x) lo = mid
      else hi = mid
    }
    return bez((lo + hi) / 2, y1, y2)
  }
}

const standard = cubicBezier(0.2, 0, 0, 1)
const emphasizedAccelerate = cubicBezier(0.3, 0, 0.8, 0.15)
const linear = (x: number) => x

/** Wave height goes 0 → 1 with standard easing and 1 → 0 with emphasized accelerate (500ms). */
const AMPLITUDE_MS = 500
/** Determinate progress glides to a new value over 500ms (WavyProgressIndicatorDefaults.ProgressAnimationSpec). */
const PROGRESS_MS = 500

// Linear indeterminate: two lines, each with a head and tail, on a 1750ms cycle.
export const LINEAR_CYCLE_MS = 1750
const step = (t: number, delay: number, duration: number) =>
  emphasizedAccelerate((t - delay) / duration)

/** [tail1, head1, tail2, head2] as fractions of the width. */
export function linearIndeterminate(ms: number): number[] {
  const t = ms % LINEAR_CYCLE_MS
  return [step(t, 250, 1000), step(t, 0, 1000), step(t, 900, 850), step(t, 650, 850)]
}

// Circular indeterminate: a 6000ms cycle of three full turns, plus four 90° jumps,
// while the arc grows from 10% to 87% and shrinks back.
export const CIRCULAR_CYCLE_MS = 6000
export function circularIndeterminate(ms: number) {
  const t = ms % CIRCULAR_CYCLE_MS
  const sweep = t < 3000 ? 0.1 + 0.77 * (t / 3000) : 0.87 - 0.77 * standard((t - 3000) / 3000)
  const jump = Math.floor(t / 1500)
  const into = t - jump * 1500
  const extra = 90 * jump + (into < 300 ? (90 * into) / 300 : 90)
  return { sweep, rotation: (1080 * t) / CIRCULAR_CYCLE_MS + extra }
}

/** Default wave height for a determinate value: flat near the start and end. */
const waveFor = (progress: number) => (progress <= 0.1 || progress >= 0.95 ? 0 : 1)

class Tween {
  private from: number
  private to: number
  private start = 0
  constructor(
    value: number,
    private duration: number,
  ) {
    this.from = value
    this.to = value
  }
  value(now: number, ease: (x: number) => number = linear) {
    const f = this.duration ? (now - this.start) / this.duration : 1
    return f >= 1 ? this.to : this.from + (this.to - this.from) * ease(f)
  }
  running(now: number) {
    return now - this.start < this.duration && this.from !== this.to
  }
  set(to: number, now: number, ease?: (x: number) => number) {
    if (to === this.to) return
    this.from = this.value(now, ease)
    this.to = to
    this.start = now
  }
  get target() {
    return this.to
  }
}

/**
 * Runs one requestAnimationFrame loop per indicator while anything moves,
 * and exposes the animated progress, wave height and wave phase.
 */
export function useProgressMotion(
  props: { progress?: number; wavy: boolean },
  /** How long the wave takes to travel one full cycle (ms). */
  wavePeriod: () => number,
) {
  const clock = () => (typeof performance !== 'undefined' ? performance.now() : 0)
  const now = ref(clock())

  const indeterminate = computed(() => props.progress === undefined)
  const target = computed(() => Math.min(1, Math.max(0, props.progress ?? 0)))
  const targetAmplitude = computed(() =>
    !props.wavy ? 0 : indeterminate.value ? 1 : waveFor(target.value),
  )

  const progressTween = new Tween(target.value, PROGRESS_MS)
  const amplitudeTween = new Tween(targetAmplitude.value, AMPLITUDE_MS)
  const amplitudeEase = () => (amplitudeTween.target > 0 ? standard : emphasizedAccelerate)
  let indeterminateStart = now.value

  const reducedMotion =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined

  const progress = computed(() => progressTween.value(now.value))
  const amplitude = computed(() => amplitudeTween.value(now.value, amplitudeEase()))
  /** 0–1 phase of the travelling wave; held still with reduced motion. */
  const phase = computed(() =>
    reducedMotion?.matches || amplitude.value === 0 ? 0 : (now.value / wavePeriod()) % 1,
  )
  // The clock only advances on frames, so it can briefly lag a newer start time.
  const elapsed = computed(() => Math.max(0, now.value - indeterminateStart))

  const busy = (t: number) =>
    indeterminate.value ||
    progressTween.running(t) ||
    amplitudeTween.running(t) ||
    (amplitudeTween.value(t, amplitudeEase()) > 0 && !reducedMotion?.matches)

  let raf = 0
  const tick = () => {
    now.value = clock()
    raf = busy(now.value) ? requestAnimationFrame(tick) : 0
  }
  const kick = () => {
    if (!raf && typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(tick)
  }

  watch(target, (to) => {
    progressTween.set(to, clock())
    kick()
  })
  watch(targetAmplitude, (to) => {
    amplitudeTween.set(to, clock(), amplitudeEase())
    kick()
  })
  watch(indeterminate, (on) => {
    if (on) indeterminateStart = clock()
    kick()
  })

  onMounted(kick)
  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    raf = 0
  })

  return { indeterminate, progress, amplitude, phase, elapsed }
}
