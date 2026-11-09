<script setup lang="ts">
/**
 * Material 3 divider.
 * Spec: https://m3.material.io/components/divider/specs
 * Tokens: md.comp.divider
 *
 * A 1dp outline-variant line. Horizontal dividers fill the width; vertical ones
 * fill the height of a flex/grid parent. `inset` indents it by 16dp.
 */
withDefaults(
  defineProps<{
    vertical?: boolean
    /** Indent from the start, end, or both sides (top/bottom when vertical). */
    inset?: 'none' | 'start' | 'end' | 'both'
  }>(),
  {
    vertical: false,
    inset: 'none',
  },
)
</script>

<template>
  <div
    role="separator"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
    :class="[
      'shrink-0 bg-outline-variant',
      vertical ? 'w-px self-stretch' : 'h-px w-auto',
      vertical
        ? { 'mt-4': inset === 'start' || inset === 'both', 'mb-4': inset === 'end' || inset === 'both' }
        : { 'ms-4': inset === 'start' || inset === 'both', 'me-4': inset === 'end' || inset === 'both' },
    ]"
  />
</template>
