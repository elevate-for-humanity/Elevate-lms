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

export async function getHostShopBoard(userId: string) {
  const db = await requireAdminClient();

  // Tenant boundary: an active partner_users link is mandatory. Never fall
  // back to profile.role when loading host-shop data with the service client.
  const { data: partnerLink, error: partnerLinkError } = await db
    .from('partner_users')
    .select('partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, name, city, state)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (partnerLinkError || !partnerLink?.partner_id || !partnerLink.partners) {
    throw new Error('HOST_SHOP_ACCESS_DENIED');
  }

  const partner = partnerLink.partners as unknown as PartnerRecord;

  // Only shop assignments belonging to this authenticated user are eligible.
  const { data: shopLinks } = await db
    .from('shop_staff')
    .select('shop_id, shops(id, name, city, state, active)')
    .eq('user_id', userId);

  const shops = (shopLinks || [])
    .map((row: any) => row.shops)
    .filter((shop: any) => Boolean(shop?.id) && shop.active !== false);
  const shopIds = shops.map((shop: any) => shop.id);

  const { data: placements } = shopIds.length
    ? await db
        .from('apprentice_placements')
        .select('id, student_id, shop_id, discipline, status, start_date, profiles(full_name, email)')
        .in('shop_id', shopIds)
        .eq('status', 'active')
    : { data: [] };

  const apprentices = (placements || []).map((placement: any) => ({
    id: placement.id,
    student_id: placement.student_id,
    name: placement.profiles?.full_name || 'Unknown',
    email: placement.profiles?.email || '',
    discipline: placement.discipline,
    start_date: placement.start_date,
  }));
  const studentIds = apprentices.map((apprentice) => apprentice.student_id).filter(Boolean);

  const ojtProgress: Record<string, { completed: number; required: number }> = {};
  if (studentIds.length) {
    const { data: ojt } = await db
      .from('ojt_placements')
      .select('student_id, total_hours_completed, total_hours_required')
      .in('student_id', studentIds)
      .eq('status', 'active');
    for (const row of ojt || []) {
      ojtProgress[row.student_id] = {
        completed: Number(row.total_hours_completed || 0),
        required: Number(row.total_hours_required || 2000),
      };
    }
  }

  // Critical tenant fix: count only hour entries belonging to apprentices
  // assigned to this host shop. Never expose a platform-wide pending count.
  let pendingHoursCount = 0;
  if (studentIds.length) {
    const { count } = await db
      .from('hour_entries')
      .select('id', { count: 'exact', head: true })
      .in('user_id', studentIds)
      .eq('status', 'pending');
    pendingHoursCount = count || 0;
  }

  const programType = resolveHostShopProgram(partner ?? { partner_type: apprentices[0]?.discipline });
  const tradeInfo = TRADE_TARGETS[programType] || TRADE_TARGETS.barber;
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  const { data: programAccess } = await db
    .from('partner_program_access')
    .select('program_id')
    .eq('partner_id', partner.id)
    .is('revoked_at', null);

  const programIds = Array.from(new Set([
    programType,
    ...(programAccess || []).map((row: { program_id?: string }) => row.program_id).filter((value): value is string => Boolean(value)),
  ]));

  const { data: dbRequirements } = await db
    .from('partner_document_requirements')
    .select('*')
    .in('program_id', [...programIds, 'ALL'])
    .in('state', [partner.state || 'Indiana', 'ALL']);

  const requirements = mergeHostShopDocumentRequirements(dbRequirements, programType);
  const { data: uploadedDocs } = await db
    .from('partner_documents')
    .select('id, document_type, file_name, status, rejection_reason, expires_at')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false });

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
    (document: any) => document.is_required && (!document.uploaded || ['missing', 'rejected', 'expired'].includes(document.status)),
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
