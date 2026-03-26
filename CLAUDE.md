# Claude Instructions — {{PROJECT_NAME}}

**Read `AGENTS.md` first.** It contains the complete project context, structure, rules, and conventions shared across all AI tools.

## Memory System

This project uses `.agent-memory/` for cross-interface persistent memory.
Before starting work, read `.agent-memory/index.yaml` and load relevant memories.
After significant work, save learnings with source: `claude-code` (CLI) or `claude-app` (Claude App).

## Claude-Specific Notes

- 11ty uses `{{ content | safe }}` layout chain — not `{% block %}` / `{% extends %}`.
- When adding tokens, update both `tokens.css` AND the `@theme` block in `base.njk`.
- For source-reference conversions, present a decomposition plan before writing code.
