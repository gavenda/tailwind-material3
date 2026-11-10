<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  CircularProgressIndicator,
  Chip,
  Dialog,
  IconButton,
  LinearProgressIndicator,
  Radio,
  LoadingIndicator,
  Slider,
  Switch,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
  type CardVariant,
  type IconButtonVariant,
  type IconButtonWidth,
} from '../src'
import Icon from './Icon.vue'
import BadgeDemo from './sections/BadgeDemo.vue'
import DividerDemo from './sections/DividerDemo.vue'
import ListDemo from './sections/ListDemo.vue'
import FabDemo from './sections/FabDemo.vue'
import SplitButtonDemo from './sections/SplitButtonDemo.vue'
import TextFieldDemo from './sections/TextFieldDemo.vue'
import AppBarDemo from './sections/AppBarDemo.vue'
import NavigationDemo from './sections/NavigationDemo.vue'
import TabsDemo from './sections/TabsDemo.vue'
import ToolbarDemo from './sections/ToolbarDemo.vue'
import CarouselDemo from './sections/CarouselDemo.vue'
import SearchDemo from './sections/SearchDemo.vue'
import SheetDemo from './sections/SheetDemo.vue'
import SnackbarDemo from './sections/SnackbarDemo.vue'
import PickerDemo from './sections/PickerDemo.vue'
import MenuDemo from './sections/MenuDemo.vue'
import TooltipDemo from './sections/TooltipDemo.vue'
import CanonicalLayoutsDemo from './sections/CanonicalLayoutsDemo.vue'
import { icons } from './icons'
import { colorMode } from './theme'

const variants: ButtonVariant[] = ['elevated', 'filled', 'tonal', 'outlined', 'text']
const sizes: ButtonSize[] = ['xs', 's', 'm', 'l', 'xl']
const shapes: ButtonShape[] = ['round', 'square']

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (dark: boolean) => (colorMode.value = dark ? 'dark' : 'light'),
})

const toggles = reactive<Record<string, boolean>>({})

const view = ref<string | null>('week')
const formats = ref<string[]>(['bold'])
const align = ref<string | null>('left')

const iconVariants: IconButtonVariant[] = ['filled', 'tonal', 'outlined', 'standard']
const iconWidths: IconButtonWidth[] = ['narrow', 'default', 'wide']
const textFormats = ref<string[]>(['bold'])

const filters = reactive<Record<string, boolean>>({ vegan: true })
const people = ref(['Ana', 'Ben', 'Chen'])
const selectedPerson = ref<string | null>('Ben')

const volume = ref(40)
const stepped = ref(60)
const priceRange = ref<[number, number]>([20, 70])
const balance = ref(20)
const sizeValues = reactive<Record<string, number>>({ xs: 30, s: 45, m: 60, l: 50, xl: 70 })
const verticalValue = ref(35)
const formatPrice = (v: number) => '$' + v

const loadProgress = ref(0.4)
const progressValue = ref(0.6)
const progressIndeterminate = ref(false)
const loadingButton = ref(false)

const wifi = ref(true)
const bluetooth = ref(false)
const iconSwitches = reactive<Record<string, boolean>>({ selected: true, both: false, custom: true })

const basicOpen = ref(false)
const iconOpen = ref(false)
const scrollOpen = ref(false)
const tone = ref('tone1')
const fullOpen = ref(false)
const dialogResult = ref('')

const size = ref('m')
const sizeOptions = [
  { value: 's', label: 'Small' },
  { value: 'm', label: 'Medium' },
  { value: 'l', label: 'Large' },
]

const agree = ref(false)
const toppings = ref<string[]>(['cheese'])
const toppingOptions = ['cheese', 'mushrooms', 'olives']
const allToppings = computed({
  get: () => toppings.value.length === toppingOptions.length,
  set: (on: boolean) => (toppings.value = on ? [...toppingOptions] : []),
})
const someToppings = computed({
  get: () => toppings.value.length > 0 && toppings.value.length < toppingOptions.length,
  set: () => {},
})

