#!/usr/bin/env node
/**
 * Active-platform visual audit: heroes, images, sizing and text/layout risks.
 *
 * This audit intentionally targets the three deployed app trees rather than the
 * legacy root app/ tree. Shared components are included because all services can
 * consume them.
 *
 * Usage: node scripts/audit-visual-layout.mjs
 * Writes: docs/audits/VISUAL_LAYOUT_AUDIT.json + VISUAL_LAYOUT_AUDIT.md
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = [
  'apps/marketing/app',
  'apps/lms/app',
  'apps/admin/app',
  'components',
  'content',
];
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__', 'archive', 'legacy']);

/** Current canonical hero size used by HeroPicture/HeroVideo and page design tokens. */
const CANONICAL_MAX_HERO_PX = 520;
const CANONICAL_HERO_CLASS = 'h-[38vh] min-h-[260px] max-h-[520px]';

const OVERSIZED_HERO_PATTERNS = [
  {
    id: 'vh-50-plus',
    re: /h-\[(5[0-9]|[6-9][0-9]|100)vh\]/g,
    severity: 'high',
    message: 'Hero/viewport height ≥50vh',
  },
  {
    id: 'min-h-420-plus',
    re: /min-h-\[(?:4[2-9]\d|[5-9]\d{2,})px\]/g,
    severity: 'high',
    message: 'Large minimum height on hero-like container',
  },
  {
    id: 'max-h-over-canonical',
    re: /max-h-\[(?:5[3-9]\d|[6-9]\d{2}|[1-9]\d{3,})px\]/g,
    severity: 'high',
    message: `Hero max-height exceeds canonical ${CANONICAL_MAX_HERO_PX}px`,
  },
  {
    id: 'clamp-max-over-canonical',
    re: /clamp\([^)]+,\s*[^)]+,\s*(?:5[3-9]\d|[6-9]\d{2}|[1-9]\d{3,})px\s*\)/g,
    severity: 'high',
    message: `Hero clamp max exceeds canonical ${CANONICAL_MAX_HERO_PX}px`,
  },
  {
    id: 'layout-700',
    re: /h-\[700px\]/g,
    severity: 'critical',
    message: 'Fixed 700px hero section',
  },
];

const IMAGE_PERF_PATTERNS = [
  {
    id: 'preload-full-hero',
    re: /preloadFull\b/g,
    severity: 'high',
    message: 'preloadFull downloads the entire hero video on load',
  },
  {
    id: 'fill-no-sizes',
    re: /<Image[^>]*\bfill\b(?![^>]*\bsizes=)/g,
    severity: 'medium',
    message: 'next/image fill without sizes may over-fetch',
  },
];

const LIGHT_SURFACE = '(?:bg-white|bg-(?:slate|gray|zinc|neutral)-(?:50|100))';
const LOW_CONTRAST_NEUTRAL = 'text-(?:slate|gray|zinc|neutral)-(?:200|300|400)';

const LAYOUT_TEXT_PATTERNS = [
  {
    id: 'hero-gradient-overlay',
    re: /(?:hero|Hero)[\s\S]{0,400}bg-gradient-to/g,
    severity: 'high',
    message: 'Gradient overlay near hero media',
  },
  {
    id: 'hero-text-overlay',
    re: /absolute inset-0[\s\S]{0,300}text-(?:white|3xl|4xl|5xl)/g,
    severity: 'high',
    message: 'Possible headline/text overlaid on hero media',
  },
  {
    id: 'invisible-white-on-white',
    re: /bg-white[^"']*["'][^"']*text-white/g,
    severity: 'high',
    message: 'Possible white text on white background',
  },
  {
    id: 'low-contrast-neutral-on-light',
    re: new RegExp(
      `className=["'\x60][^"'\x60]*${LIGHT_SURFACE}[^"'\x60]*${LOW_CONTRAST_NEUTRAL}[^"'\x60]*["'\x60]`,
      'g',
    ),
    severity: 'high',
    message: 'Low-contrast neutral text on a light surface',
  },
  {
    id: 'low-contrast-neutral-on-light-reversed',
    re: new RegExp(
      `className=["'\x60][^"'\x60]*${LOW_CONTRAST_NEUTRAL}[^"'\x60]*${LIGHT_SURFACE}[^"'\x60]*["'\x60]`,
      'g',
    ),
    severity: 'high',
    message: 'Low-contrast neutral text on a light surface',
  },
  {
    id: 'empty-next-image-alt',
    re: /<Image[^>]*alt=["']\s*["']/g,
    severity: 'medium',
    message: 'Empty Next/Image alt text',
  },
];

const CANONICAL_HERO_MARKERS = [
  'HeroPicture',
  'HeroVideo',
  'HomeHeroVideo',
  'PageVideoHero',
  'PictureFirstPageHero',
  'ProgramDetailPage',
  'ProgramPageLayout',
  'heroBanners',
  'hero.imageWrap',
  'heroTokens.imageWrap',
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(tsx|jsx)$/.test(ent.name)) out.push(full);
  }
  return out;
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function serviceFor(relFile) {
  if (relFile.startsWith('apps/marketing/')) return 'marketing';
  if (relFile.startsWith('apps/lms/')) return 'lms';
  if (relFile.startsWith('apps/admin/')) return 'admin';
  return 'shared';
}

