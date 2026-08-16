import fs from 'node:fs';
import path from 'node:path';
import { imageFileForRoute, metadata, ogRecord, routeFor } from './lib/og-image.mjs';

const outputRoot = path.resolve(process.env.ELEVENTY_OUTPUT_DIR || 'out');
const manifestPath = 'scripts/og-image-manifest.json';
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

if (!fs.existsSync(manifestPath))
  failures.push('missing OG image manifest; run npm run og:generate');
else if (!fs.existsSync(outputRoot))
  failures.push(`missing ${outputRoot}; run an indexable build first`);
else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const expectedRoutes = new Set();
  for (const file of walk(outputRoot).filter((item) => item.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    const image = metadata(html, 'og:image');
    if (!image) continue;
    const route = routeFor(outputRoot, file);
    expectedRoutes.add(route);
    const title = metadata(html, 'og:title');
    const description = metadata(html, 'og:description');
    const sourceFile = path.join('src/assets/images/og', imageFileForRoute(route));
    const expected = ogRecord({ route, title, description }, sourceFile.split(path.sep).join('/'));
    const actual = manifest[route];
    if (!actual) failures.push(`${route}: missing manifest entry`);
    else if (
      actual.hash !== expected.hash ||
      actual.title !== title ||
      actual.description !== description ||
      actual.file !== expected.file
    ) {
      failures.push(`${route}: stale manifest or image metadata; run npm run og:generate`);
    }
    if (!fs.existsSync(sourceFile)) failures.push(`${route}: missing ${sourceFile}`);
    else {
      const signature = fs.readFileSync(sourceFile).subarray(1, 4).toString('ascii');
      if (signature !== 'PNG') failures.push(`${route}: OG image is not PNG`);
    }
    const builtPath = new URL(image).pathname.replace(/^.*?\/assets\//, 'assets/');
    if (!fs.existsSync(path.join(outputRoot, builtPath))) {
      failures.push(`${route}: built OG image is missing: ${builtPath}`);
    }
  }
  for (const route of Object.keys(manifest)) {
    if (!expectedRoutes.has(route)) failures.push(`${route}: stale extra manifest entry`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('OG image manifest, hashes, and built metadata passed.');
