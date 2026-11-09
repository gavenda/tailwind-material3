import type { InjectionKey } from 'vue'

export type NavValue = string | number

/** What a NavigationBar or NavigationRail shares with its items. Fields are reactive getters. */
export interface NavContext {
  /** vertical: icon over label; horizontal: icon beside label inside the indicator. */
  readonly layout: 'vertical' | 'horizontal'
  readonly container: 'bar' | 'rail'
  /** Rail only: the expanded rail's full-width items. */
  readonly expanded: boolean
  isActive(value: NavValue | undefined): boolean
  select(value: NavValue | undefined): void
}

export const navKey: InjectionKey<NavContext> = Symbol('Navigation')
