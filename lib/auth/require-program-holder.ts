import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export interface ProgramHolderContext {
  user: { id: string; email?: string };
  profile: { id: string; role: string; full_name?: string; program_holder_id: string | null };
  holderId: string;
  /** tenant_id from profiles — used to scope payroll_runs and other tenant-isolated tables */
  tenantId: string | null;
  /** IDs of programs this holder can access (via program_holder_programs) */
  programIds: string[];
  /** Supabase client (admin if available, else user client) */
  db: any;
}

/**
 * Authenticate a program_holder user and resolve their accessible programs.
 *
 * Ownership path (matches live DB):
 *   profiles.program_holder_id → program_holders.id
 *     → program_holder_programs.program_holder_id → program_id
 *     → programs.id
 *
 * Redirects to /login if unauthenticated, /unauthorized if wrong role,
 * /program-holder if no program_holder_id is set on their profile.
 */
export async function requireProgramHolder(): Promise<ProgramHolderContext> {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin;
  if (!db) throw new Error('Admin client failed to initialize');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/dashboard');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, email, program_holder_id, tenant_id')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['program_holder', 'admin', 'super_admin', 'staff'].includes(profile.role)
  ) {
    redirect('/unauthorized');
  }

  const holderId = profile.program_holder_id;
  if (!holderId) {
    // Profile exists but no program_holders linkage yet (pending approval)
    redirect('/program-holder?error=pending-approval');
  }

  // Gate: check MOU signed + account active before allowing dashboard access
  const { data: holder } = await db
    .from('program_holders')
    .select('status, mou_signed, approved_at, payout_status')
    .eq('id', holderId)
    .single();

  if (!holder) {
    redirect('/program-holder?error=pending-approval');
  }

  // Not yet approved — send to onboarding
  if (holder.status !== 'active' || !holder.approved_at) {
    redirect('/program-holder/onboarding?status=pending-approval');
  }

  // MOU not signed — send to MOU page
  if (!holder.mou_signed) {
    redirect('/program-holder/mou?required=true');
  }

  // Get programs via the association table
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

/**
 * Validate that a specific programId belongs to the current program holder.
 * Use in /programs/[programId]/* routes.
 */
export async function requireProgramAccess(
  programId: string
): Promise<ProgramHolderContext> {
  const ctx = await requireProgramHolder();

  if (!ctx.programIds.includes(programId)) {
    redirect('/program-holder/programs?error=access-denied');
  }

  return ctx;
}

/**
 * Lightweight version for API routes (no redirect, returns null on failure).
 */
export async function getProgramHolderContext(db: any, userId: string) {
  const { data: profile } = await db
    .from('profiles')
    .select('id, role, program_holder_id')
    .eq('id', userId)
    .single();

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
