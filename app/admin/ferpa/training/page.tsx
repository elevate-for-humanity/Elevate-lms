import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FERPATrainingDashboard from '@/components/compliance/FERPATrainingDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FERPA Training Management | Elevate For Humanity',
  description: 'Manage FERPA training, assessments, and compliance documentation',
};

export default async function FERPATrainingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/ferpa/training');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'hr', 'staff', 'instructor', 'partner', 'program_holder'];
  if (!profile || !allowedRoles.includes(profile.role)) redirect('/unauthorized');

  const trainingRecords: any[] = [];
  const pendingUsers: any[] = [];

  return (
    <>
      {/* Hero Image */}
      <FERPATrainingDashboard
        trainingRecords={trainingRecords || []}
        pendingUsers={pendingUsers}
        currentUser={profile}
      />
    </>
  );
}
