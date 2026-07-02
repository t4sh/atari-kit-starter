// template-safety.cjs — Shared safety rules for Nunjucks-facing template seams.
//
// Keep URL and attribute-name policy here so macros and filters don't each
// invent their own shallow safety implementation.

const SAFE_ATTR_NAMES = new Set([
  'aria-label',
  'disabled',
  'download',
  'form',
  'id',
  'name',
  'rel',
  'role',
  'title',
  'type',
  'value',
]);

function safeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (trimmed.startsWith('//')) return '#';
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }
  if (/^(https?|mailto|tel):/i.test(trimmed)) return trimmed;
  return '#';
}

function safeAttrName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim().toLowerCase();
  if (!/^[a-z][a-z0-9:-]*$/.test(trimmed)) return '';
  if (trimmed === 'style' || trimmed.startsWith('on')) return '';
  if (trimmed.startsWith('aria-') || trimmed.startsWith('data-')) return trimmed;
  return SAFE_ATTR_NAMES.has(trimmed) ? trimmed : '';
}

module.exports = {
  safeUrl,
  safeAttrName,
};
