<script setup lang="ts">
/**
 * Menu button for a NavigationRail's `header` slot: expands and collapses the rail.
 * Spec: https://m3.material.io/components/navigation-rail/guidelines (Presentation)
 *
 * As the rail expands, the icon turns half a turn with the rail's default spatial spring
 * and changes from menu to menu_open halfway, while it's edge-on; collapsing turns it back.
 * Slots `menu-icon` and `menu-open-icon` replace the icons.
 */
import { computed, inject } from 'vue'
import IconButton from '../Button/IconButton.vue'
import { iconPaths } from '../../internal/icons'
import { navKey } from './context'

const props = withDefaults(defineProps<{ expandLabel?: string; collapseLabel?: string }>(), {
  expandLabel: 'Expand navigation',
  collapseLabel: 'Collapse navigation',
})

// The rail's header starts at its indicators' edge; 8dp more centres this 40dp button over
// the 56dp indicators, with its icon in line with theirs, collapsed or expanded.
const nav = inject(navKey, null)
if (!nav?.toggle) console.warn('[NavigationRailMenuButton] Put it in a NavigationRail’s header slot.')
const expanded = computed(() => !!nav?.expanded)

/**
 * The swap happens when the spring is halfway (about 75ms in), so each icon is only seen
 * the right way round. Both icons switch together; menu_open is drawn pre-rotated by half
 * a turn so it ends upright.
 */
const swap = 'transition-opacity duration-0 delay-75 motion-reduce:delay-0'
</script>

<template>
  <IconButton
    variant="standard"
    :label="expanded ? props.collapseLabel : props.expandLabel"
    :aria-expanded="expanded"
    class="ms-2"
    @click="nav?.toggle?.()"
  >
    <span
      :class="[
        'relative inline-flex',
        'transition-transform duration-(--duration-spring-default-spatial) ease-spring-default-spatial motion-reduce:transition-none',
        expanded ? 'rotate-180' : 'rotate-0',
      ]"
    >
      <span :class="['absolute inset-0 inline-flex *:size-full', swap, expanded ? 'opacity-0' : 'opacity-100']">
        <slot name="menu-icon">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.menu" /></svg>
        </slot>
      </span>
      <span :class="['absolute inset-0 inline-flex rotate-180 *:size-full', swap, expanded ? 'opacity-100' : 'opacity-0']">
        <slot name="menu-open-icon">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.menuOpen" /></svg>
        </slot>
      </span>
    </span>
  </IconButton>
</template>
