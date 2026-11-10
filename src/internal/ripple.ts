/**
 * Pressed state: a ripple, plus a `data-pressed` attribute for press styling.
 * Spec: https://m3.material.io/foundations/interaction/states/applying-states#pressed
 *
 * `v-ripple` on a pressable element draws a ripple in its current text color at the
 * pressed state-layer opacity (10%). It starts at the pointer (or the center for a
 * keyboard press), grows to cover the element, and fades out once released.
 * Timings follow Compose's ripple (RippleAnimation.kt).
 *
 * While pressed the element also gets `data-pressed`, so components style presses
 * with `data-pressed:` (or `peer-data-pressed:` / `group-data-pressed:`) instead of
 * `:active`. Unlike `:active`, that covers Enter as well as Space and the pointer.
 *
 * Options: `v-ripple="{ host: () => el }"` draws in another (positioned) element,
 * e.g. the 40dp circle of a checkbox; `v-ripple="false"` turns it off.
 * The ripple fills the host's padding box; set `--ripple-inset` to grow or shrink it,
 * and `--ripple-color` to draw it in something other than the text color.
 */
import type { ObjectDirective } from 'vue'
import { prefersReducedMotion } from './motion'

export interface RippleOptions {
  /** Element the ripple is drawn in (default: the element itself). It must be positioned. */
  host?: () => HTMLElement | null | undefined
  disabled?: boolean
}
type RippleValue = RippleOptions | boolean | undefined

/** md.sys.state.pressed.state-layer-opacity */
const PRESSED_OPACITY = 0.1
const FADE_IN_MS = 75
const EXPAND_MS = 225
const FADE_OUT_MS = 150
/** Touch presses wait this long, so starting a scroll doesn't flash a ripple. */
const TOUCH_DELAY_MS = 100
/** Bounded ripples end this far past the element's half-diagonal (Compose: 10dp). */
const END_PADDING = 10

interface Wave {
  circle: HTMLElement
  entered: Promise<unknown>
}

interface State {
  options: RippleOptions
  wave?: Wave
  touchTimer?: ReturnType<typeof setTimeout>
  /** A touch released before its delay ran out still gets a ripple, briefly. */
  pendingPoint?: { x: number; y: number }
  cleanup: () => void
}

const states = new WeakMap<HTMLElement, State>()
/** Pointer events already claimed by a ripple, so a nested pressable doesn't ripple its parent too. */
const claimed = new WeakSet<Event>()

function normalize(value: RippleValue): RippleOptions {
  if (value === false) return { disabled: true }
  return value === true || value === undefined ? {} : value
}

function isDisabled(el: HTMLElement, state: State) {
  return !!state.options.disabled || el.matches(':disabled, [aria-disabled="true"]')
}

/** The clipping layer the waves draw in, created on first use. */
function layerFor(host: HTMLElement) {
  let layer = host.querySelector<HTMLElement>(':scope > [data-ripple]')
  if (!layer) {
    layer = document.createElement('span')
    layer.dataset.ripple = ''
    layer.setAttribute('aria-hidden', 'true')
    Object.assign(layer.style, {
      position: 'absolute',
      inset: 'var(--ripple-inset, 0px)',
      // Inline, so child selectors on the host (e.g. *:size-full) can't resize it.
      width: 'auto',
      height: 'auto',
      overflow: 'hidden',
      borderRadius: 'inherit',
      // --ripple-color overrides the text color; unset, it inherits.
      color: 'var(--ripple-color)',
      pointerEvents: 'none',
    })
    host.append(layer)
  }
  return layer
}

