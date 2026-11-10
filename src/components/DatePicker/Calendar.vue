<script setup lang="ts">
/**
 * Month grid shared by DatePicker and DateField (internal).
 * Tokens: md.comp.date-picker.{modal,docked}.date, …weekdays, …range-selection
 *
 * Arrow keys move a day/week, PageUp/PageDown a month (with Shift: a year),
 * Home/End to the start/end of the week, Enter/Space select.
 */
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { focusRingTight, stateLayer } from '../../internal/classes'
import { addDays, addMonths, firstDayOfWeek, inRange, monthGrid, sameDay, sameMonth, startOfDay } from './dates'

const props = withDefaults(
  defineProps<{
    /** First of the month shown. */
    month: Date
    selected?: Date | null
    /** Range mode: both ends; days between get the range indicator. */
    rangeStart?: Date | null
    rangeEnd?: Date | null
    min?: Date | null
    max?: Date | null
    locale?: string
    /** Day cell size: 40dp (modal) or 48dp (docked). */
    cell?: 'm' | 'l'
  }>(),
  {
    selected: null,
    rangeStart: null,
    rangeEnd: null,
    min: null,
    max: null,
    locale: undefined,
    cell: 'm',
  },
)

const emit = defineEmits<{ select: [date: Date]; 'update:month': [month: Date] }>()

const grid = useTemplateRef<HTMLElement>('grid')
const today = startOfDay(new Date())
const firstDay = computed(() => firstDayOfWeek(props.locale))
const days = computed(() => monthGrid(props.month, firstDay.value))

const weekdays = computed(() => {
  const narrow = new Intl.DateTimeFormat(props.locale, { weekday: 'narrow' })
  const long = new Intl.DateTimeFormat(props.locale, { weekday: 'long' })
  return days.value.slice(0, 7).map((d) => ({ narrow: narrow.format(d), long: long.format(d) }))
})
const dayLabel = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: 'full' }))
const dayNumber = computed(() => new Intl.DateTimeFormat(props.locale, { day: 'numeric' }))
const monthLabel = computed(() =>
  new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }).format(props.month),
)

// The day that holds the roving tab stop.
function clampDay(d: Date) {
  if (props.min && !inRange(d, props.min, null)) return startOfDay(props.min)
  if (props.max && !inRange(d, null, props.max)) return startOfDay(props.max)
  return d
}
const focusDay = ref<Date>(
  clampDay(props.selected ?? props.rangeStart ?? (sameMonth(today, props.month) ? today : props.month)),
)
watch(
  () => props.month,
  (m) => {
    if (!sameMonth(focusDay.value, m)) {
      focusDay.value = clampDay(new Date(m.getFullYear(), m.getMonth(), Math.min(focusDay.value.getDate(), 28)))
    }
  },
)

const isRange = computed(() => !!props.rangeStart)
function rangeRole(d: Date): 'start' | 'end' | 'middle' | null {
  const { rangeStart: s, rangeEnd: e } = props
  if (!s || !e || sameDay(s, e)) return null
  if (sameDay(d, s)) return 'start'
  if (sameDay(d, e)) return 'end'
  const t = d.getTime()
  return t > s.getTime() && t < e.getTime() ? 'middle' : null
}

function isSelected(d: Date) {
  return isRange.value ? sameDay(d, props.rangeStart) || sameDay(d, props.rangeEnd) : sameDay(d, props.selected)
}

async function moveFocus(d: Date) {
  const clamped = inRange(d, props.min, props.max) ? d : focusDay.value
  focusDay.value = clamped
  if (!sameMonth(clamped, props.month)) emit('update:month', new Date(clamped.getFullYear(), clamped.getMonth(), 1))
  await nextTick()
  grid.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
}

function onKeydown(e: KeyboardEvent) {
  const d = focusDay.value
  const rtl = grid.value ? getComputedStyle(grid.value).direction === 'rtl' : false
  const col = (d.getDay() - firstDay.value + 7) % 7
  const moves: Record<string, () => Date> = {
    ArrowLeft: () => addDays(d, rtl ? 1 : -1),
    ArrowRight: () => addDays(d, rtl ? -1 : 1),
    ArrowUp: () => addDays(d, -7),
    ArrowDown: () => addDays(d, 7),
    Home: () => addDays(d, -col),
    End: () => addDays(d, 6 - col),
    PageUp: () => addMonths(d, e.shiftKey ? -12 : -1),
    PageDown: () => addMonths(d, e.shiftKey ? 12 : 1),
  }
  if (moves[e.key]) {
    e.preventDefault()
    moveFocus(moves[e.key]())
  }
}

function choose(d: Date) {
  focusDay.value = d
  emit('select', d)
}

const size = computed(() => (props.cell === 'l' ? 'size-12' : 'size-10'))
</script>

<template>
  <div class="font-plain">
    <div class="grid grid-cols-7 justify-items-center" aria-hidden="true">
      <span
        v-for="w in weekdays"
        :key="w.long"
        :class="['flex items-center justify-center text-body-large text-on-surface', size]"
        :title="w.long"
      >
        {{ w.narrow }}
      </span>
    </div>
    <div ref="grid" role="group" :aria-label="monthLabel" class="grid grid-cols-7 justify-items-stretch" @keydown="onKeydown">
      <div v-for="d in days" :key="d.getTime()" class="relative flex justify-center">
        <!-- Range indicator: secondary-container band behind the days in the range -->
        <span
          v-if="rangeRole(d) && sameMonth(d, month)"
          aria-hidden="true"
          :class="[
            'absolute inset-y-0 bg-secondary-container',
            rangeRole(d) === 'start' ? 'start-1/2 end-0' : rangeRole(d) === 'end' ? 'start-0 end-1/2' : 'inset-x-0',
          ]"
        />
        <button
          v-if="sameMonth(d, month)"
          type="button"
          :tabindex="sameDay(d, focusDay) ? 0 : -1"
          :disabled="!inRange(d, min, max)"
          :aria-pressed="isSelected(d)"
          :aria-current="sameDay(d, today) ? 'date' : undefined"
          :aria-label="dayLabel.format(d)"
          :class="[
            'relative flex cursor-pointer items-center justify-center rounded-full text-body-large',
            size,
            focusRingTight,
            stateLayer,
            'disabled:pointer-events-none disabled:opacity-38',
            isSelected(d)
              ? 'bg-primary text-on-primary'
              : rangeRole(d) === 'middle'
                ? 'text-on-secondary-container'
                : sameDay(d, today)
                  ? 'border border-primary text-primary'
                  : 'text-on-surface',
          ]"
          @click="choose(d)"
        >
          {{ dayNumber.format(d) }}
        </button>
        <span v-else :class="size" />
      </div>
    </div>
  </div>
</template>
