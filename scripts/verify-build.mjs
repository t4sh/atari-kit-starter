import fs from 'node:fs';
import path from 'node:path';

const outputRoot = path.resolve(process.env.ELEVENTY_OUTPUT_DIR || 'out');
const prefix = (process.env.ELEVENTY_PATH_PREFIX || '').replace(/^\/+|\/+$/g, '');
const baseUrl = String(process.env.SITE_BASE_URL || '').replace(/\/+$/, '');
const indexable = process.env.SITE_INDEXABLE === 'true';
const required = ['index.html', 'about/index.html', '404.html', 'robots.txt', 'sitemap.xml'];
const failures = [];
const canonicalRoutes = new Map([
  ['index.html', '/'],
  ['about/index.html', '/about'],
]);

for (const file of required) {
  if (!fs.existsSync(path.join(outputRoot, file))) failures.push(`missing output: ${file}`);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function attributeValues(html, attribute) {
  return [...html.matchAll(new RegExp(`\\b${attribute}=["']([^"']+)["']`, 'gi'))].map(
    (match) => match[1]
  );
}

function metaContent(html, key) {
  const tag = (html.match(/<meta\b[^>]*>/gi) || []).find((value) =>
    new RegExp(`(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(
      value
    )
  );
  return tag?.match(/content=["']([^"']*)["']/i)?.[1] || '';
}

if (fs.existsSync(outputRoot)) {
  for (const file of walk(outputRoot).filter((item) => item.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    const relative = path.relative(outputRoot, file).split(path.sep).join('/');
    const unresolved = html.match(/{{\s*[\w.-]+\s*}}/g) || [];
    const unexpected = unresolved.filter(
      (value) => !/{{\s*(PROJECT_NAME|project-name)\s*}}/.test(value)
    );
    if (/undefined/.test(html) || unexpected.length) {
      failures.push(`${relative}: unresolved template value`);
    }
    if (/javascript\s*:/i.test(html)) failures.push(`${relative}: executable URL found`);

    for (const value of [...attributeValues(html, 'href'), ...attributeValues(html, 'src')]) {
      if (!value.startsWith('/') || value.startsWith('//')) continue;
      if (prefix && !value.startsWith(`/${prefix}/`) && value !== `/${prefix}`) {
        failures.push(`${relative}: unprefixed internal URL ${value}`);
      }
      const assetIndex = value.indexOf('/assets/');
      if (assetIndex !== -1) {
        const asset = value.slice(assetIndex + 1).split(/[?#]/)[0];
        if (!fs.existsSync(path.join(outputRoot, asset))) {
          failures.push(`${relative}: missing referenced asset ${asset}`);
        }
      }
    }

    const canonical =
      html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] || '';
    if (indexable) {
      if (!baseUrl) failures.push('SITE_BASE_URL is required for an indexable build');
      const expectedRoute = canonicalRoutes.get(relative);
      if (expectedRoute && canonical !== `${baseUrl}${expectedRoute}`) {
        failures.push(`${relative}: canonical mismatch (${canonical || 'missing'})`);
      }
      for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) {
        if (!metaContent(html, key)) failures.push(`${relative}: missing ${key}`);
      }
      const scripts =
        html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ||
        [];
      if (!scripts.length) failures.push(`${relative}: missing JSON-LD`);
      for (const script of scripts) {
        try {
          JSON.parse(script.replace(/^.*?>|<\/script>$/gis, ''));
        } catch {
          failures.push(`${relative}: invalid JSON-LD`);
        }
      }
    } else if (canonical) failures.push(`${relative}: canonical emitted for a non-indexable build`);
  }

  const robots = fs.existsSync(path.join(outputRoot, 'robots.txt'))
    ? fs.readFileSync(path.join(outputRoot, 'robots.txt'), 'utf8')
    : '';
  if (indexable) {
    if (!robots.includes('Allow: /') || !robots.includes(`Sitemap: ${baseUrl}/sitemap.xml`)) {
      failures.push('robots.txt: invalid public directives');
    }
    const sitemap = fs.readFileSync(path.join(outputRoot, 'sitemap.xml'), 'utf8');
    for (const route of canonicalRoutes.values()) {
      if (!sitemap.includes(`<loc>${baseUrl}${route}</loc>`)) {
        failures.push(`sitemap.xml: missing canonical ${baseUrl}${route}`);
      }
    }
  } else if (!robots.includes('Disallow: /'))
    failures.push('robots.txt: preview must disallow crawling');
}

if (failures.length) {
  console.error([...new Set(failures)].join('\n'));
  process.exitCode = 1;
} else console.log(`Build verification passed for ${outputRoot}.`);
