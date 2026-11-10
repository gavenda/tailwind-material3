<script setup lang="ts">
/**
 * Supporting pane canonical layout: a travel guide with related places.
 * https://m3.material.io/foundations/layout/canonical-examples/supporting-pane
 * - compact / medium: the supporting pane sits below the focus pane, flexible width.
 *   Compact also offers it in a bottom sheet, to keep the focus pane in view.
 * - expanded and up: a fixed 360dp supporting pane on the trailing side.
 */
import { computed, ref } from 'vue'
import { AppBar, BottomSheet, Button, Card, Chip, IconButton, List, ListItem } from '../../../src'
import Icon from '../../Icon.vue'
import { icons } from '../../icons'
import Scaffold from './Scaffold.vue'
import { atLeast, marginOf, type SizeClass } from './sizeClass'

const props = defineProps<{ sizeClass: SizeClass }>()

const destinations = [
  { value: 'explore', label: 'Explore', icon: icons.explore, activeIcon: icons.exploreFill },
  { value: 'saved', label: 'Saved', icon: icons.bookmark, activeIcon: icons.bookmarkFill },
  { value: 'trips', label: 'Trips', icon: icons.map },
  { value: 'profile', label: 'Profile', icon: icons.person, activeIcon: icons.personFill },
]
const destination = ref('explore')
const saved = ref(false)
const sheet = ref(false)

const beside = computed(() => atLeast(props.sizeClass, 'expanded'))
const margin = computed(() => marginOf(props.sizeClass))

const related = [
  { name: 'Fushimi Inari', note: 'Shrine · 25 min by train', tone: 'from-tertiary-container to-error-container' },
  { name: 'Arashiyama', note: 'Bamboo grove · 30 min', tone: 'from-secondary-container to-tertiary-container' },
  { name: 'Kiyomizu-dera', note: 'Temple · 15 min', tone: 'from-primary-container to-secondary-container' },
  { name: 'Nishiki Market', note: 'Food market · 10 min walk', tone: 'from-error-container to-primary-container' },
  { name: 'Philosopher’s Path', note: 'Walk · 20 min', tone: 'from-secondary-container to-primary-container' },
]
</script>

<template>
  <Scaffold v-model="destination" :size-class="sizeClass" :destinations="destinations">
    <div :class="['flex size-full', beside ? 'gap-6 px-6 pb-6' : 'flex-col']">
      <!-- Focus pane: the main content. Below expanded it also scrolls the supporting pane. -->
      <div :class="['flex min-h-0 min-w-0 flex-1 flex-col', !beside && 'overflow-y-auto']">
        <AppBar :class="!beside && 'sticky top-0 z-1'">
          <template #leading>
            <IconButton variant="standard" label="Back"><Icon :svg="icons.arrowBack" /></IconButton>
          </template>
          Kyoto in autumn
          <template #trailing>
            <IconButton v-model:selected="saved" toggle variant="standard" :label="saved ? 'Remove from saved' : 'Save'">
              <Icon :svg="saved ? icons.bookmarkFill : icons.bookmark" />
            </IconButton>
            <IconButton variant="standard" label="Share"><Icon :svg="icons.share" /></IconButton>
          </template>
        </AppBar>

        <article :class="['flex-1 pb-6', beside ? 'min-h-0 overflow-y-auto' : margin]">
          <div class="mb-6 aspect-video max-h-90 w-full rounded-[28px] bg-linear-to-br from-tertiary-container to-primary-container" />
          <h1 class="mb-2 text-headline-medium">Kyoto in autumn</h1>
          <p class="mb-4 text-body-medium text-on-surface-variant">Travel guide · 8 min read</p>
          <div class="mb-6 flex flex-wrap gap-2">
            <Chip><template #icon><Icon :svg="icons.calendarMonth" /></template>Nov – Dec</Chip>
            <Chip><template #icon><Icon :svg="icons.language" /></template>Japanese</Chip>
            <Chip><template #icon><Icon :svg="icons.star" /></template>4.8</Chip>
          </div>
          <div class="max-w-160 space-y-4 text-body-large">
            <p v-for="n in 5" :key="n">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maple leaves turn the temple gardens red and
              gold from mid-November. Arrive early to beat the crowds, and take the quieter northern paths in the
              afternoon light.
            </p>
          </div>
          <Button v-if="sizeClass === 'compact'" variant="tonal" class="mt-6" @click="sheet = true">
            <template #icon><Icon :svg="icons.map" /></template>
            Nearby places
          </Button>
        </article>

        <!-- Supporting pane below the focus pane (compact, medium) -->
        <aside v-if="!beside" :class="['pb-24', margin]" aria-label="Nearby">
          <h2 class="mb-2 text-title-medium">Nearby</h2>
          <List>
            <ListItem v-for="p in related" :key="p.name" as="button" :supporting-text="p.note">
              <template #leading><span :class="['size-14 rounded-xl bg-linear-to-br', p.tone]" /></template>
              {{ p.name }}
            </ListItem>
          </List>
        </aside>
      </div>

      <!-- Supporting pane beside the focus pane (expanded and up): fixed 360dp -->
      <aside v-if="beside" class="mt-4 flex w-90 shrink-0 flex-col overflow-hidden rounded-[28px] bg-surface-container-low" aria-label="Nearby">
        <h2 class="px-6 pt-6 pb-2 text-title-medium">Nearby</h2>
        <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <Card variant="filled" class="mx-2 mb-4 bg-surface-container-highest!">
            <div class="mb-3 h-32 rounded-xl bg-linear-to-br from-secondary-container to-tertiary-container" />
            <p class="text-title-small">Map of the area</p>
            <p class="text-body-small text-on-surface-variant">5 places within 30 minutes</p>
          </Card>
          <List>
            <ListItem v-for="p in related" :key="p.name" as="button" :supporting-text="p.note">
              <template #leading><span :class="['size-14 rounded-xl bg-linear-to-br', p.tone]" /></template>
              {{ p.name }}
            </ListItem>
          </List>
        </div>
      </aside>
    </div>

    <!-- Compact: the supporting content in a bottom sheet -->
    <BottomSheet v-model:open="sheet" label="Nearby places">
      <h2 class="mb-2 text-title-medium">Nearby</h2>
      <List>
        <ListItem v-for="p in related" :key="p.name" as="button" :supporting-text="p.note" @click="sheet = false">
          <template #leading><span :class="['size-14 rounded-xl bg-linear-to-br', p.tone]" /></template>
          {{ p.name }}
        </ListItem>
      </List>
    </BottomSheet>
  </Scaffold>
</template>
