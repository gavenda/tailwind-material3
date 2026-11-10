<script setup lang="ts">
/**
 * Material 3 text field: filled or outlined.
 * Spec: https://m3.material.io/components/text-fields/specs
 * Tokens: md.comp.filled-text-field, md.comp.outlined-text-field
 *
 * - `v-model` binds the value. `multiline` renders a <textarea> (`rows` lines tall).
 * - `label` floats up when the field is focused or has a value.
 * - Slots: `icon` (leading), `trailing-icon` (24dp; put an IconButton there for actions),
 *   `supporting-text`. Props `prefix` / `suffix` show next to the value.
 * - `error` colors it with the error role; `errorText` replaces the supporting text.
 * - `counter` with `maxlength` shows "n/max" at the end of the supporting row.
 *
 * Attributes such as name, autocomplete, inputmode and maxlength go to the input;
 * class and style go to the root.
 */
import { computed, ref, useAttrs, useId, useSlots, useTemplateRef } from 'vue'

defineOptions({ inheritAttrs: false })

export type TextFieldVariant = 'filled' | 'outlined'

const props = withDefaults(
  defineProps<{
    variant?: TextFieldVariant
    label?: string
    placeholder?: string
    type?: string
    supportingText?: string
    error?: boolean
    /** Shown instead of the supporting text while `error` is set. */
    errorText?: string
    prefix?: string
    suffix?: string
    /** Show a character counter; set `maxlength` too. */
    counter?: boolean
    multiline?: boolean
    rows?: number
    required?: boolean
    readonly?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'filled',
    label: undefined,
    placeholder: undefined,
    type: 'text',
    supportingText: undefined,
    error: false,
    errorText: undefined,
    prefix: undefined,
    suffix: undefined,
    counter: false,
    multiline: false,
    rows: 3,
    required: false,
    readonly: false,
    disabled: false,
  },
)

const model = defineModel<string | number | null>({ default: '' })

const attrs = useAttrs()
const slots = useSlots()
const id = useId()
const supportingId = useId()

const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

const input = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('input')
const focused = ref(false)

const text = computed(() => (model.value == null ? '' : String(model.value)))
const populated = computed(() => text.value.length > 0)
const floated = computed(() => focused.value || populated.value || (!!props.placeholder && !props.label))
const outlined = computed(() => props.variant === 'outlined')
const hasLeading = computed(() => !!slots.icon)
const hasTrailing = computed(() => !!slots['trailing-icon'])

const maxLength = computed(() => {
  const v = attrs.maxlength ?? attrs.maxLength
  return v == null ? undefined : Number(v)
})

const supporting = computed(() => (props.error && props.errorText ? props.errorText : props.supportingText))
const hasSupportingRow = computed(
  () => !!supporting.value || !!slots['supporting-text'] || (props.counter && maxLength.value !== undefined),
)

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  model.value = typeof model.value === 'number' && value !== '' && !Number.isNaN(Number(value)) ? Number(value) : value
}

function focusInput(e: MouseEvent) {
  // Clicking padding or the label focuses the input; clicks on slotted buttons don't.
  if ((e.target as HTMLElement).closest('button, a, input, textarea')) return
  input.value?.focus()
}

defineExpose({ focus: () => input.value?.focus(), input })

// --- Colors, chosen in one place per state.
const tone = computed(() => {
  if (props.disabled) {
    return { label: 'text-on-surface/38', icon: 'text-on-surface/38', indicator: 'bg-on-surface/38', outline: 'border-on-surface/12', support: 'text-on-surface/38' }
  }
  if (props.error) {
    return {
      label: focused.value ? 'text-error' : 'text-error group-hover:text-on-error-container',
      icon: 'text-on-surface-variant',
      trailing: 'text-error group-hover:text-on-error-container',
      indicator: focused.value ? 'bg-error' : 'bg-error group-hover:bg-on-error-container',
      outline: focused.value ? 'border-error' : 'border-error group-hover:border-on-error-container',
      support: 'text-error',
    }
  }
  return {
    label: focused.value ? 'text-primary' : 'text-on-surface-variant',
    icon: 'text-on-surface-variant',
    indicator: focused.value ? 'bg-primary' : 'bg-on-surface-variant group-hover:bg-on-surface',
    outline: focused.value ? 'border-primary' : 'border-outline group-hover:border-on-surface',
    support: 'text-on-surface-variant',
  }
})

// Label position. Filled: centred, or 8dp from the top when floated.
// Outlined: centred, or on the outline when floated.
const labelPosition = computed(() => {
  const resting = props.multiline ? 'top-4' : 'top-1/2 -translate-y-1/2'
  if (!floated.value) return [resting, 'text-body-large']
  return outlined.value ? ['top-0 -translate-y-1/2', 'text-body-small'] : ['top-2', 'text-body-small']
})

const contentStart = computed(() => (hasLeading.value ? 'ps-13' : 'ps-4'))
const contentEnd = computed(() => (hasTrailing.value ? 'pe-13' : 'pe-4'))
</script>

