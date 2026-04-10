# Claude Instructions — {{PROJECT_NAME}}

**Read `AGENTS.md` first.** It contains the complete project context, structure, rules, and conventions shared across all AI tools.

## Memory System *(optional)*

Cross-session persistent memory is handled by the external `agent-memory` skill.
Install with: `npx skills add t4sh/skills4sh --skill agent-memory`
Details: https://skills.sh/t4sh/skills4sh/agent-memory

If the skill is installed, follow its own instructions for reading and writing memory.

## Claude-Specific Notes

- 11ty uses `{{ content | safe }}` layout chain — not `{% block %}` / `{% extends %}`.
- When adding tokens, update both `tokens.css` AND the `@theme` block in `base.njk`.
- For source-reference conversions, present a decomposition plan before writing code.
