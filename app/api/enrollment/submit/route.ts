import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const data = await req.json();

    // Validate required fields
    const missing: string[] = [];
    if (!data.firstName?.trim()) missing.push('firstName');
    if (!data.lastName?.trim()) missing.push('lastName');
    if (!data.email?.trim()) missing.push('email');
    if (!data.programId && !data.programName) missing.push('programId or programName');

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { data: enrollment, error } = await db
      .from('program_enrollments')
      .insert({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        program_id: data.programId,
        program_name: data.programName,
        funding_type: data.fundingType || 'wioa',
        status: 'pending',
        source: data.source || 'website',
        notes: data.notes || null,
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
export const POST = withApiAudit('/api/enrollment/submit', _POST);
