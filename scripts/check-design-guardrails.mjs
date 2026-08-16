import fs from 'node:fs';
import path from 'node:path';

const roots = ['src/pages', 'src/_includes'];
const baselinePath = path.resolve('scripts/design-guardrails-baseline.json');
const write = process.argv.includes('--write-baseline');
const totals = { inlineStyles: 0, literalColors: 0, styleBlocks: 0 };

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /\.(njk|html|md)$/.test(entry.name)) inspect(full);
  }
}

function inspect(file) {
  const text = fs.readFileSync(file, 'utf8');
  totals.inlineStyles += (text.match(/\bstyle\s*=\s*["']/g) || []).length;
  totals.literalColors += (text.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) || []).length;
  totals.styleBlocks += (text.match(/<style\b/gi) || []).length;
}

for (const root of roots) walk(root);
if (write || !fs.existsSync(baselinePath)) {
  fs.writeFileSync(baselinePath, `${JSON.stringify({ version: 1, maxima: totals }, null, 2)}\n`);
  console.log(`Wrote design guardrail baseline: ${JSON.stringify(totals)}`);
} else {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')).maxima;
  const failures = Object.entries(totals)
    .filter(([key, value]) => value > baseline[key])
    .map(([key, value]) => `${key}: ${value} exceeds baseline ${baseline[key]}`);
  const css = fs.readFileSync('src/assets/css/base.css', 'utf8');
  if (!css.includes('prefers-reduced-motion'))
    failures.push('base.css: missing reduced-motion contract');
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else console.log(`Design guardrails passed: ${JSON.stringify(totals)}`);
}
