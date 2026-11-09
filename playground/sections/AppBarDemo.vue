<script setup lang="ts">
import { ref } from 'vue'
import { AppBar, IconButton, type AppBarVariant } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const variants: AppBarVariant[] = ['small', 'medium-flexible', 'large-flexible']
const scrolled = ref<Record<string, boolean>>({})
function onScroll(variant: string, e: Event) {
  scrolled.value[variant] = (e.target as HTMLElement).scrollTop > 0
}
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">App bars</h2>
    <p class="mb-4 text-body-medium text-on-surface-variant">Scroll inside each frame to see the scrolled state.</p>
    <div class="flex flex-wrap gap-4">
      <div v-for="variant in variants" :key="variant" class="flex h-72 w-96 flex-col overflow-hidden rounded-2xl border border-outline-variant">
        <AppBar :variant="variant" :scrolled="scrolled[variant]">
          <template #leading>
            <IconButton variant="standard" label="Back"><Icon :svg="icons.arrowBack" /></IconButton>
          </template>
          {{ variant === 'small' ? 'Title' : variant === 'medium-flexible' ? 'Medium flexible' : 'Large flexible' }}
          <template v-if="variant !== 'small'" #subtitle>Subtitle</template>
          <template #trailing>
            <IconButton variant="standard" label="Favorite"><Icon :svg="icons.favorite" /></IconButton>
            <IconButton variant="standard" label="More"><Icon :svg="icons.moreVert" /></IconButton>
          </template>
        </AppBar>
        <div class="flex-1 overflow-y-auto px-4 text-body-medium" @scroll="onScroll(variant, $event)">
          <p v-for="i in 20" :key="i" class="py-2">Content row {{ i }}</p>
        </div>
      </div>
      <div class="w-96 overflow-hidden rounded-2xl border border-outline-variant">
        <AppBar centered>
          <template #leading>
            <IconButton variant="standard" label="Menu"><Icon :svg="icons.menu" /></IconButton>
          </template>
          Centered
          <template #trailing>
            <IconButton variant="standard" label="Account"><Icon :svg="icons.accountCircle" /></IconButton>
          </template>
        </AppBar>
      </div>
    </div>
  </section>
</template>
