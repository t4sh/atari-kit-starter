const assert = require('node:assert/strict');
const test = require('node:test');
const identity = require('../src/_lib/page-identity.js');

test('page identity normalizes clean URLs consistently', () => {
  assert.equal(identity.normalizePath('/about/index.html?preview=1'), '/about');
  assert.equal(identity.normalizePath('/about.html#team'), '/about');
  assert.equal(
    identity.canonicalUrl('https://example.com', '/about/'),
    'https://example.com/about'
  );
});

test('page identity derives route-specific PNG social images', () => {
  assert.equal(identity.ogImagePath('/'), '/assets/images/og/index.png');
  assert.equal(identity.ogImagePath('/about/'), '/assets/images/og/about.png');
});
