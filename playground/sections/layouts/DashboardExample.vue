<script setup lang="ts">
/**
 * Admin dashboard: a showcase that puts nearly every component to work.
 * - Search bar in the app bar, notifications and account menus, tooltips on the icon buttons.
 * - Date range (button group), refresh (loading indicator), export (split button).
 * - Key figures (cards), revenue chart with metric tabs, monthly goal (circular progress),
 *   top products and recent orders (segmented lists), campaigns (carousel).
 * - Selecting orders raises a floating toolbar; opening one shows a side sheet (bottom sheet
 *   in narrower windows). The FAB opens a new-order dialog (text field, date field, radios,
 *   checkbox, slider, switch); Settings opens a dialog with date and time pickers.
 * - Confirmations are dialogs; results are snackbars.
 * Layout: compact has one column and a navigation bar, medium two-column figures and a rail,
 * expanded and up four figures across and the chart beside the side column.
 */
import { computed, reactive, ref } from 'vue'
import {
  AppBar,
  Badge,
  BottomSheet,
  Button,
  ButtonGroup,
  Card,
  Carousel,
  Checkbox,
  Chip,
  CircularProgressIndicator,
  DateField,
  DatePicker,
  Dialog,
  Divider,
  IconButton,
  LinearProgressIndicator,
  List,
  ListItem,
  LoadingIndicator,
  Menu,
  MenuGroup,
  MenuItem,
  Radio,
  Search,
  SideSheet,
  Slider,
  Snackbar,
  SplitButton,
  Switch,
  Tab,
  Tabs,
  TextField,
  TimePicker,
  Toolbar,
  Tooltip,
} from '../../../src'
import Icon from '../../Icon.vue'
import { icons } from '../../icons'
import OrderDetail, { type Order } from './dashboard/OrderDetail.vue'
import Scaffold from './Scaffold.vue'
import { atLeast, marginOf, type SizeClass } from './sizeClass'

const props = defineProps<{ sizeClass: SizeClass }>()

const destinations = [
  { value: 'overview', label: 'Overview', icon: icons.dashboard, activeIcon: icons.dashboardFill },
  { value: 'orders', label: 'Orders', icon: icons.shoppingCart, activeIcon: icons.shoppingCartFill, badge: 4 },
  { value: 'customers', label: 'Customers', icon: icons.group, activeIcon: icons.groupFill },
  { value: 'analytics', label: 'Analytics', icon: icons.analytics, activeIcon: icons.analyticsFill },
]
const destination = ref('overview')

const roomy = computed(() => atLeast(props.sizeClass, 'expanded'))
const compact = computed(() => props.sizeClass === 'compact')
const margin = computed(() => marginOf(props.sizeClass))
const statColumns = computed(() => (compact.value ? 'grid-cols-1' : roomy.value ? 'grid-cols-4' : 'grid-cols-2'))

// --- Snackbar: one at a time.
const snack = reactive({ open: false, message: '', action: undefined as string | undefined, run: () => {} })
function notify(message: string, action?: { label: string; run: () => void }) {
  snack.open = false
  snack.message = message
  snack.action = action?.label
  snack.run = action?.run ?? (() => {})
  // Re-open on the next tick so a new message restarts the timer.
  setTimeout(() => (snack.open = true))
}

// --- Range, metrics and the chart.
const ranges = [
  { value: '7d', label: '7 days', points: 7, scale: 1 },
  { value: '30d', label: '30 days', points: 15, scale: 4.1 },
  { value: '90d', label: '90 days', points: 12, scale: 12.6 },
]
const range = ref('7d')
const current = computed(() => ranges.find((r) => r.value === range.value)!)

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const money = (n: number) => '$' + fmt.format(n)

// Deterministic pseudo-data, so the numbers are stable between renders.
const wave = (i: number, salt: number) => 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + salt))

const stats = computed(() => {
  const s = current.value.scale
  return [
    { label: 'Revenue', value: money(18420 * s), delta: 12.4, icon: icons.payments },
    { label: 'Orders', value: fmt.format(312 * s), delta: 8.1, icon: icons.shoppingCart },
    { label: 'New customers', value: fmt.format(96 * s), delta: -3.2, icon: icons.group },
    { label: 'Avg. order', value: money(59), delta: 4.6, icon: icons.inventory },
  ]
})

