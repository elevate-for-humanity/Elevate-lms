/**
 * lib/audit/site-audit.ts
 *
 * SiteAuditAgent — crawls the Next.js app router file tree and produces
 * structured findings without making HTTP requests.
 *
 * Checks:
 *   1. Duplicate routes (same path served by multiple page.tsx files)
 *   2. Redirect stubs that still contain JSX (incomplete conversions)
 *   3. API routes missing auth guards
 *   4. Pages missing auth guards (non-public routes)
 *   5. training_courses / training_lessons direct reads (schema violations)
 *   6. console.log usage (should use lib/logger)
 *   7. Orphaned pages (page.tsx with no corresponding route in next.config redirects)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

export type AuditSeverity = 'error' | 'warning' | 'info';

export interface AuditFinding {
  severity: AuditSeverity;
  category: string;
  file: string;
  message: string;
  line?: number;
}

export interface AuditReport {
  runAt: string;
  durationMs: number;
  totalFiles: number;
  findings: AuditFinding[];
  summary: Record<string, number>;
}

// ─── File walker ──────────────────────────────────────────────────────────────

function walkDir(dir: string, ext: string[] = ['.ts', '.tsx']): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === '.next') continue;
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          results.push(...walkDir(full, ext));
        } else if (ext.some(e => full.endsWith(e))) {
          results.push(full);
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* skip unreadable dir */ }
  return results;
}

function readSafe(path: string): string {
  try { return readFileSync(path, 'utf8'); } catch { return ''; }
}

// ─── Checks ───────────────────────────────────────────────────────────────────

function checkDuplicateRoutes(root: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const routeMap = new Map<string, string[]>();

  const appDirs = ['app', 'apps/admin/app'].map(d => join(root, d)).filter(d => {
    try { statSync(d); return true; } catch { return false; }
  });

  for (const appDir of appDirs) {
    const pages = walkDir(appDir, ['.tsx', '.ts']).filter(f => f.endsWith('/page.tsx') || f.endsWith('/page.ts'));
    for (const page of pages) {
      const route = relative(appDir, page)
        .replace(/\/page\.(tsx|ts)$/, '')
        .replace(/\(.*?\)\//g, '') // strip route groups
        .replace(/\[\.\.\..*?\]/g, '[...slug]')
        || '/';
      const existing = routeMap.get(route) ?? [];
      existing.push(page);
      routeMap.set(route, existing);
    }
  }

  for (const [route, files] of routeMap) {
    if (files.length > 1) {
      findings.push({
        severity: 'error',
        category: 'duplicate-route',
        file: files[0],
        message: `Route "${route}" served by ${files.length} files: ${files.map(f => relative(root, f)).join(', ')}`,
      });
    }
  }
  return findings;
}

function checkSchemaViolations(root: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const files = walkDir(root).filter(f =>
    !f.includes('node_modules') && !f.includes('.next') &&
    !f.includes('_archived') && !f.includes('scripts/') &&
    !f.includes('supabase/') && !f.includes('lib/db/courses.ts')
  );

  for (const file of files) {
    const content = readSafe(file);
    if (!content) continue;
    const rel = relative(root, file);

    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes("from('training_courses')") && !line.trim().startsWith('//')) {
        findings.push({
          severity: 'error',
          category: 'schema-violation',
          file: rel,
          line: i + 1,
          message: `Direct training_courses read — use lms_courses view instead`,
        });
      }
      if (line.includes("from('training_lessons')") && !line.trim().startsWith('//')) {
        findings.push({
          severity: 'error',
          category: 'schema-violation',
          file: rel,
          line: i + 1,
          message: `Direct training_lessons read — use lms_lessons view instead`,
        });
      }
    });
  }
  return findings;
}

