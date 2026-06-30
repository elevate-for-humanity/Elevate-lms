import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { ProgramHolderShellGate } from './ProgramHolderShellGate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Portal',
  description: 'Manage your training programs, students, and compliance.',
  manifest: '/manifest-program-holder.json',
};

const PORTAL_ROLES = ['program_holder', 'admin', 'super_admin', 'staff', 'org_admin'];

export default async function ProgramHolderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/program-holder/dashboard');

  const db = (await requireAdminClient()) ?? supabase;

  const { data: profile } = await db
    .from('profiles')
    .select('role, program_holder_id, full_name, organization')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !PORTAL_ROLES.includes(profile.role ?? '')) {
    redirect('/unauthorized');
  }

  const isAdmin = ['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role ?? '');

  let orgName = profile.organization ?? undefined;
  let hasSchoolApplications = false;

  if (!isAdmin && profile.program_holder_id) {
    const { data: holder } = await db
      .from('program_holders')
      .select('status, organization_name, name, enable_school_applications')
      .eq('id', profile.program_holder_id)
      .maybeSingle();

    if (holder && !['approved', 'active'].includes(holder.status ?? '')) {
      redirect('/program-holder?error=pending-approval');
    }

    orgName = holder?.organization_name || holder?.name || orgName;
    hasSchoolApplications = Boolean(holder?.enable_school_applications);
  }

  return (
    <ProgramHolderShellGate
      role={profile.role ?? 'program_holder'}
      userName={profile.full_name ?? undefined}
      userEmail={user.email ?? undefined}
      orgName={orgName}
      hasSchoolApplications={hasSchoolApplications}
    >
      {children}
    </ProgramHolderShellGate>
  );
}