const metrics = {
  revenue: { label: 'Revenue', unit: 190, show: money },
  orders: { label: 'Orders', unit: 3, show: (n: number) => fmt.format(n) },
  customers: { label: 'Customers', unit: 1, show: (n: number) => fmt.format(n) },
}
const metric = ref<keyof typeof metrics>('revenue')
const bars = computed(() => {
  const n = current.value.points
  const m = metrics[metric.value]
  const salt = range.value.length + metric.value.length
  return Array.from({ length: n }, (_, i) => {
    const v = Math.round(wave(i, salt) * 100)
    return { v, last: i === n - 1, label: String(i + 1), tip: `Day ${i + 1}: ${m.show(v * m.unit * current.value.scale)}` }
  })
})
const total = computed(() => {
  const m = metrics[metric.value]
  return m.show(bars.value.reduce((a, b) => a + b.v, 0) * m.unit * current.value.scale)
})

// --- Refresh and export.
const refreshing = ref(false)
function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
    notify('Dashboard updated')
  }, 1800)
}

// --- Orders.
const statusTone: Record<Order['status'], string> = {
  Paid: 'bg-tertiary-container text-on-tertiary-container',
  Pending: 'bg-secondary-container text-on-secondary-container',
  Refunded: 'bg-error-container text-on-error-container',
}
const orders = ref<Order[]>([
  { id: '#10482', customer: 'Ana Ribeiro', item: 'Aero desk lamp', total: 89, status: 'Paid', date: 'Today', shipping: 'Express' },
  { id: '#10481', customer: 'Ben Okafor', item: 'Walnut monitor stand', total: 142, status: 'Pending', date: 'Today', shipping: 'Standard' },
  { id: '#10480', customer: 'Chen Wei', item: 'Linen throw blanket', total: 64, status: 'Paid', date: 'Yesterday', shipping: 'Standard' },
  { id: '#10479', customer: 'Dara Nolan', item: 'Ceramic pour-over set', total: 78, status: 'Refunded', date: 'Yesterday', shipping: 'Express' },
  { id: '#10478', customer: 'Eli Haddad', item: 'Cork yoga block', total: 24, status: 'Paid', date: 'Mon', shipping: 'Standard' },
])
const filter = ref<Order['status'] | null>(null)
const shown = computed(() => orders.value.filter((o) => !filter.value || o.status === filter.value))

const selected = ref<string[]>([])
const allSelected = computed({
  get: () => shown.value.length > 0 && shown.value.every((o) => selected.value.includes(o.id)),
  set: (on: boolean) => (selected.value = on ? shown.value.map((o) => o.id) : []),
})
const someSelected = computed({
  get: () => selected.value.length > 0 && !allSelected.value,
  set: () => {},
})
const detailId = ref<string | null>(null)
const detailOpen = ref(false)
const detail = computed(() => orders.value.find((o) => o.id === detailId.value))
function openDetail(o: Order) {
  detailId.value = o.id
  detailOpen.value = true
}

// --- Products, goal and campaigns.
const products = [
  { name: 'Aero desk lamp', sold: 482, share: 0.92 },
  { name: 'Walnut monitor stand', sold: 391, share: 0.75 },
  { name: 'Linen throw blanket', sold: 308, share: 0.59 },
  { name: 'Ceramic pour-over set', sold: 244, share: 0.47 },
  { name: 'Cork yoga block', sold: 133, share: 0.26 },
]
const campaigns = [
  { title: 'Autumn sale', note: 'Ends in 3 days', tone: 'from-primary-container to-tertiary-container' },
  { title: 'Free shipping', note: 'Orders over $50', tone: 'from-secondary-container to-primary-container' },
  { title: 'New: ceramics', note: 'Launches Friday', tone: 'from-tertiary-container to-secondary-container' },
  { title: 'Loyalty week', note: 'Double points', tone: 'from-error-container to-tertiary-container' },
  { title: 'Gift cards', note: 'Back in stock', tone: 'from-primary-container to-secondary-container' },
]

