<script setup lang="ts">
/**
 * Material 3 Expressive toolbar: docked or floating.
 * Spec: https://m3.material.io/components/toolbars/specs
 * Tokens: md.comp.toolbar.{docked,floating}, md.comp.toolbar.{standard,vibrant},
 *         md.comp.toolbar.floating.fab
 *
 * The docked toolbar replaces the (deprecated) bottom app bar.
 * - Put IconButtons (variant "standard" picks up the toolbar's colors), Buttons, or a
 *   ButtonGroup in the default slot.
 * - Docked: full-width 64dp bar; items are spread across it.
 * - Floating: 64dp pill with elevation 3; `vertical` stacks it. The `fab` slot puts a
 *   FAB beside it, 8dp away (use a Fab with color "secondary-container" or, for
 *   vibrant toolbars, "tertiary-container").
 * Place it yourself (e.g. `class="fixed bottom-4 start-1/2 -translate-x-1/2"`).
 */
import { computed, provide, reactive, useTemplateRef } from 'vue'
import { useRovingFocus } from '../../internal/useRovingFocus'
import { toolbarKey, type ToolbarColor } from './context'

const props = withDefaults(
  defineProps<{
    variant?: 'docked' | 'floating'
    color?: ToolbarColor
    /** Floating only. */
    vertical?: boolean
    label?: string
  }>(),
  {
    variant: 'docked',
    color: 'standard',
    vertical: false,
    label: undefined,
  },
)

provide(toolbarKey, reactive({ color: computed(() => props.color) }))

const bar = useTemplateRef<HTMLElement>('bar')
const isVertical = computed(() => props.variant === 'floating' && props.vertical)
const { onKeydown } = useRovingFocus(bar, 'button, a[href]', () => (isVertical.value ? 'vertical' : 'horizontal'))

const surface = computed(() =>
  props.color === 'vibrant' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant',
)
</script>

<template>
  <div :class="['inline-flex items-center gap-2', isVertical ? 'flex-col' : '', variant === 'docked' && 'w-full']">
    <div
      ref="bar"
      role="toolbar"
      :aria-label="label"
      :aria-orientation="isVertical ? 'vertical' : 'horizontal'"
      :class="[
        'flex items-center',
        surface,
        variant === 'docked'
          ? 'h-16 w-full justify-between gap-1 px-4'
          : ['rounded-full shadow-elevation-3', isVertical ? 'w-16 flex-col gap-1 py-2' : 'h-16 gap-1 px-2'],
      ]"
      @keydown="onKeydown"
    >
      <slot />
    </div>
    <slot v-if="variant === 'floating'" name="fab" />
  </div>
</template>
