<script setup lang="ts">
/**
 * Material 3 Expressive button.
 * Spec: https://m3.material.io/components/buttons/specs
 * Tokens: md.comp.button.{elevated,filled,tonal,outlined,text}
 *       + md.comp.button.{xsmall,small,medium,large,xlarge}
 *
 * Inside a ButtonGroup, size and shape default to the group's, and a `value`
 * makes the button a toggle whose selection the group manages.
 */
import { computed, useTemplateRef } from 'vue'
import type { ButtonValue } from '../ButtonGroup/context'
import type { ButtonShape, ButtonSize, ButtonVariant } from './types'
import { buttonBaseClasses, touchTargetClasses, useButton } from './useButton'

const props = withDefaults(
  defineProps<{
    /** Color style. Toggle buttons can't use `text`. */
    variant?: ButtonVariant
    /** Defaults to the group's size, else 's'. */
    size?: ButtonSize
    /** Resting shape. A selected toggle switches to the other shape. Defaults to the group's, else 'round'. */
    shape?: ButtonShape
    /** Make this a toggle (selection) button. Bind state with `v-model:selected`. */
    toggle?: boolean
    /** Identifies this button for a selectable ButtonGroup. */
    value?: ButtonValue
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'filled',
    size: undefined,
    shape: undefined,
    toggle: false,
    value: undefined,
    type: 'button',
    disabled: false,
  },
)

const selectedModel = defineModel<boolean>('selected', { default: false })
const root = useTemplateRef<HTMLButtonElement>('root')

const { size, connected, isToggle, isSelected, corners, onClick } = useButton(
  props,
  selectedModel,
  root,
  () => {
    if (props.variant !== 'text') return true
    if (import.meta.env.DEV) console.warn("[Button] Text buttons can't be toggles; ignoring selection.")
    return false
  },
)

interface SizeSpec {
  /** Height, leading/trailing space, icon-label space, typeface, label type scale */
  container: string
  icon: string
  /** Outline width, with the state layer grown to cover it */
  outline: string
}

const sizes: Record<ButtonSize, SizeSpec> = {
  xs: { container: 'h-8 px-3 gap-1 font-plain text-label-large', icon: 'size-5', outline: 'border before:-inset-px' },
  s: { container: 'h-10 px-4 gap-2 font-plain text-label-large', icon: 'size-5', outline: 'border before:-inset-px' },
  m: { container: 'h-14 px-6 gap-2 font-plain text-title-medium', icon: 'size-6', outline: 'border before:-inset-px' },
  l: {
    container: 'h-24 px-12 gap-3 font-brand text-headline-small',
    icon: 'size-8',
    outline: 'border-2 before:-inset-0.5',
  },
  xl: {
    container: 'h-34 px-16 gap-4 font-brand text-headline-large',
    icon: 'size-10',
    outline: 'border-3 before:-inset-[3px]',
  },
}

type ColorState = 'default' | 'unselected' | 'selected'

const colors: Record<ButtonVariant, Record<ColorState, string>> = {
  elevated: {
    default: 'bg-surface-container-low text-primary',
    unselected: 'bg-surface-container-low text-primary',
    selected: 'bg-primary text-on-primary',
  },
  filled: {
    default: 'bg-primary text-on-primary',
    unselected: 'bg-surface-container text-on-surface-variant',
    selected: 'bg-primary text-on-primary',
  },
  tonal: {
    default: 'bg-secondary-container text-on-secondary-container',
    unselected: 'bg-secondary-container text-on-secondary-container',
    selected: 'bg-secondary text-on-secondary',
  },
  outlined: {
    default: 'border-outline-variant text-on-surface-variant',
    unselected: 'border-outline-variant text-on-surface-variant',
    selected: 'border-transparent bg-inverse-surface text-inverse-on-surface',
  },
  text: {
    default: 'text-primary',
    unselected: 'text-primary',
    selected: 'text-primary',
  },
}

const elevations: Record<ButtonVariant, string> = {
  elevated:
    'shadow-elevation-1 hover:shadow-elevation-2 focus-visible:shadow-elevation-1 active:shadow-elevation-1',
  filled: 'hover:shadow-elevation-1 focus-visible:shadow-none active:shadow-none',
  tonal: 'hover:shadow-elevation-1 focus-visible:shadow-none active:shadow-none',
  outlined: '',
  text: '',
}

const spec = computed(() => sizes[size.value])

const classes = computed(() => {
  const small = size.value === 'xs' || size.value === 's'
  const state: ColorState = isToggle.value ? (isSelected.value ? 'selected' : 'unselected') : 'default'
  const outlined = props.variant === 'outlined'

  // Disabled container: on-surface @ 10%, except the unfilled outlined button.
  const disabledContainer = outlined && state !== 'selected' ? '' : 'disabled:bg-on-surface/10'

  return [
    spec.value.container,
    outlined && spec.value.outline,
    small && touchTargetClasses,
    // Connected XS/S groups: 48dp minimum width
    connected.value && small && 'min-w-12',
    colors[props.variant][state],
    elevations[props.variant],
    disabledContainer,
  ]
})
</script>

<template>
  <button
    ref="root"
    :type="type"
    :disabled="disabled"
    :aria-pressed="isToggle ? isSelected : undefined"
    :style="corners"
    :class="[buttonBaseClasses, classes]"
    @click="onClick"
  >
    <span v-if="$slots.icon" :class="['inline-flex shrink-0 *:size-full', spec.icon]">
      <slot name="icon" />
    </span>
    <slot />
  </button>
</template>
