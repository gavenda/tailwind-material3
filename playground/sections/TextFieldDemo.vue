<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { IconButton, Menu, MenuItem, TextField } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const name = ref('')
const email = ref('ana@')
const price = ref('')
const bio = ref('')
const search = ref('Material')

// Combo boxes: a text field that anchors a menu. Typing filters the options, picking one fills the field.
const allFruits = [
  'Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry', 'Cherry', 'Coconut', 'Cranberry', 'Date',
  'Fig', 'Grape', 'Grapefruit', 'Guava', 'Kiwi', 'Lemon', 'Lime', 'Lychee', 'Mango', 'Melon', 'Nectarine', 'Orange',
  'Papaya', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Raspberry', 'Strawberry', 'Watermelon',
]
const combos = [
  { id: 'filled', variant: 'filled', options: allFruits.slice(0, 8), maxHeight: undefined, hint: 'Type to filter, or pick from the list' },
  { id: 'outlined', variant: 'outlined', options: allFruits.slice(0, 8), maxHeight: undefined, hint: 'Type to filter, or pick from the list' },
  { id: 'scroll', variant: 'outlined', options: allFruits, maxHeight: 240, hint: 'Long list, menu capped at 240dp' },
] as const
const values = ref<Record<string, string>>({ filled: '', outlined: '', scroll: '' })
const comboOpen = ref<Record<string, boolean>>({})
const comboFields = useTemplateRef<{ focus: () => void }[]>('comboField')

function matches(c: (typeof combos)[number]) {
  const q = values.value[c.id].trim().toLowerCase()
  return q ? c.options.filter((f) => f.toLowerCase().includes(q)) : c.options
}

function onComboInput(id: string, index: number) {
  if (comboOpen.value[id]) return
  comboOpen.value[id] = true
  // The menu moves focus to its first item when it opens; keep typing in the field.
  setTimeout(() => comboFields.value?.[index]?.focus(), 0)
}
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

    <h3 class="mb-3 text-title-medium">Combo box</h3>
    <div class="flex flex-wrap items-start gap-4">
      <Menu
        v-for="(c, i) in combos"
        :key="c.id"
        v-model:open="comboOpen[c.id]"
        match-width
        :max-height="c.maxHeight"
        label="Fruit"
      >
        <template #anchor="{ toggle, props: anchor }">
          <TextField
            ref="comboField"
            v-model="values[c.id]"
            :variant="c.variant"
            label="Fruit"
            :supporting-text="c.hint"
            autocomplete="off"
            role="combobox"
            v-bind="anchor"
            @input="onComboInput(c.id, i)"
          >
            <template #trailing-icon>
              <IconButton variant="standard" label="Show options" tabindex="-1" @click="toggle">
                <Icon :svg="comboOpen[c.id] ? icons.keyboardArrowUp : icons.keyboardArrowDown" />
              </IconButton>
            </template>
          </TextField>
        </template>
        <MenuItem v-for="f in matches(c)" :key="f" :selected="f === values[c.id]" @click="values[c.id] = f">{{ f }}</MenuItem>
        <MenuItem v-if="!matches(c).length" disabled>No matches</MenuItem>
      </Menu>
    </div>
  </section>
</template>
