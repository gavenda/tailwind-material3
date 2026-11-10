<script setup lang="ts">
/**
 * Material 3 side sheet: modal or standard.
 * Spec: https://m3.material.io/components/side-sheets/specs
 * Tokens: md.comp.sheet.side
 *
 * - Modal (default): slides in from the end edge over a 32% scrim, 16dp start corners,
 *   surface-container-low; `detached` floats it 16dp from the edges with all corners rounded.
 *   Escape or a scrim click closes it unless `persistent`.
 * - Standard (`modal` false): sits in the layout next to the content (put both in a flex
 *   row), surface color with a divider; it animates its width open and closed.
 * - Slots: `headline` (title-large), default (content), `actions` (bottom, after a divider).
 *   Shows a close button; `showBack` adds a back button that emits `back`.
 */
import { computed, useId, useTemplateRef } from 'vue'
import { scrimClasses } from '../../internal/classes'
import { iconPaths } from '../../internal/icons'
import { animate, EMPHASIZED_ACCELERATE, EMPHASIZED_DECELERATE, scrimIn, scrimOut } from '../../internal/motion'
import { useDialog } from '../../internal/useDialog'
import IconButton from '../Button/IconButton.vue'

const props = withDefaults(
  defineProps<{
    modal?: boolean
    detached?: boolean
    persistent?: boolean
    showBack?: boolean
    closeLabel?: string
    backLabel?: string
  }>(),
  {
    modal: true,
    detached: false,
    persistent: false,
    showBack: false,
    closeLabel: 'Close',
    backLabel: 'Back',
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ cancel: []; closed: []; back: [] }>()

const headlineId = useId()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const sheet = useTemplateRef<HTMLElement>('sheet')
const scrim = useTemplateRef<HTMLElement>('scrim')

const rtl = () => (sheet.value ? getComputedStyle(sheet.value).direction === 'rtl' : false)
const offscreen = () => `translateX(${rtl() ? '-' : ''}110%)`

const { cancel, onCancel, onClose } = useDialog(dialog, open, {
  persistent: () => props.persistent,
  onCancel: () => emit('cancel'),
  onClosed: () => emit('closed'),
  enter: () =>
    Promise.all([
      animate(sheet.value, [{ transform: offscreen() }, { transform: 'none' }], { duration: 450, easing: EMPHASIZED_DECELERATE }),
      scrimIn(scrim.value),
    ]),
  leave: () =>
    Promise.all([
      animate(sheet.value, [{ transform: 'none' }, { transform: offscreen() }], {
        duration: 250,
        easing: EMPHASIZED_ACCELERATE,
        fill: 'forwards',
      }),
      scrimOut(scrim.value, 250),
    ]),
})

const close = () => (props.modal ? cancel() : (open.value = false))
const panelShape = computed(() => (props.detached ? 'm-4 h-[calc(100%-2rem)] rounded-2xl' : 'h-full rounded-s-2xl'))
</script>

<template>
  <!-- Modal: a <dialog> above the page. Standard: an <aside> in the layout that animates its width. -->
  <component
    :is="modal ? 'dialog' : 'aside'"
    ref="dialog"
    :aria-labelledby="$slots.headline ? headlineId : undefined"
    :inert="(!modal && !open) || undefined"
    :class="
      modal
        ? 'fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-on-surface backdrop:bg-transparent'
        : [
            'h-full shrink-0 overflow-hidden border-outline-variant bg-surface',
            'transition-[width] duration-(--duration-spring-default-spatial) ease-spring-default-spatial motion-reduce:transition-none',
            open ? 'w-64 border-s' : 'w-0',
          ]
    "
    @cancel="onCancel"
    @close="onClose"
  >
    <div v-if="modal" ref="scrim" :class="scrimClasses" @click="cancel" />
    <div
      ref="sheet"
      :class="[
        'flex flex-col font-plain',
        modal
          ? ['absolute end-0 top-0 w-[min(400px,calc(100%-56px))] bg-surface-container-low shadow-elevation-1', panelShape]
          : 'h-full w-64',
      ]"
    >
      <div class="flex h-18 shrink-0 items-center gap-1 ps-4 pe-3">
        <IconButton v-if="showBack" variant="standard" :label="backLabel" class="-ms-2" @click="emit('back')">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.arrowBack" /></svg>
        </IconButton>
        <h2 :id="headlineId" class="min-w-0 flex-1 truncate text-title-large text-on-surface-variant">
          <slot name="headline" />
        </h2>
        <IconButton variant="standard" :label="closeLabel" @click="close">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.close" /></svg>
        </IconButton>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-6 text-body-medium text-on-surface-variant"><slot /></div>
      <!-- Actions after a divider (outline on standard sheets, outline-variant on modal ones) -->
      <div
        v-if="$slots.actions"
        :class="['flex shrink-0 gap-2 border-t px-6 pt-4 pb-6', modal ? 'border-outline-variant' : 'border-outline']"
      >
        <slot name="actions" />
      </div>
    </div>
  </component>
</template>
