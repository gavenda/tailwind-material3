<script setup lang="ts">
/**
 * Material 3 Expressive (vertical) menu.
 * Spec: https://m3.material.io/components/menus/specs
 * Tokens: md.comp.menus, md.comp.menus.{standard,vibrant}
 *
 * - `v-model:open` shows and hides it. Escape and clicks outside close it.
 * - Anchor: put the trigger in the `anchor` slot, which gets `{ open, toggle, props }`
 *   (spread `props` on the trigger for aria-haspopup/expanded/controls), or pass an
 *   element as the `anchor` prop.
 * - Content: MenuItems, optionally in MenuGroups (grouped layout: separate surfaces
 *   2dp apart). Without groups, the items share one surface.
 * - Arrow keys, Home and End move focus between items. Focus returns to the anchor on close.
 */
import { computed, nextTick, onMounted, provide, reactive, ref, useId, useTemplateRef, watch } from 'vue'
import { popoverReset } from '../../internal/classes'
import { animate, effects, fadeOut, spatial } from '../../internal/motion'
import { usePopover, type Placement } from '../../internal/usePopover'
import { useRovingFocus } from '../../internal/useRovingFocus'
import { menuKey, menuSurface, type MenuVariant } from './context'

const props = withDefaults(
  defineProps<{
    variant?: MenuVariant
    placement?: Placement
    /** Anchor element, when not using the `anchor` slot. */
    anchor?: HTMLElement | null
    /** Gap between anchor and menu in px. */
    offset?: number
    /** Make the menu at least as wide as its anchor (e.g. for a select field). */
    matchWidth?: boolean
    /** Accessible name for the menu. */
    label?: string
  }>(),
  {
    variant: 'standard',
    placement: 'bottom-start',
    anchor: undefined,
    offset: 4,
    matchWidth: false,
    label: undefined,
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ closed: [] }>()

const menuId = useId()
const wrap = useTemplateRef<HTMLElement>('wrap')
const menu = useTemplateRef<HTMLElement>('menu')

const slotAnchor = ref<HTMLElement | null>(null)
const anchorEl = computed(() => props.anchor ?? slotAnchor.value)

const { show, hide, isOpen, side, justDismissed } = usePopover(anchorEl, menu, {
  placement: () => props.placement,
  offset: () => props.offset,
  matchWidth: () => props.matchWidth,
  // Escape or a click outside closed it.
  onDismiss: () => {
    if (menu.value?.contains(document.activeElement)) anchorEl.value?.focus()
    open.value = false
    emit('closed')
  },
})

const { onKeydown: rove, focusFirst, focusLast } = useRovingFocus(menu, '[role^="menuitem"]', 'vertical')

const groupCount = ref(0)
provide(
  menuKey,
  reactive({
    variant: computed(() => props.variant),
    close: () => (open.value = false),
    addGroup: () => groupCount.value++,
    removeGroup: () => groupCount.value--,
  }),
)

/** Which item gets focus when the menu opens. */
let initialFocus: 'first' | 'last' = 'first'

async function openMenu() {
  if (isOpen.value) return
  slotAnchor.value = (wrap.value?.firstElementChild as HTMLElement | null) ?? null
  show()
  await nextTick()
  if (initialFocus === 'last') focusLast()
  else focusFirst()
  initialFocus = 'first'
  // Expressive menus unfold from the anchor side with the fast spatial spring.
  const el = menu.value
  if (!el) return
  animate(el, [{ transform: 'scaleY(0.6)' }, { transform: 'none' }], spatial(el, 'fast'))
  animate(el, [{ opacity: 0 }, { opacity: 1 }], effects(el, 'fast'))
}

// Bumped on every open/close, so a close that finishes animating after a reopen gives up.
let generation = 0
// Tab moves focus on by itself; don't pull it back to the anchor.
let restoreFocus = true

async function closeMenu() {
  if (!isOpen.value) return
  const mine = ++generation
  const wasInside = restoreFocus && menu.value?.contains(document.activeElement)
  restoreFocus = true
  await fadeOut(menu.value)
  if (mine !== generation) return
  menu.value?.getAnimations().forEach((a) => a.cancel())
  hide()
  if (wasInside) anchorEl.value?.focus()
  emit('closed')
}

watch(open, (on) => {
  if (on) {
    ++generation
    menu.value?.getAnimations().forEach((a) => a.cancel())
    openMenu()
  } else {
    closeMenu()
  }
})
onMounted(() => open.value && openMenu())

function toggle() {
  if (justDismissed()) return
  open.value = !open.value
}

// Escape is handled by the browser (popover="auto"), which then calls onDismiss.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    restoreFocus = false
    open.value = false
  }
  else rove(e)
}

// Opening from the anchor with the keyboard: ArrowDown focuses the first item, ArrowUp the last.
function onAnchorKeydown(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  if (open.value) return
  initialFocus = e.key === 'ArrowUp' ? 'last' : 'first'
  open.value = true
}

/** Attributes for the anchor element; also exposed for components that pass `anchor`. */
const anchorProps = computed(() => ({
  'aria-haspopup': 'menu' as const,
  'aria-expanded': open.value,
  'aria-controls': menuId,
  onKeydown: onAnchorKeydown,
}))

const origin = computed(() => (side.value === 'top' ? 'bottom' : 'top'))

defineExpose({ open: () => (open.value = true), close: () => (open.value = false), toggle, anchorProps })
</script>

<template>
  <span v-if="$slots.anchor" ref="wrap" class="contents">
    <slot name="anchor" :open="open" :toggle="toggle" :props="anchorProps" />
  </span>

  <div
    :id="menuId"
    ref="menu"
    popover="auto"
    role="menu"
    :aria-label="label"
    :style="{ transformOrigin: origin }"
    :class="[
      popoverReset,
      // Display only while open, so the browser's hidden style for closed popovers still applies.
      'z-50 hidden min-w-28 max-w-70 flex-col font-plain open:flex',
      // One surface with 16dp corners, unless MenuGroups draw their own.
      groupCount > 0 ? 'gap-0.5 bg-transparent p-0' : ['rounded-2xl px-1 py-0.5 shadow-elevation-2', menuSurface[variant]],
    ]"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>
