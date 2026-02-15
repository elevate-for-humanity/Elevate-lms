import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// NRF RISE Up Retail Certification Integration
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const query = supabase
      .from('certificates')
      .select('*, profiles:user_id(full_name, email)')
      .eq('certificate_type', 'RISE_UP');

    if (userId) {
      query.eq('user_id', userId);
    }

    const { data: certificates, error } = await query.limit(100);

    if (error) {
      logger.error('RISE Up certificates error:', error);
    }

    return NextResponse.json({
      provider: 'NRF Foundation',
      status: 'active',
      program: 'RISE Up Retail Industry Fundamentals',
      availableCertifications: [
        { id: 'rise-customer-service', name: 'Customer Service & Sales', level: 1 },
        { id: 'rise-business-operations', name: 'Business of Retail', level: 1 },
        { id: 'rise-retail-fundamentals', name: 'Retail Industry Fundamentals', level: 2 },
      ],
      issuedCertificates: certificates?.length || 0,
      certificates: certificates || [],
      integrationStatus: 'active',
    });
  } catch (error) {
    logger.error('RISE Up API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RISE Up certifications' },
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
    const { certificationType, testScore, completedAt } = body;

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

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        certificate_type: 'RISE_UP',
        certificate_subtype: certificationType,
        issued_at: completedAt || new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years
        metadata: JSON.stringify({ testScore, provider: 'NRF Foundation' }),
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
      message: 'RISE Up certification issued successfully',
    });
  } catch (error) {
    logger.error('RISE Up certification error:', error);
    return NextResponse.json(
      { error: 'Failed to process certification' },
      { status: 500 }
    );
  }
}
