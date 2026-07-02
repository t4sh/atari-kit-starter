const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const test = require('node:test');

function run(command, args) {
  execFileSync(command, args, {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: { ...process.env, npm_config_engine_strict: 'false' },
  });
}

test('standalone build flattens page routes and keeps section overrides', () => {
  run('npm', ['run', 'build']);
  run('npm', ['run', 'build:standalone']);

  const about = readFileSync('out-standalone/about.html', 'utf8');
  assert.match(about, /Ready to build\?/);
  assert.doesNotMatch(about, /Ready to get started\?/);
});

test('SPA build installs the SPA lifecycle adapter and uses sanitized navigation', () => {
  run('npm', ['run', 'build']);
  run('npm', ['run', 'build:spa']);

  const spa = readFileSync('out-spa/app.html', 'utf8');
  assert.match(spa, /window\.PageLifecycleMode = 'spa'/);
  assert.match(spa, /window\.PageLifecycle/);
  assert.match(spa, /main\.innerHTML = sanitize\(tpl\.innerHTML\)/);
  assert.equal((spa.match(/function sanitizeHTML\(html\)/g) || []).length, 1);
});
