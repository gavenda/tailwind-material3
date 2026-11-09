import type { InjectionKey } from 'vue'

export interface ListContext {
  readonly segmented: boolean
}

export const listKey: InjectionKey<ListContext> = Symbol('List')
