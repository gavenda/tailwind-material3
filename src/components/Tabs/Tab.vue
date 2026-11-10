<script setup lang="ts">
/**
 * Tab inside Tabs.
 * Spec: https://m3.material.io/components/tabs/specs
 * Tokens: md.comp.primary-navigation-tab, md.comp.secondary-navigation-tab
 * - `value` identifies it for the Tabs `v-model`.
 * - Label in the default slot, optional `icon` slot. Primary tabs with an icon and a
 *   label stack them (64dp tall); secondary tabs put the icon inline.
 * - `badge`: true for a small badge, or a number/string for a large one.
 */
import { computed, inject, useSlots } from 'vue'
import { focusRingInset, stateLayer } from '../../internal/classes'
import Badge from '../Badge/Badge.vue'
import { useBadge, type BadgeProp } from '../Badge/useBadge'
import { tabsKey, type TabValue } from './context'
import { vRipple } from '../../internal/ripple'

const props = withDefaults(
  defineProps<{
    value: TabValue
    badge?: BadgeProp
    disabled?: boolean
  }>(),
  {
    badge: undefined,
    disabled: false,
  },
)

const tabs = inject(tabsKey, null)
const slots = useSlots()

const active = computed(() => tabs?.isActive(props.value) ?? false)
const primary = computed(() => tabs?.variant !== 'secondary')
const stacked = computed(() => primary.value && !!slots.icon && !!slots.default)

const color = computed(() => {
  if (!active.value) return 'text-on-surface-variant'
  return primary.value ? 'text-primary' : 'text-on-surface'
})

const { hasBadge, badgeValue } = useBadge(() => props.badge)
</script>

<template>
  <button
    v-ripple
    type="button"
    role="tab"
    :aria-selected="active"
    :tabindex="active ? 0 : -1"
    :disabled="disabled"
    :class="[
      'relative flex min-w-[90px] flex-1 shrink-0 cursor-pointer items-center justify-center px-4 font-plain text-title-small whitespace-nowrap select-none',
      stacked ? 'h-16' : 'h-12',
      focusRingInset,
      stateLayer,
      'disabled:pointer-events-none disabled:opacity-38',
      color,
    ]"
    @click="tabs?.select(value)"
  >
    <span data-tab-content :class="['relative flex items-center', stacked ? 'flex-col gap-0.5' : 'gap-2']">
      <span v-if="$slots.icon" class="relative inline-flex size-6 *:size-full" aria-hidden="true">
        <Badge v-if="hasBadge && stacked" :value="badgeValue" class="size-full">
          <span class="inline-flex size-6 *:size-full"><slot name="icon" /></span>
        </Badge>
        <slot v-else name="icon" />
      </span>
      <slot />
      <Badge v-if="hasBadge && !stacked" :value="badgeValue" />
    </span>
  </button>
</template>
