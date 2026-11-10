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
 * Scrolling snaps to items. Height comes from `height` (or the parent for full-screen).
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

