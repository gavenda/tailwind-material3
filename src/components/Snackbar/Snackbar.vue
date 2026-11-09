<script setup lang="ts">
/**
 * Material 3 snackbar.
 * Spec: https://m3.material.io/components/snackbar/specs
 * Tokens: md.comp.snackbar
 *
 * A short message at the bottom of the screen, with an optional action and close button.
 * - `v-model:open` shows it. It hides itself after `timeout` ms (0 keeps it open);
 *   hovering or focusing it pauses the timer.
 * - `message` (or the default slot), `actionLabel` (emits `action`, then closes),
 *   `closable` adds a close icon button. `longAction` puts the action on its own line.
 * - It's announced politely to screen readers.
 * Show one at a time; queue them in your app if needed.
 */
import { onBeforeUnmount, watch } from 'vue'
import { iconPaths } from '../../internal/icons'

const props = withDefaults(
  defineProps<{
    message?: string
    actionLabel?: string
    closable?: boolean
    closeLabel?: string
    /** Auto-hide delay in ms; 0 to stay until dismissed. */
    timeout?: number
    longAction?: boolean
  }>(),
  {
    message: undefined,
    actionLabel: undefined,
    closable: false,
    closeLabel: 'Dismiss',
    timeout: 4000,
    longAction: false,
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ action: []; closed: [] }>()

let timer: ReturnType<typeof setTimeout> | undefined

function startTimer() {
  clearTimeout(timer)
  if (props.timeout > 0 && open.value) timer = setTimeout(() => (open.value = false), props.timeout)
}
const pause = () => clearTimeout(timer)

watch(
  open,
  (on) => {
    if (on) startTimer()
    else clearTimeout(timer)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(timer))

function onAction() {
  emit('action')
  open.value = false
}
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"
  >
    <Transition
      enter-from-class="opacity-0 translate-y-2 scale-95"
      leave-to-class="opacity-0"
      enter-active-class="transition-[opacity,translate,scale] duration-(--duration-effects-default) ease-effects-default motion-reduce:transition-none"
      leave-active-class="transition-opacity duration-(--duration-effects-fast) motion-reduce:transition-none"
      @after-leave="emit('closed')"
    >
      <div
        v-if="open"
        :class="[
          'pointer-events-auto flex w-full max-w-[min(672px,100%)] min-w-[min(288px,100%)] rounded-[4px] bg-inverse-surface font-plain text-inverse-on-surface shadow-elevation-3 sm:w-auto',
          longAction ? 'flex-col items-stretch py-1' : 'min-h-12 items-center',
          closable ? 'pe-1' : actionLabel ? 'pe-2' : 'pe-4',
          'ps-4',
        ]"
        @pointerenter="pause"
        @pointerleave="startTimer"
        @focusin="pause"
        @focusout="startTimer"
      >
        <div :class="['flex-1 py-3.5 text-body-medium', longAction && 'pe-2']">
          <slot>{{ message }}</slot>
        </div>
        <div :class="['flex shrink-0 items-center', longAction ? 'justify-end' : 'ms-2']">
          <button
            v-if="actionLabel"
            type="button"
            :class="[
              'relative inline-flex h-10 cursor-pointer items-center rounded-full px-3 text-label-large text-inverse-primary',
              'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-secondary',
              'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
              'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
            ]"
            @click="onAction"
          >
            {{ actionLabel }}
          </button>
          <button
            v-if="closable"
            type="button"
            :aria-label="closeLabel"
            :class="[
              'relative inline-flex size-12 cursor-pointer items-center justify-center rounded-full text-inverse-on-surface',
              'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-4 focus-visible:outline-secondary',
              'before:pointer-events-none before:absolute before:inset-1 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
              'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
            ]"
            @click="open = false"
          >
            <svg viewBox="0 -960 960 960" fill="currentColor" class="size-6" aria-hidden="true">
              <path :d="iconPaths.close" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
