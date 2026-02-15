import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

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
    logger.error('Enrollment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit enrollment' }, { status: 500 });
  }
}
