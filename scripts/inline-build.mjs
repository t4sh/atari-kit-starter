#!/usr/bin/env node
/**
 * inline-build.mjs
 *
 * Reads HTML from /out (11ty output), inlines CSS/JS/images, then writes:
 *   /out-standalone/  — flat sibling .html files (browsable via file://)
 *   /out-spa/         — single app.html with hash routing
 *
 * Usage:
 *   node scripts/inline-build.mjs               # standalone pages
 *   node scripts/inline-build.mjs --spa          # combined SPA
 *
 * Adapted from atari-kit's inline-build.mjs for starter.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'out');
const SRC_DIR = join(ROOT, 'src');
const STANDALONE_DIR = join(ROOT, 'out-standalone');
const SPA_DIR = join(ROOT, 'out-spa');
const SPA_MODE = process.argv.includes('--spa');
const SKIP_FRESHNESS = process.argv.includes('--no-freshness-check');

// -- Helpers ----------------------------------------------------------------

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function findFiles(dir, ext, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findFiles(full, ext, files);
    } else if (full.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Prerequisite + freshness guard.
 *
 * Fails loudly if `out/` is missing or empty — the downstream inline builds
 * cannot run until 11ty has produced HTML. Also warns if any source file
 * under `src/` has a newer mtime than `out/index.html`, which almost always
 * means someone forgot to re-run `npm run build` after editing templates.
 *
 * The staleness check is advisory (warning, not error) so that fast iteration
 * on inline-build.mjs itself doesn't constantly trip it. Pass
 * --no-freshness-check to silence the warning entirely.
 */
function assertOutIsReady(label) {
  if (!existsSync(OUT_DIR)) {
    console.error(
      `\n[${label}] /out does not exist.\n` +
      `  Run "npm run build" first, or use "npm run build:all" to do both steps.\n`
    );
    process.exit(1);
  }

  const indexPath = join(OUT_DIR, 'index.html');
  if (!existsSync(indexPath)) {
    console.error(
      `\n[${label}] /out exists but has no index.html.\n` +
      `  11ty build appears incomplete. Re-run "npm run build".\n`
    );
    process.exit(1);
  }

  if (SKIP_FRESHNESS) return;

  const outMtime = statSync(indexPath).mtimeMs;
  let newestSrcMtime = 0;
  let newestSrcFile = '';

  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (st.mtimeMs > newestSrcMtime) {
        newestSrcMtime = st.mtimeMs;
        newestSrcFile = relative(ROOT, full);
      }
    }
  }
  walk(SRC_DIR);

  if (newestSrcMtime > outMtime) {
    const lagSec = ((newestSrcMtime - outMtime) / 1000).toFixed(0);
    console.warn(
      `\n[${label}] /out/index.html is older than the newest source file.\n` +
      `  Newest source: ${newestSrcFile} (${lagSec}s newer than /out)\n` +
      `  /out may be stale. Run "npm run build" before "npm run build:inline"\n` +
      `  (or use "npm run build:all" to do both). Proceeding anyway.\n`
    );
  }
}

function readFileOrEmpty(filePath) {
  try { return readFileSync(filePath, 'utf-8'); } catch { return ''; }
}

