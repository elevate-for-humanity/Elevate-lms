/**
 * Course Gap Scanner API
 * POST /api/course-generator/gap-scan - Scan for missing content
 * POST /api/course-generator/gap-scan/generate-drafts - Create draft jobs from gaps
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { scanAllGaps, createDraftJobsFromGaps, type CourseGap } from '@/lib/ai/course-gap-detection';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = new Set(['admin', 'staff']);

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check action type
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'scan';

    if (action === 'generate-drafts') {
      // Create draft jobs from existing gaps
      const gaps: CourseGap[] = body.gaps || [];
      
      if (gaps.length === 0) {
        return NextResponse.json({ error: 'No gaps provided' }, { status: 400 });
      }

      const jobIds = await createDraftJobsFromGaps(gaps);

      await withApiAudit({
        userId: user.id,
        tenantId: profile.tenant_id,
        action: 'course_gap_drafts_generated',
        resourceType: 'course_generation_jobs',
        details: { gap_count: gaps.length, job_ids: jobIds },
      });

      return NextResponse.json({
        success: true,
        message: `Created ${jobIds.length} draft course generation jobs`,
        job_ids: jobIds,
      });
    }

    // Default: run the scan
    const scanResult = await scanAllGaps();

    await withApiAudit({
      userId: user.id,
      tenantId: profile.tenant_id,
      action: 'course_gap_scan_completed',
      resourceType: 'gap_scan',
      details: {
        total_gaps: scanResult.total_gaps,
        critical: scanResult.critical_gaps,
        high: scanResult.high_gaps,
        medium: scanResult.medium_gaps,
        low: scanResult.low_gaps,
      },
    });

    return NextResponse.json({
      success: true,
      scan_result: scanResult,
    });

  } catch (error) {
    logger.error('Course gap scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Return last scan results from database if available
    const { data: lastScan } = await db
      .from('course_generation_jobs')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      last_scan: lastScan ? {
        scanned_at: lastScan.created_at,
        status: lastScan.status,
      } : null,
      message: 'Use POST to run a new scan',
    });

  } catch (error) {
    logger.error('Error fetching gap scan status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}