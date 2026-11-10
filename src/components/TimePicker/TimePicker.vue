<script setup lang="ts">
/**
 * Material 3 modal time picker: dial or keyboard input.
 * Spec: https://m3.material.io/components/time-pickers/specs
 * Tokens: md.comp.time-picker, md.comp.time-input
 *
 * - `v-model` is the time as "HH:mm" (24-hour, like <input type="time">), or null.
 * - `v-model:open` shows it; changes are a draft until OK.
 * - 12- or 24-hour display follows `hour12`, or the locale when unset.
 * - Dial: click or drag; picking an hour moves on to minutes. The dial is a slider for
 *   keyboard users (arrow keys, PageUp/PageDown, Home/End).
 * - The keyboard button switches to typing hours and minutes; `inputMode` starts there.
 * - `labels` overrides any of the English text (see TimePickerLabels); AM/PM follow `locale`.
 */
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import { focusRing, focusRingInset, scrimClasses, stateLayer } from '../../internal/classes'
import { iconPaths } from '../../internal/icons'
import { animate, effects, fadeOut, scrimIn, scrimOut, spatial } from '../../internal/motion'
import { fill, useLabels } from '../../internal/labels'
import { useDialog } from '../../internal/useDialog'
import Button from '../Button/Button.vue'
import IconButton from '../Button/IconButton.vue'
import { timePickerLabels, type TimePickerLabels } from './labels'
import { vRipple } from '../../internal/ripple'

const props = withDefaults(
  defineProps<{
    hour12?: boolean
    inputMode?: boolean
    locale?: string
    title?: string
    labels?: Partial<TimePickerLabels>
  }>(),
  {
    hour12: undefined,
    inputMode: false,
    locale: undefined,
    title: undefined,
    labels: undefined,
  },
)

const open = defineModel<boolean>('open', { default: false })
const value = defineModel<string | null>({ default: null })
const emit = defineEmits<{ cancel: []; closed: [] }>()

const titleId = useId()
const strings = useLabels(timePickerLabels, () => props.labels)

const use12 = computed(() => {
  if (props.hour12 !== undefined) return props.hour12
  const cycle = new Intl.DateTimeFormat(props.locale, { hour: 'numeric' }).resolvedOptions().hourCycle
  return cycle === 'h12' || cycle === 'h11'
})

/** The locale's AM and PM text. */
const periods = computed(() => {
  const format = new Intl.DateTimeFormat(props.locale, { hour: 'numeric', hour12: true })
  const name = (h: number) => format.formatToParts(new Date(2000, 0, 1, h)).find((p) => p.type === 'dayPeriod')?.value
  return { am: name(9) ?? 'AM', pm: name(21) ?? 'PM' }
})

// --- Draft (24-hour)
const hours = ref(0)
const minutes = ref(0)
const part = ref<'hour' | 'minute'>('hour')
const typing = ref(props.inputMode)

function reset() {
  const [h, m] = (value.value ?? '').split(':').map(Number)
  const now = new Date()
  hours.value = Number.isFinite(h) ? h : now.getHours()
  minutes.value = Number.isFinite(m) ? m : now.getMinutes()
  part.value = 'hour'
  typing.value = props.inputMode
  syncTyped()
}
watch(open, (on) => on && reset(), { immediate: true })

const pm = computed(() => hours.value >= 12)
const displayHour = computed(() => (use12.value ? hours.value % 12 || 12 : hours.value))
const pad = (n: number) => String(n).padStart(2, '0')

function setPeriod(toPm: boolean) {
  if (toPm !== pm.value) hours.value = (hours.value + 12) % 24
}

// --- Dial geometry (256dp dial, 48dp handle)
const DIAL = 256
const OUTER = 100 // radius of the outer ring of labels
const INNER = 64 // 24-hour inner ring

interface Mark {
  value: number
  label: string
  x: number
  y: number
}

function position(index: number, radius: number) {
  const a = (index / 12) * 2 * Math.PI
  return { x: DIAL / 2 + radius * Math.sin(a), y: DIAL / 2 - radius * Math.cos(a) }
}

const marks = computed<Mark[]>(() => {
  if (part.value === 'minute') {
    return Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: pad(i * 5), ...position(i, OUTER) }))
  }
  if (use12.value) {
    return Array.from({ length: 12 }, (_, i) => ({ value: i, label: String(i || 12), ...position(i, OUTER) }))
  }
  return [
    ...Array.from({ length: 12 }, (_, i) => ({ value: i, label: pad(i), ...position(i, OUTER) })),
    ...Array.from({ length: 12 }, (_, i) => ({ value: i + 12, label: pad(i + 12), ...position(i, INNER) })),
  ].map((m) => (m.value === 0 ? { ...m, ...position(0, INNER), label: '00' } : m.value === 12 ? { ...m, ...position(0, OUTER) } : m))
})

