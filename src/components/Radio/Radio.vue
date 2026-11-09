<script setup lang="ts">
/**
 * Material 3 radio button.
 * Spec: https://m3.material.io/components/radio-button/specs
 * Tokens: md.comp.radio-button
 *
 * Wraps a native <input type="radio">, so forms, labels and arrow-key navigation work as usual.
 * - `v-model` is the group's value; the radio is selected when it equals `value`.
 * - Give radios in a group the same `name` so the browser handles arrow keys between them.
 * - The default slot is the label (color on-surface).
 *
 * Attributes such as name, id and required go to the input; class and style to the root.
 */
import { computed, nextTick, useAttrs, useTemplateRef } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** This radio's value; it's selected when `v-model` equals it. */
    value: unknown
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const model = defineModel<unknown>()

const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const input = useTemplateRef<HTMLInputElement>('input')
const checked = computed(() => model.value === props.value)

function onChange() {
  model.value = props.value
  // If the parent rejected the change, Vue won't patch the input, so put it back in sync.
  nextTick(() => {
    if (input.value) input.value.checked = checked.value
  })
}

// One place picks every color, so no two classes for the same property apply together.
const look = computed(() => {
  if (props.disabled) return { icon: 'text-on-surface/38', layer: '' }
  return checked.value
    ? { icon: 'text-primary', layer: 'bg-primary peer-active:bg-on-surface' }
    : {
        icon: 'text-on-surface-variant peer-hover:text-on-surface peer-focus-visible:text-on-surface peer-active:text-on-surface',
        layer: 'bg-on-surface peer-active:bg-primary',
      }
})
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
        v-bind="inputAttrs"
        type="radio"
        :checked="checked"
        :disabled="disabled"
        class="peer absolute inset-0 m-0 cursor-[inherit] appearance-none opacity-0"
        @change="onChange"
      />

      <!-- State layer: 40dp circle; hover 8%, focus/pressed 10%. Pressed shows the state it's about to become. -->
      <span
        v-if="!disabled"
        :class="[
          'pointer-events-none absolute size-10 rounded-full opacity-0 transition-opacity',
          'peer-hover:opacity-8 peer-focus-visible:opacity-10 peer-active:opacity-10',
          look.layer,
        ]"
      />

      <!--
        Icon: 20dp ring with a 2dp stroke, and a 10dp dot that springs in (fast spatial).
        Colors change with default effects, except when disabled (they snap).
      -->
      <span
        :class="[
          'pointer-events-none relative inline-flex size-5 items-center justify-center rounded-full border-2 border-current',
          disabled
            ? ''
            : 'transition-colors duration-(--duration-effects-default) ease-effects-default motion-reduce:transition-none',
          // Focus indicator: 3dp secondary, 2dp outer offset
          'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-secondary peer-focus-visible:outline-solid',
          look.icon,
        ]"
      >
        <span
          :class="[
            'size-2.5 rounded-full bg-current',
            'transition-[scale] duration-(--duration-spring-fast-spatial) ease-spring-fast-spatial motion-reduce:transition-none',
            checked ? 'scale-100' : 'scale-0',
          ]"
        />
      </span>
    </span>

    <span v-if="$slots.default" class="pe-2">
      <slot />
    </span>
  </label>
</template>
