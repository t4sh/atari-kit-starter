# Source Reference — Agent Conventions

When converting source HTML/React files into aduxion 11ty pages, follow these rules.

## Section Detection

Look for these boundaries (in priority order):
1. `<!-- SECTION: name -->` comment markers
2. `<section>`, `<header>`, `<footer>`, `<aside>` semantic HTML
3. React component boundaries (`function ComponentName()` / `export default`)
4. Large `<div>` blocks with distinct visual purpose (hero, pricing, features, etc.)

## Naming Convention

Sections go to: `src/_includes/sections/{domain}/{domain}-{nn}.njk`

Examples:
- `hero/hero-01.njk`, `hero/hero-02.njk`
- `cta/cta-01.njk`
- `pricing/pricing-01.njk`
- `features/features-01.njk`

Numbered variants allow multiple designs per domain.

## Reuse Rules

- If a section matches an existing partial by **structure** (not content), parameterize it with Nunjucks variables rather than creating a duplicate.
- Use `{% set variableName = "value" %}` before `{% include %}` to pass context.
- For complex parameterization, use macros in `_includes/macros/`.

## Token Mapping

- **NEVER** use hardcoded colors, spacing, or radii.
- Always use `var(--token-name)` from tokens.css.
- Consult `_COLOR-MAP.md` for hex→token mappings.
- If a source color has no token match, add it to `_COLOR-MAP.md` and propose a token.

## React → Nunjucks Cheatsheet

| React | Nunjucks |
|-------|----------|
| `className="..."` | `class="..."` |
| `{items.map(item => ...)}` | `{% for item in items %}...{% endfor %}` |
| `{condition && <div>...}` | `{% if condition %}<div>...{% endif %}` |
| `{condition ? <A/> : <B/>}` | `{% if condition %}...{% else %}...{% endif %}` |
| Props | Nunjucks variables (`{% set %}`) or macro parameters |
| `useState` | Alpine.js `x-data` or vanilla JS variable |
| `useEffect` on mount | `DOMContentLoaded` listener or `data-observe` |
| `onClick={handler}` | `@click="..."` (Alpine) or `onclick="..."` / event listener |
| Component imports | `{% include "sections/..." %}` or `{% from "macros/..." import ... %}` |

## What to Discard

- React imports (`import React from 'react'`)
- Build tooling artifacts (webpack, vite, next.js specific)
- node_modules references
- API calls → replace with `_data/*.json` mock data
- TypeScript types (strip, keep the HTML structure)
- CSS-in-JS → extract to utility classes or component CSS

## Data Extraction

- If a section has hardcoded repeated data (list of features, team members, pricing tiers), extract to `src/_data/{name}.json` and loop with `{% for %}`.
- Reference in templates via the filename: `_data/features.json` → `{{ features }}`.

## Animation / Interactivity

- Use `data-observe="reveal"` or `data-observe="reveal-up"` for scroll reveal.
- Use `data-observe="stagger"` on parent for sequential child animations.
- All animations respect `prefers-reduced-motion` automatically.
- For interactive components (tabs, modals), use Alpine.js `x-data`.
