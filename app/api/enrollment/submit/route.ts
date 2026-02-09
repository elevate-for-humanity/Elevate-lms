import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const data = await req.json();

    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        program_id: data.programId,
        program_name: data.programName,
        funding_type: data.fundingType || 'wioa',
        status: 'pending',
        source: data.source || 'website',
        notes: data.notes,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit enrollment' }, { status: 500 });
  }
}
