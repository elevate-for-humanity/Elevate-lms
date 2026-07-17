import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import MouAdminClient from './MouAdminClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'MOU Management | Admin | Elevate For Humanity',
};

export default async function MOUPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const [
    { data: partnerMous, count: mouCount },
    { data: templates },
    { data: signatures, count: sigCount },
  ] = await Promise.all([
    supabase
      .from('partner_mous')
      .select('*, partners:partner_id(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('mou_templates')
      .select('id, name, title, content, version, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('mou_signatures')
      .select('id, signer_name, signer_title, signed_at, mou_version, compensation_model, compensation_rate', { count: 'exact' })
      .order('signed_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <MouAdminClient
      partnerMous={partnerMous ?? []}
      mouCount={mouCount ?? 0}
      templates={templates ?? []}
      signatures={signatures ?? []}
      sigCount={sigCount ?? 0}
    />
  );
}
