# tailwind-material3

Material 3 components for Vue 3, styled with Tailwind CSS v4.

## Usage

```bash
bun add github:gavenda/tailwind-material3 vue tailwindcss
```

The package ships its source (`.vue` and `.ts`), not a build, so it installs
straight from GitHub. Your app compiles it: use `@vitejs/plugin-vue`, and keep
Vite from pre-bundling it:

```ts
// vite.config.ts
optimizeDeps: { exclude: ['tailwind-material3'] }
```

In your app's main CSS file:

```css
@import "tailwindcss";
@import "tailwind-material3/theme.css";
```

`theme.css` adds the Material 3 color and type tokens and tells Tailwind to scan
the library's components for class names.

### Font

Components use **Roboto Flex**, the M3 Expressive typeface. The library doesn't
bundle it, so load it in your app:

```bash
bun add @fontsource-variable/roboto-flex
```

```ts
import '@fontsource-variable/roboto-flex/full.css' // all variable axes
```

Or load "Roboto Flex" from Google Fonts. Use the `font-plain` / `font-brand`
utilities to apply it to your own text.

```vue
<script setup lang="ts">
import { Button } from 'tailwind-material3'
</script>

<template>
  <Button variant="tonal">Save</Button>
</template>
```

`Button` variants: `filled` (default), `outlined`, `text`, `elevated`, `tonal`.

## Components

All components follow the Material 3 Expressive specs and tokens.

| Area | Components |
| --- | --- |
| Actions | `Button`, `IconButton`, `ButtonGroup`, `SplitButton`, `Fab` (incl. extended), `FabMenu` / `FabMenuItem` |
| Communication | `Badge`, `LoadingIndicator`, `LinearProgressIndicator`, `CircularProgressIndicator`, `Snackbar`, `Tooltip` |
| Containment | `Card`, `Carousel`, `Dialog`, `Divider`, `List` / `ListItem`, `BottomSheet`, `SideSheet` |
| Navigation | `AppBar`, `NavigationBar`, `NavigationRail`, `NavigationItem`, `Tabs` / `Tab`, `Toolbar`, `Search` |
| Selection | `Checkbox`, `Chip`, `DatePicker`, `DateField` (docked date picker), `Menu` / `MenuItem` / `MenuGroup`, `Radio`, `Slider`, `Switch`, `TimePicker` |
| Text input | `TextField` |

Deprecated components are left out in favour of their Expressive replacements:
segmented buttons → connected `ButtonGroup`, navigation drawer → expanded
`NavigationRail`, bottom app bar → docked `Toolbar`, medium/large app bars →
`AppBar` `medium-flexible` / `large-flexible`.

Each component's source starts with a comment describing its props, slots and
behaviour; the playground has a demo of every one.

### Naming

The same names mean the same thing everywhere:

- **Slots:** `icon` is the leading (or only) icon and `trailing-icon` the trailing
  one. `leading` / `trailing` take any content (buttons, avatars, checkboxes).
- **`label`** is the accessible name, except on text fields (`TextField`,
  `DateField`), where it's the visible floating label. Visible text goes in the
  default slot (`Button`, extended `Fab`, `MenuItem`, …).
- **`v-model:open`** shows and hides anything that opens: menus, tooltips,
  dialogs, sheets, search, pickers.
- **Picker text:** `DatePicker`, `DateField` and `TimePicker` take a `labels`
  object for translation, e.g. `:labels="{ confirm: 'Aceptar', cancel: 'Cancelar' }"`.
  Dates, months and AM/PM follow `locale`.

Menus, tooltips and the docked date picker use the Popover API; dialogs, sheets,
search and the modal pickers use `<dialog>`. Both are supported in all current
browsers.

## Development

```bash
bun install
bun run dev        # playground at http://localhost:5173
bun run build      # library build to dist/ (a check only; the package ships src/)
bun run typecheck
```
