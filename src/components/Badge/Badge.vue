<script setup lang="ts">
/**
 * Material 3 badge.
 * Spec: https://m3.material.io/components/badges/specs
 * Tokens: md.comp.badge
 *
 * - No `value`: small badge, a 6dp dot.
 * - With `value`: large badge, 16dp tall, label-small. Numbers above `max` show as "999+".
 * - Wrap an icon (or anything) in the default slot to pin the badge to its top-end corner.
 *   Without a slot, the badge renders inline.
 *
 * Badges are visual only. Give the badged element an accessible name that includes
 * the count (e.g. aria-label="Inbox, 3 new"), or set `label` to announce it here.
 */
import { computed, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number | string
    /** Largest number shown before it becomes "{max}+". */
    max?: number
    /** Hide the badge (e.g. when the count is 0). */
    hidden?: boolean
    /** Text for screen readers, e.g. "3 new messages". */
    label?: string
  }>(),
  {
    value: undefined,
    max: 999,
    hidden: false,
    label: undefined,
  },
)

const slots = useSlots()

const large = computed(() => props.value !== undefined && props.value !== '')
const text = computed(() => {
  const v = props.value
  if (typeof v === 'number' && v > props.max) return `${props.max}+`
  return String(v ?? '')
})

const badgeClasses = computed(() => [
  'pointer-events-none inline-flex shrink-0 items-center justify-center rounded-full bg-error text-on-error',
  large.value ? 'h-4 min-w-4 px-1 font-plain text-label-small' : 'size-1.5',
])
</script>

<template>
  <span v-if="slots.default" class="relative inline-flex">
    <slot />
    <!--
      Small: 6dp dot inside the top-end corner.
      Large: starts 12dp before the end edge, bottom edge 14dp below the top.
    -->
    <span
      v-if="!hidden"
      :aria-label="label"
      :aria-hidden="label ? undefined : 'true'"
      :role="label ? 'status' : undefined"
      :class="[badgeClasses, 'absolute', large ? 'start-[calc(100%-12px)] -top-0.5' : 'end-0 top-0']"
    >
      <template v-if="large">{{ text }}</template>
    </span>
  </span>
  <span
    v-else-if="!hidden"
    :aria-label="label"
    :role="label ? 'status' : undefined"
    :class="badgeClasses"
  >
    <template v-if="large">{{ text }}</template>
  </span>
</template>
