<script setup lang="ts">
/**
 * Material 3 Expressive search: a search bar that opens a search view.
 * Spec: https://m3.material.io/components/search/specs
 * Tokens: md.comp.search-bar, md.comp.search-view (contained)
 *
 * - `v-model` is the query; `v-model:open` opens the view (also opened by clicking the
 *   bar, or typing / Enter while it has focus). Enter emits `search`; Escape or the back button closes the view.
 * - `view`: 'docked' opens below the bar on wide layouts (bar and results as separate
 *   surfaces, 2dp apart); 'fullscreen' covers the window (use on small screens).
 * - Slots: `leading` (replaces the search icon in the bar), `trailing` (avatar or icon
 *   buttons in the bar), default (results / suggestions in the view, e.g. a List).
 */
import { computed, nextTick, ref, useId, useTemplateRef } from 'vue'
import { iconPaths } from '../../internal/icons'
import { animate, effects, fadeOut, noOvershoot, spatial } from '../../internal/motion'
import { useDialog } from '../../internal/useDialog'
import IconButton from '../Button/IconButton.vue'
import { vRipple } from '../../internal/ripple'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    view?: 'docked' | 'fullscreen'
    backLabel?: string
    clearLabel?: string
  }>(),
  {
    placeholder: 'Search',
    view: 'docked',
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

// Docked view: placed over the bar, at least 360dp wide.
const rect = ref({ top: 0, left: 0, width: 360 })
const docked = computed(() => props.view === 'docked')

const { onCancel, onClose } = useDialog(dialog, open, {
  enter: async () => {
    if (docked.value && bar.value) {
      const r = bar.value.getBoundingClientRect()
      rect.value = { top: r.top, left: r.left, width: Math.max(360, r.width) }
    }
    await nextTick()
    input.value?.focus()
    // The view fills its box (or the screen), so the spring stops at the target
    // rather than overshooting past an edge.
    return Promise.all([
      animate(
        panel.value,
        docked.value
          ? [{ clipPath: 'inset(0 0 calc(100% - 56px) 0 round 28px)' }, { clipPath: 'inset(0 0 0 0 round 0)' }]
          : [{ transform: 'translateY(-16px)' }, { transform: 'none' }],
        noOvershoot(spatial(panel.value)),
      ),
      animate(panel.value, [{ opacity: 0 }, { opacity: 1 }], effects(panel.value)),
    ]).then(() => undefined)
  },
  leave: () => fadeOut(panel.value),
})

function activate() {
  open.value = true
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') emit('search', query.value)
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
    <div
      ref="panel"
      :class="[
        'flex flex-col font-plain',
        docked ? 'absolute max-h-[min(640px,calc(100%-2rem))] gap-0.5' : 'size-full bg-surface-container-low',
      ]"
      :style="docked ? { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px` } : undefined"
    >
      <!-- Header: the bar again, now editable, with back and clear buttons -->
      <div
        :class="[
          'flex h-14 shrink-0 items-center gap-1 rounded-full bg-surface-container-high px-1',
          docked ? 'shadow-elevation-3' : 'mx-3 mt-2',
        ]"
      >
        <IconButton variant="standard" :label="backLabel" @click="open = false">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path :d="iconPaths.arrowBack" /></svg>
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
        :class="[
          'min-h-0 flex-1 overflow-y-auto',
          docked ? 'rounded-[12px] bg-surface-container-high py-2 shadow-elevation-3' : 'mt-2 px-3 pb-3',
        ]"
      >
        <slot :query="query" :close="() => (open = false)" />
      </div>
    </div>
  </dialog>
</template>
