<script setup lang="ts">
/**
 * Material 3 Expressive navigation bar.
 * Spec: https://m3.material.io/components/navigation-bar/specs
 * Tokens: md.comp.nav-bar, md.comp.nav-bar.item.{vertical,horizontal}
 *
 * A 64dp bar of 3–5 NavigationItems. `v-model` holds the active item's value.
 * `horizontal` puts icon and label side by side (for medium-width windows).
 * Place it yourself (e.g. `class="fixed inset-x-0 bottom-0"`).
 */
import { computed, provide, reactive } from 'vue'
import { navKey, type NavValue } from './context'

const props = withDefaults(defineProps<{ horizontal?: boolean; label?: string }>(), {
  horizontal: false,
  label: undefined,
})

const model = defineModel<NavValue>()

provide(
  navKey,
  reactive({
    layout: computed(() => (props.horizontal ? 'horizontal' : 'vertical')),
    container: 'bar' as const,
    expanded: false,
    isActive: (v: NavValue | undefined) => v !== undefined && v === model.value,
    select: (v: NavValue | undefined) => {
      if (v !== undefined) model.value = v
    },
  }),
)
</script>

<template>
  <nav :aria-label="label" class="flex h-16 w-full bg-surface-container">
    <slot />
  </nav>
</template>
