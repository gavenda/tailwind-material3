<script setup lang="ts">
/**
 * Material 3 Expressive list.
 * Spec: https://m3.material.io/components/lists/specs
 * Tokens: md.comp.list
 *
 * Holds ListItems. `segmented` gives the Expressive segmented layout: items on
 * surface, 2dp apart, inside a container with 16dp corners (put it on a
 * surface-container background so the gaps show).
 */
import { provide, reactive, toRef } from 'vue'
import { listKey } from './context'

const props = withDefaults(defineProps<{ segmented?: boolean }>(), { segmented: false })

provide(listKey, reactive({ segmented: toRef(props, 'segmented') }))
</script>

<template>
  <div
    role="list"
    :class="['flex flex-col', segmented && 'gap-0.5 overflow-hidden rounded-2xl']"
  >
    <slot />
  </div>
</template>
