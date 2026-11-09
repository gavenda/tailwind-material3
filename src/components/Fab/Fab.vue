<script setup lang="ts">
/**
 * Material 3 Expressive FAB and extended FAB.
 * Spec: https://m3.material.io/components/floating-action-button/specs
 *       https://m3.material.io/components/extended-fab/specs
 * Tokens: md.comp.fab.{primary-container,…,tertiary} + md.comp.fab{,.medium,.large}
 *         md.comp.extended-fab.{small,medium,large}
 *
 * - Icon in the `icon` slot. Give it `label` text to make it an extended FAB;
 *   `expanded` (default true) collapses it back to a plain FAB with an animation,
 *   e.g. while the page scrolls.
 * - Without a visible label, `ariaLabel` is required for an accessible name.
 * - `lowered` uses the lower elevation for FABs on a surface (e.g. in a toolbar).
 */
import { computed } from 'vue'

export type FabSize = 'small' | 'medium' | 'large'
export type FabColor =
  | 'primary-container'
  | 'secondary-container'
  | 'tertiary-container'
  | 'primary'
  | 'secondary'
  | 'tertiary'

const props = withDefaults(
  defineProps<{
    size?: FabSize
    color?: FabColor
    /** Visible label: makes it an extended FAB. */
    label?: string
    /** Extended FAB only: show the label. */
    expanded?: boolean
    /** Accessible name when there's no visible label. */
    ariaLabel?: string
    lowered?: boolean
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    size: 'small',
    color: 'primary-container',
    label: undefined,
    expanded: true,
    ariaLabel: undefined,
    lowered: false,
    type: 'button',
    disabled: false,
  },
)

interface SizeSpec {
  /** Square size, corner radius, icon size */
  box: string
  icon: string
  /** Extended: side padding, icon-label gap, label type */
  pad: string
  gap: string
  text: string
}

// FAB 56dp/16dp corners, medium 80/20, large 96/28. Icons 24/28/36dp.
const sizes: Record<FabSize, SizeSpec> = {
  small: { box: 'h-14 min-w-14 rounded-2xl', icon: 'size-6', pad: 'px-4', gap: 'ms-2', text: 'font-plain text-title-medium' },
  medium: { box: 'h-20 min-w-20 rounded-[20px]', icon: 'size-7', pad: 'px-[26px]', gap: 'ms-3', text: 'font-brand text-title-large' },
  large: { box: 'h-24 min-w-24 rounded-[28px]', icon: 'size-9', pad: 'px-7', gap: 'ms-4', text: 'font-brand text-headline-small' },
}

const colors: Record<FabColor, string> = {
  'primary-container': 'bg-primary-container text-on-primary-container',
  'secondary-container': 'bg-secondary-container text-on-secondary-container',
  'tertiary-container': 'bg-tertiary-container text-on-tertiary-container',
  primary: 'bg-primary text-on-primary',
  secondary: 'bg-secondary text-on-secondary',
  tertiary: 'bg-tertiary text-on-tertiary',
}

const extended = computed(() => !!props.label)
const spec = computed(() => sizes[props.size])

// Elevation 3, hover 4; lowered: 1, hover 2. Focus and pressed return to resting.
const elevation = computed(() =>
  props.lowered
    ? 'shadow-elevation-1 hover:shadow-elevation-2 focus-visible:shadow-elevation-1 active:shadow-elevation-1'
    : 'shadow-elevation-3 hover:shadow-elevation-4 focus-visible:shadow-elevation-3 active:shadow-elevation-3',
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :aria-label="extended && expanded ? undefined : (ariaLabel ?? label)"
    :class="[
      'relative inline-flex shrink-0 cursor-pointer items-center justify-center select-none',
      'transition-[box-shadow,padding] duration-(--duration-spring-fast-spatial) ease-spring-fast-spatial motion-reduce:transition-none',
      'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary',
      // State layer: hover 8%, focus/pressed 10%
      'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
      'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
      'disabled:pointer-events-none disabled:bg-on-surface/10 disabled:text-on-surface/38 disabled:shadow-none',
      spec.box,
      extended && spec.pad,
      colors[color],
      elevation,
    ]"
  >
    <span :class="['inline-flex shrink-0 *:size-full', spec.icon]" aria-hidden="true">
      <slot name="icon" />
    </span>
    <!-- Label collapses by animating its grid track from 1fr to 0fr. -->
    <span
      v-if="extended"
      :class="[
        'grid transition-[grid-template-columns,opacity] duration-(--duration-spring-fast-spatial) ease-spring-fast-spatial motion-reduce:transition-none',
        expanded ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0',
      ]"
    >
      <span :class="['overflow-hidden whitespace-nowrap', spec.text]">
        <span :class="['inline-block', spec.gap]">{{ label }}</span>
      </span>
    </span>
  </button>
</template>
