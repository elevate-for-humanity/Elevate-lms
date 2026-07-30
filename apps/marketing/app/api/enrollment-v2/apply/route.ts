import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization — avoids build-time env access
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateConfirmationNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ENR-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await req.json();
    const {
      programSlug, programName, firstName, lastName, email, phone,
      dateOfBirth, addressLine1, addressCity, addressState, addressZip,
      fundingSource, goals, howHeard,
    } = body;

    if (!programSlug || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Program, first name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('enrollment_v2_applications')
      .select('id, confirmation_number, enrollment_status')
      .eq('email', email)
      .eq('program_slug', programSlug)
      .not('enrollment_status', 'in', '(rejected,withdrawn)')
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'You already have an active application for this program.',
        application_id: existing.id,
        confirmation_number: existing.confirmation_number,
        duplicate: true,
      }, { status: 409 });
    }

    const confirmationNumber = generateConfirmationNumber();

    const { data, error } = await supabase
      .from('enrollment_v2_applications')
      .insert({
        program_slug: programSlug,
        program_name: programName || programSlug,
        confirmation_number: confirmationNumber,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        address_line1: addressLine1 || null,
        address_city: addressCity || null,
        address_state: addressState || null,
        address_zip: addressZip || null,
        funding_source: fundingSource || 'self',
        funding_status: fundingSource && fundingSource !== 'self' ? 'screening' : 'not_screened',
        interview_status: 'completed',
        interview_score: 75,
        interview_recommendation: 'proceed',
        interview_completed_at: new Date().toISOString(),
        enrollment_status: 'application',
        source: 'website',
        utm_campaign: howHeard || null,
        submitted_at: new Date().toISOString(),
      })
      .select('id, confirmation_number')
      .single();

    if (error) {
      console.error('enrollment_v2 insert error:', error);
      return NextResponse.json({ error: 'Failed to create application. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      application_id: data.id,
      confirmation_number: data.confirmation_number,
    });

  } catch (err: any) {
    console.error('enrollment_v2 error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('id');
    const email = searchParams.get('email');

    if (!applicationId && !email) {
      return NextResponse.json({ error: 'Application ID or email required' }, { status: 400 });
    }

    let query = supabase.from('enrollment_v2_applications').select('*');
    if (applicationId) query = query.eq('id', applicationId);
    else if (email) query = query.eq('email', email);

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const [docs, agreements] = await Promise.all([
      supabase.from('enrollment_v2_binder_documents').select('*').eq('application_id', data.id).order('document_type'),
      supabase.from('enrollment_v2_agreements').select('*').eq('application_id', data.id),
    ]);

    return NextResponse.json({ ...data, binder_documents: docs.data || [], agreements: agreements.data || [] });

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
