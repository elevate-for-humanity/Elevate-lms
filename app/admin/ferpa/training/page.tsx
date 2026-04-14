import { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { getAdminClient } from '@/lib/supabase/admin';
import FERPATrainingDashboard from '@/components/compliance/FERPATrainingDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FERPA Training Management | Elevate For Humanity',
  description: 'Manage FERPA training, assessments, and compliance documentation',
};

export default async function FERPATrainingPage() {
  const { id: userId } = await requireAdmin();
  const db = await getAdminClient();

  const [{ data: profile }, { data: trainingRecords }, { data: pendingUsers }] = await Promise.all([
    db.from('profiles').select('role, full_name').eq('id', userId).maybeSingle(),
    db.from('ferpa_training_records')
      .select('id, user_id, status, quiz_score, completed_at, expires_at, training_acknowledged, created_at')
      .order('created_at', { ascending: false }),
    db.from('profiles')
      .select('id, full_name, email, role')
      .not('id', 'in',
        `(SELECT user_id FROM ferpa_training_records WHERE status = 'completed')`
      )
      .in('role', ['staff', 'instructor', 'admin', 'super_admin'])
      .order('full_name'),
  ]);

  return (
    <>
      <FERPATrainingDashboard
        trainingRecords={trainingRecords ?? []}
        pendingUsers={pendingUsers ?? []}
        currentUser={profile}
      />
    </>
  );
}
