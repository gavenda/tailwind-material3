import type { InjectionKey } from 'vue'

export type MenuVariant = 'standard' | 'vibrant'

/** What a Menu shares with its groups and items. Fields are reactive getters. */
export interface MenuContext {
  readonly variant: MenuVariant
  /** Close the menu, e.g. after an item is chosen. */
  close(): void
  /** MenuGroups register so the Menu stops drawing its own single group surface. */
  addGroup(): void
  removeGroup(): void
}

export const menuKey: InjectionKey<MenuContext> = Symbol('Menu')

/** Container colors per variant. Used by Menu (single group) and MenuGroup. */
export const menuSurface: Record<MenuVariant, string> = {
  standard: 'bg-surface-container-low',
  vibrant: 'bg-tertiary-container',
}

/**
 * Group surface: 16dp outer corners, 8dp where groups meet, 4dp side padding, elevation 2.
 * No display class here: on the Menu itself that would override the hidden state of a closed popover.
 */
export const groupClasses =
  'px-1 py-0.5 shadow-elevation-2 rounded-[8px] first:rounded-t-2xl last:rounded-b-2xl'
