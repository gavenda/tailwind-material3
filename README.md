# tailwind-material3

Material 3 components for Vue 3, styled with Tailwind CSS v4.

## Usage

```bash
bun add tailwind-material3 vue tailwindcss
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

## Development

```bash
bun install
bun run dev        # playground at http://localhost:5173
bun run build      # library build to dist/
bun run typecheck
```
