const assert = require('node:assert/strict');
const test = require('node:test');

const { safeAttrName, safeUrl } = require('../scripts/template-safety.cjs');

test('safeUrl allows authored relative and standard absolute URLs', () => {
  assert.equal(safeUrl('/about/'), '/about/');
  assert.equal(safeUrl('#main'), '#main');
  assert.equal(safeUrl('?preview=1'), '?preview=1');
  assert.equal(safeUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(safeUrl('mailto:hello@example.com'), 'mailto:hello@example.com');
  assert.equal(safeUrl('tel:+15551234567'), 'tel:+15551234567');
});

test('safeUrl blocks executable and protocol-relative URLs', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), '#');
  assert.equal(safeUrl('vbscript:msgbox(1)'), '#');
  assert.equal(safeUrl('file:///etc/passwd'), '#');
  assert.equal(safeUrl('//evil.example/path'), '#');
});

test('safeAttrName allows structural attributes and blocks executable attributes', () => {
  assert.equal(safeAttrName('aria-controls'), 'aria-controls');
  assert.equal(safeAttrName('data-track'), 'data-track');
  assert.equal(safeAttrName('type'), 'type');
  assert.equal(safeAttrName('onclick'), '');
  assert.equal(safeAttrName('style'), '');
  assert.equal(safeAttrName('target'), '');
  assert.equal(safeAttrName('bad name'), '');
});
