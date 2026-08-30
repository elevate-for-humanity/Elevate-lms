import { cookies } from 'next/headers';
import { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeRole } from '@/lib/rbac/role-matrix';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import {
  getHostShopOnboardingPaths,
  mergeHostShopDocumentRequirements,
  resolveHostShopProgram,
} from '@/lib/partners/host-shop-onboarding';

export const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';

export type TradeTarget = {
  programSlug: string | null;
  hours: null;
  label: string;
  progressModel: 'competency_based' | 'unconfigured';
  registered: boolean;
  competencyCount?: number;
  rtiHours?: number;
  rapidsCode?: string;
  mentorRatio?: string;
  blockingReason?: string;
};

const REGISTERED_PROGRAM_ALIASES: Record<string, string> = {
  barber: 'barber-apprenticeship',
  'barber-apprenticeship': 'barber-apprenticeship',
  esthetician: 'esthetician-apprenticeship',
  esthetics: 'esthetician-apprenticeship',
  'esthetician-apprenticeship': 'esthetician-apprenticeship',
  'esthetics-apprenticeship': 'esthetics-apprenticeship',
  'nail-tech': 'nail-technician-apprenticeship',
  nail_tech: 'nail-technician-apprenticeship',
  nail_technician: 'nail-technician-apprenticeship',
  nail: 'nail-technician-apprenticeship',
  'nail-tech-apprenticeship': 'nail-technician-apprenticeship',
  'nail-technician-apprenticeship': 'nail-technician-apprenticeship',
  manicurist: 'nail-technician-apprenticeship',
  'manicurist-apprenticeship': 'nail-technician-apprenticeship',
};

export function resolveTradeTarget(programSlug: string | null | undefined): TradeTarget {
  const raw = String(programSlug || '').trim().toLowerCase();
  const canonical = REGISTERED_PROGRAM_ALIASES[raw] || raw;
  const registered = canonical ? getRegisteredProgramStandard(canonical) : null;
  if (registered) {
    return {
      programSlug: registered.canonicalProgramSlug,
      hours: null,
      label: `Registered ${registered.standard.occupationTitle} Apprenticeship`,
      progressModel: 'competency_based',
      registered: true,
      competencyCount: registered.completion.competencyCount,
      rtiHours: registered.completion.requiredRtiHours,
      rapidsCode: registered.standard.rapidsCode,
      mentorRatio: registered.standard.apprenticeToMentorRatio,
    };
  }

  return {
    programSlug: canonical || null,
    hours: null,
    label: raw ? `${raw.replaceAll('-', ' ')} — registered standard not configured` : 'Registered apprenticeship standard not configured',
    progressModel: 'unconfigured',
    registered: false,
    blockingReason: 'No active approved registered-program standard is configured for this occupation. Regulated apprenticeship progress is blocked until the sponsor standard is represented in the canonical contract.',
  };
}

type PartnerRecord = {
  id: string;
  partner_type?: string | null;
  program_type?: string | null;
  programs?: string[] | null;
  approval_status?: string | null;
  status?: string | null;
  mou_signed?: boolean | null;
  onboarding_completed?: boolean | null;
  documents_verified?: boolean | null;
  verification_status?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
};

type HourRow = {
  user_id: string | null;
  host_shop_id: string | null;
  program_slug: string | null;
  status: string | null;
  approval_status: string | null;
  accepted_hours: number | string | null;
  hours: number | string | null;
  hours_claimed: number | string | null;
};

