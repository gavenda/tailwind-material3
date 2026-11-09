<script setup lang="ts">
/**
 * Material 3 Expressive button group.
 * Spec: https://m3.material.io/components/button-groups/specs
 * Tokens: md.comp.button-group.{standard,connected}.{xsmall,small,medium,large,xlarge}
 *
 * An invisible container: it sets the space between Buttons and changes their shape.
 * - standard: pressing a button widens it by 15% and narrows its neighbors to match.
 * - connected: 2dp apart with tighter inner corners; selection changes only that button.
 */
import { onBeforeUnmount, provide, shallowRef } from 'vue'
import type { ButtonShape, ButtonSize } from '../Button/types'
import {
  buttonGroupKey,
  type ButtonGroupSelection,
  type ButtonGroupVariant,
  type ButtonValue,
} from './context'

const props = withDefaults(
  defineProps<{
    variant?: ButtonGroupVariant
    /** Applied to Buttons that don't set their own size. */
    size?: ButtonSize
    /** Resting shape. For connected groups this is the outer corners. */
    shape?: ButtonShape
    /**
     * Let the group manage selection for Buttons that have a `value`.
     * Bind with `v-model`: a value (or null) for 'single', an array for 'multiple'.
     */
    selection?: ButtonGroupSelection
    /** Keep at least one button selected. */
    required?: boolean
  }>(),
  {
    variant: 'standard',
    size: 's',
    shape: 'round',
    selection: undefined,
    required: false,
  },
)

const model = defineModel<ButtonValue | ButtonValue[] | null>()

// Space between buttons (between-space tokens)
const gaps: Record<ButtonGroupVariant, Record<ButtonSize, string>> = {
  standard: { xs: 'gap-[18px]', s: 'gap-3', m: 'gap-2', l: 'gap-2', xl: 'gap-2' },
  connected: { xs: 'gap-0.5', s: 'gap-0.5', m: 'gap-0.5', l: 'gap-0.5', xl: 'gap-0.5' },
}

// --- Selection -------------------------------------------------------------

function selectedValues(): ButtonValue[] {
  const v = model.value
  if (Array.isArray(v)) return v
  return v == null ? [] : [v]
}

function isSelected(value: ButtonValue) {
  return selectedValues().includes(value)
}

function toggle(value: ButtonValue) {
  const current = selectedValues()
  const on = current.includes(value)
  if (on && props.required && current.length === 1) return

  if (props.selection === 'multiple') {
    model.value = on ? current.filter((v) => v !== value) : [...current, value]
  } else {
    model.value = on ? null : value
  }
}

// --- Button registry (DOM order) -------------------------------------------

const items = shallowRef<HTMLElement[]>([])

function register(el: HTMLElement) {
  items.value = [...items.value, el].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )
}

function unregister(el: HTMLElement) {
  items.value = items.value.filter((item) => item !== el)
}

function position(el: HTMLElement | undefined) {
  const list = items.value
  const i = el ? list.indexOf(el) : -1
  return { first: i === 0, last: i >= 0 && i === list.length - 1 }
}

// Getters keep the props reactive for Buttons that read them.
provide(buttonGroupKey, {
  get variant() {
    return props.variant
  },
  get size() {
    return props.size
  },
  get shape() {
    return props.shape
  },
  get selectable() {
    return props.selection !== undefined
  },
  isSelected,
  toggle,
  register,
  unregister,
  position,
})

// --- Standard group press: width interaction -------------------------------

/** pressed.item.width.multiplier */
const WIDTH_MULTIPLIER = 0.15
/** Matches --duration-spring-fast-spatial in theme.css */
const SPRING_MS = 360

let natural: Map<HTMLElement, number> | null = null
let resetTimer: ReturnType<typeof setTimeout> | undefined

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function itemFor(target: EventTarget | null) {
  const el = target instanceof Element ? target.closest('button, a') : null
  return items.value.find((item) => item === el && !item.matches(':disabled, [aria-disabled="true"]'))
}

function press(el: HTMLElement) {
  if (props.variant !== 'standard' || prefersReducedMotion()) return
  clearTimeout(resetTimer)

  const list = items.value
  const i = list.indexOf(el)
  natural ??= new Map(list.map((b) => [b, b.getBoundingClientRect().width]))

  // Start from the current widths so an interrupted animation continues smoothly.
  for (const b of list) b.style.width = `${b.getBoundingClientRect().width}px`
  void el.offsetWidth

  const neighbors = [list[i - 1], list[i + 1]].filter((b): b is HTMLElement => !!b)
  const extra = natural.get(el)! * WIDTH_MULTIPLIER
  for (const b of list) {
    let width = natural.get(b)!
    if (b === el) width += extra
    else if (neighbors.includes(b)) width -= extra / neighbors.length
    b.style.width = `${width}px`
  }

  window.addEventListener('pointerup', release, { once: true })
  window.addEventListener('pointercancel', release, { once: true })
}

function release() {
  if (!natural) return
  for (const [b, width] of natural) b.style.width = `${width}px`
  resetTimer = setTimeout(() => {
    for (const b of natural?.keys() ?? []) b.style.width = ''
    natural = null
  }, SPRING_MS)
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  const el = itemFor(e.target)
  if (el) press(el)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return
  const el = itemFor(e.target)
  if (el) press(el)
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Enter') release()
}

onBeforeUnmount(() => {
  clearTimeout(resetTimer)
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
})
</script>

<template>
  <div
    role="group"
    :class="['inline-flex items-center', gaps[variant][size]]"
    @pointerdown="onPointerDown"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
  >
    <slot />
  </div>
</template>
