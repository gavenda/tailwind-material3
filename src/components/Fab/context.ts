import type { InjectionKey } from 'vue'

export type FabMenuColor = 'primary' | 'secondary' | 'tertiary'

export interface FabMenuContext {
  readonly color: FabMenuColor
  close(): void
}

export const fabMenuKey: InjectionKey<FabMenuContext> = Symbol('FabMenu')
