# Bundled AI Agent Skills

This project includes AI agent skills that enhance your workflow across Claude Code, Cursor, and other AI tools.

## Included Skills

| Skill                     | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| **localhost-screenshots** | Capture and compare localhost screenshots   |

## Setup for Your Machine

These skills are bundled in `.agents/skills/` so they work out of the box. For **global availability** across all your projects, sync them to your home directory:

```bash
# One-time setup — copy bundled skills to global location
mkdir -p ~/.agents/skills
cp -r .agents/skills/* ~/.agents/skills/
```

### How skills work

- AI agents look for skills in: project `.agents/skills/` → global `~/.agents/skills/`
- Each skill has a `SKILL.md` with instructions the agent reads before executing
- Skills are invoked by mentioning them: `[skill:localhost-screenshots]`

## Optional — external skills

Cross-session persistent memory lives in the separate **`agent-memory`** skill, installed via the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add t4sh/skills4sh --skill agent-memory
```

Details: https://skills.sh/t4sh/skills4sh/agent-memory
