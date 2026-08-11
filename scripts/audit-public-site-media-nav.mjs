#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { LEGACY_IMAGE_ALIASES } from '../lib/media/legacy-image-aliases.mjs';

const ROOT = process.cwd();
const MARKETING_APP = fs.existsSync(path.join(ROOT, 'apps/marketing/app'))
  ? 'apps/marketing/app'
  : 'app';
const PAGE_NAMES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const LAYOUT_NAMES = ['layout.tsx', 'layout.ts', 'layout.jsx', 'layout.js'];
const SOURCE_EXTS = ['.tsx', '.ts', '.jsx', '.js', '.json'];
const MEDIA_EXT = '(?:png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|mov|m4v|mp3|m4a|wav|ogg|aac)';
const ASSET_RE = new RegExp(
  `["'](\\/(?:images|uploads|media)\\/[^"'\\s)]+\\.${MEDIA_EXT}(?:[?#][^"'\\s)]*)?)["']`,
  'gi',
);
const REUSABLE_MEDIA = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|placeholder)/i;
const HERO_OPTIONAL = [
  /^\/apply(?:\/|$)/,
  /^\/application(?:\/|$)/,
  /^\/eligibility(?:\/|$)/,
  /^\/contact(?:\/|$)/,
  /^\/store(?:\/|$)/,
  /^\/blog(?:\/|$)/,
  /^\/privacy(?:\/|$)/,
  /^\/legal(?:\/|$)/,
  /^\/accessibility(?:\/|$)/,
];

