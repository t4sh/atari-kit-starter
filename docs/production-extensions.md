# Production Extensions Roadmap

> Optional hardening paths for teams that grow this starter into a production site or multi-site system.
>
> Keep the default starter small. Add these only when the project has the corresponding need.

This starter is intentionally simpler than production descendants such as `lab-sites/apps/web-lab`: it is a clean Eleventy/Nunjucks scaffold for rapid section-based prototyping. The patterns below are the recommended way to borrow production learnings without turning the starter into a product-specific monorepo.

## Principles

1. **Default stays minimal.** Do not add deploy, monorepo, product, or vendor-specific complexity to the base scaffold.
2. **Extensions are opt-in.** Each extension should be documented as a recipe, package, or script that can be copied in when needed.
3. **Safety seams first.** Prefer small checks, generated manifests, and regression tests over large framework rewrites.
4. **Keep AGENTS.md canonical.** `CLAUDE.md` remains a thin pointer so tool-specific instruction files do not drift.

## Extension candidates

### 1. Docs lifecycle convention

Borrow the status-subdir pattern:

```text
docs/
├── plans/      # Planning or active implementation docs
├── history/    # Shipped plans retained as project memory
└── *.md        # Reference docs
```

Recommended when a project has multiple active plans or repeated agent sessions.

Possible add-ons:

- `docs/DOCS-FOLDER-CONVENTION.md`
- `scripts/check-docs-folders.mjs`
- `npm run check:docs-folders`
- A pre-commit or CI guard once the convention matters

### 2. Visual regression harness

For UI-heavy sites, add an opt-in Playwright + pixelmatch visual workflow.

Recommended shape:

- `visual/baselines/`
- `visual/_current/` and `visual/_diff/` ignored by git
- `npm run visual:capture`
- `npm run visual:update`
- `npm run visual:diff`
- CI workflow gated by an explicit label such as `visual-regression`

Keep this out of the default starter because it adds browser dependencies and baseline maintenance.

### 3. SEO and social preview pipeline

For public production sites, add generated metadata rather than hand-authoring every tag.

Recommended shape:

- Central `site` data with `baseUrl`, name, default description, and default image
- `normalize_path`-based canonical URL generation
- Default Open Graph and Twitter Card tags in `base.njk`
- Optional JSON-LD data blocks per page type
- Optional `og:generate` script for 1200×630 share images
- Optional `check:og-images` drift guard when titles or routes change

### 4. CSP and template-safety hardening

The starter already has basic template safety filters:

- `safe_url`
- `safe_attr_name`
- `jsonScript`
- Markdown rendering with `html: false`

Production projects can extend this with:

- A documented Content-Security-Policy example
- Same-origin script policy for production builds
- Explicit image/font/connect allowlists
- DOMPurify-based soft-navigation sanitization if full-page HTML swaps are introduced
- Tests for any new filter that emits raw HTML or script-adjacent content

### 5. Build metadata and version banner

For deployed static sites, expose build metadata so users can be prompted when a new deploy is live.

Recommended shape:

- Generate `/version.json` during build
- Include `COMMIT_SHA` and `BUILT_AT` when available
- Add a tiny `version-banner.js` module that polls the JSON file
- Show a non-blocking “new version available” toast when SHA changes

Keep this optional because prototypes and single-file exports often do not need deploy polling.

### 6. Shared token/chrome extraction

When two or more sites share the same design language, extract shared pieces instead of copy-pasting.

Recommended extraction path:

- `packages/tokens` for CSS custom properties and optional typed token exports
- `packages/chrome` for nav, footer, shared macros, and shared chrome JS
- App-local includes remain first in the Nunjucks loader so individual sites can override safely
- Shared packages should be source-of-truth only after two projects actually need them

For a single starter-derived site, keep tokens and chrome local.

### 7. Content mirrors and drift checks

When content is mirrored from another repo or service, make the mirror contract explicit.

Recommended shape:

- Local mirror under `src/content/` or `source-reference/`
- A README explaining the upstream source of truth
- `check:*:drift` script that compares local content with upstream identifiers or blob hashes
- CI failure with a copy-paste fix command

This is useful for generated app pages, skill libraries, documentation mirrors, or CMS exports.

### 8. Advanced Eleventy dev-server fallbacks

Production sites may need local routes that proxy or rewrite upstream content during development.

Use Eleventy `setServerOptions({ onRequest })` for:

- API-backed static fallback pages
- Local sitemap previews
- Serving markdown/reference files with explicit UTF-8 content types
- Rewriting upstream URLs to local routes while developing

Keep this out of the starter default; add it only when a project has a real upstream integration.

## Suggested adoption order

1. Keep the base starter checks passing: `lint`, `format:check`, `test`, `build`.
2. Add docs lifecycle once plans start accumulating.
3. Add SEO metadata before public launch.
4. Add visual regression when template/design-token churn becomes risky.
5. Add CSP and deploy metadata before production traffic.
6. Extract shared packages only after a second site proves the reuse boundary.
7. Add mirror/drift checks only for content with a true upstream source of truth.

## What not to copy by default

Do not copy product-specific production details into this starter:

- Monorepo orchestration unless this becomes a multi-package workspace
- Vendor-specific deploy scripts
- Domain-specific nginx/Cloudflare rules
- Product-specific agent instructions
- Historical archive policies from another repo
- Large API rewrite logic inside Eleventy config unless the starter-derived project needs it

The goal is to keep this scaffold teachable, portable, and safe while documenting the path to production maturity.
