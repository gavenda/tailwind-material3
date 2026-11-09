<script setup lang="ts">
import { ref } from 'vue'
import { Button, DateField, DatePicker, TimePicker } from '../../src'

const date = ref<Date | null>(new Date())
const dateOpen = ref(false)
const start = ref<Date | null>(null)
const end = ref<Date | null>(null)
const rangeOpen = ref(false)
const docked = ref<Date | null>(null)
const time = ref<string | null>('09:30')
const timeOpen = ref(false)
const time24 = ref<string | null>('18:45')
const time24Open = ref(false)
const fmt = (d: Date | null) => (d ? d.toLocaleDateString() : '—')
const minDate = new Date(new Date().getFullYear(), 0, 1)
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Date pickers</h2>
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <Button variant="tonal" @click="dateOpen = true">Pick a date</Button>
      <span class="text-body-medium">{{ fmt(date) }}</span>
      <Button variant="tonal" @click="rangeOpen = true">Pick a range</Button>
      <span class="text-body-medium">{{ fmt(start) }} – {{ fmt(end) }}</span>
    </div>
    <div class="mb-10 flex items-start gap-4">
      <DateField v-model="docked" label="Departure" :min="minDate" />
      <span class="pt-4 text-body-medium">Docked value: {{ fmt(docked) }}</span>
    </div>
    <DatePicker v-model="date" v-model:open="dateOpen" />
    <DatePicker v-model:start="start" v-model:end="end" v-model:open="rangeOpen" range />

    <h2 class="mb-4 text-xl">Time pickers</h2>
    <div class="flex flex-wrap items-center gap-4">
      <Button variant="tonal" @click="timeOpen = true">12-hour</Button>
      <span class="text-body-medium">{{ time ?? '—' }}</span>
      <Button variant="tonal" @click="time24Open = true">24-hour</Button>
      <span class="text-body-medium">{{ time24 ?? '—' }}</span>
    </div>
    <TimePicker v-model="time" v-model:open="timeOpen" :hour12="true" />
    <TimePicker v-model="time24" v-model:open="time24Open" :hour12="false" />
  </section>
</template>
