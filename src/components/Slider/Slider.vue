<script setup lang="ts">
/**
 * Material 3 Expressive slider.
 * Spec: https://m3.material.io/components/sliders/specs
 * Tokens: md.comp.slider + md.comp.slider.{xsmall,small,medium,large,xlarge}
 *
 * - Standard: `v-model` is a number.
 * - Range: `v-model` is a [start, end] pair; two handles that can't cross.
 * - Centered: the active track runs from the middle of min..max to the value.
 * Vertical sliders fill their parent's height.
 */
import { computed, onBeforeUnmount, onMounted, ref, useSlots, useTemplateRef } from 'vue'

export type SliderSize = 'xs' | 's' | 'm' | 'l' | 'xl'
export type SliderOrientation = 'horizontal' | 'vertical'

const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    size?: SliderSize
    orientation?: SliderOrientation
    /** Active track starts at the middle of min..max. Single value only. */
    centered?: boolean
    /** Show a stop indicator at every step. */
    stops?: boolean
    /** Show the value above the handle while it's dragged or focused. */
    valueIndicator?: boolean
    /** Formats the value indicator and aria-valuetext. */
    format?: (value: number) => string
    /** Accessible name(s): one for a slider, [start, end] for a range. */
    label?: string | [string, string]
    disabled?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    size: 'xs',
    orientation: 'horizontal',
    centered: false,
    stops: false,
    valueIndicator: false,
    format: (value: number) => String(value),
    label: undefined,
    disabled: false,
  },
)

const model = defineModel<number | [number, number]>()
const emit = defineEmits<{ change: [value: number | [number, number]] }>()
const slots = useSlots()

interface SizeSpec {
  /** Track thickness and its outer corner, px */
  track: number
  corner: number
  /** Handle length and container thickness (at least 48dp for touch) */
  handle: number
  container: { horizontal: string; vertical: string }
  /** Inset icon size and padding, px (M, L, XL only) */
  icon?: { size: number; padding: number; class: string }
}

const sizes: Record<SliderSize, SizeSpec> = {
  xs: { track: 16, corner: 8, handle: 44, container: { horizontal: 'h-12', vertical: 'w-12' } },
  s: { track: 24, corner: 8, handle: 44, container: { horizontal: 'h-12', vertical: 'w-12' } },
  m: {
    track: 40,
    corner: 12,
    handle: 52,
    container: { horizontal: 'h-13', vertical: 'w-13' },
    icon: { size: 24, padding: 6, class: 'size-6' },
  },
  l: {
    track: 56,
    corner: 16,
    handle: 68,
    container: { horizontal: 'h-17', vertical: 'w-17' },
    icon: { size: 24, padding: 6, class: 'size-6' },
  },
  xl: {
    track: 96,
    corner: 28,
    handle: 108,
    container: { horizontal: 'h-27', vertical: 'w-27' },
    icon: { size: 32, padding: 8, class: 'size-8' },
  },
}

/** Handle width at rest (it narrows to 2dp when pressed or focused). */
const HANDLE = 4
/** Gap between the handle and each track (active.handle.leading/trailing-space). */
const HANDLE_GAP = 6
/** Track corner next to the handle (active.track.inner-corner). */
const INNER_CORNER = 2
/** Stop indicator size and its inset from the track ends. */
const STOP = 4
const STOP_INSET = 4

const spec = computed(() => sizes[props.size])
const vertical = computed(() => props.orientation === 'vertical')
const isRange = computed(() => Array.isArray(model.value))

// --- Values ------------------------------------------------------------------

const values = computed<number[]>(() => {
  const v = model.value
  if (Array.isArray(v)) return [v[0], v[1]]
  return [v ?? props.min]
})

const span = computed(() => props.max - props.min || 1)
const fraction = (v: number) => Math.min(1, Math.max(0, (v - props.min) / span.value))

const stepDecimals = computed(() => (String(props.step).split('.')[1] ?? '').length)

function snap(v: number) {
  const stepped = Math.round((v - props.min) / props.step) * props.step + props.min
  const clamped = Math.min(props.max, Math.max(props.min, stepped))
  return Number(clamped.toFixed(stepDecimals.value))
}