function numericHours(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isApproved(row: HourRow) {
  return row.approval_status === 'approved' || row.status === 'approved';
}

function isPending(row: HourRow) {
  return row.approval_status === 'pending' || row.status === 'pending';
}

async function resolvePartnerForBoard(db: any, userId: string): Promise<PartnerRecord> {
  // Platform administrators audit a specifically selected Host Shop. Resolve
  // that selection before ordinary memberships so an admin's unrelated partner
  // membership cannot capture the request and send the session into onboarding.
  const { data: profile } = await db.from('profiles').select('role').eq('id', userId).maybeSingle();
  const role = normalizeRole(profile?.role);
  if (role && ['admin', 'super_admin', 'org_admin'].includes(role)) {
    const cookieStore = await cookies();
    const selectedPartnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value;
    if (!selectedPartnerId) throw new Error('HOST_SHOP_ADMIN_PARTNER_REQUIRED');

    const { data: selectedPartner, error: selectedPartnerError } = await db
      .from('partners')
      .select('id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, verification_status, name, city, state')
      .eq('id', selectedPartnerId)
      .maybeSingle();
    if (selectedPartnerError || !selectedPartner) throw new Error('HOST_SHOP_ADMIN_PARTNER_REQUIRED');
    return selectedPartner as PartnerRecord;
  }

  const { data: partnerLinks, error: partnerLinkError } = await db
    .from('partner_users')
    .select('partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, verification_status, name, city, state)')
    .eq('user_id', userId)
    .eq('status', 'active');

  const partnerLink = (partnerLinks || []).find((row: any) => row?.partner_id && row?.partners);
  if (!partnerLinkError && partnerLink?.partner_id && partnerLink.partners) {
    return partnerLink.partners as unknown as PartnerRecord;
  }

  throw new Error('HOST_SHOP_ACCESS_DENIED');
}

export async function getHostShopAdminPartnerOptions() {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('partners')
    .select('id, name, partner_type, program_type, programs, approval_status, status, verification_status, city, state')
    .order('name', { ascending: true });
  if (error) throw new Error(`HOST_SHOP_PARTNER_OPTIONS_FAILED:${error.message}`);
  return (data ?? []).filter((partner: any) => {
    const values = [partner.partner_type, partner.program_type, ...(Array.isArray(partner.programs) ? partner.programs : [])]
      .filter(Boolean).join(' ').toLowerCase();
    return /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(values);
  });
}

export async function getHostShopBoard(userId: string) {
  const db = await requireAdminClient();
  const partner = await resolvePartnerForBoard(db, userId);

  const [{ data: partnerShops, error: partnerShopError }, { data: staffLinks, error: staffError }] = await Promise.all([
    db.from('shops').select('id, name, city, state, active, partner_id').eq('partner_id', partner.id).neq('active', false),
    db.from('shop_staff').select('shop_id, shops(id, name, city, state, active, partner_id)').eq('user_id', userId),
  ]);
  if (partnerShopError) throw new Error(`HOST_SHOP_SHOPS_QUERY_FAILED:${partnerShopError.message}`);
  if (staffError) throw new Error(`HOST_SHOP_STAFF_QUERY_FAILED:${staffError.message}`);

  const shopMap = new Map<string, any>();
  for (const shop of partnerShops || []) if (shop?.id && shop.active !== false) shopMap.set(shop.id, shop);
  for (const row of staffLinks || []) {
    const shop = (row as any).shops;
    if (shop?.id && shop.active !== false && shop.partner_id === partner.id) shopMap.set(shop.id, shop);
  }
  const shops = Array.from(shopMap.values());
  const shopIds = shops.map((shop) => shop.id as string);

  const { data: placements, error: placementsError } = shopIds.length
    ? await db.from('apprentice_placements')
        .select('id, student_id, shop_id, program_slug, status, start_date, supervisor_user_id, profiles(full_name, email)')
        .in('shop_id', shopIds).eq('status', 'active')
    : { data: [], error: null };
  if (placementsError) throw new Error(`HOST_SHOP_PLACEMENTS_QUERY_FAILED:${placementsError.message}`);

  const apprentices = (placements || []).map((placement: any) => ({
    id: placement.id,
    student_id: placement.student_id,
    shop_id: placement.shop_id,
    supervisor_user_id: placement.supervisor_user_id || null,
    name: placement.profiles?.full_name || 'Unknown',
    email: placement.profiles?.email || '',
    program_slug: placement.program_slug || null,
    discipline: placement.program_slug || null,
    start_date: placement.start_date,
    tradeInfo: resolveTradeTarget(placement.program_slug),
  }));
  const studentIds = apprentices.map((a) => a.student_id).filter(Boolean);
  const placementByStudent = new Map(apprentices.map((a) => [a.student_id, {
    shopId: a.shop_id,
    programSlug: a.program_slug,
    supervisorUserId: a.supervisor_user_id,
    tradeInfo: a.tradeInfo,
  }]));

  const workProgress: Record<string, { completed: number; required: null; progressModel: 'competency_based' | 'unconfigured' }> = {};
  let pendingHoursCount = 0;
  if (studentIds.length) {
    const { data: hourRows, error: hourError } = await db.from('hour_entries')
      .select('user_id, host_shop_id, program_slug, status, approval_status, accepted_hours, hours, hours_claimed')
      .in('user_id', studentIds);
    if (hourError) throw new Error(`HOST_SHOP_HOURS_QUERY_FAILED:${hourError.message}`);
    for (const studentId of studentIds) {
      const target = placementByStudent.get(studentId)?.tradeInfo || resolveTradeTarget(null);
      workProgress[studentId] = { completed: 0, required: null, progressModel: target.progressModel };
    }
    for (const row of (hourRows || []) as HourRow[]) {
      if (!row.user_id || !workProgress[row.user_id]) continue;
      const placement = placementByStudent.get(row.user_id);
      if (!placement || !placement.tradeInfo.registered) continue;
      if (row.host_shop_id && row.host_shop_id !== placement.shopId) continue;
      if (placement.programSlug && row.program_slug && row.program_slug !== placement.programSlug) continue;
      if (isPending(row)) pendingHoursCount += 1;
      if (!isApproved(row)) continue;
      workProgress[row.user_id].completed += numericHours(row.accepted_hours) || numericHours(row.hours) || numericHours(row.hours_claimed);
    }
  }

  const enrollmentByStudent = new Map<string, string>();
  const competencyProgress: Record<string, { completed: number; required: number }> = {};
  if (studentIds.length) {
    const { data: enrollmentRows } = await db.from('program_enrollments')
      .select('id,user_id,student_id,program_slug,status,created_at')
      .or(`user_id.in.(${studentIds.join(',')}),student_id.in.(${studentIds.join(',')})`)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed']).order('created_at', { ascending: false });
    for (const row of enrollmentRows || []) {
      const studentId = row.user_id || row.student_id;
      if (!studentId || enrollmentByStudent.has(studentId)) continue;
      const placement = placementByStudent.get(studentId);
      if (!placement || !placement.tradeInfo.registered || (placement.programSlug && row.program_slug && placement.programSlug !== row.program_slug)) continue;
      enrollmentByStudent.set(studentId, row.id);
    }
    const enrollmentIds = [...enrollmentByStudent.values()];
    const { data: competencyRows } = enrollmentIds.length
      ? await db.from('apprentice_competency_records').select('enrollment_id,competency_id,completed')
          .in('enrollment_id', enrollmentIds).eq('completed', true)
      : { data: [] };
    const sets = new Map<string, Set<string>>();
    for (const row of competencyRows || []) {
      if (!sets.has(row.enrollment_id)) sets.set(row.enrollment_id, new Set());
      sets.get(row.enrollment_id)!.add(row.competency_id);
    }
    for (const [studentId, enrollmentId] of enrollmentByStudent.entries()) {
      const target = placementByStudent.get(studentId)?.tradeInfo;
      if (target?.registered && target.competencyCount) {
        competencyProgress[studentId] = { completed: sets.get(enrollmentId)?.size || 0, required: target.competencyCount };
      }
    }
  }

  const programType = resolveHostShopProgram(partner);
  const tradeInfo = resolveTradeTarget(programType);
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  const { data: programAccess } = await db.from('partner_program_access').select('program_id')
    .eq('partner_id', partner.id).is('revoked_at', null);
  const programIds = Array.from(new Set([
    programType,
    ...(programAccess || []).map((row: { program_id?: string }) => row.program_id).filter((v): v is string => Boolean(v)),
  ]));
  const { data: dbRequirements } = await db.from('partner_document_requirements').select('*')
    .in('program_id', [...programIds, 'ALL']).in('state', [partner.state || 'Indiana', 'ALL']);
  const requirements = mergeHostShopDocumentRequirements(dbRequirements, programType);
  const { data: uploadedDocs, error: uploadedDocsError } = await db.from('partner_documents')
    .select('id, document_type, display_name, file_name, file_url, status, rejection_reason, expiration_date, uploaded_at')
    .eq('partner_id', partner.id).order('uploaded_at', { ascending: false });
  if (uploadedDocsError) throw new Error(`HOST_SHOP_DOCUMENTS_QUERY_FAILED:${uploadedDocsError.message}`);

  const latestDocs = new Map<string, any>();
  for (const doc of uploadedDocs || []) if (!latestDocs.has(doc.document_type)) latestDocs.set(doc.document_type, doc);
  const documentStatuses = requirements.map((requirement: any) => {
    const document = latestDocs.get(requirement.document_type);
    return { ...requirement, uploaded: Boolean(document), document: document || null, status: document?.status || 'missing' };
  });
  const missingDocuments = documentStatuses.filter((d: any) => d.is_required && (!d.uploaded || ['missing', 'rejected', 'expired'].includes(d.status)));
  const pendingDocuments = documentStatuses.filter((d: any) => d.is_required && d.status === 'pending');
  const acceptedDocumentCount = documentStatuses.filter((d: any) => d.is_required && d.status === 'accepted').length;
  const requiredDocumentCount = documentStatuses.filter((d: any) => d.is_required).length;

  const registeredPrograms = Array.from(
    new Map(
      apprentices
        .filter((apprentice) => apprentice.tradeInfo.registered)
        .map((apprentice) => [apprentice.tradeInfo.rapidsCode, apprentice.tradeInfo]),
    ).values(),
  );
  const unconfiguredPrograms = Array.from(
    new Map(
      apprentices
        .filter((apprentice) => !apprentice.tradeInfo.registered)
        .map((apprentice) => [apprentice.program_slug || 'unknown', apprentice.tradeInfo]),
    ).values(),
  );

  return {
    partner,
    shops,
    tradeKey: programType,
    tradeInfo,
    programType,
    onboardingPaths,
    registeredPrograms,
    unconfiguredPrograms,
    documentStatuses,
    missingDocuments,
    pendingDocuments,
    acceptedDocumentCount,
    requiredDocumentCount,
    apprentices: apprentices.map((apprentice) => ({
      ...apprentice,
      ojt: workProgress[apprentice.student_id] || { completed: 0, required: null, progressModel: apprentice.tradeInfo.progressModel },
      competency: competencyProgress[apprentice.student_id] || null,
    })),
    pendingHoursCount,
  };
}
