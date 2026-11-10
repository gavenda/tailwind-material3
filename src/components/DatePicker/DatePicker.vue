<script setup lang="ts">
/**
 * Material 3 modal date picker: one date or a range, by calendar or by typing.
 * Spec: https://m3.material.io/components/date-pickers/specs
 * Tokens: md.comp.date-picker.modal, md.comp.date-input.modal
 *
 * - `v-model:open` shows it. Changes are a draft until OK; Cancel, Escape or the scrim
 *   throw them away.
 * - Single date: `v-model` (Date | null). Range: set `range` and bind `v-model:start` and
 *   `v-model:end`.
 * - The pencil button switches to typing the date(s) in the locale's numeric format;
 *   `inputMode` starts there.
 * - `min` / `max` limit the choice. Dates follow `locale` (default: the browser's).
 * - `labels` overrides any of the English text (see DatePickerLabels).
 */
import { computed, ref, useId, useTemplateRef, watch } from 'vue'
import { scrimClasses } from '../../internal/classes'
import { iconPaths } from '../../internal/icons'
import { animate, effects, fadeOut, scrimIn, scrimOut, spatial } from '../../internal/motion'
import { fill, useLabels } from '../../internal/labels'
import { useDialog } from '../../internal/useDialog'
import Button from '../Button/Button.vue'
import IconButton from '../Button/IconButton.vue'
import TextField from '../TextField/TextField.vue'
import CalendarPanel from './CalendarPanel.vue'
import { datePattern, formatNumeric, inRange, parseDate, startOfDay } from './dates'
import { datePickerLabels, type DatePickerLabels } from './labels'

const props = withDefaults(
  defineProps<{
    range?: boolean
    inputMode?: boolean
    min?: Date | null
    max?: Date | null
    locale?: string
    title?: string
    labels?: Partial<DatePickerLabels>
  }>(),
  {
    range: false,
    inputMode: false,
    min: null,
    max: null,
    locale: undefined,
    title: undefined,
    labels: undefined,
  },
)

const open = defineModel<boolean>('open', { default: false })
const value = defineModel<Date | null>({ default: null })
const start = defineModel<Date | null>('start', { default: null })
const end = defineModel<Date | null>('end', { default: null })
const emit = defineEmits<{ cancel: []; closed: [] }>()
const strings = useLabels(datePickerLabels, () => props.labels)

// --- Draft
const draft = ref<Date | null>(null)
const draftStart = ref<Date | null>(null)
const draftEnd = ref<Date | null>(null)
const typing = ref(props.inputMode)

function reset() {
  draft.value = value.value
  draftStart.value = start.value
  draftEnd.value = end.value
  typing.value = props.inputMode
  syncText()
}
watch(open, (on) => on && reset(), { immediate: true })

function pick(d: Date) {
  if (!props.range) {
    draft.value = d
    return
  }
  // First click starts a range; the second ends it (swapping if it's earlier).
  if (!draftStart.value || draftEnd.value) {
    draftStart.value = d
    draftEnd.value = null
  } else if (d < draftStart.value) {
    draftEnd.value = draftStart.value
    draftStart.value = d
  } else {
    draftEnd.value = d
  }
}

// --- Typing
const text = ref('')
const textStart = ref('')
const textEnd = ref('')
function syncText() {
  text.value = formatNumeric(draft.value, props.locale)
  textStart.value = formatNumeric(draftStart.value, props.locale)
  textEnd.value = formatNumeric(draftEnd.value, props.locale)
}
const pattern = computed(() => datePattern(props.locale))
const errorText = computed(() => fill(strings.value.invalidDate, { pattern: pattern.value }))

function parsed(t: string) {
  if (!t.trim()) return { date: null, error: false }
  const d = parseDate(t, props.locale)
  return { date: d, error: !d || !inRange(d, props.min, props.max) }
}
const singleInput = computed(() => parsed(text.value))
const startInput = computed(() => parsed(textStart.value))
const endInput = computed(() => parsed(textEnd.value))
const inputError = computed(() =>
  props.range ? startInput.value.error || endInput.value.error : singleInput.value.error,
)

function toggleMode() {
  if (typing.value) {
    // Leaving input mode keeps valid typed dates.
    if (!props.range && !singleInput.value.error) draft.value = singleInput.value.date
    if (props.range && !inputError.value) {
      draftStart.value = startInput.value.date
      draftEnd.value = endInput.value.date
    }
  } else {
    syncText()
  }
  typing.value = !typing.value
}

