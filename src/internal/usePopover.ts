/**
 * Shows an element in the top layer with the Popover API and keeps it next to an anchor.
 *
 * - The floating element needs `popover="manual"` and the `popoverReset` classes.
 * - With `lightDismiss`, Escape and a press outside the popover and its anchor close it, as
 *   `popover="auto"` would. They are handled here rather than by the browser, which hides an
 *   auto popover on the spot and leaves no time for an exit animation: `onDismiss` is called
 *   while it is still showing, and the component calls `hide()` once it has animated out.
 *   Open light-dismiss popovers stack: Escape closes the newest, and a press inside one
 *   closes only those opened after it.
 * - Placement flips to the other side when there's no room, then shifts to stay
 *   8px inside the viewport. It follows scrolling and resizing while open.
 * - `start` / `end` follow the anchor's writing direction.
 */
import { onBeforeUnmount, ref, watch, type MaybeRefOrGetter, type Ref, toValue } from 'vue'

export type Side = 'top' | 'bottom' | 'start' | 'end'
export type Align = 'start' | 'center' | 'end'
export type Placement = Side | `${Side}-${Exclude<Align, 'center'>}`
export type DismissReason = 'escape' | 'outside' | 'closed'

export interface PopoverOptions {
  placement?: MaybeRefOrGetter<Placement>
  /** Gap between anchor and popover, in px. */
  offset?: MaybeRefOrGetter<number>
  /** Make the popover at least as wide as the anchor. */
  matchWidth?: MaybeRefOrGetter<boolean>
  /** Close on Escape or a press outside the popover and its anchor. */
  lightDismiss?: MaybeRefOrGetter<boolean>
  /**
   * Called on a light dismiss, with the popover still showing; call `hide()` when done.
   * `reason` says which: Escape, a press outside, or the popover closed some other way.
   * Without it, the popover is hidden straight away.
   */
  onDismiss?: (reason: DismissReason) => void
}

// --- Light dismiss, shared by every open popover that asks for it.

interface Layer {
  floating: HTMLElement
  anchor: HTMLElement | null | undefined
  dismiss: (reason: DismissReason) => void
}

/** Open light-dismiss popovers, oldest first. */
const layers: Layer[] = []

function onEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented) return
  const top = layers.at(-1)
  if (!top) return
  // Cancelling the keydown also stops an enclosing modal <dialog> from closing.
  e.preventDefault()
  e.stopPropagation()
  top.dismiss('escape')
}

function onPressOutside(e: PointerEvent) {
  const target = e.target as Node | null
  for (const layer of [...layers].reverse()) {
    if (target && (layer.floating.contains(target) || layer.anchor?.contains(target))) break
    layer.dismiss('outside')
  }
}

function addLayer(layer: Layer) {
  if (layers.length === 0) {
    document.addEventListener('keydown', onEscape, true)
    document.addEventListener('pointerdown', onPressOutside, true)
  }
  layers.push(layer)
}

function removeLayer(layer: Layer) {
  const i = layers.indexOf(layer)
  if (i === -1) return
  layers.splice(i, 1)
  if (layers.length === 0) {
    document.removeEventListener('keydown', onEscape, true)
    document.removeEventListener('pointerdown', onPressOutside, true)
  }
}

const VIEWPORT_MARGIN = 8

function parse(p: Placement): [Side, Align] {
  const [side, align] = p.split('-') as [Side, Align | undefined]
  return [side, align ?? 'center']
}

