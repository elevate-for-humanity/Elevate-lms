#!/usr/bin/env node
/**
 * Documentation-to-code reconciliation audit.
 *
 * Produces an evidence-based Markdown report comparing repository documentation
 * references against implemented App Router API/page routes, GitHub workflows,
 * and source-code incompletion markers. It is intentionally conservative: it
 * reports findings for human follow-up instead of claiming every business claim
 * in prose is automatically validated.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outPath = process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length)
  || 'docs/audits/documentation-code-reconciliation-2026-06-10.md';
const strictMode = process.argv.includes('--strict');

function rgFiles(args) {
  return execFileSync('rg', ['--files', ...args], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function findAppFiles(kind) {
  const names = new Set(kind === 'route'
    ? ['route.ts', 'route.tsx', 'route.js', 'route.jsx']
    : ['page.ts', 'page.tsx', 'page.js', 'page.jsx']);
  const results = [];
  const walk = (dir) => {
    const fullDir = path.join(root, dir);
    if (!fs.existsSync(fullDir)) return;
    for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      const rel = path.join(dir, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) walk(rel);
      else if (entry.isFile() && names.has(entry.name)) results.push(rel);
    }
  };
  walk('app');
  walk('apps');
  return results.sort();
}

function routeFromAppFile(file) {
  const parts = file.split('/');
  const appIndex = parts.lastIndexOf('app');
  if (appIndex < 0) return null;
  const afterApp = parts.slice(appIndex + 1);
  const last = afterApp.at(-1);
  if (!last || !/^(page|route)\.(t|j)sx?$/.test(last)) return null;
  const routeParts = afterApp.slice(0, -1)
    .filter((part) => !part.startsWith('(') && !part.endsWith(')'))
    .map((part) => {
      if (part.startsWith('[[...') && part.endsWith(']]')) return '*';
      if (part.startsWith('[...') && part.endsWith(']')) return '*';
      if (part.startsWith('[') && part.endsWith(']')) return '{}';
      return part;
    });
  const route = `/${routeParts.join('/')}`.replace(/\/+/g, '/');
  return route === '/' ? route : route.replace(/\/$/, '');
}

function normalizeDocRoute(route) {
  return route
    .replace(/\/(page|route)\.(t|j)sx?$/g, '')
    .replace(/\[([^\]/]+)$/g, '{}')
    .replace(/[),.;:'"`\]]+$/g, '')
    .replace(/\[(?:\.\.\.)?[^/\]]+\]/g, '{}')
    .replace(/:[A-Za-z0-9_-]+/g, '{}')
    .replace(/\{[A-Za-z0-9_-]+\}/g, '{}')
    .replace(/([A-Za-z0-9_-])\{\}$/g, '$1')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function routeMatches(implemented, documented) {
  if (implemented === documented) return true;
  const a = implemented.split('/').filter(Boolean);
  const b = documented.split('/').filter(Boolean);
  if (a.length !== b.length) return false;
  return a.every((part, i) => part === '{}' || b[i] === '{}' || part === '*' || b[i] === '*' || part === b[i]);
}

const docs = rgFiles([
  '-g', '*.md', '-g', '*.mdx',
  '-g', '!node_modules/**', '-g', '!**/.next/**', '-g', '!**/.git/**',
  '-g', '!docs/audits/documentation-code-reconciliation-*.md',
]);
const sourceFiles = rgFiles([
  '-g', '*.{ts,tsx,js,jsx,mjs,cjs}',
  '-g', '!node_modules/**', '-g', '!**/.next/**', '-g', '!tests/**', '-g', '!docs/**', '-g', '!audit-packet/**',
]);
const apiRouteFiles = findAppFiles('route').filter((file) => file.includes('/api/') || file.startsWith('app/api/'));
const pageFiles = findAppFiles('page');
const workflowFiles = rgFiles(['.github/workflows']).filter((file) => file.startsWith('.github/workflows/') && /\.ya?ml$/.test(file));

const implementedApiRoutes = [...new Set(apiRouteFiles.map(routeFromAppFile).filter(Boolean))].sort();
const implementedPageRoutes = [...new Set(pageFiles.map(routeFromAppFile).filter(Boolean))].sort();
const implementedWorkflows = new Set(workflowFiles.map((file) => path.basename(file)));
const githubYamlFiles = new Set(
  rgFiles(['.github']).filter((file) => file.startsWith('.github/') && /\.ya?ml$/.test(file)).map((file) => path.basename(file)),
);

const docRouteRefs = new Map();
const docWorkflowRefs = new Map();
const routeRegex = /(?<![\w.-])\/(?:api|admin|lms|learner|student|instructor|employer|partner|partners|program-holder|staff-portal|mentor|verify|apply|login|signup|checkout|store|blog|contact|courses|programs)[A-Za-z0-9_./\-[\]{}:*?=&%]*/g;
const workflowRegex = /[A-Za-z0-9_.-]+\.ya?ml/g;

