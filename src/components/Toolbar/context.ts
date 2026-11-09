import type { InjectionKey } from 'vue'

export type ToolbarColor = 'standard' | 'vibrant'

/** Lets IconButtons in a Toolbar use the toolbar's color roles. */
export interface ToolbarContext {
  readonly color: ToolbarColor
}

export const toolbarKey: InjectionKey<ToolbarContext> = Symbol('Toolbar')

/** Standard icon button colors inside a toolbar (md.comp.toolbar.{standard,vibrant}). */
export const toolbarButtonColors: Record<ToolbarColor, { default: string; unselected: string; selected: string }> = {
  standard: {
    default: 'text-on-surface-variant',
    unselected: 'text-on-surface-variant',
    selected: 'bg-secondary-container text-on-secondary-container',
  },
  vibrant: {
    default: 'text-on-primary-container',
    unselected: 'text-on-primary-container',
    selected: 'bg-surface-container text-on-surface',
  },
}
