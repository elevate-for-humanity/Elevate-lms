import { requireAdminClient } from '@/lib/supabase/admin';
import {
  getHostShopOnboardingPaths,
  mergeHostShopDocumentRequirements,
  resolveHostShopProgram,
} from '@/lib/partners/host-shop-onboarding';

export const TRADE_TARGETS: Record<string, { hours: number; label: string }> = {
  'barber': { hours: 2000, label: 'Barber Apprenticeship' },
  'barber-apprenticeship': { hours: 2000, label: 'Barber Apprenticeship' },
  'cosmetology': { hours: 1500, label: 'Cosmetology Apprenticeship' },
  'nail-tech': { hours: 450, label: 'Nail Technician Apprenticeship' },
  'nail_tech': { hours: 450, label: 'Nail Technician Apprenticeship' },
  'nail_technician': { hours: 450, label: 'Nail Technician Apprenticeship' },
  'esthetician': { hours: 700, label: 'Esthetician Apprenticeship' },
  'training_site': { hours: 2000, label: 'Apprenticeship' },
};

export async function getHostShopBoard(userId: string) {
  const db = await requireAdminClient();

  // 1. Resolve partner record
  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partner_id, partners(id, partner_type, program_type, programs, approval_status, status, mou_signed, onboarding_completed, documents_verified, name, city, state)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  const partner = partnerLink?.partners as any;

  // 2. Resolve shop IDs
  const { data: shopLinks } = await db
    .from('shop_staff')
    .select('shop_id, shops(id, name, city, state, active)')
    .eq('user_id', userId);

  const shops = (shopLinks || []).map((s: any) => s.shops).filter(Boolean);
  const shopIds = shops.map((s: any) => s.id);

  // 3. Active apprentices via apprentice_placements
  const { data: placements } = shopIds.length
    ? await db
        .from('apprentice_placements')
        .select('id, student_id, shop_id, discipline, status, start_date, profiles(full_name, email)')
        .in('shop_id', shopIds)
        .eq('status', 'active')
    : { data: [] };

  const apprentices = (placements || []).map((p: any) => ({
    id: p.id,
    student_id: p.student_id,
    name: p.profiles?.full_name || 'Unknown',
    email: p.profiles?.email || '',
    discipline: p.discipline,
    start_date: p.start_date,
  }));

  const studentIds = apprentices.map((a) => a.student_id);

  // 4. OJT hours per student
  const ojtProgress: Record<string, { completed: number; required: number }> = {};
  if (studentIds.length) {
    const { data: ojt } = await db
      .from('ojt_placements')
      .select('student_id, total_hours_completed, total_hours_required')
      .in('student_id', studentIds)
      .eq('status', 'active');
    for (const o of ojt || []) {
      ojtProgress[o.student_id] = {
        completed: o.total_hours_completed || 0,
        required: o.total_hours_required || 2000,
      };
    }
  }

  // 5. Pending hours to verify
  const { count: pendingHoursCount } = await db
    .from('hour_entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // 6. Determine trade from the canonical host-shop program fields.
  const programType = resolveHostShopProgram(partner ?? { partner_type: apprentices[0]?.discipline });
  const tradeKey = programType;
  const tradeInfo = TRADE_TARGETS[tradeKey] || TRADE_TARGETS['barber'];
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  // 7. Document and onboarding alerts for the partner dashboard.
  const { data: programAccess } = partner?.id
    ? await db
        .from('partner_program_access')
        .select('program_id')
        .eq('partner_id', partner.id)
        .is('revoked_at', null)
    : { data: [] };
  const programIds = Array.from(
    new Set([
      programType,
      ...(programAccess || []).map((row: { program_id?: string }) => row.program_id).filter(Boolean),
    ]),
  );

  const { data: dbRequirements } = await db
    .from('partner_document_requirements')
    .select('*')
    .in('program_id', [...programIds, 'ALL'])
    .in('state', [partner?.state || 'Indiana', 'ALL']);

  const requirements = mergeHostShopDocumentRequirements(dbRequirements, programType);
  const { data: uploadedDocs } = partner?.id
    ? await db
        .from('partner_documents')
        .select('id, document_type, file_name, status, rejection_reason, expires_at')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  const latestDocs = new Map<string, any>();
  for (const doc of uploadedDocs || []) {
    if (!latestDocs.has(doc.document_type)) latestDocs.set(doc.document_type, doc);
  }

  const documentStatuses = requirements.map((req: any) => {
    const doc = latestDocs.get(req.document_type);
    return {
      ...req,
      uploaded: !!doc,
      document: doc || null,
      status: doc?.status || 'missing',
    };
  });
  const missingDocuments = documentStatuses.filter(
    (doc: any) => doc.is_required && (!doc.uploaded || ['missing', 'rejected', 'expired'].includes(doc.status)),
  );
  const pendingDocuments = documentStatuses.filter((doc: any) => doc.is_required && doc.status === 'pending');
  const acceptedDocumentCount = documentStatuses.filter((doc: any) => doc.is_required && doc.status === 'accepted').length;
  const requiredDocumentCount = documentStatuses.filter((doc: any) => doc.is_required).length;

  return {
    partner,
    shops,
    tradeKey,
    tradeInfo,
    programType,
    onboardingPaths,
    documentStatuses,
    missingDocuments,
    pendingDocuments,
    acceptedDocumentCount,
    requiredDocumentCount,
    apprentices: apprentices.map((a) => ({
      ...a,
      ojt: ojtProgress[a.student_id] || { completed: 0, required: tradeInfo.hours },
    })),
    pendingHoursCount: pendingHoursCount || 0,
  };
}
