<script setup lang="ts">
/**
 * Material 3 dialog: basic, or full-screen.
 * Spec: https://m3.material.io/components/dialogs/specs
 * Tokens: md.comp.dialog, md.comp.full-screen-dialog
 *
 * Built on a native <dialog> opened with showModal(), so focus is trapped and restored,
 * Escape works, and it sits above everything else on the page.
 * - `v-model:open` shows and hides it.
 * - Slots: `icon` (basic only), `headline`, default (content), `actions`.
 *   Basic dialogs put actions bottom-right; full-screen dialogs put them in the header.
 * - Clicking the scrim or pressing Escape emits `cancel` and closes it, unless `persistent`.
 * - Emits `closed` once the close animation finishes.
 *
 * Motion follows material-web's dialog choreography on M3 Expressive springs: it slides
 * down 50px while the container grows from 35% height (default spatial spring), and the
 * contents fade in after it (default effects).
 */
import { computed, nextTick, onMounted, ref, useId, useSlots, useTemplateRef, watch } from 'vue'
import IconButton from '../Button/IconButton.vue'
import { effects, noOvershoot, prefersReducedMotion, spatial } from '../../internal/motion'

const props = withDefaults(
  defineProps<{
    fullscreen?: boolean
    /** Don't close on scrim click or Escape (still emits `cancel`). */
    persistent?: boolean
    /** Accessible name of the full-screen dialog's close button. */
    closeLabel?: string
  }>(),
  {
    fullscreen: false,
    persistent: false,
    closeLabel: 'Close',
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ cancel: []; closed: [] }>()

const slots = useSlots()
const headlineId = useId()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const scrim = useTemplateRef<HTMLElement>('scrim')
const panel = useTemplateRef<HTMLElement>('panel')
const surface = useTemplateRef<HTMLElement>('surface')
const top = useTemplateRef<HTMLElement>('top')
const scroller = useTemplateRef<HTMLElement>('scroller')
const actions = useTemplateRef<HTMLElement>('actions')

// --- Scrolling: dividers (basic) or a raised header (full-screen) once content scrolls.
const scrollable = ref(false)
const atTop = ref(true)
const atBottom = ref(true)
function measure() {
  const el = scroller.value
  if (!el) return
  scrollable.value = el.scrollHeight > el.clientHeight
  atTop.value = el.scrollTop <= 0
  atBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
}
let resize: ResizeObserver | undefined
onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !scroller.value) return
  resize = new ResizeObserver(measure)
  resize.observe(scroller.value)
  if (scroller.value.firstElementChild) resize.observe(scroller.value.firstElementChild)
})

// --- Motion
type Step = [Element | null | undefined, Keyframe[], KeyframeAnimationOptions]
let running: Animation[] = []

function play(steps: Step[]) {
  running.forEach((a) => a.cancel())
  if (prefersReducedMotion()) return Promise.resolve()
  running = steps.flatMap(([el, frames, options]) => (el ? [el.animate(frames, options)] : []))
  return Promise.all(running.map((a) => a.finished)).then(
    () => undefined,
    () => undefined, // cancelled by a newer animation
  )
}

const fade = (el: Element | null | undefined, delay: number): Step => [
  el,
  [{ opacity: 0 }, { opacity: 1 }],
  { ...effects(el, 'default'), delay, fill: 'backwards' },
]
const fadeOut = (el: Element | null | undefined, delay = 0): Step => [
  el,
  [{ opacity: 1 }, { opacity: 0 }],
  { ...effects(el, 'fast'), delay, fill: 'forwards' },
]

function openSteps(): Step[] {
  const move = spatial(panel.value, 'default')
  if (props.fullscreen) {
    // Full height: an overshoot would lift it off the bottom edge.
    return [
      [panel.value, [{ transform: 'translateY(48px)' }, { transform: 'none' }], noOvershoot(move)],
      [panel.value, [{ opacity: 0 }, { opacity: 1 }], effects(panel.value, 'default')],
    ]
  }
  return [
    [panel.value, [{ transform: 'translateY(-50px)' }, { transform: 'none' }], move],
    [scrim.value, [{ opacity: 0 }, { opacity: 0.32 }], effects(scrim.value, 'slow')],
    [surface.value, [{ opacity: 0 }, { opacity: 1 }], effects(surface.value, 'fast')],
    // The surface can't grow past its box, so the height stops at 100%.
    [surface.value, [{ height: '35%' }, { height: '100%' }], noOvershoot(move)],
    fade(top.value, 50),
    fade(scroller.value, 50),
    fade(actions.value, 150),
  ]
}

function closeSteps(): Step[] {
  const move = noOvershoot(spatial(panel.value, 'fast'))
  if (props.fullscreen) {
    return [
      [panel.value, [{ transform: 'none' }, { transform: 'translateY(48px)' }], { ...move, fill: 'forwards' }],
      fadeOut(panel.value),
    ]
  }
  return [
    [panel.value, [{ transform: 'none' }, { transform: 'translateY(-50px)' }], { ...move, fill: 'forwards' }],
    [scrim.value, [{ opacity: 0.32 }, { opacity: 0 }], { ...effects(scrim.value, 'fast'), fill: 'forwards' }],
    [surface.value, [{ height: '100%' }, { height: '35%' }], { ...move, fill: 'forwards' }],
    fadeOut(surface.value, 50),
    fadeOut(top.value),
    fadeOut(scroller.value),
    fadeOut(actions.value),
  ]
}

