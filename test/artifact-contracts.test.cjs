const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync, rmSync, writeFileSync } = require('node:fs');
const test = require('node:test');

const env = {
  ...process.env,
  SITE_INDEXABLE: 'true',
  SITE_BASE_URL: 'https://example.com/starter',
  ELEVENTY_PATH_PREFIX: '/starter',
  COMMIT_SHA: 'artifact-contract',
};

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: process.cwd(), stdio: 'pipe', env, ...options });
}

test('indexable build emits metadata, crawler files, and build identity', () => {
  run('npm', ['run', 'build']);
  run('npm', ['run', 'verify:build']);

  const home = readFileSync('out/index.html', 'utf8');
  const robots = readFileSync('out/robots.txt', 'utf8');
  const sitemap = readFileSync('out/sitemap.xml', 'utf8');
  assert.match(home, /<link rel="canonical" href="https:\/\/example\.com\/starter\/"/);
  assert.match(home, /<meta property="og:image"/);
  assert.match(home, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(home, /<script type="application\/ld\+json">/);
  assert.match(home, /<meta name="site-build-id" content="artifact-contract"/);
  assert.match(robots, /Allow: \/\nSitemap: https:\/\/example\.com\/starter\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/example\.com\/starter\/about<\/loc>/);
});

test('build verification rejects missing referenced assets', () => {
  run('npm', ['run', 'build']);
  rmSync('out/assets/css/tokens.css');
  assert.throws(
    () => run('npm', ['run', 'verify:build']),
    (error) => `${error.stdout || ''}${error.stderr || ''}`.includes('missing referenced asset')
  );
});

test('OG verification rejects manifest drift', () => {
  run('npm', ['run', 'build']);
  const manifestPath = 'scripts/og-image-manifest.json';
  const original = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(original);
  manifest['/'].hash = 'stale';
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  try {
    assert.throws(
      () => run('node', ['scripts/check-og-images.mjs']),
      (error) => `${error.stdout || ''}${error.stderr || ''}`.includes('stale manifest')
    );
  } finally {
    writeFileSync(manifestPath, original);
  }
});
