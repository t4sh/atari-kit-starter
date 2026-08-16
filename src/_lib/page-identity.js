function normalizePath(url) {
  if (!url || typeof url !== 'string') return '/';
  let pathname = url.split('?')[0].split('#')[0] || '/';
  if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'/index.html'.length) || '/';
  else if (pathname.endsWith('.html')) pathname = pathname.slice(0, -'.html'.length) || '/';
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return pathname || '/';
}

function absoluteUrl(baseUrl, value) {
  const raw = String(value || '').trim();
  if (!raw) return String(baseUrl || '');
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return raw;
  const base = String(baseUrl || '').replace(/\/+$/, '');
  return raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`;
}

function canonicalUrl(baseUrl, url) {
  return absoluteUrl(baseUrl, normalizePath(url));
}

function ogImagePath(url) {
  const path = normalizePath(url);
  return path === '/' ? '/assets/images/og/index.png' : `/assets/images/og${path}.png`;
}

function ogImageUrl(baseUrl, url, override) {
  return absoluteUrl(baseUrl, override || ogImagePath(url));
}

module.exports = { absoluteUrl, canonicalUrl, normalizePath, ogImagePath, ogImageUrl };