for (const doc of docs) {
  const text = read(doc);
  for (const match of text.matchAll(routeRegex)) {
    const raw = match[0];
    if (raw.includes('://')) continue;
    const normalized = normalizeDocRoute(raw.split('?')[0]);
    const firstSegment = normalized.split('/').filter(Boolean)[0] ?? '';
    if (
      firstSegment.includes('.') ||
      normalized.endsWith('.md') ||
      normalized === '/api' ||
      normalized.includes('/lms-content') ||
      normalized.includes('*') ||
      /\[[^\]]*$/.test(normalized) ||
      /-$/.test(normalized)
    ) continue;
    if (!docRouteRefs.has(normalized)) docRouteRefs.set(normalized, new Set());
    docRouteRefs.get(normalized).add(doc);
  }
  for (const match of text.matchAll(workflowRegex)) {
    const name = match[0];
    if (!name.includes('.yml') && !name.includes('.yaml')) continue;
    if (!docWorkflowRefs.has(name)) docWorkflowRefs.set(name, new Set());
    docWorkflowRefs.get(name).add(doc);
  }
}

const missingApiRefs = [];
const missingPageRefs = [];
for (const [route, files] of docRouteRefs.entries()) {
  if (route.startsWith('/api/')) {
    if (!implementedApiRoutes.some((impl) => routeMatches(impl, route))) {
      missingApiRefs.push({ route, docs: [...files].sort() });
    }
  } else if (!implementedPageRoutes.some((impl) => routeMatches(impl, route))) {
    missingPageRefs.push({ route, docs: [...files].sort() });
  }
}

const missingWorkflowRefs = [...docWorkflowRefs.entries()]
  .filter(([name]) => !['deploy-aws.yml', 'pnpm-lock.yaml'].includes(name))
  .filter(([name]) => !githubYamlFiles.has(name))
  .filter(([name]) => !implementedWorkflows.has(name))
  .map(([name, files]) => ({ name, docs: [...files].sort() }))
  .sort((a, b) => a.name.localeCompare(b.name));

const markerRegex = /\b(TODO|FIXME|stub|placeholder|mock data|mock status|mocked|hardcoded|hard-coded|not implemented|coming soon|TBD|incomplete|deprecated|dead code|fake|dummy)\b/i;
const liveIntegrationMarkerRegex = /\b(mock data|mock status|mocked|fake success|fake data|dummy data|not implemented|coming soon|placeholder (?:response|data|config|implementation|integration|url|key|secret|token))\b/i;
const sourceMarkers = [];
const liveIntegrationBlockers = [];
for (const file of sourceFiles) {
  const lines = read(file).split('\n');
  lines.forEach((line, i) => {
    const text = line.trim().slice(0, 180);
    if (markerRegex.test(line)) sourceMarkers.push({ file, line: i + 1, text });
    const isNegatedLiveMarker = /\b(no|never|without|removed|excluding)\s+(hardcoded\s+)?(fake|mock|placeholder)|strict - no fake|banned-token|token-gate|liveIntegrationMarkerRegex/i.test(text);
    const isScriptMarker = /^scripts\//.test(file);
    const isIntentionalSecurityDecoy = file === 'app/api/trap/route.ts' || /honeypot/i.test(text);
    if (liveIntegrationMarkerRegex.test(line) && !isNegatedLiveMarker && !isScriptMarker && !isIntentionalSecurityDecoy) {
      liveIntegrationBlockers.push({ file, line: i + 1, text });
    }
  });
}