<template>
    <!-- 280dp default width at zero specificity, so a width class passed in always wins. -->
  <div v-bind="rootAttrs" :class="['inline-flex flex-col font-plain [:where(&)]:w-70', disabled && 'pointer-events-none']">
    <div
      :class="[
        'group relative flex cursor-text items-start',
        multiline ? 'min-h-14' : 'h-14',
        outlined ? 'rounded-[4px]' : ['rounded-t-[4px]', disabled ? 'bg-on-surface/4' : 'bg-surface-container-highest'],
      ]"
      @mousedown="focusInput"
    >
      <!-- Filled: state layer (hover 8%) and active indicator (1dp, 2dp focused) -->
      <template v-if="!outlined">
        <span
          v-if="!disabled"
          class="pointer-events-none absolute inset-0 rounded-[inherit] bg-on-surface opacity-0 transition-opacity group-hover:opacity-8"
        />
        <span
          :class="[
            'pointer-events-none absolute inset-x-0 bottom-0 transition-[height,background-color] duration-(--duration-effects-fast) ease-effects-fast',
            focused ? 'h-0.5' : 'h-px',
            tone.indicator,
          ]"
        />
      </template>

      <!-- Outlined: 1dp outline (3dp focused) with a notch for the floating label -->
      <fieldset
        v-else
        aria-hidden="true"
        :class="[
          'pointer-events-none absolute inset-0 m-0 min-w-0 rounded-[inherit] px-3 transition-[border-color] duration-(--duration-effects-fast)',
          focused ? 'border-3' : 'border',
          tone.outline,
        ]"
      >
        <legend
          v-if="label"
          :class="[
            'invisible h-0 overflow-hidden text-body-small whitespace-nowrap transition-[max-width] duration-(--duration-effects-fast) ease-effects-fast',
            floated ? 'max-w-full px-1' : 'max-w-0',
            // Line the notch up with the label regardless of outline width.
            focused ? '-ms-0.5' : '',
          ]"
        >
          {{ label }}{{ required ? '*' : '' }}
        </legend>
      </fieldset>

      <span
        v-if="hasLeading"
        :class="['absolute start-3 top-4 inline-flex size-6 *:size-full', tone.icon]"
      >
        <slot name="icon" />
      </span>

      <label
        v-if="label"
        :for="id"
        :class="[
          'pointer-events-none absolute max-w-[calc(100%-2rem)] truncate transition-all duration-(--duration-effects-fast) ease-effects-fast motion-reduce:transition-none',
          outlined && floated ? 'start-4' : hasLeading ? 'start-13' : 'start-4',
          labelPosition,
          tone.label,
        ]"
      >
        {{ label }}<span v-if="required">*</span>
      </label>

      <div
        :class="[
          'relative flex min-w-0 flex-1 items-baseline gap-0.5 text-body-large',
          disabled ? 'text-on-surface/38' : 'text-on-surface',
          contentStart,
          contentEnd,
          outlined ? 'py-4' : label ? 'pt-6 pb-2' : 'py-4',
          !multiline && 'h-full',
        ]"
      >
        <span v-if="prefix && floated" class="shrink-0 text-on-surface-variant">{{ prefix }}</span>
        <textarea
          v-if="multiline"
          :id="id"
          ref="input"
          v-bind="inputAttrs"
          :value="text"
          :rows="rows"
          :placeholder="floated ? placeholder : undefined"
          :required="required"
          :readonly="readonly"
          :disabled="disabled"
          :aria-invalid="error || undefined"
          :aria-describedby="hasSupportingRow ? supportingId : undefined"
          class="w-full min-w-0 resize-none bg-transparent caret-primary outline-none placeholder:text-on-surface-variant"
          :class="error && 'caret-error'"
          @input="onInput"
          @focus="focused = true"
          @blur="focused = false"
        />
        <input
          v-else
          :id="id"
          ref="input"
          v-bind="inputAttrs"
          :type="type"
          :value="text"
          :placeholder="floated ? placeholder : undefined"
          :required="required"
          :readonly="readonly"
          :disabled="disabled"
          :aria-invalid="error || undefined"
          :aria-describedby="hasSupportingRow ? supportingId : undefined"
          class="w-full min-w-0 self-stretch bg-transparent caret-primary outline-none placeholder:text-on-surface-variant"
          :class="error && 'caret-error'"
          @input="onInput"
          @focus="focused = true"
          @blur="focused = false"
        />
        <span v-if="suffix && floated" class="shrink-0 text-on-surface-variant">{{ suffix }}</span>
      </div>

      <span
        v-if="hasTrailing"
        :class="['absolute end-3 top-4 inline-flex size-6 items-center justify-center', tone.trailing ?? tone.icon]"
      >
        <slot name="trailing-icon" />
      </span>
    </div>

    <!-- Supporting text and counter: body-small, 4dp below, 16dp side padding -->
    <div
      v-if="hasSupportingRow"
      :id="supportingId"
      :class="['flex gap-4 px-4 pt-1 text-body-small', tone.support]"
    >
      <span class="flex-1">
        <slot name="supporting-text">{{ supporting }}</slot>
      </span>
      <span v-if="counter && maxLength !== undefined" class="shrink-0">{{ text.length }}/{{ maxLength }}</span>
    </div>
  </div>
</template>