/** Where the handle sits, as dial coordinates. */
const handle = computed(() => {
  if (part.value === 'minute') {
    const a = (minutes.value / 60) * 2 * Math.PI
    return { x: DIAL / 2 + OUTER * Math.sin(a), y: DIAL / 2 - OUTER * Math.cos(a) }
  }
  const inner = !use12.value && (hours.value === 0 || hours.value > 12)
  return position(hours.value % 12, inner ? INNER : OUTER)
})

const isSelectedMark = (m: Mark) =>
  part.value === 'minute' ? m.value === minutes.value : use12.value ? m.value === hours.value % 12 : m.value === hours.value

// --- Pointer input on the dial
const dial = useTemplateRef<HTMLElement>('dial')
let dragging = false

function fromPointer(e: PointerEvent) {
  const r = dial.value!.getBoundingClientRect()
  const dx = e.clientX - (r.left + r.width / 2)
  const dy = e.clientY - (r.top + r.height / 2)
  const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI)
  const distance = Math.hypot(dx, dy) * (DIAL / r.width)
  if (part.value === 'minute') {
    minutes.value = Math.round((angle / (2 * Math.PI)) * 60) % 60
    return
  }
  const index = Math.round((angle / (2 * Math.PI)) * 12) % 12
  if (use12.value) hours.value = index + (pm.value ? 12 : 0)
  else {
    const inner = distance < (OUTER + INNER) / 2
    // Outer ring: 12, 1–11; inner ring: 00, 13–23.
    hours.value = inner ? (index === 0 ? 0 : index + 12) : index === 0 ? 12 : index
  }
}

function onPointerDown(e: PointerEvent) {
  dragging = true
  dial.value?.setPointerCapture(e.pointerId)
  fromPointer(e)
}
function onPointerMove(e: PointerEvent) {
  if (dragging) fromPointer(e)
}
function onPointerUp() {
  if (!dragging) return
  dragging = false
  if (part.value === 'hour') part.value = 'minute'
}

// --- Keyboard on the dial
function onDialKeydown(e: KeyboardEvent) {
  const step: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }
  if (part.value === 'minute') {
    if (e.key in step) minutes.value = (minutes.value + step[e.key] + 60) % 60
    else if (e.key === 'Home') minutes.value = 0
    else if (e.key === 'End') minutes.value = 59
    else return
  } else {
    if (e.key in step) hours.value = (hours.value + Math.sign(step[e.key]) + 24) % 24
    else if (e.key === 'Home') hours.value = 0
    else if (e.key === 'End') hours.value = 23
    else if (e.key === 'Enter') part.value = 'minute'
    else return
  }
  e.preventDefault()
}

const dialLabel = computed(() => (part.value === 'hour' ? strings.value.hour : strings.value.minute))
const dialValueText = computed(() =>
  part.value === 'hour'
    ? `${displayHour.value}${use12.value ? ` ${pm.value ? periods.value.pm : periods.value.am}` : ''}`
    : fill(strings.value.minutes, { minutes: minutes.value }),
)

// --- Typing: the fields keep what's typed; valid numbers update the time, and the
// text is tidied (zero-padded) when the field loses focus.
const hourText = ref('')
const minuteText = ref('')
function syncTyped() {
  hourText.value = pad(displayHour.value)
  minuteText.value = pad(minutes.value)
}
function onTypedHour() {
  const n = Number(hourText.value)
  if (!hourText.value || !Number.isInteger(n)) return
  if (use12.value && n >= 1 && n <= 12) hours.value = (n % 12) + (pm.value ? 12 : 0)
  else if (!use12.value && n >= 0 && n <= 23) hours.value = n
}
function onTypedMinute() {
  const n = Number(minuteText.value)
  if (minuteText.value && Number.isInteger(n) && n >= 0 && n <= 59) minutes.value = n
}
const selectAll = (e: FocusEvent) => (e.target as HTMLInputElement).select()

// Switching modes swaps the focused control out, so move focus to its replacement.
async function toggleMode() {
  typing.value = !typing.value
  syncTyped()
  await nextTick()
  panel.value?.querySelector<HTMLElement>(typing.value ? 'input' : '[role="slider"]')?.focus()
}

// --- Dialog
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
  value.value = `${pad(hours.value)}:${pad(minutes.value)}`
  open.value = false
}

