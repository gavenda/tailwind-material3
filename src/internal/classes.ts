/** Class strings many components share. */

/** Focus indicator: 3dp secondary, 2dp outer offset. */
export const focusRing =
  'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary'

/** Same focus ring, drawn inside the element (for items in a container that clips). */
export const focusRingInset =
  'focus:outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-secondary'

/**
 * State layer in the current text color on ::before: hover 8%, focus 10%, pressed 10%.
 * The element must be `relative` (and clip or round its own corners).
 */
export const stateLayer = [
  'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity',
  'hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10',
].join(' ')

/** Invisible 48dp touch target on ::after, centred on the element. */
export const touchTarget =
  'after:absolute after:top-1/2 after:left-1/2 after:h-12 after:w-[max(100%,3rem)] after:-translate-1/2'

/** Resets the UA styles of a [popover] element so we can position and style it ourselves. */
export const popoverReset = 'm-0 overflow-visible border-0 bg-transparent p-0 text-inherit [inset:auto]'
