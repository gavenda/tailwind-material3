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
 *   NavigationRailMenuButton is the menu button, with the spec's icon motion built in.
 *   Bind a FAB's `expanded` to it so it becomes an extended FAB as the rail expands.
 * - Default slot: NavigationItems; gets `{ expanded }`, e.g. to show extra destinations
 *   (and section headers) only in the expanded rail.
 * - Expanding animates per the spec's presentation: the rail widens (pushing the page, or
 *   floating over it when modal), indicators grow from 56dp pills to wrap icon and label,
 *   labels cross-fade from below the icons to beside them, and icons keep their place.
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
    toggle: () => toggle(),
  }),
)

function toggle() {
  expanded.value = !expanded.value
}

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
        // interpolate-size lets the width animate to max-content where supported. min-width
        // (the 220dp expanded minimum) and padding animate too, or they'd snap the width.
        'transition-[width,min-width,padding] duration-(--duration-spring-default-spatial) ease-spring-default-spatial [interpolate-size:allow-keywords] motion-reduce:transition-none',
        // 8dp leading padding either way. Items' indicators sit 12dp in from it (20dp from the
        // edge): centred in the collapsed 96dp rail, the spec's inset in the expanded one.
        // The 80dp narrow rail centres them 4dp in while collapsed. 16dp trailing padding when
        // expanded (md.comp.nav-rail.item.horizontal.full-width.trailing-space).
        expanded
          ? 'w-max min-w-55 max-w-90 ps-2 pe-4 [--rail-indicator-inset:0.75rem]'
          : [collapsedWidth, 'min-w-0 px-2', narrow ? '[--rail-indicator-inset:0.25rem]' : '[--rail-indicator-inset:0.75rem]'],
        floating ? 'absolute inset-y-0 start-0 z-50 rounded-e-2xl bg-surface-container shadow-elevation-2' : 'bg-surface',
      ]"
    >
      <!--
        Header: left-aligned at the indicators' inset in both states, so nothing in it moves when
        the rail expands. A 56dp FAB is centred in the collapsed rail from there, and grows to the
        right as it extends; NavigationRailMenuButton adds 8dp to centre its 40dp button too.
        Other content starts at the same edge.
      -->
      <div
        v-if="$slots.header"
        class="mb-10 flex flex-col items-start gap-1 ps-(--rail-indicator-inset) transition-[padding] duration-(--duration-spring-default-spatial) ease-spring-default-spatial motion-reduce:transition-none"
      >
        <slot name="header" :expanded="expanded" :toggle="toggle" />
      </div>
      <div :class="['flex w-full flex-col', expanded ? 'gap-0' : 'gap-1']">
        <slot :expanded="expanded" />
      </div>
    </nav>
  </div>
</template>
