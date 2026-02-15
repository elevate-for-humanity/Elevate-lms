import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'program_owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get programs owned by this user
    const { data: ownedPrograms } = await supabase
      .from('programs')
      .select('id, name')
      .eq('owner_id', user.id);

    if (!ownedPrograms || ownedPrograms.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const programIds = ownedPrograms.map((p) => p.id);

    // Get enrollments for owned programs
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, program_id')
      .in('program_id', programIds);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const studentIds = [...new Set(enrollments.map((e) => e.student_id))];

    // Get student details
    const { data: students, error } = await supabase
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
          (err instanceof Error ? err.message : String(err)) ||
          'Failed to fetch students',
      },
      { status: 500 }
    );
  }
}
