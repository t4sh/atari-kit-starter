import crypto from 'node:crypto';
import path from 'node:path';

export function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function metadata(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const key = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    if (key !== name) continue;
    return tag.match(/content=["']([^"']*)["']/i)?.[1] || '';
  }
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i');
  return html.match(pattern)?.[0]?.match(/content=["']([^"']*)["']/i)?.[1] || '';
}

export function routeFor(outputRoot, file) {
  const relative = path.relative(outputRoot, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
}

export function imageFileForRoute(route) {
  return route === '/' ? 'index.png' : `${route.replace(/^\/+|\/+$/g, '')}.png`;
}

export function renderOgSvg({ route, title, description }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f5f5f0"/><rect x="72" y="72" width="16" height="486" fill="#111827"/><text x="136" y="180" font-family="Arial, sans-serif" font-size="28" fill="#4b5563">${escapeXml(route)}</text><text x="136" y="290" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#111827">${escapeXml(title.slice(0, 34))}</text><text x="136" y="360" font-family="Arial, sans-serif" font-size="26" fill="#4b5563">${escapeXml(description.slice(0, 62))}</text></svg>`;
}

export function ogRecord(input, file) {
  const svg = renderOgSvg(input);
  return {
    ...input,
    file,
    hash: crypto.createHash('sha256').update(svg).digest('hex'),
    svg,
  };
}
