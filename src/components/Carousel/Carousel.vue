<script setup lang="ts">
/**
 * Material 3 carousel: multi-browse, hero, uncontained, or full-screen.
 * Spec: https://m3.material.io/components/carousel/specs
 * Tokens: md.comp.carousel-item
 *
 * Put one element per item in the default slot (usually an <img> or a CarouselItem).
 * Items get 28dp corners and sit 8dp apart.
 * - multi-browse: large items, then a medium and a small one at the end. Items shrink as
 *   they scroll toward the edges; their content is masked (cropped), not squashed.
 * - hero: one large item and a small one peeking at the end.
 * - uncontained: fixed-width items that run off the edge.
 * - full-screen: one item at a time, edge to edge, scrolling vertically.
 * Scrolling snaps to items; with a mouse the carousel can also be dragged.
 * Height comes from `height` (or the parent for full-screen).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { focusRing } from '../../internal/classes'

export type CarouselLayout = 'multi-browse' | 'hero' | 'uncontained' | 'full-screen'

const props = withDefaults(
  defineProps<{
    layout?: CarouselLayout
    /** Large item width in px (multi-browse, uncontained). Hero fills what the small item leaves. */
    itemWidth?: number
    /** Small item width in px (40–56dp). */
    smallWidth?: number
    height?: string
    label?: string
  }>(),
  {
    layout: 'multi-browse',
    itemWidth: 186,
    smallWidth: 56,
    height: '13rem',
    label: undefined,
  },
)

const GAP = 8

const scroller = useTemplateRef<HTMLElement>('scroller')
const track = useTemplateRef<HTMLElement>('track')
const viewport = ref(0)
const count = ref(0)
const scroll = ref(0)

const keylined = computed(() => props.layout === 'multi-browse' || props.layout === 'hero')

/**
 * Keylines: the sizes items take, left to right, when the carousel is at rest.
 * Multi-browse: as many large items as fit, then one medium (between small and large)
 * and one small. Hero: one large and one small.
 */
const keylines = computed(() => {
  const W = viewport.value
  const S = props.smallWidth
  if (W <= 0) return { sizes: [] as number[], large: props.itemWidth }
  if (props.layout === 'hero') {
    const L = Math.max(S, W - S - GAP)
    return { sizes: [L, S], large: L }
  }
  const L = Math.min(props.itemWidth, W)
  // k large items + a medium + a small fill the width: k(L+gap) + (M+gap) + S = W.
  // Take as many large items as still leave the medium at least small-sized.
  const k = Math.max(1, Math.floor((W - 2 * S - GAP) / (L + GAP)))
  const M = Math.min(L, Math.max(S, W - S - GAP - k * (L + GAP)))
  return { sizes: [...Array(k).fill(L), M, S], large: L }
})

/**
 * Position and size of item i. In "focal" coordinates every item is large and they sit
 * L+gap apart; mapping those through the keylines gives where each item is drawn.
 */
function place(i: number) {
  const { sizes, large: L } = keylines.value
  const step = L + GAP
  const p = i * step - scroll.value // focal position relative to the viewport start
  // Keyline anchors in focal space and the drawn x / size at each.
  const anchors: { focal: number; x: number; size: number }[] = []
  let x = 0
  sizes.forEach((size, j) => {
    anchors.push({ focal: j * step, x, size })
    x += size + GAP
  })
  anchors.push({ focal: sizes.length * step, x: x, size: props.smallWidth }) // just off the end
  // Items leaving at the start shrink to small as they go.
  const before = { focal: -step, x: -props.smallWidth - GAP, size: props.smallWidth }
  const all = [before, ...anchors]

  if (p <= all[0].focal) return { x: all[0].x + (p - all[0].focal), size: all[0].size }
  for (let j = 0; j < all.length - 1; j++) {
    const a = all[j]
    const b = all[j + 1]
    if (p <= b.focal) {
      const t = (p - a.focal) / (b.focal - a.focal)
      return { x: a.x + (b.x - a.x) * t, size: a.size + (b.size - a.size) * t }
    }
  }
  const last = all[all.length - 1]
  return { x: last.x + (p - last.focal), size: last.size }
}

