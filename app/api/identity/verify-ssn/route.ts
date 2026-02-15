import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * SSA SSN Verification API
 * Verifies Social Security Number with Social Security Administration
 *
 * FREE service for employers
 * Website: https://www.ssa.gov/employer/ssnv.htm
 */

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ssn, firstName, lastName, dateOfBirth } = await request.json();

  // Validate required fields
  if (!ssn || !firstName || !lastName || !dateOfBirth) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    // Call SSA SSNVS API
    // Note: You need to register at https://www.ssa.gov/employer/ssnv.htm
    // and obtain API credentials
    const response = await fetch('https://www.ssa.gov/ssnvs/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SSA_API_KEY}`,
      },
      body: JSON.stringify({
        ssn: ssn.replace(/\D/g, ''), // Remove non-digits
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth, // Format: YYYY-MM-DD
      }),
    });

    const result = await response.json();

    // Save verification result to database
    const { data: verification, error } = await supabase
      .from('ssn_verifications')
      .insert({
        user_id: user.id,
        ssn_last_4: ssn.slice(-4), // Only store last 4 digits
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        verified: result.verified || false,
        verification_code: result.code,
        verification_message: result.message,
        verified_at: result.verified ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save verification' },
        { status: 500 }
      );
    }

    // Update program holder verification status if SSN verified
    if (result.verified) {
      await supabase.from('program_holder_verification').upsert({
        program_holder_id: user.id,
        ssn_verified: true,
        ssn_verified_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      verified: result.verified,
      message: result.message,
      verification_id: verification.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
