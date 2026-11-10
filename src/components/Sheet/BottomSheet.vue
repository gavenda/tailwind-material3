<script setup lang="ts">
/**
 * Material 3 bottom sheet: modal or standard.
 * Spec: https://m3.material.io/components/bottom-sheets/specs
 * Tokens: md.comp.sheet.bottom
 *
 * - `v-model:open` shows it. Modal sheets dim the page (32% scrim), trap focus, and close
 *   on Escape or a scrim click unless `persistent`. Standard sheets leave the page usable.
 * - Drag the handle (or swipe the sheet down) to dismiss; the handle is also a button
 *   that closes it for keyboard and screen reader users.
 * - Up to 640dp wide, centred, 28dp top corners, surface-container-low.
 */
import { ref, useTemplateRef } from 'vue'
import { scrimClasses } from '../../internal/classes'
import { animate, EMPHASIZED_ACCELERATE, EMPHASIZED_DECELERATE, scrimIn, scrimOut } from '../../internal/motion'
import { useDialog } from '../../internal/useDialog'

const props = withDefaults(
  defineProps<{
    modal?: boolean
    persistent?: boolean
    /** Show the drag handle. */
    handle?: boolean
    handleLabel?: string
    label?: string
  }>(),
  {
    modal: true,
    persistent: false,
    handle: true,
    handleLabel: 'Close sheet',
    label: undefined,
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ cancel: []; closed: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const sheet = useTemplateRef<HTMLElement>('sheet')
const scrim = useTemplateRef<HTMLElement>('scrim')

const { cancel, onCancel, onClose } = useDialog(dialog, open, {
  modal: () => props.modal,
  persistent: () => props.persistent,
  onCancel: () => emit('cancel'),
  onClosed: () => emit('closed'),
  enter: () =>
    Promise.all([
      animate(sheet.value, [{ transform: 'translateY(100%)' }, { transform: 'none' }], {
        duration: 500,
        easing: EMPHASIZED_DECELERATE,
      }),
      scrimIn(scrim.value),
    ]),
  leave: () =>
    Promise.all([
      animate(
        sheet.value,
        [{ transform: `translateY(${drag.value}px)` }, { transform: 'translateY(100%)' }],
        { duration: 250, easing: EMPHASIZED_ACCELERATE, fill: 'forwards' },
      ),
      scrimOut(scrim.value, 250),
    ]).then(() => (drag.value = 0)),
})

// --- Drag to dismiss
const drag = ref(0)
let startY = 0
let lastY = 0
let lastT = 0
let velocity = 0
let dragging = false
/** Set once the pointer moves a few px, so the handle's click isn't treated as a tap. */
let moved = false

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  dragging = true
  moved = false
  startY = lastY = e.clientY
  lastT = e.timeStamp
  velocity = 0
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  drag.value = Math.max(0, e.clientY - startY)
  if (Math.abs(e.clientY - startY) > 3) moved = true
  const dt = e.timeStamp - lastT
  if (dt > 0) velocity = (e.clientY - lastY) / dt
  lastY = e.clientY
  lastT = e.timeStamp
}
function onPointerUp() {
  if (!dragging) return
  dragging = false
  const height = sheet.value?.offsetHeight ?? 1
  // Dismiss past half its height or on a quick downward flick; otherwise settle back.
  if (drag.value > height / 2 || velocity > 0.5) {
    cancel()
    if (props.persistent) drag.value = 0
  } else {
    const from = drag.value
    drag.value = 0
    animate(sheet.value, [{ transform: `translateY(${from}px)` }, { transform: 'none' }], {
      duration: 300,
      easing: EMPHASIZED_DECELERATE,
    })
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-label="label"
    :class="[
      'm-0 max-h-none max-w-none overflow-visible bg-transparent p-0 text-on-surface backdrop:bg-transparent',
      modal ? 'fixed inset-0 size-full' : 'fixed inset-x-0 top-auto bottom-0 w-full',
    ]"
    @cancel="onCancel"
    @close="onClose"
  >
    <div v-if="modal" ref="scrim" :class="scrimClasses" @click="cancel" />

    <div :class="['pointer-events-none flex justify-center', modal ? 'absolute inset-x-0 bottom-0 top-14' : '']">
      <div
        ref="sheet"
        :style="drag ? { transform: `translateY(${drag}px)` } : undefined"
        :class="[
          'pointer-events-auto mt-auto flex max-h-full w-full max-w-160 flex-col rounded-t-[28px] bg-surface-container-low font-plain shadow-elevation-1',
          'sm:mx-14',
        ]"
        @pointerdown="!handle && onPointerDown($event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <!-- Drag handle: 32×4dp, on-surface-variant at 40%, 22dp above and below -->
        <button
          v-if="handle"
          type="button"
          :aria-label="handleLabel"
          class="group flex h-12 w-full shrink-0 cursor-grab touch-none items-center justify-center focus:outline-none active:cursor-grabbing"
          @pointerdown="onPointerDown"
          @click="!moved && cancel()"
        >
          <span
            class="h-1 w-8 rounded-full bg-on-surface-variant/40 group-focus-visible:outline-3 group-focus-visible:outline-offset-2 group-focus-visible:outline-secondary group-focus-visible:outline-solid"
          />
        </button>
        <div :class="['min-h-0 flex-1 overflow-y-auto px-4 pb-6', !handle && 'pt-6']">
          <slot />
        </div>
      </div>
    </div>
  </dialog>
</template>
