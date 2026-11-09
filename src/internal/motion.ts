/** Web Animations helpers that respect prefers-reduced-motion. */

export const EMPHASIZED = 'cubic-bezier(0.2, 0, 0, 1)'
export const EMPHASIZED_DECELERATE = 'cubic-bezier(0.05, 0.7, 0.1, 1)'
export const EMPHASIZED_ACCELERATE = 'cubic-bezier(0.3, 0, 0.8, 0.15)'

/** Reads a motion token from theme.css, e.g. cssVar(el, '--ease-spring-fast-spatial'). */
export function cssVar(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
