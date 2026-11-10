/** Web Animations helpers that respect prefers-reduced-motion. */

export const EMPHASIZED_DECELERATE = 'cubic-bezier(0.05, 0.7, 0.1, 1)'
export const EMPHASIZED_ACCELERATE = 'cubic-bezier(0.3, 0, 0.8, 0.15)'

/** Reads a motion token from theme.css, e.g. cssVar(el, '--ease-spring-fast-spatial'). */
export function cssVar(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Fades a 32% scrim in (enter) or out (leave; it stays hidden until removed). */
export function scrimIn(el: Element | null | undefined, duration = 300) {
  return animate(el, [{ opacity: 0 }, { opacity: 0.32 }], { duration, easing: 'linear' })
}
export function scrimOut(el: Element | null | undefined, duration = 150) {
  return animate(el, [{ opacity: 0.32 }, { opacity: 0 }], { duration, easing: 'linear', fill: 'forwards' })
}

/**
 * Runs an animation and resolves when it ends or is cancelled.
 * Resolves straight away when motion is reduced or the element is missing.
 */
export function animate(
  el: Element | null | undefined,
  frames: Keyframe[],
  options: KeyframeAnimationOptions,
): Promise<void> {
  // Hidden pages throttle animations; skip them so closes never wait on a paused timeline.
  if (!el || prefersReducedMotion() || document.visibilityState === 'hidden' || typeof el.animate !== 'function') {
    return Promise.resolve()
  }
  return el.animate(frames, options).finished.then(
    () => undefined,
    () => undefined,
  )
}
