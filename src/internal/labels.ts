/** Text a component shows or announces, overridable for translation. */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/** Merges a partial `labels` prop over the English defaults. */
export function useLabels<T extends object>(defaults: T, overrides: MaybeRefOrGetter<Partial<T> | undefined>) {
  return computed<T>(() => ({ ...defaults, ...toValue(overrides) }))
}

/** Fills "{name}" placeholders, e.g. fill('Use {pattern}', { pattern: 'mm/dd/yyyy' }). */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}
