

// app/api/cm/learners/[id]/route.ts - Get learner details for case manager
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClients';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logStaffRecordAccess } from '@/lib/audit/ferpa';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    // Get current user
    const user = await getAuthUser();
    if (!user || (user.role as string) !== 'case_manager') {
      return NextResponse.json(
        { error: 'Unauthorized - Case manager access required' },
        { status: 403 }
      );
    }

    const learnerId = id;
    const caseManagerId = user.id;

    // Verify case manager has access to this learner
    const { data: assignment } = await supabaseAdmin
      .from('case_manager_assignments')
      .select('id')
      .eq('case_manager_id', caseManagerId)
      .eq('learner_id', learnerId)
      .eq('status', 'active')
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Access denied - Learner not assigned to you' },
        { status: 403 }
      );
    }

    // Get learner profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, phone')
      .eq('id', learnerId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 });
    }

    // Get enrollments with program details
    const { data: enrollments } = await supabaseAdmin
      .from('program_enrollments')
      .select(
        `
        id,
        status,
        funding_type,
        started_at,
        completed_at,
        programs (title, slug)
      `
      )
      .eq('user_id', learnerId)
      .order('created_at', { ascending: false });

    // Calculate progress for each enrollment
    const enrollmentDetails = [];
    for (const enrollment of enrollments || []) {
      const { data: progress } = await supabaseAdmin
        .from('progress')
        .select('completed')
        .eq('enrollment_id', enrollment.id);

      const totalLessons = progress?.length || 0;
      const completedLessons = progress?.filter((p) => p.completed).length || 0;
      const percentComplete =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      // Check for certificate
      const programs = enrollment.programs as any;
      const { data: certificate } = await supabaseAdmin
        .from('certificates')
        .select('certificate_url')
        .eq('user_id', learnerId)
        .eq('program_id', programs?.id)
        .maybeSingle();

      enrollmentDetails.push({
        id: enrollment.id,
        program_title: programs?.title || 'Unknown Program',
        program_slug: programs?.slug || '',
        status: enrollment.status,
        funding_type: enrollment.funding_type,
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        percent_complete: percentComplete,
        certificate_url: certificate?.certificate_url || null,
      });
    }

    // Get case notes
    const { data: notes } = await supabaseAdmin
      .from('case_manager_notes')
      .select(
        `
        id,
        note_type,
        note,
        created_at,
        case_manager_id
      `
      )
      .eq('learner_id', learnerId)
      .order('created_at', { ascending: false });

    // Get case manager names for notes
    const noteDetails = [];
    for (const note of notes || []) {
      const { data: cmProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', note.case_manager_id)
        .maybeSingle();

      noteDetails.push({
        id: note.id,
        note_type: note.note_type,
        note: note.note,
        created_at: note.created_at,
        case_manager_name: cmProfile
          ? `${cmProfile.first_name} ${cmProfile.last_name}`
          : 'Unknown',
      });
    }

    // FERPA: log case manager accessing student record
    await logStaffRecordAccess(caseManagerId, 'case_manager', learnerId, 'student_record', 'view');

    return NextResponse.json({
      learner: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        enrollments: enrollmentDetails,
        notes: noteDetails,
      },
    });
  } catch (err) {
    logger.error('Get learner error:', err);
    return NextResponse.json(
      { error: 'Failed to load learner' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/cm/learners/[id]', _GET);
