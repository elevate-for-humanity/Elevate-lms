import fs from 'node:fs';
import path from 'node:path';

const ROOTS = [
  'apps/marketing/app',
  'components/marketing',
  'components/hero',
  'components/home',
  'components/site',
  'components/ui',
];

const EXTENSIONS = new Set(['.tsx', '.jsx']);
const GENERIC_ALT = new Set([
  'image',
  'photo',
  'picture',
  'banner',
  'hero',
  'graphic',
  'thumbnail',
  'placeholder',
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function isExplicitlyDecorative(tag) {
  return (
    /aria-hidden\s*=\s*["']true["']/i.test(tag) ||
    /role\s*=\s*["']presentation["']/i.test(tag) ||
    /data-decorative(?:\s*=\s*["'][^"']*["'])?/i.test(tag)
  );
}

const findings = [];
let inspected = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    const imageTag = /<(?:Image|img)\b[\s\S]*?\/>/g;
    let match;
    while ((match = imageTag.exec(text))) {
      inspected += 1;
      const tag = match[0];
      const line = lineNumber(text, match.index);
      const hasAlt = /\balt\s*=/.test(tag);

      if (!hasAlt) {
        findings.push({ file, line, type: 'missing-alt', detail: 'Image has no alt attribute.' });
        continue;
      }

      // Dynamic expressions such as alt={logo.alt}, alt={title}, or alt={getAlt()}
      // are valid contracts. Their value must be verified where the prop/data is defined,
      // not misclassified here as a missing JSX attribute.
      const dynamicAlt = /\balt\s*=\s*\{(?!["'`])/.test(tag);
      if (dynamicAlt) continue;

      const altMatch = tag.match(/\balt\s*=\s*(?:["']([^"']*)["']|\{`([^`]*)`\}|\{["']([^"']*)["']\})/i);
      if (!altMatch) {
        findings.push({
          file,
          line,
          type: 'unsupported-alt',
          detail: 'Alt attribute exists but could not be validated as a supported literal or expression.',
        });
        continue;
      }

      const staticAlt = (altMatch[1] ?? altMatch[2] ?? altMatch[3] ?? '').trim();

      if (staticAlt === '' && !isExplicitlyDecorative(tag)) {
        findings.push({
          file,
          line,
          type: 'empty-alt',
          detail: 'Empty alt is allowed only when the image is explicitly decorative.',
        });
        continue;
      }

      if (GENERIC_ALT.has(staticAlt.toLowerCase())) {
        findings.push({
          file,
          line,
          type: 'generic-alt',
          detail: `Alt text "${staticAlt}" is too generic to describe the image.`,
        });
      }
    }
  }
}

console.log(`Image SEO audit inspected ${inspected} JSX image elements.`);
if (findings.length) {
  console.error(`Image SEO audit found ${findings.length} issue(s):`);
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.type}] ${finding.detail}`);
  }
  process.exit(2);
}

console.log('Image SEO audit passed: meaningful images have descriptive alt contracts.');
