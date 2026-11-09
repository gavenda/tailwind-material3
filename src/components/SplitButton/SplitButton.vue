<script setup lang="ts">
/**
 * Material 3 Expressive split button.
 * Spec: https://m3.material.io/components/split-button/specs
 * Tokens: md.comp.split-button.{xsmall,small,medium,large,xlarge}
 *       + md.comp.button.{elevated,filled,tonal,outlined}
 *
 * A primary action (leading button) joined to a menu of related actions (trailing
 * button), 2dp apart with tight inner corners. While the menu is open the trailing
 * button becomes a circle and its arrow flips.
 * - Default slot: leading label; `icon` slot: its icon. Listen to @click for the action.
 * - `menu` slot: MenuItems / MenuGroups. `v-model:open` controls the menu.
 */
import { computed, useTemplateRef } from 'vue'
import Button from '../Button/Button.vue'
import type { ButtonSize, ButtonVariant } from '../Button/types'
import { shapeTokens } from '../Button/useButton'
import { iconPaths } from '../../internal/icons'
import Menu from '../Menu/Menu.vue'
import type { MenuVariant } from '../Menu/context'

export type SplitButtonVariant = Exclude<ButtonVariant, 'text'>

const props = withDefaults(
  defineProps<{
    variant?: SplitButtonVariant
    size?: ButtonSize
    /** Accessible name of the trailing (menu) button. */
    menuLabel?: string
    menuVariant?: MenuVariant
    disabled?: boolean
  }>(),
  {
    variant: 'filled',
    size: 's',
    menuLabel: 'More options',
    menuVariant: 'standard',
    disabled: false,
  },
)

const emit = defineEmits<{ click: [e: MouseEvent] }>()
const open = defineModel<boolean>('open', { default: false })

const group = useTemplateRef<HTMLElement>('group')
const menu = useTemplateRef<InstanceType<typeof Menu>>('menu')
const trailingEl = computed(() => (group.value?.children[1] as HTMLElement | undefined) ?? null)

interface SizeSpec {
  /** Inner corner (4/4/4/8/12dp) */
  inner: number
  /** Trailing button side padding and icon size */
  trailing: string
  icon: string
}

const sizes: Record<ButtonSize, SizeSpec> = {
  xs: { inner: 4, trailing: 'px-[13px]!', icon: 'size-[22px]' },
  s: { inner: 4, trailing: 'px-[13px]!', icon: 'size-[22px]' },
  m: { inner: 4, trailing: 'px-[15px]!', icon: 'size-[26px]' },
  l: { inner: 8, trailing: 'px-[29px]!', icon: 'size-[38px]' },
  xl: { inner: 12, trailing: 'px-[43px]!', icon: 'size-[50px]' },
}

const spec = computed(() => sizes[props.size])
const pill = computed(() => `${shapeTokens[props.size].height / 2}px`)

// Override Button's corner variables: outer corners stay round, inner corners stay tight.
const leadingCorners = computed(() => {
  const inner = `${spec.value.inner}px`
  return { '--corner-s': pill.value, '--corner-s-pressed': pill.value, '--corner-e': inner, '--corner-e-pressed': inner }
})
const trailingCorners = computed(() => {
  const inner = open.value ? pill.value : `${spec.value.inner}px`
  return { '--corner-s': inner, '--corner-s-pressed': inner, '--corner-e': pill.value, '--corner-e-pressed': pill.value }
})

// The Menu's toggle ignores the click that just light-dismissed it.
function toggle() {
  menu.value?.toggle()
}
</script>

<template>
  <div ref="group" role="group" class="inline-flex gap-0.5">
    <Button
      :variant="variant"
      :size="size"
      :disabled="disabled"
      :style="leadingCorners"
      @click="(e: MouseEvent) => emit('click', e)"
    >
      <template v-if="$slots.icon" #icon><slot name="icon" /></template>
      <slot />
    </Button>
    <Button
      :variant="variant"
      :size="size"
      :disabled="disabled"
      :aria-label="menuLabel"
      aria-haspopup="menu"
      :aria-expanded="open"
      :style="trailingCorners"
      :class="spec.trailing"
      @click="toggle"
    >
      <svg
        viewBox="0 -960 960 960"
        fill="currentColor"
        aria-hidden="true"
        :class="[
          'shrink-0 transition-transform duration-(--duration-spring-fast-spatial) ease-spring-fast-spatial motion-reduce:transition-none',
          spec.icon,
          open && 'rotate-180',
        ]"
      >
        <path :d="iconPaths.keyboardArrowDown" />
      </svg>
    </Button>
    <Menu ref="menu" v-model:open="open" :anchor="trailingEl" :variant="menuVariant" placement="bottom-end">
      <slot name="menu" />
    </Menu>
  </div>
</template>
