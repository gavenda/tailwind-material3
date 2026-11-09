<script setup lang="ts">
import { Carousel, type CarouselLayout } from '../../src'

const layouts: CarouselLayout[] = ['multi-browse', 'hero', 'uncontained']
const colors = [
  'from-primary-container to-tertiary-container',
  'from-secondary-container to-primary-container',
  'from-tertiary-container to-secondary-container',
  'from-primary to-tertiary',
  'from-secondary to-primary',
  'from-tertiary to-secondary',
  'from-primary-container to-secondary',
  'from-error-container to-tertiary-container',
]
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Carousels</h2>
    <div class="flex flex-col gap-8">
      <div v-for="layout in layouts" :key="layout" class="w-[560px]">
        <p class="mb-2 text-title-medium">{{ layout }}</p>
        <Carousel :layout="layout" :label="`${layout} carousel`">
          <div
            v-for="(c, i) in colors"
            :key="i"
            :class="['flex items-end bg-linear-to-br p-4 text-title-large text-on-surface', c]"
          >
            <span class="whitespace-nowrap">Item {{ i + 1 }}</span>
          </div>
        </Carousel>
      </div>
      <div class="w-72">
        <p class="mb-2 text-title-medium">full-screen</p>
        <div class="h-96 overflow-hidden rounded-2xl">
          <Carousel layout="full-screen" label="Full-screen carousel">
            <div v-for="(c, i) in colors.slice(0, 4)" :key="i" :class="['flex items-end bg-linear-to-br p-4 text-title-large', c]">
              Story {{ i + 1 }}
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  </section>
</template>