// --- Header
const fullFormat = computed(() => new Intl.DateTimeFormat(props.locale, { weekday: 'short', month: 'short', day: 'numeric' }))
const shortFormat = computed(() => new Intl.DateTimeFormat(props.locale, { month: 'short', day: 'numeric' }))
const supporting = computed(() => {
  if (props.title) return props.title
  if (props.range) return strings.value.selectDates
  return typing.value ? strings.value.enterDate : strings.value.selectDate
})
const headline = computed(() => {
  if (props.range) {
    const s = draftStart.value ? shortFormat.value.format(draftStart.value) : strings.value.startDate
    const e = draftEnd.value ? shortFormat.value.format(draftEnd.value) : strings.value.endDate
    return `${s} – ${e}`
  }
  return draft.value ? fullFormat.value.format(draft.value) : strings.value.noDate
})

// --- Dialog
const headlineId = useId()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const panel = useTemplateRef<HTMLElement>('panel')
const scrim = useTemplateRef<HTMLElement>('scrim')

const { cancel, onCancel, onClose } = useDialog(dialog, open, {
  onCancel: () => emit('cancel'),
  onClosed: () => emit('closed'),
  enter: () =>
    Promise.all([
      animate(panel.value, [{ transform: 'scale(0.9)' }, { transform: 'none' }], spatial(panel.value)),
      animate(panel.value, [{ opacity: 0 }, { opacity: 1 }], effects(panel.value)),
      scrimIn(scrim.value),
    ]),
  leave: () => Promise.all([fadeOut(panel.value), scrimOut(scrim.value)]),
})

function confirm() {
  if (typing.value) {
    if (inputError.value) return
    if (props.range) {
      draftStart.value = startInput.value.date
      draftEnd.value = endInput.value.date
    } else {
      draft.value = singleInput.value.date
    }
  }
  if (props.range) {
    start.value = draftStart.value && startOfDay(draftStart.value)
    end.value = draftEnd.value && startOfDay(draftEnd.value)
  } else {
    value.value = draft.value && startOfDay(draft.value)
  }
  open.value = false
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="headlineId"
    class="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-on-surface backdrop:bg-transparent"
    @cancel="onCancel"
    @close="onClose"
  >
    <div ref="scrim" :class="scrimClasses" @click="cancel" />
    <div class="pointer-events-none relative flex size-full items-center justify-center p-4">
      <!-- 360dp wide, 28dp corners, surface-container-high, elevation 3 -->
      <div
        ref="panel"
        class="pointer-events-auto flex w-90 max-w-full flex-col overflow-hidden rounded-[28px] bg-surface-container-high font-plain shadow-elevation-3"
      >
        <!-- Header: supporting text, headline, mode toggle -->
        <div class="flex flex-col gap-9 ps-6 pe-3 pt-4 pb-3">
          <span class="text-label-large text-on-surface-variant">{{ supporting }}</span>
          <div class="flex items-center gap-2">
            <h2
              :id="headlineId"
              :class="['flex-1 text-on-surface-variant', range ? 'text-title-large' : 'text-headline-large']"
              aria-live="polite"
            >
              {{ headline }}
            </h2>
            <IconButton
              variant="standard"
              :label="typing ? strings.switchToCalendar : strings.switchToInput"
              @click="toggleMode"
            >
              <svg viewBox="0 -960 960 960" fill="currentColor">
                <path :d="typing ? iconPaths.calendarToday : iconPaths.edit" />
              </svg>
            </IconButton>
          </div>
        </div>
        <div class="h-px bg-outline-variant" />

        <!-- Input mode -->
        <div v-if="typing" class="flex gap-2 px-6 pt-4 pb-2">
          <template v-if="range">
            <TextField
              v-model="textStart"
              variant="outlined"
              :label="strings.startDate"
              :placeholder="pattern"
              :error="startInput.error"
              :error-text="errorText"
              class="w-auto min-w-0 flex-1"
              @keydown.enter="confirm"
            />
            <TextField
              v-model="textEnd"
              variant="outlined"
              :label="strings.endDate"
              :placeholder="pattern"
              :error="endInput.error"
              :error-text="errorText"
              class="w-auto min-w-0 flex-1"
              @keydown.enter="confirm"
            />
          </template>
          <TextField
            v-else
            v-model="text"
            variant="outlined"
            :label="strings.date"
            :placeholder="pattern"
            :supporting-text="pattern"
            :error="singleInput.error"
            :error-text="errorText"
            class="w-full"
            @keydown.enter="confirm"
          />
        </div>

        <!-- Calendar mode -->
        <CalendarPanel
          v-else
          :selected="range ? null : draft"
          :range-start="range ? draftStart : null"
          :range-end="range ? draftEnd : null"
          :min="min"
          :max="max"
          :locale="locale"
          :labels="strings"
          @select="pick"
        />

        <div class="flex justify-end gap-2 px-3 pt-2 pb-5">
          <Button variant="text" @click="cancel">{{ strings.cancel }}</Button>
          <Button variant="text" :disabled="typing && inputError" @click="confirm">{{ strings.confirm }}</Button>
        </div>
      </div>
    </div>
  </dialog>
</template>
