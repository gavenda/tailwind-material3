<script setup lang="ts">
/**
 * Action in a FabMenu: a 56dp pill with an icon and a label.
 * Tokens: md.comp.fab-menu.menu-item, md.comp.fab-menu.{primary,secondary,tertiary}-container
 * Clicking it closes the menu. Listen with @click.
 */
import { computed, inject } from 'vue'
import { focusRing, stateLayer } from '../../internal/classes'
import { fabMenuKey } from './context'

const menu = inject(fabMenuKey, null)

const colors = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
}
const color = computed(() => colors[menu?.color ?? 'primary'])
</script>

<template>
  <button
    type="button"
    role="menuitem"
    tabindex="-1"
    :class="[
      'relative inline-flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-full px-6 font-plain text-title-medium whitespace-nowrap shadow-elevation-3 select-none',
      focusRing,
      stateLayer,
      color,
    ]"
    @click="menu?.close()"
  >
    <span v-if="$slots.icon" class="inline-flex size-6 shrink-0 *:size-full" aria-hidden="true">
      <slot name="icon" />
    </span>
    <slot />
  </button>
</template>
