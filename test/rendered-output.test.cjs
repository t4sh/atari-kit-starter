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

test('Eleventy render preserves page-level section overrides', () => {
  run('npm', ['run', 'build']);

  const about = readFileSync('out/about/index.html', 'utf8');
  assert.match(about, /Ready to build\?/);
  assert.match(about, /Start adding pages and sections to bring your prototype to life\./);
  assert.doesNotMatch(about, /Ready to get started\?/);
  assert.doesNotMatch(about, /undefined/);
});

test('Eleventy render keeps default section content on the homepage', () => {
  run('npm', ['run', 'build']);

  const home = readFileSync('out/index.html', 'utf8');
  assert.match(home, /Build something remarkable/);
  assert.match(home, /Ready to get started\?/);
  assert.doesNotMatch(home, /undefined/);
});

test('Eleventy prefixes internal URLs for GitHub Pages project sites', () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: { ...process.env, ELEVENTY_PATH_PREFIX: '/atari-kit-starter' },
  });

  const home = readFileSync('out/index.html', 'utf8');
  const about = readFileSync('out/about/index.html', 'utf8');
  assert.match(home, /href="\/atari-kit-starter\/assets\/css\/tokens\.css"/);
  assert.match(home, /href="\/atari-kit-starter\/about\/"/);
  assert.match(about, /src="\/atari-kit-starter\/assets\/js\/theme-toggle\.js"/);
});
