<script setup lang="ts">
/**
 * Material 3 tooltip: plain or rich.
 * Spec: https://m3.material.io/components/tooltips/specs
 * Tokens: md.comp.plain-tooltip, md.comp.rich-tooltip
 *
 * Wrap the element it describes:
 *   <Tooltip text="Save"><IconButton label="Save">…</IconButton></Tooltip>
 *
 * - Shows on hover (after `delay`), keyboard focus, or long press; hides on leave,
 *   blur, Escape, or 1.5s after a touch.
 * - Plain: one short `text` (or the `content` slot).
 * - Rich: `subhead` and `content` slots (or `text`), plus `actions`. Hovering the tooltip keeps it
 *   open. With `persistent`, it opens on click and stays until dismissed.
 * - The wrapped element gets aria-describedby pointing at the tooltip.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, useTemplateRef, watch } from 'vue'
import { popoverReset } from '../../internal/classes'
import { animate } from '../../internal/motion'
import { usePopover, type Placement } from '../../internal/usePopover'

const props = withDefaults(
  defineProps<{
    variant?: 'plain' | 'rich'
    /** Plain tooltip text. */
    text?: string
    placement?: Placement
    /** Hover delay before showing, in ms. */
    delay?: number
    /** Rich only: open on click and stay open until dismissed. */
    persistent?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'plain',
    text: undefined,
    placement: undefined,
    delay: 500,
    persistent: false,
    disabled: false,
  },
)

const open = defineModel<boolean>('open', { default: false })

const slots = useSlots()
const id = useId()

const wrap = useTemplateRef<HTMLElement>('wrap')
const tip = useTemplateRef<HTMLElement>('tip')
const anchor = ref<HTMLElement | null>(null)

const rich = computed(() => props.variant === 'rich')
const hasActions = computed(() => rich.value && !!slots.actions)

const { show, hide, isOpen, side, justDismissed } = usePopover(anchor, tip, {
  placement: () => props.placement ?? (rich.value ? 'bottom-start' : 'top'),
  offset: 4,
  onDismiss: () => (open.value = false),
})

let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
const clearTimers = () => {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
}

const origin = computed(
  () => ({ top: 'bottom', bottom: 'top', start: 'right', end: 'left' })[side.value] ?? 'center',
)

async function reveal() {
  clearTimers()
  if (props.disabled || isOpen.value) return
  show()
  open.value = true
  await nextTick()
  animate(
    tip.value,
    [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'none' },
    ],
    { duration: 150, easing: 'cubic-bezier(0.31, 0.94, 0.34, 1)' },
  )
}

async function conceal() {
  clearTimers()
  if (!isOpen.value) return
  await animate(tip.value, [{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: 'linear', fill: 'forwards' })
  hide()
  open.value = false
}

const scheduleShow = (ms: number) => {
  clearTimers()
  showTimer = setTimeout(reveal, ms)
}
const scheduleHide = (ms: number) => {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  hideTimer = setTimeout(conceal, ms)
}

const hoverOpens = computed(() => !(rich.value && props.persistent))

// --- Pointer: hover on mouse/pen, long press on touch.
let pressTimer: ReturnType<typeof setTimeout> | undefined
function onPointerOver(e: PointerEvent) {
  if (!hoverOpens.value || e.pointerType === 'touch') return
  if (isOpen.value) clearTimeout(hideTimer)
  else scheduleShow(props.delay)
}
function onPointerOut(e: PointerEvent) {
  if (!hoverOpens.value || e.pointerType === 'touch') return
  const to = e.relatedTarget as Node | null
  if (to && (wrap.value?.contains(to) || tip.value?.contains(to))) return
  // Give the pointer time to move onto a rich tooltip.
  scheduleHide(rich.value ? 300 : 0)
}
function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'touch' || !hoverOpens.value) return
  pressTimer = setTimeout(() => {
    reveal()
    scheduleHide(1500)
  }, 500)
}
const cancelPress = () => clearTimeout(pressTimer)

function onFocusIn() {
  if (hoverOpens.value && anchor.value?.matches(':focus-visible')) reveal()
}
function onFocusOut(e: FocusEvent) {
  const to = e.relatedTarget as Node | null
  if (to && (wrap.value?.contains(to) || tip.value?.contains(to))) return
  if (hoverOpens.value) conceal()
}
function onClick() {
  if (!(rich.value && props.persistent)) return
  if (justDismissed()) return
  if (isOpen.value) conceal()
  else reveal()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) conceal()
}

onMounted(() => {
  anchor.value = (wrap.value?.firstElementChild as HTMLElement | null) ?? null
  const ids = anchor.value?.getAttribute('aria-describedby')
  anchor.value?.setAttribute('aria-describedby', ids ? `${ids} ${id}` : id)
  if (open.value) reveal()
})
onBeforeUnmount(clearTimers)
watch(open, (on) => (on ? reveal() : conceal()))

defineExpose({ show: reveal, hide: conceal })
</script>

<template>
  <span
    ref="wrap"
    class="contents"
    @pointerover="onPointerOver"
    @pointerout="onPointerOut"
    @pointerdown="onPointerDown"
    @pointerup="cancelPress"
    @pointercancel="cancelPress"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot />
  </span>

  <div
    :id="id"
    ref="tip"
    :popover="rich && persistent ? 'auto' : 'manual'"
    :role="hasActions ? 'dialog' : 'tooltip'"
    :style="{ transformOrigin: origin }"
    :class="[popoverReset, 'z-50']"
    @pointerover="onPointerOver"
    @pointerout="onPointerOut"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <!-- Plain: inverse surface, 4dp corners, body-small, 24dp min height, 200dp max width -->
    <div
      v-if="!rich"
      class="flex min-h-6 max-w-50 items-center rounded-[4px] bg-inverse-surface px-2 py-1 font-plain text-body-small text-inverse-on-surface"
    >
      <slot name="content">{{ text }}</slot>
    </div>

    <!-- Rich: surface-container, 12dp corners, elevation 2, 320dp max width -->
    <div
      v-else
      class="flex max-w-80 flex-col rounded-[12px] bg-surface-container px-4 pt-3 shadow-elevation-2"
      :class="hasActions ? 'pb-2' : 'pb-3'"
    >
      <div v-if="$slots.subhead" class="mb-1 font-plain text-title-small text-on-surface-variant">
        <slot name="subhead" />
      </div>
      <div class="font-plain text-body-medium text-on-surface-variant">
        <slot name="content">{{ text }}</slot>
      </div>
      <div v-if="hasActions" class="-ms-3 mt-3 flex gap-2">
        <slot name="actions" :close="conceal" />
      </div>
    </div>
  </div>
</template>
