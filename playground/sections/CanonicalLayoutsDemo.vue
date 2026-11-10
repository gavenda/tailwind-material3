<script setup lang="ts">
/**
 * Full-window examples of the M3 canonical layouts, built from the library's components.
 * https://m3.material.io/foundations/layout/canonical-examples/overview
 * Each opens in a full-screen dialog, inside a frame you can set to any breakpoint's width.
 */
import { computed, ref, useTemplateRef, type Component } from 'vue'
import { Button, ButtonGroup, Dialog } from '../../src'
import FeedExample from './layouts/FeedExample.vue'
import ListDetailExample from './layouts/ListDetailExample.vue'
import SupportingPaneExample from './layouts/SupportingPaneExample.vue'
import { sizeClassOf, useWidth } from './layouts/sizeClass'

const examples: { id: string; title: string; summary: string; component: Component }[] = [
  {
    id: 'list-detail',
    title: 'List-detail',
    summary: 'A mail inbox: one pane up to medium, list and message side by side from expanded.',
    component: ListDetailExample,
  },
  {
    id: 'supporting-pane',
    title: 'Supporting pane',
    summary: 'A travel guide: related places below the article, or in a 360dp pane beside it.',
    component: SupportingPaneExample,
  },
  {
    id: 'feed',
    title: 'Feed',
    summary: 'A news feed: a grid of cards that grows from one column to five.',
    component: FeedExample,
  },
]

// Frame widths: a typical window in each breakpoint, or the whole dialog.
const presets = [
  { value: 'compact', label: 'Compact', width: 412 },
  { value: 'medium', label: 'Medium', width: 720 },
  { value: 'expanded', label: 'Expanded', width: 1024 },
  { value: 'large', label: 'Large', width: 1440 },
  { value: 'fill', label: 'Fill', width: undefined },
]

const open = ref(false)
const current = ref(examples[0])
const preset = ref<string>('fill')
const frameWidth = computed(() => presets.find((p) => p.value === preset.value)?.width)

const frame = useTemplateRef<HTMLElement>('frame')
const width = useWidth(frame)
const sizeClass = computed(() => sizeClassOf(width.value))
const sizeLabel = computed(() => sizeClass.value.replace('-', ' '))

function show(example: (typeof examples)[number]) {
  current.value = example
  open.value = true
}
</script>

<template>
  <section>
    <h2 class="mb-1 text-xl">Canonical layouts</h2>
    <p class="mb-4 max-w-2xl text-body-medium text-on-surface-variant">
      Full-window examples of the three M3 canonical layouts, built from these components. Each adapts across
      breakpoints; pick a width in the example's header, or resize the window.
    </p>
    <div class="flex flex-wrap gap-3">
      <Button v-for="e in examples" :key="e.id" variant="tonal" :title="e.summary" @click="show(e)">{{ e.title }}</Button>
    </div>

    <Dialog v-model:open="open" fullscreen close-label="Close example">
      <template #headline>{{ current.title }}</template>
      <template #actions>
        <ButtonGroup v-model="preset" variant="connected" selection="single" required size="xs" aria-label="Preview width">
          <Button v-for="p in presets" :key="p.value" :value="p.value" variant="tonal">{{ p.label }}</Button>
        </ButtonGroup>
      </template>

      <div class="flex h-[calc(100dvh-5.5rem)] flex-col gap-2">
        <p class="text-center text-label-large text-on-surface-variant">
          <span class="capitalize">{{ sizeLabel }}</span> · {{ Math.round(width) }}dp wide
        </p>
        <!--
          The frame stands in for the app window. Layout and paint containment make it the
          containing block for fixed-position parts (the modal rail's scrim) so they stay inside.
        -->
        <div
          ref="frame"
          :style="{ width: frameWidth ? `${frameWidth}px` : '100%' }"
          class="mx-auto min-h-0 max-w-full flex-1 overflow-hidden rounded-3xl outline outline-outline-variant [contain:layout_paint]"
        >
          <component :is="current.component" :key="current.id" :size-class="sizeClass" />
        </div>
      </div>
    </Dialog>
  </section>
</template>
