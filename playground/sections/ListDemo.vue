<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox, List, ListItem, Switch } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const selected = ref('inbox')
const wifi = ref(true)
const done = ref(false)
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Lists</h2>
    <div class="flex flex-wrap items-start gap-6">
      <List class="w-80">
        <ListItem>Single line item</ListItem>
        <ListItem supporting-text="Supporting text">
          <template #leading-icon><Icon :svg="icons.person" /></template>
          Two line item
        </ListItem>
        <ListItem overline="Overline" supporting-text="Supporting text that is long enough to wrap onto a second line" trailing-text="100+">
          <template #leading>
            <span class="inline-flex size-10 items-center justify-center rounded-full bg-primary-container text-title-medium text-on-primary-container">A</span>
          </template>
          Three line item
        </ListItem>
        <ListItem as="label" interactive supporting-text="Mark as done">
          Checkbox item
          <template #trailing><Checkbox v-model="done" /></template>
        </ListItem>
        <ListItem disabled supporting-text="Can't be chosen">Disabled item</ListItem>
      </List>

      <div class="w-80 rounded-3xl bg-surface-container p-2">
        <List segmented>
          <ListItem
            v-for="item in [
              { id: 'inbox', label: 'Inbox', icon: icons.inbox, count: '24' },
              { id: 'drafts', label: 'Drafts', icon: icons.drafts, count: '3' },
              { id: 'archive', label: 'Archive', icon: icons.archive, count: '' },
            ]"
            :key="item.id"
            as="button"
            :selected="selected === item.id"
            :trailing-text="item.count"
            @click="selected = item.id"
          >
            <template #leading-icon><Icon :svg="item.icon" /></template>
            {{ item.label }}
          </ListItem>
          <ListItem as="label" interactive supporting-text="Segmented list item">
            Wi-Fi
            <template #trailing><Switch v-model="wifi" /></template>
          </ListItem>
        </List>
      </div>
    </div>
  </section>
</template>
