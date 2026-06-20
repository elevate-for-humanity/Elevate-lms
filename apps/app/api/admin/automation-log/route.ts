import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = getAdminClient();

  const [
    { data: deliveryLogs },
    { data: notifications },
    { data: rawEnrollments },
  ] = await Promise.all([
    db.from('delivery_logs').select('id,channel,status,template_name,recipient,created_at').order('created_at', { ascending: false }).limit(50),
    db.from('notifications').select('id,title,created_at').order('created_at', { ascending: false }).limit(50),
    db.from('program_enrollments').select('id,user_id,created_at,programs:program_id(name,title)').order('created_at', { ascending: false }).limit(20),
  ]);

  // Hydrate profiles for enrollments
  const userIds = [...new Set((rawEnrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id,full_name').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name]));

  const enrollments = (rawEnrollments ?? []).map((e: any) => ({
    id: e.id,
    user_name: profileMap[e.user_id] || 'Student',
    program_name: (e.programs as any)?.title || (e.programs as any)?.name || 'Program',
    created_at: e.created_at,
  }));

  return NextResponse.json({
    deliveryLogs: deliveryLogs ?? [],
    notifications: notifications ?? [],
    enrollments,
  });
}
