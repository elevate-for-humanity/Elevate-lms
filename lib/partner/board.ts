import { requireAdminClient } from '@/lib/supabase/admin';
import {
  getHostShopOnboardingPaths,
  mergeHostShopDocumentRequirements,
  resolveHostShopProgram,
} from '@/lib/partners/host-shop-onboarding';

export const TRADE_TARGETS: Record<string, { hours: number; label: string }> = {
  barber: { hours: 2000, label: 'Barber Apprenticeship' },
  'barber-apprenticeship': { hours: 2000, label: 'Barber Apprenticeship' },
  cosmetology: { hours: 1500, label: 'Hairstylist Apprenticeship' },
  'cosmetology-apprenticeship': { hours: 1500, label: 'Hairstylist Apprenticeship' },
  hairstylist: { hours: 1500, label: 'Hairstylist Apprenticeship' },
  'nail-tech': { hours: 450, label: 'Nail Technician Apprenticeship' },
  nail_tech: { hours: 450, label: 'Nail Technician Apprenticeship' },
  nail_technician: { hours: 450, label: 'Nail Technician Apprenticeship' },
  esthetician: { hours: 700, label: 'Esthetician Apprenticeship' },
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

type HourEntryRow = {
  user_id: string | null;
  host_shop_id: string | null;
  status: string | null;
  approval_status: string | null;
  accepted_hours: number | string | null;
  hours: number | string | null;
  hours_claimed: number | string | null;
};

function numericHours(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function approvedHours(row: HourEntryRow): number {
  if (row.approval_status !== 'approved' && row.status !== 'approved') return 0;
  return (
    numericHours(row.accepted_hours) ||
    numericHours(row.hours) ||
    numericHours(row.hours_claimed)
  );
}

function isPendingHour(row: HourEntryRow): boolean {
  return row.approval_status === 'pending' || row.status === 'pending';
}

function isEntryForAssignedShop(row: HourEntryRow, shopIds: string[]): boolean {
  return !row.host_shop_id || shopIds.includes(row.host_shop_id);
}

async function loadBoardForPartner(
  partner: PartnerRecord,
  options: { userId?: string } = {},
) {
  const db = await requireAdminClient();

  const shopQueries: PromiseLike<any>[] = [
    db
      .from('shops')
      .select('id, name, city, state, active, partner_id')
      .eq('partner_id', partner.id)
      .neq('active', false),
  ];

  if (options.userId) {
    shopQueries.push(
      db
        .from('shop_staff')
        .select('shop_id, shops(id, name, city, state, active, partner_id)')
        .eq('user_id', options.userId)
        .neq('active', false),
    );
  }

  const shopResults = await Promise.all(shopQueries);
  const partnerShopResult = shopResults[0];
  if (partnerShopResult.error) {
    throw new Error(`HOST_SHOP_SHOPS_LOAD_FAILED:${partnerShopResult.error.message}`);
  }

  const shopMap = new Map<string, any>();
  for (const shop of partnerShopResult.data || []) {
    if (shop?.id && shop.active !== false) shopMap.set(shop.id, shop);
  }

  if (options.userId && shopResults[1]?.data) {
    for (const row of shopResults[1].data) {
      const shop = row?.shops;
      if (shop?.id && shop.active !== false) shopMap.set(shop.id, shop);
    }
  }

  const shops = Array.from(shopMap.values());
  const shopIds = shops.map((shop) => shop.id as string);

  const { data: placements, error: placementError } = shopIds.length
    ? await db
        .from('apprentice_placements')
        .select(
          'id, student_id, shop_id, discipline, program_slug, status, start_date, profiles(full_name, email)',
        )
        .in('shop_id', shopIds)
        .eq('status', 'active')
    : { data: [], error: null };

  if (placementError) {
    throw new Error(`HOST_SHOP_PLACEMENTS_LOAD_FAILED:${placementError.message}`);
  }

  const apprentices = (placements || []).map((placement: any) => ({
    id: placement.id,
    student_id: placement.student_id,
    name: placement.profiles?.full_name || 'Unknown',
    email: placement.profiles?.email || '',
    discipline: placement.discipline || placement.program_slug,
    program_slug: placement.program_slug,
    start_date: placement.start_date,
  }));
  const studentIds = apprentices.map((apprentice) => apprentice.student_id).filter(Boolean);

  const ojtCompletedByUser: Record<string, number> = {};
  let pendingHoursCount = 0;

  if (studentIds.length) {
    const { data: hourRows, error: hourError } = await db
      .from('hour_entries')
      .select(
        'user_id, host_shop_id, status, approval_status, accepted_hours, hours, hours_claimed',
      )
      .in('user_id', studentIds);

    if (hourError) throw new Error(`HOST_SHOP_HOURS_LOAD_FAILED:${hourError.message}`);

    for (const row of (hourRows || []) as HourEntryRow[]) {
      if (!row.user_id || !isEntryForAssignedShop(row, shopIds)) continue;
      if (isPendingHour(row)) pendingHoursCount += 1;
      const accepted = approvedHours(row);
      if (accepted > 0) {
        ojtCompletedByUser[row.user_id] = (ojtCompletedByUser[row.user_id] || 0) + accepted;
      }
    }
  }

  const programType = resolveHostShopProgram(
    partner ?? { partner_type: apprentices[0]?.discipline },
  );
  const tradeInfo = TRADE_TARGETS[programType] || TRADE_TARGETS.barber;
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  const { data: programAccess } = await db
    .from('partner_program_access')
    .select('program_id')
    .eq('partner_id', partner.id)
    .is('revoked_at', null);

  const programIds = Array.from(
    new Set([
      programType,
      ...(programAccess || [])
        .map((row: { program_id?: string }) => row.program_id)
        .filter((value): value is string => Boolean(value)),
    ]),
  );

  const { data: dbRequirements } = await db
    .from('partner_document_requirements')
    .select('*')
    .in('program_id', [...programIds, 'ALL'])
    .in('state', [partner.state || 'Indiana', 'ALL']);

  const requirements = mergeHostShopDocumentRequirements(dbRequirements, programType);
  const { data: uploadedDocs, error: documentLoadError } = await db
    .from('partner_documents')
    .select(
      'id, document_type, display_name, file_name, status, rejection_reason, expires_at:expiration_date, uploaded_at',
    )
    .eq('partner_id', partner.id)
    .order('uploaded_at', { ascending: false });

  if (documentLoadError) {
    throw new Error(`HOST_SHOP_DOCUMENTS_LOAD_FAILED:${documentLoadError.message}`);
  }

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
  const requiredDocumentCount = documentStatuses.filter(
    (document: any) => document.is_required,
  ).length;

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
    apprentices: apprentices.map((apprentice) => {
      const apprenticeTrade =
        TRADE_TARGETS[apprentice.discipline] ||
        TRADE_TARGETS[apprentice.program_slug] ||
        tradeInfo;
      return {
        ...apprentice,
        ojt: {
          completed:
            Math.round((ojtCompletedByUser[apprentice.student_id] || 0) * 100) / 100,
          required: apprenticeTrade.hours,
        },
      };
    }),
    pendingHoursCount,
  };
}

export async function getHostShopBoard(userId: string) {
  const db = await requireAdminClient();
  const { data: partnerLink, error: partnerLinkError } = await db
    .from('partner_users')
    .select(
      'partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, name, city, state)',
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (partnerLinkError || !partnerLink?.partner_id || !partnerLink.partners) {
    throw new Error('HOST_SHOP_ACCESS_DENIED');
  }

  return loadBoardForPartner(partnerLink.partners as unknown as PartnerRecord, { userId });
}

export async function getHostShopBoardForPartner(partnerId: string) {
  const db = await requireAdminClient();
  const { data: partner, error } = await db
    .from('partners')
    .select(
      'id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, name, city, state',
    )
    .eq('id', partnerId)
    .maybeSingle();

  if (error || !partner) throw new Error('HOST_SHOP_PARTNER_NOT_FOUND');
  return loadBoardForPartner(partner as PartnerRecord);
}
