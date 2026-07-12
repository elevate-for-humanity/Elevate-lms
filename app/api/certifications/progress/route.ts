import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import programCurriculum from '@/lms-content/curricula/program-curriculum-map.json';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const userId = user.id;

    if (!programId) {
      return NextResponse.json({ error: 'Missing programId' }, { status: 400 });
    }

    const programData = programCurriculum.programs.find((p) => p.id === programId);

    if (!programData) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const { data: submissions } = await supabase
      .from('certification_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', programId);

    const certifications = programData.certifications.map((cert) => {
      const submission = submissions?.find((s) => s.certification_name === cert.name);

      let status: 'not_started' | 'in_progress' | 'pending_review' | 'completed' = 'not_started';

      if (submission) {
        if (submission.status === 'approved') {
          status = 'completed';
        } else if (submission.status === 'pending_review') {
          status = 'pending_review';
        } else if (submission.status === 'rejected') {
          status = 'not_started';
        }
      }

      return {
        id: `${programId}-${cert.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: cert.name,
        provider: cert.provider,
        delivery: cert.delivery,
        hours: cert.hours,
        status,
        completedAt: submission?.completion_date,
        expiresAt: submission?.expiration_date,
        certificateUrl: submission?.certificate_url,
        credentialNumber: submission?.credential_number,
      };
    });

    return NextResponse.json({
      id: programData.id,
      name: programData.name,
      certifications,
    });
  } catch (error) {
    logger.error('Certifications progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/certifications/progress', _GET);
