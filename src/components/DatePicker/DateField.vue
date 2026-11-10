<script setup lang="ts">
/**
 * Material 3 docked date picker: a text field with a calendar that drops down below it.
 * Spec: https://m3.material.io/components/date-pickers/specs (docked)
 * Tokens: md.comp.date-picker.docked
 *
 * - `v-model` is the date (Date | null). Type it in the locale's numeric format, or open
 *   the calendar with the trailing button; picking a day sets it and closes the calendar.
 * - `label`, `variant`, `supportingText`, `min`, `max`, `locale`, `labels` as on
 *   TextField/DatePicker. `label` defaults to `labels.date`.
 */
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import { popoverReset } from '../../internal/classes'
import { iconPaths } from '../../internal/icons'
import { animate, effects, spatial } from '../../internal/motion'
import { fill, useLabels } from '../../internal/labels'
import { usePopover } from '../../internal/usePopover'
import IconButton from '../Button/IconButton.vue'
import TextField, { type TextFieldVariant } from '../TextField/TextField.vue'
import CalendarPanel from './CalendarPanel.vue'
import { datePattern, formatNumeric, inRange, parseDate } from './dates'
import { datePickerLabels, type DatePickerLabels } from './labels'

const props = withDefaults(
  defineProps<{
    label?: string
    variant?: TextFieldVariant
    supportingText?: string
    min?: Date | null
    max?: Date | null
    locale?: string
    disabled?: boolean
    labels?: Partial<DatePickerLabels>
  }>(),
  {
    label: undefined,
    variant: 'outlined',
    supportingText: undefined,
    min: null,
    max: null,
    locale: undefined,
    disabled: false,
    labels: undefined,
  },
)

const value = defineModel<Date | null>({ default: null })
const strings = useLabels(datePickerLabels, () => props.labels)
const fieldLabel = computed(() => props.label ?? strings.value.date)

const popupId = useId()
const field = useTemplateRef<HTMLElement>('field')
const popup = useTemplateRef<HTMLElement>('popup')
const anchor = computed(() => (field.value as unknown as { $el?: HTMLElement } | null)?.$el ?? null)

const text = ref(formatNumeric(value.value, props.locale))
watch(value, (d) => (text.value = formatNumeric(d, props.locale)))

const pattern = computed(() => datePattern(props.locale))
const error = computed(() => {
  if (!text.value.trim()) return false
  const d = parseDate(text.value, props.locale)
  return !d || !inRange(d, props.min, props.max)
})

function commitText() {
  if (!text.value.trim()) value.value = null
  else if (!error.value) value.value = parseDate(text.value, props.locale)
}

const { show, hide, isOpen, justDismissed } = usePopover(anchor, popup, { placement: 'bottom-start', offset: 4 })

async function toggle() {
  if (justDismissed()) return
  if (isOpen.value) return hide()
  show()
  await nextTick()
  animate(popup.value, [{ transform: 'translateY(-8px)' }, { transform: 'none' }], spatial(popup.value, 'fast'))
  animate(popup.value, [{ opacity: 0 }, { opacity: 1 }], effects(popup.value, 'fast'))
  popup.value?.querySelector<HTMLElement>('[role="group"] [tabindex="0"]')?.focus()
}

function pick(d: Date) {
  value.value = d
  hide()
  ;(anchor.value?.querySelector('input') as HTMLInputElement | null)?.focus()
}
</script>

<template>
  <TextField
    ref="field"
    v-model="text"
    :variant="variant"
    :label="fieldLabel"
    :placeholder="pattern"
    :supporting-text="supportingText ?? pattern"
    :error="error"
    :error-text="fill(strings.invalidDate, { pattern })"
    :disabled="disabled"
    inputmode="numeric"
    @blur="commitText"
    @keydown.enter="commitText"
  >
    <template #trailing-icon>
      <IconButton
        variant="standard"
        :label="strings.openCalendar"
        :disabled="disabled"
        aria-haspopup="dialog"
        :aria-expanded="isOpen"
        :aria-controls="popupId"
        @click="toggle"
      >
        <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.calendarToday" /></svg>
      </IconButton>
    </template>
  </TextField>

  <!-- 360dp wide, 16dp corners, surface-container-high, elevation 3 -->
  <div
    :id="popupId"
    ref="popup"
    popover="auto"
    role="dialog"
    :aria-label="fieldLabel"
    :class="[popoverReset, 'z-50 w-90 max-w-[calc(100vw-1rem)] rounded-2xl bg-surface-container-high px-0 pt-0 pb-3 shadow-elevation-3']"
  >
    <CalendarPanel :selected="value" :min="min" :max="max" :locale="locale" cell="l" :labels="strings" @select="pick" />
  </div>
</template>
