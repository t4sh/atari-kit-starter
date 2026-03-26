# Bundled AI Agent Skills

This project includes AI agent skills that enhance your workflow across Claude Code, Cursor, and other AI tools.

## Included Skills

| Skill | Purpose |
|-------|---------|
| **agent-memory** | Cross-interface persistent memory system (`.agent-memory/`) |
| **localhost-screenshots** | Capture and compare localhost screenshots |

## Setup for Your Machine

These skills are bundled in `.agents/skills/` so they work out of the box. For **global availability** across all your projects, sync them to your home directory:

```bash
# One-time setup — copy bundled skills to global location
mkdir -p ~/.agents/skills
cp -r .agents/skills/* ~/.agents/skills/
```

### Checking for updates

If your global copy is newer than the bundled version, the global takes precedence. To check versions:

```bash
# Compare agent-memory versions
grep 'version:' .agents/skills/agent-memory/SKILL.md
grep 'version:' ~/.agents/skills/agent-memory/SKILL.md
```

### How skills work

- AI agents look for skills in: project `.agents/skills/` → global `~/.agents/skills/`
- Each skill has a `SKILL.md` with instructions the agent reads before executing
- Skills are invoked by mentioning them: `[skill:agent-memory]`
- The `agent-memory` skill also includes `bootstrap.sh` for CLI operations