function nearbyLooksHeroLike(content, index) {
  const start = Math.max(0, index - 700);
  const end = Math.min(content.length, index + 700);
  return /hero|banner/i.test(content.slice(start, end));
}

function findMatches(content, relFile, patterns, heroOnly = false) {
  const hits = [];
  for (const pat of patterns) {
    pat.re.lastIndex = 0;
    let m;
    while ((m = pat.re.exec(content)) !== null) {
      if (heroOnly && !nearbyLooksHeroLike(content, m.index)) continue;
      hits.push({
        file: relFile,
        service: serviceFor(relFile),
        line: lineNumber(content, m.index),
        match: m[0].slice(0, 100),
        ...pat,
      });
    }
  }
  return hits;
}

function usesCanonicalHero(content) {
  return (
    content.includes(CANONICAL_HERO_CLASS) ||
    CANONICAL_HERO_MARKERS.some((marker) => content.includes(marker))
  );
}

function pageHasHeroIntent(content) {
  return /\bHero\b|\bhero\b|bannerImage|heroImage|posterImage|<video\b/i.test(content);
}

const files = [...new Set(SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d))))];
const oversizedHero = [];
const imagePerf = [];
const layoutText = [];
const marketingPagesNoCanonical = [];

for (const full of files) {
  const rel = path.relative(ROOT, full).replaceAll('\\', '/');
  const content = fs.readFileSync(full, 'utf8');

  oversizedHero.push(...findMatches(content, rel, OVERSIZED_HERO_PATTERNS, true));
  imagePerf.push(...findMatches(content, rel, IMAGE_PERF_PATTERNS));
  layoutText.push(...findMatches(content, rel, LAYOUT_TEXT_PATTERNS));

  if (
    rel.startsWith('apps/marketing/app/') &&
    rel.endsWith('/page.tsx') &&
    !rel.includes('/api/') &&
    pageHasHeroIntent(content) &&
    !usesCanonicalHero(content)
  ) {
    marketingPagesNoCanonical.push(rel);
  }
}

function groupByFile(hits) {
  const map = new Map();
  for (const hit of hits) {
    if (!map.has(hit.file)) map.set(hit.file, []);
    map.get(hit.file).push(hit);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

function countBySeverity(hits) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const hit of hits) counts[hit.severity] = (counts[hit.severity] || 0) + 1;
  return counts;
}

function countFilesByService() {
  const counts = { marketing: 0, lms: 0, admin: 0, shared: 0 };
  for (const full of files) {
    const rel = path.relative(ROOT, full).replaceAll('\\', '/');
    counts[serviceFor(rel)] += 1;
  }
  return counts;
}

