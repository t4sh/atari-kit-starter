const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync, rmSync, writeFileSync } = require('node:fs');
const test = require('node:test');

const fixture = 'src/pages/.invalid-content-fixture.njk';

test('content validation rejects missing description and unsafe URLs', () => {
  writeFileSync(
    fixture,
    '---\ntitle: Invalid\npermalink: /invalid/\n---\n<a href="javascript:alert(1)">bad</a>\n'
  );
  try {
    assert.throws(
      () => execFileSync('node', ['scripts/check-content.mjs'], { stdio: 'pipe' }),
      (error) => {
        const output = `${error.stdout || ''}${error.stderr || ''}`;
        return (
          output.includes('missing description') &&
          output.includes('unsafe or protocol-relative URL')
        );
      }
    );
  } finally {
    rmSync(fixture, { force: true });
  }
});

test('content validation rejects navigation targets without a page', () => {
  const navPath = 'src/_data/nav.json';
  const original = readFileSync(navPath, 'utf8');
  writeFileSync(navPath, '{"items":[{"label":"Missing","url":"/missing/"}]}\n');
  try {
    assert.throws(
      () => execFileSync('node', ['scripts/check-content.mjs'], { stdio: 'pipe' }),
      (error) =>
        `${error.stdout || ''}${error.stderr || ''}`.includes('targets missing route /missing')
    );
  } finally {
    writeFileSync(navPath, original);
  }
});
