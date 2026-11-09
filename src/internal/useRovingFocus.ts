/**
 * Arrow-key focus movement between items in a container (menus, tabs, nav, toolbars).
 * Items are found by selector at key time, so they can come and go freely.
 * Disabled items (disabled or aria-disabled="true") are skipped.
 */
import type { Ref } from 'vue'

export type Orientation = 'horizontal' | 'vertical' | 'both'

export function useRovingFocus(
  container: Readonly<Ref<HTMLElement | null>>,
  selector: string,
  orientation: Orientation = 'vertical',
) {
  function items() {
    const root = container.value
    if (!root) return []
    return [...root.querySelectorAll<HTMLElement>(selector)].filter(
      (el) => !el.matches(':disabled, [aria-disabled="true"]'),
    )
  }

  function focusAt(index: number) {
    const list = items()
    if (!list.length) return
    list[(index + list.length) % list.length].focus()
  }

  const focusFirst = () => focusAt(0)
  const focusLast = () => focusAt(-1)

  function onKeydown(e: KeyboardEvent) {
    const list = items()
    const current = list.indexOf(document.activeElement as HTMLElement)
    const rtl = container.value ? getComputedStyle(container.value).direction === 'rtl' : false
    const vertical = orientation !== 'horizontal'
    const horizontal = orientation !== 'vertical'
    const next = rtl ? 'ArrowLeft' : 'ArrowRight'
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft'

    let target: number | undefined
    if ((vertical && e.key === 'ArrowDown') || (horizontal && e.key === next)) target = current + 1
    else if ((vertical && e.key === 'ArrowUp') || (horizontal && e.key === prev)) target = current < 0 ? -1 : current - 1
    else if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = -1
    if (target === undefined) return
    e.preventDefault()
    focusAt(target)
  }

  return { onKeydown, focusFirst, focusLast, items }
}
