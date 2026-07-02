#!/usr/bin/env node
/**
 * sync-agent-docs.mjs — keep Claude-specific instructions as a thin pointer.
 *
 * AGENTS.md is the canonical shared instruction file for this repo. CLAUDE.md
 * intentionally stays small so there is no second long-lived copy to drift.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const claudePath = resolve(root, 'CLAUDE.md');

const expectedClaude = `# Claude Instructions — {{PROJECT_NAME}}

Read \`AGENTS.md\` first. It is the canonical shared instruction file for this repo.
`;

const currentClaude = readFileSync(claudePath, 'utf8');

if (currentClaude === expectedClaude) {
  console.log('Agent docs are in sync.');
  process.exit(0);
}

writeFileSync(claudePath, expectedClaude, 'utf8');
console.error('Updated CLAUDE.md to point at AGENTS.md. Re-stage CLAUDE.md and commit again.');
process.exit(1);