// --- Open / close
let generation = 0

async function show() {
  const el = dialog.value
  if (!el || el.open) return
  const mine = ++generation
  el.showModal()
  if (scroller.value) scroller.value.scrollTop = 0
  await nextTick()
  measure()
  if (mine === generation) await play(openSteps())
}

async function hide() {
  const el = dialog.value
  if (!el || !el.open) return
  const mine = ++generation
  await play(closeSteps())
  if (mine !== generation) return // reopened meanwhile
  el.close()
  running.forEach((a) => a.cancel())
  running = []
  emit('closed')
}

watch(open, (on) => (on ? show() : hide()))
onMounted(() => {
  if (open.value) show()
})

function cancel() {
  emit('cancel')
  if (!props.persistent) open.value = false
}

// Escape: run our own close so it animates.
function onCancel(e: Event) {
  e.preventDefault()
  cancel()
}

// Closed some other way (e.g. a <form method="dialog"> submit).
function onClose() {
  if (open.value) {
    open.value = false
    emit('closed')
  }
}

const hasHeadline = computed(() => !!slots.headline)
const hasActions = computed(() => !!slots.actions)
const hasIcon = computed(() => !!slots.icon && !props.fullscreen)
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="hasHeadline ? headlineId : undefined"
    class="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-on-surface backdrop:bg-transparent"
    @cancel="onCancel"
    @close="onClose"
  >
    <!-- Scrim: 32% scrim color. Our own element, since ::backdrop can't animate in Firefox. -->
    <div
      v-if="!fullscreen"
      ref="scrim"
      class="absolute inset-0 bg-scrim opacity-32"
      @click="cancel"
    />

    <!-- Full-screen: fills the viewport, surface, no corners -->
    <div
      v-if="fullscreen"
      ref="panel"
      class="relative flex size-full flex-col bg-surface"
    >
      <!-- Header: 56dp; surface-container + elevation 2 once the content scrolls -->
      <div
        ref="top"
        :class="[
          'relative z-1 flex h-14 shrink-0 items-center gap-1 ps-1 pe-4 transition-[background-color,box-shadow] duration-(--duration-effects-default) ease-effects-default',
          scrollable && !atTop ? 'bg-surface-container shadow-elevation-2' : 'bg-surface',
        ]"
      >
        <IconButton variant="standard" :label="closeLabel" @click="cancel">
          <slot name="close-icon">
            <!-- Material Symbols close -->
            <svg viewBox="0 -960 960 960" fill="currentColor">
              <path
                d="m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"
              />
            </svg>
          </slot>
        </IconButton>
        <h2 v-if="hasHeadline" :id="headlineId" class="min-w-0 flex-1 truncate text-title-large text-on-surface">
          <slot name="headline" />
        </h2>
        <div v-if="hasActions" ref="actions" class="ms-auto flex shrink-0 items-center gap-2">
          <slot name="actions" />
        </div>
      </div>

      <div ref="scroller" class="flex-1 overflow-y-auto" @scroll="measure">
        <div class="px-6 pt-2 pb-6">
          <slot />
        </div>
      </div>
    </div>

    <!-- Basic: centred, 280–560dp wide, 24dp from the viewport edges -->
    <div v-else class="pointer-events-none relative flex size-full items-center justify-center p-6">
      <div
        ref="panel"
        :class="[
          'pointer-events-auto relative flex max-h-[min(560px,100%)] min-h-[140px] w-fit max-w-[min(560px,100%)] min-w-[280px] flex-col',
          'rounded-[28px]',
        ]"
      >
        <!--
          Container: surface-container-high, extra-large corners, elevation 3. Grows separately
          from the contents; the shadow lives here so it grows and fades with the container.
        -->
        <div ref="surface" class="absolute inset-x-0 top-0 h-full rounded-[inherit] bg-surface-container-high shadow-elevation-3" />

        <div v-if="hasIcon || hasHeadline" ref="top" class="relative flex flex-col">
          <!-- Icon: 24dp secondary, centred -->
          <span v-if="hasIcon" class="mt-6 inline-flex size-6 self-center text-secondary *:size-full">
            <slot name="icon" />
          </span>
          <h2
            v-if="hasHeadline"
            :id="headlineId"
            :class="[
              'px-6 pb-4 text-headline-small text-on-surface',
              hasIcon ? 'pt-4 text-center' : 'pt-6',
            ]"
          >
            <slot name="headline" />
          </h2>
          <!-- 1dp outline divider while the content is scrolled -->
          <div v-if="scrollable && !atTop" class="absolute inset-x-0 bottom-0 h-px bg-outline" />
        </div>

        <div ref="scroller" class="relative min-h-0 flex-1 overflow-y-auto" @scroll="measure">
          <div
            :class="[
              'px-6 text-body-medium text-on-surface-variant',
              hasHeadline || hasIcon ? 'pt-0' : 'pt-6',
              hasActions ? 'pb-2' : 'pb-6',
            ]"
          >
            <slot />
          </div>
        </div>

        <!-- Actions: end-aligned, 8dp apart -->
        <div v-if="hasActions" ref="actions" class="relative flex flex-wrap justify-end gap-2 px-6 pt-4 pb-6">
          <div v-if="scrollable && !atBottom" class="absolute inset-x-0 top-0 h-px bg-outline" />
          <slot name="actions" />
        </div>
      </div>
    </div>
  </dialog>
</template>
