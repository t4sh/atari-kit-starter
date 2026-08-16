import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { imageFileForRoute, metadata, ogRecord, routeFor } from './lib/og-image.mjs';

const outputRoot = path.resolve(process.env.ELEVENTY_OUTPUT_DIR || 'out');
const outputFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) outputFiles.push(full);
  }
}

if (!fs.existsSync(outputRoot)) throw new Error(`Missing ${outputRoot}; run npm run build first`);
walk(outputRoot);
const manifest = {};
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  for (const file of outputFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const route = routeFor(outputRoot, file);
    const title =
      metadata(html, 'og:title') || html.match(/<title>([^<]*)<\/title>/i)?.[1] || 'Project page';
    const description = metadata(html, 'og:description') || metadata(html, 'description');
    const target = path.join('src/assets/images/og', imageFileForRoute(route));
    const record = ogRecord({ route, title, description }, target.split(path.sep).join('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await page.setContent(
      `<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}</style>${record.svg}`
    );
    await page.screenshot({ path: target, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    manifest[route] = {
      title: record.title,
      description: record.description,
      file: record.file,
      hash: record.hash,
    };
  }
} finally {
  await browser.close();
}

fs.writeFileSync('scripts/og-image-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${outputFiles.length} OG image(s) under src/assets/images/og/`);
