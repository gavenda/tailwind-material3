<script setup lang="ts">
import { ref } from 'vue'
import { Fab, NavigationBar, NavigationItem, NavigationRail, NavigationRailMenuButton, Switch } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const destinations = [
  { value: 'home', label: 'Home', icon: icons.home, active: icons.homeFill },
  { value: 'explore', label: 'Explore', icon: icons.explore, active: icons.exploreFill },
  { value: 'inbox', label: 'Inbox', icon: icons.inbox, active: icons.inboxFill, badge: 3 },
  { value: 'profile', label: 'Profile', icon: icons.person, active: icons.personFill, badge: true },
]
const extras = [
  { value: 'work', label: 'Work', icon: icons.label },
  { value: 'travel', label: 'Travel', icon: icons.label },
]
const bar = ref('home')
const barH = ref('explore')
const rail = ref('home')
const expanded = ref(false)
const modal = ref(false)
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Navigation bar</h2>
    <div class="mb-4 w-[420px] overflow-hidden rounded-2xl">
      <NavigationBar v-model="bar" label="Main">
        <NavigationItem v-for="d in destinations" :key="d.value" :value="d.value" :label="d.label" :badge="d.badge">
          <template #icon><Icon :svg="d.icon" /></template>
          <template #active-icon><Icon :svg="d.active" /></template>
        </NavigationItem>
      </NavigationBar>
    </div>
    <div class="mb-10 w-[640px] overflow-hidden rounded-2xl">
      <NavigationBar v-model="barH" horizontal label="Main (horizontal)">
        <NavigationItem v-for="d in destinations" :key="d.value" :value="d.value" :label="d.label">
          <template #icon><Icon :svg="d.icon" /></template>
          <template #active-icon><Icon :svg="d.active" /></template>
        </NavigationItem>
      </NavigationBar>
    </div>

    <h2 class="mb-4 text-xl">Navigation rail</h2>
    <label class="mb-4 flex items-center gap-3 text-body-medium"><Switch v-model="modal" /> Modal when expanded</label>
    <div class="flex h-[520px] overflow-hidden rounded-2xl border border-outline-variant">
      <NavigationRail v-model="rail" v-model:expanded="expanded" :modal="modal" label="Sections">
        <template #header="{ expanded: isExpanded }">
          <NavigationRailMenuButton />
          <Fab color="tertiary-container" :expanded="isExpanded" lowered>
            <template #icon><Icon :svg="icons.edit" /></template>
            Compose
          </Fab>
        </template>
        <template #default="{ expanded: isExpanded }">
          <NavigationItem v-for="d in destinations" :key="d.value" :value="d.value" :label="d.label" :badge="d.badge">
            <template #icon><Icon :svg="d.icon" /></template>
            <template #active-icon><Icon :svg="d.active" /></template>
          </NavigationItem>
          <!-- Extra destinations, only in the expanded rail; a section header sits 12dp above and 8dp below -->
          <Transition
            enter-from-class="opacity-0"
            enter-active-class="transition-opacity duration-(--duration-effects-default) delay-100"
            leave-active-class="transition-opacity duration-(--duration-effects-fast)"
            leave-to-class="opacity-0"
          >
            <div v-if="isExpanded" class="flex flex-col">
              <p class="ps-3 pt-3 pb-2 text-title-small text-on-surface-variant">Labels</p>
              <NavigationItem v-for="d in extras" :key="d.value" :value="d.value" :label="d.label">
                <template #icon><Icon :svg="d.icon" /></template>
              </NavigationItem>
            </div>
          </Transition>
        </template>
      </NavigationRail>
      <div class="flex-1 bg-surface-container-low p-6 text-body-large">Content: {{ rail }}</div>
    </div>
  </section>
</template>
