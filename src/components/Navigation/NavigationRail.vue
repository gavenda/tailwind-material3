<script setup lang="ts">
/**
 * Material 3 Expressive navigation rail, collapsed or expanded.
 * Spec: https://m3.material.io/components/navigation-rail/specs
 * Tokens: md.comp.nav-rail, md.comp.nav-rail.{collapsed,expanded}, md.comp.nav-rail.item
 *
 * The expanded rail replaces the (deprecated) navigation drawer.
 * - `v-model` holds the active NavigationItem's value; `v-model:expanded` switches
 *   between the 96dp collapsed rail and the 220–360dp expanded one.
 * - `header` slot: menu button and/or FAB above the items; gets `{ expanded, toggle }`.
 * - `modal`: the expanded rail floats over the content (surface-container, 16dp corners,
 *   elevation 2, with a scrim) instead of pushing it. Escape or the scrim collapses it.
 */
import { computed, provide, reactive } from 'vue'
import { navKey, type NavValue } from './context'

const props = withDefaults(
  defineProps<{
    modal?: boolean
    /** 80dp collapsed width instead of 96dp. */
    narrow?: boolean
    label?: string
  }>(),
  {
    modal: false,
    narrow: false,
    label: undefined,
  },
)

const model = defineModel<NavValue>()
const expanded = defineModel<boolean>('expanded', { default: false })

provide(
  navKey,
  reactive({
    layout: computed(() => (expanded.value ? 'horizontal' : 'vertical')),
    container: 'rail' as const,
    expanded: computed(() => expanded.value),
    isActive: (v: NavValue | undefined) => v !== undefined && v === model.value,
    select: (v: NavValue | undefined) => {
      if (v !== undefined) model.value = v
      if (props.modal) expanded.value = false
    },
  }),
)

const toggle = () => (expanded.value = !expanded.value)
const floating = computed(() => props.modal && expanded.value)
const collapsedWidth = computed(() => (props.narrow ? 'w-20' : 'w-24'))
</script>

<template>
  <!-- In modal mode the rail keeps its collapsed width in the layout and floats when expanded. -->
  <div :class="['relative h-full shrink-0', modal ? collapsedWidth : 'w-fit']" @keydown.esc="floating && toggle()">
    <div v-if="floating" class="fixed inset-0 z-40 bg-scrim/32" @click="toggle" />
    <nav
      :aria-label="label"
      :class="[
        'flex h-full flex-col overflow-hidden pt-11',
        // interpolate-size lets the width animate to max-content where supported.
        'transition-[width] duration-(--duration-spring-default-spatial) ease-spring-default-spatial [interpolate-size:allow-keywords] motion-reduce:transition-none',
        expanded ? 'w-max min-w-55 max-w-90 ps-3 pe-5' : [collapsedWidth, 'items-center px-2'],
        floating ? 'absolute inset-y-0 start-0 z-50 rounded-e-2xl bg-surface-container shadow-elevation-2' : 'bg-surface',
      ]"
    >
      <div v-if="$slots.header" :class="['mb-10 flex flex-col gap-1', expanded ? 'items-start ps-1' : 'items-center']">
        <slot name="header" :expanded="expanded" :toggle="toggle" />
      </div>
      <div :class="['flex flex-col', expanded ? 'gap-0' : 'gap-1', !expanded && 'w-full']">
        <slot />
      </div>
    </nav>
  </div>
</template>
