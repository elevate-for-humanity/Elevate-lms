import { cookies } from 'next/headers';
import { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeRole } from '@/lib/rbac/role-matrix';
import {
  getHostShopOnboardingPaths,
  mergeHostShopDocumentRequirements,
  resolveHostShopProgram,
} from '@/lib/partners/host-shop-onboarding';

export const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';

export const TRADE_TARGETS: Record<string, { hours: number; label: string }> = {
  barber: { hours: 2000, label: 'Barber Apprenticeship' },
  'barber-apprenticeship': { hours: 2000, label: 'Barber Apprenticeship' },
  cosmetology: { hours: 2000, label: 'Cosmetology Apprenticeship' },
  'cosmetology-apprenticeship': { hours: 2000, label: 'Cosmetology Apprenticeship' },
  hairstylist: { hours: 2000, label: 'Cosmetology Apprenticeship' },
  'nail-tech': { hours: 450, label: 'Nail Technician Apprenticeship' },
  nail_tech: { hours: 450, label: 'Nail Technician Apprenticeship' },
  nail_technician: { hours: 450, label: 'Nail Technician Apprenticeship' },
  esthetician: { hours: 700, label: 'Esthetician Apprenticeship' },
  'esthetician-apprenticeship': { hours: 700, label: 'Esthetician Apprenticeship' },
  training_site: { hours: 2000, label: 'Apprenticeship' },
};

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
  const { data: partnerLink, error: partnerLinkError } = await db
    .from('partner_users')
    .select('partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, name, city, state)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!partnerLinkError && partnerLink?.partner_id && partnerLink.partners) {
    return partnerLink.partners as unknown as PartnerRecord;
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  const role = normalizeRole(profile?.role);
  const isPlatformAdmin = role === 'admin' || role === 'super_admin' || role === 'org_admin';
  if (!isPlatformAdmin) throw new Error('HOST_SHOP_ACCESS_DENIED');

  const cookieStore = await cookies();
  const selectedPartnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value;
  if (!selectedPartnerId) throw new Error('HOST_SHOP_ADMIN_PARTNER_REQUIRED');

  const { data: selectedPartner, error: selectedPartnerError } = await db
    .from('partners')
    .select('id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, name, city, state')
    .eq('id', selectedPartnerId)
    .maybeSingle();

  if (selectedPartnerError || !selectedPartner) {
    throw new Error('HOST_SHOP_ADMIN_PARTNER_REQUIRED');
  }

  return selectedPartner as PartnerRecord;
}

