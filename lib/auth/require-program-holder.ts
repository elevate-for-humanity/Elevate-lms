import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export interface ProgramHolderContext {
  user: { id: string; email?: string };
  profile: { id: string; role: string; full_name?: string; program_holder_id: string | null };
  holderId: string;
  tenantId: string | null;
  programIds: string[];
  db: any;
}

/**
 * Authenticate a program-holder user and resolve their accessible programs.
 * Uses only canonical Program Holder routes; no Partner/Host-Shop aliases.
 */
export async function requireProgramHolder(): Promise<ProgramHolderContext> {
  const supabase = await createClient();
  const db = await requireAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/dashboard');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, email, program_holder_id, tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['program_holder', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const holderId = profile.program_holder_id;
  if (!holderId) {
    redirect('/program-holder?error=pending-approval');
  }

  const { data: holder } = await db
    .from('program_holders')
    .select('status, mou_signed, approved_at, payout_status')
    .eq('id', holderId)
    .maybeSingle();

  if (!holder) {
    redirect('/program-holder?error=pending-approval');
  }

  if (!['approved', 'active'].includes(holder.status) || !holder.approved_at) {
    redirect('/program-holder/onboarding?status=pending-approval');
  }

  if (!holder.mou_signed) {
    redirect('/program-holder/sign-mou?required=true');
  }

  const { data: associations } = await db
    .from('program_holder_programs')
    .select('program_id')
    .eq('program_holder_id', holderId)
    .eq('status', 'active');

  const programIds = (associations || []).map((a: { program_id: string }) => a.program_id);

  return {
    user: { id: user.id, email: user.email },
    profile,
    holderId,
    tenantId: profile.tenant_id ?? null,
    programIds,
    db,
  };
}

export async function requireProgramAccess(programId: string): Promise<ProgramHolderContext> {
  const ctx = await requireProgramHolder();

  if (!ctx.programIds.includes(programId)) {
    redirect('/program-holder/dashboard?error=access-denied');
  }

  return ctx;
}

export async function getProgramHolderContext(db: any, userId: string) {
  const { data: profile } = await db
    .from('profiles')
    .select('id, role, program_holder_id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.program_holder_id) return null;

  const { data: associations } = await db
    .from('program_holder_programs')
    .select('program_id')
    .eq('program_holder_id', profile.program_holder_id)
    .eq('status', 'active');

  return {
    holderId: profile.program_holder_id as string,
    programIds: (associations || []).map((a: { program_id: string }) => a.program_id),
  };
}
