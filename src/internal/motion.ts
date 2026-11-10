/**
 * Web Animations helpers that read the M3 Expressive motion tokens from theme.css
 * and respect prefers-reduced-motion.
 * Spec: https://m3.material.io/styles/motion/overview/specs
 */

export type Speed = 'fast' | 'default' | 'slow'

export interface Timing {
  duration: number
  easing: string
}

/**
 * Fallbacks when theme.css isn't loaded: the spec's spring-to-curve conversion
 * for the web (Expressive scheme).
 */
const SPATIAL_FALLBACK: Record<Speed, Timing> = {
  fast: { duration: 350, easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.9)' },
  default: { duration: 500, easing: 'cubic-bezier(0.38, 1.21, 0.22, 1)' },
  slow: { duration: 650, easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)' },
}
const EFFECTS_FALLBACK: Record<Speed, Timing> = {
  fast: { duration: 150, easing: 'cubic-bezier(0.31, 0.94, 0.34, 1)' },
  default: { duration: 200, easing: 'cubic-bezier(0.34, 0.8, 0.34, 1)' },
  slow: { duration: 300, easing: 'cubic-bezier(0.34, 0.88, 0.34, 1)' },
}

/** Reads a motion token from theme.css, e.g. cssVar(el, '--ease-spring-fast-spatial'). */
export function cssVar(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

function token(el: Element | null | undefined, ease: string, duration: string, fallback: Timing): Timing {
  if (!el) return fallback
  const ms = parseFloat(cssVar(el, duration, ''))
  return {
    duration: Number.isFinite(ms) ? ms : fallback.duration,
    easing: cssVar(el, ease, fallback.easing),
  }
}

/** Spatial spring (md.sys.motion.spring.*.spatial): position, size, scale, shape. */
export function spatial(el: Element | null | undefined, speed: Speed = 'default'): Timing {
  return token(el, `--ease-spring-${speed}-spatial`, `--duration-spring-${speed}-spatial`, SPATIAL_FALLBACK[speed])
}

/** Effects spring (md.sys.motion.spring.*.effects): opacity and color. */
export function effects(el: Element | null | undefined, speed: Speed = 'default'): Timing {
  return token(el, `--ease-effects-${speed}`, `--duration-effects-${speed}`, EFFECTS_FALLBACK[speed])
}

/**
 * Stops a spring at the first moment it reaches its target, so it doesn't overshoot.
 * For surfaces pinned to an edge (sheets) or that can't grow past their box: an
 * overshoot there would open a gap or overflow. Only sampled linear() springs
 * are trimmed; a cubic-bezier fallback is returned as is.
 */
export function noOvershoot({ duration, easing }: Timing): Timing {
  const m = /^linear\((.*)\)$/s.exec(easing.trim())
  if (!m) return { duration, easing }
  const points = m[1].split(',').map((p) => p.trim())
  // Only evenly spaced points (no explicit percentages) can be trimmed this simply.
  if (points.some((p) => /\s|%/.test(p))) return { duration, easing }
  const values = points.map(Number)
  const end = values.findIndex((v) => v >= 1)
  if (end <= 0 || end === values.length - 1) return { duration, easing }
  const kept = [...values.slice(0, end), 1]
  return {
    duration: Math.round((duration * end) / (values.length - 1)),
    easing: `linear(${kept.join(', ')})`,
  }
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Fades a 32% scrim in (enter) or out (leave; it stays hidden until removed). */
export function scrimIn(el: Element | null | undefined) {
  return animate(el, [{ opacity: 0 }, { opacity: 0.32 }], effects(el, 'slow'))
}
export function scrimOut(el: Element | null | undefined) {
  return animate(el, [{ opacity: 0.32 }, { opacity: 0 }], { ...effects(el, 'fast'), fill: 'forwards' })
}

/** Fades an element in, or out (leave; it stays hidden until removed). */
export function fadeIn(el: Element | null | undefined, speed: Speed = 'fast') {
  return animate(el, [{ opacity: 0 }, { opacity: 1 }], effects(el, speed))
}
export function fadeOut(el: Element | null | undefined, speed: Speed = 'fast') {
  return animate(el, [{ opacity: 1 }, { opacity: 0 }], { ...effects(el, speed), fill: 'forwards' })
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