// --- Search.
const query = ref('')
const searchResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  const all = [
    ...orders.value.map((o) => ({ id: o.id, title: `${o.id} · ${o.customer}`, kind: 'Order', icon: icons.shoppingCart })),
    ...products.map((p) => ({ id: p.name, title: p.name, kind: 'Product', icon: icons.inventory })),
  ]
  return (q ? all.filter((r) => r.title.toLowerCase().includes(q)) : all).slice(0, 8)
})

// --- Notifications and account menus.
const alertsOpen = ref(false)
const accountOpen = ref(false)
const chartMenuOpen = ref(false)
const notifications = reactive([
  { id: 1, icon: icons.shoppingCart, title: 'New order #10482', text: 'Ana Ribeiro bought Aero desk lamp', time: '2m', unread: true },
  { id: 2, icon: icons.payments, title: 'Payment received', text: '$142 from Ben Okafor', time: '1h', unread: true },
  { id: 3, icon: icons.inventory, title: 'Low stock', text: 'Cork yoga block: 4 left', time: '3h', unread: true },
  { id: 4, icon: icons.error, title: 'Refund requested', text: 'Order #10479 from Dara Nolan', time: 'Yesterday', unread: false },
])
const unread = computed(() => notifications.filter((n) => n.unread).length)

// --- Confirmation dialog, shared by refunds and deletes.
const confirm = reactive({ open: false, title: '', text: '', label: '', run: () => {} })
function ask(title: string, text: string, label: string, run: () => void) {
  Object.assign(confirm, { open: true, title, text, label, run })
}

function refund(o: Order) {
  ask('Refund this order?', `${money(o.total)} goes back to ${o.customer}.`, 'Refund', () => {
    const before = o.status
    o.status = 'Refunded'
    notify(`${o.id} refunded`, { label: 'Undo', run: () => (o.status = before) })
  })
}
function deleteSelected() {
  const n = selected.value.length
  ask(`Delete ${n} order${n > 1 ? 's' : ''}?`, 'They are removed from the dashboard.', 'Delete', () => {
    const removed = orders.value.filter((o) => selected.value.includes(o.id))
    orders.value = orders.value.filter((o) => !selected.value.includes(o.id))
    selected.value = []
    notify(`${n} deleted`, { label: 'Undo', run: () => (orders.value = [...removed, ...orders.value].sort((a, b) => b.id.localeCompare(a.id))) })
  })
}
function markPaid() {
  orders.value.filter((o) => selected.value.includes(o.id)).forEach((o) => (o.status = 'Paid'))
  notify(`${selected.value.length} marked as paid`)
  selected.value = []
}

// --- New order dialog.
const newOpen = ref(false)
const draft = reactive({ customer: '', date: null as Date | null, shipping: 'standard', gift: false, qty: 1, receipt: true, notes: '' })
function createOrder() {
  const id = '#' + (10483 + orders.value.length - 5)
  orders.value.unshift({
    id,
    customer: draft.customer.trim() || 'New customer',
    item: `${draft.qty} × Aero desk lamp`,
    total: 89 * draft.qty,
    status: 'Pending',
    date: 'Today',
    shipping: draft.shipping === 'express' ? 'Express' : 'Standard',
  })
  newOpen.value = false
  Object.assign(draft, { customer: '', date: null, shipping: 'standard', gift: false, qty: 1, receipt: true, notes: '' })
  notify(`${id} created`, { label: 'Undo', run: () => orders.value.shift() })
}

// --- Settings dialog.
const settingsOpen = ref(false)
const settings = reactive({ auto: true, minutes: 5, band: [40, 120] as [number, number], sensitivity: 0 })
const reportStart = ref<Date | null>(null)
const reportEnd = ref<Date | null>(null)
const reportRangeOpen = ref(false)
const reportTime = ref<string | null>('08:00')
const reportTimeOpen = ref(false)
const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const reportRange = computed(() =>
  reportStart.value && reportEnd.value ? `${day.format(reportStart.value)} – ${day.format(reportEnd.value)}` : 'Pick a period',
)
</script>

