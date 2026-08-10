#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MARKETING_APP = fs.existsSync(path.join(ROOT, 'apps/marketing/app'))
  ? 'apps/marketing/app'
  : 'app';

const PAGE_EXTENSIONS = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);
const REUSABLE_MEDIA = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|placeholder)/i;
const HERO_OPTIONAL = [
  /^\/apply(?:\/|$)/,
  /^\/application(?:\/|$)/,
  /^\/eligibility(?:\/|$)/,
  /^\/contact(?:\/|$)/,
  /^\/jobs(?:\/|$)/,
  /^\/store(?:\/|$)/,
  /^\/products(?:\/|$)/,
  /^\/blog(?:\/|$)/,
];

const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walk(relDir, exts = SOURCE_EXTENSIONS) {
  const absDir = path.join(ROOT, relDir);
  if (!fs.existsSync(absDir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (['node_modules', '.next', 'dist', 'build', '.turbo', 'coverage'].includes(entry.name)) continue;
    const rel = path.join(relDir, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) out.push(...walk(rel, exts));
    else if (exts.has(path.extname(entry.name))) out.push(rel);
  }
  return out;
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function publicAssetExists(assetPath) {
  const clean = assetPath.replace(/^\//, '').split(/[?#]/)[0];
  return exists(`public/${clean}`) || exists(`apps/marketing/public/${clean}`);
}

function collectImageRefs() {
  const roots = [MARKETING_APP, 'components', 'content', 'data', 'lib'];
  const files = [...new Set(roots.flatMap((root) => walk(root)))];
  const refs = [];
  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(/['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g)) {
      refs.push({ file, path: match[1], line: lineNumber(source, match.index ?? 0) });
    }
  }
  return refs;
}

function parseRouteConstants() {
  const source = read('lib/navigation/routes.ts');
  const routes = new Map();
  for (const match of source.matchAll(/^\s*([A-Za-z0-9_]+):\s*'([^']+)'/gm)) {
    routes.set(match[1], match[2]);
  }
  for (const match of source.matchAll(/^\s*([A-Za-z0-9_]+):\s*`\$\{(APP_URL|ADMIN_URL)\}([^`]*)`/gm)) {
    routes.set(match[1], `https://${match[2] === 'APP_URL' ? 'app' : 'admin'}.elevateforhumanity.org${match[3]}`);
  }
  return routes;
}

function collectNavItems(routeConstants) {
  const navFile = 'lib/navigation.ts';
  if (!exists(navFile)) return [];
  const source = read(navFile);
  const items = [];
  const itemPattern = /\{\s*name:\s*'([^']+)'\s*,([^{}]*?)\}/g;
  for (const match of source.matchAll(itemPattern)) {
    const label = match[1];
    const body = match[2];
    const auth = /\bisAuth:\s*true\b/.test(body);
    const routeKey = body.match(/href:\s*ROUTES\.([A-Za-z0-9_]+)/)?.[1];
    const literalHref = body.match(/href:\s*'([^']+)'/)?.[1];
    const href = routeKey ? routeConstants.get(routeKey) : literalHref;
    if (href) items.push({ label, href, routeKey: routeKey ?? null, auth });
  }
  return items;
}

function routePageFile(href) {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (!clean.startsWith('/')) return null;
  const base = clean === '/' ? MARKETING_APP : `${MARKETING_APP}${clean}`;
  for (const name of PAGE_EXTENSIONS) {
    const candidate = `${base}/${name}`;
    if (exists(candidate)) return candidate;
  }
  return null;
}

