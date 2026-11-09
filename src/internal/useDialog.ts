/**
 * Drives a native <dialog> from a boolean model, with enter/leave animations.
 * - Modal dialogs use showModal() (focus trap, top layer, Escape); others use show().
 * - Escape runs our own close so it animates; `persistent` keeps it open (still emits cancel).
 * - A <form method="dialog"> submit or dialog.close() syncs the model.
 */
import { nextTick, onMounted, watch, type Ref } from 'vue'

export interface DialogOptions {
  modal?: () => boolean
  persistent?: () => boolean
  enter?: () => Promise<unknown> | void
  leave?: () => Promise<unknown> | void
  onCancel?: () => void
  onClosed?: () => void
}

export function useDialog(dialog: Readonly<Ref<HTMLDialogElement | null>>, open: Ref<boolean>, options: DialogOptions = {}) {
  let generation = 0

  async function show() {
    const el = dialog.value
    if (!(el instanceof HTMLDialogElement) || el.open) return
    ++generation
    if (options.modal?.() ?? true) el.showModal()
    else el.show()
    await nextTick()
    await options.enter?.()
  }

  async function hide() {
    const el = dialog.value
    if (!(el instanceof HTMLDialogElement) || !el.open) return
    const mine = ++generation
    await options.leave?.()
    if (mine !== generation) return // reopened meanwhile
    el.close()
    el.getAnimations({ subtree: true }).forEach((a) => a.cancel())
    options.onClosed?.()
  }

  watch(open, (on) => (on ? show() : hide()))
  onMounted(() => {
    if (open.value) show()
  })

  function cancel() {
    options.onCancel?.()
    if (!options.persistent?.()) open.value = false
  }

  /** Bind to the dialog's @cancel (Escape). */
  function onCancel(e: Event) {
    e.preventDefault()
    cancel()
  }

  /** Bind to the dialog's @close (closed some other way). */
  function onClose() {
    if (open.value) {
      open.value = false
      options.onClosed?.()
    }
  }

  return { cancel, onCancel, onClose }
}
