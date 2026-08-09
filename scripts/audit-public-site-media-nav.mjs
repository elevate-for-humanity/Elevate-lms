#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MARKETING_APP = fs.existsSync(path.join(ROOT, 'apps/marketing/app'))
  ? 'apps/marketing/app'
  : 'app';

const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walk(relDir, exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json'])) {
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

function publicAssetExists(assetPath) {
  const clean = assetPath.replace(/^\//, '');
  return exists(`public/${clean}`) || exists(`apps/marketing/public/${clean}`);
}

function collectImageRefs() {
  const roots = [MARKETING_APP, 'components', 'content', 'data', 'lib'];
  const files = [...new Set(roots.flatMap((root) => walk(root)))];
  const refs = [];
  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(/['"](\/images\/[^'"\s)]+)['"]/g)) {
      refs.push({ file, path: match[1] });
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
  const source = read('lib/navigation.ts');
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
  const direct = clean === '/'
    ? `${MARKETING_APP}/page.tsx`
    : `${MARKETING_APP}${clean}/page.tsx`;
  if (exists(direct)) return direct;
  return null;
}

function routeExists(href) {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (!clean.startsWith('/')) return true;
  if (routePageFile(clean)) return true;

  const parts = clean.split('/').filter(Boolean);
  function descend(relDir, index) {
    if (index === parts.length) {
      return ['page.tsx', 'page.ts', 'page.jsx', 'page.js'].some((name) => exists(`${relDir}/${name}`));
    }
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
  const source = read(`${MARKETING_APP}/sitemap.ts`);
  const hrefs = new Set();
  for (const match of source.matchAll(/ROUTES\.([A-Za-z0-9_]+)/g)) {
    const href = routeConstants.get(match[1]);
    if (href?.startsWith('/')) hrefs.add(href);
  }
  for (const match of source.matchAll(/['"](\/[^'"\s]+)['"]/g)) {
    if (!match[1].includes('${')) hrefs.add(match[1]);
  }
  return hrefs;
}

function collectVisualFindings(navItems) {
  const heroMissing = [];
  const textHeavy = [];
  const checked = new Set();

  for (const item of navItems) {
    if (item.auth || !item.href.startsWith('/')) continue;
    const file = routePageFile(item.href);
    if (!file || checked.has(file)) continue;
    checked.add(file);
    const source = read(file);
    if (/\bredirect\s*\(/.test(source)) continue;

    const firstChunk = source.slice(0, 7000);
    const hasHero = /HeroVideo|HomeHeroVideo|HeroPicture|QualityHero|ProgramPageLayout|ProgramCategoryPage|heroBanners|<section[^>]+(?:h-\[|min-h-\[|hero)/is.test(firstChunk)
      || /<Image\b|<img\b|<video\b/.test(firstChunk);
    if (!hasHero) heroMissing.push({ label: item.label, href: item.href, file });

    const textBlocks = (source.match(/<(?:p|li|h[1-6])\b/g) ?? []).length;
    const mediaBlocks = (source.match(/<Image\b|<img\b|<video\b|HeroVideo|HeroPicture/g) ?? []).length;
    if (textBlocks >= 18 && mediaBlocks <= 1) {
      textHeavy.push({ label: item.label, href: item.href, file, textBlocks, mediaBlocks });
    }
  }

  return { heroMissing, textHeavy };
}

function collectContrastRisks() {
  const files = [...walk(MARKETING_APP, new Set(['.tsx', '.jsx'])), ...walk('components', new Set(['.tsx', '.jsx']))];
  const findings = [];
  const classPattern = /className=["'`]([^"'`]+)["'`]/g;
  const lightBg = /\bbg-(?:white|slate-50|slate-100|gray-50|gray-100)\b/;
  const weakOnLight = /\btext-(?:slate|gray|zinc|neutral|stone)-400\b/;
  const darkBg = /\bbg-(?:black|slate-900|slate-950|gray-900|gray-950)\b/;
  const weakOnDark = /\btext-(?:black|slate-700|slate-800|gray-700|gray-800)\b/;

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(classPattern)) {
      const classes = match[1];
      if ((lightBg.test(classes) && weakOnLight.test(classes)) || (darkBg.test(classes) && weakOnDark.test(classes))) {
        const line = source.slice(0, match.index).split('\n').length;
        findings.push({ file, line, classes });
      }
    }
  }
  return findings;
}

const routeConstants = parseRouteConstants();
const navItems = collectNavItems(routeConstants);
const imageRefs = collectImageRefs();
const missingImages = imageRefs.filter((ref) => !publicAssetExists(ref.path));
const publicNavItems = navItems.filter((item) => !item.auth && item.href.startsWith('/'));
const missingRoutes = publicNavItems.filter((item) => !routeExists(item.href));
const sitemapHrefs = collectSitemapHrefs(routeConstants);
const sitemapMissing = publicNavItems.filter((item) => !sitemapHrefs.has(item.href));
const { heroMissing, textHeavy } = collectVisualFindings(publicNavItems);
const contrastRisks = collectContrastRisks();

console.log('# Public Site Canonical Navigation + Visual Audit');
console.log();
console.log(`- Marketing app root: ${MARKETING_APP}`);
console.log(`- Image references checked: ${imageRefs.length}`);
console.log(`- Missing image files: ${missingImages.length}`);
console.log(`- Public header destinations checked: ${publicNavItems.length}`);
console.log(`- Missing public routes: ${missingRoutes.length}`);
console.log(`- Header destinations missing from sitemap: ${sitemapMissing.length}`);
console.log(`- Header-linked pages without detected hero/media treatment: ${heroMissing.length}`);
console.log(`- Header-linked text-heavy pages with little media: ${textHeavy.length}`);
console.log(`- Same-element contrast risks: ${contrastRisks.length}`);
console.log();

if (missingImages.length) {
  console.log('## Missing Images');
  for (const item of missingImages) console.log(`- ${item.path} referenced in ${item.file}`);
  console.log();
}

if (missingRoutes.length) {
  console.log('## Broken Public Navigation');
  for (const item of missingRoutes) console.log(`- ${item.label}: ${item.href}`);
  console.log();
}

if (sitemapMissing.length) {
  console.log('## Public Navigation Missing From Sitemap');
  for (const item of sitemapMissing) console.log(`- ${item.label}: ${item.href}`);
  console.log();
}

if (heroMissing.length) {
  console.log('## Header-Linked Pages Without Detected Hero / Lead Media');
  for (const item of heroMissing) console.log(`- ${item.href} (${item.file})`);
  console.log();
}

if (textHeavy.length) {
  console.log('## Text-Heavy Pages With Limited Media');
  for (const item of textHeavy) {
    console.log(`- ${item.href} (${item.textBlocks} text blocks / ${item.mediaBlocks} media blocks) — ${item.file}`);
  }
  console.log();
}

if (contrastRisks.length) {
  console.log('## Contrast Risks');
  for (const item of contrastRisks) console.log(`- ${item.file}:${item.line} — ${item.classes}`);
  console.log();
}

if (!missingImages.length && !missingRoutes.length && !sitemapMissing.length && !heroMissing.length && !textHeavy.length && !contrastRisks.length) {
  console.log('No public media, navigation, sitemap, hero, text-density, or obvious same-element contrast issues detected.');
}
