import { createAdminClient } from '@/lib/supabase/admin';

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// POST /api/assignments/[id]/submit - Submit assignment
async function _POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { submissionText, submissionUrl, filePath } = body;

    const supabase = await createServerSupabaseClient();

    // Check if submission already exists
    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', id)
      .eq('student_id', user.id)
      .single();

    let submission;
    let error;

    if (existing) {
      // Update existing submission
      const result = await supabase
        .from('assignment_submissions')
        .update({
          submission_text: submissionText,
          submission_url: submissionUrl,
          file_path: filePath,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      submission = result.data;
      error = result.error;
    } else {
      // Create new submission
      const result = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: id,
          student_id: user.id,
          submission_text: submissionText,
          submission_url: submissionUrl,
          file_path: filePath,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      submission = result.data;
      error = result.error;
    }

    if (error) {
      logger.error('Error submitting assignment:', error);
      return NextResponse.json(
        { error: 'Failed to submit assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) { 
    logger.error('Error in POST /api/assignments/[id]/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/assignments/[id]/submit', _POST);
