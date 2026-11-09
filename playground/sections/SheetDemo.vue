<script setup lang="ts">
import { ref } from 'vue'
import { BottomSheet, Button, List, ListItem, SideSheet, Switch } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const bottom = ref(false)
const bottomStandard = ref(false)
const side = ref(false)
const sideDetached = ref(false)
const sideStandard = ref(true)
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Sheets</h2>
    <div class="mb-6 flex flex-wrap gap-4">
      <Button variant="tonal" @click="bottom = true">Modal bottom sheet</Button>
      <Button variant="tonal" @click="bottomStandard = !bottomStandard">Standard bottom sheet</Button>
      <Button variant="tonal" @click="side = true">Modal side sheet</Button>
      <Button variant="tonal" @click="sideDetached = true">Detached side sheet</Button>
      <label class="flex items-center gap-3 text-body-medium"><Switch v-model="sideStandard" /> Standard side sheet</label>
    </div>

    <div class="flex h-72 overflow-hidden rounded-2xl border border-outline-variant">
      <div class="flex-1 bg-surface-container-low p-6 text-body-large">Page content</div>
      <SideSheet v-model:open="sideStandard" :modal="false">
        <template #headline>Filters</template>
        <p>Standard side sheets sit beside the content.</p>
        <template #actions>
          <Button>Apply</Button>
          <Button variant="outlined" @click="sideStandard = false">Cancel</Button>
        </template>
      </SideSheet>
    </div>

    <BottomSheet v-model:open="bottom" label="Share">
      <List>
        <ListItem v-for="item in [
          { label: 'Share', icon: icons.share },
          { label: 'Get link', icon: icons.link },
          { label: 'Edit name', icon: icons.edit },
          { label: 'Delete', icon: icons.deleteIcon },
        ]" :key="item.label" as="button" @click="bottom = false">
          <template #leading-icon><Icon :svg="item.icon" /></template>
          {{ item.label }}
        </ListItem>
      </List>
    </BottomSheet>
    <BottomSheet v-model:open="bottomStandard" :modal="false" label="Now playing">
      <p class="text-body-large">A standard sheet: the page stays usable behind it. Drag the handle down to close.</p>
    </BottomSheet>

    <SideSheet v-model:open="side" show-back @back="side = false">
      <template #headline>Title</template>
      <p>Modal side sheets cover the content with a scrim.</p>
      <template #actions>
        <Button @click="side = false">Save</Button>
        <Button variant="outlined" @click="side = false">Cancel</Button>
      </template>
    </SideSheet>
    <SideSheet v-model:open="sideDetached" detached>
      <template #headline>Detached</template>
      <p>Detached sheets float with all corners rounded.</p>
    </SideSheet>
  </section>
</template>
