<script setup lang="ts">
import { ref } from 'vue'
import { Tab, Tabs } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const primary = ref('flights')
const primaryIcons = ref('music')
const secondary = ref('overview')
const scroll = ref('t0')
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Tabs</h2>
    <div class="flex w-[480px] flex-col gap-6">
      <Tabs v-model="primary" label="Travel">
        <Tab value="flights">Flights</Tab>
        <Tab value="trips">Trips</Tab>
        <Tab value="explore" :badge="2">Explore</Tab>
      </Tabs>
      <Tabs v-model="primaryIcons" label="Media">
        <Tab value="music"><template #icon><Icon :svg="icons.musicNote" /></template>Music</Tab>
        <Tab value="photos" badge><template #icon><Icon :svg="icons.photo" /></template>Photos</Tab>
        <Tab value="calls"><template #icon><Icon :svg="icons.call" /></template>Calls</Tab>
      </Tabs>
      <Tabs v-model="secondary" variant="secondary" label="Details">
        <Tab value="overview">Overview</Tab>
        <Tab value="specs"><template #icon><Icon :svg="icons.info" /></template>Specifications</Tab>
        <Tab value="reviews" disabled>Reviews</Tab>
      </Tabs>
      <Tabs v-model="scroll" scrollable label="Many tabs">
        <Tab v-for="i in 10" :key="i" :value="`t${i - 1}`">Tab number {{ i }}</Tab>
      </Tabs>
    </div>
  </section>
</template>
