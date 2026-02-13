import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  // Fetch user progress across courses and programs
  const [enrollmentsResult, progressResult, certificatesResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, status, program_id, created_at')
      .eq('user_id', userId),
    supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('certificates')
      .select('id, program_id, issued_at')
      .eq('user_id', userId),
  ]);

  const enrollments = enrollmentsResult.data || [];
  const progress = progressResult.data || [];
  const certificates = certificatesResult.data || [];

  return NextResponse.json({
    enrollments,
    progress,
    certificates,
    summary: {
      total_enrollments: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      certificates_earned: certificates.length,
    },
  });
}
