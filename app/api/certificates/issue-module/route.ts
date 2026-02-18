import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin', 'staff', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id, module_id, program_id, certificate_name } = await request.json();
    if (!user_id || !module_id) {
      return NextResponse.json({ error: 'user_id and module_id required' }, { status: 400 });
    }

    // Check for existing module certificate
    const { data: existing } = await supabase
      .from('module_certificates')
      .select('id')
      .eq('user_id', user_id)
      .eq('module_id', module_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Module certificate already issued', certificate_id: existing.id }, { status: 409 });
    }

    const certNumber = `MOD-${Date.now().toString(36).toUpperCase()}`;

    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single();

    const { data: cert, error: certError } = await supabase
      .from('module_certificates')
      .insert({
        user_id,
        module_id,
        program_id: program_id || null,
        certificate_number: certNumber,
        certificate_name: certificate_name || 'Module Completion',
        student_name: studentProfile?.full_name || '',
        issued_by: profile.full_name || user.email,
        issued_at: new Date().toISOString(),
      })
      .select('id, certificate_number')
      .single();

    if (certError) {
      logger.error('Module certificate issuance failed', certError);
      return NextResponse.json({ error: 'Failed to issue module certificate' }, { status: 500 });
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error) {
    logger.error('Module certificate error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
