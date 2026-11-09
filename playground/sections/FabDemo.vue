<script setup lang="ts">
import { ref } from 'vue'
import { Fab, FabMenu, FabMenuItem, Switch, type FabColor, type FabSize } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const sizes: FabSize[] = ['small', 'medium', 'large']
const colors: FabColor[] = ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary']
const expanded = ref(true)
const menuOpen = ref(false)
const last = ref('')
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">FABs</h2>
    <div class="mb-6 flex flex-wrap items-end gap-4">
      <Fab v-for="size in sizes" :key="size" :size="size" :aria-label="`Edit (${size})`">
        <template #icon><Icon :svg="icons.edit" /></template>
      </Fab>
    </div>
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <Fab v-for="color in colors" :key="color" :color="color" :aria-label="color">
        <template #icon><Icon :svg="icons.add" /></template>
      </Fab>
      <Fab lowered aria-label="Lowered"><template #icon><Icon :svg="icons.add" /></template></Fab>
      <Fab disabled aria-label="Disabled"><template #icon><Icon :svg="icons.add" /></template></Fab>
    </div>

    <h3 class="mb-3 text-title-medium">Extended</h3>
    <label class="mb-4 flex items-center gap-3 text-body-medium"><Switch v-model="expanded" /> Expanded</label>
    <div class="mb-6 flex flex-wrap items-end gap-4">
      <Fab v-for="size in sizes" :key="size" :size="size" label="Compose" :expanded="expanded" color="tertiary-container">
        <template #icon><Icon :svg="icons.edit" /></template>
      </Fab>
    </div>

    <h3 class="mb-3 text-title-medium">FAB menu</h3>
    <div class="flex h-80 items-end justify-end gap-6 rounded-3xl bg-surface-container-low p-4">
      <span class="me-auto text-body-medium text-on-surface-variant">Last: {{ last || '—' }}</span>
      <FabMenu v-model:open="menuOpen" label="Create" color="primary">
        <template #icon><Icon :svg="icons.add" /></template>
        <FabMenuItem @click="last = 'Photo'"><template #icon><Icon :svg="icons.addAPhoto" /></template>Photo</FabMenuItem>
        <FabMenuItem @click="last = 'Note'"><template #icon><Icon :svg="icons.edit" /></template>Note</FabMenuItem>
        <FabMenuItem @click="last = 'Link'"><template #icon><Icon :svg="icons.link" /></template>Link</FabMenuItem>
      </FabMenu>
      <FabMenu label="Share" color="tertiary" size="medium">
        <template #icon><Icon :svg="icons.share" /></template>
        <FabMenuItem @click="last = 'Mail'"><template #icon><Icon :svg="icons.mail" /></template>Mail</FabMenuItem>
        <FabMenuItem @click="last = 'Call'"><template #icon><Icon :svg="icons.call" /></template>Call</FabMenuItem>
      </FabMenu>
    </div>
  </section>
</template>
