/**
 * Shows an element in the top layer with the Popover API and keeps it next to an anchor.
 *
 * - The floating element needs a `popover` attribute ("auto" for light dismiss and
 *   Escape, "manual" when the component closes it itself) and `popoverReset` classes.
 * - Placement flips to the other side when there's no room, then shifts to stay
 *   8px inside the viewport. It follows scrolling and resizing while open.
 * - `start` / `end` follow the anchor's writing direction.
 */
import { onBeforeUnmount, ref, watch, type MaybeRefOrGetter, type Ref, toValue } from 'vue'

export type Side = 'top' | 'bottom' | 'start' | 'end'
export type Align = 'start' | 'center' | 'end'
export type Placement = Side | `${Side}-${Exclude<Align, 'center'>}`

export interface PopoverOptions {
  placement?: MaybeRefOrGetter<Placement>
  /** Gap between anchor and popover, in px. */
  offset?: MaybeRefOrGetter<number>
  /** Make the popover at least as wide as the anchor. */
  matchWidth?: MaybeRefOrGetter<boolean>
  /** Called when the browser closes an "auto" popover (Escape or click outside). */
  onDismiss?: () => void
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

  // A click on the anchor first light-dismisses an "auto" popover (on pointerdown),
  // then its click handler would reopen it. Remember when that happened.
  let dismissedAt = 0
  /** True right after a light dismiss, so a toggle click on the anchor can be ignored. */
  const justDismissed = () => performance.now() - dismissedAt < 300

  function onToggle(e: Event) {
    const state = (e as ToggleEvent).newState
    if (state === 'closed' && isOpen.value) {
      dismissedAt = performance.now()
      isOpen.value = false
      stopTracking()
      options.onDismiss?.()
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
  }

  function hide() {
    const f = floating.value
    if (!isOpen.value) return
    isOpen.value = false
    stopTracking()
    if (f?.matches(':popover-open')) f.hidePopover()
  }

  onBeforeUnmount(() => {
    stopTracking()
    floating.value?.removeEventListener('toggle', onToggle)
  })

  return { isOpen, side, show, hide, position, justDismissed }
}