const archivedDocs = docs.filter((file) => file.includes('/root-archive-') || /archive|archived/i.test(file));
const activeDocs = docs.filter((file) => !archivedDocs.includes(file));
const todoDocs = docs.filter((file) => /todo|prd|spec|implementation|architecture|readme|design|plan|runbook|audit/i.test(path.basename(file)) || file.startsWith('docs/'));

function listItems(items, mapper, limit = 200) {
  const shown = items.slice(0, limit).map(mapper).join('\n');
  const rest = items.length > limit ? `\n- ... ${items.length - limit} more omitted from this generated summary.` : '';
  return shown + rest;
}

function docsList(files) {
  return files.map((file) => `- [x] \`${file}\``).join('\n');
}

const report = `# Documentation-to-code reconciliation audit — 2026-06-10

## Scope and honesty note

This audit inventories every Markdown/MDX document in the repository and performs automated reconciliation against implemented App Router routes, API routes, GitHub workflows, and source-code incompletion markers. It does **not** claim that every prose statement in every business proposal, archived audit, grant narrative, or historical TODO is fully implemented; claims that require live Supabase/Northflank/Stripe/GitHub access still require operator validation in those systems.

## Inventory summary

| Surface | Count |
| --- | ---: |
| Markdown/MDX documents reviewed | ${docs.length} |
| Active/non-archived documents | ${activeDocs.length} |
| Archived/historical documents | ${archivedDocs.length} |
| App Router API route files | ${apiRouteFiles.length} |
| App Router page files | ${pageFiles.length} |
| GitHub workflow files | ${workflowFiles.length} |
| Source incompletion/deprecation markers | ${sourceMarkers.length} |
| Live-integration blocker markers | ${liveIntegrationBlockers.length} |
| Documented API route refs without matching route file | ${missingApiRefs.length} |
| Documented page route refs without matching page file | ${missingPageRefs.length} |
| Documented workflow refs without matching workflow file | ${missingWorkflowRefs.length} |

## Completion policy for this audit

Do **not** mark a feature complete from file presence alone. A documented feature is only complete when all of the following evidence exists:

1. The code path exists and is reachable in the running application.
2. The page/API/workflow is wired to live data or a real third-party integration where production credentials/infrastructure exist.
3. Mock data, placeholder responses, fake success states, and hardcoded production fallbacks are removed or explicitly gated to development/test mode.
4. An end-to-end test, smoke test, screenshot, workflow run, or live API result proves the feature works.
5. Any required production secrets, Supabase migrations, Northflank services, webhooks, buckets, or third-party accounts are present and verified.

Anything missing one of those evidence items must remain **not validated** or **blocked**, never **complete**.

## Can this container send code live?

No. Based on the current environment checks, this container cannot be treated as a live deploy runner until outbound HTTPS/DNS to GitHub and Northflank works. Use GitHub Actions or an operator machine with unrestricted egress for production deployment. See \`docs/deploy/container-egress-deploy-blocker.md\`.

## High-priority mismatches found

### Documented API routes with no matching App Router API route

${missingApiRefs.length ? listItems(missingApiRefs, (item) => `- \`${item.route}\` — referenced by ${item.docs.slice(0, 5).map((d) => `\`${d}\``).join(', ')}${item.docs.length > 5 ? ` and ${item.docs.length - 5} more` : ''}`, 80) : '- None found by automated route matching.'}

### Documented page routes with no matching page file

${missingPageRefs.length ? listItems(missingPageRefs, (item) => `- \`${item.route}\` — referenced by ${item.docs.slice(0, 5).map((d) => `\`${d}\``).join(', ')}${item.docs.length > 5 ? ` and ${item.docs.length - 5} more` : ''}`, 120) : '- None found by automated route matching.'}

### Documented workflow files with no matching workflow file

${missingWorkflowRefs.length ? listItems(missingWorkflowRefs, (item) => `- \`${item.name}\` — referenced by ${item.docs.slice(0, 5).map((d) => `\`${d}\``).join(', ')}${item.docs.length > 5 ? ` and ${item.docs.length - 5} more` : ''}`, 80) : '- None found by automated workflow matching.'}

## Live-integration blocker markers

These markers are the highest priority for the user's requirement to replace mock data with live integrations where available. Generic form/image placeholder attributes and legitimate domain terms such as pay stubs are excluded from this focused list; they remain in the broader source marker section when matched. These findings are not automatically defects, but no feature touching one of these lines should be called complete without an explicit test/dev-only justification.

${liveIntegrationBlockers.length ? listItems(liveIntegrationBlockers, (m) => `- \`${m.file}:${m.line}\` — ${m.text.replace(/`/g, '\\`')}`, 160) : '- No live-integration blocker markers found.'}

## Source markers requiring implementation review

These are not all bugs: tests, legitimate mock interviews, and intentional placeholders can appear. The list below focuses on non-test source files and should be burned down in bounded PRs.

${sourceMarkers.length ? listItems(sourceMarkers, (m) => `- \`${m.file}:${m.line}\` — ${m.text.replace(/`/g, '\\`')}`, 160) : '- No source markers found.'}

## Required follow-up implementation batches

1. **Route/documentation cleanup:** for each missing documented route above, either add the route/page, update the documentation to the canonical route, or mark the document archived.
2. **Workflow cleanup:** for each missing workflow reference, either restore the workflow or update/remove stale documentation.
3. **Mock/live integration remediation:** replace production mock data with live DB/API/provider integrations where the provider is available; otherwise mark the feature blocked with the exact missing account, secret, migration, or infrastructure.
4. **Production integration verification:** validate Northflank, GitHub Actions, Stripe, Supabase, AI providers, and Dev Studio from an environment with real secrets and outbound egress.
5. **Evidence capture:** add screenshots, E2E test output, workflow run links, or live API results for every feature claimed as complete.
6. **Source marker burn-down:** remove real stubs/placeholders/hardcoded production fallbacks in small batches with tests.
7. **Archived document labeling:** historical audits and PRDs should be clearly labeled as archived if they no longer describe current production.

## Checklist of every document reviewed

${docsList(docs)}
`;

fs.mkdirSync(path.dirname(path.join(root, outPath)), { recursive: true });
fs.writeFileSync(path.join(root, outPath), report);
console.log(`Wrote ${outPath}`);
console.log(JSON.stringify({
  docs: docs.length,
  apiRoutes: apiRouteFiles.length,
  pageRoutes: pageFiles.length,
  workflows: workflowFiles.length,
  sourceMarkers: sourceMarkers.length,
  liveIntegrationBlockers: liveIntegrationBlockers.length,
  missingApiRefs: missingApiRefs.length,
  missingPageRefs: missingPageRefs.length,
  missingWorkflowRefs: missingWorkflowRefs.length,
}, null, 2));


if (strictMode) {
  const failingCount = missingApiRefs.length + missingPageRefs.length + missingWorkflowRefs.length + liveIntegrationBlockers.length;
  if (failingCount > 0) {
    console.error(`Strict documentation/code reconciliation failed with ${failingCount} unresolved finding(s).`);
    process.exit(1);
  }
}
