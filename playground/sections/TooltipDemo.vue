<script setup lang="ts">
import { Button, IconButton, Tooltip } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Tooltips</h2>
    <div class="flex flex-wrap items-center gap-6">
      <Tooltip text="Add to favorites">
        <IconButton variant="standard" label="Favorite"><Icon :svg="icons.favorite" /></IconButton>
      </Tooltip>
      <Tooltip text="Share" placement="bottom">
        <IconButton variant="tonal" label="Share"><Icon :svg="icons.share" /></IconButton>
      </Tooltip>
      <Tooltip variant="rich">
        <template #subhead>Rich tooltip</template>
        <template #content>Rich tooltips explain a feature in more detail. Hover me to keep me open.</template>
        <Button variant="tonal">Hover for rich tooltip</Button>
      </Tooltip>
      <Tooltip variant="rich" persistent>
        <template #subhead>Persistent</template>
        <template #content>Opens on click and stays until you dismiss it or click elsewhere.</template>
        <template #actions="{ close }">
          <Button variant="text" @click="close">Got it</Button>
          <Button variant="text">Learn more</Button>
        </template>
        <Button variant="outlined">Click for persistent tooltip</Button>
      </Tooltip>
    </div>
  </section>
</template>