function setValue(index: number, raw: number) {
  let v = snap(raw)
  if (isRange.value) {
    const [a, b] = values.value as [number, number]
    // Handles can't cross.
    v = index === 0 ? Math.min(v, b) : Math.max(v, a)
    const next: [number, number] = index === 0 ? [v, b] : [a, v]
    if (next[0] !== a || next[1] !== b) model.value = next
  } else if (v !== values.value[0]) {
    model.value = v
  }
}

function emitChange() {
  emit('change', isRange.value ? [...(model.value as [number, number])] : (model.value ?? props.min))
}

// --- Geometry ----------------------------------------------------------------
// Positions are CSS lengths along the track. The handle's center travels from
// HANDLE/2 to 100% - HANDLE/2, so it never overhangs the ends.

const pos = (f: number) => `(${f} * (100% - ${HANDLE}px) + ${HANDLE / 2}px)`

type Corner = 'outer' | 'inner' | 'none'
interface Edge {
  at: string
  gap: number
  corner: Corner
}

const START: Edge = { at: '0px', gap: 0, corner: 'outer' }
const END: Edge = { at: '100%', gap: 0, corner: 'outer' }
const handleEdge = (f: number): Edge => ({ at: pos(f), gap: HANDLE / 2 + HANDLE_GAP, corner: 'inner' })

const centerFraction = 0.5

/** Active interval as fractions, for coloring stop indicators. */
const activeRange = computed<[number, number]>(() => {
  const fs = values.value.map(fraction)
  if (isRange.value) return [fs[0], fs[1]]
  if (props.centered) return [Math.min(centerFraction, fs[0]), Math.max(centerFraction, fs[0])]
  return [0, fs[0]]
})

const segments = computed(() => {
  const fs = values.value.map(fraction)
  let a: Edge
  let b: Edge
  if (isRange.value) {
    a = handleEdge(fs[0])
    b = handleEdge(fs[1])
  } else if (props.centered) {
    const center: Edge = { at: pos(centerFraction), gap: 0, corner: 'none' }
    const handle = handleEdge(fs[0])
    ;[a, b] = fs[0] >= centerFraction ? [center, handle] : [handle, center]
  } else {
    a = START
    b = handleEdge(fs[0])
  }

  const list = [
    { active: false, from: START, to: a },
    { active: true, from: a, to: b },
    { active: false, from: b, to: END },
  ]
  return list.filter((s) => !(s.from === START && s.to === START))
})

const radius = (c: Corner) => (c === 'outer' ? `${spec.value.corner}px` : c === 'inner' ? `${INNER_CORNER}px` : '0px')

function segmentStyle(from: Edge, to: Edge) {
  const start = `calc(${from.at} + ${from.gap}px)`
  const length = `max(0px, calc(${to.at} - ${to.gap}px - ${from.at} - ${from.gap}px))`
  const thickness = `${spec.value.track}px`
  const r0 = radius(from.corner)
  const r1 = radius(to.corner)
  return vertical.value
    ? {
        bottom: start,
        height: length,
        width: thickness,
        borderBottomLeftRadius: r0,
        borderBottomRightRadius: r0,
        borderTopLeftRadius: r1,
        borderTopRightRadius: r1,
      }
    : {
        insetInlineStart: start,
        width: length,
        height: thickness,
        borderStartStartRadius: r0,
        borderEndStartRadius: r0,
        borderStartEndRadius: r1,
        borderEndEndRadius: r1,
      }
}

/** Places a point (its center) along the track. */
function along(at: string, sizePx: number) {
  const offset = `calc(${at} - ${sizePx / 2}px)`
  return vertical.value ? { bottom: offset } : { insetInlineStart: offset }
}

// --- Stop indicators -----------------------------------------------------------