const report = {
  generatedAt: new Date().toISOString(),
  scanDirs: SCAN_DIRS,
  scannedFiles: files.length,
  filesByService: countFilesByService(),
  canonicalHero: CANONICAL_HERO_CLASS,
  summary: {
    oversizedHero: countBySeverity(oversizedHero),
    imagePerf: countBySeverity(imagePerf),
    layoutText: countBySeverity(layoutText),
    oversizedHeroTotal: oversizedHero.length,
    imagePerfTotal: imagePerf.length,
    layoutTextTotal: layoutText.length,
    marketingPagesWithHeroButNotCanonical: marketingPagesNoCanonical.length,
  },
  topOversizedHeroFiles: groupByFile(oversizedHero).slice(0, 60),
  topImagePerfFiles: groupByFile(imagePerf).slice(0, 50),
  topLayoutTextFiles: groupByFile(layoutText).slice(0, 60),
  marketingPagesNoCanonical: marketingPagesNoCanonical.slice(0, 300),
  criticalHits: [...oversizedHero, ...imagePerf, ...layoutText].filter(
    (hit) => hit.severity === 'critical',
  ),
};

const outDir = path.join(ROOT, 'docs', 'audits');
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, 'VISUAL_LAYOUT_AUDIT.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

function mdSection(title, groups, limit = 30) {
  let section = `## ${title}\n\n`;
  if (!groups.length) return section + '_None_\n\n';
  for (const [file, hits] of groups.slice(0, limit)) {
    section += `### \`${file}\` (${hits.length})\n`;
    for (const hit of hits.slice(0, 10)) {
      section += `- L${hit.line} **${hit.id}**: ${hit.message} — \`${hit.match}\`\n`;
    }
    if (hits.length > 10) section += `- _+${hits.length - 10} more_\n`;
    section += '\n';
  }
  return section;
}

const serviceRows = Object.entries(report.filesByService)
  .map(([service, count]) => `| ${service} | ${count} |`)
  .join('\n');

const md = `# Visual layout audit — active platform\n\nGenerated: ${report.generatedAt}\n\nThis report scans the deployed monorepo app trees, not the legacy root \`app/\` tree.\n\n## Coverage\n\n| Service | TSX/JSX files scanned |\n|---|---:|\n${serviceRows}\n\n| Category | Critical | High | Medium | Low | Total |\n|----------|----------|------|--------|-----|-------|\n| Oversized heroes | ${report.summary.oversizedHero.critical} | ${report.summary.oversizedHero.high} | ${report.summary.oversizedHero.medium} | ${report.summary.oversizedHero.low} | ${report.summary.oversizedHeroTotal} |\n| Image load cost | ${report.summary.imagePerf.critical} | ${report.summary.imagePerf.high} | ${report.summary.imagePerf.medium} | ${report.summary.imagePerf.low} | ${report.summary.imagePerfTotal} |\n| Layout / text | ${report.summary.layoutText.critical} | ${report.summary.layoutText.high} | ${report.summary.layoutText.medium} | ${report.summary.layoutText.low} | ${report.summary.layoutTextTotal} |\n\n**Canonical Marketing hero:** \`${CANONICAL_HERO_CLASS}\` or a canonical hero renderer.\n\n**Active Marketing pages with hero intent but no canonical hero marker:** ${report.summary.marketingPagesWithHeroButNotCanonical}\n\n## Marketing pages requiring canonicalization\n\n${marketingPagesNoCanonical.map((file) => `- \`${file}\``).join('\n') || '_None_'}\n\n### Critical findings\n\n${report.criticalHits.length ? report.criticalHits.map((hit) => `- \`${hit.file}:${hit.line}\` ${hit.message}`).join('\n') : '_None_'}\n\n${mdSection('Oversized hero / banner patterns', report.topOversizedHeroFiles)}\n${mdSection('Image performance', report.topImagePerfFiles)}\n${mdSection('Layout, text & contrast standard violations', report.topLayoutTextFiles)}\n\n## Re-run\n\n- \`node scripts/audit-visual-layout.mjs\`\n- \`node scripts/audit-image-assets.mjs\`\n- \`pnpm audit:public-media-nav\`\n- \`pnpm audit:hero-banners\`\n`;

const mdPath = path.join(outDir, 'VISUAL_LAYOUT_AUDIT.md');
fs.writeFileSync(mdPath, md);

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
console.log(`Scanned active files: ${report.scannedFiles}`);
console.log(
  `Oversized: ${report.summary.oversizedHeroTotal} | Image perf: ${report.summary.imagePerfTotal} | Layout/text: ${report.summary.layoutTextTotal}`,
);
console.log(`Marketing pages requiring canonicalization: ${marketingPagesNoCanonical.length}`);
console.log(`Critical: ${report.criticalHits.length}`);
