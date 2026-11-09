<script setup lang="ts">
import { ref } from 'vue'
import { Fab, IconButton, Toolbar } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const bold = ref(true)
const italic = ref(false)
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Toolbars</h2>
    <div class="flex flex-col items-start gap-6">
      <div class="w-[480px] overflow-hidden rounded-2xl">
        <Toolbar label="Message actions">
          <IconButton variant="standard" label="Archive"><Icon :svg="icons.archive" /></IconButton>
          <IconButton variant="standard" label="Delete"><Icon :svg="icons.deleteIcon" /></IconButton>
          <IconButton variant="standard" label="Label"><Icon :svg="icons.label" /></IconButton>
          <IconButton variant="standard" label="More"><Icon :svg="icons.moreVert" /></IconButton>
        </Toolbar>
      </div>
      <div class="w-[480px] overflow-hidden rounded-2xl">
        <Toolbar color="vibrant" label="Vibrant docked">
          <IconButton variant="standard" label="Undo"><Icon :svg="icons.undo" /></IconButton>
          <IconButton variant="standard" label="Redo"><Icon :svg="icons.redo" /></IconButton>
          <IconButton variant="filled" label="Send"><Icon :svg="icons.send" /></IconButton>
        </Toolbar>
      </div>
      <div class="flex items-center gap-8">
        <Toolbar variant="floating" label="Formatting">
          <IconButton v-model:selected="bold" variant="standard" toggle label="Bold"><Icon :svg="icons.formatBold" /></IconButton>
          <IconButton v-model:selected="italic" variant="standard" toggle label="Italic"><Icon :svg="icons.formatItalic" /></IconButton>
          <IconButton variant="standard" label="Underline"><Icon :svg="icons.formatUnderlined" /></IconButton>
          <IconButton variant="standard" label="Text color"><Icon :svg="icons.formatColorText" /></IconButton>
          <template #fab>
            <Fab color="secondary-container" aria-label="Add"><template #icon><Icon :svg="icons.add" /></template></Fab>
          </template>
        </Toolbar>
        <Toolbar variant="floating" color="vibrant" vertical label="Vertical">
          <IconButton v-model:selected="bold" variant="standard" toggle label="Bold"><Icon :svg="icons.formatBold" /></IconButton>
          <IconButton variant="standard" label="Link"><Icon :svg="icons.link" /></IconButton>
          <IconButton variant="standard" label="Image"><Icon :svg="icons.image" /></IconButton>
          <template #fab>
            <Fab color="tertiary-container" aria-label="Edit"><template #icon><Icon :svg="icons.edit" /></template></Fab>
          </template>
        </Toolbar>
      </div>
    </div>
  </section>
</template>
