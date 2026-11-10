<script setup lang="ts">
/**
 * Material 3 chip: assist, filter, input or suggestion.
 * Spec: https://m3.material.io/components/chips/specs
 * Tokens: md.comp.{assist,filter,input,suggestion}-chip
 *
 * - assist / suggestion: actions. Optional leading icon.
 * - filter: toggles `v-model:selected` on click; shows a check when selected.
 * - input: user-entered item with an optional avatar or icon and a remove button
 *   (emits `remove`). Selection is controlled: set `selected` yourself.
 *
 * Attributes and listeners (e.g. @click) go to the chip's button.
 */
import { computed, useSlots } from 'vue'
import { focusRing } from '../../internal/classes'

defineOptions({ inheritAttrs: false })

export type ChipType = 'assist' | 'filter' | 'input' | 'suggestion'

const props = withDefaults(
  defineProps<{
    type?: ChipType
    /** Elevated container instead of outlined. Not available for input chips. */
    elevated?: boolean
    /** Input chips only: show the remove button. */
    removable?: boolean
    /** Accessible name for the remove button. */
    removeLabel?: string
    dragged?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'assist',
    elevated: false,
    removable: true,
    removeLabel: 'Remove',
    dragged: false,
    disabled: false,
  },
)

const emit = defineEmits<{ remove: [] }>()

const selected = defineModel<boolean>('selected', { default: false })

const slots = useSlots()

const selectable = computed(() => props.type === 'filter' || props.type === 'input')
const isSelected = computed(() => selectable.value && selected.value)
const isElevated = computed(() => props.elevated && props.type !== 'input')
const hasRemove = computed(() => props.type === 'input' && props.removable)
const hasAvatar = computed(() => props.type === 'input' && !!slots.avatar)
const showCheck = computed(() => props.type === 'filter' && isSelected.value)
const hasLeading = computed(() => showCheck.value || !!slots.icon)

// Colors and elevation for the current state, chosen in one place so no two
// classes for the same property ever apply together.
const look = computed(() => {
  const { type } = props

  if (props.disabled) {
    // Containers that are filled fade to on-surface 12%; outlined ones fade the outline.
    const filled = isElevated.value || isSelected.value
    return {
      container: [filled ? 'border-transparent bg-on-surface/12' : 'border-on-surface/12', 'text-on-surface/38'],
      leading: '',
      trailing: 'text-on-surface/38',
    }
  }

  let container: string
  let elevation: string
  let leading: string
  let trailing: string

  if (isSelected.value) {
    container = 'border-transparent bg-secondary-container text-on-secondary-container'
    elevation = isElevated.value
      ? 'shadow-elevation-1 hover:shadow-elevation-2 focus-visible:shadow-elevation-1 active:shadow-elevation-1'
      : 'hover:shadow-elevation-1 focus-visible:shadow-none active:shadow-none'
    leading = type === 'input' ? 'text-primary' : ''
    trailing = 'text-on-secondary-container'
  } else {
    const label = type === 'assist' ? 'text-on-surface' : 'text-on-surface-variant'
    const focusOutline =
      type === 'assist' ? 'focus-visible:border-on-surface' : 'focus-visible:border-on-surface-variant'
    container = isElevated.value
      ? `${label} border-transparent bg-surface-container-low`
      : `${label} border-outline-variant ${focusOutline}`
    elevation = isElevated.value
      ? 'shadow-elevation-1 hover:shadow-elevation-2 focus-visible:shadow-elevation-1 active:shadow-elevation-1'
      : ''
    leading = type === 'input' ? '' : 'text-primary'
    trailing = 'text-on-surface-variant'
  }

  if (props.dragged) elevation = 'shadow-elevation-4'

  return { container: [container, elevation], leading, trailing }
})

// Leading space: 4dp before an avatar, 8dp before an icon, else 16dp.
// Trailing space: 8dp before a trailing icon; the remove button needs 8 + 18 + 8dp.
const padding = computed(() => [
  hasAvatar.value ? 'ps-1' : hasLeading.value ? 'ps-2' : 'ps-4',
  hasRemove.value ? 'pe-[34px]' : slots['trailing-icon'] ? 'pe-2' : 'pe-4',
])

function onClick() {
  if (props.type === 'filter') selected.value = !selected.value
}
</script>

<template>
  <span class="relative inline-flex">
    <button
      v-bind="$attrs"
      type="button"
      :disabled="disabled"
      :aria-pressed="selectable ? isSelected : undefined"
      :data-dragged="dragged && !disabled ? '' : undefined"
      :class="[
        'relative inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border font-plain text-label-large whitespace-nowrap select-none transition-shadow',
        // Focus indicator: 3dp secondary, 2dp outer offset
        focusRing,
        // State layer in the label color (covers the outline): hover 8%, focus/pressed 10%, dragged 16%
        'before:pointer-events-none before:absolute before:-inset-px before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
        'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10 data-dragged:before:opacity-16',
        // 48dp touch target
        'after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2',
        'disabled:pointer-events-none',
        look.container,
        padding,
      ]"
      @click="onClick"
    >
      <span
        v-if="hasAvatar"
        :class="['inline-flex size-6 shrink-0 overflow-hidden rounded-full *:size-full', disabled && 'opacity-38']"
      >
        <slot name="avatar" />
      </span>
      <span v-else-if="hasLeading" :class="['inline-flex size-4.5 shrink-0 *:size-full', look.leading]">
        <slot v-if="showCheck" name="selected-icon">
          <!-- Material Symbols "check" -->
          <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">
            <path d="M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z" />
          </svg>
        </slot>
        <slot v-else name="icon" />
      </span>

      <slot />

      <span v-if="$slots['trailing-icon']" class="inline-flex size-4.5 shrink-0 *:size-full">
        <slot name="trailing-icon" />
      </span>
    </button>

    <button
      v-if="hasRemove"
      type="button"
      :disabled="disabled"
      :aria-label="removeLabel"
      :class="[
        'absolute end-2 top-1/2 inline-flex size-4.5 -translate-y-1/2 cursor-pointer *:size-full',
        'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary focus-visible:rounded-full',
        'before:pointer-events-none before:absolute before:-inset-1.5 before:rounded-full before:bg-current before:opacity-0 before:transition-opacity',
        'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
        // 48dp touch target
        'after:absolute after:top-1/2 after:left-1/2 after:size-12 after:-translate-1/2',
        'disabled:pointer-events-none',
        look.trailing,
      ]"
      @click="emit('remove')"
    >
      <slot name="remove-icon">
        <!-- Material Symbols "close" -->
        <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">
          <path
            d="m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"
          />
        </svg>
      </slot>
    </button>
  </span>
</template>
