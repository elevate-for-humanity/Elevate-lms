import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import EstheticianPartnerPageClient from './PartnerPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Esthetician Apprenticeship — Host a Spa or Salon Partner',
  description: 'Host an esthetician apprentice at your spa or salon. DOL Registered Apprenticeship. Elevate handles theory training, DOL compliance, and IPLA licensing coordination.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/esthetician-apprenticeship' },
};

export default async function EstheticianPartnerPage() {
  let isApproved = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data } = await supabase
        .from('partner_applications')
        .select('status')
        .eq('contact_email', user.email)
        .eq('status', 'approved')
        .maybeSingle();
      isApproved = !!data;
    }
  } catch {
    // unauthenticated — show public page
  }
  return <EstheticianPartnerPageClient isApproved={isApproved} />;
}
