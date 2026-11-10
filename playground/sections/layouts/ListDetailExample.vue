<script setup lang="ts">
/**
 * List-detail canonical layout: a mail inbox.
 * https://m3.material.io/foundations/layout/canonical-examples/list-detail
 * - compact / medium: one pane. The list, or the open message with a back button.
 * - expanded and up: list (360dp, 412dp from large) beside the message. The open
 *   message is selected in the list; with nothing open the detail pane shows an empty state.
 * Going from two panes to one keeps the open message on screen.
 */
import { computed, ref } from 'vue'
import { AppBar, Button, IconButton, List, ListItem, Search } from '../../../src'
import Icon from '../../Icon.vue'
import { icons } from '../../icons'
import Scaffold from './Scaffold.vue'
import { atLeast, marginOf, type SizeClass } from './sizeClass'

const props = defineProps<{ sizeClass: SizeClass }>()

const destinations = [
  { value: 'inbox', label: 'Inbox', icon: icons.inbox, activeIcon: icons.inboxFill, badge: 4 },
  { value: 'starred', label: 'Starred', icon: icons.star, activeIcon: icons.starFill },
  { value: 'sent', label: 'Sent', icon: icons.send },
  { value: 'drafts', label: 'Drafts', icon: icons.drafts },
]
const destination = ref('inbox')
const query = ref('')

const senders = ['Ali Connors', 'Sandra Adams', 'Trevor Hansen', 'Britta Holt', 'Jennifer Cole', 'Jun Park']
const subjects = [
  'Brunch this weekend?',
  'Summer BBQ plans',
  'Oui oui',
  'Birthday gift ideas',
  'Recipe to try',
  'Quarterly review notes',
  'Photos from the trip',
  'Book club: next pick',
  'Flight confirmation',
  'Team offsite agenda',
  'Re: Garden project',
  'Concert tickets',
]
const messages = subjects.map((subject, i) => ({
  id: i,
  from: senders[i % senders.length],
  subject,
  preview: "I'll be in your neighborhood doing errands this weekend. Do you want to grab brunch?",
  time: i < 3 ? `${10 - i}:${i}5 AM` : `Nov ${12 - i}`,
  unread: i < 4,
}))
const openId = ref<number | null>(null)
const open = computed(() => messages.find((m) => m.id === openId.value))

const twoPane = computed(() => atLeast(props.sizeClass, 'expanded'))
const listWidth = computed(() => (atLeast(props.sizeClass, 'large') ? 'w-103' : 'w-90'))
const margin = computed(() => marginOf(props.sizeClass))
const initial = (name: string) => name[0]

const detailScrolled = ref(false)
</script>

<template>
  <Scaffold v-model="destination" :size-class="sizeClass" :destinations="destinations" :fab="{ label: 'Compose', icon: icons.edit }">
    <div :class="['flex size-full gap-6', twoPane && 'px-6 pb-6']">
      <!-- List pane -->
      <section
        v-if="twoPane || !open"
        :class="['flex min-h-0 flex-col', twoPane ? [listWidth, 'shrink-0'] : 'flex-1']"
        aria-label="Messages"
      >
        <div :class="['pt-4 pb-2', !twoPane && margin]">
          <Search v-model="query" placeholder="Search mail" :view="sizeClass === 'compact' ? 'fullscreen' : 'docked'" />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <List class="py-2">
            <ListItem
              v-for="m in messages"
              :key="m.id"
              as="button"
              :overline="m.from"
              :supporting-text="m.preview"
              :trailing-text="m.time"
              :selected="twoPane && openId === m.id"
              @click="openId = m.id"
            >
              <template #leading>
                <span class="inline-flex size-10 items-center justify-center rounded-full bg-primary-container text-title-medium text-on-primary-container">
                  {{ initial(m.from) }}
                </span>
              </template>
              <span :class="m.unread && 'font-medium'">{{ m.subject }}</span>
            </ListItem>
          </List>
        </div>
      </section>

      <!-- Detail pane -->
      <section
        v-if="twoPane || open"
        :class="['flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', twoPane && 'mt-4 rounded-[28px] bg-surface-container-low']"
        aria-label="Message"
      >
        <template v-if="open">
          <!-- In the two-pane layout the bar sits on the pane's color until content scrolls under it -->
          <AppBar :scrolled="detailScrolled" :class="twoPane && !detailScrolled && 'bg-transparent!'">
            <!-- Back only in single-pane layouts -->
            <template v-if="!twoPane" #leading>
              <IconButton variant="standard" label="Back" @click="openId = null"><Icon :svg="icons.arrowBack" /></IconButton>
            </template>
            <template #trailing>
              <IconButton variant="standard" label="Archive"><Icon :svg="icons.archive" /></IconButton>
              <IconButton variant="standard" label="Delete"><Icon :svg="icons.deleteIcon" /></IconButton>
              <IconButton variant="standard" label="More"><Icon :svg="icons.moreVert" /></IconButton>
            </template>
          </AppBar>
          <article :class="['min-h-0 flex-1 overflow-y-auto pb-6', margin]" @scroll="detailScrolled = ($event.target as HTMLElement).scrollTop > 0">
            <h1 class="mb-6 text-headline-small">{{ open.subject }}</h1>
            <div class="mb-6 flex items-center gap-3">
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-title-medium text-on-primary-container">
                {{ initial(open.from) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-title-small">{{ open.from }}</p>
                <p class="text-body-small text-on-surface-variant">to me · {{ open.time }}</p>
              </div>
            </div>
            <div class="max-w-160 space-y-4 text-body-large">
              <p>{{ open.preview }}</p>
              <p v-for="n in 6" :key="n">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus rutrum, nisl at porta luctus, sem
                arcu tincidunt neque, sit amet varius felis sem in mi. Integer facilisis velit vel massa dictum,
                ac fermentum nibh tincidunt.
              </p>
            </div>
            <div class="mt-8 flex gap-2">
              <Button variant="outlined">Reply</Button>
              <Button variant="outlined">Forward</Button>
            </div>
          </article>
        </template>

        <!-- Two panes, nothing open: placeholder -->
        <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-on-surface-variant">
          <Icon :svg="icons.mail" class="size-12" />
          <p class="text-title-medium">No message selected</p>
          <p class="text-body-medium">Pick a message from the list to read it here.</p>
        </div>
      </section>
    </div>
  </Scaffold>
</template>