const itemStyles = computed(() => {
  if (!keylined.value) return []
  return Array.from({ length: count.value }, (_, i) => place(i))
})

/** Number of large keylines (where items rest at full size). */
const largeSlots = computed(() => Math.max(1, keylines.value.sizes.length - (props.layout === 'hero' ? 1 : 2)))

// Scroll length: until the last item settles in the last large slot.
const maxScroll = computed(() => Math.max(0, (count.value - largeSlots.value) * (keylines.value.large + GAP)))
const trackWidth = computed(() => (keylined.value ? viewport.value + maxScroll.value : undefined))

function layoutItems() {
  const el = track.value
  if (!el) return
  const items = [...el.children].filter((c) => !(c as HTMLElement).dataset.snap) as HTMLElement[]
  count.value = items.length
  if (!keylined.value) {
    items.forEach((item) => {
      item.style.cssText = ''
    })
    return
  }
  const styles = itemStyles.value
  const L = keylines.value.large
  items.forEach((item, i) => {
    const s = styles[i]
    if (!s) return
    // The item keeps its large width; clip-path masks it down to `size`, centred,
    // so its content looks cropped rather than squashed.
    const inset = (L - s.size) / 2
    item.style.position = 'absolute'
    item.style.top = '0'
    item.style.height = '100%'
    item.style.width = `${L}px`
    item.style.transform = `translateX(${s.x - inset + scroll.value}px)`
    item.style.clipPath = `inset(0 ${inset}px 0 ${inset}px round 28px)`
  })
}

function onScroll() {
  scroll.value = scroller.value?.scrollLeft ?? 0
}

watch([itemStyles, keylines], () => layoutItems(), { flush: 'post' })

let resize: ResizeObserver | undefined
let mutations: MutationObserver | undefined
onMounted(async () => {
  await nextTick()
  const measure = () => {
    viewport.value = scroller.value?.clientWidth ?? 0
    layoutItems()
  }
  measure()
  if (typeof ResizeObserver !== 'undefined' && scroller.value) {
    resize = new ResizeObserver(measure)
    resize.observe(scroller.value)
  }
  if (track.value) {
    mutations = new MutationObserver(measure)
    mutations.observe(track.value, { childList: true })
  }
})
onBeforeUnmount(() => {
  resize?.disconnect()
  mutations?.disconnect()
})

// Snap points for keyline layouts: one per item step.
const snapPoints = computed(() => {
  if (!keylined.value) return []
  const step = keylines.value.large + GAP
  return Array.from({ length: Math.floor(maxScroll.value / step) + 1 }, (_, i) => i * step)
})

/** Snap offsets along the scroll axis, for settling after a mouse drag. */
function snapOffsets(): number[] {
  const el = scroller.value
  if (!el) return []
  if (keylined.value) return snapPoints.value
  const vertical = props.layout === 'full-screen'
  const max = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth
  const items = [...(track.value?.children ?? [])] as HTMLElement[]
  const offsets = items.map((c) => Math.min(max, vertical ? c.offsetTop : c.offsetLeft))
  return [...new Set(offsets)].sort((a, b) => a - b)
}

// Mouse drag. Touch and trackpads already scroll natively.
const DRAG_THRESHOLD = 4
let drag: { id: number; start: number; origin: number; moved: boolean } | undefined
let restoreSnap: (() => void) | undefined

function axis(e: PointerEvent) {
  return props.layout === 'full-screen' ? e.clientY : e.clientX
}

function onPointerDown(e: PointerEvent) {
  const el = scroller.value
  if (!el || e.pointerType !== 'mouse' || e.button !== 0) return
  restoreSnap?.()
  drag = {
    id: e.pointerId,
    start: axis(e),
    origin: props.layout === 'full-screen' ? el.scrollTop : el.scrollLeft,
    moved: false,
  }
}

