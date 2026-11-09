<script setup lang="ts">
/**
 * Material 3 card.
 * Spec: https://m3.material.io/components/cards/specs
 * Tokens: md.comp.{elevated,filled,outlined}-card
 *
 * Space cards at most 8dp apart (layout is up to the parent).
 */
import { computed, type Component } from 'vue'

export type CardVariant = 'elevated' | 'filled' | 'outlined'

const props = withDefaults(
  defineProps<{
    variant?: CardVariant
    /** Element or component to render, e.g. 'a', 'button', RouterLink. */
    as?: string | Component
    /** Adds hover/focus/pressed states, elevation changes and a focus ring. */
    interactive?: boolean
    /** Dragged state: raised elevation and a 16% state layer. */
    dragged?: boolean
    disabled?: boolean
    /** 16dp padding. Turn off for edge-to-edge media, then pad content yourself. */
    padded?: boolean
  }>(),
  {
    variant: 'filled',
    as: 'div',
    interactive: false,
    dragged: false,
    disabled: false,
    padded: true,
  },
)

interface VariantSpec {
  container: string
  /** Elevation/outline changes for hover, focus and pressed */
  states: string
  dragged: string
  disabled: string
}

// Disabled and dragged styles use aria-disabled: / data-dragged: variants so they
// override the resting classes. Disabled containers composite a translucent color
// over the resting container: a solid-color gradient on top of the background color.
const variants: Record<CardVariant, VariantSpec> = {
  elevated: {
    container: 'bg-surface-container-low shadow-elevation-1',
    states: 'hover:shadow-elevation-2 focus-visible:shadow-elevation-1 active:shadow-elevation-1',
    dragged: 'data-dragged:shadow-elevation-4',
    disabled: 'aria-disabled:bg-linear-to-r aria-disabled:from-surface/38 aria-disabled:to-surface/38',
  },
  filled: {
    container: 'bg-surface-container-highest',
    states: 'hover:shadow-elevation-1 focus-visible:shadow-none active:shadow-none',
    dragged: 'data-dragged:shadow-elevation-3',
    disabled:
      'aria-disabled:bg-linear-to-r aria-disabled:from-on-surface/38 aria-disabled:to-on-surface/38',
  },
  outlined: {
    container: 'border border-outline-variant bg-surface',
    states:
      'hover:shadow-elevation-1 focus-visible:border-on-surface focus-visible:shadow-none active:shadow-none',
    dragged: 'data-dragged:shadow-elevation-3',
    disabled: 'aria-disabled:border-outline/12',
  },
}

const isNativeButton = computed(() => props.as === 'button')

const classes = computed(() => {
  const v = variants[props.variant]
  const active = props.interactive && !props.disabled

  return [
    v.container,
    props.padded && 'p-4',
    v.disabled,
    v.dragged,
    active && [
      'cursor-pointer',
      // Focus indicator: 3dp secondary, 2dp outer offset
      'focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary',
      // State layer: on-surface at hover 8%, focus 10%, pressed 10%
      'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
      !props.dragged && v.states,
    ],
  ]
})
</script>

<template>
  <component
    :is="as"
    :type="isNativeButton ? 'button' : undefined"
    :disabled="isNativeButton ? disabled : undefined"
    :aria-disabled="disabled || undefined"
    :data-dragged="dragged && !disabled ? '' : undefined"
    :tabindex="disabled && !isNativeButton ? -1 : undefined"
    :class="[
      'relative block overflow-hidden rounded-[12px] text-start text-on-surface focus:outline-none transition-shadow',
      'before:pointer-events-none before:absolute before:inset-0 before:bg-on-surface before:opacity-0 before:transition-opacity',
      'aria-disabled:pointer-events-none aria-disabled:text-on-surface/38',
      'data-dragged:before:opacity-16',
      classes,
    ]"
  >
    <slot />
  </component>
</template>
