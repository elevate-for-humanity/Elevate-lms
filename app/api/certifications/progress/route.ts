import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import programCurriculum from '@/lms-content/curricula/program-curriculum-map.json';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { searchParams } = new URL(request.url);
  const programId = searchParams.get('programId');
  const userId = searchParams.get('userId');

  if (!programId || !userId) {
    return NextResponse.json({ error: 'Missing programId or userId' }, { status: 400 });
  }

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Get program curriculum from JSON
  const programData = programCurriculum.programs.find(p => p.id === programId);
  
  if (!programData) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  // Get user's certification submissions
  const { data: submissions } = await db
    .from('certification_submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId);

  // Map certifications with status
  const certifications = programData.certifications.map(cert => {
    const submission = submissions?.find(s => s.certification_name === cert.name);
    
    let status: 'not_started' | 'in_progress' | 'pending_review' | 'completed' = 'not_started';
    
    if (submission) {
      if (submission.status === 'approved') {
        status = 'completed';
      } else if (submission.status === 'pending_review') {
        status = 'pending_review';
      } else if (submission.status === 'rejected') {
        status = 'not_started'; // Allow resubmission
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
}
