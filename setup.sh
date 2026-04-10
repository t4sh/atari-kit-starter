#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# setup.sh — Initialize a new project from the atari-kit-starter
#
# Usage:
#   bash setup.sh "My Project Name"
#
# This will:
#   1. Replace all {{PROJECT_NAME}} / {{project-name}} placeholders
#   2. Rename lifecycle events in JS files
#   3. Run npm install
#   4. Print success message
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: bash setup.sh \"My Project Name\""
  echo ""
  echo "Example: bash setup.sh \"Dashboard Prototype\""
  exit 1
fi

PROJECT_NAME="$1"
# Convert to kebab-case for package name and lifecycle events
project_slug=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

echo ""
echo "Setting up: $PROJECT_NAME ($project_slug)"
echo "───────────────────────────────────────"

# ── 1. Replace placeholders ──
echo "  Replacing placeholders..."

# Files that contain {{PROJECT_NAME}} or {{project-name}}
for f in \
  package.json \
  AGENTS.md \
  CLAUDE.md \
  src/_data/site.json \
  .cursor/rules/index.mdc \
; do
  if [ -f "$f" ]; then
    sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$f"
    sed -i '' "s/{{project-name}}/$project_slug/g" "$f"
  fi
done
echo "    Done."

# ── 2. Rename lifecycle events ──
# JS modules and inline-build.mjs use '{{project-name}}:page-loaded' /
# '{{project-name}}:before-page-unload' as placeholder CustomEvent names.
# Rewrite the token to the project slug so listeners and dispatchers match.
echo "  Renaming lifecycle events..."
for f in src/assets/js/*.js scripts/inline-build.mjs; do
  if [ -f "$f" ]; then
    sed -i '' "s/{{project-name}}/${project_slug}/g" "$f"
  fi
done
echo "    Done."

# ── 3. npm install ──
echo "  Installing dependencies..."
npm install --silent 2>&1 | tail -1
echo "    Done."

# ── 4. Success ──
echo ""
echo "───────────────────────────────────────"
echo "  $PROJECT_NAME is ready!"
echo ""
echo "  Next steps:"
echo "    npm run dev          → Start dev server at localhost:3000"
echo "    npm run build        → Build static pages"
echo "    npm run build:spa    → Build single-page app"
echo ""
echo "  Add pages:     src/pages/your-page.njk"
echo "  Add sections:  src/_includes/sections/domain/domain-01.njk"
echo "  Swap design:   src/assets/css/tokens.css"
echo ""
echo "  Optional — cross-session AI memory:"
echo "    npx skills add t4sh/skills4sh --skill agent-memory"
echo "    (details: https://skills.sh/t4sh/skills4sh/agent-memory)"
echo "───────────────────────────────────────"
