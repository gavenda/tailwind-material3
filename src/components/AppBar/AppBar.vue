<script setup lang="ts">
/**
 * Material 3 Expressive app bar: small, medium flexible, large flexible, or search.
 * Spec: https://m3.material.io/components/app-bars/specs
 * Tokens: md.comp.app-bar, md.comp.app-bar.{small,medium-flexible,large-flexible}
 *
 * - Slots: `leading` (navigation IconButton), default (title), `subtitle`,
 *   `trailing` (action IconButtons, avatar), `search` (search variant: e.g. a SearchBar).
 * - `scrolled`: set it while content is scrolled under the bar. The container fills with
 *   surface-container (no shadow), and flexible bars collapse to the small layout.
 * - `centered`: small bar with a centred title.
 */
import { computed, useSlots } from 'vue'

export type AppBarVariant = 'small' | 'medium-flexible' | 'large-flexible' | 'search'

const props = withDefaults(
  defineProps<{
    variant?: AppBarVariant
    scrolled?: boolean
    centered?: boolean
  }>(),
  {
    variant: 'small',
    scrolled: false,
    centered: false,
  },
)

const slots = useSlots()
const flexible = computed(() => props.variant === 'medium-flexible' || props.variant === 'large-flexible')
const expanded = computed(() => flexible.value && !props.scrolled)
const hasSubtitle = computed(() => !!slots.subtitle)

// Flexible title area below the 64dp top row: medium 48 (72 with subtitle), large 56 (88).
const expandedTitle = computed(() =>
  props.variant === 'large-flexible'
    ? { title: 'font-brand text-display-small', subtitle: 'text-title-medium', area: hasSubtitle.value ? 'h-22' : 'h-14' }
    : { title: 'font-brand text-headline-medium', subtitle: 'text-label-large', area: hasSubtitle.value ? 'h-18' : 'h-12' },
)
</script>

<template>
  <header
    :class="[
      'flex w-full flex-col font-plain transition-colors duration-(--duration-effects-default) ease-effects-default',
      scrolled ? 'bg-surface-container' : 'bg-surface',
    ]"
  >
    <!-- Top row: 64dp, 4dp side padding; icon buttons sit edge to edge. -->
    <div :class="['relative flex h-16 items-center', variant === 'search' ? 'gap-2 px-2' : 'px-1']">
      <div v-if="$slots.leading" class="flex shrink-0 items-center text-on-surface">
        <slot name="leading" />
      </div>

      <div v-if="variant === 'search'" class="flex min-w-0 flex-1 items-center">
        <slot name="search" />
      </div>

      <!-- Small title; flexible bars show it only once collapsed. -->
      <div
        v-else
        :class="[
          'flex min-w-0 flex-1 flex-col transition-opacity duration-(--duration-effects-fast)',
          centered ? 'absolute inset-x-16 items-center text-center' : $slots.leading ? 'ps-1' : 'ps-3',
          expanded ? 'pointer-events-none opacity-0' : 'opacity-100',
        ]"
        :aria-hidden="expanded || undefined"
      >
        <span class="truncate text-title-large text-on-surface"><slot /></span>
        <span v-if="hasSubtitle" class="truncate text-label-medium text-on-surface-variant"><slot name="subtitle" /></span>
      </div>

      <div v-if="$slots.trailing" class="ms-auto flex shrink-0 items-center text-on-surface-variant">
        <slot name="trailing" />
      </div>
    </div>

    <!-- Flexible title area: collapses (grid track 1fr → 0fr) while scrolled. -->
    <div
      v-if="flexible"
      :class="[
        'grid transition-[grid-template-rows,opacity] duration-(--duration-spring-default-spatial) ease-spring-default-spatial motion-reduce:transition-none',
        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      ]"
      :aria-hidden="!expanded || undefined"
    >
      <div class="overflow-hidden">
        <div :class="['flex flex-col justify-end px-4 pb-3', expandedTitle.area]">
          <h1 :class="['truncate text-on-surface', expandedTitle.title]"><slot /></h1>
          <p v-if="hasSubtitle" :class="['truncate text-on-surface-variant', expandedTitle.subtitle]">
            <slot name="subtitle" />
          </p>
        </div>
      </div>
    </div>
  </header>
</template>
