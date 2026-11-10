<script setup lang="ts">
/**
 * Destination in a NavigationBar or NavigationRail.
 * Tokens: md.comp.nav-bar.item.{vertical,horizontal}, md.comp.nav-rail.item.{vertical,horizontal}
 *
 * - `value` is matched against the parent's `v-model`; or set `active` yourself (e.g. from the router).
 * - Slots: `icon`, optional `active-icon` (e.g. the filled version), and the label.
 * - `badge`: true for a small badge, or a number/string for a large one.
 * - `as`/`href` render a link (RouterLink, 'a') instead of a button.
 */
import { computed, inject, useTemplateRef, type Component } from 'vue'
import Badge from '../Badge/Badge.vue'
import { useBadge, type BadgeProp } from '../Badge/useBadge'
import { navKey, type NavValue } from './context'
import { vRipple } from '../../internal/ripple'

const props = withDefaults(
  defineProps<{
    value?: NavValue
    label: string
    active?: boolean
    badge?: BadgeProp
    as?: string | Component
    disabled?: boolean
  }>(),
  {
    value: undefined,
    active: undefined,
    badge: undefined,
    as: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const nav = inject(navKey, null)
const isActive = computed(() => props.active ?? nav?.isActive(props.value) ?? false)
const horizontal = computed(() => nav?.layout === 'horizontal')
const rail = computed(() => nav?.container === 'rail')
const element = computed(() => props.as ?? 'button')

// The ripple is drawn in the indicator pill, like the state layer.
const indicator = useTemplateRef<HTMLElement>('indicator')
const ripple = { host: () => indicator.value }

function onClick(e: MouseEvent) {
  nav?.select(props.value)
  emit('click', e)
}

const { hasBadge, badgeValue } = useBadge(() => props.badge)

/** Rail label cross-fade (see the template): out fast, in once there's room. */
const labelFadeOut = 'transition-opacity duration-(--duration-effects-fast) ease-effects-fast motion-reduce:transition-none'
const verticalLabelOut = `${labelFadeOut} absolute! start-0 bottom-1.5`
const labelFade = {
  enterFromClass: 'opacity-0',
  enterActiveClass:
    'transition-opacity duration-(--duration-effects-default) ease-effects-default delay-100 motion-reduce:transition-none',
  leaveToClass: 'opacity-0',
}
</script>

<template>
  <component
    :is="element"
    v-ripple="ripple"
    :type="element === 'button' ? 'button' : undefined"
    :disabled="element === 'button' ? disabled : undefined"
    :aria-current="isActive ? 'page' : undefined"
    :class="[
      'group relative flex cursor-pointer font-plain no-underline select-none focus:outline-none',
      'disabled:pointer-events-none disabled:opacity-38',
      rail
        ? [
            // Rail: the target spans the rail's width; the indicator is placed by its margin,
            // so it keeps its 20dp leading edge (and the icon its 36dp) collapsed or expanded.
            'w-full flex-col items-start justify-center',
            'transition-[height] duration-(--duration-spring-default-spatial) ease-spring-default-spatial motion-reduce:transition-none',
            horizontal ? 'h-14' : 'h-16 gap-1',
          ]
        : horizontal
          ? 'h-full flex-1 items-center justify-center'
          : 'h-full flex-1 flex-col items-center justify-center gap-1',
    ]"
    @click="onClick"
  >
    <!--
      Active indicator: secondary-container pill. Vertical: 56×32 around the icon.
      Horizontal: wraps icon and label (bar 40dp tall, rail 56dp, hugging its contents).
      It also carries the state layer, the ripple and the focus ring.
      In a rail it morphs between the two with the default spatial spring as the rail expands.
    -->
    <span
      ref="indicator"
      :class="[
        'relative flex items-center justify-center rounded-full',
        'group-focus-visible:outline-3 group-focus-visible:outline-solid group-focus-visible:outline-secondary',
        // State layer and ripple: on-secondary-container for active and inactive items alike
        // (md.comp.nav-{bar,rail}.item.{active,inactive}.*.state-layer.color).
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-on-secondary-container before:opacity-0 before:transition-opacity',
        'group-hover:before:opacity-8 group-focus-visible:before:opacity-10 [--ripple-color:var(--color-on-secondary-container)]',
        rail
          ? [
              'px-4 transition-[width,height,margin,gap] duration-(--duration-spring-default-spatial) ease-spring-default-spatial motion-reduce:transition-none',
              // Clips the label sideways while the pill narrows; badges can still overflow vertically.
              'overflow-x-clip',
              // The rail sets the inset: the leading edge stays at 20dp (the collapsed pill's
              // centred position), so the icon doesn't move while the rail expands.
              'ms-(--rail-indicator-inset,0.75rem)',
              horizontal ? 'h-14 w-fit gap-2' : 'h-8 w-14 gap-0',
            ]
          : horizontal
            ? 'h-10 gap-1 px-4'
            : 'h-8 w-14',
        isActive ? 'text-on-secondary-container' : 'text-on-surface-variant',
      ]"
    >
      <!-- The fill grows from the centre when the item becomes active. -->
      <span
        :class="[
          'absolute inset-0 rounded-[inherit] bg-secondary-container transition-[scale,opacity] duration-(--duration-spring-fast-spatial) ease-spring-fast-spatial motion-reduce:transition-none',
          isActive ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0',
        ]"
      />
      <Badge v-if="hasBadge" :value="badgeValue" class="relative">
        <span class="inline-flex size-6 *:size-full" aria-hidden="true">
          <slot v-if="isActive && $slots['active-icon']" name="active-icon" />
          <slot v-else name="icon" />
        </span>
      </Badge>
      <span v-else class="relative inline-flex size-6 *:size-full" aria-hidden="true">
        <slot v-if="isActive && $slots['active-icon']" name="active-icon" />
        <slot v-else name="icon" />
      </span>
      <!--
        Rail labels cross-fade as the rail expands or collapses: the outgoing one fades out fast
        (taken out of the layout, where it was), the incoming one fades in once there's room.
      -->
      <!-- Leaving, it stays in the layout so the pill shrinks from its full width, clipped as it goes. -->
      <Transition v-bind="rail ? { ...labelFade, leaveActiveClass: labelFadeOut } : undefined" :css="rail">
        <span
          v-if="horizontal"
          :class="['relative truncate whitespace-nowrap', rail ? 'text-label-large' : 'text-label-medium']"
        >
          {{ label }}
        </span>
      </Transition>
    </span>
    <!--
      Leaving, it's taken out of the layout where it sat (centred under the pill, across the
      collapsed item's width), so the row can shrink to 56dp without the label drifting.
    -->
    <Transition v-bind="rail ? { ...labelFade, leaveActiveClass: verticalLabelOut } : undefined" :css="rail">
      <span
        v-if="!horizontal"
        :class="[
          'text-label-medium',
          // The collapsed item's width, so it stays centred under the pill as the rail widens.
          rail && 'w-[calc(var(--rail-indicator-inset,0.75rem)*2+3.5rem)] text-center',
          isActive ? 'text-secondary' : 'text-on-surface-variant',
        ]"
      >
        {{ label }}
      </span>
    </Transition>
  </component>
</template>
