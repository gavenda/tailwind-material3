import type { InjectionKey } from 'vue'

export type TabsVariant = 'primary' | 'secondary'
export type TabValue = string | number

export interface TabsContext {
  readonly variant: TabsVariant
  isActive(value: TabValue): boolean
  select(value: TabValue): void
}

export const tabsKey: InjectionKey<TabsContext> = Symbol('Tabs')
