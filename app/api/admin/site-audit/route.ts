/**
 * GET /api/admin/site-audit
 *
 * Runs the SiteAuditAgent and returns structured findings.
 * Admin only. Results are not cached — each request runs a fresh scan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { runSiteAudit } from '@/lib/audit/site-audit';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // process.cwd() is the repo root when running from the main app
  const root = process.cwd();
  const report = await runSiteAudit(root);

  return NextResponse.json(report);
}
