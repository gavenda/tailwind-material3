<script setup lang="ts">
import { ref } from 'vue'
import { Button, IconButton, Menu, MenuGroup, MenuItem } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const basic = ref(false)
const grouped = ref(false)
const vibrant = ref(false)
const showHidden = ref(true)
const sort = ref('name')
const last = ref('')
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Menus</h2>
    <div class="flex flex-wrap items-center gap-6">
      <Menu v-model:open="basic" label="Edit">
        <template #anchor="{ toggle, props }">
          <Button variant="tonal" v-bind="props" @click="toggle">
            Standard
            <template #icon><Icon :svg="icons.keyboardArrowDown" /></template>
          </Button>
        </template>
        <MenuItem trailing-text="⌘X" @click="last = 'Cut'">
          <template #icon><Icon :svg="icons.contentCut" /></template>
          Cut
        </MenuItem>
        <MenuItem trailing-text="⌘C" @click="last = 'Copy'">
          <template #icon><Icon :svg="icons.contentCopy" /></template>
          Copy
        </MenuItem>
        <MenuItem trailing-text="⌘V" disabled>
          <template #icon><Icon :svg="icons.contentPaste" /></template>
          Paste
        </MenuItem>
        <MenuItem :selected="showHidden" keep-open @click="showHidden = !showHidden">
          <template #icon><Icon :svg="showHidden ? icons.visibility : icons.visibilityOff" /></template>
          Show hidden
        </MenuItem>
      </Menu>

      <Menu v-model:open="grouped" label="Sort and share">
        <template #anchor="{ toggle, props }">
          <IconButton variant="standard" label="More options" v-bind="props" @click="toggle">
            <Icon :svg="icons.moreVert" />
          </IconButton>
        </template>
        <MenuGroup label="Sort by">
          <MenuItem
            v-for="s in ['name', 'date', 'size']"
            :key="s"
            :selected="sort === s"
            @click="sort = s"
          >
            <template v-if="sort === s" #icon><Icon :svg="icons.check" /></template>
            {{ s[0].toUpperCase() + s.slice(1) }}
          </MenuItem>
        </MenuGroup>
        <MenuGroup>
          <MenuItem supporting-text="Send a link to this file" @click="last = 'Share'">
            <template #icon><Icon :svg="icons.share" /></template>
            Share
          </MenuItem>
          <MenuItem @click="last = 'Download'">
            <template #icon><Icon :svg="icons.download" /></template>
            Download
          </MenuItem>
        </MenuGroup>
      </Menu>

      <Menu v-model:open="vibrant" variant="vibrant" label="Account">
        <template #anchor="{ toggle, props }">
          <Button variant="outlined" v-bind="props" @click="toggle">Vibrant</Button>
        </template>
        <MenuItem>
          <template #icon><Icon :svg="icons.accountCircle" /></template>
          Profile
        </MenuItem>
        <MenuItem :selected="true">
          <template #icon><Icon :svg="icons.settings" /></template>
          Settings
        </MenuItem>
        <MenuItem>
          <template #icon><Icon :svg="icons.logout" /></template>
          Sign out
        </MenuItem>
      </Menu>

      <span class="text-body-medium text-on-surface-variant">Last action: {{ last || '—' }} · sort: {{ sort }}</span>
    </div>
  </section>
</template>
