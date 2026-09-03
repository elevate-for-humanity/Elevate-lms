#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { LEGACY_IMAGE_ALIASES } from '../lib/media/legacy-image-aliases.mjs';

const ROOT = process.cwd();

// Active production services. The previous audit only scanned the legacy root
// app tree and therefore missed the deployed monorepo applications.
const SCAN_DIRS = [
  'apps/marketing/app',
  'apps/lms/app',
  'apps/admin/app',
  'components',
  'data',
  'content',
  'lib',
];

const IMAGE_REF_RE =
  /(?:src|posterImage|heroImage|image|imageSrc|desktopImage|mobileImage|thumbnail|thumbnailUrl|ogImage|coverImage)\s*[:=]\s*["'`]([^"'`]+\.(?:png|jpg|jpeg|webp|gif|svg|avif))["'`]/g;
const PEXELS_RE = /\/images\/pexels\//;

const SERVICE_PUBLIC_ROOTS = {
  marketing: ['apps/marketing/public', 'public'],
  lms: ['apps/lms/public', 'public'],
  admin: ['apps/admin/public', 'public'],
  shared: ['public'],
};

// These are the canonical Dockerfiles configured/validated for each deployed
// service. Marketing uses Dockerfile.marketing; LMS/Admin use their Northflank
// service Dockerfiles.
const PACKAGING_CONTRACTS = [
  {
    service: 'marketing',
    dockerfile: 'Dockerfile.marketing',
    requiredSource: '/workspace/public',
    runtimeTarget: 'apps/marketing/public',
  },
  {
    service: 'lms',
    dockerfile: 'Dockerfile.northflank-lms',
    requiredSource: '/app/public',
    runtimeTarget: 'apps/lms/public',
  },
  {
    service: 'admin',
    dockerfile: 'Dockerfile.northflank-admin',
    requiredSource: '/workspace/public',
    runtimeTarget: 'apps/admin/public',
  },
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function serviceFor(relativeFile) {
  if (relativeFile.startsWith('apps/marketing/')) return 'marketing';
  if (relativeFile.startsWith('apps/lms/')) return 'lms';
  if (relativeFile.startsWith('apps/admin/')) return 'admin';
  return 'shared';
}

function candidateRuntimePaths(service, ref) {
  const relativeRef = ref.replace(/^\//, '');
  return (SERVICE_PUBLIC_ROOTS[service] || SERVICE_PUBLIC_ROOTS.shared).map((publicRoot) =>
    path.join(ROOT, publicRoot, relativeRef),
  );
}

function resolveRuntimeAsset(service, ref) {
  const directCandidates = candidateRuntimePaths(service, ref);
  const directExisting = directCandidates.filter((candidate) => fs.existsSync(candidate));
  if (directExisting.length > 0) {
    return {
      exists: true,
      resolution: 'direct',
      resolvedRef: ref,
      existingPaths: directExisting,
      checkedPaths: directCandidates,
    };
  }

  const aliasTarget = LEGACY_IMAGE_ALIASES[ref];
  if (!aliasTarget || aliasTarget === ref) {
    return {
      exists: false,
      resolution: aliasTarget === ref ? 'invalid-self-alias' : 'missing',
      resolvedRef: aliasTarget || ref,
      existingPaths: [],
      checkedPaths: directCandidates,
    };
  }

  const aliasCandidates = candidateRuntimePaths(service, aliasTarget);
  const aliasExisting = aliasCandidates.filter((candidate) => fs.existsSync(candidate));
  return {
    exists: aliasExisting.length > 0,
    resolution: aliasExisting.length > 0 ? 'verified-rewrite' : 'missing-rewrite-target',
    resolvedRef: aliasTarget,
    existingPaths: aliasExisting,
    checkedPaths: [...directCandidates, ...aliasCandidates],
  };
}

function auditPackagingContracts() {
  const failures = [];

  for (const contract of PACKAGING_CONTRACTS) {
    const dockerfilePath = path.join(ROOT, contract.dockerfile);
    if (!fs.existsSync(dockerfilePath)) {
      failures.push({ ...contract, reason: 'Dockerfile missing' });
      continue;
    }

    const source = fs.readFileSync(dockerfilePath, 'utf8');
    const hasRootPublicCopy =
      source.includes(contract.requiredSource) && source.includes(contract.runtimeTarget);

    if (!hasRootPublicCopy) {
      failures.push({
        ...contract,
        reason: 'root public assets are not packaged into the service runtime public directory',
      });
    }
  }

  return failures;
}

const files = [...new Set(SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d))))];
const refs = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(ROOT, file).replaceAll('\\', '/');
  const service = serviceFor(relFile);
  IMAGE_REF_RE.lastIndex = 0;

  let m;
  while ((m = IMAGE_REF_RE.exec(text)) !== null) {
    const ref = m[1];
    if (!ref.startsWith('/images/')) continue;

    const resolved = resolveRuntimeAsset(service, ref);
    refs.push({
      file: relFile,
      service,
      ref,
      exists: resolved.exists,
      resolution: resolved.resolution,
      resolvedRef: resolved.resolvedRef,
      existingPaths: resolved.existingPaths.map((candidate) => path.relative(ROOT, candidate)),
      checkedPaths: resolved.checkedPaths.map((candidate) => path.relative(ROOT, candidate)),
      pexels: PEXELS_RE.test(ref),
    });
  }
}

const unique = new Map();
for (const r of refs) unique.set(`${r.file}::${r.ref}`, r);
const rows = [...unique.values()];
const missing = rows.filter((r) => !r.exists);
const rewritten = rows.filter((r) => r.resolution === 'verified-rewrite');
const pexels = rows.filter((r) => r.pexels);
const packagingFailures = auditPackagingContracts();

const byService = Object.fromEntries(
  ['marketing', 'lms', 'admin', 'shared'].map((service) => {
    const serviceRows = rows.filter((row) => row.service === service);
    return [
      service,
      {
        imageRefs: serviceRows.length,
        missingRefs: serviceRows.filter((row) => !row.exists).length,
        verifiedRewrites: serviceRows.filter((row) => row.resolution === 'verified-rewrite').length,
      },
    ];
  }),
);

const report = {
  scanDirs: SCAN_DIRS,
  scannedFiles: files.length,
  imageRefs: rows.length,
  missingRefs: missing.length,
  verifiedRewrites: rewritten.length,
  pexelsRefs: pexels.length,
  packagingFailures: packagingFailures.length,
  byService,
  missing,
  rewritten,
  pexels,
  packaging: packagingFailures,
};

const outDir = path.join(ROOT, 'docs', 'audits');
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, 'image-assets-audit.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const mdPath = path.join(outDir, 'IMAGE_ASSETS_AUDIT.md');
const serviceSummary = Object.entries(byService)
  .map(
    ([service, counts]) =>
      `- ${service}: ${counts.imageRefs} refs, ${counts.missingRefs} missing, ${counts.verifiedRewrites} verified rewrites`,
  )
  .join('\n');
const md = `# Image Assets Audit — active platform\n\n- Scanned files: ${report.scannedFiles}\n- Image refs (/images/*): ${report.imageRefs}\n- Missing runtime refs: ${report.missingRefs}\n- Verified legacy rewrites: ${report.verifiedRewrites}\n- Legacy pexels refs: ${report.pexelsRefs}\n- Runtime packaging failures: ${report.packagingFailures}\n\n## Service coverage\n${serviceSummary}\n\n## Missing runtime refs\n${missing
  .slice(0, 300)
  .map((r) => `- ${r.ref} in \`${r.file}\` (${r.service}); resolution=${r.resolution}; checked: ${r.checkedPaths.join(', ')}`)
  .join('\n') || 'None'}\n\n## Verified legacy rewrites\n${rewritten
  .slice(0, 300)
  .map((r) => `- ${r.ref} -> ${r.resolvedRef} in \`${r.file}\` (${r.service})`)
  .join('\n') || 'None'}\n\n## Runtime packaging failures\n${packagingFailures
  .map((r) => `- ${r.service}: ${r.reason} in \`${r.dockerfile}\``)
  .join('\n') || 'None'}\n\n## Legacy pexels refs\n${pexels
  .slice(0, 300)
  .map((r) => `- ${r.ref} in \`${r.file}\``)
  .join('\n') || 'None'}\n`;
fs.writeFileSync(mdPath, md);

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
console.log(`Scanned files: ${files.length}`);
console.log(`Missing runtime refs: ${missing.length}`);
console.log(`Verified legacy rewrites: ${rewritten.length}`);
console.log(`Runtime packaging failures: ${packagingFailures.length}`);
console.log(`Pexels refs: ${pexels.length}`);

if (missing.length > 0 || packagingFailures.length > 0) {
  process.exitCode = 1;
}
