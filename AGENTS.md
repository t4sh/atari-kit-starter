# Agent Instructions — {{PROJECT_NAME}}

> For any AI agent, tool, or automation working on this project.
> Tool-specific configs: `.claude/` (Claude Code), `.cursor/rules/` (Cursor).

## First Steps

1. Read this file completely.
2. Read `.agent-memory/index.yaml` to discover available project context.
3. Load relevant memory files based on the current task.
4. Update or create memories when you learn something future sessions should know.

See `.agent-memory/README.md` for the full memory spec.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| SSG | Eleventy v3 + Nunjucks |
| CSS | Tailwind v4 (browser CDN) + custom @layer (tokens, base, components, utilities) |
| JS | Vanilla ES6 modules — no bundler |
| Icons | Lucide (CDN UMD) |
| Fonts | Google Fonts — Space Grotesk, Inter Tight, Hubot Sans, JetBrains Mono, Instrument Serif |
| Linting | ESLint, Stylelint, Prettier (with jinja-template plugin) |
| Build | 11ty → `inline-build.mjs` (standalone + SPA) |

## Project Structure

```
{{project-name}}/
├── .eleventy.js              # 11ty config
├── AGENTS.md                 # Canonical shared instructions (this file)
├── CLAUDE.md                 # Claude-specific → "read AGENTS.md first"
├── .claude/                  # Claude Code native settings
├── .cursor/rules/            # Cursor native rules
├── .agent-memory/            # Cross-interface persistent memory
├── .agents/skills/           # Bundled AI agent skills
├── source-reference/         # DROP ZONE: raw HTML/React source pages
├── scripts/inline-build.mjs  # Standalone + SPA builder
├── src/
│   ├── _includes/
│   │   ├── layouts/          # base.njk, page.njk
│   │   ├── sections/         # {domain}/{domain}-{nn}.njk
│   │   └── macros/           # button.njk, etc.
│   ├── _data/                # site.json, nav.json
│   ├── pages/                # .njk page templates
│   └── assets/               # css/, js/, images/
```

## Key Rules

1. **Token-driven.** All values via `var(--token)` in `tokens.css` — never hardcoded.
2. **Pluggable design system.** Swap `tokens.css` to change the visual identity.
3. **Section-based.** Pages composed from `_includes/sections/`. Numbered variants.
4. **11ty layout chain.** `{{ content | safe }}`, not `{% block %}` / `{% extends %}`.
5. **4-file CSS.** tokens → base (@layer base) → components → utilities.
6. **oklch() colors.** Dark mode via `html.dark` in tokens.css.
7. **Motion-aware.** `prefers-reduced-motion` everywhere. Single IntersectionObserver.
8. **View Transitions API.** Lifecycle: `starter:page-loaded`, `starter:before-page-unload`.
9. **No bundler.** Vanilla ES6 IIFE, `<script defer>`.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run build` | 11ty build → `out/` |
| `npm run build:standalone` | Flat HTML → `out-standalone/` |
| `npm run build:spa` | SPA → `out-spa/app.html` |
| `npm run lint` | ESLint + Stylelint |
| `npm run format` | Prettier |
