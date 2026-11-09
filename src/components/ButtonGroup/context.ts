import type { InjectionKey } from 'vue'
import type { ButtonShape, ButtonSize } from '../Button/types'

export type ButtonGroupVariant = 'standard' | 'connected'
export type ButtonGroupSelection = 'single' | 'multiple'
export type ButtonValue = string | number

/** What a ButtonGroup shares with the Buttons inside it. Fields are reactive getters. */
export interface ButtonGroupContext {
  readonly variant: ButtonGroupVariant
  readonly size: ButtonSize
  readonly shape: ButtonShape
  /** True when the group manages selection; Buttons with a `value` become toggles. */
  readonly selectable: boolean
  isSelected(value: ButtonValue): boolean
  toggle(value: ButtonValue): void
  register(el: HTMLElement): void
  unregister(el: HTMLElement): void
  /** Where a Button sits in the group, in DOM order. */
  position(el: HTMLElement | undefined): { first: boolean; last: boolean }
}

export const buttonGroupKey: InjectionKey<ButtonGroupContext> = Symbol('ButtonGroup')
