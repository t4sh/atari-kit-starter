const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

test('analytics consent remains disabled when browser storage is blocked', () => {
  const events = [];
  const context = {
    window: {
      localStorage: {
        getItem() {
          throw new Error('blocked');
        },
        setItem() {
          throw new Error('blocked');
        },
        removeItem() {
          throw new Error('blocked');
        },
      },
    },
    document: {
      dispatchEvent(event) {
        events.push(event);
      },
    },
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    },
  };

  vm.runInNewContext(readFileSync('src/assets/js/analytics.js', 'utf8'), context);
  assert.equal(context.window.SiteAnalytics.hasConsent(), false);
  assert.equal(context.window.SiteAnalytics.grant(), false);
  assert.equal(context.window.SiteAnalytics.revoke(), false);
  assert.equal(events.at(-1).detail.granted, false);
});
