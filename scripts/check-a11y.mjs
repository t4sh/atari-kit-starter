import assert from 'node:assert/strict';
import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';
import { startStaticServer } from './lib/static-server.mjs';

const routes = ['/', '/about/', '/404.html'];
const scenarios = [
  { name: 'desktop', viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
  { name: 'reduced-motion', viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' },
];

const { server, url } = await startStaticServer();
const browser = await chromium.launch({ headless: true });
try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      reducedMotion: scenario.reducedMotion,
    });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${url}${route}`, { waitUntil: 'networkidle' });
      const results = await new AxeBuilder({ page }).analyze();
      assert.equal(
        results.violations.length,
        0,
        `${scenario.name} ${route}: ${results.violations.map((item) => item.id).join(', ')}`
      );
    }
    await context.close();
  }
  console.log(`Accessibility passed for ${routes.length} routes × ${scenarios.length} scenarios.`);
} finally {
  await browser.close();
  server.close();
}
