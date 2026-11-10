<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppBar, IconButton, List, ListItem, Search } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const fruits = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pear']
const query = ref('')
const query2 = ref('')
const picked = ref('')
const matches = (q: string) => fruits.filter((f) => f.toLowerCase().includes(q.toLowerCase()))
const results = computed(() => matches(query.value))
const results2 = computed(() => matches(query2.value))
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Search</h2>
    <div class="mb-6 w-[520px] overflow-hidden rounded-2xl border border-outline-variant">
      <AppBar variant="search">
        <template #leading>
          <IconButton variant="standard" label="Menu"><Icon :svg="icons.menu" /></IconButton>
        </template>
        <template #search>
          <Search v-model="query" placeholder="Search fruit">
            <template #trailing>
              <IconButton variant="standard" label="Voice search"><Icon :svg="icons.mic" /></IconButton>
            </template>
            <template #default="{ close }">
              <List>
                <ListItem v-for="f in results" :key="f" as="button" @click="(picked = f), (query = f), close()">
                  <template #icon><Icon :svg="icons.search" /></template>
                  {{ f }}
                </ListItem>
                <ListItem v-if="!results.length">No results</ListItem>
              </List>
            </template>
          </Search>
        </template>
        <template #trailing>
          <IconButton variant="standard" label="Account"><Icon :svg="icons.accountCircle" /></IconButton>
        </template>
      </AppBar>
    </div>
    <div class="flex items-center gap-6">
      <div class="w-80">
        <Search v-model="query2" view="fullscreen" placeholder="Full-screen search">
          <template #default="{ close }">
            <List>
              <ListItem v-for="f in results2" :key="f" as="button" @click="(picked = f), close()">{{ f }}</ListItem>
            </List>
          </template>
        </Search>
      </div>
      <span class="text-body-medium text-on-surface-variant">Picked: {{ picked || '—' }}</span>
    </div>
  </section>
</template>