function routeExists(href) {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (!clean.startsWith('/')) return true;
  if (routePageFile(clean)) return true;

  const parts = clean.split('/').filter(Boolean);
  function descend(relDir, index) {
    if (index === parts.length) return PAGE_EXTENSIONS.some((name) => exists(`${relDir}/${name}`));
    const absDir = path.join(ROOT, relDir);
    if (!fs.existsSync(absDir)) return false;
    const dirs = fs.readdirSync(absDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    if (dirs.includes(parts[index]) && descend(`${relDir}/${parts[index]}`, index + 1)) return true;
    return dirs.some((entry) => /^\[.*\]$/.test(entry) && descend(`${relDir}/${entry}`, index + 1));
  }

  return descend(MARKETING_APP, 0);
}

function collectSitemapHrefs(routeConstants) {
  const sitemapFile = `${MARKETING_APP}/sitemap.ts`;
  if (!exists(sitemapFile)) return new Set();
  const source = read(sitemapFile);
  const hrefs = new Set();
  for (const match of source.matchAll(/ROUTES\.([A-Za-z0-9_]+)/g)) {
    const href = routeConstants.get(match[1]);
    if (href?.startsWith('/')) hrefs.add(href);
  }
  for (const match of source.matchAll(/['"](\/[^'"\s]+)['"]/g)) {
    if (!match[1].includes('${') && !match[1].startsWith('/api/')) hrefs.add(match[1]);
  }
  return hrefs;
}

function requiresHero(href) {
  return !HERO_OPTIONAL.some((pattern) => pattern.test(href));
}

function collectVisualFindings(items) {
  const heroMissing = [];
  const textHeavy = [];
  const noAction = [];
  const checked = new Set();

  for (const item of items) {
    if (item.auth || !item.href.startsWith('/')) continue;
    const file = routePageFile(item.href);
    if (!file || checked.has(file)) continue;
    checked.add(file);
    const source = read(file);
    if (/\bredirect\s*\(/.test(source)) continue;

    const firstChunk = source.slice(0, 12000);
    const hasHero = /HeroVideo|HomeHeroVideo|HeroPicture|QualityHero|PictureFirstPageHero|ProgramPageLayout|ProgramCategoryPage|MarketingPageHero|PageHero|heroBanners|(?:hero|banner)(?:Image|Media|Src)|<section[^>]+(?:h-\[|min-h-\[|hero)/is.test(firstChunk)
      || /<Image\b|<img\b|<video\b/.test(firstChunk);
    if (!hasHero && requiresHero(item.href)) heroMissing.push({ label: item.label, href: item.href, file });

    const textBlocks = (source.match(/<(?:p|li|h[1-6])\b/g) ?? []).length;
    const mediaBlocks = (source.match(/<Image\b|<img\b|<video\b|HeroVideo|HeroPicture|PictureFirstPageHero|ProgramPageLayout|ProgramCategoryPage/g) ?? []).length;
    if (textBlocks >= 18 && mediaBlocks <= 1) {
      textHeavy.push({ label: item.label, href: item.href, file, textBlocks, mediaBlocks });
    }

    const hasAction = /<(?:Link|a)\b[^>]*href\s*=|<button\b|<form\b|(?:primary|secondary)?Cta\b|cta(?:Href|Url)\b/i.test(source);
    if (!hasAction) noAction.push({ label: item.label, href: item.href, file });
  }

  return { heroMissing, textHeavy, noAction };
}

function collectImageComponentFindings() {
  const files = [...walk(MARKETING_APP, new Set(['.tsx', '.jsx'])), ...walk('components', new Set(['.tsx', '.jsx']))];
  const missingAlt = [];
  const badSizing = [];
  const rawImgMissingAlt = [];

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(/<Image\b[\s\S]*?\/>/g)) {
      const tag = match[0];
      const line = lineNumber(source, match.index ?? 0);
      if (!/\balt\s*=/.test(tag)) missingAlt.push({ file, line, tag: tag.slice(0, 180) });
      const hasFill = /(?:\s|\{)fill(?:\s|=|\})/.test(tag);
      const hasWidthHeight = /\bwidth\s*=/.test(tag) && /\bheight\s*=/.test(tag);
      if (!hasFill && !hasWidthHeight) badSizing.push({ file, line, reason: 'missing width/height or fill' });
      if (hasFill && !/\bsizes\s*=/.test(tag)) badSizing.push({ file, line, reason: 'fill image missing sizes' });
    }
    for (const match of source.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt\s*=/.test(match[0])) {
        rawImgMissingAlt.push({ file, line: lineNumber(source, match.index ?? 0), tag: match[0].slice(0, 180) });
      }
    }
  }
  return { missingAlt, badSizing, rawImgMissingAlt };
}

function collectDuplicateMediaFindings(sitemapHrefs) {
  const pageUse = new Map();
  const withinPage = [];
  const leadUse = new Map();

  for (const href of sitemapHrefs) {
    const file = routePageFile(href);
    if (!file) continue;
    const source = read(file);
    if (/\bredirect\s*\(/.test(source)) continue;
    const all = [...source.matchAll(/['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g)].map((match) => match[1]);
    const localCounts = new Map();
    for (const image of all) {
      if (REUSABLE_MEDIA.test(image)) continue;
      localCounts.set(image, (localCounts.get(image) ?? 0) + 1);
      if (!pageUse.has(image)) pageUse.set(image, new Set());
      pageUse.get(image).add(href);
    }
    for (const [image, count] of localCounts) {
      if (count > 1) withinPage.push({ href, file, image, count });
    }

    const lead = source.slice(0, 12000).match(/['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/)?.[1];
    if (lead && !REUSABLE_MEDIA.test(lead)) {
      if (!leadUse.has(lead)) leadUse.set(lead, new Set());
      leadUse.get(lead).add(href);
    }
  }

  const duplicateLead = [];
  for (const [image, hrefs] of leadUse) {
    if (hrefs.size > 1) duplicateLead.push({ image, hrefs: [...hrefs] });
  }
  const excessiveReuse = [];
  for (const [image, hrefs] of pageUse) {
    if (hrefs.size >= 3) excessiveReuse.push({ image, hrefs: [...hrefs] });
  }
  return { withinPage, duplicateLead, excessiveReuse };
}

function collectActionFindings(routeConstants) {
  const files = walk(MARKETING_APP, new Set(['.tsx', '.jsx']));
  const deadActions = [];
  const inertButtons = [];

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(/<(?:Link|a)\b[^>]*\bhref\s*=\s*(?:["']([^"']+)["']|\{ROUTES\.([A-Za-z0-9_]+)\})/g)) {
      const literal = match[1];
      const routeKey = match[2];
      const href = routeKey ? routeConstants.get(routeKey) : literal;
      if (!href) continue;
      if (/^(?:mailto:|tel:|https?:\/\/)/.test(href)) continue;
      if (href === '#' || /^javascript:/i.test(href)) {
        deadActions.push({ file, line: lineNumber(source, match.index ?? 0), href, reason: 'placeholder href' });
      } else if (href.startsWith('/') && !href.startsWith('/api/') && !routeExists(href)) {
        deadActions.push({ file, line: lineNumber(source, match.index ?? 0), href, reason: 'destination route missing' });
      }
    }

    if (!/<form\b/.test(source)) {
      for (const match of source.matchAll(/<button\b([^>]*)>/g)) {
        const attrs = match[1];
        if (!/\bonClick\s*=/.test(attrs) && !/\btype\s*=\s*["']submit["']/.test(attrs) && !/\basChild\b/.test(attrs)) {
          inertButtons.push({ file, line: lineNumber(source, match.index ?? 0), tag: match[0].slice(0, 180) });
        }
      }
    }
  }
  return { deadActions, inertButtons };
}

function collectContrastRisks() {
  const files = [...walk(MARKETING_APP, new Set(['.tsx', '.jsx'])), ...walk('components', new Set(['.tsx', '.jsx']))];
  const findings = [];
  const classPattern = /className=["'`]([^"'`]+)["'`]/g;
  const lightBg = /\bbg-(?:white|slate-50|slate-100|gray-50|gray-100)\b/;
  const weakOnLight = /\btext-(?:slate|gray|zinc|neutral|stone)-(?:300|400)\b/;
  const darkBg = /\bbg-(?:black|slate-800|slate-900|slate-950|gray-900|gray-950|brand-blue-700|brand-blue-800|brand-blue-900)\b/;
  const weakOnDark = /\btext-(?:black|slate|gray|zinc|neutral|stone)-(?:600|700|800|900|950)\b/;

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(classPattern)) {
      const classes = match[1];
      if ((lightBg.test(classes) && weakOnLight.test(classes)) || (darkBg.test(classes) && weakOnDark.test(classes))) {
        findings.push({ file, line: lineNumber(source, match.index ?? 0), classes, type: 'same-element' });
      }
    }

    const darkPanelRe = /<(?:section|div)[^>]*className=["'`][^"'`]*(?:bg-slate-(?:800|900|950)|bg-brand-blue-(?:700|800|900)|bg-black)[^"'`]*["'`][^>]*>([\s\S]{0,4500}?)(?:<\/(?:section|div)>)/g;
    for (const panel of source.matchAll(darkPanelRe)) {
      if (!/text-(?:slate|gray)-(?:600|700|800|900)/.test(panel[1])) continue;
      findings.push({ file, line: lineNumber(source, panel.index ?? 0), classes: 'dark panel contains explicit dark descendant text', type: 'panel-context' });
    }
  }
  return findings;
}

function printSection(title, items, formatter) {
  if (!items.length) return;
  console.log(`## ${title}`);
  for (const item of items) console.log(`- ${formatter(item)}`);
  console.log();
}

const routeConstants = parseRouteConstants();
const navItems = collectNavItems(routeConstants);
const imageRefs = collectImageRefs();
const missingImages = imageRefs.filter((ref) => !publicAssetExists(ref.path));
const publicNavItems = navItems.filter((item) => !item.auth && item.href.startsWith('/'));
const missingRoutes = publicNavItems.filter((item) => !routeExists(item.href));
const sitemapHrefs = collectSitemapHrefs(routeConstants);
const sitemapMissing = publicNavItems.filter((item) => !sitemapHrefs.has(item.href));
const sitemapBroken = [...sitemapHrefs].filter((href) => !routeExists(href));
const visualTargets = [
  ...publicNavItems,
  ...[...sitemapHrefs].map((href) => ({ label: 'Sitemap route', href, auth: false })),
];
const { heroMissing, textHeavy, noAction } = collectVisualFindings(visualTargets);
const { missingAlt, badSizing, rawImgMissingAlt } = collectImageComponentFindings();
const { withinPage, duplicateLead, excessiveReuse } = collectDuplicateMediaFindings(sitemapHrefs);
const { deadActions, inertButtons } = collectActionFindings(routeConstants);
const contrastRisks = collectContrastRisks();
const blockingContrast = contrastRisks.filter((item) => item.type === 'same-element');

console.log('# Public Site Canonical Navigation + Visual Acceptance Audit');
console.log();
console.log(`- Marketing app root: ${MARKETING_APP}`);
console.log(`- Image references checked: ${imageRefs.length}`);
console.log(`- Missing image files: ${missingImages.length}`);
console.log(`- Public header destinations checked: ${publicNavItems.length}`);
console.log(`- Sitemap routes checked: ${sitemapHrefs.size}`);
console.log(`- Missing public header routes: ${missingRoutes.length}`);
console.log(`- Header destinations missing from sitemap: ${sitemapMissing.length}`);
console.log(`- Sitemap entries without a public page: ${sitemapBroken.length}`);
console.log(`- Required Marketing heroes/lead media missing: ${heroMissing.length}`);
console.log(`- Public pages without an actionable CTA/form/button: ${noAction.length}`);
console.log(`- Broken/placeholder internal actions: ${deadActions.length}`);
console.log(`- Potentially inert buttons outside forms: ${inertButtons.length}`);
console.log(`- Next/Image missing alt: ${missingAlt.length}`);
console.log(`- Next/Image sizing problems: ${badSizing.length}`);
console.log(`- Raw img missing alt: ${rawImgMissingAlt.length}`);
console.log(`- Duplicate non-brand media within one page: ${withinPage.length}`);
console.log(`- Duplicate lead/hero media across pages: ${duplicateLead.length}`);
console.log(`- Excessively reused non-brand media across 3+ pages: ${excessiveReuse.length}`);
console.log(`- Blocking same-element contrast risks: ${blockingContrast.length}`);
console.log(`- Contextual contrast warnings: ${contrastRisks.length - blockingContrast.length}`);
console.log(`- Text-heavy/low-media warnings: ${textHeavy.length}`);
console.log();

printSection('Missing Images', missingImages, (item) => `${item.path} referenced in ${item.file}:${item.line}`);
printSection('Broken Public Navigation', missingRoutes, (item) => `${item.label}: ${item.href}`);
printSection('Public Navigation Missing From Sitemap', sitemapMissing, (item) => `${item.label}: ${item.href}`);
printSection('Broken Sitemap Entries', sitemapBroken.map((href) => ({ href })), (item) => item.href);
printSection('Required Marketing Pages Without Hero / Lead Media', heroMissing, (item) => `${item.href} (${item.file})`);
printSection('Public Pages Without CTA / Action', noAction, (item) => `${item.href} (${item.file})`);
printSection('Broken or Placeholder Actions', deadActions, (item) => `${item.file}:${item.line} ${item.href} — ${item.reason}`);
printSection('Potentially Inert Buttons', inertButtons, (item) => `${item.file}:${item.line} — ${item.tag}`);
printSection('Next/Image Missing Alt', missingAlt, (item) => `${item.file}:${item.line} — ${item.tag}`);
printSection('Next/Image Sizing Problems', badSizing, (item) => `${item.file}:${item.line} — ${item.reason}`);
printSection('Raw img Missing Alt', rawImgMissingAlt, (item) => `${item.file}:${item.line} — ${item.tag}`);
printSection('Duplicate Media Within a Page', withinPage, (item) => `${item.href}: ${item.image} used ${item.count} times (${item.file})`);
printSection('Duplicate Lead/Hero Media Across Pages', duplicateLead, (item) => `${item.image} — ${item.hrefs.join(', ')}`);
printSection('Excessive Non-Brand Media Reuse', excessiveReuse, (item) => `${item.image} — ${item.hrefs.join(', ')}`);
printSection('Contrast Risks', contrastRisks, (item) => `${item.file}:${item.line} [${item.type}] — ${item.classes}`);
printSection('Text-Heavy Public Pages With Limited Media', textHeavy, (item) => `${item.href} (${item.textBlocks} text blocks / ${item.mediaBlocks} media blocks) — ${item.file}`);

const blockers = [
  ...missingImages,
  ...missingRoutes,
  ...sitemapBroken,
  ...heroMissing,
  ...noAction,
  ...deadActions,
  ...missingAlt,
  ...badSizing,
  ...rawImgMissingAlt,
  ...withinPage,
  ...duplicateLead,
  ...excessiveReuse,
  ...blockingContrast,
];

if (blockers.length) {
  console.error(`FAIL: public-site acceptance gate found ${blockers.length} blocking issue(s).`);
  process.exitCode = 1;
} else {
  console.log('PASS: canonical routes, hero/media, image accessibility/sizing, CTA integrity, duplication, and obvious contrast checks passed.');
}

if (sitemapMissing.length || inertButtons.length || textHeavy.length || contrastRisks.length !== blockingContrast.length) {
  console.log('Review warnings above; they are reported separately from blocking deterministic failures.');
}
