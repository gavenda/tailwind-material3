<script setup lang="ts">
/**
 * Material 3 Expressive search: a search bar that opens a search view.
 * Spec: https://m3.material.io/components/search/specs
 * Tokens: md.comp.search-bar, md.comp.search-view (contained)
 *
 * - `v-model` is the query; `v-model:open` opens the view (also opened by clicking the
 *   bar, or typing / Enter while it has focus). Enter emits `search`; Escape or the back button closes the view.
 * - Contained style (M3 Expressive): the bar is a persistent filled pill that keeps its shape
 *   when focused, with a chevron to go back; no dividers or shadows.
 * - `view`: 'docked' opens below the bar, over a scrim (bar and results as separate surfaces,
 *   2dp apart), and follows the bar if the page scrolls; 'fullscreen' covers the window: the
 *   bar moves from its place to the top, and results scroll beneath it. 'auto' (default) is full-screen in compact windows
 *   (under 600dp) and docked from medium up, as the spec recommends.
 * - Enter emits `search` and moves focus from the input to the results, leaving the query
 *   visible (the spec's "visible, but not in focus").
 * - Slots: `leading` (replaces the search icon in the bar), `trailing` (avatar or icon
 *   buttons in the bar), default (results / suggestions in the view, e.g. a List).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import { scrimClasses } from '../../internal/classes'
import { iconPaths } from '../../internal/icons'
import { animate, effects, fadeOut, noOvershoot, scrimIn, scrimOut, spatial } from '../../internal/motion'
import { useDialog } from '../../internal/useDialog'
import IconButton from '../Button/IconButton.vue'
import { vRipple } from '../../internal/ripple'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    view?: 'docked' | 'fullscreen' | 'auto'
    backLabel?: string
    clearLabel?: string
  }>(),
  {
    placeholder: 'Search',
    view: 'auto',
    backLabel: 'Back',
    clearLabel: 'Clear search',
  },
)

const query = defineModel<string>({ default: '' })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ search: [query: string] }>()

const resultsId = useId()
const bar = useTemplateRef<HTMLElement>('bar')
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const panel = useTemplateRef<HTMLElement>('panel')
const input = useTemplateRef<HTMLInputElement>('input')
const header = useTemplateRef<HTMLElement>('header')
const results = useTemplateRef<HTMLElement>('results')
const scrim = useTemplateRef<HTMLElement>('scrim')
const fill = useTemplateRef<HTMLElement>('fill')

// Compact windows (under 600dp) get the full-screen view when `view` is 'auto'.
const compact = ref(false)
let compactQuery: MediaQueryList | undefined
const onCompactChange = () => (compact.value = !!compactQuery?.matches)
onMounted(() => {
  compactQuery = window.matchMedia('(max-width: 599.98px)')
  onCompactChange()
  compactQuery.addEventListener('change', onCompactChange)
})
const docked = computed(() => props.view === 'docked' || (props.view === 'auto' && !compact.value))

/**
 * Docked view: placed over the bar, at least 360dp wide, and at most 640dp tall or down to
 * 16dp above the window's bottom edge. The page can still scroll (or resize) under a modal
 * dialog, so while it's open the view follows the bar.
 */
const rect = ref({ top: 0, left: 0, width: 360, maxHeight: 640 })
function place() {
  if (!docked.value || !bar.value) return
  const r = bar.value.getBoundingClientRect()
  rect.value = {
    top: r.top,
    left: r.left,
    width: Math.max(360, r.width),
    // Never shorter than the bar itself, even when the bar is near the bottom.
    maxHeight: Math.max(r.height, Math.min(640, window.innerHeight - r.top - 16)),
  }
}
let frame = 0
const schedulePlace = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(place)
}
function track(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  // Capture catches scrolling in any container, not just the page.
  window[method]('scroll', schedulePlace, { capture: true, passive: true } as AddEventListenerOptions)
  window[method]('resize', schedulePlace)
  if (!on) cancelAnimationFrame(frame)
}
watch(open, track)
onBeforeUnmount(() => {
  track(false)
  compactQuery?.removeEventListener('change', onCompactChange)
})

const { onCancel, onClose } = useDialog(dialog, open, {
  enter: async () => {
    place()
    await nextTick()
    input.value?.focus()
    return (docked.value ? dockedMotion(true) : fullScreenMotion(true)).then(() => undefined)
  },
  leave: () => (docked.value ? dockedMotion(false) : fullScreenMotion(false)),
})

/*
 * Contained style motion (md.comp.search-bar.contained.motion: the fast spatial spring).
 * The bar is a persistent container: it keeps its shape, and the view grows from it.
 */

/** Where the page's bar sits, as insets within the view, for the bar to move from/to. */
function barInsets() {
  const b = bar.value?.getBoundingClientRect()
  const p = panel.value?.getBoundingClientRect()
  if (!b || !p) return undefined
  return { top: `${b.top - p.top}px`, left: `${b.left - p.left}px`, right: `${p.right - b.right}px` }
}

/**
 * Docked: the view's bar sits exactly over the page's bar and stays put; the results
 * unfold below it, over the scrim.
 */
function dockedMotion(entering: boolean) {
  const shut = 'inset(0 0 100% 0 round 12px)'
  const shown = 'inset(0 0 0 0 round 12px)'
  const el = results.value
  return Promise.all([
    entering
      ? animate(el, [{ clipPath: shut }, { clipPath: shown }], spatial(el, 'fast'))
      : animate(el, [{ clipPath: shown }, { clipPath: shut }], { ...noOvershoot(spatial(el, 'fast')), fill: 'forwards' }),
    entering
      ? animate(el, [{ opacity: 0 }, { opacity: 1 }], effects(el, 'fast'))
      : fadeOut(el),
    entering ? scrimIn(scrim.value) : scrimOut(scrim.value),
  ])
}

