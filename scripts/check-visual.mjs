import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { chromium } from 'playwright';
import { startStaticServer } from './lib/static-server.mjs';

const cases = [
  ['home-desktop', '/', { width: 1280, height: 800 }],
  ['home-mobile', '/', { width: 390, height: 844 }],
  ['about-desktop', '/about/', { width: 1280, height: 800 }],
  ['about-mobile', '/about/', { width: 390, height: 844 }],
];
const baselineRoot = path.resolve(process.env.VISUAL_BASELINE_DIR || 'visual/baselines');
const currentRoot = path.resolve(process.env.VISUAL_CURRENT_DIR || 'visual/current');
const update = process.argv.includes('--update');
fs.mkdirSync(baselineRoot, { recursive: true });
fs.rmSync(currentRoot, { recursive: true, force: true });
fs.mkdirSync(currentRoot, { recursive: true });

const { server, url } = await startStaticServer(process.env.VISUAL_OUTPUT_DIR || 'out');
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const [name, route, viewport] of cases) {
    const context = await browser.newContext({
      viewport,
      locale: 'en-US',
      timezoneId: 'UTC',
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${url}${route}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '* { font-family: Arial, sans-serif !important; }' });
    const current = path.join(currentRoot, `${name}.png`);
    const baseline = path.join(baselineRoot, `${name}.png`);
    await page.screenshot({ path: current, fullPage: true, animations: 'disabled' });
    await context.close();
    if (update) {
      fs.copyFileSync(current, baseline);
      continue;
    }
    if (!fs.existsSync(baseline)) {
      failures.push(`${name}: missing baseline; run npm run check:visual -- --update`);
      continue;
    }
    const expected = PNG.sync.read(fs.readFileSync(baseline));
    const actual = PNG.sync.read(fs.readFileSync(current));
    if (expected.width !== actual.width || expected.height !== actual.height) {
      failures.push(`${name}: dimensions changed`);
      continue;
    }
    const changed = pixelmatch(expected.data, actual.data, null, actual.width, actual.height, {
      threshold: 0.1,
    });
    const percent = (changed / (actual.width * actual.height)) * 100;
    if (percent > 0.5) failures.push(`${name}: ${percent.toFixed(2)}% changed`);
  }
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Visual regression passed for ${cases.length} cases${update ? ' (baselines updated)' : ''}.`
  );
