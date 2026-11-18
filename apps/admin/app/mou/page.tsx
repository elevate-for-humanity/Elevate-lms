import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import MouAdminClient from './MouAdminClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MOU Management | Admin | Elevate For Humanity',
};

export default async function MOUPage({
  searchParams,
}: {
  searchParams: Promise<{ holder?: string }>;
}) {
  await requireRole(['admin']);
  const supabase = await requireAdminClient();
  const holder = (await searchParams).holder;
  const holderId =
    holder && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(holder) ? holder : undefined;
  const signatureQuery = supabase
    .from('mou_signatures')
    .select(
      'id, signer_name, signer_title, signed_at, countersigned_at, organization_name, program_holder_id, mou_version, compensation_model, compensation_rate',
      { count: 'exact' },
    )
    .not('signed_at', 'is', null);

  const [
    { data: partnerMous, count: mouCount, error: mouError },
    { data: templates, error: templateError },
    { data: signatures, count: sigCount, error: signatureError },
    { data: partners, error: partnersError },
  ] = await Promise.all([
    supabase
      .from('partner_mous')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('mou_templates')
      .select('id, name, title, content, version, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    (holderId ? signatureQuery.eq('program_holder_id', holderId) : signatureQuery)
      .order('signed_at', { ascending: false })
      .limit(50),
    supabase.from('partners').select('id,name').order('name'),
  ]);

  const holderIds = [
    ...new Set((signatures ?? []).map((signature) => signature.program_holder_id).filter(Boolean)),
  ];
  const holderCountersigns = holderIds.length
    ? await supabase
        .from('program_holders')
        .select('id,mou_status,mou_signed_at,mou_admin_signed_at')
        .in('id', holderIds)
    : { data: [], error: null };
  const holderCountersignById = new Map(
    (holderCountersigns.data ?? []).map((row) => [
      row.id,
      row.mou_admin_signed_at ||
        (['countersigned', 'fully_executed'].includes(row.mou_status)
          ? row.mou_signed_at
          : null),
    ]),
  );
  const reconciledSignatures = (signatures ?? []).map((signature) => ({
    ...signature,
    countersigned_at:
      signature.countersigned_at ||
      holderCountersignById.get(signature.program_holder_id) ||
      null,
  }));
  const names = new Map((partners ?? []).map((partner) => [partner.id, partner.name]));
  return (
    <MouAdminClient
      filteredHolder={Boolean(holderId)}
      unavailable={Boolean(
        mouError ||
          templateError ||
          signatureError ||
          partnersError ||
          holderCountersigns.error
      )}
      partners={partners ?? []}
      partnerMous={(partnerMous ?? []).map((mou) => ({
        ...mou,
        partners: names.has(mou.partner_id) ? { name: names.get(mou.partner_id) } : null,
      }))}
      mouCount={mouError ? null : (mouCount ?? 0)}
      templates={templates ?? []}
      signatures={reconciledSignatures}
      sigCount={signatureError ? null : (sigCount ?? 0)}
    />
  );
}
