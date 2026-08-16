#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

const args = new Set(process.argv.slice(2));
const FIX_MODE = args.has('--fix');
const STRICT_MODE = args.has('--strict');
const JSON_MODE = args.has('--json');
const QUIET = args.has('--quiet');
const IS_MAIN = process.env.GITHUB_REF_NAME === 'main' || process.env.GITHUB_REF === 'refs/heads/main';

const findings = [];
const fixes = [];

function addFinding(severity, code, file, line, message) {
  findings.push({ severity, code, file, line, message });
}

function walk(dir, exts = new Set(['.ts', '.tsx', '.js', '.jsx'])) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage', 'archive'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function isMarketingProgramHero(relPath, content) {
  return /components\/marketing\//.test(relPath) || /\/programs\//.test(relPath) || /hero/i.test(relPath) || /Hero/.test(content);
}

function isCriticalVisual(relPath, block) {
  return /\bpriority\b/.test(block) || /(?:^|\/)Hero[^/]*\.(?:t|j)sx?$|hero[^/]*\.(?:t|j)sx?$/i.test(relPath);
}

function checkRawImg(content, relPath) {
  const rawImgRe = /<img\b[\s\S]*?>/g;
  for (const m of content.matchAll(rawImgRe)) {
    const pre = content.slice(Math.max(0, m.index - 400), m.index);
    const lineText = content.split('\n')[lineNumber(content, m.index) - 1] ?? '';
    if (/^\s*\*/.test(lineText)) continue;
    if (/\/\*[\s\S]*$/.test(pre) && !/\*\//.test(pre.slice(pre.lastIndexOf('/*')))) continue;
    if (/IMAGE-CONTRACT:\s*allow raw img because/i.test(pre)) continue;

    const severity = /hero/i.test(relPath) ? 'STRICT' : 'REPORT';
    addFinding(severity, 'RAW_IMG_UNREVIEWED', relPath, lineNumber(content, m.index), 'Raw <img> found without IMAGE-CONTRACT rationale; use Next Image or document the remote/generated-image exception');
  }
}

function getNextImageComponentNames(content) {
  const names = new Set();
  const defaultImportRe = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]next\/image['"]/g;
  for (const m of content.matchAll(defaultImportRe)) names.add(m[1]);
  return names;
}

function parseImageBlocks(content, componentNames) {
  if (!componentNames.size) return [];
  const blocks = [];
  for (const name of componentNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startRe = new RegExp(`<${escaped}\\b`, 'g');
    for (const m of content.matchAll(startRe)) {
      let i = m.index + m[0].length;
      let inStr = null;
      let depth = 0;
      while (i < content.length) {
        const ch = content[i];
        if (inStr) {
          if (ch === inStr && content[i - 1] !== '\\') inStr = null;
        } else if (ch === '"' || ch === "'") {
          inStr = ch;
        } else if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
        } else if (depth === 0 && ch === '/' && content[i + 1] === '>') {
          blocks.push({ text: content.slice(m.index, i + 2), index: m.index });
          break;
        } else if (depth === 0 && ch === '>' && content[i - 1] !== '=') {
          blocks.push({ text: content.slice(m.index, i + 1), index: m.index });
          break;
        }
        i++;
      }
    }
  }
  blocks.sort((a, b) => a.index - b.index);
  return blocks;
}

function maybeFixSizes(block, relPath) {
  // Do not guess layout width. A previous auto-fix used sizes="100vw" for
  // card/grid images and caused oversized downloads. Missing sizes must be
  // fixed by the owning component with its real responsive geometry.
  if (!FIX_MODE || block.includes('sizes=')) return block;
  fixes.push({ file: relPath, action: 'manual sizes review required; no unsafe 100vw auto-fix applied' });
  return block;
}

function scanFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  let content = fs.readFileSync(absPath, 'utf8');
  const nextImageNames = getNextImageComponentNames(content);

  checkRawImg(content, rel);

  const blocks = parseImageBlocks(content, nextImageNames);
  if (!blocks.length) return;

  for (const b of blocks) {
    let block = b.text;
    const line = lineNumber(content, b.index);
    const criticalVisual = isCriticalVisual(rel, block);

    if (!/\balt=/.test(block)) {
      addFinding('CRITICAL', 'IMAGE_ALT_MISSING', rel, line, 'next/image missing alt text');
    }

    if (!/\bsizes=/.test(block)) {
      addFinding(criticalVisual ? 'STRICT' : 'REPORT', 'IMAGE_SIZES_MISSING', rel, line, 'next/image missing responsive sizes attribute');
      block = maybeFixSizes(block, rel);
    }

    if (!(/\bwidth=/.test(block) && /\bheight=/.test(block)) && !/\bfill\b/.test(block)) {
      addFinding('STRICT', 'IMAGE_DIMENSIONS_MISSING', rel, line, 'next/image requires width/height or fill');
    }

    if (/\bpriority\b/.test(block) && /\bloading\s*=\s*["']lazy["']/.test(block)) {
      addFinding('CRITICAL', 'IMAGE_PRIORITY_LAZY_CONFLICT', rel, line, 'Critical image declares both priority and loading="lazy"');
    }

    if (/\bplaceholder\s*=\s*["']empty["']/.test(block)) {
      addFinding(criticalVisual ? 'STRICT' : 'REPORT', 'IMAGE_EMPTY_PLACEHOLDER', rel, line, criticalVisual
        ? 'Critical/hero image uses placeholder="empty"; provide blurDataURL, poster/fallback, or an intentional painted background'
        : 'placeholder="empty" is not a visual placeholder; omit it for normal lazy images or provide a real skeleton/blur when needed');
    }

    if (isMarketingProgramHero(rel, content)) {
      const hasBlur = /\bplaceholder\s*=\s*["']blur["']/.test(block) && /\bblurDataURL=/.test(block);
      const hasFallback = /\bfallback\b|\bposterImage\b|\bposter=/.test(block);
      const hasPaintedContext = /bg-(?:slate|white|black|brand|gray|neutral)-/.test(content.slice(Math.max(0, b.index - 500), b.index));
      if (criticalVisual && !hasBlur && !hasFallback && !hasPaintedContext) {
        addFinding('STRICT', 'CRITICAL_IMAGE_FALLBACK_MISSING', rel, line, 'Critical marketing/program/hero image needs a real blur, poster/fallback, or painted container background');
      }
    }

    if (/\bsizes\s*=\s*["']100vw["']/.test(block) && !criticalVisual) {
      addFinding('REPORT', 'IMAGE_100VW_REVIEW', rel, line, 'Non-critical image uses sizes="100vw"; verify it is truly full-width and not a card/grid image');
    }
  }
}

function summarize() {
  const counts = { CRITICAL: 0, STRICT: 0, REPORT: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  const topFilesMap = new Map();
  for (const f of findings) topFilesMap.set(f.file, (topFilesMap.get(f.file) || 0) + 1);
  const topFiles = [...topFilesMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([file, count]) => ({ file, count }));
  return { counts, topFiles };
}

function writeReport(report) {
  if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });
  const out = path.join(ARTIFACTS, 'image-contract-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return out;
}

function main() {
  const roots = [path.join(ROOT, 'app'), path.join(ROOT, 'apps'), path.join(ROOT, 'components')];
  const files = [...new Set(roots.flatMap((root) => walk(root)))];
  for (const file of files) scanFile(file);

  const summary = summarize();
  const report = {
    tool: 'image-contract',
    timestamp: new Date().toISOString(),
    fixMode: FIX_MODE,
    strictMode: STRICT_MODE,
    isMainBranch: IS_MAIN,
    scannedFiles: files.length,
    counts: summary.counts,
    topFiles: summary.topFiles,
    fixes,
    findings,
  };
  const out = writeReport(report);

  if (JSON_MODE) {
    console.log(JSON.stringify(report));
  } else if (!QUIET) {
    console.log('\nImage Contract Summary');
    console.log(`Scanned files: ${files.length}`);
    console.log(`CRITICAL: ${summary.counts.CRITICAL}  STRICT: ${summary.counts.STRICT}  REPORT: ${summary.counts.REPORT}`);
    if (fixes.length) console.log(`Auto-fixes/reviews recorded: ${fixes.length}`);
    console.log(`Report: ${path.relative(ROOT, out)}`);
  }

  const shouldBlockStrict = STRICT_MODE || IS_MAIN;
  const shouldFail = summary.counts.CRITICAL > 0 || (shouldBlockStrict && summary.counts.STRICT > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();
