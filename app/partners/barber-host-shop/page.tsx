import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import PartnerPageClient from './PartnerPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Barbershop Partner Program | Indiana Barber Apprenticeship',
  description:
    'Become a worksite partner for the Indiana Barber Apprenticeship program. Host apprentices, develop talent, and grow your team with structured training support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/barber-host-shop',
  },
  openGraph: {
    title: 'Barbershop Partner Program | Indiana Barber Apprenticeship',
    description:
      'Host apprentices and develop talent for your barbershop with structured training support.',
    url: 'https://www.elevateforhumanity.org/partners/barber-host-shop',
  },
};

export default async function BarbershopPartnerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isApproved = false;
  if (user?.email) {
    // Check both application tables — new flow uses barbershop_partner_applications,
    // legacy flow uses partner_applications
    const [{ data: bpa }, { data: pa }] = await Promise.all([
      supabase
        .from('barbershop_partner_applications')
        .select('status')
        .eq('contact_email', user.email)
        .eq('status', 'approved')
        .maybeSingle(),
      supabase
        .from('partner_applications')
        .select('status')
        .eq('contact_email', user.email)
        .eq('status', 'approved')
        .maybeSingle(),
    ]);
    isApproved = !!(bpa || pa);
  }

  return <PartnerPageClient isApproved={isApproved} />;
}
