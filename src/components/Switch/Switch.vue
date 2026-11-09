<script setup lang="ts">
/**
 * Material 3 switch.
 * Spec: https://m3.material.io/components/switch/specs
 * Tokens: md.comp.switch
 *
 * Wraps a native <input type="checkbox" role="switch">, so forms, labels and keyboard work as usual.
 * - `v-model` as a boolean.
 * - `icons`: 'none' (default), 'selected' (check when on) or 'both' (check when on, × when off).
 *   Override the glyphs with the `selected-icon` / `unselected-icon` slots.
 * - The default slot is the label, shown before the switch (color on-surface).
 *
 * Attributes such as name, id and required go to the input; class and style to the root.
 */
import { computed, nextTick, useAttrs, useTemplateRef } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    icons?: 'none' | 'selected' | 'both'
    disabled?: boolean
  }>(),
  {
    icons: 'none',
    disabled: false,
  },
)

const model = defineModel<boolean>({ default: false })

const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const input = useTemplateRef<HTMLInputElement>('input')

function onChange(e: Event) {
  model.value = (e.target as HTMLInputElement).checked
  // If the parent rejected the change, Vue won't patch the input, so put it back in sync.
  nextTick(() => {
    if (input.value) input.value.checked = model.value
  })
}

const showSelectedIcon = computed(() => props.icons !== 'none')
const showUnselectedIcon = computed(() => props.icons === 'both')

// One place picks every color, so no two classes for the same property apply together.
const look = computed(() => {
  const on = model.value
  if (props.disabled) {
    return on
      ? {
          track: 'bg-on-surface/12 border-transparent',
          handle: 'bg-surface',
          icon: 'text-on-surface/38',
          layer: '',
        }
      : {
          track: 'bg-surface-container-highest/12 border-on-surface/12',
          handle: 'bg-on-surface/38',
          icon: 'text-surface-container-highest/38',
          layer: '',
        }
  }
  return on
    ? {
        track: 'bg-primary border-primary',
        handle:
          'bg-on-primary peer-hover:bg-primary-container peer-focus-visible:bg-primary-container peer-active:bg-primary-container',
        icon: 'text-primary',
        layer: 'bg-primary',
      }
    : {
        track: 'bg-surface-container-highest border-outline',
        handle:
          'bg-outline peer-hover:bg-on-surface-variant peer-focus-visible:bg-on-surface-variant peer-active:bg-on-surface-variant',
        icon: 'text-surface-container-highest',
        layer: 'bg-on-surface',
      }
})

// Handle: 16dp off, 24dp on or with an icon, 28dp while pressed.
const handleSize = computed(() => {
  const base = model.value || showUnselectedIcon.value ? 'size-6' : 'size-4'
  return props.disabled ? base : `${base} peer-active:size-7`
})

// Handle and state layer are centred 16dp from either end of the 52dp track.
const position = computed(() =>
  model.value ? 'translate-x-[calc(-50%+20px)]' : '-translate-x-1/2',
)

</script>

<template>
  <label
    v-bind="rootAttrs"
    :class="[
      'inline-flex items-center gap-4 text-on-surface',
      disabled ? 'cursor-default text-on-surface/38' : 'cursor-pointer',
    ]"
  >
    <span v-if="$slots.default">
      <slot />
    </span>

    <!-- 52 × 48dp target around the 52 × 32dp track -->
    <span class="relative inline-flex h-12 w-13 shrink-0">
      <input
        ref="input"
        v-bind="inputAttrs"
        type="checkbox"
        role="switch"
        :checked="model"
        :disabled="disabled"
        class="peer absolute inset-0 m-0 cursor-[inherit] appearance-none opacity-0"
        @change="onChange"
      />

      <!-- Track: 52 × 32dp, full corners, 2dp outline when unselected -->
      <span
        :class="[
          'pointer-events-none absolute top-2 left-0 h-8 w-13 rounded-full border-2',
          '[transition:background-color_var(--duration-effects-fast)_var(--ease-effects-fast),border-color_var(--duration-effects-fast)_var(--ease-effects-fast)] motion-reduce:transition-none',
          // Focus indicator: 3dp secondary, 2dp outer offset
          'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-secondary peer-focus-visible:outline-solid',
          look.track,
        ]"
      />

      <!-- State layer: 40dp circle around the handle; hover 8%, focus/pressed 10% -->
      <span
        v-if="!disabled"
        :class="[
          'pointer-events-none absolute top-1/2 left-4 size-10 -translate-y-1/2 rounded-full opacity-0',
          'peer-hover:opacity-8 peer-focus-visible:opacity-10 peer-active:opacity-10',
          '[transition:translate_var(--duration-spring-fast-spatial)_var(--ease-spring-fast-spatial),opacity_var(--duration-effects-fast)_var(--ease-effects-fast),background-color_var(--duration-effects-fast)_var(--ease-effects-fast)] motion-reduce:transition-none',
          position,
          look.layer,
        ]"
      />

      <!-- Handle: position and size follow the fast spatial spring; colors use fast effects -->
      <span
        :class="[
          'pointer-events-none absolute top-1/2 left-4 flex -translate-y-1/2 items-center justify-center rounded-full',
          '[transition:translate_var(--duration-spring-fast-spatial)_var(--ease-spring-fast-spatial),width_var(--duration-spring-fast-spatial)_var(--ease-spring-fast-spatial),height_var(--duration-spring-fast-spatial)_var(--ease-spring-fast-spatial),background-color_var(--duration-effects-fast)_var(--ease-effects-fast)] motion-reduce:transition-none',
          position,
          handleSize,
          look.handle,
        ]"
      >
        <!-- Icons: 16dp, faded and scaled in -->
        <span
          v-for="icon in (['selected', 'unselected'] as const)"
          :key="icon"
          :class="[
            'absolute inline-flex size-4 fill-current *:size-full',
            '[transition:opacity_var(--duration-effects-fast)_var(--ease-effects-fast),scale_var(--duration-effects-fast)_var(--ease-effects-fast),color_var(--duration-effects-fast)_var(--ease-effects-fast)] motion-reduce:transition-none',
            (icon === 'selected' ? model && showSelectedIcon : !model && showUnselectedIcon)
              ? 'scale-100 opacity-100'
              : 'scale-50 opacity-0',
            look.icon,
          ]"
          aria-hidden="true"
        >
          <slot v-if="icon === 'selected'" name="selected-icon">
            <!-- Material Symbols check -->
            <svg viewBox="0 -960 960 960"><path d="M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z" /></svg>
          </slot>
          <slot v-else name="unselected-icon">
            <!-- Material Symbols close -->
            <svg viewBox="0 -960 960 960">
              <path
                d="m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"
              />
            </svg>
          </slot>
        </span>
      </span>
    </span>
  </label>
</template>