function onPointerMove(e: PointerEvent) {
  const el = scroller.value
  if (!el || !drag || e.pointerId !== drag.id) return
  const delta = axis(e) - drag.start
  if (!drag.moved) {
    if (Math.abs(delta) < DRAG_THRESHOLD) return
    drag.moved = true
    el.setPointerCapture(e.pointerId)
    // Snapping fights manual scrolling, so turn it off until the drag settles.
    el.style.scrollSnapType = 'none'
    el.style.cursor = 'grabbing'
  }
  e.preventDefault()
  if (props.layout === 'full-screen') el.scrollTop = drag.origin - delta
  else el.scrollLeft = drag.origin - delta
}

function onPointerUp(e: PointerEvent) {
  const el = scroller.value
  if (!el || !drag || e.pointerId !== drag.id) return
  const { moved, origin } = drag
  drag = undefined
  if (!moved) return
  el.style.cursor = ''
  if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)

  // Settle on the nearest item; a deliberate drag always moves at least one item.
  const vertical = props.layout === 'full-screen'
  const pos = vertical ? el.scrollTop : el.scrollLeft
  const offsets = snapOffsets()
  let target = pos
  if (offsets.length) {
    const nearest = (v: number) => offsets.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a))
    target = nearest(pos)
    const from = nearest(origin)
    if (target === from && Math.abs(pos - origin) > 32) {
      const i = offsets.indexOf(from) + Math.sign(pos - origin)
      target = offsets[Math.max(0, Math.min(offsets.length - 1, i))]
    }
  }

  const done = () => {
    el.removeEventListener('scrollend', done)
    clearTimeout(timer)
    el.style.scrollSnapType = ''
    restoreSnap = undefined
  }
  const timer = setTimeout(done, 600)
  el.addEventListener('scrollend', done)
  restoreSnap = done
  el.scrollTo({ [vertical ? 'top' : 'left']: target, behavior: 'smooth' })

  // The click that ends a drag shouldn't activate whatever is under the pointer.
  // It fires straight after pointerup, so the flag only needs to last one task.
  suppressClick = true
  setTimeout(() => (suppressClick = false), 0)
}

let suppressClick = false
function onClickCapture(e: MouseEvent) {
  if (!suppressClick) return
  suppressClick = false
  e.stopPropagation()
  e.preventDefault()
}
</script>

<template>
  <div
    ref="scroller"
    role="region"
    aria-roledescription="carousel"
    :aria-label="label"
    tabindex="0"
    :class="[
      'relative [scrollbar-width:none]',
      focusRing,
      layout === 'full-screen'
        ? 'h-full snap-y snap-mandatory overflow-y-auto'
        : 'snap-x snap-mandatory overflow-x-auto overscroll-x-contain',
    ]"
    :style="layout === 'full-screen' ? undefined : { height }"
    @scroll="onScroll"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @dragstart.prevent
    @click.capture="onClickCapture"
  >
    <div
      ref="track"
      :class="[
        'relative h-full',
        keylined && '[&>*]:overflow-hidden [&>*]:bg-surface [&>*]:object-cover',
        layout === 'uncontained' && 'flex gap-2 [&>*]:w-(--carousel-item-width) [&>*]:shrink-0 [&>*]:snap-start [&>*]:overflow-hidden [&>*]:rounded-[28px] [&>*]:object-cover',
        layout === 'full-screen' && 'flex flex-col [&>*]:h-full [&>*]:w-full [&>*]:shrink-0 [&>*]:snap-start [&>*]:object-cover',
      ]"
      :style="
        keylined
          ? { width: `${trackWidth}px` }
          : layout === 'uncontained'
            ? { '--carousel-item-width': `${itemWidth}px` }
            : undefined
      "
    >
      <slot />
      <span
        v-for="(x, i) in snapPoints"
        :key="i"
        data-snap="true"
        aria-hidden="true"
        class="pointer-events-none absolute top-0 h-px w-px snap-start"
        :style="{ left: `${x}px` }"
      />
    </div>
  </div>
</template>

