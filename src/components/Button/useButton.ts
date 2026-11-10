/**
 * Behavior shared by Button and IconButton: group membership, toggle state,
 * and corner shapes (resting, pressed, selected, connected-group).
 */
import { computed, inject, onBeforeUnmount, onMounted, type Ref, type ShallowRef } from 'vue'
import { focusRing, stateLayer } from '../../internal/classes'
import { buttonGroupKey, type ButtonValue } from '../ButtonGroup/context'
import type { ButtonShape, ButtonSize } from './types'

interface ShapeSpec {
  /** Container height; round corners are half of it */
  height: number
  /** Square corner and pressed corner (md.comp.button / icon-button size sets) */
  square: number
  pressed: number
  /** Connected group inner corners (md.comp.button-group.connected) */
  inner: number
  innerPressed: number
}

/** Corner sizes in px. Buttons and icon buttons share these per size. */
export const shapeTokens: Record<ButtonSize, ShapeSpec> = {
  xs: { height: 32, square: 12, pressed: 8, inner: 8, innerPressed: 4 },
  s: { height: 40, square: 12, pressed: 8, inner: 8, innerPressed: 4 },
  m: { height: 56, square: 16, pressed: 12, inner: 8, innerPressed: 4 },
  l: { height: 96, square: 28, pressed: 16, inner: 16, innerPressed: 12 },
  xl: { height: 136, square: 28, pressed: 16, inner: 20, innerPressed: 16 },
}

/** Classes every button container shares. Corners come from the CSS variables in `corners`. */
export const buttonBaseClasses = [
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none shape-morph',
  'rounded-s-(--corner-s) rounded-e-(--corner-e) active:rounded-s-(--corner-s-pressed) active:rounded-e-(--corner-e-pressed)',
  focusRing,
  stateLayer,
  // Disabled: content on-surface @ 38%, no elevation or state layer
  'disabled:pointer-events-none disabled:text-on-surface/38 disabled:shadow-none',
]

export interface ButtonBaseProps {
  size?: ButtonSize
  shape?: ButtonShape
  toggle: boolean
  value?: ButtonValue
}

export function useButton(
  props: ButtonBaseProps,
  selectedModel: Ref<boolean>,
  root: Readonly<ShallowRef<HTMLElement | null>>,
  /** Return false (and warn) when this style can't be a toggle. */
  canToggle: () => boolean = () => true,
) {
  const group = inject(buttonGroupKey, null)

  onMounted(() => root.value && group?.register(root.value))
  onBeforeUnmount(() => root.value && group?.unregister(root.value))

  const size = computed(() => props.size ?? group?.size ?? 's')
  const shape = computed(() => props.shape ?? group?.shape ?? 'round')
  const connected = computed(() => group?.variant === 'connected')
  const groupSelects = computed(() => !!group?.selectable && props.value !== undefined)

  const isToggle = computed(() => (props.toggle || groupSelects.value) && canToggle())

  const isSelected = computed(() => {
    if (!isToggle.value) return false
    return groupSelects.value ? group!.isSelected(props.value!) : selectedModel.value
  })

  /**
   * Corner radii per logical side, as CSS variables. Round corners use half the
   * height (not 9999px) so the morph animates evenly.
   */
  const corners = computed(() => {
    const s = shapeTokens[size.value]
    const pill = s.height / 2
    const px = (n: number) => `${n}px`

    if (connected.value) {
      // Outer corners keep the group shape; inner corners are tighter and
      // become a pill when selected.
      const { first, last } = group!.position(root.value ?? undefined)
      const outer = shape.value === 'square' ? s.inner : pill
      const inner = isSelected.value ? pill : s.inner
      return {
        '--corner-s': px(first ? outer : inner),
        '--corner-e': px(last ? outer : inner),
        '--corner-s-pressed': px(first ? outer : s.innerPressed),
        '--corner-e-pressed': px(last ? outer : s.innerPressed),
      }
    }

    // A selected toggle swaps round <-> square.
    const square = (shape.value === 'square') !== isSelected.value
    const rest = px(square ? s.square : pill)
    return {
      '--corner-s': rest,
      '--corner-e': rest,
      '--corner-s-pressed': px(s.pressed),
      '--corner-e-pressed': px(s.pressed),
    }
  })

  function onClick() {
    if (!isToggle.value) return
    if (groupSelects.value) group!.toggle(props.value!)
    else selectedModel.value = !selectedModel.value
  }

  return { size, connected, isToggle, isSelected, corners, onClick }
}
