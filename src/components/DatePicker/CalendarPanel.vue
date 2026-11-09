<script setup lang="ts">
/**
 * Month header (month/year menu button, previous/next) above either the day grid or
 * the year list (internal; used by DatePicker and DateField).
 * Tokens: md.comp.date-picker.modal.year-selection, md.comp.date-picker.docked.menu-button
 */
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { iconPaths } from '../../internal/icons'
import IconButton from '../Button/IconButton.vue'
import Calendar from './Calendar.vue'
import { addMonths, startOfMonth } from './dates'

const props = withDefaults(
  defineProps<{
    selected?: Date | null
    rangeStart?: Date | null
    rangeEnd?: Date | null
    min?: Date | null
    max?: Date | null
    locale?: string
    cell?: 'm' | 'l'
    prevLabel?: string
    nextLabel?: string
  }>(),
  {
    selected: null,
    rangeStart: null,
    rangeEnd: null,
    min: null,
    max: null,
    locale: undefined,
    cell: 'm',
    prevLabel: 'Previous month',
    nextLabel: 'Next month',
  },
)

const emit = defineEmits<{ select: [date: Date] }>()

const month = ref(startOfMonth(props.selected ?? props.rangeStart ?? new Date()))
watch(
  () => props.selected ?? props.rangeStart,
  (d) => d && (month.value = startOfMonth(d)),
)

const years = ref(false)
const yearList = useTemplateRef<HTMLElement>('yearList')

const title = computed(() => new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }).format(month.value))
const minYear = computed(() => props.min?.getFullYear() ?? month.value.getFullYear() - 100)
const maxYear = computed(() => props.max?.getFullYear() ?? month.value.getFullYear() + 100)
const yearOptions = computed(() =>
  Array.from({ length: maxYear.value - minYear.value + 1 }, (_, i) => minYear.value + i),
)

async function toggleYears() {
  years.value = !years.value
  if (!years.value) return
  await nextTick()
  // Centre the current year and focus it.
  const current = yearList.value?.querySelector<HTMLElement>('[aria-pressed="true"]')
  current?.scrollIntoView({ block: 'center' })
  current?.focus()
}

function pickYear(y: number) {
  let m = new Date(y, month.value.getMonth(), 1)
  if (props.min && m < startOfMonth(props.min)) m = startOfMonth(props.min)
  if (props.max && m > startOfMonth(props.max)) m = startOfMonth(props.max)
  month.value = m
  years.value = false
}

const canPrev = computed(() => !props.min || addMonths(month.value, -1) >= startOfMonth(props.min))
const canNext = computed(() => !props.max || addMonths(month.value, 1) <= props.max)
</script>

<template>
  <div class="flex flex-col font-plain">
    <div class="flex h-14 items-center ps-4 pe-3">
      <!-- Month/year menu button: 40dp pill -->
      <button
        type="button"
        :aria-expanded="years"
        :class="[
          'relative inline-flex h-10 cursor-pointer items-center gap-1 rounded-full ps-2 pe-1 text-label-large text-on-surface-variant',
          'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-secondary',
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
          'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
        ]"
        @click="toggleYears"
      >
        {{ title }}
        <svg
          viewBox="0 -960 960 960"
          fill="currentColor"
          aria-hidden="true"
          :class="['size-[18px] transition-transform duration-(--duration-effects-fast)', years && 'rotate-180']"
        >
          <path :d="iconPaths.arrowDropDown" />
        </svg>
      </button>
      <div v-if="!years" class="ms-auto flex">
        <IconButton variant="standard" :label="prevLabel" :disabled="!canPrev" @click="month = addMonths(month, -1)">
          <svg viewBox="0 -960 960 960" fill="currentColor" class="rtl:-scale-x-100"><path :d="iconPaths.chevronLeft" /></svg>
        </IconButton>
        <IconButton variant="standard" :label="nextLabel" :disabled="!canNext" @click="month = addMonths(month, 1)">
          <svg viewBox="0 -960 960 960" fill="currentColor" class="rtl:-scale-x-100"><path :d="iconPaths.chevronRight" /></svg>
        </IconButton>
      </div>
    </div>

    <!-- Year list: 72×36dp pills, three per row -->
    <div v-if="years" ref="yearList" :class="['grid grid-cols-3 content-start gap-y-2 overflow-y-auto px-3 pb-2', cell === 'l' ? 'h-84' : 'h-70']">
      <button
        v-for="y in yearOptions"
        :key="y"
        type="button"
        :aria-pressed="y === month.getFullYear()"
        :class="[
          'relative mx-auto inline-flex h-9 w-18 cursor-pointer items-center justify-center rounded-full text-body-large',
          'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-secondary',
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
          'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
          y === month.getFullYear() ? 'bg-primary text-on-primary' : 'text-on-surface-variant',
        ]"
        @click="pickYear(y)"
      >
        {{ y }}
      </button>
    </div>

    <Calendar
      v-else
      v-model:month="month"
      class="px-3"
      :selected="selected"
      :range-start="rangeStart"
      :range-end="rangeEnd"
      :min="min"
      :max="max"
      :locale="locale"
      :cell="cell"
      @select="(d: Date) => emit('select', d)"
    />
  </div>
</template>
