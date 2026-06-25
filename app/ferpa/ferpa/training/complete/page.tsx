import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import FERPATrainingForm from '@/components/compliance/FERPATrainingForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Complete FERPA Training | Elevate For Humanity',
  description: 'Complete your required FERPA training and certification',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ferpa/training/complete',
  },
};

export default async function CompleteFERPATrainingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/ferpa/training/complete');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/unauthorized');

  const existingTraining = null;

  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/ferpa-page-12.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
      <FERPATrainingForm
        user={profile}
        existingTraining={existingTraining}
      />
    </>
  );
}