function press(el: HTMLElement, state: State, point?: { x: number; y: number }) {
  release(el, state)
  if (isDisabled(el, state)) return
  el.setAttribute('data-pressed', '')

  const layer = layerFor(state.options.host?.() ?? el)
  const rect = layer.getBoundingClientRect()
  const { width: w, height: h } = rect
  if (!w || !h) return
  const end = Math.hypot(w, h) / 2 + END_PADDING
  const start = Math.max(w, h) * 0.3
  // Starts under the pointer and drifts to the center as it grows.
  const dx = point ? point.x - rect.left - w / 2 : 0
  const dy = point ? point.y - rect.top - h / 2 : 0

  const circle = document.createElement('span')
  Object.assign(circle.style, {
    position: 'absolute',
    left: `${w / 2 - end}px`,
    top: `${h / 2 - end}px`,
    width: `${end * 2}px`,
    height: `${end * 2}px`,
    borderRadius: '50%',
    background: 'currentColor',
    opacity: '0',
  })
  layer.append(circle)

  if (typeof circle.animate !== 'function') {
    circle.style.opacity = String(PRESSED_OPACITY)
    state.wave = { circle, entered: Promise.resolve() }
    return
  }
  const animations = [
    circle.animate([{ opacity: 0 }, { opacity: PRESSED_OPACITY }], {
      duration: FADE_IN_MS,
      easing: 'linear',
      fill: 'forwards',
    }),
  ]
  // Reduced motion: no growth, just the fade.
  if (!prefersReducedMotion()) {
    animations.push(
      circle.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${start / end})` }, { transform: 'none' }],
        { duration: EXPAND_MS, easing: 'linear' },
      ),
    )
  }
  state.wave = {
    circle,
    entered: Promise.all(animations.map((a) => a.finished)).catch(() => undefined),
  }
}

function release(el: HTMLElement, state: State) {
  clearTimeout(state.touchTimer)
  state.touchTimer = undefined
  if (state.pendingPoint) {
    // Tapped and released inside the touch delay: show the ripple now, then let it go.
    const point = state.pendingPoint
    state.pendingPoint = undefined
    press(el, state, point)
  }
  el.removeAttribute('data-pressed')
  const wave = state.wave
  if (!wave) return
  state.wave = undefined
  const { circle } = wave
  // Fade out only once it has fully grown in.
  void wave.entered.then(() => {
    if (typeof circle.animate !== 'function') return circle.remove()
    circle
      .animate([{ opacity: PRESSED_OPACITY }, { opacity: 0 }], { duration: FADE_OUT_MS, easing: 'linear', fill: 'forwards' })
      .finished.finally(() => circle.remove())
  })
}

const TEXT_ENTRY = 'input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"]), textarea, select, [contenteditable]'
const TOGGLE_INPUT = 'input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"], [role="switch"]'
const LINK = 'a[href], [role="link"]'

/** Whether this key activates the element (and so presses it). */
function activates(el: HTMLElement, key: string) {
  if (el.matches(TEXT_ENTRY)) return false
  if (key === ' ') return !el.matches(LINK)
  if (key === 'Enter') return !el.matches(TOGGLE_INPUT)
  return false
}

export const vRipple: ObjectDirective<HTMLElement, RippleValue> = {
  mounted(el, binding) {
    const state: State = { options: normalize(binding.value), cleanup: () => {} }
    states.set(el, state)

    const up = () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      release(el, state)
    }
    const cancel = () => {
      // A cancelled touch (usually a scroll) never shows its ripple.
      state.pendingPoint = undefined
      up()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || claimed.has(e) || isDisabled(el, state)) return
      claimed.add(e)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', cancel)
      const point = { x: e.clientX, y: e.clientY }
      if (e.pointerType === 'touch') {
        state.pendingPoint = point
        state.touchTimer = setTimeout(() => {
          state.pendingPoint = undefined
          press(el, state, point)
        }, TOUCH_DELAY_MS)
      } else {
        press(el, state, point)
      }
    }
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && state.wave) up()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target !== el || e.repeat || !activates(el, e.key)) return
      press(el, state)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') release(el, state)
    }
    const onBlur = () => release(el, state)

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('keyup', onKeyUp)
    el.addEventListener('blur', onBlur)
    el.addEventListener('dragstart', onBlur)
    state.cleanup = () => {
      up()
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('blur', onBlur)
      el.removeEventListener('dragstart', onBlur)
    }
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    state.options = normalize(binding.value)
    if (isDisabled(el, state)) release(el, state)
  },
  beforeUnmount(el) {
    states.get(el)?.cleanup()
    states.delete(el)
  },
}
