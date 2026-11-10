<script setup lang="ts">
/**
 * Material 3 checkbox.
 * Spec: https://m3.material.io/components/checkbox/specs
 * Tokens: md.comp.checkbox
 *
 * Wraps a native <input type="checkbox">, so forms, labels and keyboard work as usual.
 * - `v-model` as a boolean, or as an array with `value` for a group.
 * - `v-model:indeterminate` for a mixed state; clicking clears it.
 * - The default slot is the label (color on-surface, per spec).
 *
 * Attributes such as name, id and required go to the input; class and style to the root.
 */
import { computed, nextTick, useAttrs, useTemplateRef, watchEffect } from 'vue'
import { vRipple } from '../../internal/ripple'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Item value when `v-model` is an array. */
    value?: unknown
    error?: boolean
    disabled?: boolean
  }>(),
  {
    value: undefined,
    error: false,
    disabled: false,
  },
)

const model = defineModel<boolean | unknown[]>({ default: false })
const indeterminate = defineModel<boolean>('indeterminate', { default: false })

const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const input = useTemplateRef<HTMLInputElement>('input')
const rippleHost = useTemplateRef<HTMLElement>('rippleHost')
const ripple = { host: () => rippleHost.value }

const checked = computed(() =>
  Array.isArray(model.value) ? model.value.includes(props.value) : model.value,
)

// :indeterminate is a DOM property, not an attribute.
watchEffect(() => {
  if (input.value) input.value.indeterminate = indeterminate.value
})

function onChange(e: Event) {
  const on = (e.target as HTMLInputElement).checked
  indeterminate.value = false
  if (Array.isArray(model.value)) {
    const rest = model.value.filter((v) => v !== props.value)
    model.value = on ? [...rest, props.value] : rest
  } else {
    model.value = on
  }
  // The browser already flipped the input. If the bound value ends up unchanged
  // (e.g. the parent rejected it), Vue won't patch it, so put it back in sync.
  nextTick(() => {
    if (input.value) input.value.checked = checked.value
  })
}

const selected = computed(() => checked.value || indeterminate.value)

// One place picks every color, so no two classes for the same property apply together.
// The fill and mark colors don't depend on `selected`, so they keep their color
// while animating out.
const look = computed(() => {
  const sel = selected.value
  if (props.disabled) {
    return {
      outline: sel ? 'border-transparent' : 'border-on-surface/38',
      fill: 'bg-on-surface/38',
      mark: 'text-surface',
      layer: '',
      ripple: '',
    }
  }
  if (props.error) {
    return {
      outline: sel ? 'border-transparent' : 'border-error',
      fill: 'bg-error',
      mark: 'text-on-error',
      layer: 'bg-error',
      ripple: 'text-error',
    }
  }
  return {
    outline: sel
      ? 'border-transparent'
      : 'border-on-surface-variant peer-hover:border-on-surface peer-focus-visible:border-on-surface peer-data-pressed:border-on-surface',
    fill: 'bg-primary',
    mark: 'text-on-primary',
    layer: sel ? 'bg-primary' : 'bg-on-surface',
    // The pressed ripple shows the state it's about to become.
    ripple: sel ? 'text-on-surface' : 'text-primary',
  }
})

// The mark is revealed left to right (the direction it's drawn) and hidden in reverse.
const reveal = (shown: boolean) => (shown ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(0_100%_0_0)]')
</script>

<template>
  <label
    v-bind="rootAttrs"
    :class="[
      'inline-flex items-center text-on-surface',
      disabled ? 'cursor-default text-on-surface/38' : 'cursor-pointer',
    ]"
  >
    <!-- 48dp target -->
    <span class="relative inline-flex size-12 shrink-0 items-center justify-center">
      <input
        ref="input"
        v-ripple="ripple"
        v-bind="inputAttrs"
        type="checkbox"
        :checked="checked"
        :value="value"
        :disabled="disabled"
        :aria-invalid="error || undefined"
        class="peer absolute inset-0 m-0 cursor-[inherit] appearance-none opacity-0"
        @change="onChange"
      />

      <!-- State layer: 40dp circle; hover 8%, focus 10% -->
      <span
        v-if="!disabled"
        :class="[
          'pointer-events-none absolute size-10 rounded-full opacity-0 transition-opacity',
          'peer-hover:opacity-8 peer-focus-visible:opacity-10',
          look.layer,
        ]"
      />
      <!-- Pressed: a ripple in the same circle -->
      <span v-if="!disabled" ref="rippleHost" :class="['pointer-events-none absolute size-10 rounded-full', look.ripple]" />

      <!-- Container: 18dp, 2dp corners, 2dp outline when unselected -->
      <span
        :class="[
          'pointer-events-none relative inline-flex size-4.5 items-center justify-center rounded-[2px] border-2',
          'transition-[border-color] duration-(--duration-effects-fast) ease-effects-fast motion-reduce:transition-none',
          // Focus indicator: 3dp secondary, 2dp outer offset
          'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-secondary peer-focus-visible:outline-solid',
          look.outline,
        ]"
      >
        <!--
          Fill: grows in from the center (fast effects), covering the outline.
          The marks live inside it, so they can never show without the fill.
        -->
        <span
          :class="[
            'absolute -inset-0.5 flex items-center justify-center rounded-[inherit]',
            'transition-[scale,opacity] duration-(--duration-effects-fast) ease-effects-fast motion-reduce:transition-none',
            selected ? 'scale-100 opacity-100' : 'scale-60 opacity-0',
            look.fill,
          ]"
        >
          <!--
            Marks: Material Symbols check_small / check_indeterminate_small, drawn at 24px
            and thickened to 2dp. Always rendered so the reveal can animate (default effects).
          -->
          <svg
            v-for="mark in (['check', 'dash'] as const)"
            :key="mark"
            :class="[
              'absolute size-6 shrink-0',
              'transition-[clip-path] duration-(--duration-effects-default) ease-effects-default motion-reduce:transition-none',
              reveal(mark === 'dash' ? indeterminate : checked && !indeterminate),
              look.mark,
            ]"
            viewBox="0 -960 960 960"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="20"
            aria-hidden="true"
          >
            <path v-if="mark === 'dash'" d="M240-450v-60h480v60H240Z" />
            <path v-else d="M400-318 247-471l42-42 111 111 271-271 42 42-313 313Z" />
          </svg>
        </span>
      </span>
    </span>

    <span v-if="$slots.default" class="pe-2">
      <slot />
    </span>
  </label>
</template>
