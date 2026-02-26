import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get accreditation data
    const { data: programs } = await db
      .from('programs')
      .select('id, name, credential, accreditation_status, accreditation_body, accreditation_expires');

    const { data: enrollments } = await db
      .from('program_enrollments')
      .select('id, status, program_id, enrolled_at, completed_at');

    const { data: certificates } = await db
      .from('certificates')
      .select('id, program_id, issued_at');

    // Calculate metrics per program
    const programMetrics = programs?.map(program => {
      const programEnrollments = enrollments?.filter(e => e.program_id === program.id) || [];
      const programCertificates = certificates?.filter(c => c.program_id === program.id) || [];
      const completions = programEnrollments.filter(e => e.status === 'completed').length;

      return {
        programId: program.id,
        programName: program.name,
        credential: program.credential,
        accreditationStatus: program.accreditation_status || 'pending',
        accreditationBody: program.accreditation_body,
        accreditationExpires: program.accreditation_expires,
        metrics: {
          totalEnrollments: programEnrollments.length,
          completions,
          completionRate: programEnrollments.length > 0 
            ? `${(completions / programEnrollments.length * 100).toFixed(1)}%` 
            : '0%',
          certificatesIssued: programCertificates.length,
        },
      };
    }) || [];

    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: user.id,
      institution: {
        name: 'Elevate for Humanity Career & Technical Institute',
        legalEntity: '2Exclusive LLC-S',
        type: 'Workforce Training Provider',
        etplStatus: 'Approved',
        doeStatus: 'Registered',
      },
      summary: {
        totalPrograms: programs?.length || 0,
        accreditedPrograms: programs?.filter(p => p.accreditation_status === 'accredited').length || 0,
        pendingAccreditation: programs?.filter(p => p.accreditation_status === 'pending').length || 0,
        totalEnrollments: enrollments?.length || 0,
        totalCompletions: enrollments?.filter(e => e.status === 'completed').length || 0,
        totalCertificates: certificates?.length || 0,
      },
      programs: programMetrics,
    };

    return NextResponse.json(report);
  } catch (error) {
    logger.error('Accreditation report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate accreditation report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { programId, accreditationBody, status, expiresAt, documents } = body;

    // Update program accreditation
    const { error } = await db
      .from('programs')
      .update({
        accreditation_status: status,
        accreditation_body: accreditationBody,
        accreditation_expires: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update accreditation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Accreditation status updated',
      programId,
    });
  } catch (error) {
    logger.error('Accreditation update error:', error);
    return NextResponse.json(
      { error: 'Failed to update accreditation' },
      { status: 500 }
    );
  }
}
