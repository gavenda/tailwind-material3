<script setup lang="ts">
import { ref } from 'vue'
import { Button, Snackbar } from '../../src'

const simple = ref(false)
const withAction = ref(false)
const long = ref(false)
const log = ref('')
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Snackbars</h2>
    <div class="flex flex-wrap items-center gap-4">
      <Button variant="tonal" @click="simple = true">Simple</Button>
      <Button variant="tonal" @click="withAction = true">With action</Button>
      <Button variant="tonal" @click="long = true">Long action, persistent</Button>
      <span class="text-body-medium text-on-surface-variant">{{ log }}</span>
    </div>
    <Snackbar v-model:open="simple" message="Photo saved" />
    <Snackbar v-model:open="withAction" message="Conversation archived" action-label="Undo" closable @action="log = 'Undone'" />
    <Snackbar
      v-model:open="long"
      message="Couldn't connect. Check your connection and try again."
      action-label="Retry connection"
      long-action
      closable
      :timeout="0"
      @action="log = 'Retrying…'"
    />
  </section>
</template>
