<script setup lang="ts">
/**
 * Item in an Expressive Menu.
 * Tokens: md.comp.menus.menu-item, md.comp.menus.{standard,vibrant}.menu-item
 *
 * - Slots: `icon` (leading, 20dp), default (label), `trailing-icon` (20dp).
 * - `supportingText` goes under the label; `trailingText` (e.g. a shortcut) at the end.
 * - Set `selected` (true/false) to make it a checkable item (menuitemcheckbox);
 *   selected items get a tertiary container and fully rounded 12dp corners.
 * - Clicking closes the menu unless `keepOpen`. Listen with @click.
 */
import { computed, inject } from 'vue'
import { focusRingInset } from '../../internal/classes'
import { menuKey } from './context'

const props = withDefaults(
  defineProps<{
    /** Leave undefined for a plain action; true/false makes it checkable. */
    selected?: boolean
    supportingText?: string
    trailingText?: string
    disabled?: boolean
    /** Don't close the menu when clicked (e.g. for toggles). */
    keepOpen?: boolean
  }>(),
  {
    selected: undefined,
    supportingText: undefined,
    trailingText: undefined,
    disabled: false,
    keepOpen: false,
  },
)

const menu = inject(menuKey, null)
const vibrant = computed(() => menu?.variant === 'vibrant')
const isSelected = computed(() => props.selected === true)

// Label color drives the state layer (bg-current); icons and supporting text are set separately.
const colors = computed(() => {
  if (vibrant.value) {
    return isSelected.value
      ? { item: 'bg-tertiary text-on-tertiary', muted: 'text-on-tertiary' }
      : { item: 'text-on-tertiary-container', muted: 'text-on-tertiary-container' }
  }
  return isSelected.value
    ? { item: 'bg-tertiary-container text-on-tertiary-container', muted: 'text-on-tertiary-container' }
    : { item: 'text-on-surface', muted: 'text-on-surface-variant' }
})

function onClick() {
  if (!props.keepOpen) menu?.close()
}
</script>

<template>
  <button
    type="button"
    :role="selected === undefined ? 'menuitem' : 'menuitemcheckbox'"
    :aria-checked="selected === undefined ? undefined : selected"
    :disabled="disabled"
    tabindex="-1"
    :class="[
      'relative flex min-h-11 w-full shrink-0 cursor-pointer items-center gap-2 px-3 py-2 text-start shape-morph',
      // 4dp corners; the group's first and last items get 12dp outer corners; selected: 12dp all round.
      isSelected ? 'rounded-[12px]' : 'rounded-[4px] first-of-type:rounded-t-[12px] last-of-type:rounded-b-[12px]',
      focusRingInset,
      // State layer: hover 8%, focus/pressed 10%
      'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
      'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
      'disabled:pointer-events-none disabled:opacity-38',
      colors.item,
    ]"
    @click="onClick"
  >
    <span v-if="$slots.icon" :class="['inline-flex size-5 shrink-0 *:size-full', colors.muted]" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span class="flex min-w-0 flex-1 flex-col">
      <span class="text-label-large"><slot /></span>
      <span v-if="supportingText" :class="['text-body-small', colors.muted]">{{ supportingText }}</span>
    </span>
    <span v-if="trailingText" :class="['shrink-0 text-label-large', colors.muted]">{{ trailingText }}</span>
    <span
      v-if="$slots['trailing-icon']"
      :class="['inline-flex size-5 shrink-0 *:size-full', colors.muted]"
      aria-hidden="true"
    >
      <slot name="trailing-icon" />
    </span>
  </button>
</template>