<template>
  <Scaffold
    v-model="destination"
    :size-class="sizeClass"
    :destinations="destinations"
    :fab="{ label: 'New order', icon: icons.add }"
    @fab="newOpen = true"
  >
    <div class="flex size-full flex-col overflow-y-auto">
      <AppBar variant="search" class="sticky top-0 z-1">
        <template v-if="!compact" #leading>
          <span class="block w-52 ps-2 text-title-large">Overview</span>
        </template>
        <!-- The search bar sits in the middle of the app bar -->
        <template #search>
          <div class="mx-auto w-full max-w-xl">
          <Search v-model="query" placeholder="Search orders and products">
            <template #default="{ close }">
              <div class="flex flex-wrap gap-2 px-4 pt-2">
                <Chip v-for="t in ['Pending', 'Refunded', 'Express']" :key="t" type="suggestion" @click="query = t">{{ t }}</Chip>
              </div>
              <List>
                <ListItem v-for="r in searchResults" :key="r.id" as="button" :supporting-text="r.kind" @click="close()">
                  <template #icon><Icon :svg="r.icon" /></template>
                  {{ r.title }}
                </ListItem>
                <ListItem v-if="!searchResults.length">No results</ListItem>
              </List>
            </template>
          </Search>
          </div>
        </template>
        <template #trailing>
          <!-- Same width as the title, so the search bar sits in the middle of the whole bar -->
          <div :class="['flex items-center justify-end', !compact && 'w-52']">
            <Menu v-model:open="alertsOpen" label="Notifications" placement="bottom-end" :max-width="360" :max-height="360">
              <template #anchor="{ toggle, props: anchor }">
                <!-- A real box for the menu to anchor to: Tooltip itself renders display: contents -->
                <span class="inline-flex">
                <Tooltip text="Notifications">
                  <Badge :value="unread" :hidden="!unread" :label="`${unread} new notifications`">
                    <IconButton variant="standard" label="Notifications" v-bind="anchor" @click="toggle">
                      <Icon :svg="icons.notifications" />
                    </IconButton>
                  </Badge>
                </Tooltip>
                </span>
              </template>
              <MenuGroup label="Recent">
                <MenuItem
                  v-for="n in notifications"
                  :key="n.id"
                  :supporting-text="n.text"
                  :trailing-text="n.time"
                  @click="n.unread = false"
                >
                  <template #icon><Icon :svg="n.icon" /></template>
                  {{ n.title }}
                </MenuItem>
              </MenuGroup>
              <MenuGroup>
                <MenuItem :disabled="!unread" @click="notifications.forEach((n) => (n.unread = false))">
                  <template #icon><Icon :svg="icons.check" /></template>
                  Mark all as read
                </MenuItem>
              </MenuGroup>
            </Menu>
            <Menu v-model:open="accountOpen" variant="vibrant" label="Account" placement="bottom-end">
              <template #anchor="{ toggle, props: anchor }">
                <span class="inline-flex">
                  <Tooltip text="Account">
                    <Badge label="Profile incomplete">
                      <IconButton variant="standard" label="Account" v-bind="anchor" @click="toggle">
                        <Icon :svg="icons.accountCircle" />
                      </IconButton>
                    </Badge>
                  </Tooltip>
                </span>
              </template>
              <MenuItem @click="settingsOpen = true"><template #icon><Icon :svg="icons.settings" /></template>Settings</MenuItem>
              <MenuItem><template #icon><Icon :svg="icons.logout" /></template>Sign out</MenuItem>
            </Menu>
          </div>
        </template>
      </AppBar>

      <div :class="['flex flex-col gap-4 pt-2 pb-24', margin]">
        <!-- Heading, range and actions -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-headline-small">Good morning, Ana</h3>
            <p class="text-body-medium text-on-surface-variant">Here is how the shop is doing.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <ButtonGroup v-model="range" variant="connected" selection="single" required size="xs" aria-label="Date range">
              <Button v-for="r in ranges" :key="r.value" :value="r.value" variant="tonal">{{ r.label }}</Button>
            </ButtonGroup>
            <Tooltip text="Refresh data">
              <IconButton variant="outlined" label="Refresh" :disabled="refreshing" @click="refresh">
                <LoadingIndicator v-if="refreshing" contained aria-label="Refreshing" />
                <Icon v-else :svg="icons.refresh" />
              </IconButton>
            </Tooltip>
            <SplitButton variant="filled" size="xs" label="Export" @click="notify('Exported as CSV')">
              <template #icon><Icon :svg="icons.download" /></template>
              Export
              <template #menu>
                <MenuItem @click="notify('Exported as CSV')">CSV</MenuItem>
                <MenuItem @click="notify('Exported as PDF')">PDF</MenuItem>
                <MenuItem @click="notify('Sent to printer')"><template #icon><Icon :svg="icons.print" /></template>Print</MenuItem>
              </template>
            </SplitButton>
          </div>
        </div>

        <LinearProgressIndicator v-if="refreshing" wavy aria-label="Refreshing data" />

        <!-- Key figures -->
        <div :class="['grid gap-2', statColumns]">
          <Card v-for="s in stats" :key="s.label" variant="filled">
            <div class="flex items-center justify-between text-on-surface-variant">
              <span class="text-label-large">{{ s.label }}</span>
              <span class="inline-flex size-6 *:size-full"><Icon :svg="s.icon" /></span>
            </div>
            <p class="mt-2 text-headline-medium">{{ s.value }}</p>
            <p :class="['mt-1 flex items-center gap-1 text-label-medium', s.delta >= 0 ? 'text-primary' : 'text-error']">
              <span class="inline-flex size-4 *:size-full">
                <Icon :svg="s.delta >= 0 ? icons.trendingUp : icons.trendingDown" />
              </span>
              {{ s.delta >= 0 ? '+' : '' }}{{ s.delta }}%
              <span class="text-on-surface-variant">vs. previous</span>
            </p>
          </Card>
        </div>

        <!-- Chart, goal and top products -->
        <div :class="['grid gap-2', roomy ? 'grid-cols-3' : 'grid-cols-1']">
          <Card variant="outlined" :class="roomy && 'col-span-2'">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-title-medium">{{ metrics[metric].label }}</p>
                <p class="text-headline-small">{{ total }}</p>
              </div>
              <Menu v-model:open="chartMenuOpen" label="Chart options" placement="bottom-end">
                <template #anchor="{ toggle, props: anchor }">
                  <IconButton variant="standard" label="Chart options" v-bind="anchor" @click="toggle">
                    <Icon :svg="icons.moreVert" />
                  </IconButton>
                </template>
                <MenuItem @click="notify('Chart exported as CSV')"><template #icon><Icon :svg="icons.download" /></template>Export CSV</MenuItem>
                <MenuItem @click="notify('Sent to printer')"><template #icon><Icon :svg="icons.print" /></template>Print</MenuItem>
              </Menu>
            </div>
            <Tabs v-model="metric" variant="secondary" label="Chart metric" class="mt-2">
              <Tab v-for="(m, key) in metrics" :key="key" :value="key">{{ m.label }}</Tab>
            </Tabs>
            <div class="mt-4 flex h-48 items-end gap-1.5" role="group" :aria-label="`${metrics[metric].label}, ${total} in total`">
              <Tooltip v-for="(b, i) in bars" :key="i" :text="b.tip">
                <div class="flex h-full min-w-0 flex-1 flex-col justify-end gap-1" tabindex="0" :aria-label="b.tip">
                  <div
                    :style="{ height: b.v + '%' }"
                    :class="['rounded-t-lg transition-[height] duration-(--duration-spatial-default)', b.last ? 'bg-primary' : 'bg-primary-container']"
                  />
                  <span class="text-center text-label-small text-on-surface-variant">{{ b.label }}</span>
                </div>
              </Tooltip>
            </div>
          </Card>

          <div class="flex flex-col gap-4">
            <Card variant="elevated" class="flex items-center gap-4">
              <CircularProgressIndicator :progress="0.72" wavy aria-label="72% of the monthly goal" />
              <div>
                <p class="text-title-medium">Monthly goal</p>
                <p class="text-body-medium text-on-surface-variant">$41,300 of $57,000</p>
              </div>
            </Card>
            <div>
              <p class="px-1 pb-2 text-title-medium">Top products</p>
              <List segmented>
                <ListItem v-for="p in products" :key="p.name" class="bg-surface-container!">
                  {{ p.name }}
                  <template #supporting-text>
                    <span class="block">{{ fmt.format(p.sold * current.scale) }} sold</span>
                    <LinearProgressIndicator :progress="p.share" class="mt-1" />
                  </template>
                </ListItem>
              </List>
            </div>
          </div>
        </div>

        <!-- Campaigns -->
        <div>
          <p class="px-1 pb-2 text-title-medium">Campaigns</p>
          <Carousel layout="hero" label="Campaigns" height="11rem">
            <div
              v-for="c in campaigns"
              :key="c.title"
              :class="['flex flex-col justify-end bg-linear-to-br p-4 text-on-surface', c.tone]"
            >
              <span class="text-title-large whitespace-nowrap">{{ c.title }}</span>
              <span class="text-body-medium whitespace-nowrap">{{ c.note }}</span>
            </div>
          </Carousel>
        </div>

        <!-- Recent orders -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
            <div class="flex items-center gap-1">
              <Checkbox v-model="allSelected" v-model:indeterminate="someSelected" aria-label="Select all orders" />
              <p class="text-title-medium">Recent orders</p>
            </div>
            <div class="flex gap-2">
              <Chip
                v-for="s in (['Paid', 'Pending', 'Refunded'] as const)"
                :key="s"
                type="filter"
                elevated
                :selected="filter === s"
                @update:selected="filter = $event ? s : null"
              >{{ s }}</Chip>
            </div>
          </div>
          <List segmented>
            <ListItem
              v-for="o in shown"
              :key="o.id"
              interactive
              role="button"
              tabindex="0"
              class="bg-surface-container!"
              :overline="o.id"
              :supporting-text="o.item"
              :selected="false"
              @click="openDetail(o)"
              @keydown.enter.self="openDetail(o)"
            >
              <template #leading>
                <span class="flex items-center gap-1">
                  <Checkbox v-model="selected" :value="o.id" :aria-label="`Select ${o.id}`" @click.stop />
                  <span class="inline-flex size-10 items-center justify-center rounded-full bg-primary-container text-title-small text-on-primary-container">
                    {{ o.customer[0] }}
                  </span>
                </span>
              </template>
              {{ o.customer }}
              <template #trailing>
                <span class="flex flex-col items-end gap-1">
                  <span class="text-label-large tabular-nums">{{ money(o.total) }}</span>
                  <span :class="['rounded-lg px-2 py-0.5 text-label-small', statusTone[o.status]]">{{ o.status }}</span>
                </span>
              </template>
            </ListItem>
            <ListItem v-if="!shown.length" class="bg-surface-container!">No orders match.</ListItem>
          </List>
        </div>
      </div>
    </div>

    <!-- Selection actions -->
    <Toolbar
      v-if="selected.length"
      variant="floating"
      color="vibrant"
      label="Selected orders"
      :class="['absolute bottom-4 z-1', compact ? 'start-4' : 'start-1/2 -translate-x-1/2']"
    >
      <IconButton variant="standard" label="Clear selection" @click="selected = []"><Icon :svg="icons.close" /></IconButton>
      <span class="px-2 text-label-large whitespace-nowrap">{{ selected.length }} selected</span>
      <Tooltip text="Mark as paid">
        <IconButton variant="standard" label="Mark as paid" @click="markPaid"><Icon :svg="icons.check" /></IconButton>
      </Tooltip>
      <Tooltip text="Delete">
        <IconButton variant="standard" label="Delete" @click="deleteSelected"><Icon :svg="icons.deleteIcon" /></IconButton>
      </Tooltip>
    </Toolbar>

    <!-- Order details: side sheet in wide windows, bottom sheet otherwise -->
    <SideSheet v-if="roomy" v-model:open="detailOpen" detached>
      <template #headline>Order details</template>
      <OrderDetail v-if="detail" :order="detail" :tone="statusTone[detail.status]" @refund="refund(detail)" @print="notify('Sent to printer')" />
    </SideSheet>
    <BottomSheet v-else v-model:open="detailOpen" label="Order details">
      <OrderDetail v-if="detail" :order="detail" :tone="statusTone[detail.status]" @refund="refund(detail)" @print="notify('Sent to printer')" />
    </BottomSheet>

    <!-- Confirmation -->
    <Dialog v-model:open="confirm.open">
      <template #icon><Icon :svg="icons.error" /></template>
      <template #headline>{{ confirm.title }}</template>
      {{ confirm.text }}
      <template #actions>
        <Button variant="text" @click="confirm.open = false">Cancel</Button>
        <Button variant="text" @click="(confirm.open = false), confirm.run()">{{ confirm.label }}</Button>
      </template>
    </Dialog>

    <!-- New order -->
    <Dialog v-model:open="newOpen">
      <template #headline>New order</template>
      <form class="flex flex-col gap-4" @submit.prevent="createOrder">
        <TextField v-model="draft.customer" variant="filled" label="Customer" class="w-full" />
        <DateField v-model="draft.date" label="Delivery date" />
        <TextField v-model="draft.notes" variant="outlined" label="Notes" multiline :rows="2" counter maxlength="120" supporting-text="Optional" class="w-full" />
        <fieldset class="flex flex-col">
          <legend class="mb-1 text-label-large text-on-surface-variant">Shipping</legend>
          <Radio v-model="draft.shipping" value="standard" name="shipping">Standard (3–5 days)</Radio>
          <Radio v-model="draft.shipping" value="express" name="shipping">Express (next day)</Radio>
        </fieldset>
        <Checkbox v-model="draft.gift">Gift wrap</Checkbox>
        <div>
          <p class="text-label-large text-on-surface-variant">Quantity</p>
          <Slider v-model="draft.qty" size="s" :min="1" :max="10" :step="1" stops value-indicator label="Quantity" />
        </div>
        <Switch v-model="draft.receipt" icons="selected">Email a receipt</Switch>
      </form>
      <template #actions>
        <Button variant="text" @click="newOpen = false">Cancel</Button>
        <Button variant="filled" @click="createOrder">Create</Button>
      </template>
    </Dialog>

    <!-- Settings -->
    <Dialog v-model:open="settingsOpen" :fullscreen="compact">
      <template #headline>Settings</template>
      <div class="flex flex-col gap-4">
        <Switch v-model="settings.auto" icons="both">Refresh automatically</Switch>
        <div>
          <p class="text-label-large text-on-surface-variant">Every {{ settings.minutes }} min</p>
          <Slider v-model="settings.minutes" size="m" :min="1" :max="30" :disabled="!settings.auto" label="Refresh interval" />
        </div>
        <div>
          <p class="text-label-large text-on-surface-variant">Highlight orders from {{ money(settings.band[0]) }} to {{ money(settings.band[1]) }}</p>
          <Slider v-model="settings.band" :min="0" :max="200" :step="10" :format="money" label="Order value range" />
        </div>
        <div>
          <p class="text-label-large text-on-surface-variant">Stock alert sensitivity</p>
          <Slider v-model="settings.sensitivity" centered :min="-10" :max="10" label="Stock alert sensitivity" />
        </div>
        <Divider inset="both" />
        <div class="flex items-center justify-between gap-4">
          <span class="text-body-large">Report period</span>
          <Button variant="outlined" size="s" @click="reportRangeOpen = true">{{ reportRange }}</Button>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span class="text-body-large">Send daily at</span>
          <Button variant="outlined" size="s" @click="reportTimeOpen = true">{{ reportTime ?? 'Pick a time' }}</Button>
        </div>
      </div>
      <template #actions>
        <Button variant="tonal" @click="settingsOpen = false">Done</Button>
      </template>
    </Dialog>

    <DatePicker v-model:start="reportStart" v-model:end="reportEnd" v-model:open="reportRangeOpen" range />
    <TimePicker v-model="reportTime" v-model:open="reportTimeOpen" :hour12="false" />

    <Snackbar v-model:open="snack.open" :message="snack.message" :action-label="snack.action" closable @action="snack.run()" />
  </Scaffold>
</template>
