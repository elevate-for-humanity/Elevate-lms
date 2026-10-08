/**
 * POST /api/admin/env-vars/deploy — Google-only Admin/Marketing dispatch.
 * Dispatch is not proof of a live deployment. LMS has no safe self-building
 * Google workflow here yet and is explicitly blocked, never sent to Northflank.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { dispatchGoogleDeployment } from '@/lib/gcp/dispatch-production-workflow';

export async function POST(req: NextRequest) {
  const limit = await applyRateLimit(req, 'strict');
  if (limit) return limit;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const service = body.service ?? 'admin';
  if (service !== 'admin' && service !== 'marketing') {
    return NextResponse.json({
      error: 'No verified self-building Google Cloud Run deployment workflow for this service; Northflank dispatch is permanently disabled.',
      provider: 'google-cloud-run',
    }, { status: 409 });
  }
  try {
    const deployment = await dispatchGoogleDeployment(service);
    return NextResponse.json({ triggered: true, verifiedLive: false, deployment }, { status: 202 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Google dispatch failed',
      triggered: false,
    }, { status: 502 });
  }
}
