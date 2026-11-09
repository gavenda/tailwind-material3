<script setup lang="ts">
import { ref } from 'vue'
import { MenuItem, SplitButton, type ButtonSize, type SplitButtonVariant } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const variants: SplitButtonVariant[] = ['elevated', 'filled', 'tonal', 'outlined']
const sizes: ButtonSize[] = ['xs', 's', 'm', 'l', 'xl']
const last = ref('')
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Split buttons</h2>
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <SplitButton v-for="variant in variants" :key="variant" :variant="variant" @click="last = `${variant}: Send`">
        <template #icon><Icon :svg="icons.send" /></template>
        Send
        <template #menu>
          <MenuItem @click="last = 'Schedule send'"><template #icon><Icon :svg="icons.schedule" /></template>Schedule send</MenuItem>
          <MenuItem @click="last = 'Save draft'"><template #icon><Icon :svg="icons.drafts" /></template>Save draft</MenuItem>
        </template>
      </SplitButton>
      <span class="text-body-medium text-on-surface-variant">Last: {{ last || '—' }}</span>
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <SplitButton v-for="size in sizes" :key="size" :size="size" variant="tonal">
        {{ size.toUpperCase() }}
        <template #menu><MenuItem>Option</MenuItem></template>
      </SplitButton>
    </div>
  </section>
</template>
