<script setup lang="ts">
// Renders a Material Symbols SVG (imported with ?raw) at its container's size,
// filled with the current text color.
defineProps<{ svg: string }>()
</script>

<template>
  <span class="inline-flex fill-current *:size-full" v-html="svg" />
</template>
