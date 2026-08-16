import fs from 'node:fs';
import path from 'node:path';

const pagesRoot = path.resolve('src/pages');
const failures = [];
const routes = new Map();
const ignored = new Set(['404.njk', 'robots.txt.njk', 'sitemap.xml.njk']);

function normalizeRoute(value) {
  const route = String(value || '').split(/[?#]/)[0] || '/';
  return route.length > 1 ? route.replace(/\/+$/, '') : route;
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /\.(njk|md|html)$/.test(entry.name)) inspect(full);
  }
}

function inspect(file) {
  const relative = path.relative(pagesRoot, file);
  if (ignored.has(path.basename(file))) return;
  const text = fs.readFileSync(file, 'utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) failures.push(`${relative}: missing frontmatter`);
  const block = frontmatter?.[1] || '';
  if (!/^title:\s*\S/m.test(block)) failures.push(`${relative}: missing title`);
  if (!/^description:\s*\S/m.test(block)) failures.push(`${relative}: missing description`);
  const explicitPermalink = block.match(/^permalink:\s*([^\s]+)\s*$/m)?.[1];
  const inferredPermalink = relative
    .replace(/\\/g, '/')
    .replace(/(?:\/index)?\.(?:njk|md|html)$/, '/')
    .replace(/^index\/$/, '/');
  const permalink = explicitPermalink || `/${inferredPermalink.replace(/^\/+/, '')}`;
  const normalizedPermalink = normalizeRoute(permalink);
  if (routes.has(normalizedPermalink)) {
    failures.push(`${relative}: duplicate permalink ${normalizedPermalink}`);
  }
  routes.set(normalizedPermalink, relative);
  if (/javascript\s*:/i.test(text) || /href=["']\/\//i.test(text)) {
    failures.push(`${relative}: unsafe or protocol-relative URL`);
  }
}

walk(pagesRoot);

const navPath = path.resolve('src/_data/nav.json');
if (fs.existsSync(navPath)) {
  const nav = JSON.parse(fs.readFileSync(navPath, 'utf8'));
  for (const item of nav.items || []) {
    if (!item.url || /^(?:[a-z][a-z0-9+.-]*:|#|\?)/i.test(item.url)) continue;
    const target = normalizeRoute(item.url);
    if (!routes.has(target))
      failures.push(`nav.json: ${item.label || target} targets missing route ${target}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Content validation passed for ${routes.size} routed page(s).`);
}
