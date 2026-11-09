<script setup lang="ts">
/**
 * Material 3 Expressive FAB menu.
 * Spec: https://m3.material.io/components/fab-menu/specs
 * Tokens: md.comp.fab-menu, md.comp.fab-menu.{primary,secondary,tertiary}.close-button,
 *         md.comp.fab-menu.{primary,secondary,tertiary}-container
 *
 * A FAB that opens a stack of related actions (FabMenuItems) above it. While open,
 * the FAB morphs into a round 56dp close button.
 * - `v-model:open`; Escape or a click outside closes it and focus returns to the FAB.
 * - Put the FAB icon in the `icon` slot; `label` names the FAB for screen readers.
 * - Place it yourself (e.g. `class="fixed end-4 bottom-4"`); items open upwards, end-aligned.
 */
import { computed, nextTick, onBeforeUnmount, provide, reactive, useId, useTemplateRef, watch } from 'vue'
import { iconPaths } from '../../internal/icons'
import { animate } from '../../internal/motion'
import { useRovingFocus } from '../../internal/useRovingFocus'
import type { FabSize } from './Fab.vue'
import { fabMenuKey, type FabMenuColor } from './context'

const props = withDefaults(
  defineProps<{
    color?: FabMenuColor
    size?: FabSize
    /** Accessible name of the FAB. */
    label: string
    closeLabel?: string
  }>(),
  {
    color: 'primary',
    size: 'small',
    closeLabel: 'Close menu',
  },
)

const open = defineModel<boolean>('open', { default: false })

const listId = useId()
const root = useTemplateRef<HTMLElement>('root')
const list = useTemplateRef<HTMLElement>('list')
const fab = useTemplateRef<HTMLButtonElement>('fab')

const { onKeydown: rove, focusFirst } = useRovingFocus(list, 'button', 'vertical')

provide(
  fabMenuKey,
  reactive({
    color: computed(() => props.color),
    close: () => (open.value = false),
  }),
)

// FAB sizes (as in Fab) and the 56dp round close button they morph into.
const fabBox: Record<FabSize, string> = {
  small: 'size-14 rounded-2xl',
  medium: 'size-20 rounded-[20px]',
  large: 'size-24 rounded-[28px]',
}
const fabIcon: Record<FabSize, string> = { small: 'size-6', medium: 'size-7', large: 'size-9' }

const fabColors: Record<FabMenuColor, string> = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
}
const closeColors: Record<FabMenuColor, string> = {
  primary: 'bg-primary text-on-primary',
  secondary: 'bg-secondary text-on-secondary',
  tertiary: 'bg-tertiary text-on-tertiary',
}

const button = computed(() =>
  open.value
    ? ['size-14 rounded-[28px]', closeColors[props.color]]
    : [fabBox[props.size], fabColors[props.color]],
)

function onDocumentPointerDown(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) open.value = false
}

watch(open, async (on) => {
  if (on) {
    document.addEventListener('pointerdown', onDocumentPointerDown)
    await nextTick()
    // Items rise in one after another, nearest the FAB first.
    const items = [...(list.value?.children ?? [])].reverse()
    items.forEach((el, i) =>
      animate(
        el,
        [
          { opacity: 0, transform: 'translateY(8px) scale(0.9)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 300, delay: i * 30, easing: 'cubic-bezier(0.31, 0.94, 0.34, 1)', fill: 'backwards' },
      ),
    )
    focusFirst()
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    if (root.value?.contains(document.activeElement)) fab.value?.focus()
  }
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.preventDefault()
    open.value = false
  } else {
    rove(e)
  }
}
</script>

<template>
  <div ref="root" class="relative inline-flex flex-col items-end" @keydown="onKeydown">
    <!-- Items: 4dp apart, 8dp above the close button -->
    <div
      v-if="open"
      :id="listId"
      ref="list"
      role="menu"
      :aria-label="label"
      class="absolute end-0 bottom-full mb-2 flex flex-col items-end gap-1"
    >
      <slot />
    </div>

    <button
      ref="fab"
      type="button"
      :aria-label="open ? closeLabel : label"
      :aria-expanded="open"
      :aria-controls="open ? listId : undefined"
      aria-haspopup="menu"
      :class="[
        'relative inline-flex cursor-pointer items-center justify-center shadow-elevation-3 select-none',
        'transition-[width,height,border-radius,background-color] duration-(--duration-spring-fast-spatial) ease-spring-fast-spatial motion-reduce:transition-none',
        'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
        'hover:shadow-elevation-4 hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
        button,
      ]"
      @click="open = !open"
    >
      <span v-if="open" class="inline-flex size-5 *:size-full" aria-hidden="true">
        <slot name="close-icon">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.close" /></svg>
        </slot>
      </span>
      <span v-else :class="['inline-flex *:size-full', fabIcon[size]]" aria-hidden="true">
        <slot name="icon" />
      </span>
    </button>
  </div>
</template>