function fileToBase64DataUri(filePath) {
  try {
    const buf = readFileSync(filePath);
    const ext = extname(filePath).slice(1).toLowerCase();
    const mimeMap = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
      ico: 'image/x-icon', woff2: 'font/woff2', woff: 'font/woff',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

// -- Flatten helpers --------------------------------------------------------

function flattenPath(relPath) {
  relPath = relPath.replace(/\\/g, '/');
  if (relPath === 'index.html') return 'index.html';
  if (relPath.endsWith('/index.html')) {
    const dir = relPath.slice(0, -'/index.html'.length);
    return dir.replace(/\//g, '-') + '.html';
  }
  return relPath.replace(/\//g, '-');
}

function urlToFlat(url) {
  let hash = '';
  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    hash = url.slice(hashIdx);
    url = url.slice(0, hashIdx);
  }
  let path = url.startsWith('/') ? url.slice(1) : url;
  if (path.endsWith('/')) path = path.slice(0, -1);
  if (!path) return 'index.html' + hash;
  return path.replace(/\//g, '-') + '.html' + hash;
}

function rewriteLinksToFlat(html) {
  html = html.replace(/((?:href|src)=["'])\/assets\//gi, '$1assets/');
  html = html.replace(
    /href="(\/(?!assets\/)[^"]*?)"/gi,
    (_match, url) => `href="${urlToFlat(url)}"`
  );
  html = html.replace(
    /href='(\/(?!assets\/)[^']*?)'/gi,
    (_match, url) => `href='${urlToFlat(url)}'`
  );
  return html;
}

function copyDirSync(src, dest) {
  if (!existsSync(src)) return;
  ensureDir(dest);
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      writeFileSync(destPath, readFileSync(srcPath));
    }
  }
}

// -- Inline CSS/JS/Images ---------------------------------------------------

function inlineCSS(html, htmlDir) {
  // Match any <link ...> tag, then pick out rel/href from the attrs so the
  // order doesn't matter (<link rel=".." href=".."> vs <link href=".." rel="..">).
  return html.replace(
    /<link\s+([^>]*?)\/?>/gi,
    (match, attrs) => {
      if (!/\brel\s*=\s*["']stylesheet["']/i.test(attrs)) return match;
      const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (!hrefMatch) return match;
      const href = hrefMatch[1];
      if (href.startsWith('http://') || href.startsWith('https://')) return match;
      const cssPath = href.startsWith('/') ? join(OUT_DIR, href) : join(htmlDir, href);
      const css = readFileOrEmpty(cssPath);
      if (!css) {
        console.warn(`  [inline] missing CSS: ${href} (kept as external <link>)`);
        return match;
      }
      return `<style>/* inlined: ${href} */\n${css}\n</style>`;
    }
  );
}

function inlineJS(html, htmlDir) {
  return html.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
    (match, src) => {
      if (src.startsWith('http://') || src.startsWith('https://')) return match;
      const jsPath = src.startsWith('/') ? join(OUT_DIR, src) : join(htmlDir, src);
      const js = readFileOrEmpty(jsPath);
      if (!js) {
        console.warn(`  [inline] missing JS: ${src} (kept as external <script>)`);
        return match;
      }
      return `<script>/* inlined: ${src} */\n${js}\n</script>`;
    }
  );
}

function inlineImages(html, htmlDir) {
  return html.replace(
    /(<img\s+[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
    (match, pre, src, post) => {
      if (src.startsWith('http') || src.startsWith('data:')) return match;
      const imgPath = src.startsWith('/') ? join(OUT_DIR, src) : join(htmlDir, src);
      const dataUri = fileToBase64DataUri(imgPath);
      if (!dataUri) {
        console.warn(`  [inline] missing image: ${src} (kept as external <img>)`);
        return match;
      }
      return `${pre}${dataUri}${post}`;
    }
  );
}

function minifyHTML(html) {
  const parts = [];
  // Protect whitespace-sensitive regions. <pre> and <textarea> preserve
  // literal whitespace per HTML spec; collapsing it silently corrupts
  // code samples, comment drafts, etc.
  const re = /(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<textarea[\s\S]*?<\/textarea>)/gi;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(html)) !== null) {
    parts.push({ type: 'html', content: html.slice(lastIndex, match.index) });
    parts.push({ type: 'protected', content: match[0] });
    lastIndex = re.lastIndex;
  }
  parts.push({ type: 'html', content: html.slice(lastIndex) });
  return parts.map(p => {
    if (p.type === 'protected') return p.content;
    return p.content
      .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
      .replace(/>\s{2,}</g, '> <')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n\s*\n/g, '\n');
  }).join('');
}

function processFile(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  const htmlDir = dirname(filePath);
  html = inlineCSS(html, htmlDir);
  html = inlineJS(html, htmlDir);
  html = inlineImages(html, htmlDir);
  return html;
}

// -- Standalone build -------------------------------------------------------

function buildStandalone() {
  assertOutIsReady('build:standalone');

  console.log('Building flat standalone pages -> /out-standalone/');
  ensureDir(STANDALONE_DIR);

  const htmlFiles = findFiles(OUT_DIR, '.html');
  if (htmlFiles.length === 0) {
    console.error('No HTML files found in /out. Run "npm run build" first.');
    process.exit(1);
  }

  const assetsSrc = join(OUT_DIR, 'assets');
  const assetsDest = join(STANDALONE_DIR, 'assets');
  if (existsSync(assetsSrc)) {
    copyDirSync(assetsSrc, assetsDest);
    console.log('  assets/ copied');
  }

  for (const file of htmlFiles) {
    const relPath = relative(OUT_DIR, file).replace(/\\/g, '/');
    if (relPath.startsWith('assets/')) continue;

    const flatName = flattenPath(relPath);
    let html = processFile(file);
    html = rewriteLinksToFlat(html);

    writeFileSync(join(STANDALONE_DIR, flatName), html, 'utf-8');
    console.log(`  ${relPath} -> ${flatName}`);
  }

  console.log('\nStandalone files written to /out-standalone/');
}

// -- SPA build --------------------------------------------------------------

function slugify(route) {
  return route.replace(/^\//, '').replace(/\/$/g, '').replace(/\//g, '-') || 'home';
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSPA() {
  assertOutIsReady('build:spa');

  console.log('Building SPA -> /out-spa/app.html');
  ensureDir(SPA_DIR);

  const htmlFiles = findFiles(OUT_DIR, '.html');
  if (htmlFiles.length === 0) {
    console.error('No HTML files found in /out. Run "npm run build" first.');
    process.exit(1);
  }

  // Use homepage as the shell
  const homepagePath = join(OUT_DIR, 'index.html');
  if (!existsSync(homepagePath)) {
    console.error('No index.html found in /out.');
    process.exit(1);
  }

  const homeHTML = processFile(homepagePath);
  const headMatch = homeHTML.match(/<head>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';

  const bodyMatch = homeHTML.match(/<body([^>]*)>([\s\S]*)<\/body>/i);
  const bodyAttrs = bodyMatch ? bodyMatch[1] : '';
  const bodyContent = bodyMatch ? bodyMatch[2] : '';

  const mainOpenMatch = bodyContent.match(/<main\s+id=["']main-content["'][^>]*>/i);
  const mainCloseIdx = bodyContent.lastIndexOf('</main>');

  let shellBefore = '';
  let shellAfter = '';

  if (mainOpenMatch && mainCloseIdx !== -1) {
    const mainOpenIdx = bodyContent.indexOf(mainOpenMatch[0]);
    shellBefore = bodyContent.substring(0, mainOpenIdx);
    shellAfter = bodyContent.substring(mainCloseIdx + '</main>'.length);
  }

  // Extract pages
  const pages = [];
  for (const file of htmlFiles) {
    const relPath = relative(OUT_DIR, file)
      .replace(/index\.html$/, '')
      .replace(/\.html$/, '')
      .replace(/\\/g, '/');
    const route = '/' + relPath;

    let html = readFileSync(file, 'utf-8');
    html = inlineJS(html, dirname(file));

    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (!mainMatch) continue;

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : relPath || 'Home';

    pages.push({ route: route || '/', title, content: minifyHTML(mainMatch[1]) });
  }

  console.log(`  Found ${pages.length} pages to bundle.`);

  // Convert internal links to hash routes
  function convertLinksToHash(html) {
    html = html.replace(/href="(\/[^"#]*?)"/g, (_m, path) => `href="#${path}"`);
    html = html.replace(/href='(\/[^'#]*?)'/g, (_m, path) => `href='#${path}'`);
    return html;
  }

  const shellBeforeHash = convertLinksToHash(shellBefore);
  const shellAfterHash = convertLinksToHash(shellAfter);

  // Build the SPA HTML
  let spaHTML = `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}
<style>
  .spa-page { display: none; }
  .spa-page.is-active { display: block; }
</style>
</head>
<body${bodyAttrs}>
${shellBeforeHash}
  <main id="main-content"></main>
${shellAfterHash}

`;

  for (const p of pages) {
    spaHTML += `  <template id="page-${slugify(p.route)}" data-route="${p.route}" data-title="${escapeAttr(p.title)}">${p.content}</template>\n`;
  }

  spaHTML += `
<script>
(function () {
  'use strict';

  var templates = document.querySelectorAll('template[data-route]');
  var routeMap = {};
  templates.forEach(function (t) {
    routeMap[t.getAttribute('data-route')] = t;
  });

  function navigate() {
    var hash = window.location.hash.slice(1) || '/';
    var tpl = routeMap[hash] || routeMap['/'];

    if (!tpl) return;

    document.dispatchEvent(new CustomEvent('{{project-name}}:before-page-unload'));

    var main = document.getElementById('main-content');
    main.innerHTML = tpl.innerHTML;

    document.title = tpl.getAttribute('data-title') || '{{project-name}}';
    window.scrollTo(0, 0);

    document.dispatchEvent(new CustomEvent('{{project-name}}:page-loaded'));

    // Re-init Lucide icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  window.addEventListener('hashchange', navigate);

  // Convert remaining internal links to hash on click
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      window.location.hash = href;
    }
  });

  // Initial load
  navigate();
})();
</script>
</body>
</html>`;

  writeFileSync(join(SPA_DIR, 'app.html'), spaHTML, 'utf-8');

  // Gzip
  const gzipped = gzipSync(Buffer.from(spaHTML, 'utf-8'), { level: 9 });
  writeFileSync(join(SPA_DIR, 'app.html.gz'), gzipped);

  const sizeKB = (Buffer.byteLength(spaHTML, 'utf-8') / 1024).toFixed(1);
  const gzKB = (gzipped.length / 1024).toFixed(1);
  console.log(`\nSPA written: app.html (${sizeKB} KB) / app.html.gz (${gzKB} KB)`);
}

// -- Run --------------------------------------------------------------------

if (SPA_MODE) {
  buildSPA();
} else {
  buildStandalone();
}
