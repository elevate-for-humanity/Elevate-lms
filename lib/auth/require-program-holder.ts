import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { requirePortalAccess } from '@/lib/auth/portal-access';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { siteUrls } from '@/lib/utils/site-urls';

export const PROGRAM_HOLDER_PENDING_APPLICATION_URL =
  `${siteUrls.site}/apply/program-holder?status=pending`;

interface ProgramHolderProfile {
  id: string;
  role: string;
  full_name?: string;
  email?: string;
  program_holder_id: string | null;
  tenant_id?: string | null;
  avatar_url?: string | null;
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

async function resolveProgramIdsForHolder(db: any, holderId: string): Promise<string[]> {
  const [{ data: associations }, { data: holder }] = await Promise.all([
    db
      .from('program_holder_programs')
      .select('program_id')
      .eq('program_holder_id', holderId)
      .eq('status', 'active'),
    db.from('program_holders').select('features').eq('id', holderId).maybeSingle(),
  ]);

  const regional = holder?.features?.regional_assignment;
  if (regional?.all_programs_in_region === true) {
    const { data: regionalPrograms } = await db
      .from('programs')
      .select('id')
      .eq('is_active', true)
      .eq('status', 'active');
    return (regionalPrograms || []).map((row: { id: string }) => row.id);
  }

  return (associations || []).map((item: { program_id: string }) => item.program_id);
}

/**
 * Canonical Program Holder portal context.
 *
 * Program Holder users remain strictly scoped to their approved holder record.
 * The active platform `admin` role receives oversight access without being
 * assigned a fake holder/tenant identity.
 */
export async function requireProgramHolder(): Promise<ProgramHolderContext> {
  const db = await requireAdminClient();

  // A cross-domain Admin preview arrives with a short-lived signed handoff
  // cookie, not an LMS Supabase session. Resolve that verified handoff before
  // the normal role guard so the preview does not bounce through /login.
  const handoffPreview = await resolvePortalPreviewSubject(db, null);
  if (handoffPreview.previewing && handoffPreview.userId) {
    const { data: targetProfile } = await db
      .from('profiles')
      .select('id,role,full_name,email,program_holder_id,tenant_id,avatar_url')
      .eq('id', handoffPreview.userId)
      .maybeSingle();
    if (targetProfile?.program_holder_id && ['program_holder', 'programholder', 'site_coordinator'].includes(targetProfile.role)) {
      const programIds = await resolveProgramIdsForHolder(db, targetProfile.program_holder_id);
      return {
        mode: 'preview',
        isPlatformAdmin: true,
        user: { id: targetProfile.id, email: targetProfile.email || undefined },
        profile: targetProfile,
        holderId: targetProfile.program_holder_id,
        tenantId: targetProfile.tenant_id ?? null,
        programIds,
        db,
      };
    }
  }

  const access = await requirePortalAccess('programholder');

  if (access.isPlatformAdmin) {
    const preview = await resolvePortalPreviewSubject(db, access.user.id);
    if (preview.previewing && preview.userId !== access.user.id) {
      const { data: targetProfile } = await db
        .from('profiles')
        .select('id,role,full_name,email,program_holder_id,tenant_id,avatar_url')
        .eq('id', preview.userId)
        .maybeSingle();
      if (targetProfile?.program_holder_id && ['program_holder', 'site_coordinator'].includes(targetProfile.role)) {
        const programIds = await resolveProgramIdsForHolder(db, targetProfile.program_holder_id);
        return {
          mode: 'preview',
          isPlatformAdmin: true,
          user: { id: targetProfile.id, email: targetProfile.email || undefined },
          profile: targetProfile,
          holderId: targetProfile.program_holder_id,
          tenantId: targetProfile.tenant_id ?? null,
          programIds,
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
    avatar_url: access.profile.avatar_url ?? null,
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
  if (!holderId) redirect(PROGRAM_HOLDER_PENDING_APPLICATION_URL);

  const { data: holder } = await db
    .from('program_holders')
    .select('status, mou_signed, approved_at, payout_status')
    .eq('id', holderId)
    .maybeSingle();

  if (!holder) redirect(PROGRAM_HOLDER_PENDING_APPLICATION_URL);
  if (!['approved', 'active', 'approved_pending_mou'].includes(holder.status) || !holder.approved_at) {
    redirect(PROGRAM_HOLDER_PENDING_APPLICATION_URL);
  }
  // Program Holders may view their dashboard while completing onboarding.
  // Money movement and other privileged actions enforce the full checklist
  // independently; an unsigned MOU must never make student records invisible.

  const programIds = await resolveProgramIdsForHolder(db, holderId);

  return {
    mode: 'holder',
    isPlatformAdmin: false,
    user: access.user,
    profile,
    holderId,
    tenantId: profile.tenant_id ?? null,
    programIds,
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

  const programIds = await resolveProgramIdsForHolder(db, profile.program_holder_id);

  return {
    holderId: profile.program_holder_id as string,
    programIds,
  };
}
