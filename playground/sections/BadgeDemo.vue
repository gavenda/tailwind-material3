<script setup lang="ts">
import { ref } from 'vue'
import { Badge, IconButton } from '../../src'
import Icon from '../Icon.vue'
import { icons } from '../icons'

const count = ref(3)
</script>

<template>
  <section>
    <h2 class="mb-4 text-xl">Badges</h2>
    <div class="flex items-center gap-8">
      <Badge><Icon :svg="icons.notifications" class="size-6" /></Badge>
      <Badge :value="count" :label="`${count} new messages`"><Icon :svg="icons.mail" class="size-6" /></Badge>
      <Badge :value="42"><Icon :svg="icons.inbox" class="size-6" /></Badge>
      <Badge :value="1200"><Icon :svg="icons.inbox" class="size-6" /></Badge>
      <Badge :value="count" :hidden="count === 0">
        <IconButton variant="standard" :label="`Notifications, ${count} new`" @click="count = count ? count - 1 : 5">
          <Icon :svg="icons.notifications" />
        </IconButton>
      </Badge>
      <span class="flex items-center gap-2 text-body-medium">Inline <Badge /> <Badge value="New" /></span>
    </div>
  </section>
</template>
