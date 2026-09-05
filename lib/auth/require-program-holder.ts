import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { requirePortalAccess } from '@/lib/auth/portal-access';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';

interface ProgramHolderProfile {
  id: string;
  role: string;
  full_name?: string;
  email?: string;
  program_holder_id: string | null;
  tenant_id?: string | null;
}

export interface ProgramHolderScopedContext {
  mode: 'holder';
  isPlatformAdmin: false;
  user: { id: string; email?: string };
  profile: ProgramHolderProfile;
  holderId: string;
  tenantId: string | null;
  programIds: string[];
  db: any;
}

export interface ProgramHolderAdminContext {
  mode: 'admin';
  isPlatformAdmin: true;
  user: { id: string; email?: string };
  profile: ProgramHolderProfile;
  holderId: null;
  tenantId: null;
  programIds: string[];
  db: any;
}

export interface ProgramHolderPreviewContext {
  mode: 'preview';
  isPlatformAdmin: true;
  user: { id: string; email?: string };
  profile: ProgramHolderProfile;
  holderId: string;
  tenantId: string | null;
  programIds: string[];
  db: any;
}

export type ProgramHolderContext =
  | ProgramHolderScopedContext
  | ProgramHolderAdminContext
  | ProgramHolderPreviewContext;

/**
 * Canonical Program Holder portal context.
 *
 * Program Holder users remain strictly scoped to their approved holder record.
 * The active platform `admin` role receives oversight access without being
 * assigned a fake holder/tenant identity.
 */
export async function requireProgramHolder(): Promise<ProgramHolderContext> {
  const access = await requirePortalAccess('programholder');
  const db = await requireAdminClient();

  if (access.isPlatformAdmin) {
    const preview = await resolvePortalPreviewSubject(db, access.user.id);
    if (preview.previewing && preview.userId !== access.user.id) {
      const { data: targetProfile } = await db
        .from('profiles')
        .select('id,role,full_name,email,program_holder_id,tenant_id')
        .eq('id', preview.userId)
        .maybeSingle();
      if (targetProfile?.program_holder_id && targetProfile.role === 'program_holder') {
        const { data: associations } = await db
          .from('program_holder_programs')
          .select('program_id')
          .eq('program_holder_id', targetProfile.program_holder_id)
          .eq('status', 'active');
        return {
          mode: 'preview',
          isPlatformAdmin: true,
          user: { id: targetProfile.id, email: targetProfile.email || undefined },
          profile: targetProfile,
          holderId: targetProfile.program_holder_id,
          tenantId: targetProfile.tenant_id ?? null,
          programIds: (associations || []).map((item: { program_id: string }) => item.program_id),
          db,
        };
      }
    }
  }

  const profile: ProgramHolderProfile = {
    id: access.profile.id,
    role: access.profile.role,
    full_name: access.profile.full_name,
    email: access.profile.email,
    program_holder_id: access.profile.program_holder_id ?? null,
    tenant_id: access.profile.tenant_id ?? null,
  };

  if (access.isPlatformAdmin) {
    return {
      mode: 'admin',
      isPlatformAdmin: true,
      user: access.user,
      profile,
      holderId: null,
      tenantId: null,
      programIds: [],
      db,
    };
  }

  const holderId = profile.program_holder_id;
  if (!holderId) redirect('/program-holder?error=pending-approval');

  const { data: holder } = await db
    .from('program_holders')
    .select('status, mou_signed, approved_at, payout_status')
    .eq('id', holderId)
    .maybeSingle();

  if (!holder) redirect('/program-holder?error=pending-approval');
  if (!['approved', 'active'].includes(holder.status) || !holder.approved_at) {
    redirect('/program-holder/onboarding?status=pending-approval');
  }
  // Program Holders may view their dashboard while completing onboarding.
  // Money movement and other privileged actions enforce the full checklist
  // independently; an unsigned MOU must never make student records invisible.

  const { data: associations } = await db
    .from('program_holder_programs')
    .select('program_id')
    .eq('program_holder_id', holderId)
    .eq('status', 'active');

  return {
    mode: 'holder',
    isPlatformAdmin: false,
    user: access.user,
    profile,
    holderId,
    tenantId: profile.tenant_id ?? null,
    programIds: (associations || []).map((a: { program_id: string }) => a.program_id),
    db,
  };
}

export async function requireProgramAccess(programId: string): Promise<ProgramHolderContext> {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin') return ctx;
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
