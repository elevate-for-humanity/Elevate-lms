import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
      .from('profiles')
      .select('role, program_holder_id')
      .eq('id', user.id)
      .single();

    if (!profile || !['program_holder', 'program_owner', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!profile.program_holder_id) {
      return NextResponse.json({ students: [] });
    }

    // Get programs via program_holder_programs association table
    const { data: associations } = await db
      .from('program_holder_programs')
      .select('program_id')
      .eq('program_holder_id', profile.program_holder_id)
      .eq('status', 'active');

    if (!associations || associations.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const programIds = associations.map((a: any) => a.program_id);

    // Get enrollments for owned programs
    const { data: enrollments } = await db
      .from('program_enrollments')
      .select('student_id, program_id')
      .in('program_id', programIds);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const studentIds = [...new Set(enrollments.map((e) => e.student_id))];

    // Get student details
    const { data: students, error } = await db
      .from('profiles')
      .select('id, email, full_name, created_at')
      .in('id', studentIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ students: students || [] });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
