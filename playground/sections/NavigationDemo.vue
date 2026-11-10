<script setup lang="ts">
import { ref } from 'vue'
import { Fab, IconButton, NavigationBar, NavigationItem, NavigationRail, Switch } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const destinations = [
  { value: 'home', label: 'Home', icon: icons.home, active: icons.homeFill },
  { value: 'explore', label: 'Explore', icon: icons.explore, active: icons.exploreFill },
  { value: 'inbox', label: 'Inbox', icon: icons.inbox, active: icons.inboxFill, badge: 3 },
  { value: 'profile', label: 'Profile', icon: icons.person, active: icons.personFill, badge: true },
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
        <template #header="{ expanded: isExpanded, toggle }">
          <IconButton variant="standard" :label="isExpanded ? 'Collapse' : 'Expand'" @click="toggle">
            <Icon :svg="isExpanded ? icons.close : icons.menu" />
          </IconButton>
          <Fab color="tertiary-container" :expanded="isExpanded" lowered>
            <template #icon><Icon :svg="icons.edit" /></template>
            Compose
          </Fab>
        </template>
        <NavigationItem v-for="d in destinations" :key="d.value" :value="d.value" :label="d.label" :badge="d.badge">
          <template #icon><Icon :svg="d.icon" /></template>
          <template #active-icon><Icon :svg="d.active" /></template>
        </NavigationItem>
      </NavigationRail>
      <div class="flex-1 bg-surface-container-low p-6 text-body-large">Content: {{ rail }}</div>
    </div>
  </section>
</template>