export function usePopover(
  anchor: MaybeRefOrGetter<HTMLElement | null | undefined>,
  floating: Readonly<Ref<HTMLElement | null>>,
  options: PopoverOptions = {},
) {
  const isOpen = ref(false)
  /** Side the popover ended up on, after flipping. Useful for transform-origin. */
  const side = ref<Side>(parse(toValue(options.placement) ?? 'bottom')[0])

  function position() {
    const a = toValue(anchor)
    const f = floating.value
    if (!a || !f) return
    const rtl = getComputedStyle(a).direction === 'rtl'
    const [wanted, align] = parse(toValue(options.placement) ?? 'bottom')
    const gap = toValue(options.offset) ?? 4

    if (toValue(options.matchWidth)) f.style.minWidth = `${a.getBoundingClientRect().width}px`
    const ar = a.getBoundingClientRect()
    const fw = f.offsetWidth
    const fh = f.offsetHeight
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight

    // Logical start/end to physical left/right.
    const physical = (s: Side): 'top' | 'bottom' | 'left' | 'right' =>
      s === 'start' ? (rtl ? 'right' : 'left') : s === 'end' ? (rtl ? 'left' : 'right') : s

    const room = {
      top: ar.top - gap,
      bottom: vh - ar.bottom - gap,
      left: ar.left - gap,
      right: vw - ar.right - gap,
    }
    const opposite = { top: 'bottom', bottom: 'top', start: 'end', end: 'start' } as const
    let s = wanted
    const need = (x: Side) => (x === 'top' || x === 'bottom' ? fh : fw)
    if (room[physical(s)] < need(s) && room[physical(opposite[s])] > room[physical(s)]) s = opposite[s]
    side.value = s

    const p = physical(s)
    let x: number
    let y: number
    if (p === 'top' || p === 'bottom') {
      y = p === 'top' ? ar.top - gap - fh : ar.bottom + gap
      const startX = rtl ? ar.right - fw : ar.left
      const endX = rtl ? ar.left : ar.right - fw
      x = align === 'center' ? ar.left + (ar.width - fw) / 2 : align === 'start' ? startX : endX
    } else {
      x = p === 'left' ? ar.left - gap - fw : ar.right + gap
      y = align === 'center' ? ar.top + (ar.height - fh) / 2 : align === 'start' ? ar.top : ar.bottom - fh
    }

    // Shift to stay inside the viewport.
    x = Math.min(Math.max(x, VIEWPORT_MARGIN), vw - fw - VIEWPORT_MARGIN)
    y = Math.min(Math.max(y, VIEWPORT_MARGIN), vh - fh - VIEWPORT_MARGIN)
    f.style.position = 'fixed'
    f.style.left = `${Math.round(x)}px`
    f.style.top = `${Math.round(y)}px`
  }

  let resize: ResizeObserver | undefined
  const onScrollOrResize = () => position()

  function startTracking() {
    window.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    if (typeof ResizeObserver !== 'undefined' && floating.value) {
      resize = new ResizeObserver(onScrollOrResize)
      resize.observe(floating.value)
    }
  }

  function stopTracking() {
    window.removeEventListener('scroll', onScrollOrResize, { capture: true })
    window.removeEventListener('resize', onScrollOrResize)
    resize?.disconnect()
    resize = undefined
  }

  // A press on the anchor counts as inside, so its own click toggles the popover closed.
  // Remember dismissals anyway, for a click that lands just after one.
  let dismissedAt = 0
  /** True right after a light dismiss, so a toggle click on the anchor can be ignored. */
  const justDismissed = () => performance.now() - dismissedAt < 300

  let layer: Layer | null = null

  function dismiss(reason: DismissReason) {
    if (layer) removeLayer(layer)
    layer = null
    dismissedAt = performance.now()
    if (options.onDismiss) options.onDismiss(reason)
    else hide()
  }

  // Closed by something other than hide() (e.g. hidePopover() called elsewhere).
  function onToggle(e: Event) {
    const state = (e as ToggleEvent).newState
    if (state === 'closed' && isOpen.value) {
      dismissedAt = performance.now()
      isOpen.value = false
      stopTracking()
      if (layer) removeLayer(layer)
      layer = null
      options.onDismiss?.('closed')
    }
  }

  watch(
    floating,
    (el, old) => {
      old?.removeEventListener('toggle', onToggle)
      el?.addEventListener('toggle', onToggle)
    },
    { immediate: true },
  )

  function show() {
    const f = floating.value
    if (!f || isOpen.value) return
    isOpen.value = true
    if (!f.matches(':popover-open')) {
      // `source` ties the popover to its anchor (newer browsers), so clicks on the
      // anchor don't count as outside clicks. Older browsers ignore the option.
      const source = toValue(anchor) ?? undefined
      ;(f as unknown as { showPopover(o?: { source?: HTMLElement }): void }).showPopover({ source })
    }
    position()
    startTracking()
    if (toValue(options.lightDismiss)) {
      layer = { floating: f, anchor: toValue(anchor), dismiss }
      addLayer(layer)
    }
  }

  function hide() {
    const f = floating.value
    if (!isOpen.value) return
    isOpen.value = false
    stopTracking()
    if (layer) removeLayer(layer)
    layer = null
    if (f?.matches(':popover-open')) f.hidePopover()
  }

  onBeforeUnmount(() => {
    stopTracking()
    if (layer) removeLayer(layer)
    floating.value?.removeEventListener('toggle', onToggle)
  })

  return { isOpen, side, show, hide, position, justDismissed }
}