const selectorBox = (active: boolean) => [
  'relative flex h-20 w-24 items-center justify-center rounded-[8px] font-brand text-display-large',
  active ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface',
]
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-on-surface backdrop:bg-transparent"
    @cancel="onCancel"
    @close="onClose"
  >
    <div ref="scrim" :class="scrimClasses" @click="cancel" />
    <div class="pointer-events-none relative flex size-full items-center justify-center p-4">
      <div
        ref="panel"
        class="pointer-events-auto flex flex-col rounded-[28px] bg-surface-container-high p-6 pb-5 font-plain shadow-elevation-3"
      >
        <span :id="titleId" class="mb-5 text-label-medium text-on-surface-variant">
          {{ title ?? (typing ? strings.enterTime : strings.selectTime) }}
        </span>

        <!-- Time selectors: hour : minute, then AM/PM -->
        <div class="flex items-start gap-3">
          <div class="flex items-center gap-1">
            <template v-if="typing">
              <label class="flex flex-col gap-2">
                <input
                  v-model="hourText"
                  inputmode="numeric"
                  maxlength="2"
                  :aria-label="strings.hour"
                  :class="[
                    selectorBox(true),
                    'text-center caret-primary outline-none focus:outline-2 focus:outline-solid focus:outline-primary',
                  ]"
                  @input="onTypedHour"
                  @focus="selectAll"
                  @blur="syncTyped"
                  @keydown.enter="confirm"
                />
                <span class="text-body-small text-on-surface-variant">{{ strings.hour }}</span>
              </label>
              <span class="mb-7 w-6 text-center font-brand text-display-large text-on-surface">:</span>
              <label class="flex flex-col gap-2">
                <input
                  v-model="minuteText"
                  inputmode="numeric"
                  maxlength="2"
                  :aria-label="strings.minute"
                  :class="[
                    selectorBox(false),
                    'text-center caret-primary outline-none focus:bg-primary-container focus:text-on-primary-container focus:outline-2 focus:outline-solid focus:outline-primary',
                  ]"
                  @input="onTypedMinute"
                  @focus="selectAll"
                  @blur="syncTyped"
                  @keydown.enter="confirm"
                />
                <span class="text-body-small text-on-surface-variant">{{ strings.minute }}</span>
              </label>
            </template>
            <template v-else>
              <button v-ripple type="button" :aria-label="strings.hour" :aria-pressed="part === 'hour'" :class="[selectorBox(part === 'hour'), 'cursor-pointer', focusRing, stateLayer]" @click="part = 'hour'">
                {{ use12 ? displayHour : pad(displayHour) }}
              </button>
              <span class="w-6 text-center font-brand text-display-large text-on-surface">:</span>
              <button v-ripple type="button" :aria-label="strings.minute" :aria-pressed="part === 'minute'" :class="[selectorBox(part === 'minute'), 'cursor-pointer', focusRing, stateLayer]" @click="part = 'minute'">
                {{ pad(minutes) }}
              </button>
            </template>
          </div>

          <!-- Period selector: 52×80dp, outlined, tertiary-container when selected -->
          <div
            v-if="use12"
            role="group"
            :aria-label="strings.period"
            class="flex h-20 w-13 flex-col overflow-hidden rounded-[8px] border border-outline text-title-medium"
          >
            <button
              v-ripple
              v-for="isPm in [false, true]"
              :key="String(isPm)"
              type="button"
              :aria-pressed="pm === isPm"
              :class="[
                'relative flex flex-1 cursor-pointer items-center justify-center',
                focusRingInset,
                stateLayer,
                isPm && 'border-t border-outline',
                pm === isPm ? 'bg-tertiary-container text-on-tertiary-container' : 'text-on-surface-variant',
              ]"
              @click="setPeriod(isPm)"
            >
              {{ isPm ? periods.pm : periods.am }}
            </button>
          </div>
        </div>

        <!-- Dial: 256dp, surface-container-highest -->
        <div
          v-if="!typing"
          ref="dial"
          role="slider"
          tabindex="0"
          :aria-label="dialLabel"
          :aria-valuenow="part === 'hour' ? hours : minutes"
          :aria-valuemin="0"
          :aria-valuemax="part === 'hour' ? 23 : 59"
          :aria-valuetext="dialValueText"
          :class="['relative mx-auto mt-9 size-64 cursor-pointer touch-none rounded-full bg-surface-container-highest select-none', focusRing]"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @keydown="onDialKeydown"
        >
          <svg class="pointer-events-none absolute inset-0 size-full text-primary" viewBox="0 0 256 256" aria-hidden="true">
            <line x1="128" y1="128" :x2="handle.x" :y2="handle.y" stroke="currentColor" stroke-width="2" />
            <circle cx="128" cy="128" r="4" fill="currentColor" />
            <circle :cx="handle.x" :cy="handle.y" r="24" fill="currentColor" />
          </svg>
          <span
            v-for="m in marks"
            :key="`${part}-${m.value}`"
            aria-hidden="true"
            :class="[
              'pointer-events-none absolute flex size-12 -translate-1/2 items-center justify-center',
              isSelectedMark(m) ? 'text-on-primary' : 'text-on-surface',
              m.value >= 13 || (m.value === 0 && !use12 && part === 'hour') ? 'text-body-medium' : 'text-body-large',
            ]"
            :style="{ left: `${(m.x / 256) * 100}%`, top: `${(m.y / 256) * 100}%` }"
          >
            {{ m.label }}
          </span>
        </div>

        <div class="mt-6 flex items-center gap-2">
          <IconButton variant="standard" :label="typing ? strings.switchToClock : strings.switchToInput" class="-ms-3" @click="toggleMode">
            <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="typing ? iconPaths.schedule : iconPaths.keyboard" /></svg>
          </IconButton>
          <Button variant="text" class="ms-auto" @click="cancel">{{ strings.cancel }}</Button>
          <Button variant="text" @click="confirm">{{ strings.confirm }}</Button>
        </div>
      </div>
    </div>
  </dialog>
</template>
