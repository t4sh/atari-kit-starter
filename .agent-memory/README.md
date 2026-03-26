---
title: Agent Memory System
version: "2.0"
created: 2026-03-26
updated: 2026-03-26
---

# `.agent-memory/` — Cross-Interface Persistent Memory

Single source of truth for project context shared across all AI interfaces:
Claude App, Claude Code CLI, VSCode, Craft Agent, or any file-reading agent.

## Quick Start for Agents

1. Read `index.yaml` — lists every memory file with type, description, and path.
2. Load only what's relevant to the current task.
3. If a memory conflicts with the current codebase, trust what you observe — then update the memory.

## Directory Structure

```
.agent-memory/
├── index.yaml              # Machine-readable registry (read first)
├── README.md               # System spec (this file)
├── user/                   # Who the user is, preferences
├── feedback/               # Corrections and confirmations
├── project/                # Ongoing work, goals, progress
├── decisions/              # Architectural decisions (lightweight ADRs)
├── context/                # Current phase, sprint, active focus
├── conventions/            # Tone, voice, naming, code style
├── reference/              # External resources, architecture docs
└── sessions/               # Session logs (YYMMDD-slug.md)
```

## File Format

```yaml
---
id: {type}/{topic}                # matches directory/filename (no .md)
type: user | feedback | project | decision | context | convention | reference | session
title: Human-readable title
description: >-
  One-line summary — decides relevance without opening the file.
tags: [tag1, tag2]
source: claude-app | claude-code | vscode | craft-agent | other
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active | archived
expires: YYYY-MM-DD              # optional — review date for context memories
---

Markdown body here.
For feedback/decision types, include **Why:** and **How to apply:** sections.
```

## Memory Types

| Type         | Directory      | Purpose                                        | Changes    |
|--------------|----------------|------------------------------------------------|------------|
| user         | user/          | Role, goals, preferences, collaboration style  | Rarely     |
| feedback     | feedback/      | Corrections and confirmations — do / don't     | As given   |
| project      | project/       | Ongoing work, goals, progress, status          | Often      |
| decision     | decisions/     | Architectural decisions with rationale          | When changed|
| context      | context/       | Current phase, active sprint, immediate focus  | Frequently |
| convention   | conventions/   | Tone, voice, naming rules, code style          | Occasionally|
| reference    | reference/     | External resources, architecture docs          | Rarely     |
| session      | sessions/      | Session logs — what, when, which agent         | Each session|

## Operations

Any interface can perform: **init**, **build**, **save**, **maintain**, **status**.
Always keep `index.yaml` in sync with the filesystem.

## Rules

1. **Distill, don't transcribe.** Summaries and decisions, not transcripts.
2. **One idea per file.** Split if a memory covers unrelated topics.
3. **Update in place.** When facts change, edit the file. Don't append forever.
4. **Keep index in sync.** Every file in index, every index entry points to a file.
5. **Use `expires` on context.** Context goes stale. Set a review date.
6. **Reference, don't copy.** Point to source docs instead of duplicating content.
7. **No secrets.** No credentials, PII, or sensitive data. Safe to commit.

## Conventions

- Filenames: kebab-case, no type prefix (directory IS the type)
- Dates: ISO 8601 (YYYY-MM-DD), always absolute (never "next Thursday")
- Source identifiers: claude-app, claude-code, vscode, craft-agent, other
