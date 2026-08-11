import { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import FERPATrainingDashboard from '@/components/compliance/FERPATrainingDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'FERPA Training Management | Elevate For Humanity',
  description: 'Manage FERPA training, assessments, and compliance documentation',
};

export default async function FERPATrainingPage() {
  const { id: userId } = await requireAdmin();
  const db = await requireAdminClient();

  const [{ data: profile }, { data: trainingRows }, { data: pendingRows }] = await Promise.all([
    db.from('profiles').select('role, full_name').eq('id', userId).maybeSingle(),
    db
      .from('ferpa_training_records')
      .select(
        'id, user_id, status, quiz_score, completed_at, expires_at, profiles:user_id(full_name,email,role)',
      )
      .order('created_at', { ascending: false }),
    db
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .in('role', ['staff', 'instructor', 'admin', 'super_admin'])
      .order('full_name'),
  ]);

  const trainingRecords = (trainingRows ?? []).map((row: any) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles ?? null,
  })).filter((row: any) => row.profiles);

  const trainedIds = new Set(trainingRecords.map((row: any) => row.user_id));
  const pendingUsers = (pendingRows ?? []).filter((row: any) => !trainedIds.has(row.id));

  return (
    <FERPATrainingDashboard
      trainingRecords={trainingRecords as any}
      pendingUsers={pendingUsers as any}
      currentUser={profile}
    />
  );
}
