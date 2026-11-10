<script setup lang="ts">
import { ref } from 'vue'
import { IconButton, TextField } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const name = ref('')
const email = ref('ana@')
const price = ref('')
const bio = ref('')
const search = ref('Material')
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Text fields</h2>
    <div v-for="variant in ['filled', 'outlined'] as const" :key="variant" class="mb-6 flex flex-wrap items-start gap-4">
      <TextField v-model="name" :variant="variant" label="Name" supporting-text="As on your ID" required />
      <TextField
        v-model="email"
        :variant="variant"
        label="Email"
        type="email"
        :error="!email.includes('.')"
        error-text="Enter a full address"
      >
        <template #icon><Icon :svg="icons.mail" /></template>
      </TextField>
      <TextField v-model="price" :variant="variant" label="Price" prefix="$" suffix="USD" inputmode="decimal" />
      <TextField v-model="search" :variant="variant" label="Search">
        <template #icon><Icon :svg="icons.search" /></template>
        <template #trailing-icon>
          <IconButton v-if="search" variant="standard" label="Clear" @click="search = ''"><Icon :svg="icons.close" /></IconButton>
        </template>
      </TextField>
      <TextField v-model="bio" :variant="variant" label="Bio" multiline :rows="3" counter maxlength="120" />
      <TextField :variant="variant" label="Disabled" model-value="Can't edit" disabled />
    </div>
  </section>
</template>
