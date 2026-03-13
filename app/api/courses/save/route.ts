export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Auth: require admin or instructor
    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await db.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, metadata, slug, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    const updateData: any = {};
    if (metadata) updateData.metadata = metadata;
    if (slug) updateData.slug = slug;
    if (title) updateData.title = title;

    const { data, error }: any = await db
      .from('training_courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Supabase error:', error);
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, course: data });
  } catch (error) { 
    logger.error(
      'Save course error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Failed to save course', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/courses/save', _POST);
