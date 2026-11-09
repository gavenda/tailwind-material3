<script setup lang="ts">
/**
 * Material 3 tabs: primary or secondary.
 * Spec: https://m3.material.io/components/tabs/specs
 * Tokens: md.comp.primary-navigation-tab, md.comp.secondary-navigation-tab
 *
 * - `v-model` holds the active Tab's value.
 * - Primary: 3dp indicator under the tab's content. Secondary: 2dp under the whole tab.
 *   The indicator slides between tabs.
 * - `scrollable`: tabs keep their natural width and the row scrolls; otherwise they share it.
 * - Arrow keys, Home and End move between tabs and select them.
 * Link each Tab to its panel with `aria-controls` on the Tab and `aria-labelledby` on the panel.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRovingFocus } from '../../internal/useRovingFocus'
import { tabsKey, type TabsVariant, type TabValue } from './context'

const props = withDefaults(
  defineProps<{
    variant?: TabsVariant
    scrollable?: boolean
    label?: string
  }>(),
  {
    variant: 'primary',
    scrollable: false,
    label: undefined,
  },
)

const model = defineModel<TabValue>()

const list = useTemplateRef<HTMLElement>('list')
const { onKeydown: rove } = useRovingFocus(list, '[role="tab"]', 'horizontal')

provide(
  tabsKey,
  reactive({
    variant: computed(() => props.variant),
    isActive: (v: TabValue) => v === model.value,
    select: (v: TabValue) => (model.value = v),
  }),
)

// --- Indicator: measured from the active tab (primary: its content, secondary: the whole tab).
const indicator = ref<{ left: number; width: number } | null>(null)
const animateIndicator = ref(false)

function measure() {
  const root = list.value
  const tab = root?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  if (!root || !tab) {
    indicator.value = null
    return
  }
  const target =
    props.variant === 'primary' ? (tab.querySelector<HTMLElement>('[data-tab-content]') ?? tab) : tab
  const r = target.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  const left = r.left - rootRect.left + root.scrollLeft
  // Primary indicators are at least 24dp wide.
  const width = props.variant === 'primary' ? Math.max(24, r.width) : r.width
  indicator.value = { left: left - (width - r.width) / 2, width }
}

let resize: ResizeObserver | undefined
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && list.value) {
    resize = new ResizeObserver(measure)
    resize.observe(list.value)
  }
  // Only animate once the first position is set.
  requestAnimationFrame(() => (animateIndicator.value = true))
})
onBeforeUnmount(() => resize?.disconnect())

watch([model, () => props.variant], async () => {
  await nextTick()
  measure()
  list.value
    ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
})

// Arrow keys move focus and select (automatic activation).
function onKeydown(e: KeyboardEvent) {
  rove(e)
  const el = document.activeElement as HTMLElement | null
  if (el?.getAttribute('role') === 'tab' && list.value?.contains(el) && el.getAttribute('aria-selected') !== 'true') {
    el.click()
  }
}
</script>

<template>
  <div class="relative w-full border-b border-surface-variant">
    <div
      ref="list"
      role="tablist"
      :aria-label="label"
      :class="['relative flex', scrollable && 'overflow-x-auto [scrollbar-width:none] *:flex-none']"
      @keydown="onKeydown"
    >
      <slot />
      <span
        v-if="indicator"
        aria-hidden="true"
        :class="[
          'pointer-events-none absolute bottom-0 bg-primary',
          variant === 'primary' ? 'h-[3px] rounded-t-[3px]' : 'h-0.5',
          animateIndicator &&
            'transition-[left,width] duration-(--duration-spring-default-spatial) ease-spring-default-spatial motion-reduce:transition-none',
        ]"
        :style="{ left: `${indicator.left}px`, width: `${indicator.width}px` }"
      />
    </div>
  </div>
</template>
