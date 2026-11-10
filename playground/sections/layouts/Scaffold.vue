<script setup lang="ts">
/**
 * Layout scaffold shared by the canonical layout examples: picks the navigation
 * for the window size and leaves the rest of the window to the panes.
 * - compact: navigation bar at the bottom, FAB above it.
 * - medium / expanded: collapsed rail; the menu button expands it as a modal rail.
 * - large / extra-large: expanded rail in the layout, with an extended FAB.
 * https://m3.material.io/foundations/layout/applying-layout/window-size-classes
 */
import { computed, ref, watch } from 'vue'
import { Fab, NavigationBar, NavigationItem, NavigationRail, NavigationRailMenuButton } from '../../../src'
import Icon from '../../Icon.vue'
import { icons } from '../../icons'
import { atLeast, type SizeClass } from './sizeClass'

export interface Destination {
  value: string
  label: string
  icon: string
  activeIcon?: string
  badge?: number | boolean
}

const props = defineProps<{
  sizeClass: SizeClass
  destinations: Destination[]
  fab?: { label: string; icon: string }
}>()
const destination = defineModel<string>({ required: true })

const compact = computed(() => props.sizeClass === 'compact')
const roomy = computed(() => atLeast(props.sizeClass, 'large'))

// The rail starts expanded where there's room, and collapsed otherwise.
const expanded = ref(roomy.value)
watch(roomy, (v) => (expanded.value = v))
</script>

<template>
  <div :class="['flex size-full bg-surface text-on-surface', compact ? 'flex-col' : 'flex-row']">
    <NavigationRail
      v-if="!compact"
      v-model="destination"
      v-model:expanded="expanded"
      :modal="!roomy"
      label="Main"
    >
      <template #header="{ expanded: isExpanded }">
        <NavigationRailMenuButton />
        <Fab v-if="fab" color="tertiary-container" :label="fab.label" :expanded="isExpanded" lowered>
          <template #icon><Icon :svg="fab.icon" /></template>
          {{ fab.label }}
        </Fab>
      </template>
      <NavigationItem v-for="d in destinations" :key="d.value" :value="d.value" :label="d.label" :badge="d.badge">
        <template #icon><Icon :svg="d.icon" /></template>
        <template v-if="d.activeIcon" #active-icon><Icon :svg="d.activeIcon" /></template>
      </NavigationItem>
    </NavigationRail>

    <div class="relative min-h-0 min-w-0 flex-1">
      <slot />
      <!-- Compact: the FAB floats 16dp above the navigation bar -->
      <div v-if="compact && fab" class="absolute end-4 bottom-4">
        <Fab color="tertiary-container" size="medium" :label="fab.label">
          <template #icon><Icon :svg="fab.icon" /></template>
        </Fab>
      </div>
    </div>

    <NavigationBar v-if="compact" v-model="destination" label="Main">
      <NavigationItem v-for="d in destinations" :key="d.value" :value="d.value" :label="d.label" :badge="d.badge">
        <template #icon><Icon :svg="d.icon" /></template>
        <template v-if="d.activeIcon" #active-icon><Icon :svg="d.activeIcon" /></template>
      </NavigationItem>
    </NavigationBar>
  </div>
</template>