/**
 * Full-screen: the bar moves from where it sat on the page to the top of the window
 * (24dp margins down to 12dp) while the background fades in behind it and the results
 * follow. Closing plays it back, landing the bar on the page's bar.
 */
function fullScreenMotion(entering: boolean) {
  const from = barInsets()
  const el = header.value
  const to = el && getComputedStyle(el)
  const move = noOvershoot(spatial(el, 'fast'))
  const frames: Keyframe[] = from && to ? [from, { top: to.top, left: to.left, right: to.right }] : []
  return Promise.all([
    frames.length &&
      animate(el, entering ? frames : [...frames].reverse(), { ...move, fill: entering ? 'none' : 'forwards' }),
    entering ? animate(fill.value, [{ opacity: 0 }, { opacity: 1 }], effects(fill.value)) : fadeOut(fill.value),
    entering
      ? animate(results.value, [{ opacity: 0 }, { opacity: 1 }], { ...effects(results.value), delay: 100, fill: 'backwards' })
      : fadeOut(results.value),
  ])
}

function activate() {
  open.value = true
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  emit('search', query.value)
  // The query stays visible, but focus moves on to the results.
  results.value?.focus()
}

</script>

<template>
  <!-- Bar: 56dp pill, surface-container-high, search icon, input, trailing actions -->
  <div
    ref="bar"
    v-ripple
    role="search"
    :class="[
      'relative flex h-14 w-full max-w-180 min-w-0 cursor-text items-center gap-1 rounded-full bg-surface-container-high ps-1 font-plain',
      $slots.trailing ? 'pe-1' : 'pe-4',
      // Focus indicator (3dp secondary, 2dp offset) while the input has keyboard focus
      'has-[>input:focus-visible]:outline-3 has-[>input:focus-visible]:outline-offset-2 has-[>input:focus-visible]:outline-secondary has-[>input:focus-visible]:outline-solid',
      // State layer and pressed ripple in on-surface: hover 8%, pressed 10%
      'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-on-surface before:opacity-0 before:transition-opacity hover:before:opacity-8 [--ripple-color:var(--color-on-surface)]',
    ]"
    @click="activate"
  >
    <span class="inline-flex size-12 shrink-0 items-center justify-center text-on-surface">
      <slot name="leading">
        <svg viewBox="0 -960 960 960" fill="currentColor" class="size-6" aria-hidden="true">
          <path :d="iconPaths.search" />
        </svg>
      </slot>
    </span>
    <input
      :value="query"
      :placeholder="placeholder"
      :aria-label="placeholder"
      readonly
      aria-haspopup="dialog"
      :aria-expanded="open"
      class="min-w-0 flex-1 cursor-text truncate bg-transparent text-body-large text-on-surface outline-none placeholder:text-on-surface-variant"
      @keydown.enter.prevent="activate"
      @keydown.space.prevent="activate"
      @keydown="(e: KeyboardEvent) => e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && activate()"
    />
    <span v-if="$slots.trailing" class="relative flex shrink-0 items-center text-on-surface-variant" @click.stop>
      <slot name="trailing" />
    </span>
  </div>

  <!-- View -->
  <dialog
    ref="dialog"
    class="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-on-surface backdrop:bg-transparent"
    @cancel="onCancel"
    @close="onClose"
    @click.self="open = false"
  >
    <!-- Docked: a scrim covers the page; clicking it closes the view -->
    <div v-if="docked" ref="scrim" :class="scrimClasses" @click="open = false" />
    <div
      ref="panel"
      :class="['flex flex-col font-plain', docked ? 'absolute gap-0.5' : 'relative size-full']"
      :style="
        docked
          ? { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, maxHeight: `${rect.maxHeight}px` }
          : undefined
      "
    >
      <!-- Full-screen background (surface-container-low), its own layer so it can fade on its own -->
      <div v-if="!docked" ref="fill" class="absolute inset-0 bg-surface-container-low" />
      <!--
        Header: the bar again (contained style: the same filled pill, no divider or shadow), now
        editable, with back and clear buttons. Full-screen, it floats 12dp from the sides and the
        results scroll beneath it.
      -->
      <div
        ref="header"
        :class="[
          'flex h-14 shrink-0 items-center gap-1 rounded-full bg-surface-container-high px-1',
          !docked && 'absolute inset-x-3 top-2 z-1',
        ]"
      >
        <!--
          Back: the contained style's chevron (the divided style's arrow_back isn't used), in
          on-surface (md.comp.search-view.header.leading-icon.color).
        -->
        <IconButton variant="standard" :label="backLabel" class="text-on-surface!" @click="open = false">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.chevronLeft" /></svg>
        </IconButton>
        <input
          ref="input"
          v-model="query"
          type="search"
          :placeholder="placeholder"
          :aria-label="placeholder"
          :aria-controls="resultsId"
          enterkeyhint="search"
          class="min-w-0 flex-1 bg-transparent text-body-large text-on-surface caret-primary outline-none placeholder:text-on-surface-variant [&::-webkit-search-cancel-button]:hidden"
          @keydown="onKeydown"
          @keydown.esc.prevent="open = false"
        />
        <IconButton v-if="query" variant="standard" :label="clearLabel" @click="(query = ''), input?.focus()">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.close" /></svg>
        </IconButton>
      </div>

      <div
        :id="resultsId"
        ref="results"
        tabindex="-1"
        :class="[
          'min-h-0 flex-1 overflow-y-auto focus:outline-none',
          docked ? 'rounded-[12px] bg-surface-container-high py-2' : 'relative px-3 pt-18 pb-3',
        ]"
      >
        <slot :query="query" :close="() => (open = false)" />
      </div>
    </div>
  </dialog>
</template>
