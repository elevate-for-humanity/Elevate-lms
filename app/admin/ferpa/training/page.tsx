import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import FERPATrainingDashboard from '@/components/compliance/FERPATrainingDashboard';

export const metadata: Metadata = {
  title: 'FERPA Training Management | Elevate For Humanity',
  description: 'Manage FERPA training, assessments, and compliance documentation',
};

export default async function FERPATrainingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/ferpa/training');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'hr', 'staff', 'instructor', 'partner', 'program_holder'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Fetch training records
  const { data: trainingRecords } = await db
    .from('ferpa_training_records')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email,
        role
      )
    `)
    .order('completed_at', { ascending: false });

  // Fetch pending users (no training record)
  const { data: allUsers } = await db
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .in('role', ['admin', 'super_admin', 'instructor', 'staff', 'ferpa_officer', 'registrar']);

  const trainedUserIds = trainingRecords?.map(r => r.user_id) || [];
  const pendingUsers = allUsers?.filter(u => !trainedUserIds.includes(u.id)) || [];

  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-ferpa-training-hero.jpg" alt="FERPA training administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <FERPATrainingDashboard
        trainingRecords={trainingRecords || []}
        pendingUsers={pendingUsers}
        currentUser={profile}
      />
    </>
  );
}
