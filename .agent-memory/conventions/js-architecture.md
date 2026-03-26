---
id: conventions/js-architecture
type: convention
title: "JS Architecture — Motion-Aware, Single Observer, Lifecycle Events"
description: >-
  Vanilla ES6 modules with single IntersectionObserver, prefers-reduced-motion everywhere, View Transitions API, and aduxion:page-loaded/before-page-unload lifecycle events.
tags: [javascript, observer, motion, view-transitions, architecture]
source: craft-agent
created: 2026-03-26
updated: 2026-03-26
status: active
---

## Principles

1. **prefers-reduced-motion everywhere.** CSS global kill-switch + JS `matchMedia` listener in every animation module. Real-time (not just on load).
2. **Single IntersectionObserver.** `observer.js` manages all scroll effects via `data-observe` attributes.
3. **View Transitions API.** Smooth page transitions with fallback. Theme toggle uses circular reveal.
4. **Lifecycle events.** `aduxion:page-loaded` (after content injected) and `aduxion:before-page-unload` (cleanup). All modules hook into these.
5. **No bundler.** Files are vanilla ES6 IIFE, loaded with `<script defer>`. No imports between modules.

## data-observe API

```html
<section data-observe="reveal">         <!-- fade in -->
<section data-observe="reveal-up">      <!-- slide up + fade -->
<img data-observe="lazy" data-src="…">  <!-- lazy load -->
<span data-observe="countup" data-to="1500">  <!-- animate number -->
<section data-observe="stagger">        <!-- children animate sequentially -->
<section data-observe="reveal stagger"> <!-- stackable -->
```

## Module List

| Module | Purpose |
|--------|---------|
| `observer.js` | Single IntersectionObserver, declarative `data-observe` |
| `theme-toggle.js` | Dark/light/system, localStorage, View Transition circular reveal |
| `view-transitions.js` | Page transition orchestration, lifecycle events |
| `icons.js` | Lucide icon renderer on load + transitions + theme change |
| `mobile-menu.js` | Hamburger with accessibility (focus trap, Escape, aria) |
