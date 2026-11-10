/**
 * M3 breakpoints (window size classes), measured on an element rather than the
 * window so the examples can be previewed at any width.
 * https://m3.material.io/foundations/layout/breakpoints/overview
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export type SizeClass = 'compact' | 'medium' | 'expanded' | 'large' | 'extra-large'

export function sizeClassOf(width: number): SizeClass {
  if (width < 600) return 'compact'
  if (width < 840) return 'medium'
  if (width < 1200) return 'expanded'
  if (width < 1600) return 'large'
  return 'extra-large'
}

/** At least `min` wide. */
export function atLeast(size: SizeClass, min: SizeClass) {
  const order: SizeClass[] = ['compact', 'medium', 'expanded', 'large', 'extra-large']
  return order.indexOf(size) >= order.indexOf(min)
}

/** Window margin: 16dp in compact windows, 24dp from medium up. */
export function marginOf(size: SizeClass) {
  return size === 'compact' ? 'px-4' : 'px-6'
}

/** The element's width in px, kept up to date. */
export function useWidth(el: Ref<HTMLElement | null>) {
  const width = ref(0)
  let observer: ResizeObserver | undefined
  onMounted(() => {
    if (!el.value) return
    width.value = el.value.clientWidth
    observer = new ResizeObserver(([entry]) => (width.value = entry.contentRect.width))
    observer.observe(el.value)
  })
  onBeforeUnmount(() => observer?.disconnect())
  return width
}
