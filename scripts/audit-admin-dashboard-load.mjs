#!/usr/bin/env node
/**
 * Audit admin dashboard data aggregation against live Supabase.
 * Usage: node scripts/audit-admin-dashboard-load.mjs
 */
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);

// Load env from .env.local if present
try {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
} catch {
  /* ignore */
}

async function main() {
  const { getAdminDashboardData } = await import('../lib/admin/get-admin-dashboard-data.ts');
  const t0 = performance.now();
  try {
    const data = await getAdminDashboardData();
    const ms = Math.round(performance.now() - t0);
    console.log(JSON.stringify({
      ok: true,
      ms,
      kpis: data.kpis?.length ?? 0,
      degradedSections: data.degradedSections ?? [],
      pendingApplications: data.counts?.pendingApplications,
      activeEnrollments: data.counts?.activeEnrollments,
      systemHealthDegraded: data.systemHealth?.degraded,
    }, null, 2));
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    console.error(JSON.stringify({ ok: false, ms, error: String(err?.message ?? err) }, null, 2));
    process.exit(1);
  }
}

main();