const cardVariants: CardVariant[] = ['elevated', 'filled', 'outlined']
const cardStates = ['static', 'interactive', 'dragged', 'disabled'] as const
</script>

<template>
  <main class="min-h-screen space-y-10 bg-surface p-8 text-on-surface">
    <div class="fixed top-4 right-4 z-10">
      <IconButton
        v-model:selected="isDark"
        variant="tonal"
        toggle
        :label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Icon :svg="isDark ? icons.lightMode : icons.darkMode" />
      </IconButton>
    </div>
    <CanonicalLayoutsDemo />
    <section>
      <h2 class="mb-4 text-xl">Colors</h2>
      <div class="flex flex-col gap-3">
        <div v-for="variant in variants" :key="variant" class="flex items-center gap-4">
          <span class="w-20 text-sm">{{ variant }}</span>
          <Button :variant="variant">Label</Button>
          <Button :variant="variant">
            <template #icon>
              <Icon :svg="icons.add" />
            </template>
            With icon
          </Button>
          <Button :variant="variant" disabled>Disabled</Button>
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Sizes &amp; shapes</h2>
      <div v-for="shape in shapes" :key="shape" class="mb-4 flex flex-wrap items-center gap-4">
        <span class="w-20 text-sm">{{ shape }}</span>
        <Button v-for="size in sizes" :key="size" :size="size" :shape="shape">
          <template #icon>
            <Icon :svg="icons.add" />
          </template>
          {{ size.toUpperCase() }}
        </Button>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Toggle</h2>
      <div class="flex flex-col gap-3">
        <div
          v-for="variant in variants.filter((v) => v !== 'text')"
          :key="variant"
          class="flex items-center gap-4"
        >
          <span class="w-20 text-sm">{{ variant }}</span>
          <Button v-model:selected="toggles[variant]" :variant="variant" toggle>
            {{ toggles[variant] ? 'Selected' : 'Unselected' }}
          </Button>
          <Button v-model:selected="toggles[variant + '-sq']" :variant="variant" shape="square" toggle>
            Square
          </Button>
          <Button :variant="variant" toggle selected disabled>Disabled</Button>
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Icon buttons</h2>
      <div class="mb-6 flex flex-col gap-3">
        <div v-for="variant in iconVariants" :key="variant" class="flex items-center gap-4">
          <span class="w-20 text-sm">{{ variant }}</span>
          <IconButton :variant="variant" label="Edit"><Icon :svg="icons.edit" /></IconButton>
          <IconButton v-model:selected="toggles['icon-' + variant]" :variant="variant" label="Favorite" toggle>
            <template #default="{ selected }">
              <Icon :svg="selected ? icons.favoriteFill : icons.favorite" />
            </template>
          </IconButton>
          <IconButton
            v-model:selected="toggles['icon-sq-' + variant]"
            :variant="variant"
            shape="square"
            label="Bookmark"
            toggle
          >
            <template #default="{ selected }">
              <Icon :svg="selected ? icons.bookmarkFill : icons.bookmark" />
            </template>
          </IconButton>
          <IconButton :variant="variant" label="Settings" disabled><Icon :svg="icons.settings" /></IconButton>
          <IconButton :variant="variant" label="Favorite" toggle selected disabled>
            <Icon :svg="icons.favoriteFill" />
          </IconButton>
        </div>
      </div>

      <h3 class="mb-2 text-sm text-on-surface-variant">Sizes × widths (narrow, default, wide)</h3>
      <div class="mb-6 flex flex-wrap items-center gap-6">
        <div v-for="size in sizes" :key="size" class="flex items-center gap-2">
          <IconButton v-for="width in iconWidths" :key="width" :size="size" :width="width" label="Add">
            <Icon :svg="icons.add" />
          </IconButton>
        </div>
      </div>

      <h3 class="mb-2 text-sm text-on-surface-variant">In button groups</h3>
      <div class="flex flex-col items-start gap-4">
        <ButtonGroup size="m">
          <IconButton variant="tonal" label="Previous"><Icon :svg="icons.skipPrevious" /></IconButton>
          <IconButton label="Play" width="wide"><Icon :svg="icons.playArrow" /></IconButton>
          <IconButton variant="tonal" label="Next"><Icon :svg="icons.skipNext" /></IconButton>
        </ButtonGroup>
        <ButtonGroup v-model="textFormats" variant="connected" selection="multiple" size="s">
          <IconButton value="bold" variant="tonal" label="Bold"><Icon :svg="icons.formatBold" /></IconButton>
          <IconButton value="italic" variant="tonal" label="Italic"><Icon :svg="icons.formatItalic" /></IconButton>
          <IconButton value="underline" variant="tonal" label="Underline">
            <Icon :svg="icons.formatUnderlined" />
          </IconButton>
        </ButtonGroup>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Button groups</h2>

      <h3 class="mb-2 text-sm text-on-surface-variant">Standard — press a button to see the width change</h3>
      <div class="mb-6 flex flex-col items-start gap-4">
        <ButtonGroup v-for="size in sizes" :key="size" :size="size">
          <Button variant="tonal">Back</Button>
          <Button>Play</Button>
          <Button variant="tonal">Next</Button>
        </ButtonGroup>
        <ButtonGroup v-model="formats" selection="multiple" size="m">
          <Button value="bold" variant="tonal">Bold</Button>
          <Button value="italic" variant="tonal">Italic</Button>
          <Button value="underline" variant="tonal">Underline</Button>
        </ButtonGroup>
      </div>

      <h3 class="mb-2 text-sm text-on-surface-variant">Connected — single-select, selection required</h3>
      <div class="flex flex-col items-start gap-4">
        <ButtonGroup
          v-for="size in sizes"
          :key="size"
          v-model="view"
          variant="connected"
          selection="single"
          required
          :size="size"
        >
          <Button value="day">Day</Button>
          <Button value="week">Week</Button>
          <Button value="month">Month</Button>
        </ButtonGroup>
        <ButtonGroup v-model="align" variant="connected" shape="square" selection="single" size="m">
          <Button value="left" variant="outlined">Left</Button>
          <Button value="center" variant="outlined">Center</Button>
          <Button value="right" variant="outlined">Right</Button>
        </ButtonGroup>
        <p class="text-sm">view={{ view }} · formats={{ formats }} · align={{ align }}</p>
      </div>
    </section>

    <section class="max-w-xl">
      <h2 class="mb-4 text-xl">Progress indicators</h2>
      <div class="flex flex-col gap-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="w-60">
            <Slider v-model="progressValue" label="Progress" :min="0" :max="1" :step="0.01" />
          </div>
          <span class="text-sm">{{ Math.round(progressValue * 100) }}%</span>
          <Switch v-model="progressIndeterminate">Indeterminate</Switch>
        </div>

        <h3 class="text-sm text-on-surface-variant">Linear (flat, wavy)</h3>
        <LinearProgressIndicator
          :progress="progressIndeterminate ? undefined : progressValue"
          aria-label="Progress"
        />
        <LinearProgressIndicator
          :progress="progressIndeterminate ? undefined : progressValue"
          wavy
          aria-label="Progress"
        />

        <h3 class="text-sm text-on-surface-variant">Circular (flat, wavy)</h3>
        <div class="flex items-center gap-6">
          <CircularProgressIndicator
            :progress="progressIndeterminate ? undefined : progressValue"
            aria-label="Progress"
          />
          <CircularProgressIndicator
            :progress="progressIndeterminate ? undefined : progressValue"
            wavy
            aria-label="Progress"
          />
        </div>

        <h3 class="text-sm text-on-surface-variant">Always indeterminate</h3>
        <LinearProgressIndicator aria-label="Loading" />
        <LinearProgressIndicator wavy aria-label="Loading" />
        <div class="flex items-center gap-6">
          <CircularProgressIndicator aria-label="Loading" />
          <CircularProgressIndicator wavy aria-label="Loading" />
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Loading indicators</h2>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <span class="w-28 text-sm">indeterminate</span>
          <LoadingIndicator aria-label="Loading" />
          <LoadingIndicator contained aria-label="Loading" />
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <span class="w-28 text-sm">determinate</span>
          <LoadingIndicator :progress="loadProgress" aria-label="Upload progress" />
          <LoadingIndicator :progress="loadProgress" contained aria-label="Upload progress" />
          <div class="w-60">
            <Slider v-model="loadProgress" label="Progress" :min="0" :max="1" :step="0.01" />
          </div>
          <span class="text-sm">{{ Math.round(loadProgress * 100) }}%</span>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <span class="w-28 text-sm">in context</span>
          <Button :disabled="loadingButton" @click="loadingButton = true">
            {{ loadingButton ? 'Refreshing…' : 'Refresh' }}
          </Button>
          <LoadingIndicator v-if="loadingButton" contained aria-label="Refreshing" />
          <button v-if="loadingButton" class="text-sm text-primary underline" @click="loadingButton = false">
            stop
          </button>
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Switch</h2>
      <div class="flex flex-col gap-1">
        <Switch v-model="wifi" class="w-64 justify-between">Wi-Fi ({{ wifi }})</Switch>
        <Switch v-model="bluetooth" class="w-64 justify-between">Bluetooth ({{ bluetooth }})</Switch>

        <div class="flex flex-wrap items-center gap-4">
          <span class="w-20 text-sm">icons</span>
          <Switch v-model="iconSwitches.selected" icons="selected" aria-label="Selected icon only" />
          <Switch v-model="iconSwitches.both" icons="both" aria-label="Both icons" />
          <Switch v-model="iconSwitches.custom" icons="both" aria-label="Custom icons">
            <template #selected-icon><Icon :svg="icons.lightMode" /></template>
            <template #unselected-icon><Icon :svg="icons.darkMode" /></template>
          </Switch>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <span class="w-20 text-sm">disabled</span>
          <Switch disabled aria-label="Disabled off" />
          <Switch :model-value="true" disabled aria-label="Disabled on" />
          <Switch icons="both" disabled aria-label="Disabled off with icon" />
          <Switch :model-value="true" icons="both" disabled aria-label="Disabled on with icon" />
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Dialogs</h2>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="tonal" @click="basicOpen = true">Basic</Button>
        <Button variant="tonal" @click="iconOpen = true">With icon</Button>
        <Button variant="tonal" @click="scrollOpen = true">Scrolling</Button>
        <Button variant="tonal" @click="fullOpen = true">Full-screen</Button>
        <span class="text-sm">{{ dialogResult }}</span>
      </div>

      <Dialog v-model:open="basicOpen" @cancel="dialogResult = 'cancelled'">
        <template #headline>Discard draft?</template>
        Your draft will be lost.
        <template #actions>
          <Button variant="text" @click="basicOpen = false; dialogResult = 'kept'">Cancel</Button>
          <Button variant="text" @click="basicOpen = false; dialogResult = 'discarded'">Discard</Button>
        </template>
      </Dialog>

      <Dialog v-model:open="iconOpen" @cancel="dialogResult = 'cancelled'">
        <template #icon><Icon :svg="icons.deleteIcon" /></template>
        <template #headline>Permanently delete?</template>
        Deleting the selected messages will also remove them from all synced devices.
        <template #actions>
          <Button variant="text" @click="iconOpen = false">Cancel</Button>
          <Button variant="text" @click="iconOpen = false; dialogResult = 'deleted'">Delete</Button>
        </template>
      </Dialog>

      <Dialog v-model:open="scrollOpen">
        <template #headline>Choose a ringtone</template>
        <div class="flex flex-col">
          <Radio v-for="n in 20" :key="n" v-model="tone" :value="'tone' + n" name="tone">Ringtone {{ n }}</Radio>
        </div>
        <template #actions>
          <Button variant="text" @click="scrollOpen = false">Cancel</Button>
          <Button variant="text" @click="scrollOpen = false">OK</Button>
        </template>
      </Dialog>

      <Dialog v-model:open="fullOpen" fullscreen>
        <template #headline>New event</template>
        <template #actions>
          <Button variant="text" @click="fullOpen = false; dialogResult = 'saved'">Save</Button>
        </template>
        <div class="flex flex-col gap-4 text-on-surface">
          <p v-for="n in 30" :key="n">Event detail line {{ n }}</p>
        </div>
      </Dialog>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Radio button</h2>
      <div class="flex flex-col gap-1">
        <div role="radiogroup" aria-label="Size" class="flex flex-col">
          <Radio v-for="o in sizeOptions" :key="o.value" v-model="size" :value="o.value" name="size">
            {{ o.label }}
          </Radio>
        </div>
        <p class="text-sm">size={{ size }}</p>

        <div class="flex flex-wrap items-center">
          <span class="w-20 text-sm">states</span>
          <Radio :value="1" name="states-a" aria-label="Unselected" />
          <Radio :value="1" :model-value="1" name="states-b" aria-label="Selected" />
          <Radio :value="1" name="states-c" disabled aria-label="Disabled" />
          <Radio :value="1" :model-value="1" name="states-d" disabled aria-label="Disabled selected" />
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Checkbox</h2>
      <div class="flex flex-col gap-1">
        <Checkbox v-model="agree">I agree ({{ agree }})</Checkbox>

        <Checkbox v-model="allToppings" v-model:indeterminate="someToppings">All toppings</Checkbox>
        <div class="flex flex-col ps-6">
          <Checkbox v-for="t in toppingOptions" :key="t" v-model="toppings" :value="t" name="toppings">
            {{ t }}
          </Checkbox>
        </div>
        <p class="text-sm">toppings={{ toppings }}</p>

        <div class="flex flex-wrap items-center">
          <span class="w-20 text-sm">states</span>
          <Checkbox aria-label="Unchecked" />
          <Checkbox :model-value="true" aria-label="Checked" />
          <Checkbox indeterminate aria-label="Indeterminate" />
          <Checkbox error aria-label="Error" />
          <Checkbox :model-value="true" error aria-label="Error checked" />
          <Checkbox disabled aria-label="Disabled" />
          <Checkbox :model-value="true" disabled aria-label="Disabled checked" />
          <Checkbox indeterminate disabled aria-label="Disabled indeterminate" />
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Chips</h2>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="w-20 text-sm">assist</span>
          <Chip>Save</Chip>
          <Chip><template #icon><Icon :svg="icons.event" /></template>Add to calendar</Chip>
          <Chip elevated><template #icon><Icon :svg="icons.map" /></template>Directions</Chip>
          <Chip dragged><template #icon><Icon :svg="icons.event" /></template>Dragged</Chip>
          <Chip disabled><template #icon><Icon :svg="icons.event" /></template>Disabled</Chip>
          <Chip elevated disabled>Disabled</Chip>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="w-20 text-sm">filter</span>
          <Chip v-model:selected="filters.vegan" type="filter">Vegan</Chip>
          <Chip v-model:selected="filters.spicy" type="filter">Spicy</Chip>
          <Chip v-model:selected="filters.near" type="filter" elevated>Nearby</Chip>
          <Chip v-model:selected="filters.price" type="filter">
            Price
            <template #trailing-icon><Icon :svg="icons.arrowDropDown" /></template>
          </Chip>
          <Chip type="filter" disabled>Disabled</Chip>
          <Chip type="filter" selected disabled>Disabled</Chip>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="w-20 text-sm">input</span>
          <Chip
            v-for="name in people"
            :key="name"
            type="input"
            :selected="selectedPerson === name"
            :remove-label="`Remove ${name}`"
            @click="selectedPerson = selectedPerson === name ? null : name"
            @remove="people = people.filter((p) => p !== name)"
          >
            <template #avatar>
              <span class="inline-flex items-center justify-center bg-primary-container text-on-primary-container">
                {{ name[0] }}
              </span>
            </template>
            {{ name }}
          </Chip>
          <Chip type="input"><template #icon><Icon :svg="icons.person" /></template>With icon</Chip>
          <Chip type="input" :removable="false">Not removable</Chip>
          <Chip type="input" disabled>Disabled</Chip>
          <button class="text-sm text-primary underline" @click="people = ['Ana', 'Ben', 'Chen']">reset</button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="w-20 text-sm">suggestion</span>
          <Chip type="suggestion">Sounds good</Chip>
          <Chip type="suggestion"><template #icon><Icon :svg="icons.event" /></template>Tomorrow</Chip>
          <Chip type="suggestion" elevated>Elevated</Chip>
          <Chip type="suggestion" disabled>Disabled</Chip>
        </div>
      </div>
    </section>

    <section class="max-w-xl">
      <h2 class="mb-4 text-xl">Sliders</h2>
      <div class="flex flex-col gap-6">
        <div>
          <p class="mb-1 text-sm">Standard with value indicator: {{ volume }}</p>
          <Slider v-model="volume" label="Volume" value-indicator />
        </div>
        <div>
          <p class="mb-1 text-sm">Stops (step 10): {{ stepped }}</p>
          <Slider v-model="stepped" label="Stepped" :step="10" stops value-indicator />
        </div>
        <div>
          <p class="mb-1 text-sm">Range: {{ priceRange }}</p>
          <Slider
            v-model="priceRange"
            :label="['Minimum price', 'Maximum price']"
            value-indicator
            :format="formatPrice"
          />
        </div>
        <div>
          <p class="mb-1 text-sm">Centered (-50 to 50): {{ balance }}</p>
          <Slider v-model="balance" label="Balance" :min="-50" :max="50" centered value-indicator />
        </div>
        <div>
          <p class="mb-1 text-sm">Disabled</p>
          <Slider :model-value="60" label="Disabled" :step="20" stops disabled />
        </div>

        <h3 class="text-sm text-on-surface-variant">Sizes (M, L and XL with inset icon)</h3>
        <Slider v-for="size in sizes" :key="size" v-model="sizeValues[size]" :size="size" :label="'Size ' + size">
          <template #icon><Icon :svg="icons.volumeUp" /></template>
        </Slider>

        <h3 class="text-sm text-on-surface-variant">Vertical: {{ verticalValue }}</h3>
        <div class="flex h-60 gap-6">
          <Slider v-model="verticalValue" orientation="vertical" label="Vertical" value-indicator />
          <Slider v-model="verticalValue" orientation="vertical" size="m" label="Vertical medium">
            <template #icon><Icon :svg="icons.volumeUp" /></template>
          </Slider>
          <Slider v-model="priceRange" orientation="vertical" size="s" :label="['Low', 'High']" />
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl">Cards</h2>
      <div v-for="variant in cardVariants" :key="variant" class="mb-4 flex flex-wrap items-stretch gap-2">
        <Card
          v-for="state in cardStates"
          :key="state"
          :variant="variant"
          :as="state === 'interactive' ? 'button' : 'div'"
          :interactive="state === 'interactive'"
          :dragged="state === 'dragged'"
          :disabled="state === 'disabled'"
          class="w-44"
        >
          <p class="text-title-medium">{{ variant }}</p>
          <p class="text-sm">{{ state }}</p>
        </Card>
      </div>

      <Card variant="outlined" :padded="false" class="w-72">
        <div class="h-32 bg-linear-to-br from-primary-container to-secondary-container" />
        <div class="space-y-1 p-4">
          <p class="text-title-medium">Edge-to-edge media</p>
          <p class="text-sm text-on-surface-variant">Card with padding off and its own content padding.</p>
          <div class="flex justify-end gap-2 pt-2">
            <Button variant="text">Cancel</Button>
            <Button>Open</Button>
          </div>
        </div>
      </Card>
    </section>

    <DividerDemo />
    <BadgeDemo />
    <TooltipDemo />
    <MenuDemo />
    <ListDemo />
    <TextFieldDemo />
    <FabDemo />
    <SplitButtonDemo />
    <NavigationDemo />
    <TabsDemo />
    <AppBarDemo />
    <ToolbarDemo />
    <SnackbarDemo />
    <SheetDemo />
    <SearchDemo />
    <CarouselDemo />
    <PickerDemo />
  </main>
</template>
