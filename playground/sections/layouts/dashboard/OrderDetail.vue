<script setup lang="ts">
/**
 * The inside of the order sheet: who ordered what, how far along it is, and what you can do.
 */
import { ref } from 'vue'
import { Button, ButtonGroup, Chip, Divider, LinearProgressIndicator, List, ListItem, Tab, Tabs } from '../../../../src'
import Icon from '../../../Icon.vue'
import { icons } from '../../../icons'

export interface Order {
  id: string
  customer: string
  item: string
  total: number
  status: 'Paid' | 'Pending' | 'Refunded'
  date: string
  shipping: string
}

defineProps<{ order: Order; tone: string }>()
const emit = defineEmits<{ refund: []; print: [] }>()

const tab = ref('details')
const tags = ref(['Gift', 'Repeat customer'])
const history = ['Order placed', 'Payment confirmed', 'Packed', 'Out for delivery']
const progress = { Paid: 0.66, Pending: 0.25, Refunded: 1 }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <span class="inline-flex size-12 items-center justify-center rounded-full bg-primary-container text-title-medium text-on-primary-container">
        {{ order.customer[0] }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-title-medium">{{ order.customer }}</p>
        <p class="text-body-small text-on-surface-variant">{{ order.id }} · {{ order.date }}</p>
      </div>
      <span :class="['rounded-lg px-2 py-1 text-label-medium', tone]">{{ order.status }}</span>
    </div>

    <Tabs v-model="tab" label="Order sections">
      <Tab value="details">Details</Tab>
      <Tab value="history" :badge="history.length">History</Tab>
    </Tabs>

    <template v-if="tab === 'details'">
      <List>
        <ListItem supporting-text="Item"><template #icon><Icon :svg="icons.inventory" /></template>{{ order.item }}</ListItem>
        <ListItem supporting-text="Shipping"><template #icon><Icon :svg="icons.localShipping" /></template>{{ order.shipping }}</ListItem>
        <ListItem supporting-text="Total"><template #icon><Icon :svg="icons.payments" /></template>${{ order.total }}</ListItem>
      </List>

      <div>
        <p class="mb-2 text-label-large text-on-surface-variant">Fulfilment</p>
        <LinearProgressIndicator :progress="progress[order.status]" wavy />
      </div>

      <div class="flex flex-wrap gap-2">
        <Chip v-for="t in tags" :key="t" type="input" @remove="tags = tags.filter((x) => x !== t)">{{ t }}</Chip>
        <Chip type="assist"><template #icon><Icon :svg="icons.mail" /></template>Email customer</Chip>
        <Chip type="assist"><template #icon><Icon :svg="icons.call" /></template>Call</Chip>
      </div>
    </template>

    <List v-else segmented>
      <ListItem v-for="(h, i) in history" :key="h" class="bg-surface-container!" :supporting-text="i === 0 ? order.date : 'Automatic'">{{ h }}</ListItem>
    </List>

    <Divider inset="both" />

    <ButtonGroup class="justify-end" aria-label="Order actions">
      <Button variant="elevated" @click="emit('print')">Print</Button>
      <Button variant="filled" shape="square" :disabled="order.status === 'Refunded'" @click="emit('refund')">Refund</Button>
    </ButtonGroup>
  </div>
</template>
