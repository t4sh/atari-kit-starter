# atari-kit-starter

A design-system-agnostic HTML prototype scaffold built on **Eleventy v3**, **Tailwind CSS v4**, and **vanilla JavaScript**.

## Quick Start

```bash
bash setup.sh "My Project Name"
npm run dev
```

Open [localhost:3000](http://localhost:3000) to see your project.

## What You Get

- **3 output formats** — dev server, standalone HTML files, single-file SPA
- **Pluggable design system** — swap `tokens.css` to change Material v3, Basecoat, or custom
- **Reusable sections** — Nunjucks partials with numbered variants (hero-01, hero-02, etc.)
- **Motion-aware** — `prefers-reduced-motion` respected everywhere, single IntersectionObserver
- **View Transitions API** — smooth page transitions with graceful fallback
- **Dark mode** — flash-free toggle with localStorage persistence
- **AI-ready** — AGENTS.md + bundled skills for Claude/Cursor. Optional cross-session memory via the [`agent-memory` skill](https://skills.sh/t4sh/skills4sh/agent-memory).

## Adding Pages

Create a new `.njk` file in `src/pages/`:

```nunjucks
---
layout: layouts/page.njk
title: My Page
---

{% include "sections/hero/hero-01.njk" %}

<section class="section">
  <div class="container">
    <h1>Your content here</h1>
  </div>
</section>

{% include "sections/cta/cta-01.njk" %}
```

## Adding Sections

Create in `src/_includes/sections/{domain}/{domain}-{nn}.njk`:

```
sections/
├── hero/hero-01.njk       ← exists
├── hero/hero-02.njk       ← add your variant
├── pricing/pricing-01.njk ← add a new domain
└── features/features-01.njk
```

Use in pages: `{% include "sections/pricing/pricing-01.njk" %}`

## Changing the Design System

Edit `src/assets/css/tokens.css` — all components reference tokens via `var()`:

```css
:root {
  --primary: oklch(0.55 0.15 250);  /* Change this */
  --surface: oklch(0.985 0 0);       /* And this */
  /* ... */
}
```

Also update the `@theme` block in `src/_includes/layouts/base.njk` to map new tokens to Tailwind utilities.

## Source Reference Workflow

Drop raw HTML/React/prototype files into `source-reference/`. AI agents can convert them to 11ty pages:

1. Read `source-reference/_CONVENTIONS.md` for the conversion rules
2. Agent decomposes the source into sections
3. Agent creates `.njk` partials and pages
4. Review in dev server

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run build` | 11ty build → `out/` |
| `npm run build:standalone` | Flat HTML → `out-standalone/` |
| `npm run build:spa` | SPA → `out-spa/app.html` |
| `npm run lint` | ESLint + Stylelint |
| `npm run format` | Prettier |

## AI Agent Skills

Bundled in `.agents/skills/`. See [.agents/README.md](.agents/README.md) for setup instructions.

To sync to your global skills (recommended):
```bash
mkdir -p ~/.agents/skills
cp -r .agents/skills/* ~/.agents/skills/
```
