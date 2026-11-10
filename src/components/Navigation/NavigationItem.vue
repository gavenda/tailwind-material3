<script setup lang="ts">
/**
 * Destination in a NavigationBar or NavigationRail.
 * Tokens: md.comp.nav-bar.item.{vertical,horizontal}, md.comp.nav-rail.item.{vertical,horizontal}
 *
 * - `value` is matched against the parent's `v-model`; or set `active` yourself (e.g. from the router).
 * - Slots: `icon`, optional `active-icon` (e.g. the filled version), and the label.
 * - `badge`: true for a small badge, or a number/string for a large one.
 * - `as`/`href` render a link (RouterLink, 'a') instead of a button.
 */
import { computed, inject, type Component } from 'vue'
import Badge from '../Badge/Badge.vue'
import { useBadge, type BadgeProp } from '../Badge/useBadge'
import { navKey, type NavValue } from './context'

const props = withDefaults(
  defineProps<{
    value?: NavValue
    label: string
    active?: boolean
    badge?: BadgeProp
    as?: string | Component
    disabled?: boolean
  }>(),
  {
    value: undefined,
    active: undefined,
    badge: undefined,
    as: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const nav = inject(navKey, null)
const isActive = computed(() => props.active ?? nav?.isActive(props.value) ?? false)
const horizontal = computed(() => nav?.layout === 'horizontal')
const rail = computed(() => nav?.container === 'rail')
const element = computed(() => props.as ?? 'button')

function onClick(e: MouseEvent) {
  nav?.select(props.value)
  emit('click', e)
}

const { hasBadge, badgeValue } = useBadge(() => props.badge)
</script>

<template>
  <component
    :is="element"
    :type="element === 'button' ? 'button' : undefined"
    :disabled="element === 'button' ? disabled : undefined"
    :aria-current="isActive ? 'page' : undefined"
    :class="[
      'group relative flex cursor-pointer items-center font-plain no-underline select-none focus:outline-none',
      'disabled:pointer-events-none disabled:opacity-38',
      horizontal
        ? rail
          ? 'h-14 w-full'
          : 'h-full flex-1 justify-center'
        : ['flex-col justify-center gap-1', rail ? 'h-16 w-full' : 'h-full flex-1'],
    ]"
    @click="onClick"
  >
    <!--
      Active indicator: secondary-container pill. Vertical: 56×32 around the icon.
      Horizontal: wraps icon and label (bar 40dp tall, rail 56dp and full width).
      It also carries the state layer and the focus ring.
    -->
    <span
      :class="[
        'relative flex items-center justify-center rounded-full',
        'group-focus-visible:outline-3 group-focus-visible:outline-solid group-focus-visible:outline-secondary',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
        'group-hover:before:opacity-8 group-focus-visible:before:opacity-10 group-active:before:opacity-10',
        horizontal ? (rail ? 'h-14 w-full justify-start gap-2 px-4' : 'h-10 gap-1 px-4') : 'h-8 w-14',
        isActive ? 'text-on-secondary-container' : 'text-on-surface-variant',
      ]"
    >
      <!-- The fill grows from the centre when the item becomes active. -->
      <span
        :class="[
          'absolute inset-0 rounded-[inherit] bg-secondary-container transition-[scale,opacity] duration-(--duration-spring-fast-spatial) ease-spring-fast-spatial motion-reduce:transition-none',
          isActive ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0',
        ]"
      />
      <Badge v-if="hasBadge" :value="badgeValue" class="relative">
        <span class="inline-flex size-6 *:size-full" aria-hidden="true">
          <slot v-if="isActive && $slots['active-icon']" name="active-icon" />
          <slot v-else name="icon" />
        </span>
      </Badge>
      <span v-else class="relative inline-flex size-6 *:size-full" aria-hidden="true">
        <slot v-if="isActive && $slots['active-icon']" name="active-icon" />
        <slot v-else name="icon" />
      </span>
      <span
        v-if="horizontal"
        :class="['relative truncate', rail ? 'text-label-large' : 'text-label-medium']"
      >
        {{ label }}
      </span>
    </span>
    <span
      v-if="!horizontal"
      :class="['text-label-medium', isActive ? 'text-secondary' : 'text-on-surface-variant']"
    >
      {{ label }}
    </span>
  </component>
</template>
