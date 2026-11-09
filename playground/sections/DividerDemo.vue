<script setup lang="ts">
import { Divider } from '../../src'
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Dividers</h2>
    <div class="flex w-96 flex-col gap-4 rounded-2xl bg-surface-container-low py-4">
      <p class="px-4 text-body-medium">Full width</p>
      <Divider />
      <p class="px-4 text-body-medium">Inset start</p>
      <Divider inset="start" />
      <p class="px-4 text-body-medium">Inset both</p>
      <Divider inset="both" />
      <div class="flex h-10 items-center gap-4 px-4 text-body-medium">
        <span>Left</span>
        <Divider vertical />
        <span>Vertical</span>
        <Divider vertical inset="both" />
        <span>Inset</span>
      </div>
    </div>
  </section>
</template>