export async function getHostShopAdminPartnerOptions() {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('partners')
    .select('id, name, partner_type, program_type, programs, approval_status, status, city, state')
    .order('name', { ascending: true });

  if (error) throw new Error(`HOST_SHOP_PARTNER_OPTIONS_FAILED:${error.message}`);

  return (data ?? []).filter((partner: any) => {
    const values = [
      partner.partner_type,
      partner.program_type,
      ...(Array.isArray(partner.programs) ? partner.programs : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(values);
  });
}

export async function getHostShopBoard(userId: string) {
  const db = await requireAdminClient();
  const partner = await resolvePartnerForBoard(db, userId);

  const [{ data: partnerShops, error: partnerShopError }, { data: staffLinks, error: staffError }] =
    await Promise.all([
      db
        .from('shops')
        .select('id, name, city, state, active, partner_id')
        .eq('partner_id', partner.id)
        .neq('active', false),
      db
        .from('shop_staff')
        .select('shop_id, shops(id, name, city, state, active, partner_id)')
        .eq('user_id', userId),
    ]);

  if (partnerShopError) throw new Error(`HOST_SHOP_SHOPS_QUERY_FAILED:${partnerShopError.message}`);
  if (staffError) throw new Error(`HOST_SHOP_STAFF_QUERY_FAILED:${staffError.message}`);

  const shopMap = new Map<string, any>();
  for (const shop of partnerShops || []) {
    if (shop?.id && shop.active !== false) shopMap.set(shop.id, shop);
  }
  for (const row of staffLinks || []) {
    const shop = (row as any).shops;
    if (shop?.id && shop.active !== false && shop.partner_id === partner.id) shopMap.set(shop.id, shop);
  }

  const shops = Array.from(shopMap.values());
  const shopIds = shops.map((shop) => shop.id as string);

  const { data: placements, error: placementsError } = shopIds.length
    ? await db
        .from('apprentice_placements')
        .select('id, student_id, shop_id, program_slug, status, start_date, profiles(full_name, email)')
        .in('shop_id', shopIds)
        .eq('status', 'active')
    : { data: [], error: null };

  if (placementsError) throw new Error(`HOST_SHOP_PLACEMENTS_QUERY_FAILED:${placementsError.message}`);

  const apprentices = (placements || []).map((placement: any) => ({
    id: placement.id,
    student_id: placement.student_id,
    shop_id: placement.shop_id,
    name: placement.profiles?.full_name || 'Unknown',
    email: placement.profiles?.email || '',
    program_slug: placement.program_slug || null,
    discipline: placement.program_slug || null,
    start_date: placement.start_date,
  }));
  const studentIds = apprentices.map((apprentice) => apprentice.student_id).filter(Boolean);
  const placementByStudent = new Map(
    apprentices.map((apprentice) => [
      apprentice.student_id,
      { shopId: apprentice.shop_id, programSlug: apprentice.program_slug },
    ]),
  );

  const ojtProgress: Record<string, { completed: number; required: number }> = {};
  let pendingHoursCount = 0;

  if (studentIds.length) {
    const { data: hourRows, error: hourError } = await db
      .from('hour_entries')
      .select('user_id, host_shop_id, program_slug, status, approval_status, accepted_hours, hours, hours_claimed')
      .in('user_id', studentIds);

    if (hourError) throw new Error(`HOST_SHOP_HOURS_QUERY_FAILED:${hourError.message}`);

    for (const studentId of studentIds) {
      const placement = placementByStudent.get(studentId);
      const target = TRADE_TARGETS[placement?.programSlug || '']?.hours ?? 2000;
      ojtProgress[studentId] = { completed: 0, required: target };
    }

    for (const row of (hourRows || []) as HourRow[]) {
      if (!row.user_id || !ojtProgress[row.user_id]) continue;
      const placement = placementByStudent.get(row.user_id);
      if (!placement) continue;
      if (row.host_shop_id && row.host_shop_id !== placement.shopId) continue;
      if (placement.programSlug && row.program_slug && row.program_slug !== placement.programSlug) continue;

      if (isPending(row)) pendingHoursCount += 1;
      if (!isApproved(row)) continue;

      const accepted =
        numericHours(row.accepted_hours) || numericHours(row.hours) || numericHours(row.hours_claimed);
      ojtProgress[row.user_id].completed += accepted;
    }
  }

  const programType = resolveHostShopProgram(partner);
  const tradeInfo = TRADE_TARGETS[programType] || TRADE_TARGETS.barber;
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  const { data: programAccess } = await db
    .from('partner_program_access')
    .select('program_id')
    .eq('partner_id', partner.id)
    .is('revoked_at', null);

  const programIds = Array.from(new Set([
    programType,
    ...(programAccess || [])
      .map((row: { program_id?: string }) => row.program_id)
      .filter((value): value is string => Boolean(value)),
  ]));

  const { data: dbRequirements } = await db
    .from('partner_document_requirements')
    .select('*')
    .in('program_id', [...programIds, 'ALL'])
    .in('state', [partner.state || 'Indiana', 'ALL']);

  const requirements = mergeHostShopDocumentRequirements(dbRequirements, programType);
  const { data: uploadedDocs, error: uploadedDocsError } = await db
    .from('partner_documents')
    .select('id, document_type, display_name, file_name, file_url, status, rejection_reason, expiration_date, uploaded_at')
    .eq('partner_id', partner.id)
    .order('uploaded_at', { ascending: false });

  if (uploadedDocsError) throw new Error(`HOST_SHOP_DOCUMENTS_QUERY_FAILED:${uploadedDocsError.message}`);

  const latestDocs = new Map<string, any>();
  for (const doc of uploadedDocs || []) {
    if (!latestDocs.has(doc.document_type)) latestDocs.set(doc.document_type, doc);
  }

  const documentStatuses = requirements.map((requirement: any) => {
    const document = latestDocs.get(requirement.document_type);
    return {
      ...requirement,
      uploaded: Boolean(document),
      document: document || null,
      status: document?.status || 'missing',
    };
  });
  const missingDocuments = documentStatuses.filter(
    (document: any) =>
      document.is_required &&
      (!document.uploaded || ['missing', 'rejected', 'expired'].includes(document.status)),
  );
  const pendingDocuments = documentStatuses.filter(
    (document: any) => document.is_required && document.status === 'pending',
  );
  const acceptedDocumentCount = documentStatuses.filter(
    (document: any) => document.is_required && document.status === 'accepted',
  ).length;
  const requiredDocumentCount = documentStatuses.filter((document: any) => document.is_required).length;

  return {
    partner,
    shops,
    tradeKey: programType,
    tradeInfo,
    programType,
    onboardingPaths,
    documentStatuses,
    missingDocuments,
    pendingDocuments,
    acceptedDocumentCount,
    requiredDocumentCount,
    apprentices: apprentices.map((apprentice) => ({
      ...apprentice,
      ojt: ojtProgress[apprentice.student_id] || { completed: 0, required: tradeInfo.hours },
    })),
    pendingHoursCount,
  };
}
