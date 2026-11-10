<script setup lang="ts">
/**
 * Feed canonical layout: a news feed of cards in a grid.
 * https://m3.material.io/foundations/layout/canonical-examples/feed
 * - compact: one column of full-width cards.
 * - medium: two columns; the featured story spans both.
 * - expanded / large / extra-large: three, four and five columns.
 * Cards sit 8dp apart and reflow when the window changes size.
 */
import { computed, ref } from 'vue'
import { AppBar, Card, Chip, IconButton } from '../../../src'
import Icon from '../../Icon.vue'
import { icons } from '../../icons'
import Scaffold from './Scaffold.vue'
import { marginOf, type SizeClass } from './sizeClass'

const props = defineProps<{ sizeClass: SizeClass }>()

const destinations = [
  { value: 'home', label: 'For you', icon: icons.home, activeIcon: icons.homeFill },
  { value: 'explore', label: 'Explore', icon: icons.explore, activeIcon: icons.exploreFill },
  { value: 'saved', label: 'Saved', icon: icons.bookmark, activeIcon: icons.bookmarkFill },
  { value: 'alerts', label: 'Alerts', icon: icons.notifications, activeIcon: icons.notificationsFill, badge: true },
]
const destination = ref('home')

const topics = ['Science', 'Design', 'Travel', 'Food', 'Music', 'Sports']
const picked = ref<Record<string, boolean>>({ Design: true })

const columns = computed(
  () =>
    ({ compact: 'grid-cols-1', medium: 'grid-cols-2', expanded: 'grid-cols-3', large: 'grid-cols-4', 'extra-large': 'grid-cols-5' })[
      props.sizeClass
    ],
)
const margin = computed(() => marginOf(props.sizeClass))

const tones = [
  'from-primary-container to-tertiary-container',
  'from-secondary-container to-primary-container',
  'from-tertiary-container to-secondary-container',
  'from-error-container to-tertiary-container',
  'from-primary-container to-secondary-container',
]
const stories = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  topic: topics[i % topics.length],
  title: [
    'The quiet comeback of the tram',
    'Inside a seed vault in the Arctic',
    'Why your bread needs a longer rest',
    'Designing for one hand',
    'A week of night trains across Europe',
    'The physics of a perfect skimming stone',
  ][i % 6],
  minutes: 3 + (i % 7),
  tone: tones[i % tones.length],
}))
</script>

<template>
  <Scaffold v-model="destination" :size-class="sizeClass" :destinations="destinations">
    <div class="flex size-full flex-col overflow-y-auto">
      <AppBar class="sticky top-0 z-1">
        For you
        <template #trailing>
          <IconButton variant="standard" label="Search"><Icon :svg="icons.search" /></IconButton>
          <IconButton variant="standard" label="Account"><Icon :svg="icons.accountCircle" /></IconButton>
        </template>
      </AppBar>

      <div :class="['pb-24', margin]">
        <!-- Topic filters -->
        <div class="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
          <Chip v-for="t in topics" :key="t" v-model:selected="picked[t]" type="filter">{{ t }}</Chip>
        </div>

        <div :class="['grid gap-2', columns]">
          <Card
            v-for="(s, i) in stories"
            :key="s.id"
            as="a"
            href="#"
            interactive
            :variant="i === 0 ? 'filled' : 'outlined'"
            :padded="false"
            :class="['flex flex-col', i === 0 && sizeClass !== 'compact' && 'col-span-2']"
            @click.prevent
          >
            <div :class="['bg-linear-to-br', s.tone, i === 0 ? 'aspect-video' : 'aspect-4/3']" />
            <div class="flex flex-1 flex-col gap-1 p-4">
              <p class="text-label-medium text-primary">{{ s.topic }}</p>
              <p :class="i === 0 ? 'text-headline-small' : 'text-title-medium'">{{ s.title }}</p>
              <p class="mt-auto pt-2 text-body-small text-on-surface-variant">{{ s.minutes }} min read</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </Scaffold>
</template>
