import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CareerSafe OSHA Certification Integration
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const query = supabase
      .from('certificates')
      .select('*, profiles:user_id(full_name, email)')
      .eq('certificate_type', 'CAREERSAFE');

    if (userId) {
      query.eq('user_id', userId);
    }

    const { data: certificates, error } = await query.limit(100);

    if (error) {
      logger.error('CareerSafe certificates error:', error);
    }

    return NextResponse.json({
      provider: 'CareerSafe',
      status: 'active',
      program: 'OSHA Safety Training',
      availableCertifications: [
        { id: 'osha-10-general', name: 'OSHA 10-Hour General Industry', hours: 10 },
        { id: 'osha-10-construction', name: 'OSHA 10-Hour Construction', hours: 10 },
        { id: 'osha-30-general', name: 'OSHA 30-Hour General Industry', hours: 30 },
        { id: 'osha-30-construction', name: 'OSHA 30-Hour Construction', hours: 30 },
        { id: 'careersafe-campus', name: 'CareerSafe Campus', hours: 5 },
      ],
      issuedCertificates: certificates?.length || 0,
      certificates: certificates || [],
      integrationStatus: 'active',
    });
  } catch (error) {
    logger.error('CareerSafe API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CareerSafe certifications' },
      { status: 500 }
    );
  }
}

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
    const { certificationType, testScore, hoursCompleted, completedAt } = body;

    if (!certificationType || testScore === undefined) {
      return NextResponse.json(
        { error: 'Certification type and test score are required' },
        { status: 400 }
      );
    }

    const passed = testScore >= 70;

    if (!passed) {
      return NextResponse.json({
        success: false,
        passed: false,
        score: testScore,
        message: 'Score below passing threshold (70%)',
      });
    }

    // OSHA cards are valid for 5 years
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 5);

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        certificate_type: 'CAREERSAFE',
        certificate_subtype: certificationType,
        issued_at: completedAt || new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        metadata: JSON.stringify({ 
          testScore, 
          hoursCompleted,
          provider: 'CareerSafe',
          oshaCardNumber: `OSHA-${Date.now().toString(36).toUpperCase()}`,
        }),
      })
      .select()
      .single();

    if (error) {
      logger.error('Certificate creation error:', error);
      return NextResponse.json(
        { error: 'Failed to issue certificate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      passed: true,
      score: testScore,
      certificate,
      message: 'CareerSafe OSHA certification issued successfully',
    });
  } catch (error) {
    logger.error('CareerSafe certification error:', error);
    return NextResponse.json(
      { error: 'Failed to process certification' },
      { status: 500 }
    );
  }
}
