import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const data = await request.json();

    // Get IP address
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Insert into database
    const { data: agreement, error } = await supabase
      .from('sub_office_agreements')
      .insert({
        sub_office_name: data.subOfficeName,
        sub_office_address: data.subOfficeAddress,
        sub_office_city: data.subOfficeCity,
        sub_office_state: data.subOfficeState,
        sub_office_zip: data.subOfficeZip,
        representative_name: data.representativeName,
        representative_title: data.representativeTitle,
        representative_email: data.representativeEmail,
        representative_phone: data.representativePhone,
        effective_date: data.effectiveDate,
        sub_office_signature: data.subOfficeSignature,
        signed_at: data.signedAt,
        ip_address: ip,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save agreement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, agreement });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: agreements, error } = await supabase
      .from('sub_office_agreements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch agreements' },
        { status: 500 }
      );
    }

    return NextResponse.json({ agreements });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