const stopDots = computed(() => {
  const handles = values.value.map(fraction)
  let fractions: number[]
  if (props.stops) {
    const count = Math.round(span.value / props.step)
    fractions = count > 0 && count <= 200 ? Array.from({ length: count + 1 }, (_, i) => i / count) : []
  } else {
    // Without stops, mark only the ends of the inactive track.
    fractions = isRange.value || props.centered ? [0, 1] : [1]
  }

  const [lo, hi] = activeRange.value
  const edge = STOP_INSET + STOP / 2
  return fractions
    .filter((f) => !handles.some((h) => Math.abs(h - f) < 1e-9))
    .map((f) => ({
      key: f,
      active: f >= lo - 1e-9 && f <= hi + 1e-9,
      style: along(`clamp(${edge}px, ${pos(f)}, calc(100% - ${edge}px))`, STOP),
    }))
})

// --- Inset icon (standard slider, M/L/XL) -------------------------------------

const root = useTemplateRef<HTMLElement>('root')
const length = ref(0)
let observer: ResizeObserver | undefined

onMounted(() => {
  if (!root.value) return
  observer = new ResizeObserver(([entry]) => {
    length.value = vertical.value ? entry.contentRect.height : entry.contentRect.width
  })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const insetIcon = computed(() => {
  const icon = spec.value.icon
  if (!icon || !slots.icon || isRange.value || props.centered) return null
  const f = fraction(values.value[0])
  const activeLength = f * (length.value - HANDLE) - HANDLE_GAP
  const inActive = activeLength >= icon.size + icon.padding * 2
  // In the active track: at its start. Otherwise: just past the handle gap.
  const at = inActive
    ? `${icon.padding + icon.size / 2}px`
    : `(${pos(f)} + ${HANDLE / 2 + HANDLE_GAP + icon.padding + icon.size / 2}px)`
  return { inActive, class: icon.class, style: along(at, icon.size) }
})

// --- Interaction ------------------------------------------------------------

const pressed = ref<number | null>(null)
const focused = ref<number | null>(null)
const handleEls = useTemplateRef<HTMLElement[]>('handles')

function fractionAt(e: PointerEvent) {
  const rect = root.value!.getBoundingClientRect()
  if (vertical.value) return (rect.bottom - e.clientY - HANDLE / 2) / (rect.height - HANDLE)
  const rtl = getComputedStyle(root.value!).direction === 'rtl'
  const x = rtl ? rect.right - e.clientX : e.clientX - rect.left
  return (x - HANDLE / 2) / (rect.width - HANDLE)
}

const valueAt = (e: PointerEvent) => props.min + fractionAt(e) * span.value

function onPointerDown(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return
  e.preventDefault()
  const v = valueAt(e)
  let index = 0
  if (isRange.value) {
    const [a, b] = values.value
    // Nearest handle; when both sit together, pick by direction.
    index = Math.abs(v - a) < Math.abs(v - b) || (a === b && v < a) ? 0 : 1
  }
  pressed.value = index
  setValue(index, v)
  handleEls.value?.[index]?.focus({ preventScroll: true })
  try {
    // Keep receiving moves while the pointer is outside the slider.
    root.value!.setPointerCapture(e.pointerId)
  } catch {
    // Pointer is no longer active; the click still set the value.
  }
}

function onPointerMove(e: PointerEvent) {
  if (pressed.value !== null) setValue(pressed.value, valueAt(e))
}

function onPointerUp() {
  if (pressed.value === null) return
  pressed.value = null
  emitChange()
}

function onKeyDown(index: number, e: KeyboardEvent) {
  const rtl = !vertical.value && getComputedStyle(root.value!).direction === 'rtl'
  const big = Math.max(props.step, Math.round(span.value / 10 / props.step) * props.step)
  const v = values.value[index]
  const keys: Record<string, number> = {
    ArrowUp: v + props.step,
    ArrowDown: v - props.step,
    ArrowRight: rtl ? v - props.step : v + props.step,
    ArrowLeft: rtl ? v + props.step : v - props.step,
    PageUp: v + big,
    PageDown: v - big,
    Home: props.min,
    End: props.max,
  }
  if (!(e.key in keys)) return
  e.preventDefault()
  setValue(index, keys[e.key])
  emitChange()
}

function onFocus(index: number, e: FocusEvent) {
  if ((e.target as HTMLElement).matches(':focus-visible') || pressed.value === index) focused.value = index
}

const labelFor = (i: number) => (Array.isArray(props.label) ? props.label[i] : props.label)
const showIndicator = (i: number) => props.valueIndicator && (pressed.value === i || focused.value === i)

function handleStyle(i: number) {
  const at = `calc(${pos(fraction(values.value[i]))})`
  return vertical.value
    ? { bottom: at, width: `${spec.value.handle}px` }
    : { insetInlineStart: at, height: `${spec.value.handle}px` }
}

function indicatorStyle(i: number) {
  const out = `calc(50% + ${spec.value.handle / 2 + 12}px)`
  const at = `calc(${pos(fraction(values.value[i]))})`
  return vertical.value ? { bottom: at, insetInlineEnd: out } : { insetInlineStart: at, bottom: out }
}
</script>

<template>
  <div
    ref="root"
    :class="[
      'relative shrink-0 touch-none select-none',
      vertical ? ['h-full', spec.container.vertical] : ['w-full', spec.container.horizontal],
      disabled ? 'pointer-events-none' : 'cursor-pointer',
    ]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- Tracks -->
    <div
      v-for="(seg, i) in segments"
      :key="i"
      :class="[
        'absolute',
        vertical ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
        seg.active
          ? disabled
            ? 'bg-on-surface/38'
            : 'bg-primary'
          : disabled
            ? 'bg-on-surface/12'
            : 'bg-secondary-container',
      ]"
      :style="segmentStyle(seg.from, seg.to)"
    />

    <!-- Stop indicators -->
    <div
      v-for="dot in stopDots"
      :key="dot.key"
      :class="[
        'absolute size-1 rounded-full',
        vertical ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
        dot.active
          ? disabled
            ? 'bg-inverse-on-surface'
            : 'bg-on-primary'
          : disabled
            ? 'bg-on-surface'
            : 'bg-on-secondary-container',
      ]"
      :style="dot.style"
    />

    <!-- Inset icon -->
    <span
      v-if="insetIcon"
      :class="[
        'pointer-events-none absolute inline-flex *:size-full',
        vertical ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
        insetIcon.class,
        disabled ? 'text-on-surface/38' : insetIcon.inActive ? 'text-on-primary' : 'text-on-secondary-container',
      ]"
      :style="insetIcon.style"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>

    <!-- Handles -->
    <template v-for="(v, i) in values" :key="i">
      <div
        ref="handles"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="labelFor(i)"
        :aria-valuemin="isRange && i === 1 ? values[0] : min"
        :aria-valuemax="isRange && i === 0 ? values[1] : max"
        :aria-valuenow="v"
        :aria-valuetext="format(v)"
        :aria-orientation="orientation"
        :aria-disabled="disabled || undefined"
        :class="[
          'absolute rounded-full transition-[width,height] duration-150',
          'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary',
          vertical
            ? ['left-1/2 -translate-x-1/2 translate-y-1/2', pressed === i ? 'h-0.5' : 'h-1 focus-visible:h-0.5']
            : [
                'top-1/2 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2',
                pressed === i ? 'w-0.5' : 'w-1 focus-visible:w-0.5',
              ],
          disabled ? 'bg-on-surface/38' : 'bg-primary',
        ]"
        :style="handleStyle(i)"
        @keydown="onKeyDown(i, $event)"
        @focus="onFocus(i, $event)"
        @blur="focused = null"
      />

      <!-- Value indicator -->
      <div
        v-if="showIndicator(i)"
        :class="[
          'pointer-events-none absolute inline-flex h-11 min-w-12 items-center justify-center rounded-full bg-inverse-surface px-4',
          'font-plain text-label-large font-normal tracking-[0.5px] text-inverse-on-surface',
          vertical ? 'translate-y-1/2' : '-translate-x-1/2 rtl:translate-x-1/2',
        ]"
        :style="indicatorStyle(i)"
      >
        {{ format(v) }}
      </div>
    </template>
  </div>
</template>
