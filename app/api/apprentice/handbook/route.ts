import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/apprentice/handbook
 * Get student's handbook progress and acknowledgments
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programSlug = searchParams.get('program') || 'barber-apprenticeship';

    // Get acknowledged sections
    const { data: acknowledgments } = await supabase
      .from('handbook_acknowledgments')
      .select('section_id')
      .eq('student_id', user.id)
      .eq('program_slug', programSlug);

    // Get signed agreement
    const { data: agreement } = await supabase
      .from('apprentice_agreements')
      .select('*')
      .eq('student_id', user.id)
      .eq('program_slug', programSlug)
      .eq('agreement_type', 'apprentice_agreement')
      .single();

    return NextResponse.json({
      acknowledgedSections: acknowledgments?.map(a => a.section_id) || [],
      agreementSigned: !!agreement,
      signature: agreement?.full_legal_name,
      signedAt: agreement?.signed_at,
    });
  } catch (error) {
    logger.error('[Handbook API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/apprentice/handbook
 * Acknowledge a section or sign the agreement
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programSlug, action, sectionId, sectionTitle, signature, acknowledgedSections } = body;

    if (action === 'acknowledge') {
      // Acknowledge a section
      const { error } = await supabase
        .from('handbook_acknowledgments')
        .upsert({
          student_id: user.id,
          program_slug: programSlug,
          section_id: sectionId,
          section_title: sectionTitle,
          acknowledged_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,program_slug,section_id',
        });

      if (error) {
        logger.error('[Handbook API] Acknowledge error:', error);
        return NextResponse.json({ error: 'Failed to acknowledge section' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'sign') {
      // Sign the agreement
      const { error } = await supabase
        .from('apprentice_agreements')
        .upsert({
          student_id: user.id,
          program_slug: programSlug,
          agreement_type: 'apprentice_agreement',
          agreement_version: '2025.1',
          full_legal_name: signature,
          signature_data: signature,
          signature_type: 'typed',
          acknowledged_sections: acknowledgedSections,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          signed_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,program_slug,agreement_type',
        });

      if (error) {
        logger.error('[Handbook API] Sign error:', error);
        return NextResponse.json({ error: 'Failed to sign agreement' }, { status: 500 });
      }

      // Update student enrollment to mark handbook complete
      await supabase
        .from('student_enrollments')
        .update({ handbook_signed: true, handbook_signed_at: new Date().toISOString() })
        .eq('student_id', user.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('[Handbook API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
