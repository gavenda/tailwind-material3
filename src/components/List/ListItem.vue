<script setup lang="ts">
/**
 * Item in a Material 3 Expressive list.
 * Tokens: md.comp.list.list-item
 *
 * - Default slot: headline (body-large). Props `overline`, `supportingText`
 *   (body-medium, up to 2 lines) and `trailingText`; slots of the same names work too.
 * - Leading: `icon` (20dp) or `leading` (anything: avatar, image, checkbox).
 *   Trailing: `trailing-icon` (20dp) or `trailing`.
 * - Height follows the content: 56dp one line, 72dp two, 88dp three.
 * - `as` picks the element ('button', 'a', RouterLink…); buttons and links, or
 *   `interactive`, get state layers and the Expressive corner morph
 *   (4dp → 12dp hovered → 16dp focused/selected).
 */
import { computed, inject, useSlots, type Component } from 'vue'
import { focusRingInset, stateLayer } from '../../internal/classes'
import { listKey } from './context'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    as?: string | Component
    overline?: string
    supportingText?: string
    trailingText?: string
    interactive?: boolean
    selected?: boolean
    disabled?: boolean
  }>(),
  {
    as: 'div',
    overline: undefined,
    supportingText: undefined,
    trailingText: undefined,
    interactive: undefined,
    selected: false,
    disabled: false,
  },
)

const slots = useSlots()
const list = inject(listKey, null)

const isNativeButton = computed(() => props.as === 'button')
const isInteractive = computed(
  () => props.interactive ?? (props.as === 'button' || props.as === 'a' || typeof props.as !== 'string'),
)

const hasOverline = computed(() => !!(props.overline || slots.overline))
const hasSupporting = computed(() => !!(props.supportingText || slots['supporting-text']))
const lines = computed(() => 1 + Number(hasOverline.value) + Number(hasSupporting.value))

const classes = computed(() => {
  const active = isInteractive.value && !props.disabled
  return [
    // 56 / 72 / 88dp; three-line items align to the top
    lines.value === 1 ? 'min-h-14 items-center' : lines.value === 2 ? 'min-h-18 items-center' : 'min-h-22 items-start',
    props.selected
      ? 'bg-secondary-container text-on-secondary-container rounded-2xl'
      : ['text-on-surface rounded-[4px]', list?.segmented && 'bg-surface'],
    active && [
      'cursor-pointer',
      !props.selected && 'hover:rounded-[12px] focus-visible:rounded-2xl',
      focusRingInset,
      stateLayer,
    ],
    props.disabled && 'pointer-events-none',
  ]
})

const muted = computed(() => (props.selected ? 'text-on-secondary-container' : 'text-on-surface-variant'))
</script>

<template>
  <!-- The listitem role sits on a wrapper so buttons and links keep their own role. -->
  <div role="listitem" class="contents">
  <component
    :is="as"
    v-bind="$attrs"
    :type="isNativeButton ? 'button' : undefined"
    :disabled="isNativeButton ? disabled : undefined"
    :aria-disabled="disabled || undefined"
    :aria-current="selected && as === 'a' ? 'page' : undefined"
    :tabindex="disabled && !isNativeButton ? -1 : undefined"
    :class="[
      'relative flex w-full gap-3 py-2.5 ps-4 pe-4 text-start font-plain no-underline shape-morph',
      classes,
    ]"
  >
    <span :class="['contents', disabled && '*:opacity-38']">
      <span v-if="$slots.icon" :class="['inline-flex size-5 shrink-0 *:size-full', muted]" aria-hidden="true">
        <slot name="icon" />
      </span>
      <span v-else-if="$slots.leading" class="inline-flex shrink-0">
        <slot name="leading" />
      </span>

      <span class="flex min-w-0 flex-1 flex-col">
        <span v-if="hasOverline" :class="['text-label-small', muted]">
          <slot name="overline">{{ overline }}</slot>
        </span>
        <span class="text-body-large"><slot /></span>
        <span v-if="hasSupporting" :class="['line-clamp-2 text-body-medium', muted]">
          <slot name="supporting-text">{{ supportingText }}</slot>
        </span>
      </span>

      <span v-if="trailingText || $slots['trailing-text']" :class="['shrink-0 text-label-small', muted]">
        <slot name="trailing-text">{{ trailingText }}</slot>
      </span>
      <span
        v-if="$slots['trailing-icon']"
        :class="['inline-flex size-5 shrink-0 *:size-full', muted]"
        aria-hidden="true"
      >
        <slot name="trailing-icon" />
      </span>
      <span v-else-if="$slots.trailing" class="inline-flex shrink-0">
        <slot name="trailing" />
      </span>
    </span>
  </component>
  </div>
</template>
