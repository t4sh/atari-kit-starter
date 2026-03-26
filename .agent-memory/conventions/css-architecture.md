---
id: conventions/css-architecture
type: convention
title: "CSS Architecture — 4-File Token-Driven System"
description: >-
  CSS is split into 4 files using @layer: tokens.css (custom properties), base.css (reset/typography), components.css (UI classes), utilities.css (layout helpers). All values reference tokens.
tags: [css, tokens, tailwind, oklch, architecture]
source: craft-agent
created: 2026-03-26
updated: 2026-03-26
status: active
---

## Pattern

1. `tokens.css` — CSS custom properties. The single source of truth for all visual values. oklch() color space. Dark mode via `html.dark` overrides.
2. `base.css` — `@layer base`. Reset, typography, element defaults. Includes the global `prefers-reduced-motion` kill-switch.
3. `components.css` — `@layer components`. Reusable UI classes: `.card`, `.btn`, `.chip`, `[data-observe]` states.
4. `utilities.css` — `@layer utilities`. Layout helpers: `.container`, `.section`, `.flex-center`, `.sr-only`, stagger delays.

## Rules

- All values use `var(--token)` — never hardcoded colors, spacing, or radii.
- Tailwind utilities are available via CDN. The `@theme` block in `base.njk` maps tokens → Tailwind utility classes.
- Component variants follow BEM-like naming: `.btn--primary`, `.card--elevated`.
- Dark mode overrides live in `tokens.css` under `html.dark`, not scattered across component files.