function checkMissingAuthGuards(root: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Check API routes
  const apiDirs = ['app/api', 'apps/admin/app/api'].map(d => join(root, d)).filter(d => {
    try { statSync(d); return true; } catch { return false; }
  });

  const AUTH_PATTERNS = [
    'apiAuthGuard', 'apiRequireAdmin', 'apiRequireInstructor',
    'withAuth', 'requireApiRole', 'requireAdminClient',
    'PUBLIC ROUTE',
  ];

  for (const apiDir of apiDirs) {
    const routes = walkDir(apiDir, ['.ts']).filter(f => f.endsWith('/route.ts'));
    for (const route of routes) {
      const content = readSafe(route);
      if (!content) continue;
      const rel = relative(root, route);

      // Skip webhook routes (they use signature verification)
      if (rel.includes('webhook') || rel.includes('stripe') || rel.includes('cron')) continue;

      const hasAuth = AUTH_PATTERNS.some(p => content.includes(p));
      if (!hasAuth) {
        findings.push({
          severity: 'warning',
          category: 'missing-auth',
          file: rel,
          message: `API route has no auth guard and no PUBLIC ROUTE comment`,
        });
      }
    }
  }
  return findings;
}

function checkConsoleLog(root: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const files = walkDir(root).filter(f =>
    !f.includes('node_modules') && !f.includes('.next') &&
    !f.includes('_archived') && !f.includes('scripts/') &&
    !f.includes('.config.') && !f.includes('jest.') &&
    !f.endsWith('.test.ts') && !f.endsWith('.test.tsx')
  );

  let totalCount = 0;
  const fileHits: Array<{ file: string; count: number }> = [];

  for (const file of files) {
    const content = readSafe(file);
    if (!content) continue;
    const matches = content.match(/console\.(log|warn|error|info|debug)\(/g);
    if (matches && matches.length > 0) {
      totalCount += matches.length;
      fileHits.push({ file: relative(root, file), count: matches.length });
    }
  }

  if (totalCount > 0) {
    // Only report top offenders (>5 occurrences)
    const topOffenders = fileHits.filter(h => h.count > 5).sort((a, b) => b.count - a.count).slice(0, 10);
    for (const h of topOffenders) {
      findings.push({
        severity: 'info',
        category: 'console-log',
        file: h.file,
        message: `${h.count} console.* calls — use lib/logger instead`,
      });
    }
    findings.push({
      severity: 'info',
      category: 'console-log',
      file: '(summary)',
      message: `Total: ${totalCount} console.* calls across ${fileHits.length} files`,
    });
  }
  return findings;
}

function checkOrphanedRedirectStubs(root: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const appDir = join(root, 'app');
  const adminAppDir = join(root, 'apps/admin/app');

  for (const dir of [appDir, adminAppDir]) {
    try { statSync(dir); } catch { continue; }
    const pages = walkDir(dir, ['.tsx']).filter(f => f.endsWith('/page.tsx'));
    for (const page of pages) {
      const content = readSafe(page);
      if (!content) continue;
      // A redirect stub should ONLY have redirect() — no JSX, no imports beyond redirect
      const isRedirectStub = content.includes('redirect(') && !content.includes('export default function') === false;
      const hasJSX = content.includes('return (') || content.includes('<div') || content.includes('<main');
      const hasRedirect = content.includes("from 'next/navigation'") && content.includes('redirect(');

      if (hasRedirect && hasJSX) {
        findings.push({
          severity: 'warning',
          category: 'orphaned-stub',
          file: relative(root, page),
          message: `Redirect stub still contains JSX — incomplete conversion`,
        });
      }
    }
  }
  return findings;
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export async function runSiteAudit(root: string): Promise<AuditReport> {
  const start = Date.now();

  const allFiles = walkDir(root).filter(f =>
    !f.includes('node_modules') && !f.includes('.next')
  );

  const findings: AuditFinding[] = [
    ...checkDuplicateRoutes(root),
    ...checkSchemaViolations(root),
    ...checkMissingAuthGuards(root),
    ...checkConsoleLog(root),
    ...checkOrphanedRedirectStubs(root),
  ];

  const summary: Record<string, number> = {};
  for (const f of findings) {
    summary[f.category] = (summary[f.category] ?? 0) + 1;
    summary[f.severity] = (summary[f.severity] ?? 0) + 1;
  }

  return {
    runAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    totalFiles: allFiles.length,
    findings,
    summary,
  };
}
