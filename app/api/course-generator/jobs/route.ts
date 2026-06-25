/**
 * Course Generator Jobs API
 * POST /api/course-generator/jobs - Create a new course generation job
 * GET /api/course-generator/jobs - List all jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

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

    const body = await req.json();
    const {
      title,
      occupation,
      soc_code,
      credential_type,
      target_hours = 40,
      delivery_mode = 'online',
      target_audience,
      settings = {},
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: job, error: jobError } = await db
      .from('course_generation_jobs')
      .insert({
        tenant_id: profile.tenant_id,
        created_by: user.id,
        title,
        occupation,
        soc_code,
        credential_type,
        target_hours,
        delivery_mode,
        target_audience,
        settings,
        status: 'queued',
      })
      .select()
      .single();

    if (jobError) {
      logger.error('Error creating course generation job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    await withApiAudit({
      userId: user.id,
      tenantId: profile.tenant_id,
      action: 'course_generation_job_created',
      resourceType: 'course_generation_job',
      resourceId: job.id,
      details: { title, occupation, soc_code },
    });

    return NextResponse.json({
      success: true,
      job: { id: job.id, title: job.title, status: job.status, created_at: job.created_at },
    });

  } catch (error) {
    logger.error('Course generator job creation error:', error);
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

    const { data: jobs, error: jobsError } = await db
      .from('course_generation_jobs')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (jobsError) {
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({ jobs });

  } catch (error) {
    logger.error('Error fetching course generation jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}