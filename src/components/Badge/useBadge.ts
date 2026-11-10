import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/** A `badge` prop: true for a small badge, a number or string for a large one. */
export type BadgeProp = boolean | number | string | undefined

/** Turns a `badge` prop into whether to show a Badge and the value to give it. */
export function useBadge(badge: MaybeRefOrGetter<BadgeProp>) {
  const hasBadge = computed(() => {
    const b = toValue(badge)
    return b !== undefined && b !== false
  })
  const badgeValue = computed(() => {
    const b = toValue(badge)
    return typeof b === 'boolean' ? undefined : b
  })
  return { hasBadge, badgeValue }
}