const abs = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(abs(rel), 'utf8');
const lineNumber = (source, index) => source.slice(0, index).split('\n').length;
const isRedirectSource = (source) => /\b(?:redirect|permanentRedirect)\s*\(/.test(source);

function isFile(rel) {
  try {
    return fs.statSync(abs(rel)).isFile();
  } catch {
    return false;
  }
}

function walk(relDir) {
  const dir = abs(relDir);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', 'dist', 'build', '.turbo', 'coverage', '.git'].includes(entry.name)) continue;
    const rel = path.join(relDir, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

const ALL_MARKETING_FILES = walk(MARKETING_APP);
const ALL_PAGE_FILES = ALL_MARKETING_FILES.filter((file) => PAGE_NAMES.has(path.basename(file)));

function pathSegments(href) {
  const clean = href.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  return clean ? clean.split('/') : [];
}

function routeSegmentsForPage(file) {
  const rel = file.slice(MARKETING_APP.length).replace(/^\//, '');
  return rel
    .split('/')
    .slice(0, -1)
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith('@'));
}

function directStaticPage(href) {
  const segments = pathSegments(href);
  const base = segments.length ? `${MARKETING_APP}/${segments.join('/')}` : MARKETING_APP;
  for (const pageName of PAGE_NAMES) {
    const candidate = `${base}/${pageName}`;
    if (isFile(candidate)) return candidate;
  }
  return null;
}

function routePatternMatches(pageSegments, hrefSegments) {
  let i = 0;
  let j = 0;
  while (i < pageSegments.length && j < hrefSegments.length) {
    const segment = pageSegments[i];
    if (/^\[\.\.\..+\]$/.test(segment) || /^\[\[\.\.\..+\]\]$/.test(segment)) return true;
    if (/^\[.+\]$/.test(segment)) {
      i += 1;
      j += 1;
      continue;
    }
    if (segment !== hrefSegments[j]) return false;
    i += 1;
    j += 1;
  }
  if (i < pageSegments.length && /^\[\[\.\.\..+\]\]$/.test(pageSegments[i])) return true;
  return i === pageSegments.length && j === hrefSegments.length;
}

function routePageFile(href) {
  if (!href.startsWith('/')) return null;
  const direct = directStaticPage(href);
  if (direct) return direct;
  const target = pathSegments(href);
  const matches = ALL_PAGE_FILES.filter((file) => routePatternMatches(routeSegmentsForPage(file), target));
  if (!matches.length) return null;
  matches.sort((a, b) => {
    const dynamicA = (routeSegmentsForPage(a).join('/').match(/\[/g) ?? []).length;
    const dynamicB = (routeSegmentsForPage(b).join('/').match(/\[/g) ?? []).length;
    return dynamicA - dynamicB || a.length - b.length;
  });
  return matches[0];
}

function routeExists(href) {
  if (!href.startsWith('/')) return true;
  return Boolean(routePageFile(href));
}

function canonicalAssetPath(assetPath) {
  const cleanPath = assetPath.split(/[?#]/)[0];
  return LEGACY_IMAGE_ALIASES[cleanPath] ?? cleanPath;
}

function publicAssetExists(assetPath) {
  const resolved = canonicalAssetPath(assetPath).replace(/^\//, '');
  return isFile(`public/${resolved}`) || isFile(`apps/marketing/public/${resolved}`);
}

function resolveSourceImport(fromFile, specifier) {
  if (!specifier || (!specifier.startsWith('.') && !specifier.startsWith('@/'))) return null;
  const base = specifier.startsWith('@/')
    ? specifier.slice(2)
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
  const candidates = [];
  if (path.extname(base)) candidates.push(base);
  else {
    for (const ext of SOURCE_EXTS) candidates.push(`${base}${ext}`);
    for (const ext of SOURCE_EXTS) candidates.push(`${base}/index${ext}`);
  }
  return candidates.find((candidate) => isFile(candidate)) ?? null;
}

function directDependencies(file) {
  if (!isFile(file) || !SOURCE_EXTS.includes(path.extname(file))) return [];
  const source = read(file);
  const deps = new Set();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const resolved = resolveSourceImport(file, match[1]);
      if (resolved) deps.add(resolved);
    }
  }
  return [...deps];
}

function dependencyClosure(seeds) {
  const seen = new Set();
  const queue = [...seeds].filter(Boolean);
  while (queue.length) {
    const file = queue.shift();
    if (!file || seen.has(file) || !isFile(file)) continue;
    seen.add(file);
    for (const dep of directDependencies(file)) if (!seen.has(dep)) queue.push(dep);
  }
  return seen;
}

function routeLayoutFiles(pageFile) {
  if (!pageFile) return [];
  const pageDir = path.posix.dirname(pageFile);
  const appRoot = MARKETING_APP.replaceAll('\\', '/');
  const relDir = pageDir.slice(appRoot.length).replace(/^\//, '');
  const segments = relDir ? relDir.split('/') : [];
  const directories = [appRoot];
  let current = appRoot;
  for (const segment of segments) {
    current = `${current}/${segment}`;
    directories.push(current);
  }
  const layouts = [];
  for (const dir of directories) {
    for (const name of LAYOUT_NAMES) {
      const candidate = `${dir}/${name}`;
      if (isFile(candidate)) {
        layouts.push(candidate);
        break;
      }
    }
  }
  return layouts;
}

function parseRouteConstants() {
  const routesFile = 'lib/navigation/routes.ts';
  if (!isFile(routesFile)) return new Map();
  const source = read(routesFile);
  const routes = new Map();
  for (const match of source.matchAll(/^\s*([A-Za-z0-9_]+):\s*'([^']+)'/gm)) routes.set(match[1], match[2]);
  const hostMap = {
    APP_URL: 'https://app.elevateforhumanity.org',
    LMS_HOST: 'https://app.elevateforhumanity.org',
    ADMIN_URL: 'https://admin.elevateforhumanity.org',
    ADMIN_HOST: 'https://admin.elevateforhumanity.org',
    MARKETING_HOST: 'https://www.elevateforhumanity.org',
  };
  for (const match of source.matchAll(/^\s*([A-Za-z0-9_]+):\s*`\$\{([A-Z_]+)\}([^`]*)`/gm)) {
    if (hostMap[match[2]]) routes.set(match[1], `${hostMap[match[2]]}${match[3]}`);
  }
  return routes;
}

function collectNavItems(routeConstants) {
  const navFile = 'lib/navigation.ts';
  if (!isFile(navFile)) return [];
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
    if (href) items.push({ label, href, auth });
  }
  return items;
}

function collectSitemapHrefs(routeConstants) {
  const sitemapFile = `${MARKETING_APP}/sitemap.ts`;
  if (!isFile(sitemapFile)) return new Set();
  const source = read(sitemapFile);
  const hrefs = new Set();
  for (const match of source.matchAll(/ROUTES\.([A-Za-z0-9_]+)/g)) {
    const href = routeConstants.get(match[1]);
    if (href?.startsWith('/')) hrefs.add(href);
  }
  for (const match of source.matchAll(/['"](\/[^'"\s]+)['"]/g)) {
    const href = match[1];
    if (!href.includes('${') && !href.startsWith('/api/') && !/\.(?:png|jpe?g|webp|svg|gif|pdf|json)$/i.test(href)) hrefs.add(href);
  }
  return hrefs;
}

function pageSourceBundle(href) {
  const page = routePageFile(href);
  if (!page) return { page: null, files: new Set(), source: '' };
  const files = dependencyClosure([page, ...routeLayoutFiles(page)]);
  const source = [...files].map((file) => read(file)).join('\n');
  return { page, files, source };
}

function collectCanonicalFiles(sitemapHrefs, publicNavItems) {
  const seeds = [];
  for (const href of new Set([...sitemapHrefs, ...publicNavItems.map((item) => item.href)])) {
    const page = routePageFile(href);
    if (!page) continue;
    seeds.push(page, ...routeLayoutFiles(page));
  }
  return dependencyClosure(seeds);
}

function collectImageRefs(files) {
  const refs = [];
  for (const file of files) {
    if (!isFile(file)) continue;
    const source = read(file);
    for (const match of source.matchAll(ASSET_RE)) {
      refs.push({ file, path: match[1], line: lineNumber(source, match.index ?? 0) });
    }
  }
  return refs;
}

function requiresHero(href) {
  return !HERO_OPTIONAL.some((pattern) => pattern.test(href));
}

function collectVisualFindings(hrefs) {
  const heroMissing = [];
  const noAction = [];
  const textHeavy = [];
  for (const href of hrefs) {
    const { page, source } = pageSourceBundle(href);
    if (!page || isRedirectSource(read(page))) continue;
    const hasHero = /HeroVideo|HomeHeroVideo|HeroPicture|QualityHero|PictureFirstPageHero|ProgramPageLayout|ProgramCategoryPage|MarketingPageHero|PageHero|heroBanners|(?:hero|banner)(?:Image|Media|Src)|<Image\b|<img\b|<video\b|min-h-\[(?:2|3|4|5|6)\d{2}px\]/i.test(source);
    if (!hasHero && requiresHero(href)) heroMissing.push({ href, file: page });
    const hasAction = /<(?:Link|a)\b[^>]*href\s*=|<button\b|<form\b|\bonClick\s*=|(?:primary|secondary)?Cta\b|cta(?:Href|Url)\b/i.test(source);
    if (!hasAction) noAction.push({ href, file: page });
    const textBlocks = (source.match(/<(?:p|li|h[1-6])\b/g) ?? []).length;
    const mediaBlocks = (source.match(/<Image\b|<img\b|<video\b|HeroVideo|HeroPicture|PictureFirstPageHero|ProgramPageLayout|ProgramCategoryPage/g) ?? []).length;
    if (textBlocks >= 30 && mediaBlocks <= 1) textHeavy.push({ href, file: page, textBlocks, mediaBlocks });
  }
  return { heroMissing, noAction, textHeavy };
}

function importsNextImage(source) {
  return /import\s+Image\s+from\s+['"]next\/image['"]/.test(source) || /import\s*\{[^}]*\bImage\b[^}]*\}\s*from\s*['"]next\/image['"]/.test(source);
}

function collectImageComponentFindings(files) {
  const missingAlt = [];
  const badSizing = [];
  const rawImgMissingAlt = [];
  for (const file of files) {
    if (!isFile(file) || !['.tsx', '.jsx'].includes(path.extname(file))) continue;
    const source = read(file);
    if (importsNextImage(source)) {
      for (const match of source.matchAll(/<Image\b[\s\S]*?\/>/g)) {
        const tag = match[0];
        const line = lineNumber(source, match.index ?? 0);
        if (!/\balt\s*=/.test(tag)) missingAlt.push({ file, line, tag: tag.slice(0, 180) });
        const hasFill = /(?:\s|\{)fill(?:\s|=|\})/.test(tag);
        const hasWidthHeight = /\bwidth\s*=/.test(tag) && /\bheight\s*=/.test(tag);
        if (!hasFill && !hasWidthHeight) badSizing.push({ file, line, reason: 'missing width/height or fill' });
        if (hasFill && !/\bsizes\s*=/.test(tag)) badSizing.push({ file, line, reason: 'fill image missing sizes' });
      }
    }
    for (const match of source.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt\s*=/.test(match[0])) rawImgMissingAlt.push({ file, line: lineNumber(source, match.index ?? 0), tag: match[0].slice(0, 180) });
    }
  }
  return { missingAlt, badSizing, rawImgMissingAlt };
}

function collectDuplicateMediaFindings(sitemapHrefs) {
  const withinPage = [];
  const leadUse = new Map();
  for (const href of sitemapHrefs) {
    const page = routePageFile(href);
    if (!page || isRedirectSource(read(page))) continue;
    const source = read(page);
    const images = [...source.matchAll(ASSET_RE)]
      .map((match) => canonicalAssetPath(match[1]))
      .filter((img) => !REUSABLE_MEDIA.test(img));
    const counts = new Map();
    for (const image of images) counts.set(image, (counts.get(image) ?? 0) + 1);
    for (const [image, count] of counts) if (count > 1) withinPage.push({ href, file: page, image, count });
    const lead = images[0];
    if (lead) {
      if (!leadUse.has(lead)) leadUse.set(lead, new Set());
      leadUse.get(lead).add(href);
    }
  }
  const duplicateLead = [];
  for (const [image, hrefs] of leadUse) if (hrefs.size > 1) duplicateLead.push({ image, hrefs: [...hrefs] });
  return { withinPage, duplicateLead };
}

function isStaticAssetHref(href) {
  return /\.(?:pdf|png|jpe?g|webp|svg|gif|zip|docx?|xlsx?|csv)(?:[?#].*)?$/i.test(href);
}

function collectActionFindings(files, routeConstants) {
  const deadActions = [];
  const inertButtons = [];
  for (const file of files) {
    if (!isFile(file) || !['.tsx', '.jsx'].includes(path.extname(file))) continue;
    const source = read(file);
    for (const match of source.matchAll(/<(?:Link|a)\b[^>]*\bhref\s*=\s*(?:["']([^"']+)["']|\{ROUTES\.([A-Za-z0-9_]+)\})/g)) {
      const href = match[2] ? routeConstants.get(match[2]) : match[1];
      if (!href || /^(?:mailto:|tel:|https?:\/\/)/.test(href)) continue;
      if (href === '#' || /^javascript:/i.test(href)) {
        deadActions.push({ file, line: lineNumber(source, match.index ?? 0), href, reason: 'placeholder href' });
      } else if (href.startsWith('/') && !href.startsWith('/api/') && !isStaticAssetHref(href) && !routeExists(href)) {
        deadActions.push({ file, line: lineNumber(source, match.index ?? 0), href, reason: 'marketing destination route missing' });
      } else if (isStaticAssetHref(href) && !publicAssetExists(href)) {
        deadActions.push({ file, line: lineNumber(source, match.index ?? 0), href, reason: 'linked public asset missing' });
      }
    }
    if (!/<form\b/.test(source)) {
      for (const match of source.matchAll(/<button\b([^>]*)>/g)) {
        const attrs = match[1];
        if (/\bdisabled\b/.test(attrs)) continue;
        if (!/\bonClick\s*=/.test(attrs) && !/\btype\s*=\s*["']submit["']/.test(attrs) && !/\basChild\b/.test(attrs)) {
          inertButtons.push({ file, line: lineNumber(source, match.index ?? 0), tag: match[0].slice(0, 180) });
        }
      }
    }
  }
  return { deadActions, inertButtons };
}

function baseTailwindClasses(classString) {
  return classString.split(/\s+/).filter(Boolean).filter((token) => !token.includes(':')).join(' ');
}

function collectContrastRisks(files) {
  const findings = [];
  const classPattern = /className=["'`]([^"'`]+)["'`]/g;
  const lightBg = /\bbg-(?:white|slate-50|slate-100|gray-50|gray-100)\b/;
  const weakOnLight = /\btext-(?:slate|gray|zinc|neutral|stone)-(?:300|400)\b/;
  const darkBg = /\bbg-(?:black|slate-800|slate-900|slate-950|gray-900|gray-950|brand-blue-700|brand-blue-800|brand-blue-900)\b/;
  const weakOnDark = /\btext-(?:black|slate|gray|zinc|neutral|stone)-(?:600|700|800|900|950)\b/;
  for (const file of files) {
    if (!isFile(file) || !['.tsx', '.jsx'].includes(path.extname(file))) continue;
    const source = read(file);
    for (const match of source.matchAll(classPattern)) {
      const classes = baseTailwindClasses(match[1]);
      if ((lightBg.test(classes) && weakOnLight.test(classes)) || (darkBg.test(classes) && weakOnDark.test(classes))) {
        findings.push({ file, line: lineNumber(source, match.index ?? 0), classes });
      }
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
const publicNavItems = navItems.filter((item) => !item.auth && item.href.startsWith('/'));
const sitemapHrefs = collectSitemapHrefs(routeConstants);
const canonicalFiles = collectCanonicalFiles(sitemapHrefs, publicNavItems);
const imageRefs = collectImageRefs(canonicalFiles);
const missingImages = imageRefs.filter((ref) => !publicAssetExists(ref.path));
const missingRoutes = publicNavItems.filter((item) => !routeExists(item.href));
const sitemapMissing = publicNavItems.filter((item) => !sitemapHrefs.has(item.href));
const sitemapBroken = [...sitemapHrefs].filter((href) => !routeExists(href));
const { heroMissing, noAction, textHeavy } = collectVisualFindings(sitemapHrefs);
const { missingAlt, badSizing, rawImgMissingAlt } = collectImageComponentFindings(canonicalFiles);
const { withinPage, duplicateLead } = collectDuplicateMediaFindings(sitemapHrefs);
const { deadActions, inertButtons } = collectActionFindings(canonicalFiles, routeConstants);
const contrastRisks = collectContrastRisks(canonicalFiles);

console.log('# Public Site Canonical Navigation + Visual Acceptance Audit');
console.log();
console.log(`- Canonical production files inspected: ${canonicalFiles.size}`);
console.log(`- Canonical image references checked: ${imageRefs.length}`);
console.log(`- Missing canonical image files: ${missingImages.length}`);
console.log(`- Public header destinations checked: ${publicNavItems.length}`);
console.log(`- Sitemap routes checked: ${sitemapHrefs.size}`);
console.log(`- Missing public header routes: ${missingRoutes.length}`);
console.log(`- Header destinations missing from sitemap: ${sitemapMissing.length}`);
console.log(`- Sitemap entries without a public page: ${sitemapBroken.length}`);
console.log(`- Required canonical heroes/lead media missing: ${heroMissing.length}`);
console.log(`- Canonical pages without an actionable CTA/form/button: ${noAction.length}`);
console.log(`- Broken/placeholder canonical actions: ${deadActions.length}`);
console.log(`- Potentially inert canonical buttons: ${inertButtons.length}`);
console.log(`- Next/Image missing alt: ${missingAlt.length}`);
console.log(`- Next/Image sizing problems: ${badSizing.length}`);
console.log(`- Raw img missing alt: ${rawImgMissingAlt.length}`);
console.log(`- Duplicate non-brand media literals within one canonical page: ${withinPage.length}`);
console.log(`- Duplicate lead/hero media literals across canonical pages: ${duplicateLead.length}`);
console.log(`- Deterministic same-element contrast risks: ${contrastRisks.length}`);
console.log(`- Text-heavy/low-media warnings: ${textHeavy.length}`);
console.log();

printSection('Missing Canonical Images', missingImages, (item) => `${item.path} referenced in ${item.file}:${item.line}`);
printSection('Broken Public Navigation', missingRoutes, (item) => `${item.label}: ${item.href}`);
printSection('Public Navigation Missing From Sitemap', sitemapMissing, (item) => `${item.label}: ${item.href}`);
printSection('Broken Sitemap Entries', sitemapBroken.map((href) => ({ href })), (item) => item.href);
printSection('Required Canonical Pages Without Hero / Lead Media', heroMissing, (item) => `${item.href} (${item.file})`);
printSection('Canonical Pages Without CTA / Action', noAction, (item) => `${item.href} (${item.file})`);
printSection('Broken or Placeholder Canonical Actions', deadActions, (item) => `${item.file}:${item.line} ${item.href} — ${item.reason}`);
printSection('Potentially Inert Canonical Buttons', inertButtons, (item) => `${item.file}:${item.line} — ${item.tag}`);
printSection('Next/Image Missing Alt', missingAlt, (item) => `${item.file}:${item.line} — ${item.tag}`);
printSection('Next/Image Sizing Problems', badSizing, (item) => `${item.file}:${item.line} — ${item.reason}`);
printSection('Raw img Missing Alt', rawImgMissingAlt, (item) => `${item.file}:${item.line} — ${item.tag}`);
printSection('Duplicate Media Within Canonical Page', withinPage, (item) => `${item.href}: ${item.image} used ${item.count} times (${item.file})`);
printSection('Duplicate Lead/Hero Media Across Canonical Pages', duplicateLead, (item) => `${item.image} — ${item.hrefs.join(', ')}`);
printSection('Contrast Risks', contrastRisks, (item) => `${item.file}:${item.line} — ${item.classes}`);
printSection('Text-Heavy Canonical Pages With Limited Media', textHeavy, (item) => `${item.href} (${item.textBlocks} text blocks / ${item.mediaBlocks} media blocks) — ${item.file}`);

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
  ...contrastRisks,
];

if (blockers.length) {
  console.error(`FAIL: public-site acceptance gate found ${blockers.length} deterministic canonical issue(s).`);
  process.exitCode = 1;
} else {
  console.log('PASS: canonical routes, heroes/media, image accessibility/sizing, CTA integrity, duplication, and deterministic contrast checks passed.');
}

if (sitemapMissing.length || inertButtons.length || textHeavy.length) {
  console.log('Review warnings above; they are reported separately from deterministic blocking failures.');
}
