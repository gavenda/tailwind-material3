<script setup lang="ts">
/**
 * A group of MenuItems: its own surface in a grouped Expressive menu, with an optional label.
 * Groups sit 2dp apart; the first and last groups get 16dp outer corners.
 */
import { inject, onBeforeUnmount, onMounted, useId } from 'vue'
import { groupClasses, menuKey, menuSurface } from './context'

defineProps<{ label?: string }>()

const menu = inject(menuKey, null)
const labelId = useId()

onMounted(() => menu?.addGroup())
onBeforeUnmount(() => menu?.removeGroup())
</script>

<template>
  <div
    role="group"
    :aria-labelledby="label ? labelId : undefined"
    :class="['flex flex-col', groupClasses, menuSurface[menu?.variant ?? 'standard']]"
  >
    <div
      v-if="label"
      :id="labelId"
      :class="[
        'flex h-8 items-center px-3 text-label-large',
        menu?.variant === 'vibrant' ? 'text-on-tertiary-container' : 'text-on-surface-variant',
      ]"
    >
      {{ label }}
    </div>
    <slot />
  </div>
</template>
