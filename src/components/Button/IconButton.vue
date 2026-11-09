<script setup lang="ts">
/**
 * Material 3 Expressive icon button.
 * Spec: https://m3.material.io/components/icon-buttons/specs
 * Tokens: md.comp.icon-button.{filled,tonal,outlined,standard}
 *       + md.comp.icon-button.{xsmall,small,medium,large,xlarge}
 *
 * Put the icon (e.g. an <svg>) in the default slot; it receives `{ selected }`
 * so toggles can swap icons. Works inside a ButtonGroup like Button does.
 */
import { computed, useTemplateRef } from 'vue'
import type { ButtonValue } from '../ButtonGroup/context'
import type { ButtonShape, ButtonSize } from './types'
import { buttonBaseClasses, touchTargetClasses, useButton } from './useButton'

export type IconButtonVariant = 'filled' | 'tonal' | 'outlined' | 'standard'
export type IconButtonWidth = 'narrow' | 'default' | 'wide'

const props = withDefaults(
  defineProps<{
    /** Accessible name, since there's no visible label. */
    label: string
    variant?: IconButtonVariant
    /** Defaults to the group's size, else 's'. */
    size?: ButtonSize
    /** Resting shape. A selected toggle switches to the other shape. Defaults to the group's, else 'round'. */
    shape?: ButtonShape
    width?: IconButtonWidth
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
    width: 'default',
    toggle: false,
    value: undefined,
    type: 'button',
    disabled: false,
  },
)

defineSlots<{ default(props: { selected: boolean }): unknown }>()

const selectedModel = defineModel<boolean>('selected', { default: false })
const root = useTemplateRef<HTMLButtonElement>('root')

const { size, connected, isToggle, isSelected, corners, onClick } = useButton(props, selectedModel, root)

interface SizeSpec {
  height: string
  icon: string
  /** Icon + leading/trailing space, per width */
  widths: Record<IconButtonWidth, string>
  /** Outline width, with the state layer grown to cover it */
  outline: string
}

// Widths: XS 4/6/10dp, S 4/8/14, M 12/16/24, L 16/32/48, XL 32/48/72 space each side.
const sizes: Record<ButtonSize, SizeSpec> = {
  xs: {
    height: 'h-8',
    icon: 'size-5',
    widths: { narrow: 'w-7', default: 'w-8', wide: 'w-10' },
    outline: 'border before:-inset-px',
  },
  s: {
    height: 'h-10',
    icon: 'size-6',
    widths: { narrow: 'w-8', default: 'w-10', wide: 'w-13' },
    outline: 'border before:-inset-px',
  },
  m: {
    height: 'h-14',
    icon: 'size-6',
    widths: { narrow: 'w-12', default: 'w-14', wide: 'w-18' },
    outline: 'border before:-inset-px',
  },
  l: {
    height: 'h-24',
    icon: 'size-8',
    widths: { narrow: 'w-16', default: 'w-24', wide: 'w-32' },
    outline: 'border-2 before:-inset-0.5',
  },
  xl: {
    height: 'h-34',
    icon: 'size-10',
    widths: { narrow: 'w-26', default: 'w-34', wide: 'w-46' },
    outline: 'border-3 before:-inset-[3px]',
  },
}

type ColorState = 'default' | 'unselected' | 'selected'

const colors: Record<IconButtonVariant, Record<ColorState, string>> = {
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
  standard: {
    default: 'text-on-surface-variant',
    unselected: 'text-on-surface-variant',
    selected: 'text-primary',
  },
}

const spec = computed(() => sizes[size.value])

const classes = computed(() => {
  const small = size.value === 'xs' || size.value === 's'
  const state: ColorState = isToggle.value ? (isSelected.value ? 'selected' : 'unselected') : 'default'

  // Disabled container: on-surface @ 10%. Standard and unselected outlined
  // buttons have no container, so only their icon fades.
  const noContainer =
    props.variant === 'standard' || (props.variant === 'outlined' && state !== 'selected')

  return [
    spec.value.height,
    spec.value.widths[props.width],
    props.variant === 'outlined' && spec.value.outline,
    small && touchTargetClasses,
    // Connected XS/S groups: 48dp minimum width
    connected.value && small && 'min-w-12',
    colors[props.variant][state],
    !noContainer && 'disabled:bg-on-surface/10',
  ]
})
</script>

<template>
  <button
    ref="root"
    :type="type"
    :disabled="disabled"
    :aria-label="label"
    :aria-pressed="isToggle ? isSelected : undefined"
    :style="corners"
    :class="[buttonBaseClasses, classes]"
    @click="onClick"
  >
    <span :class="['inline-flex shrink-0 *:size-full', spec.icon]" aria-hidden="true">
      <slot :selected="isSelected" />
    </span>
  </button>
</template>
